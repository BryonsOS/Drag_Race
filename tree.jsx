// NHRA-style Christmas Tree
// Pre-stage (top, small white), Stage (white), 3 Amber, Green, Red

function TreeBulb({ color, on, size = 'normal' }) {
  const dims = {
    small: 18,
    normal: 44,
    large: 56,
  }[size];

  const palette = {
    white:  { hue: '#e8efff', glow: 'rgba(220,235,255,0.9)' },
    amber:  { hue: '#ffb000', glow: 'rgba(255,176,0,0.95)' },
    green:  { hue: '#3aff7c', glow: 'rgba(58,255,124,0.95)' },
    red:    { hue: '#ff2030', glow: 'rgba(255,32,48,0.95)' },
  }[color];

  return (
    <div style={{
      width: dims, height: dims, borderRadius: '50%',
      background: on
        ? `radial-gradient(circle at 35% 30%, #fff 0%, ${palette.hue} 35%, ${palette.hue} 70%, rgba(0,0,0,0.4) 100%)`
        : 'radial-gradient(circle at 35% 30%, #2a2a2a 0%, #161616 60%, #0a0a0a 100%)',
      boxShadow: on
        ? `0 0 ${dims * 0.6}px ${dims * 0.15}px ${palette.glow}, 0 0 ${dims * 1.2}px ${dims * 0.3}px ${palette.glow}, inset 0 -2px 4px rgba(0,0,0,0.4)`
        : 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
      border: on ? 'none' : '1px solid #000',
      position: 'relative',
      flexShrink: 0,
      transition: 'box-shadow 60ms linear, background 60ms linear',
    }}>
      {on && (
        <div style={{
          position: 'absolute', top: '15%', left: '20%',
          width: '30%', height: '20%', borderRadius: '50%',
          background: 'rgba(255,255,255,0.7)',
          filter: 'blur(2px)',
        }} />
      )}
    </div>
  );
}

function TreeColumn({ stage, side = 'left' }) {
  // stage: 'idle' | 'prestage' | 'stage' | 'amber1' | 'amber2' | 'amber3' | 'green' | 'red'
  const lit = {
    prestage1: ['prestage', 'stage', 'amber1', 'amber2', 'amber3', 'green', 'red'].includes(stage),
    prestage2: ['prestage', 'stage', 'amber1', 'amber2', 'amber3', 'green', 'red'].includes(stage),
    stage1: ['stage', 'amber1', 'amber2', 'amber3', 'green', 'red'].includes(stage),
    stage2: ['stage', 'amber1', 'amber2', 'amber3', 'green', 'red'].includes(stage),
    amber1: ['amber1', 'amber2', 'amber3', 'green', 'red'].includes(stage),
    amber2: ['amber2', 'amber3', 'green', 'red'].includes(stage),
    amber3: ['amber3', 'green', 'red'].includes(stage),
    green: stage === 'green',
    red: stage === 'red',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, padding: '10px 6px', background: '#0a0a0a',
      border: '1px solid #1a1a1a', borderRadius: 4,
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
    }}>
      {/* prestage pair */}
      <div style={{ display: 'flex', gap: 4 }}>
        <TreeBulb color="white" on={lit.prestage1} size="small" />
        <TreeBulb color="white" on={lit.prestage2} size="small" />
      </div>
      {/* stage pair */}
      <div style={{ display: 'flex', gap: 4 }}>
        <TreeBulb color="white" on={lit.stage1} size="small" />
        <TreeBulb color="white" on={lit.stage2} size="small" />
      </div>
      <div style={{ height: 6 }} />
      <TreeBulb color="amber" on={lit.amber1} />
      <TreeBulb color="amber" on={lit.amber2} />
      <TreeBulb color="amber" on={lit.amber3} />
      <TreeBulb color="green" on={lit.green} size="large" />
    </div>
  );
}

function ChristmasTree({ leftStage, rightStage }) {
  return (
    <div style={{
      display: 'inline-flex', gap: 4, padding: 6,
      background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
      borderRadius: 6,
      border: '1px solid #2a2a2a',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      <TreeColumn stage={leftStage} side="left" />
      {/* center pole */}
      <div style={{
        width: 4, background: 'linear-gradient(180deg, #2a2a2a, #0a0a0a)',
        borderRadius: 2, alignSelf: 'stretch',
      }} />
      <TreeColumn stage={rightStage} side="right" />
    </div>
  );
}

Object.assign(window, { TreeBulb, TreeColumn, ChristmasTree });
