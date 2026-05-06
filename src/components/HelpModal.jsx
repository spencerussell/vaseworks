import React from 'react';
import { C, Section } from './Controls.jsx';
import pkg from '../../package.json';

const SHORT_VERSION = pkg.version.split('.').slice(0, 2).join('.');

export function HelpModal({ open, onClose, returnFocusRef }) {
  const closeBtnRef = React.useRef(null);
  const dialogRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusable = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const target = returnFocusRef?.current ?? previouslyFocused;
      if (target && typeof target.focus === 'function') target.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(11,10,8,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 24,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper,
          border: `3px solid ${C.ink}`,
          boxShadow: `8px 8px 0 ${C.yellow}`,
          maxWidth: 780, width: '100%', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '12px 16px', borderBottom: `3px solid ${C.ink}`,
          background: C.yellow, flexShrink: 0, gap: 12,
        }}>
          <div style={{ width: 12, height: 12, background: C.red, border: `1.5px solid ${C.ink}` }}/>
          <h2 id="help-modal-title" style={{
            margin: 0, fontSize: 16, fontWeight: 900,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink,
          }}>
            Printing your vase
          </h2>
          <div style={{ flex: 1 }}/>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close help"
            style={{
              width: 32, height: 32, padding: 0,
              background: C.paper, color: C.ink,
              border: `2px solid ${C.ink}`,
              boxShadow: `2px 2px 0 ${C.ink}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 2 L10 10 M10 2 L2 10" stroke={C.ink} strokeWidth="2.5" strokeLinecap="square"/>
            </svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '22px 22px 18px 22px' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 22 }}>
              <div style={{
                width: 220, aspectRatio: '822 / 682', flexShrink: 0,
                border: `2px solid ${C.ink}`,
                boxShadow: `4px 4px 0 ${C.ink}`,
                overflow: 'hidden',
              }}>
                <img
                  src="/vase-example.jpg"
                  alt="A 3D-printed vase printed in vase mode"
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  borderBottom: `2px solid ${C.ink}`, paddingBottom: 6,
                }}>
                  <div style={{ width: 10, height: 10, background: C.blue, border: `1.5px solid ${C.ink}` }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink }}>
                    What is vase mode?
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: C.ink }}>
                  Vase mode (also called spiral mode) prints your model as one continuous spiral
                  instead of discrete layers. The printer never stops or starts, the nozzle
                  climbs gradually as it traces the outer wall. The result is a single-wall
                  spiral vessel with no Z-seam, printed faster and using less filament than
                  a normal print. Best for vases, planters, lampshades, and decorative vessels.
                </p>
              </div>
            </div>

            <Section title="Enable vase mode in your slicer" dotColor={C.red}>
              <SlicerCard name="Bambu Studio" accent={C.red}>
                Open your STL. In the Process settings, go to the <Em>Others</Em> tab and find
                the <Em>Special mode</Em> section — enable the <Em>Spiral vase</Em> checkbox.
                Bambu will warn about settings adjustments (single wall, no top layers); accept
                these.
              </SlicerCard>
              <SlicerCard name="PrusaSlicer / OrcaSlicer" accent={C.blue}>
                Open your STL, go to the <Em>Print Settings</Em> tab, under{' '}
                <Em>Layers and perimeters</Em>, enable <Em>Spiral vase</Em> at the bottom.
                Confirm the warning about disabling incompatible settings.
              </SlicerCard>
              <SlicerCard name="Cura" accent={C.teal}>
                Open your STL, in the <Em>Print Settings</Em> sidebar, search{' '}
                <Em>spiralize</Em>, enable <Em>Spiralize Outer Contour</Em>. Optionally enable{' '}
                <Em>Smooth Spiralized Contours</Em> for cleaner results.
              </SlicerCard>
            </Section>
          </div>

          <div style={{
            padding: '14px 22px',
            borderTop: `2px dashed ${C.ink}`,
            background: C.soft,
            fontSize: 12, lineHeight: 1.55, color: C.muted,
          }}>
            <strong style={{ color: C.ink, fontWeight: 800, letterSpacing: '0.04em' }}>
              Note ·
            </strong>{' '}
            Settings vary by slicer version. If you don't see vase mode, search your slicer's
            settings for <Em>spiral</Em> or <Em>vase</Em>.
          </div>
        </div>

        <div style={{
          flexShrink: 0,
          padding: '8px 22px',
          borderTop: `1px solid ${C.ink}`,
          background: C.paper,
          fontSize: 10.5, color: C.muted,
          textAlign: 'center', letterSpacing: '0.04em',
        }}>
          Vaseworks v{SHORT_VERSION}{' · '}
          Designed by{' '}
          <a
            href="https://www.spencer-russell.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.ink, fontWeight: 700, textDecoration: 'underline' }}
          >Spencer Russell</a>
          {' · '}
          <a
            href="https://github.com/spencerussell/vaseworks"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.ink, fontWeight: 700, textDecoration: 'underline' }}
          >GitHub</a>
        </div>
      </div>
    </div>
  );
}

function SlicerCard({ name, accent, children }) {
  return (
    <div style={{ border: `2px solid ${C.ink}`, background: C.paper }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px',
        background: accent, color: C.paper,
        borderBottom: `2px solid ${C.ink}`,
      }}>
        <div style={{ width: 8, height: 8, background: C.paper, border: `1.5px solid ${C.ink}` }}/>
        <span style={{
          fontSize: 11, fontWeight: 900,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {name}
        </span>
      </div>
      <div style={{
        padding: '11px 13px',
        fontSize: 13, lineHeight: 1.6, color: C.ink,
      }}>
        {children}
      </div>
    </div>
  );
}

function Em({ children }) {
  return (
    <span style={{
      fontFamily: 'ui-monospace, monospace',
      fontSize: '0.92em',
      background: C.soft,
      padding: '1px 5px',
      border: `1px solid ${C.ink}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
