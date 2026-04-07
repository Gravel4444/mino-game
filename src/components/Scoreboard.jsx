import { getEffectiveColor } from '../utils.js';

export default function Scoreboard({ turnCount, maxTurns, currentPlayer, boardW, playerNames, playerColors, darkMode }) {
  const dm  = darkMode !== false;
  const cur = turnCount + 1;
  const p1  = Math.ceil(maxTurns / 2);
  const p2  = Math.floor(maxTurns / 2);
  const availW = boardW - 168;
  const dotW   = Math.max(12, Math.min(22, Math.floor((availW - (p1 - 1) * 4) / p1)));

  const dots = (count, fn, pIdx) => Array.from({ length: count }, (_, i) => {
    const t = fn(i), s = t < cur ? 'done' : t === cur ? 'current' : 'upcoming';
    const col = getEffectiveColor(playerColors[pIdx], dm);
    return (
      <div key={i}
        className={`turn-dot ${s}`}
        style={{
          width: dotW, height: dotW,
          background:   s === 'done' ? col : 'transparent',
          borderColor:  s === 'done' ? col : s === 'current' ? col : col + '44',
        }}
        title={`턴${t} (${playerNames[pIdx]})`}
      />
    );
  });

  return (
    <header id="scoreboard">
      <div id="turn-display">
        <span id="turn-num" style={{ color: getEffectiveColor(playerColors[currentPlayer], dm) }}>{cur}</span>
        <span id="turn-suffix">/ {maxTurns} 턴</span>
      </div>
      <div id="dots-container">
        <div className="dots-row">
          <span className="dots-player-label" style={{ color: getEffectiveColor(playerColors[0], dm) }}>선공</span>
          <div className="dots-row-inner">{dots(p1, i => 2*i+1, 0)}</div>
        </div>
        <div className="dots-row">
          <span className="dots-player-label" style={{ color: getEffectiveColor(playerColors[1], dm) }}>후공</span>
          <div className="dots-row-inner">{dots(p2, i => 2*i+2, 1)}</div>
        </div>
      </div>
    </header>
  );
}
