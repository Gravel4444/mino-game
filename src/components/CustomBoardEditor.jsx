export default function CustomBoardEditor({ value, onChange }) {
  const w = value.w || 7, h = value.h || 7;
  const disabledSet = new Set((value.disabled || []).map(([r, c]) => r+','+c));

  const toggleCell = (r, c) => {
    const key = r+','+c;
    const next = disabledSet.has(key)
      ? (value.disabled || []).filter(([dr, dc]) => !(dr === r && dc === c))
      : [...(value.disabled || []), [r, c]];
    onChange({ ...value, disabled: next });
  };
  const setW = (nw) => {
    const clamped = Math.max(2, Math.min(10, nw));
    onChange({ ...value, w: clamped, disabled: (value.disabled || []).filter(([r, c]) => r < h && c < clamped) });
  };
  const setH = (nh) => {
    const clamped = Math.max(2, Math.min(10, nh));
    onChange({ ...value, h: clamped, disabled: (value.disabled || []).filter(([r, c]) => r < clamped && c < w) });
  };

  return (
    <div className="custom-board-editor">
      <div className="custom-board-dims">
        <span>가로</span>
        <input type="number" value={w} min={2} max={10} onChange={e => setW(parseInt(e.target.value) || 7)} />
        <span>×</span>
        <span>세로</span>
        <input type="number" value={h} min={2} max={10} onChange={e => setH(parseInt(e.target.value) || 7)} />
      </div>
      <div className="custom-grid-wrap">
        <div className="custom-grid" style={{ gridTemplateColumns: `repeat(${w}, 28px)` }}>
          {Array.from({ length: h }, (_, r) =>
            Array.from({ length: w }, (_, c) => {
              const dis = disabledSet.has(r+','+c);
              return (
                <button
                  key={r+','+c}
                  className={`custom-cell${dis ? ' disabled' : ''}`}
                  onClick={() => toggleCell(r, c)}
                >
                  {dis ? '✕' : ''}
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="custom-board-hint">셀을 클릭하면 사용 불가 칸(✕)으로 설정됩니다.</div>
    </div>
  );
}
