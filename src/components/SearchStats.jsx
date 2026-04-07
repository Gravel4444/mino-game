export default function SearchStats({ stats, isThinking }) {
  const { depth, nodes, cutoffs, ms, result } = stats;
  const pruneRate = nodes > 0 ? Math.round((cutoffs / (nodes + cutoffs)) * 100) : 0;
  const verdicts  = {
    WIN:     { cls: 'verdict-win',  text: '✓ 강제 승리' },
    LOSE:    { cls: 'verdict-lose', text: '✗ 패배 예상' },
    UNKNOWN: { cls: 'verdict-unk',  text: '~ 탐색 완료' },
  };
  const v = verdicts[result] || verdicts.UNKNOWN;

  return (
    <div className="search-stats">
      <div className="stats-row">
        <span className="stat-item">완료 깊이 <b>{depth || '–'}</b></span>
        <span className="stat-item">탐색 노드 <b>{nodes.toLocaleString()}</b></span>
        <span className="stat-item">가지치기 <b>{cutoffs.toLocaleString()}</b></span>
        <span className="stat-item">경과 <b>{ms}ms</b></span>
        {!isThinking && depth > 0 && <span className={`stat-verdict ${v.cls}`}>{v.text}</span>}
      </div>
      {nodes > 0 && (
        <div className="pruning-bar-wrap">
          <div className="pruning-bar-label">
            <span>α-β 가지치기 효율</span>
            <span>{pruneRate}% 절감</span>
          </div>
          <div className="pruning-bar-track">
            <div className="pruning-bar-fill" style={{ width: `${pruneRate}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
