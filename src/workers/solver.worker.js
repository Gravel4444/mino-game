'use strict';

// ── 미노 셰이프 (색상 불필요, worker 전용) ───────────────────────────────────
const PIECES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
];

function rotateShape(s) {
  const R = s.length, C = s[0].length;
  return Array.from({ length: C }, (_, c) => Array.from({ length: R }, (_, r) => s[R-1-r][c]));
}

// 모든 피스의 고유 방향 사전 계산
const ALL_ORI = [];
for (let pi = 0; pi < PIECES.length; pi++) {
  const seen = new Set();
  let cur = PIECES[pi].map(r => [...r]);
  for (let rot = 0; rot < 4; rot++) {
    const key = JSON.stringify(cur);
    if (!seen.has(key)) { seen.add(key); ALL_ORI.push({ pi, rot, shape: cur.map(r => [...r]) }); }
    cur = rotateShape(cur);
  }
}

function canPlace(shape, r, c, board, ROWS, COLS, disabledSet) {
  for (let dr = 0; dr < shape.length; dr++)
    for (let dc = 0; dc < shape[dr].length; dc++) {
      if (!shape[dr][dc]) continue;
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) return false;
      if (disabledSet && disabledSet.has(nr+','+nc)) return false;
    }
  return true;
}

function getAllMoves(board, ROWS, COLS, disabledSet) {
  const moves = [];
  for (const { pi, rot, shape } of ALL_ORI)
    for (let r = 0; r <= ROWS - shape.length; r++)
      for (let c = 0; c <= COLS - shape[0].length; c++)
        if (canPlace(shape, r, c, board, ROWS, COLS, disabledSet))
          moves.push({ pi, rot, shape, r, c, _score: 0 });
  return moves;
}

function applyMove(board, shape, r, c) {
  const nb = board.map(row => [...row]);
  for (let dr = 0; dr < shape.length; dr++)
    for (let dc = 0; dc < shape[dr].length; dc++)
      if (shape[dr][dc]) nb[r+dr][c+dc] = 1;
  return nb;
}

// ── Zobrist 해싱 ──────────────────────────────────────────────────────────────
const ZOB = Array.from({ length: 100 }, () => (Math.random() * 2**32) >>> 0);
function boardHash(board, COLS) {
  let h = 0;
  const ROWS = board.length;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) h ^= ZOB[r*COLS+c];
  return h;
}

// ── 전치 테이블 ────────────────────────────────────────────────────────────────
const TT_SIZE = 1 << 20;
const TT = new Array(TT_SIZE);

// ── Leaf 노드 경량 휴리스틱 ───────────────────────────────────────────────────
function countPlayableEmpty(board, ROWS, COLS, disabledSet) {
  const visited = new Uint8Array(ROWS * COLS);
  let count = 0;
  for (let sr = 0; sr < ROWS; sr++) for (let sc = 0; sc < COLS; sc++) {
    const idx = sr*COLS+sc;
    if (board[sr][sc] || visited[idx] || (disabledSet && disabledSet.has(sr+','+sc))) continue;
    const comp = [], q = [idx]; visited[idx] = 1;
    while (q.length) {
      const pos = q.pop(), r = pos/COLS|0, c = pos%COLS;
      comp.push(pos);
      if (r > 0      && !board[r-1][c] && !visited[(r-1)*COLS+c] && !(disabledSet&&disabledSet.has((r-1)+','+c))) { visited[(r-1)*COLS+c]=1; q.push((r-1)*COLS+c); }
      if (r < ROWS-1 && !board[r+1][c] && !visited[(r+1)*COLS+c] && !(disabledSet&&disabledSet.has((r+1)+','+c))) { visited[(r+1)*COLS+c]=1; q.push((r+1)*COLS+c); }
      if (c > 0      && !board[r][c-1] && !visited[r*COLS+c-1]   && !(disabledSet&&disabledSet.has(r+','+(c-1)))) { visited[r*COLS+c-1]=1;   q.push(r*COLS+c-1);   }
      if (c < COLS-1 && !board[r][c+1] && !visited[r*COLS+c+1]   && !(disabledSet&&disabledSet.has(r+','+(c+1)))) { visited[r*COLS+c+1]=1;   q.push(r*COLS+c+1);   }
    }
    if (comp.length >= 4) count += comp.length;
  }
  return count;
}

