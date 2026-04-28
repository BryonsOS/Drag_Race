// Main game app — state machine + UI

const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vibe": "gritty",
  "timeOfDay": "night",
  "treeStyle": "pro",
  "vehicleColor": "orange",
  "showOpponent": true,
  "difficulty": "normal",
  "cameraAngle": "windshield",
  "accentHue": 25
}/*EDITMODE-END*/;

// Game state machine
// idle -> prestage -> staging -> tree (amber1/2/3) -> green -> result
//                                       \-> red (jumped)
//                                                       \-> result

const STATES = {
  IDLE: 'idle',
  PRESTAGE: 'prestage',
  STAGE: 'stage',
  AMBER1: 'amber1',
  AMBER2: 'amber2',
  AMBER3: 'amber3',
  GREEN: 'green',
  RED: 'red',
  RESULT: 'result',
};

const OPPONENTS = [
  { name: 'DEX_07',     car: '69 CAMARO',    color: '#ff3344', color2: '#aa1122', initial: 'D', skill: 0.45 },
  { name: 'NIGHTSHADE', car: 'FOXBODY 5.0',  color: '#7a3dff', color2: '#3d1a99', initial: 'N', skill: 0.32 },
  { name: 'WHEELIE_K',  car: '70 CHARGER',   color: '#3aff7c', color2: '#1a8844', initial: 'W', skill: 0.55 },
  { name: 'ASH_RX',     car: 'NEW EDGE GT',  color: '#ffcc00', color2: '#aa8800', initial: 'A', skill: 0.40 },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = useState(STATES.IDLE);
  const [reactionMs, setReactionMs] = useState(null);
  const [opponentMs, setOpponentMs] = useState(null);
  const [tapResult, setTapResult] = useState(null); // 'win' | 'lose' | 'foul'
  const [showTicket, setShowTicket] = useState(false);
  const [bestMs, setBestMs] = useState(() => {
    const saved = localStorage.getItem('treekill_best');
    return saved ? parseFloat(saved) : null;
  });
  // Last 10 attempts (most recent first)
  const [history, setHistory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('treekill_history') || '[]');
      return Array.isArray(saved) ? saved.slice(0, 10) : [];
    } catch { return []; }
  });
  // Local leaderboard — top 10 fastest valid (non-foul) reactions on this device
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('treekill_leaderboard') || '[]');
      return Array.isArray(saved) ? saved.slice(0, 10) : [];
    } catch { return []; }
  });
  const [showStats, setShowStats] = useState(false);
  const [round, setRound] = useState(1);
  const [opponent, setOpponent] = useState(OPPONENTS[0]);

  // Helpers — persist to localStorage
  const recordRun = useCallback((entry) => {
    // entry: { ms: number, result: 'win'|'lose'|'foul', opponent: string, ts: number }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 10);
      try { localStorage.setItem('treekill_history', JSON.stringify(next)); } catch {}
      return next;
    });
    if (entry.result !== 'foul' && entry.ms > 0) {
      setLeaderboard(prev => {
        const next = [...prev, entry]
          .sort((a, b) => a.ms - b.ms)
          .slice(0, 10);
        try { localStorage.setItem('treekill_leaderboard', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, []);

  const greenTimeRef = useRef(null);
  const timersRef = useRef([]);

  // difficulty -> reaction window pre-amber delay variance
  const diffConfig = {
    easy:   { preDelay: [600, 900],  ambGap: 500, opAvg: 320 },
    normal: { preDelay: [800, 1400], ambGap: 400, opAvg: 220 },
    hard:   { preDelay: [1100, 2200], ambGap: 280, opAvg: 160 },
  }[t.difficulty];

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const startRun = useCallback(() => {
    clearTimers();
    setReactionMs(null);
    setOpponentMs(null);
    setTapResult(null);
    greenTimeRef.current = null;

    // pick a fresh opponent
    setOpponent(OPPONENTS[(round - 1) % OPPONENTS.length]);

    // sequence: prestage -> stage (200) -> wait (preDelay) -> A1 -> A2 -> A3 -> green
    setState(STATES.PRESTAGE);
    timersRef.current.push(setTimeout(() => setState(STATES.STAGE), 350));
    const preDelay = diffConfig.preDelay[0] + Math.random() * (diffConfig.preDelay[1] - diffConfig.preDelay[0]);

    timersRef.current.push(setTimeout(() => setState(STATES.AMBER1), 350 + preDelay));
    timersRef.current.push(setTimeout(() => setState(STATES.AMBER2), 350 + preDelay + diffConfig.ambGap));
    timersRef.current.push(setTimeout(() => setState(STATES.AMBER3), 350 + preDelay + diffConfig.ambGap * 2));
    timersRef.current.push(setTimeout(() => {
      setState(STATES.GREEN);
      greenTimeRef.current = performance.now();
      // simulate opponent reaction
      const opMs = Math.max(80, diffConfig.opAvg + (Math.random() - 0.5) * 200);
      timersRef.current.push(setTimeout(() => {
        setOpponentMs(opMs);
      }, opMs));
    }, 350 + preDelay + diffConfig.ambGap * 3));
  }, [round, t.difficulty]);

  const handleTap = useCallback(() => {
    if (state === STATES.IDLE || state === STATES.RESULT) {
      setRound(r => state === STATES.RESULT ? r + 1 : r);
      startRun();
      return;
    }
    if (state === STATES.GREEN) {
      const ms = performance.now() - greenTimeRef.current;
      setReactionMs(ms);
      // wait for opponent ms (if not already set)
      const opMs = opponentMs ?? Math.max(80, diffConfig.opAvg + (Math.random() - 0.5) * 200);
      if (opponentMs == null) setOpponentMs(opMs);
      const won = ms < opMs;
      setTapResult(won ? 'win' : 'lose');
      // update best
      if (bestMs == null || ms < bestMs) {
        setBestMs(ms);
        localStorage.setItem('treekill_best', String(ms));
      }
      recordRun({
        ms, result: won ? 'win' : 'lose',
        opponent: opponent.name, opMs, ts: Date.now(),
      });
      clearTimers();
      timersRef.current.push(setTimeout(() => setState(STATES.RESULT), 900));
      return;
    }
    // jumped the start
    if ([STATES.PRESTAGE, STATES.STAGE, STATES.AMBER1, STATES.AMBER2, STATES.AMBER3].includes(state)) {
      clearTimers();
      setState(STATES.RED);
      setTapResult('foul');
      setReactionMs(-1);
      recordRun({
        ms: -1, result: 'foul',
        opponent: opponent.name, opMs: null, ts: Date.now(),
      });
      timersRef.current.push(setTimeout(() => setState(STATES.RESULT), 1100));
      return;
    }
  }, [state, opponentMs, bestMs, startRun, diffConfig.opAvg, opponent.name, recordRun]);

  // tree light state derived from game state
  const treeStage = (() => {
    switch (state) {
      case STATES.IDLE: return 'idle';
      case STATES.PRESTAGE: return 'prestage';
      case STATES.STAGE: return 'stage';
      case STATES.AMBER1: return 'amber1';
      case STATES.AMBER2: return 'amber2';
      case STATES.AMBER3: return 'amber3';
      case STATES.GREEN: return 'green';
      case STATES.RED: return 'red';
      default: return 'idle';
    }
  })();

  const launched = state === STATES.GREEN || state === STATES.RESULT;
  const rpm = state === STATES.GREEN ? 7800 : (state === STATES.AMBER3 ? 7200 : (state === STATES.AMBER1 || state === STATES.AMBER2 ? 6500 : (state === STATES.STAGE || state === STATES.PRESTAGE ? 5500 : 800)));
  const speed = state === STATES.RESULT ? 142 : (launched ? 88 : 0);
  const gear = state === STATES.RESULT ? 4 : (launched ? 2 : 1);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#000', overflow: 'hidden',
      fontFamily: '-apple-system, "SF Pro", system-ui, sans-serif',
    }}>
      {/* Scene */}
      <TrackScene
        vibe={t.vibe}
        launched={launched}
        treeLeft={t.showOpponent ? treeStage : 'idle'}
        treeRight={treeStage}
      />

      {/* Dashboard */}
      <Dashboard
        vibe={t.vibe}
        rpm={rpm}
        speed={speed}
        gear={gear}
        opponent={opponent}
        launched={launched}
      />

      {/* Top HUD: round / best */}
      <TopHUD round={round} bestMs={bestMs} state={state} onShowStats={() => setShowStats(true)} />

      {/* CENTER reaction button — appears once staged */}
      <ReactionButton
        state={state}
        onTap={handleTap}
        vibe={t.vibe}
      />

      {/* Result overlay */}
      {state === STATES.RESULT && (
        <ResultOverlay
          reactionMs={reactionMs}
          opponentMs={opponentMs}
          bestMs={bestMs}
          result={tapResult}
          opponent={opponent}
          onContinue={() => { setRound(r => r + 1); startRun(); }}
          onShare={() => setShowTicket(true)}
        />
      )}

      {/* Shareable ticket overlay */}
      <ShareTicket
        open={showTicket}
        reactionMs={reactionMs}
        opponentMs={opponentMs}
        bestMs={bestMs}
        result={tapResult}
        opponent={opponent}
        round={round}
        onClose={() => setShowTicket(false)}
      />

      {/* Foul flash */}
      {state === STATES.RED && <FoulFlash />}

      {/* Stats overlay (history + leaderboard) */}
      {showStats && (
        <StatsOverlay
          history={history}
          leaderboard={leaderboard}
          bestMs={bestMs}
          onClose={() => setShowStats(false)}
          onClear={() => {
            try {
              localStorage.removeItem('treekill_history');
              localStorage.removeItem('treekill_leaderboard');
            } catch {}
            setHistory([]);
            setLeaderboard([]);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function TopHUD({ round, bestMs, state, onShowStats }) {
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, top: 116,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      zIndex: 16,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <img src="assets/sick-logo.png" alt="Sick"
          style={{ width: 44, height: 44, filter: 'drop-shadow(0 0 6px rgba(255,106,31,0.55))' }} />
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 10 }}>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 8,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em',
          }}>ROUND</div>
          <div style={{
            fontFamily: 'Impact, "Anton", sans-serif', fontSize: 22,
            color: '#fff', lineHeight: 1, letterSpacing: '0.04em',
          }}>{String(round).padStart(2, '0')}</div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onShowStats}
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 8, padding: '6px 10px',
            cursor: 'pointer',
            textAlign: 'right',
          }}
        >
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 8,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em',
          }}>PERSONAL BEST</div>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 16, fontWeight: 700,
            color: '#3aff7c', lineHeight: 1.1, letterSpacing: '0.02em',
            textShadow: '0 0 8px rgba(58,255,124,0.4)',
          }}>{bestMs != null ? `${(bestMs/1000).toFixed(3)}s` : '—.———s'}</div>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 7,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em',
            marginTop: 3,
          }}>TAP · STATS</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ReactionButton({ state, onTap, vibe }) {
  const accent = {
    gritty: '#ff6a1f',
    arcade: '#ff3344',
    synthwave: '#ff1a8c',
  }[vibe];

  let label = 'TAP TO STAGE';
  let color = accent;
  let bg = '#0a0a0a';
  let pulsing = true;
  let active = state === STATES.IDLE;

  if (state === STATES.PRESTAGE) { label = 'STAGING…'; pulsing = false; active = false; }
  if (state === STATES.STAGE)    { label = 'HOLD'; pulsing = false; active = false; color = '#fff'; }
  if (state === STATES.AMBER1 || state === STATES.AMBER2 || state === STATES.AMBER3) {
    label = 'WAIT'; color = '#ffb000'; active = false; pulsing = false;
  }
  if (state === STATES.GREEN) {
    label = 'LAUNCH!'; color = '#3aff7c'; bg = '#001a08'; active = true; pulsing = true;
  }
  if (state === STATES.RED)     { label = 'FOUL'; color = '#ff2030'; bg = '#1a0004'; active = false; }
  if (state === STATES.RESULT)  { return null; }

  // size / position — bottom-center, sits on dashboard above steering wheel
  return (
    <button
      onClick={onTap}
      onTouchStart={(e) => { e.preventDefault(); onTap(); }}
      disabled={state === STATES.PRESTAGE}
      style={{
        position: 'absolute',
        left: '50%', bottom: '12%',
        transform: `translateX(-50%) ${active ? 'scale(1)' : 'scale(0.95)'}`,
        width: 220, height: 84,
        borderRadius: 18,
        border: `2px solid ${color}`,
        background: `radial-gradient(ellipse at center, ${bg} 0%, ${bg} 60%, ${color}22 100%)`,
        color,
        fontFamily: 'Impact, "Anton", sans-serif',
        fontSize: 28, fontWeight: 900,
        letterSpacing: '0.08em',
        cursor: state === STATES.GREEN ? 'pointer' : 'default',
        zIndex: 25,
        boxShadow: active
          ? `0 0 32px ${color}, 0 0 64px ${color}80, inset 0 0 24px ${color}40, 0 8px 24px rgba(0,0,0,0.6)`
          : `0 0 12px ${color}40, inset 0 0 16px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.6)`,
        textShadow: `0 0 12px ${color}`,
        transition: 'all 120ms ease-out',
        animation: pulsing && active ? 'btnpulse 1.2s ease-in-out infinite' : 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
function ResultOverlay({ reactionMs, opponentMs, bestMs, result, opponent, onContinue, onShare }) {
  const isFoul = result === 'foul';
  const won = result === 'win';

  const headline = isFoul ? 'RED LIGHT' : (won ? 'WIN' : 'LOSS');
  const headlineColor = isFoul ? '#ff2030' : (won ? '#3aff7c' : '#ff6a1f');

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'stretch', justifyContent: 'center',
      padding: 24,
      animation: 'fadein 240ms ease-out',
    }}>
      {/* big headline */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: 4,
      }}>
        <img src="assets/sick-logo.png" alt="Sick"
          style={{ width: 110, height: 110, marginBottom: 4, opacity: 0.98,
            filter: 'drop-shadow(0 0 16px rgba(255,106,31,0.6))' }} />
        <div style={{
          fontFamily: 'Impact, "Anton", sans-serif',
          fontSize: 84, fontWeight: 900, lineHeight: 0.9,
          color: headlineColor, textAlign: 'center',
          letterSpacing: '0.02em',
          textShadow: `0 0 24px ${headlineColor}80, 0 0 48px ${headlineColor}40`,
        }}>{headline}</div>
      </div>

      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10,
        color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em',
        textAlign: 'center', textTransform: 'uppercase',
        marginBottom: 28,
      }}>
        {isFoul ? '— DISQUALIFIED · JUMPED THE TREE —' : (won ? '— FIRST OFF THE LINE —' : '— BEATEN AT THE TREE —')}
      </div>

      {/* lane comparison */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        marginBottom: 18,
      }}>
        <LaneCard
          label="LANE 1"
          name={opponent.name}
          ms={opponentMs}
          color={opponent.color}
          highlight={!won && !isFoul}
        />
        <LaneCard
          label="LANE 2"
          name="YOU"
          ms={isFoul ? null : reactionMs}
          color="#3aff7c"
          highlight={won}
          foul={isFoul}
        />
      </div>

      {/* details */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 8,
        marginBottom: 18,
      }}>
        <DetailRow label="Reaction" value={isFoul ? 'FOUL' : `${reactionMs.toFixed(0)} ms`} mono />
        <DetailRow label="Margin" value={
          isFoul ? '—' : `${(((reactionMs ?? 0) - (opponentMs ?? 0)) / 1000).toFixed(3)}s`
        } mono color={won ? '#3aff7c' : '#ff6a1f'} />
        <DetailRow label="Personal best" value={bestMs != null ? `${bestMs.toFixed(0)} ms` : '—'} mono />
        {!isFoul && reactionMs === bestMs && (
          <div style={{
            fontFamily: 'Impact, sans-serif', fontSize: 13,
            color: '#ffcc00', textAlign: 'center', marginTop: 4,
            letterSpacing: '0.1em', textShadow: '0 0 8px rgba(255,204,0,0.6)',
          }}>★ NEW PERSONAL BEST ★</div>
        )}
      </div>

      {/* continue */}
      <button
        onClick={onContinue}
        style={{
          background: '#fff', color: '#000',
          border: 'none', borderRadius: 12,
          padding: '16px 24px',
          fontFamily: 'Impact, "Anton", sans-serif',
          fontSize: 22, fontWeight: 900, letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(255,255,255,0.2)',
        }}
      >RE-RACE →</button>

      {/* share ticket */}
      <button
        onClick={onShare}
        style={{
          background: 'transparent',
          color: '#ff6a1f',
          border: '1.5px solid #ff6a1f',
          borderRadius: 12,
          padding: '12px 24px',
          marginTop: 10,
          fontFamily: 'Impact, "Anton", sans-serif',
          fontSize: 16, fontWeight: 900, letterSpacing: '0.12em',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        SHARE TICKET
      </button>

      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'transparent', color: 'rgba(255,255,255,0.6)',
          border: 'none', marginTop: 10,
          fontFamily: 'ui-monospace, monospace', fontSize: 11,
          letterSpacing: '0.1em',
        }}
      >FIND NEW OPPONENT</button>
    </div>
  );
}

