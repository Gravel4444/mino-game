import { PIECES, RANK_COLORS } from '../constants.js';

export default function CandidateList({ topMoves }) {
  if (!topMoves.length) return null;
  const INF2    = 1e8;
  const finite  = topMoves.map(m => m.score).filter(s => s < INF2 && s > -INF2);
  const maxS    = finite.length ? Math.max(...finite) : 0;
  const minS    = finite.length ? Math.min(...finite) : 0;
  const range   = maxS - minS || 1;

  return (
    <div className="candidate-list">
      {topMoves.slice(0, 5).map((m, i) => {
        const isWin  = m.score >= INF2, isLose = m.score <= -INF2;
        const pct    = isWin ? 100 : isLose ? 3 : Math.max(3, Math.round(((m.score - minS) / range) * 100));
        const col    = RANK_COLORS[i];
        return (
          <div key={i} className="candidate-row">
            <span className="cand-rank"  style={{ color: col }}>{i + 1}</span>
            <span className="cand-piece">{PIECES[m.pi].name}</span>
            <span className="cand-pos">{m.rot}회전 ({m.r+1}행,{m.c+1}열)</span>
            <div className="cand-bar-wrap">
              <div className="cand-bar-fill"
                style={{ width: `${pct}%`, background: isWin ? '#3fb950' : isLose ? '#e74c3c' : col }}
              />
            </div>
            <span className="cand-score" style={{ color: col }}>
              {isWin ? '✓ WIN' : isLose ? '✗ LOSE' : m.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