// ── 전역 탐색 변수 ────────────────────────────────────────────────────────────
const INF = 1e9;
let deadline = 0, nodeCount = 0, cutoffCount = 0, t0 = 0, lastTickTime = 0, topLevelMove = null;

// ── Negamax + Alpha-Beta Pruning ──────────────────────────────────────────────
function negamax(board, ROWS, COLS, depth, alpha, beta, hash, disabledSet) {
  nodeCount++;
  if ((nodeCount & 511) === 0) {
    const now = Date.now();
    if (now >= deadline) return 0;
    if (now - lastTickTime >= 100) {
      lastTickTime = now;
      self.postMessage({ type: 'tick', nodes: nodeCount, cutoffs: cutoffCount, ms: now-t0, currentMove: topLevelMove });
    }
  }
  if (depth === 0) return countPlayableEmpty(board, ROWS, COLS, disabledSet);

  const ttIdx = hash & (TT_SIZE - 1);
  const ttE = TT[ttIdx];
  const tt = (ttE && ttE.key === hash) ? ttE : null;
  if (tt && tt.depth >= depth) {
    if (tt.flag === 0)                   return tt.value;
    if (tt.flag === 1 && tt.value >= beta)  return tt.value;
    if (tt.flag === 2 && tt.value <= alpha) return tt.value;
  }

  const moves = getAllMoves(board, ROWS, COLS, disabledSet);
  if (moves.length === 0) return -INF;

  const origAlpha = alpha;
  let best = -INF, bestM = null;

  if (depth >= 2) moves.sort((a, b) => b._score - a._score);
  if (tt) {
    const hi = moves.findIndex(m => m.pi===tt.bmPi && m.rot===tt.bmRot && m.r===tt.bmR && m.c===tt.bmC);
    if (hi > 0) { const tmp = moves[0]; moves[0] = moves[hi]; moves[hi] = tmp; }
  }

  for (const m of moves) {
    if (Date.now() >= deadline) break;
    let nh = hash;
    for (let dr = 0; dr < m.shape.length; dr++)
      for (let dc = 0; dc < m.shape[dr].length; dc++)
        if (m.shape[dr][dc]) nh ^= ZOB[(m.r+dr)*COLS+(m.c+dc)];
    const nb = applyMove(board, m.shape, m.r, m.c);
    const v  = -negamax(nb, ROWS, COLS, depth-1, -beta, -alpha, nh, disabledSet);
    m._score = v;
    if (v > best) { best = v; bestM = m; }
    if (best > alpha) alpha = best;
    if (alpha >= beta) { cutoffCount++; break; }
  }

  const flag = best <= origAlpha ? 2 : best >= beta ? 1 : 0;
  TT[ttIdx] = { key: hash, value: best, depth, flag,
    bmPi: bestM?.pi, bmRot: bestM?.rot, bmR: bestM?.r, bmC: bestM?.c };
  return best;
}

