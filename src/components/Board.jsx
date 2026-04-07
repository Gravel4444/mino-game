import { useRef, useEffect, useCallback } from 'react';
import { PIECES } from '../constants.js';
import { calcCell, getShape, canPlace, makeDisabledSet, getEffectiveColor } from '../utils.js';

export default function Board({ state, dispatch, hintMove, settings }) {
  const canvasRef    = useRef(null);
  const stateRef     = useRef(state);
  const hintRef      = useRef(hintMove);
  const settingsRef  = useRef(settings);
  const shakeXRef    = useRef(0);
  const shakeStartRef= useRef(null);
  const shakeRafRef  = useRef(null);

  useEffect(() => { stateRef.current    = state; });
  useEffect(() => { hintRef.current     = hintMove; });
  useEffect(() => { settingsRef.current = settings; });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { board, boardRows, boardCols, pieceBoard, currentPlayer, selectedIdx, rotation, hoverCell, disabledCells } = stateRef.current;
    const hint = hintRef.current, cfg = settingsRef.current;
    const ROWS = boardRows, COLS = boardCols;
    const CELL = calcCell(ROWS, COLS);
    const ctx  = canvas.getContext('2d');
    const darkMode   = cfg.darkMode !== false;
    const disabledSet = makeDisabledSet(disabledCells);

    const cellColor = (v, r, c) => {
      if (cfg.blockColorMode === 'piece' && pieceBoard[r][c] >= 0) return PIECES[pieceBoard[r][c]].color;
      return getEffectiveColor(cfg.playerColors[v - 1], darkMode);
    };
    const bgCell  = darkMode ? '#0d1117' : '#f0f3f6';
    const gridLine = darkMode ? '#1c2128' : '#d8dee4';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c*CELL, y = r*CELL, v = board[r][c];
      if (disabledSet && disabledSet.has(r+','+c)) {
        ctx.fillStyle = darkMode ? '#1a1f26' : '#dce0e5'; ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = darkMode ? '#30363d' : '#bcc3cc'; ctx.lineWidth = 1; ctx.strokeRect(x+.5, y+.5, CELL-1, CELL-1);
        ctx.strokeStyle = darkMode ? '#444c56' : '#adb5bd'; ctx.lineWidth = 1.5;
        const p = Math.floor(CELL * 0.28);
        ctx.beginPath(); ctx.moveTo(x+p, y+p); ctx.lineTo(x+CELL-p, y+CELL-p);
        ctx.moveTo(x+CELL-p, y+p); ctx.lineTo(x+p, y+CELL-p); ctx.stroke();
      } else if (v === 0) {
        ctx.fillStyle = bgCell; ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = gridLine; ctx.lineWidth = 1; ctx.strokeRect(x+.5, y+.5, CELL-1, CELL-1);
      } else {
        const col = cellColor(v, r, c);
        ctx.fillStyle = col + '33'; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = col; ctx.fillRect(x+2, y+2, CELL-4, CELL-4);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x+2, y+2, CELL-4, 4); ctx.fillRect(x+2, y+2, 4, CELL-4);
      }
    }

    if (hint) {
      const hs = getShape(hint.pi, hint.rot);
      for (let dr = 0; dr < hs.length; dr++) for (let dc = 0; dc < hs[dr].length; dc++) {
        if (!hs[dr][dc]) continue;
        const nr = hint.r+dr, nc = hint.c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffd700'; ctx.fillRect(nc*CELL+1, nr*CELL+1, CELL-2, CELL-2);
        ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5;
        ctx.strokeRect(nc*CELL+3, nr*CELL+3, CELL-6, CELL-6); ctx.globalAlpha = 1;
      }
    }

    if (hoverCell) {
      const shape = getShape(selectedIdx, rotation), { r, c } = hoverCell;
      const valid = canPlace(shape, r, c, board, ROWS, COLS, disabledSet);
      const shakeX = shakeXRef.current;
      const hoverColor = cfg.blockColorMode === 'piece'
        ? PIECES[selectedIdx].color
        : getEffectiveColor(cfg.playerColors[currentPlayer], darkMode);

      for (let dr = 0; dr < shape.length; dr++) for (let dc = 0; dc < shape[dr].length; dc++) {
        if (!shape[dr][dc]) continue;
        const nr = r+dr, nc = c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (valid) {
          ctx.globalAlpha = 0.55; ctx.fillStyle = hoverColor;
          ctx.fillRect(nc*CELL+2, nr*CELL+2, CELL-4, CELL-4);
        } else if (board[nr][nc] || (disabledSet && disabledSet.has(nr+','+nc))) {
          ctx.globalAlpha = 0.55; ctx.fillStyle = '#3a3f47'; ctx.fillRect(nc*CELL+2+shakeX, nr*CELL+2, CELL-4, CELL-4);
          ctx.globalAlpha = 0.75; ctx.strokeStyle = '#888fa0'; ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.moveTo(nc*CELL+7+shakeX, nr*CELL+7); ctx.lineTo(nc*CELL+CELL-7+shakeX, nr*CELL+CELL-7);
          ctx.moveTo(nc*CELL+CELL-7+shakeX, nr*CELL+7); ctx.lineTo(nc*CELL+7+shakeX, nr*CELL+CELL-7); ctx.stroke();
        } else {
          ctx.globalAlpha = 0.42; ctx.fillStyle = '#52606e'; ctx.fillRect(nc*CELL+2+shakeX, nr*CELL+2, CELL-4, CELL-4);
        }
        ctx.globalAlpha = 1;
      }
    }
  }, []);

  const triggerShake = useCallback(() => {
    const MS = 170;
    if (shakeRafRef.current) cancelAnimationFrame(shakeRafRef.current);
    shakeStartRef.current = null;
    function animate(ts) {
      if (!shakeStartRef.current) shakeStartRef.current = ts;
      const t = (ts - shakeStartRef.current) / MS;
      if (t >= 1) { shakeXRef.current = 0; shakeStartRef.current = null; shakeRafRef.current = null; draw(); return; }
      shakeXRef.current = Math.round(5 * Math.sin(t * Math.PI * 6) * (1 - t)); draw();
      shakeRafRef.current = requestAnimationFrame(animate);
    }
    shakeRafRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const CELL = calcCell(state.boardRows, state.boardCols);
    canvas.width  = state.boardCols * CELL;
    canvas.height = state.boardRows * CELL;
  }, [state.boardRows, state.boardCols]);

  useEffect(() => { draw(); });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onMM = (e) => {
      const { boardRows, boardCols, selectedIdx, rotation, gameWinner } = stateRef.current;
      if (gameWinner !== null) return;
      const CELL = calcCell(boardRows, boardCols), rect = canvas.getBoundingClientRect(), shape = getShape(selectedIdx, rotation);
      dispatch({ type: 'HOVER', cell: {
        r: Math.floor((e.clientY - rect.top)  / CELL) - Math.floor(shape.length    / 2),
        c: Math.floor((e.clientX - rect.left) / CELL) - Math.floor(shape[0].length / 2),
      }});
    };
    const onML = () => dispatch({ type: 'HOVER', cell: null });
    const onCK = () => {
      const { hoverCell, selectedIdx, rotation, board, boardRows, boardCols, gameWinner, disabledCells } = stateRef.current;
      if (!hoverCell || gameWinner !== null) return;
      const shape = getShape(selectedIdx, rotation);
      const dis   = makeDisabledSet(disabledCells);
      if (!canPlace(shape, hoverCell.r, hoverCell.c, board, boardRows, boardCols, dis)) { triggerShake(); return; }
      dispatch({ type: 'PLACE', r: hoverCell.r, c: hoverCell.c });
    };
    const onCM = (e) => { e.preventDefault(); if (stateRef.current.gameWinner !== null) return; dispatch({ type: 'NEXT_PIECE' }); };
    const onWH = (e) => { e.preventDefault(); if (stateRef.current.gameWinner !== null) return; dispatch({ type: 'ROTATE' }); };

    canvas.addEventListener('mousemove',   onMM);
    canvas.addEventListener('mouseleave',  onML);
    canvas.addEventListener('click',       onCK);
    canvas.addEventListener('contextmenu', onCM);
    canvas.addEventListener('wheel',       onWH, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove',   onMM);
      canvas.removeEventListener('mouseleave',  onML);
      canvas.removeEventListener('click',       onCK);
      canvas.removeEventListener('contextmenu', onCM);
      canvas.removeEventListener('wheel',       onWH);
    };
  }, [dispatch, triggerShake]);

  return <canvas id="board-canvas" ref={canvasRef} />;
}
