// Controls.jsx — parameter sliders, toggles, and atomic UI bits for Bauhaus-playful design

export const C = {
  paper: '#f3ede1',
  ink: '#0b0a08',
  red: '#e63946',
  yellow: '#e5c300',
  blue: '#1e55c7',
  teal: '#3a8e8a',
  soft: '#e8dfc9',
  muted: '#6b6559',
};

export function Slider({ label, unit, value, min, max, step = 1, onChange, color = C.red, disabled = false }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink }}>{label}</span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C.ink }}>
          {typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 2 : 1)) : value}{unit ? <span style={{ color: C.muted }}> {unit}</span> : null}
        </span>
      </div>
      <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 6, background: C.soft, border: `1.5px solid ${C.ink}` }}/>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 6, background: color, borderTop: `1.5px solid ${C.ink}`, borderBottom: `1.5px solid ${C.ink}`, borderLeft: `1.5px solid ${C.ink}` }}/>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0, width: '100%',
            opacity: 0, cursor: 'pointer', margin: 0, height: 22,
          }}
        />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 7px)`, width: 14, height: 14,
          background: C.paper, border: `2px solid ${C.ink}`, borderRadius: '50%', pointerEvents: 'none',
        }}/>
      </div>
    </div>
  );
}

export function Toggle({ label, value, onChange, color = C.red }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', background: value ? color : C.paper,
        color: value ? C.paper : C.ink,
        border: `2px solid ${C.ink}`,
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        letterSpacing: '0.05em', textTransform: 'uppercase',
      }}
    >
      <div style={{
        width: 14, height: 14, border: `2px solid ${value ? C.paper : C.ink}`,
        background: value ? C.paper : 'transparent',
        position: 'relative', flexShrink: 0,
      }}>
        {value && <div style={{ position: 'absolute', inset: 1, background: color }}/>}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}

// A section card for a surface modifier — header toggle + content reveals when on
export function ModifierCard({ title, shape, enabled, onToggle, color, children }) {
  return (
    <div style={{ border: `2px solid ${C.ink}`, marginBottom: -2, background: C.paper }}>
      <button
        onClick={() => onToggle(!enabled)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 12px', cursor: 'pointer', border: 'none',
          background: enabled ? color : C.paper,
          color: enabled ? C.paper : C.ink,
          fontFamily: 'inherit', fontWeight: 800, fontSize: 12,
          letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left',
        }}
      >
        <div style={{ flexShrink: 0, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="0" y="0" width="18" height="18" fill="none" stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"/>
            {shape === 'circle' && <circle cx="9" cy="9" r="4" fill={enabled ? C.paper : C.ink}/>}
            {shape === 'wave' && <path d="M2 9 Q5 5 9 9 T16 9" fill="none" stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"/>}
            {shape === 'triangle' && <polygon points="9,3 15,14 3,14" fill={enabled ? C.paper : C.ink}/>}
            {shape === 'spiral' && <path d="M9 9 m-5 0 a5 5 0 1 1 10 0 a4 4 0 1 1 -8 0 a3 3 0 1 1 6 0" fill="none" stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"/>}
            {shape === 'twist' && <path d="M4 3 Q9 9 4 15 M14 3 Q9 9 14 15" fill="none" stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"/>}
            {shape === 'lumps' && <path d="M2 12 Q4 8 6 11 T10 10 T14 12 T16 11" fill="none" stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"/>}
            {shape === 'lines' && <g stroke={enabled ? C.paper : C.ink} strokeWidth="1.5"><line x1="3" y1="4" x2="15" y2="4"/><line x1="3" y1="9" x2="15" y2="9"/><line x1="3" y1="14" x2="15" y2="14"/></g>}
            {shape === 'diamond' && <polygon points="9,2 16,9 9,16 2,9" fill={enabled ? C.paper : C.ink}/>}
          </svg>
        </div>
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{
          width: 26, height: 14, background: enabled ? C.paper : C.soft,
          border: `1.5px solid ${enabled ? C.paper : C.ink}`, position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: -1, bottom: -1, left: enabled ? 'auto' : -1, right: enabled ? -1 : 'auto',
            width: 12, background: enabled ? color : C.ink, border: `1.5px solid ${enabled ? C.paper : C.ink}`,
          }}/>
        </span>
      </button>
      {enabled && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: `2px solid ${C.ink}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Select({ label, value, options, onChange }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink, marginBottom: 4 }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', border: `2px solid ${C.ink}`,
            background: C.paper, fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.05em', textTransform: 'uppercase', color: C.ink,
            appearance: 'none', cursor: 'pointer', paddingRight: 30,
          }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="10" height="6" viewBox="0 0 10 6"><polygon points="0,0 10,0 5,6" fill={C.ink}/></svg>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, dotColor, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        borderBottom: `2px solid ${C.ink}`, paddingBottom: 6,
      }}>
        <div style={{ width: 10, height: 10, background: dotColor, border: `1.5px solid ${C.ink}` }}/>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