// ── Iterative Deepening ───────────────────────────────────────────────────────
function findBestMove(board, ROWS, COLS, timeLimitMs, disabledArr) {
  t0 = Date.now(); deadline = t0 + timeLimitMs;
  nodeCount = 0; cutoffCount = 0; lastTickTime = t0; topLevelMove = null;
  const disabledSet = disabledArr && disabledArr.length
    ? new Set(disabledArr.map(([r, c]) => r+','+c))
    : null;

  const b = board.map(row => row.map(v => v > 0 ? 1 : 0));
  const rootHash = boardHash(b, COLS);
  const moves = getAllMoves(b, ROWS, COLS, disabledSet);

  if (!moves.length) { self.postMessage({ type: 'done', result: null }); return; }

  for (const m of moves) {
    const nb = applyMove(b, m.shape, m.r, m.c);
    if (!getAllMoves(nb, ROWS, COLS, disabledSet).length) {
      self.postMessage({
        type: 'done', pi: m.pi, rot: m.rot, r: m.r, c: m.c,
        score: INF, depth: 1, nodes: 1, cutoffs: 0, ms: Date.now()-t0,
        result: 'WIN', topMoves: [{ pi: m.pi, rot: m.rot, r: m.r, c: m.c, score: INF }],
      });
      return;
    }
  }

  let bestMove = moves[0], bestScore = -INF, reachedDepth = 0, finalResult = 'UNKNOWN';
  let bestTopMoves = [], wasInterrupted = false;

  for (let depth = 1; depth <= 30; depth++) {
    if (Date.now() >= deadline) { wasInterrupted = true; break; }
    nodeCount = 0; cutoffCount = 0;
    let dBest = -INF, dBestMove = moves[0], interrupted = false;
    const dScores = [];

    for (let mi = 0; mi < moves.length; mi++) {
      const m = moves[mi];
      if (Date.now() >= deadline) { interrupted = true; break; }
      topLevelMove = m;
      const nb = applyMove(b, m.shape, m.r, m.c);
      let mh = rootHash;
      for (let dr = 0; dr < m.shape.length; dr++)
        for (let dc = 0; dc < m.shape[dr].length; dc++)
          if (m.shape[dr][dc]) mh ^= ZOB[(m.r+dr)*COLS+(m.c+dc)];
      const v = -negamax(nb, ROWS, COLS, depth-1, -INF, INF, mh, disabledSet);
      m._score = v;
      dScores.push({ pi: m.pi, rot: m.rot, r: m.r, c: m.c, score: v });
      if (v > dBest) { dBest = v; dBestMove = m; }
    }

    if (interrupted) { wasInterrupted = true; break; }

    bestScore = dBest; bestMove = dBestMove; reachedDepth = depth; wasInterrupted = false;
    dScores.sort((a, b) => b.score - a.score);
    bestTopMoves = dScores.slice(0, 5);
    const result = bestScore >= INF/2 ? 'WIN' : bestScore <= -INF/2 ? 'LOSE' : 'UNKNOWN';
    finalResult = result;
    self.postMessage({ type: 'progress', depth, nodes: nodeCount, cutoffs: cutoffCount, ms: Date.now()-t0, topMoves: bestTopMoves, result });
    if (result === 'WIN' || result === 'LOSE') break;
    moves.sort((a, b) => b._score - a._score);
  }

  topLevelMove = null;
  let isRandom = false;
  if (wasInterrupted && bestTopMoves.length > 0) {
    const topScore = bestTopMoves[0].score;
    const tied = bestTopMoves.filter(m => m.score === topScore);
    const chosen = tied[Math.floor(Math.random() * tied.length)];
    bestMove = { pi: chosen.pi, rot: chosen.rot, r: chosen.r, c: chosen.c, _score: chosen.score };
    bestScore = chosen.score; isRandom = true;
  }

  self.postMessage({
    type: 'done',
    pi: bestMove.pi, rot: bestMove.rot, r: bestMove.r, c: bestMove.c,
    score: bestScore, depth: reachedDepth, nodes: nodeCount, cutoffs: cutoffCount, ms: Date.now()-t0,
    result: finalResult, topMoves: bestTopMoves, isRandom,
  });
}

self.onmessage = function (e) {
  const { board, SIZE, ROWS, COLS, timeLimitMs, disabled } = e.data;
  const R = ROWS || SIZE || board.length;
  const C = COLS || SIZE || (board[0] && board[0].length) || R;
  findBestMove(board, R, C, timeLimitMs || 4000, disabled || []);
};
