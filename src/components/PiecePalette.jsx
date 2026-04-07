import { useRef, useEffect } from 'react';
import { PIECES } from '../constants.js';

function PiecePaletteBtn({ piece, idx, isSelected, isHint, onSelect }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const rows = piece.shape.length, cols = piece.shape[0].length, sz = 11;
    c.width  = cols * sz + 2;
    c.height = rows * sz + 2;
    const cx = c.getContext('2d');
    cx.clearRect(0, 0, c.width, c.height);
    cx.fillStyle = piece.color;
    for (let r = 0; r < rows; r++)
      for (let col = 0; col < cols; col++)
        if (piece.shape[r][col]) cx.fillRect(1 + col*sz, 1 + r*sz, sz-1, sz-1);
  }, [piece]);

  return (
    <button
      className={`piece-btn${isSelected ? ' selected' : ''}${isHint ? ' hint-piece' : ''}`}
      title={`${piece.name} (클릭: 선택/재클릭: 회전)`}
      onClick={() => onSelect(idx)}
    >
      <span className="key-hint"><kbd>{idx + 1}</kbd></span>
      <canvas ref={canvasRef} />
    </button>
  );
}

export default function PiecePalette({ selectedIdx, hintPieceIdx, dispatch }) {
  return (
    <div id="piece-palette">
      {PIECES.map((p, i) => (
        <PiecePaletteBtn
          key={p.name} piece={p} idx={i}
          isSelected={i === selectedIdx}
          isHint={hintPieceIdx !== null && i === hintPieceIdx}
          onSelect={(idx) => dispatch({ type: 'TOGGLE_PIECE', idx })}
        />
      ))}
    </div>
  );
}
