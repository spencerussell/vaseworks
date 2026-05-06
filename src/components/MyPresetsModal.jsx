import React from 'react';
import { C } from './Controls.jsx';

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = 60 * 1000, hour = 60 * min, day = 24 * hour, week = 7 * day;
  if (diff < min) return 'Just now';
  if (diff < hour) {
    const m = Math.floor(diff / min);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < week) {
    const d = Math.floor(diff / day);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ACTION_BTN_STYLE = {
  padding: '5px 10px', background: C.paper, color: C.ink,
  border: `2px solid ${C.ink}`, fontFamily: 'inherit',
  fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
  textTransform: 'uppercase', cursor: 'pointer',
};

export function MyPresetsModal({
  open, onClose, returnFocusRef,
  presets, onSave, onRename, onDelete, onLoad, onSharePreset,
  autoFocusInput,
}) {
  const dialogRef = React.useRef(null);
  const closeBtnRef = React.useRef(null);
  const nameInputRef = React.useRef(null);

  const [nameInput, setNameInput] = React.useState('');
  const [saveError, setSaveError] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null);
  const [editingDraft, setEditingDraft] = React.useState('');
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
  const [sharedById, setSharedById] = React.useState({});

  React.useEffect(() => {
    if (!open) return;
    setNameInput('');
    setSaveError(null);
    setEditingId(null);
    setConfirmDeleteId(null);
    setSharedById({});

    const previouslyFocused = document.activeElement;
    const focusInitial = () => {
      if (autoFocusInput && nameInputRef.current) nameInputRef.current.focus();
      else closeBtnRef.current?.focus();
    };
    focusInitial();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusable = Array.from(root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
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
  }, [open, onClose, returnFocusRef, autoFocusInput]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const result = onSave(trimmed);
    if (result.ok) {
      setNameInput('');
      setSaveError(null);
    } else {
      setSaveError(result.error || 'Couldn’t save preset');
    }
  };

  const startRename = (preset) => {
    setEditingId(preset.id);
    setEditingDraft(preset.name);
  };

  const commitRename = () => {
    if (editingId == null) return;
    const trimmed = editingDraft.trim();
    if (trimmed) onRename(editingId, trimmed);
    setEditingId(null);
  };

  const cancelRename = () => setEditingId(null);

  const handleSharePreset = async (preset) => {
    const ok = await onSharePreset(preset);
    setSharedById(prev => ({ ...prev, [preset.id]: ok ? 'copied' : 'error' }));
    setTimeout(() => {
      setSharedById(prev => {
        const next = { ...prev };
        delete next[preset.id];
        return next;
      });
    }, 2000);
  };

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
        aria-labelledby="my-presets-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper,
          border: `3px solid ${C.ink}`,
          boxShadow: `8px 8px 0 ${C.yellow}`,
          maxWidth: 640, width: '100%', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '12px 16px', borderBottom: `3px solid ${C.ink}`,
          background: C.yellow, flexShrink: 0, gap: 12,
        }}>
          <div style={{ width: 12, height: 12, background: C.blue, border: `1.5px solid ${C.ink}` }}/>
          <h2 id="my-presets-title" style={{
            margin: 0, fontSize: 16, fontWeight: 900,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink,
          }}>
            My Presets
          </h2>
          <div style={{ flex: 1 }}/>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close my presets"
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
          {/* Save current vase */}
          <div style={{
            padding: '16px 18px',
            borderBottom: `2px solid ${C.ink}`,
            background: C.soft,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            }}>
              <div style={{ width: 8, height: 8, background: C.red, border: `1.5px solid ${C.ink}` }}/>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: C.ink,
              }}>
                Save current vase
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                placeholder="Name this preset"
                aria-label="Preset name"
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameInput.trim()) handleSave();
                }}
                maxLength={60}
                style={{
                  flex: 1, padding: '8px 10px',
                  border: `2px solid ${C.ink}`, background: C.paper,
                  fontFamily: 'inherit', fontSize: 13, color: C.ink,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSave}
                disabled={!nameInput.trim()}
                aria-label="Save current vase as preset"
                style={{
                  padding: '8px 14px',
                  background: nameInput.trim() ? C.ink : C.soft,
                  color: nameInput.trim() ? C.paper : C.muted,
                  border: `2px solid ${C.ink}`,
                  fontFamily: 'inherit', fontWeight: 900, fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: nameInput.trim() ? `2px 2px 0 ${C.ink}` : 'none',
                }}
              >
                Save current vase
              </button>
            </div>
            {saveError && (
              <div role="alert" style={{
                marginTop: 8, padding: '6px 10px',
                background: C.red, color: C.paper,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                border: `2px solid ${C.ink}`,
              }}>
                {saveError}
              </div>
            )}
          </div>

          {/* Saved presets list */}
          <div style={{ padding: '14px 18px' }}>
            {presets.length === 0 ? (
              <div style={{
                padding: '24px 12px',
                fontSize: 13, lineHeight: 1.55, color: C.muted,
                textAlign: 'center',
                border: `2px dashed ${C.ink}`,
                background: C.paper,
              }}>
                No saved presets yet. Adjust the vase, name it above,
                and save to see it here.
              </div>
            ) : (
              <ul style={{
                listStyle: 'none', margin: 0, padding: 0,
                border: `2px solid ${C.ink}`,
              }}>
                {presets.map((preset, i) => (
                  <li key={preset.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    borderTop: i === 0 ? 'none' : `1px solid ${C.ink}`,
                    background: C.paper,
                  }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {editingId === preset.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingDraft}
                          aria-label={`Rename preset ${preset.name}`}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                            else if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                          }}
                          onBlur={commitRename}
                          maxLength={60}
                          style={{
                            padding: '4px 6px', fontSize: 13, fontWeight: 700,
                            border: `2px solid ${C.ink}`, background: C.soft,
                            color: C.ink, fontFamily: 'inherit', outline: 'none',
                            width: '100%', minWidth: 0,
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => startRename(preset)}
                          title={preset.name}
                          aria-label={`Rename preset ${preset.name}`}
                          style={{
                            display: 'block', textAlign: 'left',
                            padding: 0, margin: 0,
                            background: 'transparent', border: 'none',
                            fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                            color: C.ink, cursor: 'text',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {preset.name}
                        </button>
                      )}
                      <span style={{
                        fontFamily: 'ui-monospace, monospace', fontSize: 10, color: C.muted,
                      }}>
                        {relativeTime(preset.createdAt)}
                      </span>
                    </div>

                    {confirmDeleteId === preset.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: C.ink,
                        }}>
                          Delete?
                        </span>
                        <button
                          onClick={() => { onDelete(preset.id); setConfirmDeleteId(null); }}
                          aria-label={`Confirm delete preset ${preset.name}`}
                          style={{ ...ACTION_BTN_STYLE, background: C.red, color: C.paper, borderColor: C.ink }}
                        >Yes</button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label="Cancel delete"
                          style={ACTION_BTN_STYLE}
                        >No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => onLoad(preset)}
                          aria-label={`Load preset ${preset.name}`}
                          style={ACTION_BTN_STYLE}
                        >Load</button>
                        <button
                          onClick={() => handleSharePreset(preset)}
                          aria-label={
                            sharedById[preset.id] === 'copied'
                              ? `Link copied for ${preset.name}`
                              : `Share preset ${preset.name}`
                          }
                          style={{
                            ...ACTION_BTN_STYLE,
                            background: sharedById[preset.id] === 'copied' ? C.teal :
                              sharedById[preset.id] === 'error' ? C.red : C.paper,
                            color: sharedById[preset.id] ? C.paper : C.ink,
                            transition: 'background 0.12s',
                            minWidth: 70,
                          }}
                        >
                          {sharedById[preset.id] === 'copied' ? 'Copied' :
                            sharedById[preset.id] === 'error' ? 'Failed' : 'Share'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(preset.id)}
                          aria-label={`Delete preset ${preset.name}`}
                          style={ACTION_BTN_STYLE}
                        >Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
