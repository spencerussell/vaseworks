// App.jsx — main VASEWORKS app
import React from 'react';
import { generateVase, PRESETS, stlFromVase } from './lib/vaseGeom.js';
import { Slider, Select, Section, ModifierCard, C } from './components/Controls.jsx';
import { Preview3D } from './components/Preview3D.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "preset": "tumbler",
  "density": "medium",
  "accentColor": "red",
  "gridBg": true
}/*EDITMODE-END*/;

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function Stat({ label, value, unit }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', padding: '10px 12px',
      border: `2px solid ${C.ink}`, background: C.paper, flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: C.ink, color: C.paper, padding: '12px 18px',
      border: `2px solid ${C.yellow}`, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: `4px 4px 0 ${C.yellow}`,
      zIndex: 1000,
    }}>
      <div style={{ width: 14, height: 14, background: C.yellow, border: `2px solid ${C.paper}` }}/>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{message}</span>
    </div>
  );
}

function Header({ onExport, preset, onPresetChange, units }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: `3px solid ${C.ink}`, background: C.paper,
      height: 64, flexShrink: 0,
    }}>
      {/* Logo block */}
      <div style={{
        width: 220, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 18px', borderRight: `3px solid ${C.ink}`, background: C.yellow,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect x="1" y="1" width="30" height="30" fill={C.paper} stroke={C.ink} strokeWidth="2"/>
          {/* vase cross-section silhouette */}
          <path d="M10 5 L10 8 Q7 11 7 15 Q7 22 9 25 L9 27 L23 27 L23 25 Q25 22 25 15 Q25 11 22 8 L22 5 Z"
            fill={C.red} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="miter"/>
          {/* inner wall line to show section */}
          <path d="M12 6 L12 8 Q9 11 9 15 Q9 21 11 24"
            fill="none" stroke={C.ink} strokeWidth="1" opacity="0.6"/>
          {/* horizontal base line */}
          <line x1="9" y1="25" x2="23" y2="25" stroke={C.ink} strokeWidth="1"/>
        </svg>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}>VASEWORKS</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, marginTop: 3 }}>
            spiral / vase mode studio
          </div>
        </div>
      </div>

      {/* Preset selector */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, flex: 1, borderRight: `3px solid ${C.ink}` }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
          Preset
        </span>
        <div style={{ display: 'flex', border: `2px solid ${C.ink}` }}>
          {Object.keys(PRESETS).map((name, i) => (
            <button key={name}
              onClick={() => onPresetChange(name)}
              style={{
                padding: '6px 11px',
                background: preset === name ? C.ink : C.paper,
                color: preset === name ? C.paper : C.ink,
                border: 'none', borderRight: i < Object.keys(PRESETS).length - 1 ? `2px solid ${C.ink}` : 'none',
                fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >{name}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
          <div style={{ width: 6, height: 6, background: C.blue }}/>
          Units · {units}
        </div>
      </div>

      {/* Export */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}>
        <button onClick={onExport}
          style={{
            padding: '10px 18px', background: C.red, color: C.paper,
            border: `2px solid ${C.ink}`, fontFamily: 'inherit', fontWeight: 900,
            fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: `4px 4px 0 ${C.ink}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 V9 M3 6 L7 10 L11 6 M1 12 H13" stroke={C.paper} strokeWidth="2" fill="none"/></svg>
          Export STL
        </button>
      </div>
    </header>
  );
}

function ParamPanel({ p, setP }) {
  const upd = (k) => (v) => setP({ ...p, [k]: v });
  return (
    <div style={{ padding: 18, overflowY: 'auto', height: '100%' }}>
      <Section title="Silhouette" dotColor={C.red}>
        <Slider label="Height" unit="mm" value={p.height} min={30} max={250} step={1} onChange={upd('height')} color={C.red}/>
        <Slider label="Bottom radius" unit="mm" value={p.bottomRadius} min={8} max={60} step={0.5} onChange={upd('bottomRadius')} color={C.red}/>
        <Slider label="Top radius" unit="mm" value={p.topRadius} min={8} max={60} step={0.5} onChange={upd('topRadius')} color={C.red}/>
        <Slider label="Waist pinch" value={p.waistPinch} min={-1} max={1} step={0.05} onChange={upd('waistPinch')} color={C.red}/>
        <Slider label="Waist position" value={p.waistHeight} min={0.1} max={0.9} step={0.01} onChange={upd('waistHeight')} color={C.red}/>
      </Section>

      <Section title="Print" dotColor={C.blue}>
        <Slider label="Layer height" unit="mm" value={p.layerHeight} min={0.1} max={0.6} step={0.05} onChange={upd('layerHeight')} color={C.blue}/>
        <Slider label="Wall perimeter segments" value={p.segments} min={32} max={192} step={8} onChange={upd('segments')} color={C.blue}/>
        <Slider label="Wall thickness" unit="mm" value={p.wallThickness} min={0.4} max={2.4} step={0.1} onChange={upd('wallThickness')} color={C.blue}/>
      </Section>

      <Section title="Surface modifiers" dotColor={C.yellow}>
        <ModifierCard title="Vertical Flutes" shape="lines" enabled={p.flutesEnabled} onToggle={upd('flutesEnabled')} color={C.red}>
          <Slider label="Count" value={p.flutesCount} min={4} max={48} step={1} onChange={upd('flutesCount')} color={C.red}/>
          <Slider label="Depth" unit="mm" value={p.flutesDepth} min={0.3} max={6} step={0.1} onChange={upd('flutesDepth')} color={C.red}/>
        </ModifierCard>

        <ModifierCard title="Horizontal Waves" shape="wave" enabled={p.wavesEnabled} onToggle={upd('wavesEnabled')} color={C.blue}>
          <Slider label="Frequency" value={p.wavesFreq} min={1} max={30} step={1} onChange={upd('wavesFreq')} color={C.blue}/>
          <Slider label="Amplitude" unit="mm" value={p.wavesAmp} min={0.2} max={5} step={0.1} onChange={upd('wavesAmp')} color={C.blue}/>
        </ModifierCard>

        <ModifierCard title="Faceted Cross-Section" shape="triangle" enabled={p.facetsEnabled} onToggle={upd('facetsEnabled')} color={C.yellow}>
          <Slider label="Sides" value={p.facetsSides} min={3} max={16} step={1} onChange={upd('facetsSides')} color={C.yellow}/>
          <Slider label="Sharpness" value={p.facetsSharpness} min={0} max={1} step={0.02} onChange={upd('facetsSharpness')} color={C.yellow}/>
        </ModifierCard>

        <ModifierCard title="Twist" shape="twist" enabled={p.twistEnabled} onToggle={upd('twistEnabled')} color={C.teal}>
          <Slider label="Total rotation" unit="°" value={p.twistDegrees} min={-720} max={720} step={5} onChange={upd('twistDegrees')} color={C.teal}/>
        </ModifierCard>

        <ModifierCard title="Organic Lumps" shape="lumps" enabled={p.lumpsEnabled} onToggle={upd('lumpsEnabled')} color={C.red}>
          <Slider label="Amount" unit="mm" value={p.lumpsAmount} min={0.2} max={6} step={0.1} onChange={upd('lumpsAmount')} color={C.red}/>
          <Slider label="Seed" value={p.lumpsSeed} min={1} max={30} step={1} onChange={upd('lumpsSeed')} color={C.red}/>
        </ModifierCard>

        <ModifierCard title="Helical Spiral Ribs" shape="spiral" enabled={p.spiralEnabled} onToggle={upd('spiralEnabled')} color={C.blue}>
          <Slider label="Rib count" value={p.spiralCount} min={1} max={12} step={1} onChange={upd('spiralCount')} color={C.blue}/>
          <Slider label="Depth" unit="mm" value={p.spiralDepth} min={0.3} max={5} step={0.1} onChange={upd('spiralDepth')} color={C.blue}/>
          <Slider label="Pitch" unit="mm/rev" value={p.spiralPitch} min={10} max={120} step={2} onChange={upd('spiralPitch')} color={C.blue}/>
        </ModifierCard>

        <ModifierCard title="Embossed Pattern" shape="diamond" enabled={p.embossEnabled} onToggle={upd('embossEnabled')} color={C.yellow}>
          <Select label="Pattern" value={p.embossPattern}
            options={[{ value: 'diamond', label: 'Diamond Grid' }, { value: 'hex', label: 'Hex Grid' }]}
            onChange={upd('embossPattern')}/>
          <Slider label="Tile size" unit="mm" value={p.embossScale} min={5} max={40} step={1} onChange={upd('embossScale')} color={C.yellow}/>
          <Slider label="Depth" unit="mm" value={p.embossDepth} min={0.2} max={3} step={0.1} onChange={upd('embossDepth')} color={C.yellow}/>
        </ModifierCard>
      </Section>
    </div>
  );
}

export default function App() {
  const [p, setP] = React.useState(() => {
    const saved = localStorage.getItem('vaseworks_params');
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    return { ...PRESETS.tumbler, layerHeight: 0.3, segments: 96, wallThickness: 1.2 };
  });
  const [preset, setPreset] = React.useState('tumbler');
  const [progress, setProgress] = React.useState(1);
  const [playing, setPlaying] = React.useState(false);
  const [yaw, setYaw] = React.useState(0.4);
  const [pitch, setPitch] = React.useState(-0.55);
  const [renderMode, setRenderMode] = React.useState('wire');
  const [cameraMode, setCameraMode] = React.useState('ortho');
  const [toast, setToast] = React.useState(null);

  // autoplay
  React.useEffect(() => {
    if (!playing) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress(prev => {
        const next = prev + dt * 0.18;
        if (next >= 1) { setPlaying(false); return 1; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // persist
  React.useEffect(() => {
    localStorage.setItem('vaseworks_params', JSON.stringify(p));
  }, [p]);

  const onPreset = (name) => {
    setPreset(name);
    setP(prev => ({ ...prev, ...PRESETS[name] }));
  };

  const vase = React.useMemo(() => generateVase(p), [p]);

  const onExport = () => {
    const name = preset.replace(/\s/g, '_') + '_' + Date.now().toString(36);
    const buffer = stlFromVase(vase);
    const blob = new Blob([buffer], { type: 'model/stl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.stl`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`STL exported · ${name}.stl · ${vase.stats.filamentMeters.toFixed(1)}m filament`);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: C.soft, color: C.ink,
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Header onExport={onExport} preset={preset} onPresetChange={onPreset} units="mm"/>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: parameters */}
        <aside style={{
          width: 340, background: C.paper, borderRight: `3px solid ${C.ink}`,
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <ParamPanel p={p} setP={setP}/>
        </aside>

        {/* Center: 3D preview */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#0d0f10' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', position: 'relative' }}>
            <AutoSizePreview vase={vase} progress={progress} yaw={yaw} pitch={pitch} setYaw={setYaw} setPitch={setPitch} renderMode={renderMode} cameraMode={cameraMode}/>
            {/* corner cluster: orbit quick-reset — bottom right */}
            <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 8, zIndex: 2 }}>
              {[[0, -1.4, 'front'], [0.4, -0.55, 'angled'], [0, -0.05, 'top']].map(([y, pt, label]) => (
                <button key={label}
                  onClick={() => { setYaw(y); setPitch(pt); }}
                  style={{
                    padding: '5px 10px', background: C.paper, color: C.ink,
                    border: `2px solid ${C.ink}`, fontFamily: 'inherit',
                    fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: `2px 2px 0 ${C.ink}`,
                  }}
                >{label}</button>
              ))}
            </div>
            {/* camera + render mode toggles — top right */}
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
              {[
                { value: cameraMode, set: setCameraMode, opts: [['ortho', 'Ortho'], ['persp', 'Persp']] },
                { value: renderMode, set: setRenderMode, opts: [['wire', 'Wire'], ['solid', 'Solid']] },
              ].map((group, gi) => (
                <div key={gi} style={{ display: 'flex', gap: 0, border: `2px solid ${C.paper}` }}>
                  {group.opts.map(([val, lbl], i) => {
                    const active = group.value === val;
                    return (
                      <button key={val}
                        onClick={() => group.set(val)}
                        style={{
                          padding: '6px 12px',
                          background: active ? C.ink : C.paper,
                          color: active ? C.paper : C.ink,
                          border: 'none', borderLeft: i === 0 ? 'none' : `2px solid ${C.paper}`,
                          fontFamily: 'inherit', fontWeight: 800, fontSize: 10,
                          letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                        }}
                      >{lbl}</button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: stats strip */}
          <div style={{
            background: C.paper, borderTop: `3px solid ${C.ink}`, padding: 12,
            display: 'flex', gap: 10, flexShrink: 0,
          }}>
            <Stat label="Layers" value={vase.stats.layerCount} unit=""/>
            <Stat label="Layer h" value={p.layerHeight.toFixed(2)} unit="mm"/>
            <Stat label="Path" value={vase.stats.pathLengthM.toFixed(1)} unit="m"/>
            <Stat label="Filament" value={vase.stats.filamentMeters.toFixed(1)} unit="m"/>
            <Stat label="Weight" value={vase.stats.weightGrams.toFixed(0)} unit="g"/>
            <Stat label="Print time" value={formatTime(vase.stats.timeSeconds)} unit=""/>
            <Stat label="Mode" value="Spiral" unit=""/>
          </div>
        </main>

        {/* Right: profile + scrubber */}
        <aside style={{
          width: 300, background: C.paper, borderLeft: `3px solid ${C.ink}`,
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: C.yellow, border: `1.5px solid ${C.ink}` }}/>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Profile
            </span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted }}>
              side view
            </span>
          </div>
          <ProfilePanel vase={vase} progress={progress} onProgressChange={setProgress}
            playing={playing} onTogglePlay={() => setPlaying(!playing)}
            width={300} height={360}/>

          <div style={{ padding: '12px 14px', borderTop: `2px solid ${C.ink}`, borderBottom: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, background: C.red, border: `1.5px solid ${C.ink}` }}/>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Print sequence
            </span>
          </div>

          {/* Layer readout */}
          <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              padding: 10, border: `2px solid ${C.ink}`, background: C.soft,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
                Current layer
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 24, fontWeight: 700 }}>
                {Math.round(progress * vase.stats.layerCount).toString().padStart(4, '0')}
                <span style={{ fontSize: 13, color: C.muted }}> / {vase.stats.layerCount}</span>
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C.muted }}>
                Z = {(progress * p.height).toFixed(2)} mm
              </span>
            </div>

            <div style={{
              padding: 10, border: `2px solid ${C.ink}`, background: C.paper,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
                Elapsed
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700 }}>
                {formatTime(vase.stats.timeSeconds * progress)} / {formatTime(vase.stats.timeSeconds)}
              </span>
            </div>

            <div style={{ marginTop: 'auto', padding: 10, border: `2px dashed ${C.ink}`, background: C.paper }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>
                Vase mode
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: C.ink }}>
                Single-wall spiral. One continuous extrusion path climbs
                {' '}<strong>{p.height.toFixed(0)}mm</strong> without a Z-seam.
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Toast message={toast} onClose={() => setToast(null)}/>
    </div>
  );
}

function AutoSizePreview({ vase, progress, yaw, pitch, setYaw, setPitch, renderMode, cameraMode }) {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ w: 800, h: 600 });
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => {
      if (ref.current) setSize({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    });
    ro.observe(ref.current);
    setSize({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Preview3D vase={vase} progress={progress}
        yaw={yaw} pitch={pitch}
        onYawChange={setYaw} onPitchChange={setPitch}
        renderMode={renderMode}
        cameraMode={cameraMode}
        width={size.w} height={size.h}/>
    </div>
  );
}
