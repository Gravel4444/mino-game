import { useState } from 'react';
import { PIECE_SQ, PIECE_CI } from '../constants.js';
import { colorToEmoji, makeDisabledSet, legacyCopy } from '../utils.js';

export default function GameOver({ state, dispatch, settings }) {
  const [lbl, setLbl] = useState('결과 공유');
  const { gameWinner, gameOverReason, board, boardRows, boardCols, boardSize, turnCount, pieceBoard, disabledCells } = state;
  const { playerNames, playerColors, blockColorMode } = settings;
  const maxTurns = Math.floor(((boardRows * boardCols) - (disabledCells?.length || 0)) / 4);

  if (gameWinner === null) return null;

  const disabledSet = makeDisabledSet(disabledCells);

  const share = () => {
    let boardStr, legend = '';
    if (blockColorMode === 'piece') {
      boardStr = board.map((row, r) => row.map((v, c) => {
        if (disabledSet && disabledSet.has(r+','+c)) return '🔳';
        if (v === 0) return '⬜';
        const pi = pieceBoard[r][c];
        return v === 1 ? PIECE_SQ[pi >= 0 ? pi : 0] : PIECE_CI[pi >= 0 ? pi : 0];
      }).join('')).join('\n');
    } else {
      const E = ['⬜', colorToEmoji(playerColors[0]), colorToEmoji(playerColors[1])];
      boardStr = board.map((row, r) => row.map((v, c) => {
        if (disabledSet && disabledSet.has(r+','+c)) return '🔳';
        return E[v];
      }).join('')).join('\n');
    }
    const sizeStr = boardRows === boardCols ? `${boardSize}×${boardSize}` : `${boardCols}×${boardRows}`;
    const text = [
      '🎮 미노 게임 결과',
      `선공: ${playerNames[0]}  후공: ${playerNames[1]}`,
      `보드: ${sizeStr} | ${turnCount}/${maxTurns}턴`,
      `${playerNames[gameWinner]} 승리! 🏆`,
      '', boardStr + legend,
    ].join('\n');
    const done = () => { setLbl('✓ 복사됨!'); setTimeout(() => setLbl('결과 공유'), 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text, done));
    else legacyCopy(text, done);
  };

  return (
    <div className="game-over-overlay">
      <h2 className="winner-text" style={{ color: playerColors[gameWinner] }}>{playerNames[gameWinner]} 승리!</h2>
      <p className="loser-text">{gameOverReason}</p>
      <div className="gameover-btns">
        <button className="go-btn restart-btn" onClick={() => dispatch({ type: 'INIT' })}>다시 시작</button>
        <button className="go-btn share-btn"   onClick={share}>{lbl}</button>
      </div>
    </div>
  );
}
