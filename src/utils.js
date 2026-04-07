import { PIECES, COLOR_OPTIONS } from './constants.js';

export function colorToEmoji(v) {
  if (v === 'monotone') return '⬛';
  return (COLOR_OPTIONS.find(o => o.value === v) || COLOR_OPTIONS[4]).label;
}

export function getLuminance(hex) {
  if (!hex || hex.length < 7) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = x => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function getEffectiveColor(color, darkMode) {
  if (color === 'monotone') return darkMode ? '#ffffff' : '#1a1a1a';
  const lum = getLuminance(color);
  if (darkMode && lum < 0.04) return '#ffffff';
  if (!darkMode && lum > 0.88) return '#24292f';
  return color;
}

export function rotateShape(s) {
  const R = s.length, C = s[0].length;
  return Array.from({ length: C }, (_, c) =>
    Array.from({ length: R }, (_, r) => s[R - 1 - r][c])
  );
}

export function getShape(pi, rot) {
  let s = PIECES[pi].shape.map(r => [...r]);
  for (let i = 0; i < rot; i++) s = rotateShape(s);
  return s;
}

export function getUniqueOrientations(pi) {
  const seen = new Set(), res = [];
  let cur = PIECES[pi].shape.map(r => [...r]);
  for (let rot = 0; rot < 4; rot++) {
    const k = JSON.stringify(cur);
    if (!seen.has(k)) { seen.add(k); res.push(cur.map(r => [...r])); }
    cur = rotateShape(cur);
  }
  return res;
}

export function canPlace(shape, r, c, board, ROWS, COLS, disabledSet) {
  for (let dr = 0; dr < shape.length; dr++)
    for (let dc = 0; dc < shape[dr].length; dc++) {
      if (!shape[dr][dc]) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) return false;
      if (disabledSet && disabledSet.has(nr + ',' + nc)) return false;
    }
  return true;
}

export function hasAnyValidMove(board, ROWS, COLS, disabledSet) {
  for (let pi = 0; pi < PIECES.length; pi++)
    for (const shape of getUniqueOrientations(pi))
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (canPlace(shape, r, c, board, ROWS, COLS, disabledSet)) return true;
  return false;
}

export function calcCell(rows, cols) {
  return Math.min(68, Math.floor(420 / Math.max(rows, cols)));
}

export function legacyCopy(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text,
    style: 'position:fixed;opacity:0',
  });
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  cb();
}

export function makeDisabledSet(disabledCells) {
  return disabledCells && disabledCells.length
    ? new Set(disabledCells.map(([r, c]) => r + ',' + c))
    : null;
}

// ── Sprague-Grundy 기반 승패 확정 판단 ───────────────────────────────────────
export function analyzeBoard(board, ROWS, COLS, disabledSet) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  let grundyCount = 0;
  for (let sr = 0; sr < ROWS; sr++) {
    for (let sc = 0; sc < COLS; sc++) {
      if (board[sr][sc] || visited[sr][sc] || (disabledSet && disabledSet.has(sr + ',' + sc))) continue;
      const cells = [], queue = [[sr, sc]];
      visited[sr][sc] = true;
      while (queue.length) {
        const [r, c] = queue.shift();
        cells.push([r, c]);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (
            nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !board[nr][nc] && !visited[nr][nc] &&
            !(disabledSet && disabledSet.has(nr + ',' + nc))
          ) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
      if (cells.length >= 8) return 'UNKNOWN';
      if (cells.length < 4) continue;
      const cellSet = new Set(cells.map(([r, c]) => r * COLS + c));
      let fits = false;
      outer: for (let pi = 0; pi < PIECES.length; pi++) {
        for (const shape of getUniqueOrientations(pi)) {
          const H = shape.length, W = shape[0].length;
          for (let r2 = 0; r2 <= ROWS - H && !fits; r2++) {
            for (let c2 = 0; c2 <= COLS - W && !fits; c2++) {
              let ok = true;
              for (let dr = 0; dr < H && ok; dr++)
                for (let dc = 0; dc < W && ok; dc++)
                  if (shape[dr][dc] && !cellSet.has((r2 + dr) * COLS + (c2 + dc))) ok = false;
              if (ok) fits = true;
            }
          }
          if (fits) break outer;
        }
      }
      if (fits) grundyCount++;
    }
  }
  return grundyCount % 2 === 1 ? 'WIN' : 'LOSE';
}