function LaneCard({ label, name, ms, color, highlight, foul }) {
  return (
    <div style={{
      background: highlight ? `${color}1f` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? color : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 10, padding: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {highlight && <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: color, boxShadow: `0 0 12px ${color}`,
      }} />}
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 9,
        color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Impact, "Anton", sans-serif', fontSize: 16,
        color: '#fff', letterSpacing: '0.04em', marginTop: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</div>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 24,
        color: foul ? '#ff2030' : (highlight ? color : '#fff'),
        letterSpacing: '0.02em', marginTop: 6,
        textShadow: highlight ? `0 0 8px ${color}40` : 'none',
      }}>{foul ? 'FOUL' : (ms != null ? `${ms.toFixed(0)}` : '—')}<span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>ms</span></div>
    </div>
  );
}

function DetailRow({ label, value, mono, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10,
        color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: mono ? 'ui-monospace, monospace' : 'Impact, sans-serif',
        fontSize: 14, fontWeight: 700, color: color || '#fff',
      }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function StatsOverlay({ history, leaderboard, bestMs, onClose, onClear }) {
  const [tab, setTab] = useState('leaderboard');
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.84)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        padding: 22, paddingTop: 60,
        animation: 'fadein 220ms ease-out',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'contents' }}>
        {/* header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            fontFamily: 'Impact, "Anton", sans-serif',
            fontSize: 28, color: '#fff',
            letterSpacing: '0.04em',
          }}>YOUR STATS</div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 8, padding: '6px 12px',
              color: '#fff', fontFamily: 'ui-monospace, monospace',
              fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer',
            }}
          >CLOSE</button>
        </div>

        {/* big PB */}
        <div style={{
          background: 'rgba(58,255,124,0.08)',
          border: '1px solid rgba(58,255,124,0.3)',
          borderRadius: 10, padding: '12px 14px',
          marginBottom: 12,
        }}>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 9,
            color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em',
          }}>PERSONAL BEST</div>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 32, fontWeight: 700,
            color: '#3aff7c',
            textShadow: '0 0 12px rgba(58,255,124,0.5)',
            fontVariantNumeric: 'tabular-nums',
          }}>{bestMs != null ? `${(bestMs/1000).toFixed(3)}s` : '—.———s'}</div>
        </div>

        {/* tabs */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 12,
        }}>
          {[
            { id: 'leaderboard', label: 'LEADERBOARD' },
            { id: 'history', label: 'RECENT' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTab(opt.id)}
              style={{
                flex: 1,
                background: tab === opt.id ? '#ff6a1f' : 'rgba(255,255,255,0.06)',
                color: tab === opt.id ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
                border: '1px solid ' + (tab === opt.id ? '#ff6a1f' : 'rgba(255,255,255,0.12)'),
                borderRadius: 8, padding: '10px 12px',
                fontFamily: 'Impact, "Anton", sans-serif',
                fontSize: 14, letterSpacing: '0.14em',
                cursor: 'pointer',
              }}
            >{opt.label}</button>
          ))}
        </div>

        {/* list */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: 8,
        }}>
          {tab === 'leaderboard' ? (
            leaderboard.length === 0 ? (
              <EmptyState text="No clean runs yet. Win some!" />
            ) : (
              leaderboard.map((e, i) => (
                <StatRow key={e.ts}
                  rank={i + 1}
                  ms={e.ms}
                  result={e.result}
                  opponent={e.opponent}
                  ts={e.ts}
                  highlight={e.ms === bestMs}
                />
              ))
            )
          ) : (
            history.length === 0 ? (
              <EmptyState text="Nothing yet. Race!" />
            ) : (
              history.map((e, i) => (
                <StatRow key={e.ts}
                  rank={null}
                  ms={e.ms}
                  result={e.result}
                  opponent={e.opponent}
                  ts={e.ts}
                />
              ))
            )
          )}
        </div>

        {/* clear */}
        {(history.length > 0 || leaderboard.length > 0) && (
          <button
            onClick={onClear}
            style={{
              marginTop: 12,
              background: 'transparent', color: 'rgba(255,80,80,0.7)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 8, padding: '8px 12px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10, letterSpacing: '0.18em',
              cursor: 'pointer',
            }}
          >CLEAR ALL DATA</button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      padding: 24, textAlign: 'center',
      fontFamily: 'ui-monospace, monospace', fontSize: 11,
      color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em',
    }}>{text}</div>
  );
}

