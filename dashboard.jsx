// Dashboard HUD — overlays on top of the windshield POV
// - Top: rearview mirror with opponent avatar
// - Bottom: dashboard with tach, speedo, gear; steering wheel cutout
// - Side mirrors

function Dashboard({ vibe, rpm, speed, gear, opponent, launched }) {
  // dashboard color
  const dashColor = {
    gritty: '#0a0a0a',
    arcade: '#1a1218',
    synthwave: '#0a0014',
  }[vibe];

  // brand wrap — also wraps a Sick logo onto the hub
  // (Sick logo is rendered absolute over the steering wheel SVG center)

  return (
    <>
      {/* TOP: rearview mirror */}
      <RearviewMirror opponent={opponent} vibe={vibe} />

      {/* BOTTOM: dashboard */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: '34%',
        background: `
          linear-gradient(180deg, transparent 0%, ${dashColor} 12%, ${dashColor} 100%)
        `,
        zIndex: 10,
      }}>
        {/* dash top edge — windshield reflection */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '12%',
          height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        }} />

        {/* steering wheel — cutout at bottom */}
        <SteeringWheel vibe={vibe} launched={launched} />

        {/* gauges row */}
        <Gauges rpm={rpm} speed={speed} gear={gear} vibe={vibe} />
      </div>

      {/* A-pillars */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: '34%',
        width: '8%',
        background: `linear-gradient(110deg, ${dashColor} 0%, ${dashColor} 60%, transparent 100%)`,
        zIndex: 9,
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: '34%',
        width: '8%',
        background: `linear-gradient(250deg, ${dashColor} 0%, ${dashColor} 60%, transparent 100%)`,
        zIndex: 9,
      }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
function RearviewMirror({ opponent, vibe }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: 56,
      transform: 'translateX(-50%)',
      zIndex: 15,
    }}>
      <div style={{
        background: '#0a0a0a',
        border: '2px solid #1a1a1a',
        borderRadius: 18,
        padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        minWidth: 200,
      }}>
        {/* opponent avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${opponent.color}, ${opponent.color2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 13,
          fontFamily: 'Impact, "Anton", sans-serif',
          letterSpacing: 0.5,
          border: '1.5px solid #2a2a2a',
        }}>{opponent.initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Impact, "Anton", sans-serif',
            fontSize: 13, fontWeight: 700,
            color: '#fff', letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{opponent.name}</div>
          <div style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9, color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.08em',
          }}>{opponent.car} · LANE 1</div>
        </div>
        {/* live indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 6px', borderRadius: 4,
          background: 'rgba(58,255,124,0.12)',
          border: '1px solid rgba(58,255,124,0.4)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#3aff7c',
            boxShadow: '0 0 6px #3aff7c',
            animation: 'livepulse 1.2s infinite',
          }} />
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 8, fontWeight: 700, color: '#3aff7c',
            letterSpacing: '0.1em',
          }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SteeringWheel({ vibe, launched }) {
  const accent = {
    gritty:    '#ff6a1f',
    arcade:    '#ff3344',
    synthwave: '#ff1a8c',
  }[vibe];

  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: -50,
      transform: 'translateX(-50%)',
      width: 360, height: 200,
      pointerEvents: 'none',
    }}>
      <svg width="360" height="200" viewBox="0 0 360 200">
        {/* outer rim */}
        <ellipse cx="180" cy="100" rx="170" ry="78"
          fill="none" stroke="#1a1a1a" strokeWidth="22" />
        <ellipse cx="180" cy="100" rx="170" ry="78"
          fill="none" stroke="#0a0a0a" strokeWidth="14" />
        {/* leather stitching */}
        <ellipse cx="180" cy="100" rx="160" ry="72"
          fill="none" stroke={accent} strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
        {/* spokes */}
        <rect x="60" y="94" width="105" height="14" fill="#1a1a1a" rx="2" />
        <rect x="195" y="94" width="105" height="14" fill="#1a1a1a" rx="2" />
        <rect x="172" y="100" width="16" height="60" fill="#1a1a1a" rx="2" />
        {/* center hub — enlarged */}
        <circle cx="180" cy="100" r="48" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1.5" />
        <circle cx="180" cy="100" r="40" fill="#1a1a1a" />
      </svg>
      {/* Sick logo on hub */}
      <img src="assets/sick-logo.png" alt="Sick"
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 70, height: 70,
          filter: 'drop-shadow(0 0 6px rgba(255,106,31,0.5))',
          opacity: 0.98,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function Gauges({ rpm, speed, gear, vibe }) {
  const accent = {
    gritty:    '#ff6a1f',
    arcade:    '#ffcc00',
    synthwave: '#ff1a8c',
  }[vibe];

  return (
    <div style={{
      position: 'absolute', top: '8%', left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px',
    }}>
      {/* tach */}
      <Gauge label="RPM" value={rpm} max={9000} unit="x1000" divisor={1000} accent={accent} redline={7500} />
      {/* gear indicator */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2,
      }}>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 9,
          color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em',
        }}>GEAR</div>
        <div style={{
          fontFamily: '"Orbitron", "Impact", sans-serif', fontWeight: 900,
          fontSize: 38, color: accent, lineHeight: 1,
          textShadow: `0 0 12px ${accent}, 0 0 24px ${accent}80`,
        }}>{gear}</div>
      </div>
      {/* speedo */}
      <Gauge label="MPH" value={speed} max={180} accent={accent} />
    </div>
  );
}

