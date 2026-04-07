import { getShape, hasAnyValidMove, makeDisabledSet } from './utils.js';

export function makeInitial(size, rows, cols, disabled) {
  const R = rows || size, C = cols || size, dis = disabled || [];
  return {
    boardSize: size,
    boardRows: R,
    boardCols: C,
    disabledCells: dis,
    board:      Array.from({ length: R }, () => Array(C).fill(0)),
    pieceBoard: Array.from({ length: R }, () => Array(C).fill(-1)),
    currentPlayer: 0,
    selectedIdx: 0,
    rotation: 0,
    hoverCell: null,
    turnCount: 0,
    gameWinner: null,
    gameOverReason: '',
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return makeInitial(state.boardSize, state.boardRows, state.boardCols, state.disabledCells);
    case 'RESIZE':
      return makeInitial(action.size);
    case 'RESIZE_CUSTOM':
      return makeInitial(action.size || 7, action.rows, action.cols, action.disabled || []);
    case 'HOVER':
      return { ...state, hoverCell: action.cell };
    case 'ROTATE':
      return { ...state, rotation: (state.rotation + 1) % 4 };
    case 'TOGGLE_PIECE':
      if (action.idx === state.selectedIdx)
        return { ...state, rotation: (state.rotation + 1) % 4 };
      return { ...state, selectedIdx: action.idx, rotation: 0 };
    case 'NEXT_PIECE':
      return { ...state, selectedIdx: (state.selectedIdx + 1) % 7, rotation: 0 };
    case 'PLACE': {
      const shape = getShape(state.selectedIdx, state.rotation);
      const nb  = state.board.map(row => [...row]);
      const npb = state.pieceBoard.map(row => [...row]);
      for (let dr = 0; dr < shape.length; dr++)
        for (let dc = 0; dc < shape[dr].length; dc++)
          if (shape[dr][dc]) {
            nb[action.r + dr][action.c + dc]  = state.currentPlayer + 1;
            npb[action.r + dr][action.c + dc] = state.selectedIdx;
          }
      const next = 1 - state.currentPlayer;
      const dis  = makeDisabledSet(state.disabledCells);
      const ok   = hasAnyValidMove(nb, state.boardRows, state.boardCols, dis);
      const names = action.names || ['플레이어 1', '플레이어 2'];
      return {
        ...state,
        board: nb,
        pieceBoard: npb,
        turnCount: state.turnCount + 1,
        currentPlayer: next,
        rotation: 0,
        hoverCell: null,
        gameWinner: ok ? null : state.currentPlayer,
        gameOverReason: ok ? '' : `${names[next]}이(가) 더 이상 미노를 놓을 수 없습니다.`,
      };
    }
    case 'COMPUTER_PLACE': {
      const shape = getShape(action.pi, action.rot);
      const nb  = state.board.map(row => [...row]);
      const npb = state.pieceBoard.map(row => [...row]);
      for (let dr = 0; dr < shape.length; dr++)
        for (let dc = 0; dc < shape[dr].length; dc++)
          if (shape[dr][dc]) {
            nb[action.r + dr][action.c + dc]  = state.currentPlayer + 1;
            npb[action.r + dr][action.c + dc] = action.pi;
          }
      const next = 1 - state.currentPlayer;
      const dis  = makeDisabledSet(state.disabledCells);
      const ok   = hasAnyValidMove(nb, state.boardRows, state.boardCols, dis);
      const names = action.names || ['플레이어 1', '플레이어 2'];
      return {
        ...state,
        board: nb,
        pieceBoard: npb,
        turnCount: state.turnCount + 1,
        currentPlayer: next,
        selectedIdx: action.pi,
        rotation: action.rot,
        hoverCell: null,
        gameWinner: ok ? null : state.currentPlayer,
        gameOverReason: ok ? '' : `${names[next]}이(가) 더 이상 미노를 놓을 수 없습니다.`,
      };
    }
    case 'FORFEIT': {
      const names = action.names || ['플레이어 1', '플레이어 2'];
      return {
        ...state,
        gameWinner: 1 - state.currentPlayer,
        gameOverReason: `${names[state.currentPlayer]}이(가) 기권했습니다.`,
      };
    }
    case 'DECLARE_WIN': {
      const names = action.names || ['플레이어 1', '플레이어 2'];
      return {
        ...state,
        gameWinner: state.currentPlayer,
        gameOverReason: `${names[state.currentPlayer]}의 승리가 확정되었습니다.`,
      };
    }
    default:
      return state;
  }
}
