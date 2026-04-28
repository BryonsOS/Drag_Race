// Windshield POV — full scene with track, tree, opponent lane, dashboard

// ─────────────────────────────────────────────────────────────
// Track / horizon background
// ─────────────────────────────────────────────────────────────
function TrackScene({ vibe, speedLines = 0, launched = false, treeLeft, treeRight }) {
  // vibe: 'gritty' | 'arcade' | 'synthwave'
  const sky = {
    gritty:    'linear-gradient(180deg, #0a0d18 0%, #1a1d28 40%, #2a1f1a 70%, #3a2a1a 100%)',
    arcade:    'linear-gradient(180deg, #ff7a3d 0%, #ffb04a 30%, #ffd96b 55%, #6ec1ff 70%, #4a8fd9 100%)',
    synthwave: 'linear-gradient(180deg, #1a0033 0%, #4a0080 30%, #ff1a8c 60%, #ff6a3d 80%, #ffcc40 100%)',
  }[vibe];

  const groundColor = {
    gritty: '#1a1612',
    arcade: '#3a2a1a',
    synthwave: '#0a0014',
  }[vibe];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: sky,
      overflow: 'hidden',
    }}>
      {/* synthwave grid / arcade clouds / gritty stars */}
      {vibe === 'synthwave' && <SynthGrid />}
      {vibe === 'gritty' && <Stars />}
      {vibe === 'arcade' && <ArcadeBg />}

      {/* horizon line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '52%', height: 1,
        background: vibe === 'synthwave'
          ? 'linear-gradient(90deg, transparent, #ff1a8c, transparent)'
          : 'rgba(255,255,255,0.15)',
        boxShadow: vibe === 'synthwave' ? '0 0 12px #ff1a8c' : 'none',
      }} />

      {/* ground */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '52%', bottom: 0,
        background: groundColor,
      }} />

      {/* the track — perspective trapezoid */}
      <Track vibe={vibe} launched={launched} />

      {/* center wall between lanes */}
      <CenterWall vibe={vibe} />

      {/* tree positioned in right lane */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '24%',
        transform: 'translateX(-50%) scale(0.95)',
        transformOrigin: 'center top',
        zIndex: 5,
      }}>
        <ChristmasTree leftStage={treeLeft} rightStage={treeRight} />
      </div>

      {/* opponent car in left lane */}
      <OpponentCar vibe={vibe} launched={launched} />

      {/* player car in right lane */}
      <PlayerCar vibe={vibe} launched={launched} />

      {/* speed lines when launched */}
      {launched && <SpeedLines />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function Track({ vibe, launched }) {
  const tarmac = {
    gritty: '#15161a',
    arcade: '#2a2025',
    synthwave: '#0a0020',
  }[vibe];

  return (
    <svg style={{
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      width: '100%', height: '100%',
    }} viewBox="0 0 400 700" preserveAspectRatio="none">
      {/* tarmac left lane */}
      <polygon points="20,700 175,364 195,364 100,700" fill={tarmac} />
      {/* tarmac right lane (player) */}
      <polygon points="205,364 225,364 380,700 300,700" fill={tarmac} />

      {/* center wall trapezoid */}
      <polygon points="195,364 205,364 300,700 100,700" fill="#0a0a0a" opacity="0.6" />

      {/* lane edge lines — left */}
      <line x1="20" y1="700" x2="175" y2="364" stroke="#fff" strokeWidth="2" opacity="0.5" />
      <line x1="100" y1="700" x2="195" y2="364" stroke="#fff" strokeWidth="1.5" opacity="0.35" />

      {/* lane edge lines — right */}
      <line x1="205" y1="364" x2="300" y2="700" stroke="#fff" strokeWidth="1.5" opacity="0.35" />
      <line x1="225" y1="364" x2="380" y2="700" stroke="#fff" strokeWidth="2" opacity="0.5" />

      {/* dashed center stripes — animated when launched */}
      <g opacity="0.85">
        {[0, 1, 2, 3, 4].map(i => {
          const t = launched ? ((Date.now() / 60 + i * 100) % 500) / 500 : i / 5;
          // for non-launched, static dashes
          const yProg = i / 5;
          const y1 = 364 + yProg * 336;
          const y2 = y1 + 30;
          if (y2 > 700) return null;
          // perspective — narrow at top
          const xLeft = (175 - (175 - 100) * yProg);  // not used — keep static
          return (
            <g key={i}>
              {/* left lane center dash */}
              <rect
                x={137 + (50 - (50 - 0) * (yProg)) - 1}
                y={y1} width="3" height="20"
                fill="#fff" opacity="0.6"
                transform={`translate(${(yProg * -30)}, 0)`}
              />
            </g>
          );
        })}
      </g>

      {/* finish line in distance */}
      <rect x="170" y="358" width="60" height="3" fill="#fff" opacity="0.3" />

      {/* horizon glow */}
      <ellipse cx="200" cy="364" rx="180" ry="6" fill="#fff" opacity={vibe === 'synthwave' ? 0.0 : 0.08} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
function CenterWall({ vibe }) {
  // a low concrete wall between lanes
  const wall = {
    gritty: '#3a3530',
    arcade: '#5a4a3a',
    synthwave: '#2a1040',
  }[vibe];

  return (
    <svg style={{
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      width: '100%', height: '100%', pointerEvents: 'none',
    }} viewBox="0 0 400 700" preserveAspectRatio="none">
      <polygon points="195,360 205,360 300,700 100,700" fill={wall} opacity="0.85" />
      <polygon points="195,360 205,360 240,500 160,500" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
function CarSprite({ vibe, launched, lane, side }) {
  // Photoreal-ish rear-3/4 muscle-car SVG with rich gradients, reflections, alloy wheels.
  const baseY = launched ? 48 : 52;
  const baseScale = launched ? 0.6 : 0.55;

  const opponentPal = {
    gritty:    { hi: '#5a82b8', mid: '#1f3d6b', lo: '#08152e', deep: '#03081a', accent: '#ff6a1f' },
    arcade:    { hi: '#ff7a88', mid: '#cc1f30', lo: '#5a0810', deep: '#1a0204', accent: '#ffd84a' },
    synthwave: { hi: '#ff8acc', mid: '#d91a8c', lo: '#5a0a3a', deep: '#1a0212', accent: '#3df0ff' },
  }[vibe];

  const playerPal = {
    gritty:    { hi: '#ffaa55', mid: '#cc4a14', lo: '#3a1004', deep: '#160500', accent: '#ffd040' },
    arcade:    { hi: '#5aff8c', mid: '#1aaa54', lo: '#0a4a20', deep: '#02180a', accent: '#ffea00' },
    synthwave: { hi: '#7af5ff', mid: '#1aa0c8', lo: '#053040', deep: '#011220', accent: '#ff5cb0' },
  }[vibe];

  const pal = side === 'player' ? playerPal : opponentPal;
  const uid = `${vibe}-${side}`;

  const lanePos = lane === 'left' ? '17%' : '83%';

  return (
    <div style={{
      position: 'absolute',
      left: lanePos, top: `${baseY}%`,
      transform: `translateX(-50%) scale(${baseScale})`,
      transformOrigin: 'center bottom',
      transition: 'top 200ms ease-out, transform 200ms ease-out',
      zIndex: 4,
    }}>
      <svg width="240" height="150" viewBox="0 0 240 150">
        <defs>
          {/* body — top→bottom shading */}
          <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.hi} />
            <stop offset="20%" stopColor={pal.mid} />
            <stop offset="65%" stopColor={pal.lo} />
            <stop offset="100%" stopColor={pal.deep} />
          </linearGradient>
          {/* body — left/right shading for 3D feel */}
          <linearGradient id={`bodySide-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.45)" />
            <stop offset="15%" stopColor="rgba(0,0,0,0)" />
            <stop offset="85%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </linearGradient>
          {/* sky reflection on horizontal surfaces */}
          <linearGradient id={`reflect-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* dark glass with reflection */}
          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2030" />
            <stop offset="50%" stopColor="#0a0e18" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id={`glassReflect-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(180,210,255,0.35)" />
            <stop offset="50%" stopColor="rgba(180,210,255,0.05)" />
            <stop offset="100%" stopColor="rgba(180,210,255,0)" />
          </linearGradient>
          {/* tail light */}
          <linearGradient id={`tail-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8090" />
            <stop offset="40%" stopColor="#ff2030" />
            <stop offset="100%" stopColor="#5a0008" />
          </linearGradient>
          <radialGradient id={`tailGlow-${uid}`} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#ff5060" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff0020" stopOpacity="0" />
          </radialGradient>
          {/* chrome */}
          <linearGradient id={`chrome-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8e8ea" />
            <stop offset="40%" stopColor="#a0a0a8" />
            <stop offset="55%" stopColor="#3a3a40" />
            <stop offset="100%" stopColor="#888890" />
          </linearGradient>
          {/* tire */}
          <radialGradient id={`tire-${uid}`} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="80%" stopColor="#0a0a0a" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          {/* alloy rim */}
          <radialGradient id={`rim-${uid}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#888" />
            <stop offset="60%" stopColor="#444" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>
          {/* exhaust */}
          <radialGradient id={`exh-${uid}`} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="80%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#666" />
          </radialGradient>

          {/* ground shadow blur */}
          <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* GROUND SHADOW — soft, multi-layer */}
        <ellipse cx="120" cy="138" rx="105" ry="9" fill="rgba(0,0,0,0.55)" filter={`url(#shadow-${uid})`} />
        <ellipse cx="120" cy="140" rx="80" ry="4" fill="rgba(0,0,0,0.7)" />

        {/* === LOWER BODY / DIFFUSER === */}
        <path d="M 18 110 L 28 130 L 212 130 L 222 110 Z" fill="#050505" />
        {/* diffuser fins */}
        {[60, 90, 120, 150, 180].map(x => (
          <path key={x} d={`M ${x} 116 L ${x - 3} 130`} stroke="#1a1a1a" strokeWidth="1.5" />
        ))}
        {/* rear underglow accent */}
        <rect x="40" y="126" width="160" height="1" fill={pal.accent} opacity="0.4" />

        {/* === MAIN BODY === */}
        {/* trunk + rear quarters */}
        <path d="M 22 108
                 Q 20 86 24 70
                 Q 28 52 44 48
                 L 196 48
                 Q 212 52 216 70
                 Q 220 86 218 108
                 Z"
          fill={`url(#body-${uid})`} />

        {/* side darkening overlay for 3D form */}
        <path d="M 22 108
                 Q 20 86 24 70
                 Q 28 52 44 48
                 L 196 48
                 Q 212 52 216 70
                 Q 220 86 218 108
                 Z"
          fill={`url(#bodySide-${uid})`} opacity="0.85" />

        {/* sky reflection on trunk top */}
        <path d="M 30 56 Q 35 50 50 50 L 190 50 Q 205 50 210 56 L 200 70 L 40 70 Z"
          fill={`url(#reflect-${uid})`} opacity="0.65" />

        {/* trunk seam */}
        <path d="M 50 100 Q 50 70 60 64 L 180 64 Q 190 70 190 100"
          fill="none" stroke={pal.deep} strokeWidth="0.6" opacity="0.7" />
        {/* shut line for trunk lid */}
        <path d="M 50 100 L 190 100" stroke={pal.deep} strokeWidth="0.5" opacity="0.6" />

        {/* === REAR WINDOW === */}
        <path d="M 56 50
                 L 64 22
                 Q 68 14 80 14
                 L 160 14
                 Q 172 14 176 22
                 L 184 50 Z"
          fill={`url(#glass-${uid})`} />
        {/* glass reflection — diagonal sweep */}
        <path d="M 60 48
                 L 68 24
                 Q 72 18 82 18
                 L 120 18
                 L 105 48 Z"
          fill={`url(#glassReflect-${uid})`} />
        {/* glass top highlight */}
        <path d="M 70 18 L 168 18" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        {/* defroster lines */}
        {[26, 32, 38, 44].map(y => (
          <path key={y} d={`M ${65 + (y - 22) * 0.2} ${y} L ${175 - (y - 22) * 0.2} ${y}`}
            stroke="rgba(120,150,200,0.08)" strokeWidth="0.3" />
        ))}

        {/* roof line (small slice visible) */}
        <path d="M 68 14 Q 80 8 120 8 Q 160 8 172 14 L 168 16 L 72 16 Z"
          fill="#0a0a0a" />
        <path d="M 78 11 L 162 11" stroke={pal.accent} strokeWidth="0.8" opacity="0.5" />

        {/* === SPOILER / DUCKTAIL === */}
        <path d="M 32 50 L 42 42 L 198 42 L 208 50 L 198 52 L 42 52 Z"
          fill="#0c0c0c" />
        <path d="M 42 42 L 198 42" stroke={pal.accent} strokeWidth="0.6" opacity="0.6" />
        <path d="M 42 43 L 198 43" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />

        {/* === TAIL LIGHTS — full-width === */}
        {/* housing */}
        <rect x="28" y="72" width="184" height="18" rx="2" fill="#0a0a0a" />
        <rect x="29" y="73" width="182" height="1" fill="#3a3a3a" />
        {/* left cluster */}
        <rect x="32" y="76" width="74" height="11" rx="1.5" fill={`url(#tail-${uid})`} />
        <rect x="33" y="77" width="72" height="2" fill="rgba(255,255,255,0.3)" />
        {/* right cluster */}
        <rect x="134" y="76" width="74" height="11" rx="1.5" fill={`url(#tail-${uid})`} />
        <rect x="135" y="77" width="72" height="2" fill="rgba(255,255,255,0.3)" />
        {/* center brand light */}
        <rect x="108" y="78" width="24" height="7" rx="1" fill={pal.accent} opacity="0.85" />
        <rect x="109" y="79" width="22" height="1.5" fill="rgba(255,255,255,0.5)" />
        {/* always-on tail light glow */}
        <rect x="28" y="72" width="184" height="18" rx="2"
          fill={`url(#tailGlow-${uid})`} opacity={launched ? 0.9 : 0.45} />

        {/* === LICENSE PLATE === */}
        <rect x="98" y="96" width="44" height="14" rx="1.5" fill="#fff" stroke="#2a2a2a" strokeWidth="0.5" />
        <rect x="99" y="97" width="42" height="2" fill="#e0e0e0" />
        <text x="120" y="106" textAnchor="middle"
          fontFamily="ui-monospace, monospace" fontSize="8" fontWeight="800"
          fill="#0a0a0a" letterSpacing="0.5">SICK·07</text>

        {/* === CHROME BUMPER STRIP === */}
        <rect x="22" y="106" width="196" height="2.5" fill={`url(#chrome-${uid})`} />

        {/* === EXHAUST TIPS — dual === */}
        {/* left */}
        <ellipse cx="50" cy="120" rx="10" ry="4" fill={`url(#exh-${uid})`} stroke="#888" strokeWidth="0.6" />
        <ellipse cx="50" cy="119.5" rx="6.5" ry="2.2" fill="#0a0a0a" />
        <ellipse cx="64" cy="120" rx="10" ry="4" fill={`url(#exh-${uid})`} stroke="#888" strokeWidth="0.6" />
        <ellipse cx="64" cy="119.5" rx="6.5" ry="2.2" fill="#0a0a0a" />
        {/* right */}
        <ellipse cx="176" cy="120" rx="10" ry="4" fill={`url(#exh-${uid})`} stroke="#888" strokeWidth="0.6" />
        <ellipse cx="176" cy="119.5" rx="6.5" ry="2.2" fill="#0a0a0a" />
        <ellipse cx="190" cy="120" rx="10" ry="4" fill={`url(#exh-${uid})`} stroke="#888" strokeWidth="0.6" />
        <ellipse cx="190" cy="119.5" rx="6.5" ry="2.2" fill="#0a0a0a" />

        {/* === WHEELS === */}
        {/* left tire */}
        <ellipse cx="32" cy="116" rx="20" ry="11" fill={`url(#tire-${uid})`} />
        <ellipse cx="32" cy="116" rx="14" ry="8" fill={`url(#rim-${uid})`} />
        {/* spokes */}
        {[0, 60, 120].map(deg => (
          <g key={deg} transform={`rotate(${deg} 32 116)`}>
            <rect x="30" y="109" width="4" height="14" fill="#1a1a1a" />
            <rect x="31" y="109" width="2" height="14" fill="#5a5a5a" />
          </g>
        ))}
        <circle cx="32" cy="116" r="3" fill="#222" stroke="#666" strokeWidth="0.5" />
        <circle cx="32" cy="116" r="1" fill={pal.accent} />
        {/* tire sidewall highlight */}
        <ellipse cx="32" cy="116" rx="20" ry="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* right tire */}
        <ellipse cx="208" cy="116" rx="20" ry="11" fill={`url(#tire-${uid})`} />
        <ellipse cx="208" cy="116" rx="14" ry="8" fill={`url(#rim-${uid})`} />
        {[0, 60, 120].map(deg => (
          <g key={deg} transform={`rotate(${deg} 208 116)`}>
            <rect x="206" y="109" width="4" height="14" fill="#1a1a1a" />
            <rect x="207" y="109" width="2" height="14" fill="#5a5a5a" />
          </g>
        ))}
        <circle cx="208" cy="116" r="3" fill="#222" stroke="#666" strokeWidth="0.5" />
        <circle cx="208" cy="116" r="1" fill={pal.accent} />
        <ellipse cx="208" cy="116" rx="20" ry="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* === BODY HIGHLIGHT EDGES === */}
        {/* top edge sheen */}
        <path d="M 30 56 Q 35 50 50 50 L 190 50 Q 205 50 210 56"
          fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        {/* shoulder highlight */}
        <path d="M 24 80 Q 26 70 30 66" stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />
        <path d="M 216 80 Q 214 70 210 66" stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />

        {/* center racing stripe pair (subtle) */}
        <rect x="112" y="48" width="3" height="58" fill="rgba(255,255,255,0.18)" />
        <rect x="125" y="48" width="3" height="58" fill="rgba(255,255,255,0.18)" />

        {/* === LAUNCH EFFECTS === */}
        {launched && (
          <>
            {/* brighter tail glow */}
            <rect x="20" y="68" width="200" height="26" rx="4"
              fill="#ff2030" opacity="0.4" filter={`url(#shadow-${uid})`} />
            {/* exhaust flames */}
            <ellipse cx="50" cy="128" rx="9" ry="5" fill="#ff5500" opacity="0.9" />
            <ellipse cx="50" cy="128" rx="5" ry="3" fill="#ffd040" />
            <ellipse cx="64" cy="128" rx="9" ry="5" fill="#ff5500" opacity="0.9" />
            <ellipse cx="64" cy="128" rx="5" ry="3" fill="#ffd040" />
            <ellipse cx="176" cy="128" rx="9" ry="5" fill="#ff5500" opacity="0.9" />
            <ellipse cx="176" cy="128" rx="5" ry="3" fill="#ffd040" />
            <ellipse cx="190" cy="128" rx="9" ry="5" fill="#ff5500" opacity="0.9" />
            <ellipse cx="190" cy="128" rx="5" ry="3" fill="#ffd040" />
            {/* tire smoke */}
            <ellipse cx="20" cy="124" rx="18" ry="7" fill="rgba(255,255,255,0.45)" filter={`url(#shadow-${uid})`} />
            <ellipse cx="220" cy="124" rx="18" ry="7" fill="rgba(255,255,255,0.45)" filter={`url(#shadow-${uid})`} />
          </>
        )}
      </svg>
    </div>
  );
}

function OpponentCar({ vibe, launched }) {
  return <CarSprite vibe={vibe} launched={launched} lane="left" side="opponent" />;
}

function PlayerCar({ vibe, launched }) {
  return <CarSprite vibe={vibe} launched={launched} lane="right" side="player" />;
}

// ─────────────────────────────────────────────────────────────
// Legacy PlayerHood — kept only as dead code; not rendered.
// eslint-disable-next-line no-unused-vars
function _UnusedPlayerHood({ vibe, launched }) {
  const pal = {
    gritty:    { hi: '#cc4a1a', mid: '#a83a14', lo: '#5a1a05', stripe: '#ffffff' },
    arcade:    { hi: '#3aa856', mid: '#1a8844', lo: '#072a14', stripe: '#ffffff' },
    synthwave: { hi: '#7a3acc', mid: '#5a1aaa', lo: '#1a0455', stripe: '#ffffff' },
  }[vibe];

  // 32 wide × 10 tall — hood seen from cockpit, narrows toward windshield
  // 'T' transparent (use ' ')
  const sprite = [
    '       MMMMMMMMMMMMMMMM         ',
    '      MmmmmmKKKKmmmmmmM         ',
    '     MmmmmmmKKKKmmmmmmmM        ',
    '    MmmmmHHHHHHHHHHmmmmmM       ',
    '   MmmmHHHHWWWWWWHHHHmmmmM      ',
    '   MhhHHWWWWWWWWWWWWHHhhM       ',
    '  MhhhHHWWWSSSSWWWWHHhhhM       ',
    '  MhhhhHWWWSSSSWWWWHhhhhM       ',
    ' MhhhhhhhhhSSSShhhhhhhhhhM      ',
    'MhhhhhhhhhhSSSShhhhhhhhhhhM     ',
  ];
  // Simpler & wider — let's redo with a clean trapezoid shape
  const sprite2 = [
    '         MMMMMMMMMMMM           ',
    '        MhhhhhhhhhhhhM          ',
    '       MhhhhKKKKKKhhhhM         ',
    '      MhhhhhKKKKKKhhhhhM        ',
    '     MhhhSSShhhhhhSSShhhM       ',
    '    MhhhhSSShhhhhhSSShhhhM      ',
    '   MhhhhhSSShhhhhhSSShhhhhM     ',
    '  MhhhhhhSSSmmmmmmSSShhhhhhM    ',
    ' MhhhhhhhSSSmmmmmmSSShhhhhhhM   ',
    'MmmmmmmmmmmmmmmmmmmmmmmmmmmmM   ',
  ];

  const colors = {
    'M': '#000',
    'h': pal.hi,
    'm': pal.mid,
    'l': pal.lo,
    'K': '#0a0a0a',  // hood scoop
    'S': pal.stripe, // racing stripes
  };

  const px = 8;
  const cols = sprite2[0].length;
  const rows = sprite2.length;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: '34%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 6,
      imageRendering: 'pixelated',
    }}>
      <svg
        width={cols * px}
        height={rows * px}
        viewBox={`0 0 ${cols * px} ${rows * px}`}
        shapeRendering="crispEdges"
        style={{
          maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 30%, #000 70%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 30%, #000 70%)',
        }}
      >
        {sprite2.map((row, y) => (
          [...row].map((ch, x) => {
            if (ch === ' ') return null;
            return (
              <rect key={`${x}-${y}`}
                x={x * px} y={y * px}
                width={px} height={px}
                fill={colors[ch] || '#000'} />
            );
          })
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function SpeedLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `
        repeating-linear-gradient(180deg,
          transparent 0,
          transparent 24px,
          rgba(255,255,255,0.05) 24px,
          rgba(255,255,255,0.05) 26px
        )
      `,
      animation: 'speedlines 0.4s linear infinite',
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
function SynthGrid() {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: '52%', bottom: 0,
      background: `
        linear-gradient(180deg, #0a0014 0%, #1a0033 100%),
        repeating-linear-gradient(0deg, transparent 0, transparent 19px, #ff1a8c 19px, #ff1a8c 20px),
        repeating-linear-gradient(90deg, transparent 0, transparent 19px, #ff1a8c 19px, #ff1a8c 20px)
      `,
      backgroundBlendMode: 'normal, screen, screen',
      transform: 'perspective(300px) rotateX(60deg)',
      transformOrigin: 'top',
      opacity: 0.55,
    }} />
  );
}

function Stars() {
  return (
    <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%">
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i * 37) % 100;
        const y = (i * 23) % 50;
        const r = 0.6 + (i % 3) * 0.4;
        return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="#fff" opacity={0.3 + (i % 3) * 0.2} />;
      })}
    </svg>
  );
}

function ArcadeBg() {
  return (
    <>
      {/* sun */}
      <div style={{
        position: 'absolute', left: '50%', top: '32%',
        transform: 'translateX(-50%)',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, #fff7d0 0%, #ffd96b 50%, transparent 80%)',
        filter: 'blur(2px)',
      }} />
      {/* mountains */}
      <svg style={{ position: 'absolute', left: 0, right: 0, top: '38%', width: '100%' }} viewBox="0 0 400 80" preserveAspectRatio="none">
        <polygon points="0,80 60,30 120,60 180,20 260,55 340,25 400,50 400,80" fill="#3a2a4a" opacity="0.6" />
      </svg>
    </>
  );
}

Object.assign(window, { TrackScene });
