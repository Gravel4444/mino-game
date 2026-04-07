import { useRef, useEffect } from 'react';
import { PIECES } from '../constants.js';
import { getShape } from '../utils.js';

export default function PiecePreview({ selectedIdx, rotation, playerColor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const shape = getShape(selectedIdx, rotation);
    const rows = shape.length, cols = shape[0].length;
    const cell = Math.min(28, Math.max(12, Math.floor(68 / Math.max(rows, cols))));
    const W = cols * cell + 4, H = rows * cell + 4;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'), col = playerColor;
    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!shape[r][c]) continue;
      ctx.fillStyle = col; ctx.fillRect(2 + c*cell + 1, 2 + r*cell + 1, cell-2, cell-2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(2 + c*cell + 1, 2 + r*cell + 1, cell-2, 3);
      ctx.fillRect(2 + c*cell + 1, 2 + r*cell + 1, 3, cell-2);
    }
  }, [selectedIdx, rotation, playerColor]);

  return <canvas ref={canvasRef} />;
}
