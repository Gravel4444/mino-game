import { useRef, useEffect } from 'react';
import { RANK_COLORS } from '../constants.js';
import { getEffectiveColor, getShape, makeDisabledSet } from '../utils.js';

export default function AdvisorMiniBoard({ board, boardRows, boardCols, topMoves, currentEvalMove, playerColors, darkMode, disabledCells }) {
  const canvasRef = useRef(null);
  const dm = darkMode !== false;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ROWS = boardRows, COLS = boardCols;
    const CELL = Math.max(14, Math.floor(196 / Math.max(ROWS, COLS)));
    const W = COLS * CELL, H = ROWS * CELL;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const bgCell   = dm ? '#0d1117' : '#f0f3f6';
    const gridLine = dm ? '#1f2730' : '#d0d7de';
    const disSet   = makeDisabledSet(disabledCells);

    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c*CELL, y = r*CELL, v = board[r][c];
      if (disSet && disSet.has(r+','+c)) {
        ctx.fillStyle = dm ? '#1a1f26' : '#dce0e5'; ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = dm ? '#30363d' : '#bcc3cc'; ctx.lineWidth = 0.5; ctx.strokeRect(x+.5, y+.5, CELL-1, CELL-1);
        ctx.strokeStyle = dm ? '#444c56' : '#adb5bd'; ctx.lineWidth = 1.5;
        const p = Math.floor(CELL * 0.28);
        ctx.beginPath(); ctx.moveTo(x+p, y+p); ctx.lineTo(x+CELL-p, y+CELL-p);
        ctx.moveTo(x+CELL-p, y+p); ctx.lineTo(x+p, y+CELL-p); ctx.stroke();
      } else if (v === 0) {
        ctx.fillStyle = bgCell; ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = gridLine; ctx.lineWidth = .5; ctx.strokeRect(x+.5, y+.5, CELL-1, CELL-1);
      } else {
        const col = getEffectiveColor((playerColors || ['#3498db', '#e74c3c'])[v - 1], dm);
        ctx.fillStyle = col + '33'; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = col; ctx.fillRect(x+1, y+1, CELL-2, CELL-2);
      }
    }

    const rank3 = topMoves.slice(0, 3);
    for (let ri = rank3.length - 1; ri >= 0; ri--) {
      const m = rank3[ri], col = RANK_COLORS[ri], alpha = [0.55, 0.40, 0.28][ri];
      const shape = getShape(m.pi, m.rot);
      for (let dr = 0; dr < shape.length; dr++) for (let dc = 0; dc < shape[dr].length; dc++) {
        if (!shape[dr][dc]) continue;
        const nr = m.r+dr, nc = m.c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        ctx.globalAlpha = alpha; ctx.fillStyle = col;
        ctx.fillRect(nc*CELL+1, nr*CELL+1, CELL-2, CELL-2);
        ctx.globalAlpha = alpha + 0.2; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        ctx.strokeRect(nc*CELL+1.5, nr*CELL+1.5, CELL-3, CELL-3);
      }
      let labelR = -1, labelC = -1;
      for (let dr = 0; dr < shape.length && labelR === -1; dr++)
        for (let dc = 0; dc < shape[dr].length && labelR === -1; dc++)
          if (shape[dr][dc]) { labelR = m.r+dr; labelC = m.c+dc; }
      if (labelR >= 0 && labelR < ROWS && labelC >= 0 && labelC < COLS) {
        ctx.globalAlpha = 1; ctx.font = `bold ${Math.max(8, CELL-6)}px sans-serif`;
        ctx.fillStyle = col; ctx.fillText(ri+1, labelC*CELL+2, (labelR+1)*CELL-2);
      }
      ctx.globalAlpha = 1;
    }

    if (currentEvalMove) {
      const shape = getShape(currentEvalMove.pi, currentEvalMove.rot);
      for (let dr = 0; dr < shape.length; dr++) for (let dc = 0; dc < shape[dr].length; dc++) {
        if (!shape[dr][dc]) continue;
        const nr = currentEvalMove.r+dr, nc = currentEvalMove.c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        ctx.globalAlpha = 0.55; ctx.fillStyle = '#ff8c00';
        ctx.fillRect(nc*CELL+1, nr*CELL+1, CELL-2, CELL-2);
      }
      ctx.globalAlpha = 1;
    }
  }, [board, boardRows, boardCols, topMoves, currentEvalMove, dm, disabledCells]);

  return (
    <canvas
      ref={canvasRef}
      style={{ border: `1px solid ${dm ? '#2a3a2a' : '#b0c8b0'}`, borderRadius: 5, display: 'block' }}
    />
  );
}
