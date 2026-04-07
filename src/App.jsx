import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { PIECES } from './constants.js';
import { calcCell, makeDisabledSet, analyzeBoard, getEffectiveColor, getShape } from './utils.js';
import { makeInitial, gameReducer } from './gameReducer.js';
import { useAISolver } from './hooks/useAISolver.js';

import Board          from './components/Board.jsx';
import Scoreboard     from './components/Scoreboard.jsx';
import GameOver       from './components/GameOver.jsx';
import PiecePreview   from './components/PiecePreview.jsx';
import PiecePalette   from './components/PiecePalette.jsx';
import AdvisorPanel   from './components/AdvisorPanel.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';

export default function App() {
  const [settings, setSettings] = useState({
    playerNames:    ['플레이어 1', '플레이어 2'],
    playerColors:   ['#3498db', '#e74c3c'],
    blockColorMode: 'player',
    darkMode:       true,
    isComputer:     [false, false],
    boardMode:      'preset',
    customBoard:    null,
    boardSize:      7,
  });
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; });

  // 다크모드 body 클래스 적용
  useEffect(() => {
    document.body.classList.toggle('light', settings.darkMode === false);
  }, [settings.darkMode]);

  const [showSettings,  setShowSettings]  = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [state, dispatch] = useReducer(gameReducer, makeInitial(7));
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const { boardRows, boardCols, currentPlayer, selectedIdx, rotation, turnCount, gameWinner } = state;
  const CELL    = calcCell(boardRows, boardCols);
  const BOARD_W = boardCols * CELL;
  const validCells = (boardRows * boardCols) - (state.disabledCells?.length || 0);
  const MAX_TURNS  = Math.floor(validCells / 4);

  // Sprague-Grundy 승패 확정 판단
  const confirmedResult = useMemo(() => {
    if (gameWinner !== null) return 'UNKNOWN';
    const dis = makeDisabledSet(state.disabledCells);
    return analyzeBoard(state.board, boardRows, boardCols, dis);
  }, [state.board, boardRows, boardCols, gameWinner, state.disabledCells]);

  // 컴퓨터 차례 승/패 확정 시 자동 처리
  useEffect(() => {
    const cfg    = settingsRef.current;
    const isComp = cfg.isComputer && cfg.isComputer[currentPlayer] && gameWinner === null;
    if (!isComp) return;
    if (confirmedResult === 'WIN')  dispatch({ type: 'DECLARE_WIN', names: cfg.playerNames });
    else if (confirmedResult === 'LOSE') dispatch({ type: 'FORFEIT', names: cfg.playerNames });
  }, [confirmedResult, currentPlayer, gameWinner]);

  const ai    = useAISolver();
  const aiRef = useRef(ai);
  useEffect(() => { aiRef.current = ai; });

  const [hintData,    setHintData]    = useState(null);
  const [hintVisible, setHintVisible] = useState(true);
  const computerRef = useRef(false);

  const visibleHint    = hintData && hintVisible ? hintData : null;
  const hintVisibleRef = useRef(hintVisible);
  useEffect(() => { hintVisibleRef.current = hintVisible; }, [hintVisible]);

  // 분석 완료 시: 컴퓨터 자동 배치 or 힌트 저장 + 미노 자동 선택
  useEffect(() => {
    if (!ai.finalHint) return;
    setHintData(ai.finalHint);
    const cfg    = settingsRef.current;
    const cp     = stateRef.current.currentPlayer;
    const isComp = cfg.isComputer && cfg.isComputer[cp];

    if (isComp && computerRef.current) {
      computerRef.current = false;
      const { pi, rot, r, c } = ai.finalHint;
      if (pi != null && r != null && c != null)
        dispatch({ type: 'COMPUTER_PLACE', pi, rot, r, c, names: cfg.playerNames });
    } else if (!isComp && hintVisibleRef.current && ai.finalHint.pi != null) {
      const { pi, rot } = ai.finalHint;
      const other = (pi + 1) % PIECES.length;
      dispatch({ type: 'TOGGLE_PIECE', idx: other });
      dispatch({ type: 'TOGGLE_PIECE', idx: pi });
      for (let i = 0; i < rot; i++) dispatch({ type: 'ROTATE' });
    }
  }, [ai.finalHint]);

  // 수를 두거나 보드 변경 시 힌트 초기화
  useEffect(() => {
    setHintData(null); aiRef.current.reset(); computerRef.current = false;
  }, [state.turnCount, state.boardSize, state.boardRows, state.boardCols]);

  // aiRef 를 통해 접근 → handleAnalyze 의 참조가 안정적으로 유지됨
  const handleAnalyze = useCallback((timeLimit) => {
    const { boardRows, boardCols, disabledCells } = stateRef.current;
    const R = boardRows, C = boardCols;
    const limit = timeLimit || (Math.max(R, C) <= 5 ? 6000 : Math.max(R, C) <= 7 ? 4000 : 2500);
    aiRef.current.analyze(stateRef.current.board, R, C, limit, disabledCells || []);
  }, []);

  // 컴퓨터 자동 수
  useEffect(() => {
    const cfg = settingsRef.current;
    if (gameWinner !== null) return;
    if (!cfg.isComputer || !cfg.isComputer[currentPlayer]) return;
    if (computerRef.current) return;
    computerRef.current = true;
    const timer = setTimeout(() => { handleAnalyze(15000); }, 400);
    return () => clearTimeout(timer);
  }, [currentPlayer, turnCount, gameWinner]); // handleAnalyze 는 안정적 참조이므로 deps 불필요

  // 설정 저장
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    if (newSettings.boardMode === 'custom' && newSettings.customBoard) {
      const { w, h, disabled } = newSettings.customBoard;
      dispatch({ type: 'RESIZE_CUSTOM', size: Math.max(w, h), rows: h, cols: w, disabled });
    } else {
      dispatch({ type: 'RESIZE', size: newSettings.boardSize });
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const onKD = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      const { gameWinner, currentPlayer } = stateRef.current;
      const cfg = settingsRef.current;
      if (e.key === 'h' || e.key === 'H') { if (gameWinner === null) handleAnalyze(); return; }
      if (gameWinner !== null) return;
      if (cfg.isComputer && cfg.isComputer[currentPlayer]) return;
      if (e.key === 'r' || e.key === 'R') { dispatch({ type: 'ROTATE' }); return; }
      if (e.key === 'Escape') {
        setConfirmDialog({
          message:   `${cfg.playerNames[currentPlayer]}이(가) 기권하시겠습니까?`,
          onConfirm: () => dispatch({ type: 'FORFEIT', names: cfg.playerNames }),
        });
        return;
      }
      const n = parseInt(e.key);
      if (n >= 1 && n <= 7) dispatch({ type: 'TOGGLE_PIECE', idx: n - 1 });
    };
    document.addEventListener('keydown', onKD);
    return () => document.removeEventListener('keydown', onKD);
  }, [handleAnalyze]);

  const { playerNames, playerColors, blockColorMode, darkMode, isComputer } = settings;
  const isComputerTurn = isComputer && isComputer[currentPlayer] && gameWinner === null;

  if (showSettings) {
    return (
      <SettingsScreen
        settings={settings}
        onSave={handleSaveSettings}
        onBack={() => {
          document.body.classList.toggle('light', settings.darkMode === false);
          setShowSettings(false);
        }}
      />
    );
  }

  return (
    <main id="app-wrap">
      <GameOver state={state} dispatch={dispatch} settings={settings} />

      <div id="game-row">
        <div id="left-col">
          <Scoreboard
            turnCount={turnCount} maxTurns={MAX_TURNS} currentPlayer={currentPlayer}
            boardW={BOARD_W} playerNames={playerNames} playerColors={playerColors} darkMode={darkMode}
          />
          <Board
            state={state} dispatch={dispatch}
            hintMove={isComputerTurn ? null : visibleHint}
            settings={settings}
          />
        </div>

        <aside id="controls">
          <button className="settings-open-btn" onClick={() => setShowSettings(true)}>⚙ 설정</button>

          <div className="player-indicator"
            style={{
              borderColor: playerColors[currentPlayer],
              color:       playerColors[currentPlayer],
              background:  `${playerColors[currentPlayer]}1a`,
            }}>
            {isComputerTurn ? '💻 생각 중...' : `${playerNames[currentPlayer]}의 차례`}
          </div>

          <div className="section-label">미노 선택</div>
          <div className="piece-row">
            <div id="preview-wrap">
              <PiecePreview
                selectedIdx={selectedIdx} rotation={rotation}
                playerColor={
                  blockColorMode === 'piece'
                    ? PIECES[selectedIdx].color
                    : getEffectiveColor(playerColors[currentPlayer], darkMode !== false)
                }
              />
            </div>
            <button className="ctrl-btn" style={{ flex: 1 }} onClick={() => dispatch({ type: 'ROTATE' })}>
              회전<br /><kbd>R</kbd>
            </button>
          </div>

          <PiecePalette
            selectedIdx={selectedIdx}
            hintPieceIdx={visibleHint ? visibleHint.pi : null}
            dispatch={dispatch}
          />

          <div className="action-row">
            <button
              className={`confirm-btn ${
                confirmedResult === 'WIN'  ? 'confirm-win'  :
                confirmedResult === 'LOSE' ? 'confirm-lose' : 'confirm-idle'
              }`}
              disabled={confirmedResult === 'UNKNOWN' || gameWinner !== null || isComputerTurn}
              onClick={() => {
                if (confirmedResult === 'WIN') dispatch({ type: 'DECLARE_WIN', names: playerNames });
                else if (confirmedResult === 'LOSE') {
                  setConfirmDialog({
                    message:   `${playerNames[currentPlayer]}이(가) 패배를 인정하시겠습니까?`,
                    onConfirm: () => dispatch({ type: 'FORFEIT', names: playerNames }),
                  });
                }
              }}
            >
              {confirmedResult === 'WIN'  ? '🏆 승리 확정' :
               confirmedResult === 'LOSE' ? '🏳️ 패배 확정' : '확정 없음'}
            </button>
            <button
              className="ctrl-btn forfeit-btn"
              disabled={isComputerTurn}
              onClick={() => setConfirmDialog({
                message:   `${playerNames[currentPlayer]}이(가) 기권하시겠습니까?`,
                onConfirm: () => dispatch({ type: 'FORFEIT', names: playerNames }),
              })}
            >
              기권 <kbd>Esc</kbd>
            </button>
          </div>

          <p id="instructions">
            · 좌클릭: 배치<br />
            · 우클릭: 다음 미노로 전환<br />
            · 휠: 회전 &nbsp;·&nbsp; <kbd>R</kbd>: 회전<br />
            · <kbd>H</kbd>: 최선수 분석<br />
            · <kbd>1</kbd>–<kbd>7</kbd>: 선택/재클릭 회전<br />
            · <kbd>Esc</kbd>: 기권
          </p>
        </aside>
      </div>

      <AdvisorPanel
        state={state} ai={ai}
        hintData={hintData} hintVisible={hintVisible}
        onSetHintVisible={setHintVisible}
        onAnalyze={() => handleAnalyze()}
        onCancel={ai.cancel}
        playerColors={playerColors}
        darkMode={darkMode}
      />

      {confirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <p className="confirm-dialog-msg">{confirmDialog.message}</p>
            <div className="confirm-dialog-btns">
              <button className="confirm-dialog-cancel" onClick={() => setConfirmDialog(null)}>취소</button>
              <button className="confirm-dialog-ok" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
