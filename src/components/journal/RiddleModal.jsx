import { RIDDLES } from '../../data/riddles'

export default function RiddleModal({
  activeSpot,
  solvedRiddles,
  riddleAnswer,
  riddleError,
  riddleHints,
  hintLoading,
  purchasedItems,
  onAnswer,
  onRequestHint,
  onClose
}) {
  if (!activeSpot) return null
  const riddle = RIDDLES[activeSpot.id]
  if (!riddle) return null

  return (
    <>
      <div className="jn-overlay" onClick={onClose} />
      <div 
        className="jn-bottom-sheet" 
        role="dialog" 
        aria-modal="true" 
        aria-label={`Riddle for ${activeSpot.name}`}
      >
        <div className="jn-sheet-handle" />
        <div className="jn-sheet-inner">
          <div className="jn-sheet-header">
            <div>
              <span className="jn-tag jn-tag--red" style={{ marginBottom: '4px' }}>Riddle</span>
              <h3 style={{ fontFamily: 'var(--bp-font-display)', fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                {activeSpot.name}
              </h3>
            </div>
            <button className="jn-icon-btn" onClick={onClose} aria-label="Close sheet">✕</button>
          </div>

          <blockquote className="jn-riddle-question">
            "{riddle.question}"
          </blockquote>

          {solvedRiddles[activeSpot.id] ? (
            <div className="jn-insider-reveal">
              <span className="jn-tag jn-tag--green" style={{ marginBottom: '8px' }}>✓ Solved (+35 XP)</span>
              <strong style={{ color: 'var(--bp-primary)', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Discovery Secret:</strong>
              <p>
                {riddle.insider}
              </p>
            </div>
          ) : (
            <div className="jn-choices">
              {riddle.options.map((opt, idx) => {
                const isSelected = riddleAnswer === idx;
                const isCorrect = riddle.correct === idx;
                const isWrong = riddleAnswer !== null && isSelected && !isCorrect;
                
                let btnClass = 'jn-choice-btn';
                if (riddleAnswer !== null) {
                  if (isCorrect) btnClass += ' jn-choice-btn--correct';
                  if (isWrong) btnClass += ' jn-choice-btn--wrong';
                }

                return (
                  <button
                    key={idx}
                    className={btnClass}
                    onClick={() => onAnswer(idx)}
                    disabled={riddleAnswer !== null}
                  >
                    <span className="jn-choice-letter">{String.fromCharCode(65 + idx)}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}

              {riddleError && (
                <p className="jn-error-hint">
                  ❌ {riddleError}
                </p>
              )}

              {/* Hint System */}
              <div style={{ marginTop: '12px' }}>
                {riddleHints[activeSpot.id] ? (
                  <div className="jn-insider-reveal" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', margin: 0, padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ color: '#D97706', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>💡 Clue:</strong>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '12px', lineHeight: '1.4' }}>
                      {riddleHints[activeSpot.id]}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => onRequestHint(activeSpot.id)}
                    disabled={hintLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--bp-primary)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--bp-font-body)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: hintLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 0',
                      opacity: hintLoading ? 0.6 : 1
                    }}
                  >
                    {hintLoading ? '🧙‍♂️ Consulting elders...' : (purchasedItems['riddle-hint'] || 0) > 0 ? `📜 Use Clue Scroll (${purchasedItems['riddle-hint']} left)` : '✨ Request Hint (150 Fils)'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
