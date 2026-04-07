import { RANK_COLORS } from '../constants.js';
import AdvisorMiniBoard from './AdvisorMiniBoard.jsx';
import DepthBadges      from './DepthBadges.jsx';
import SearchStats      from './SearchStats.jsx';
import CandidateList    from './CandidateList.jsx';

export default function AdvisorPanel({ state, ai, hintData, hintVisible, onSetHintVisible, onAnalyze, onCancel, playerColors, darkMode }) {
  const { status, searchStats, topMoves, currentEvalMove, completedDepths } = ai;
  const { boardRows, boardCols, gameWinner, board, disabledCells } = state;
  const isThinking = status === 'thinking';
  const isActive   = isThinking || status === 'done';
  const nextDepth  = searchStats.depth + (isThinking ? 1 : 0);
  const isRandom   = hintData?.isRandom || false;

  return (
    <section id="advisor-panel">
      <header className="adv-header">
        <div className="adv-title">
          <div className="adv-title-row">
            <span className="adv-title-main">어드바이저</span>
            {isRandom && <span className="stat-verdict verdict-random">🎲 랜덤 추천</span>}
          </div>
          <span className="adv-title-sub">Iterative Deepening Negamax · Alpha-Beta · Transposition Table</span>
        </div>
        <div className="adv-header-actions">
          {hintData && (
            <button className={`hint-toggle-btn${hintVisible ? ' visible' : ''}`}
              onClick={() => onSetHintVisible(!hintVisible)}>
              {hintVisible ? '힌트 숨기기' : '힌트 보이기'}
            </button>
          )}
          {isThinking
            ? <button className="ai-thinking-btn" onClick={onCancel}>⏹ 중단</button>
            : <button className="ai-analyze-btn" onClick={onAnalyze} disabled={gameWinner !== null}>🔍 최선수 분석 (H)</button>
          }
        </div>
      </header>

      {!isActive && (
        <p className="adv-idle">
          버튼 또는 <kbd>H</kbd>를 눌러 현재 플레이어의 최선수를 탐색합니다.
          탐색 중에는 깊이별 진행 상황과 α-β 가지치기 효율을 실시간으로 볼 수 있습니다.
        </p>
      )}

      {isActive && (
        <div className="adv-body">
          <div className="adv-board-col">
            <div className="adv-col-title">보드 시각화</div>
            <AdvisorMiniBoard
              board={board} boardRows={boardRows} boardCols={boardCols}
              topMoves={topMoves} currentEvalMove={currentEvalMove}
              playerColors={playerColors} darkMode={darkMode} disabledCells={disabledCells}
            />
            <div className="mini-board-legend">
              {topMoves[0] && <span style={{ color: RANK_COLORS[0] }}>● 1위</span>}
              {topMoves[1] && <span style={{ color: RANK_COLORS[1] }}>● 2위</span>}
              {topMoves[2] && <span style={{ color: RANK_COLORS[2] }}>● 3위</span>}
              {currentEvalMove && <span style={{ color: '#ff8c00' }}>● 평가 중</span>}
            </div>
          </div>
          <div className="adv-data-col">
            <div>
              <div className="adv-col-title">탐색 깊이 진행</div>
              <DepthBadges completedDepths={completedDepths} currentDepth={nextDepth} isThinking={isThinking} result={searchStats.result} />
            </div>
            <div>
              <div className="adv-col-title">탐색 통계</div>
              <SearchStats stats={searchStats} isThinking={isThinking} />
            </div>
            {topMoves.length > 0 && (
              <div className="adv-section">
                <div className="adv-col-title">
                  후보 수 순위{searchStats.depth > 0 ? ` (깊이 ${searchStats.depth} 완료 기준)` : ''}
                </div>
                <CandidateList topMoves={topMoves} />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