function Gauge({ label, value, max, unit, divisor = 1, accent, redline }) {
  const pct = Math.min(value / max, 1);
  // arc from -135deg to 135deg (270 deg sweep)
  const startAngle = -225;
  const endAngle = 45;
  const sweep = endAngle - startAngle;
  const r = 38;
  const cx = 50, cy = 50;

  // ticks
  const ticks = Array.from({ length: 11 }).map((_, i) => i / 10);

  // needle angle
  const needleAngle = startAngle + sweep * pct;
  const nx = cx + (r - 4) * Math.cos((needleAngle * Math.PI) / 180);
  const ny = cy + (r - 4) * Math.sin((needleAngle * Math.PI) / 180);

  // redline arc
  const redlinePct = redline ? redline / max : 1;

  const display = divisor === 1
    ? Math.round(value).toString()
    : (value / divisor).toFixed(1);

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* outer ring */}
        <circle cx={cx} cy={cy} r={r + 4} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r} fill="#050505" stroke="#1f1f1f" strokeWidth="1" />

        {/* tick marks */}
        {ticks.map((t, i) => {
          const a = startAngle + sweep * t;
          const a1 = (a * Math.PI) / 180;
          const isRed = redline && t >= redlinePct;
          const isMajor = i % 2 === 0;
          const len = isMajor ? 6 : 3;
          const x1 = cx + (r - 2) * Math.cos(a1);
          const y1 = cy + (r - 2) * Math.sin(a1);
          const x2 = cx + (r - 2 - len) * Math.cos(a1);
          const y2 = cy + (r - 2 - len) * Math.sin(a1);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isRed ? '#ff2030' : (isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)')}
              strokeWidth={isMajor ? 1.5 : 1} />
          );
        })}

        {/* fill arc — show pct */}
        <ArcFill cx={cx} cy={cy} r={r - 12} startAngle={startAngle} sweep={sweep * pct} stroke={accent} />

        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={accent} strokeWidth="2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${accent})` }} />
        <circle cx={cx} cy={cy} r={3} fill={accent} />
        <circle cx={cx} cy={cy} r={1.5} fill="#0a0a0a" />
      </svg>

      {/* digital readout */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '58%',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: '"Orbitron", "Courier New", ui-monospace, monospace',
          fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{display}</div>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 8,
          color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em',
          marginTop: 1,
        }}>{unit || label}</div>
      </div>
    </div>
  );
}

function ArcFill({ cx, cy, r, startAngle, sweep, stroke }) {
  if (sweep <= 0) return null;
  const a0 = (startAngle * Math.PI) / 180;
  const a1 = ((startAngle + sweep) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const largeArc = sweep > 180 ? 1 : 0;
  return (
    <path
      d={`M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`}
      fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
    />
  );
}

Object.assign(window, { Dashboard });
