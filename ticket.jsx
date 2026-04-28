// Shareable ticket — social-friendly result card branded with Sick The Magazine
// Renders as an overlay; can be screenshotted by the user

const { useState: useTicketState } = React;

function ShareTicket({ open, reactionMs, opponentMs, bestMs, result, opponent, round, onClose }) {
  const [copied, setCopied] = useTicketState(false);
  if (!open) return null;

  const isFoul = result === 'foul';
  const won = result === 'win';

  const verdict = isFoul ? 'RED LIGHT' : (won ? 'WIN' : 'LOSS');
  const verdictColor = isFoul ? '#ff2030' : (won ? '#3aff7c' : '#ff6a1f');

  const margin = (!isFoul && reactionMs != null && opponentMs != null)
    ? ((reactionMs - opponentMs) / 1000).toFixed(3)
    : null;

  const date = new Date();
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const ticketId = `TK-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

  const shareText = isFoul
    ? `I jumped the tree on Sick Drag Race Reaction. RED LIGHT. Beat me: ${window.location.href}`
    : `${won ? 'Took out' : 'Lost to'} ${opponent.name} — ${reactionMs.toFixed(0)}ms reaction on Sick Drag Race Reaction. Race me: ${window.location.href}`;

  const handleShare = async () => {
    const shareData = {
      title: 'Sick Drag Race Reaction',
      text: shareText,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare?.(shareData) !== false) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      // user cancelled or unsupported — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // last fallback: select the text via prompt
      window.prompt('Copy your race result:', shareText);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.86)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadein 240ms ease-out',
      }}
    >
      {/* hint */}
      <div style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 9, color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 14,
      }}>YOUR DRAG RACE TICKET</div>

      {/* TICKET */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          background: '#fff7ec',
          color: '#1a0e02',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,106,31,0.2)',
          fontFamily: '"Anton", Impact, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* top punched edge */}
        <PerforatedEdge color="#fff7ec" pos="top" />

        {/* HEADER */}
        <div style={{
          padding: '20px 18px 14px',
          background: '#ff6a1f',
          color: '#fff7ec',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, marginBottom: 8,
          }}>
            <img src="assets/sick-logo.png" alt="Sick The Magazine"
              style={{ height: 64, width: 64, filter: 'brightness(0) invert(1)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                opacity: 0.85,
              }}>TICKET · {ticketId}</div>
              <div style={{
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                opacity: 0.7, marginTop: 2,
              }}>{dateStr} · {timeStr}</div>
            </div>
          </div>
          <div style={{
            fontSize: 38, lineHeight: 0.9, letterSpacing: '0.02em',
            marginTop: 4,
          }}>DRAG RACE</div>
          <div style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
            marginTop: 6, opacity: 0.85,
          }}>REACTION · ROUND {String(round).padStart(2, '0')}</div>
        </div>

        {/* VERDICT BAND */}
        <div style={{
          padding: '20px 18px 16px',
          textAlign: 'center',
          borderBottom: '2px dashed rgba(255,106,31,0.3)',
          background: 'linear-gradient(180deg, #fff7ec 0%, #ffe8d2 100%)',
        }}>
          <div style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
            color: 'rgba(26,14,2,0.55)',
          }}>VERDICT</div>
          <div style={{
            fontSize: 64, lineHeight: 0.9, letterSpacing: '0.02em',
            color: verdictColor,
            textShadow: `0 2px 0 rgba(0,0,0,0.08)`,
            marginTop: 4,
          }}>{verdict}</div>
          {!isFoul && (
            <div style={{
              fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              fontSize: 14, fontWeight: 700,
              color: 'rgba(26,14,2,0.7)',
              marginTop: 6, fontVariantNumeric: 'tabular-nums',
            }}>{(reactionMs / 1000).toFixed(3)}s</div>
          )}
        </div>

        {/* STATS */}
        <div style={{
          padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <TicketRow label="REACTION" value={isFoul ? 'FOUL' : `${reactionMs.toFixed(0)} ms`} />
          <TicketRow label="OPPONENT" value={`${opponent.name} · ${opponentMs?.toFixed(0) ?? '—'} ms`} />
          {!isFoul && margin && (
            <TicketRow
              label="MARGIN"
              value={`${margin}s`}
              valueColor={won ? '#0a8844' : '#ff6a1f'}
            />
          )}
          <TicketRow label="PERSONAL BEST" value={bestMs != null ? `${bestMs.toFixed(0)} ms` : '—'} />
        </div>

        {/* perforated divider */}
        <div style={{
          height: 0,
          borderTop: '2px dashed rgba(255,106,31,0.4)',
          margin: '0 12px',
        }} />

        {/* STUB */}
        <div style={{
          padding: '14px 18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
              color: 'rgba(26,14,2,0.55)',
            }}>POWERED BY</div>
            <div style={{
              fontSize: 22, lineHeight: 0.9, color: '#ff6a1f',
              marginTop: 4, letterSpacing: '0.02em',
            }}>SICK THE MAG</div>
          </div>
          {/* fake barcode */}
          <Barcode />
        </div>

        {/* bottom punched edge */}
        <PerforatedEdge color="#fff7ec" pos="bottom" />
      </div>

      {/* share + close */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18, width: 320 }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          style={{
            flex: 1,
            background: copied ? '#3aff7c' : '#ff6a1f',
            color: copied ? '#0a0a0a' : '#fff',
            border: 'none',
            borderRadius: 10, padding: '14px 16px',
            fontFamily: 'Impact, "Anton", sans-serif',
            fontSize: 16, letterSpacing: '0.12em',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8,
            boxShadow: '0 6px 18px rgba(255,106,31,0.4)',
            transition: 'background 200ms',
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              COPIED!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              SHARE
            </>
          )}
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10, padding: '14px 18px',
            fontFamily: 'Impact, "Anton", sans-serif',
            fontSize: 14, letterSpacing: '0.12em',
            cursor: 'pointer',
          }}
        >CLOSE</button>
      </div>

      <div style={{
        marginTop: 10,
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 8, color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        textAlign: 'center',
      }}>OR SCREENSHOT THE TICKET</div>
    </div>
  );
}

function TicketRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
        color: 'rgba(26,14,2,0.55)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 13, fontWeight: 700,
        color: valueColor || '#1a0e02',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
      }}>{value}</span>
    </div>
  );
}

function PerforatedEdge({ color, pos }) {
  // a row of small semi-circle notches simulating a torn ticket edge
  const dots = Array.from({ length: 14 }).map((_, i) => i);
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0,
      [pos]: -6,
      height: 12,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {dots.map(i => (
        <div key={i} style={{
          width: 12, height: 12, borderRadius: '50%',
          background: '#000',
          opacity: 0.86,
        }} />
      ))}
    </div>
  );
}

function Barcode() {
  // pseudo barcode — random width black bars
  const bars = [2,1,3,1,2,4,1,2,1,3,2,1,4,2,1,3,1,2,1,4,2,1,3];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 36 }}>
      {bars.map((w, i) => (
        <div key={i} style={{
          width: w, height: '100%', background: '#1a0e02',
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { ShareTicket });
