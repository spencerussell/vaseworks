// presetsStore.js — persistence for user-saved vase presets.
// Schema: array of { id, name, createdAt (ISO string), state }.

const STORAGE_KEY = 'vaseworks:presets';

export function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(p =>
      p && typeof p === 'object' &&
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.createdAt === 'string' &&
      p.state && typeof p.state === 'object'
    );
  } catch (e) {
    return [];
  }
}

export function savePresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return { ok: true };
  } catch (e) {
    const isQuota =
      e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    return {
      ok: false,
      error: isQuota ? 'Couldn’t save — storage full' : 'Couldn’t save preset',
    };
  }
}

export function newPresetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
