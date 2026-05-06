// ProfilePanel.jsx — side silhouette view showing 2D profile of the vase
// Includes scrubber UI for print sequence.

export function ProfilePanel({ vase, progress, onProgressChange, playing, onTogglePlay, width = 300, height = 360 }) {
  if (!vase) return null;
  const { layers, params } = vase;
  const h = params.height;
  const maxR = Math.max(...layers.map(r => Math.max(...r.map(p => p.r))));

  const padTop = 14, padBot = 28, padL = 40, padR = 20;
  const drawH = height - padTop - padBot;
  const drawW = width - padL - padR;
  const scale = Math.min(drawW / (maxR * 2.2), drawH / h);

  const cx = padL + drawW / 2;
  const by = padTop + drawH;

  // Sample ~80 heights along the silhouette — use the max radius at each layer at theta=0
  const samples = 60;
  const leftPts = [], rightPts = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const li = Math.min(layers.length - 1, Math.round(t * (layers.length - 1)));
    // average r at 0 and pi direction to look more accurate
    const ring = layers[li];
    const r0 = ring[0].r;
    const rHalf = ring[Math.floor(ring.length / 2)].r;
    const r = (r0 + rHalf) / 2;
    const y = by - li * (h / layers.length) * scale;
    leftPts.push({ x: cx - r * scale, y });
    rightPts.push({ x: cx + r * scale, y });
  }

  const dSil = 'M' + leftPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') +
    'L' + rightPts.slice().reverse().map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';

  const progressY = by - progress * h * scale;

  const clickBar = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const t = 1 - (y - padTop) / drawH;
    onProgressChange(Math.max(0, Math.min(1, t)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <svg width={width} height={height} style={{ display: 'block', background: '#f3ede1' }}
        onMouseDown={(e) => { clickBar(e); const mm = (ev) => clickBar(ev); const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); }; window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu); }}
      >
        {/* ruler */}
        <g fontFamily="ui-monospace, monospace" fontSize="9" fill="#6b6559">
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = by - t * h * scale;
            const mm = (t * h).toFixed(0);
            return (
              <g key={t}>
                <line x1={padL - 6} y1={y} x2={padL - 2} y2={y} stroke="#0b0a08" strokeWidth="1"/>
                <text x={padL - 8} y={y + 3} textAnchor="end">{mm}</text>
              </g>
            );
          })}
          <text x={padL - 8} y={by + 16} textAnchor="end">mm</text>
        </g>

        {/* centerline */}
        <line x1={cx} y1={padTop} x2={cx} y2={by} stroke="#c0b39a" strokeDasharray="2,3" strokeWidth="1"/>

        {/* silhouette fill */}
        <path d={dSil} fill="#e5c300" stroke="#0b0a08" strokeWidth="1.6"/>

        {/* unprinted region overlay */}
        <rect x={padL} y={padTop} width={drawW} height={progressY - padTop}
          fill="#f3ede1" opacity="0.78" pointerEvents="none"/>

        {/* progress line */}
        <line x1={padL} y1={progressY} x2={padL + drawW} y2={progressY}
          stroke="#e63946" strokeWidth="2"/>
        <circle cx={padL + drawW + 2} cy={progressY} r={5} fill="#e63946" stroke="#0b0a08" strokeWidth="1.2"/>

        {/* base indicator */}
        <rect x={cx - maxR * scale * 0.9} y={by} width={maxR * scale * 1.8} height={3}
          fill="#0b0a08"/>

        {/* height label */}
        <text x={width - padR - 2} y={padTop - 2} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill="#0b0a08">
          {h.toFixed(0)}mm
        </text>
      </svg>

      {/* playback controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        background: '#0b0a08', color: '#f3ede1', borderTop: '2px solid #0b0a08',
      }}>
        <button
          onClick={onTogglePlay}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '2px solid #f3ede1',
            background: playing ? '#e63946' : '#e5c300', color: '#0b0a08',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, flexShrink: 0,
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="12" height="14" viewBox="0 0 12 14"><rect x="1" y="1" width="3.5" height="12" fill="#0b0a08"/><rect x="7.5" y="1" width="3.5" height="12" fill="#0b0a08"/></svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14"><polygon points="1,1 11,7 1,13" fill="#0b0a08"/></svg>
          )}
        </button>
        <input
          type="range" min="0" max="1000" value={Math.round(progress * 1000)}
          onChange={(e) => onProgressChange(parseInt(e.target.value) / 1000)}
          style={{ flex: 1, accentColor: '#e63946' }}
        />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, minWidth: 40, textAlign: 'right' }}>
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