function StatRow({ rank, ms, result, opponent, ts, highlight }) {
  const isFoul = result === 'foul';
  const won = result === 'win';
  const color = isFoul ? '#ff2030' : (won ? '#3aff7c' : 'rgba(255,255,255,0.85)');
  const date = new Date(ts);
  const ago = formatAgo(ts);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: highlight ? 'rgba(58,255,124,0.06)' : 'transparent',
    }}>
      {rank != null && (
        <div style={{
          fontFamily: 'Impact, sans-serif', fontSize: 18,
          color: rank === 1 ? '#ffcc00' : (rank <= 3 ? '#ff6a1f' : 'rgba(255,255,255,0.4)'),
          width: 28, textAlign: 'center',
        }}>{rank}</div>
      )}
      <div style={{
        width: 8, height: 8, borderRadius: 4,
        background: color, boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Impact, "Anton", sans-serif', fontSize: 14,
          color: '#fff', letterSpacing: '0.04em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isFoul ? 'FOUL · jumped the start' : `vs ${opponent}`}
        </div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 9,
          color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em',
          marginTop: 1,
        }}>{ago}</div>
      </div>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 16,
        color, fontVariantNumeric: 'tabular-nums',
      }}>{isFoul ? 'FOUL' : `${ms.toFixed(0)}ms`}</div>
    </div>
  );
}

function formatAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─────────────────────────────────────────────────────────────
function FoulFlash() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'radial-gradient(circle at center, rgba(255,32,48,0.4) 0%, rgba(255,32,48,0.15) 50%, transparent 100%)',
      animation: 'foulflash 1.1s ease-out',
      pointerEvents: 'none',
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────
function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #181818 0%, #050505 100%)',
      overflow: 'hidden',
    }}>
      <IOSDevice width={390} height={844} dark={true}>
        <App />
      </IOSDevice>
      <TweaksPanel>
        <TweakSection label="Visual vibe" />
        <TweakRadio label="Style" value={t.vibe}
          options={['gritty', 'arcade', 'synthwave']}
          onChange={(v) => setTweak('vibe', v)} />
        <TweakRadio label="Time" value={t.timeOfDay}
          options={['day', 'night']}
          onChange={(v) => setTweak('timeOfDay', v)} />
        <TweakSection label="Race" />
        <TweakRadio label="Difficulty" value={t.difficulty}
          options={['easy', 'normal', 'hard']}
          onChange={(v) => setTweak('difficulty', v)} />
        <TweakToggle label="Show opponent" value={t.showOpponent}
          onChange={(v) => setTweak('showOpponent', v)} />
        <TweakSection label="Hardware" />
        <TweakSelect label="Vehicle color" value={t.vehicleColor}
          options={['orange', 'midnight', 'lime', 'crimson']}
          onChange={(v) => setTweak('vehicleColor', v)} />
        <TweakRadio label="Camera" value={t.cameraAngle}
          options={['windshield', 'hood', 'chase']}
          onChange={(v) => setTweak('cameraAngle', v)} />
        <TweakSection label="Reset" />
        <TweakButton label="Clear personal best"
          onClick={() => { localStorage.removeItem('treekill_best'); window.location.reload(); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
