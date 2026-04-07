export default function DepthBadges({ completedDepths, currentDepth, isThinking, result }) {
  const maxShow = Math.max(8, (completedDepths[completedDepths.length - 1] || 0) + 2);
  return (
    <div className="depth-badges">
      {Array.from({ length: maxShow }, (_, i) => i + 1).map(d => {
        const done   = completedDepths.includes(d);
        const active = isThinking && d === currentDepth;
        const cls    = active ? 'current' : done ? (result === 'WIN' ? 'win' : result === 'LOSE' ? 'lose' : 'done') : '';
        return <div key={d} className={`depth-badge${cls ? ' ' + cls : ''}`}>{d}</div>;
      })}
      {isThinking && <span style={{ fontSize: 10, color: '#4a6a4a', alignSelf: 'center' }}>탐색 중...</span>}
    </div>
  );
}
