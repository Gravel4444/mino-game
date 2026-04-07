export const PIECES = [
  { name: 'I', shape: [[1,1,1,1]],        color: '#26c6da' },
  { name: 'O', shape: [[1,1],[1,1]],       color: '#fdd835' },
  { name: 'T', shape: [[0,1,0],[1,1,1]],   color: '#ab47bc' },
  { name: 'S', shape: [[0,1,1],[1,1,0]],   color: '#66bb6a' },
  { name: 'Z', shape: [[1,1,0],[0,1,1]],   color: '#ef5350' },
  { name: 'J', shape: [[1,0,0],[1,1,1]],   color: '#42a5f5' },
  { name: 'L', shape: [[0,0,1],[1,1,1]],   color: '#ffa726' },
];

export const RANK_COLORS = ['#ffd700', '#b0bec5', '#cd7f32', '#6e7681', '#4a5568'];

export const COLOR_OPTIONS = [
  { label: '🟥', value: '#e74c3c' },
  { label: '🟧', value: '#e67e22' },
  { label: '🟨', value: '#f1c40f' },
  { label: '🟩', value: '#2ecc71' },
  { label: '🟦', value: '#3498db' },
  { label: '🟪', value: '#9b59b6' },
  { label: '🟫', value: '#795548' },
  { label: '⬜', value: 'monotone' },
];

// 결과 공유용 이모지 (blockColorMode='piece' 시 미노별)
export const PIECE_SQ = ['🟫', '🟨', '🟪', '🟩', '🟥', '🟦', '🟧'];
export const PIECE_CI = ['🟤', '🟡', '🟣', '🟢', '🔴', '🔵', '🟠'];
