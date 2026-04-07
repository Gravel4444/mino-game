import { useState } from 'react';
import { COLOR_OPTIONS } from '../constants.js';
import { getEffectiveColor } from '../utils.js';
import CustomBoardEditor from './CustomBoardEditor.jsx';

export default function SettingsScreen({ settings, onSave, onBack }) {
  const [draft, setDraft] = useState({
    ...settings,
    playerNames:  [...settings.playerNames],
    playerColors: [...settings.playerColors],
    isComputer:   [...(settings.isComputer || [false, false])],
  });
  const [boardMode,   setBoardMode]   = useState(settings.boardMode || 'preset');
  const [customBoard, setCustomBoard] = useState(settings.customBoard || { w: 7, h: 7, disabled: [] });

  const setName  = (i, v) => setDraft(d => { const n = [...d.playerNames];  n[i] = v; return { ...d, playerNames: n }; });
  const setColor = (i, v) => setDraft(d => { const c = [...d.playerColors]; c[i] = v; return { ...d, playerColors: c }; });

  const toggleComputer = (i) => {
    setDraft(d => {
      const ic = [...d.isComputer]; ic[i] = !ic[i];
      const names = [...d.playerNames];
      if (ic[i]) names[i] = i === 0 ? '컴퓨터 선공' : '컴퓨터 후공';
      else        names[i] = i === 0 ? '플레이어 1'  : '플레이어 2';
      return { ...d, isComputer: ic, playerNames: names };
    });
  };

  const handleSave = () => {
    const saved = {
      ...draft, boardMode,
      boardSize:   boardMode === 'custom' ? Math.max(customBoard.w, customBoard.h) : draft.boardSize,
      customBoard: boardMode === 'custom' ? customBoard : null,
    };
    onSave(saved);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-wrap">
        <header className="settings-header">
          <button className="settings-back-btn" onClick={onBack}>← 뒤로가기</button>
          <span className="settings-title">게임 설정</span>
          <button className="settings-save-btn" onClick={handleSave}>💾 저장하기</button>
        </header>
        <div className="settings-body">

          {/* 플레이어 설정 */}
          <section className="settings-section">
            <h3 className="settings-section-title">플레이어 설정</h3>
            {[0, 1].map(i => (
              <div key={i} className="player-setting-row">
                <span className="player-setting-label" style={{ color: getEffectiveColor(draft.playerColors[i], draft.darkMode !== false) }}>
                  {i === 0 ? '선공' : '후공'}
                </span>
                <input
                  className="player-name-input"
                  value={draft.playerNames[i]}
                  disabled={draft.isComputer[i]}
                  onChange={e => setName(i, e.target.value)}
                  maxLength={12}
                  placeholder={`플레이어 ${i + 1}`}
                />
                <button
                  className={`computer-toggle${draft.isComputer[i] ? ' active' : ''}`}
                  onClick={() => toggleComputer(i)}
                >
                  💻 {draft.isComputer[i] ? '컴퓨터' : '사람'}
                </button>
                <div className="color-swatches">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`color-swatch${draft.playerColors[i] === opt.value ? ' selected' : ''}`}
                      onClick={() => setColor(i, opt.value)}
                      title={opt.value}
                    >
                      {opt.value === 'monotone' ? (draft.darkMode !== false ? '⬜' : '⬛') : opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* 보드 크기 */}
          <section className="settings-section">
            <h3 className="settings-section-title">보드 크기</h3>
            <div className="settings-size-grid">
              {[4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  className={`settings-size-btn${boardMode === 'preset' && draft.boardSize === n ? ' active' : ''}`}
                  onClick={() => { setBoardMode('preset'); setDraft(d => ({ ...d, boardSize: n })); }}
                >
                  {n}×{n}
                </button>
              ))}
              <button
                className={`settings-size-btn${boardMode === 'custom' ? ' active' : ''}`}
                style={{ gridColumn: 'span 2' }}
                onClick={() => setBoardMode('custom')}
              >
                커스텀 보드
              </button>
            </div>
            {boardMode === 'custom' && <CustomBoardEditor value={customBoard} onChange={setCustomBoard} />}
          </section>

          {/* 블럭 색깔 모드 */}
          <section className="settings-section">
            <h3 className="settings-section-title">블럭 색깔</h3>
            <div className="block-mode-options">
              {[
                { val: 'player', title: '플레이어 색깔', desc: '놓은 플레이어의\n색으로 표시' },
                { val: 'piece',  title: '미노 색깔',    desc: '미노 종류별\n고유 색으로 표시' },
              ].map(opt => (
                <button
                  key={opt.val}
                  className={`block-mode-option${draft.blockColorMode === opt.val ? ' selected' : ''}`}
                  onClick={() => setDraft(d => ({ ...d, blockColorMode: opt.val }))}
                >
                  <span className="block-mode-option-title">{opt.title}</span>
                  <span className="block-mode-option-desc" style={{ whiteSpace: 'pre-line' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 화면 설정 */}
          <section className="settings-section">
            <h3 className="settings-section-title">화면 설정</h3>
            <div className="darkmode-row">
              <span className="darkmode-label">🌙 다크모드</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={draft.darkMode !== false}
                  onChange={e => {
                    const v = e.target.checked;
                    setDraft(d => ({ ...d, darkMode: v }));
                    document.body.classList.toggle('light', !v);
                  }}
                />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
