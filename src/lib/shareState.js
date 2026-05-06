// shareState.js — encode/decode the shareable vase design state.
//
// The shareable state covers everything that affects the printed geometry:
// silhouette, print parameters, and every surface modifier. View state
// (camera, render mode, scrub position, active built-in preset) is excluded.
//
// Wire format: base64( JSON({ v: 1, ...short-keyed fields }) ).
// Short keys keep typical configs around 100–250 chars of base64.

const SCHEMA_VERSION = 1;

// [longKey, shortKey, kind, min, max] — kind is 'num' | 'int' | 'bool' | enum-array.
// Order is the canonical schema. Booleans are encoded as 1/0.
const FIELDS = [
  // Silhouette
  ['height',          'h',   'num',  30,   250],
  ['bottomRadius',    'br',  'num',  8,    60],
  ['topRadius',       'tr',  'num',  8,    60],
  ['waistPinch',      'wp',  'num',  -1,   1],
  ['waistHeight',     'wh',  'num',  0.1,  0.9],
  // Print
  ['layerHeight',     'lh',  'num',  0.1,  0.6],
  ['segments',        'sg',  'int',  32,   192],
  ['wallThickness',   'wt',  'num',  0.4,  2.4],
  // Vertical Flutes
  ['flutesEnabled',   'fl',  'bool'],
  ['flutesCount',     'flc', 'int',  4,    48],
  ['flutesDepth',     'fld', 'num',  0.3,  6],
  // Horizontal Waves
  ['wavesEnabled',    'wv',  'bool'],
  ['wavesFreq',       'wvf', 'int',  1,    30],
  ['wavesAmp',        'wva', 'num',  0.2,  5],
  // Faceted Cross-Section
  ['facetsEnabled',   'fc',  'bool'],
  ['facetsSides',     'fcs', 'int',  3,    16],
  ['facetsSharpness', 'fch', 'num',  0,    1],
  // Twist
  ['twistEnabled',    'tw',  'bool'],
  ['twistDegrees',    'twd', 'num',  -720, 720],
  // Organic Lumps
  ['lumpsEnabled',    'lm',  'bool'],
  ['lumpsAmount',     'lma', 'num',  0.2,  6],
  ['lumpsSeed',       'lms', 'int',  1,    30],
  // Helical Spiral Ribs
  ['spiralEnabled',   'sp',  'bool'],
  ['spiralCount',     'spc', 'int',  1,    12],
  ['spiralDepth',     'spd', 'num',  0.3,  5],
  ['spiralPitch',     'spp', 'num',  10,   120],
  // Embossed Pattern
  ['embossEnabled',   'em',  'bool'],
  ['embossPattern',   'emp', ['diamond', 'hex']],
  ['embossScale',     'ems', 'num',  5,    40],
  ['embossDepth',     'emd', 'num',  0.2,  3],
];

export const SHARE_FIELD_NAMES = FIELDS.map(f => f[0]);

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function base64UrlSafeEncode(str) {
  // btoa handles latin-1; the JSON we feed it is ASCII so this is safe.
  return btoa(str);
}

function base64UrlSafeDecode(str) {
  return atob(str);
}

// Pick only the shareable fields from the full param object.
export function pickShareableState(params) {
  const out = {};
  for (const [longKey] of FIELDS) {
    if (longKey in params) out[longKey] = params[longKey];
  }
  return out;
}

export function encodeState(state) {
  const compact = { v: SCHEMA_VERSION };
  for (const [longKey, shortKey, kind] of FIELDS) {
    const val = state[longKey];
    if (val === undefined) continue;
    if (kind === 'bool') {
      compact[shortKey] = val ? 1 : 0;
    } else if (Array.isArray(kind)) {
      compact[shortKey] = val;
    } else {
      compact[shortKey] = val;
    }
  }
  return base64UrlSafeEncode(JSON.stringify(compact));
}

// Build the canonical share URL for the given (already-shareable) state.
export function buildShareUrl(state) {
  return `${window.location.origin}${window.location.pathname}?v=${encodeState(state)}`;
}

// Copy text to clipboard. Tries the async Clipboard API first, falls back to
// the legacy textarea+execCommand path when the page isn't in a secure context
// or the API is blocked. Returns true on success.
export async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

export function decodeState(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0) return null;
  let json;
  try {
    json = base64UrlSafeDecode(encoded);
  } catch (e) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  if (parsed.v !== SCHEMA_VERSION) return null;

  const out = {};
  for (const field of FIELDS) {
    const [longKey, shortKey, kind, min, max] = field;
    const raw = parsed[shortKey];
    if (raw === undefined) continue;
    if (kind === 'bool') {
      out[longKey] = raw === 1 || raw === true;
    } else if (Array.isArray(kind)) {
      if (kind.includes(raw)) out[longKey] = raw;
    } else {
      const n = typeof raw === 'number' ? raw : parseFloat(raw);
      if (!Number.isFinite(n)) continue;
      let clamped = clamp(n, min, max);
      if (kind === 'int') clamped = Math.round(clamped);
      out[longKey] = clamped;
    }
  }
  return out;
}
