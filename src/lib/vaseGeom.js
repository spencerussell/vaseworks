// Vase geometry generator — produces ring samples per layer
const TAU = Math.PI * 2;

function lerp(a, b, t) { return a + (b - a) * t; }

function ringNoise(angle, seed, octaves) {
  octaves = octaves || 3;
  let v = 0, amp = 1, totalAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const freq = Math.pow(2, o) + 1;
    const s = seed + o * 7.31;
    v += amp * (Math.sin(angle * freq + s) + Math.sin(angle * freq * 1.73 + s * 2.1)) * 0.5;
    totalAmp += amp;
    amp *= 0.55;
  }
  return v / totalAmp;
}

function baseProfile(heightT, p) {
  const linear = lerp(p.bottomRadius, p.topRadius, heightT);
  const d = heightT - p.waistHeight;
  const bell = Math.exp(-(d * d) / 0.04);
  const pinchAmount = p.waistPinch * ((p.bottomRadius + p.topRadius) / 2) * 0.35;
  return Math.max(1.5, linear + pinchAmount * bell);
}

export function generateVase(params) {
  const p = Object.assign({
    height: 120, bottomRadius: 30, topRadius: 35, waistPinch: 0, waistHeight: 0.5,
    layerHeight: 0.3, segments: 96, wallThickness: 1.2,
    flutesEnabled: false, flutesCount: 12, flutesDepth: 2,
    wavesEnabled: false, wavesFreq: 8, wavesAmp: 1.5,
    facetsEnabled: false, facetsSides: 6, facetsSharpness: 0.5,
    twistEnabled: false, twistDegrees: 90,
    lumpsEnabled: false, lumpsAmount: 1.5, lumpsSeed: 1,
    spiralEnabled: false, spiralCount: 3, spiralDepth: 1.5, spiralPitch: 40,
    embossEnabled: false, embossPattern: "diamond", embossScale: 14, embossDepth: 0.8,
  }, params);
  const layerCount = Math.max(4, Math.round(p.height / p.layerHeight));
  const layers = [];
  for (let li = 0; li < layerCount; li++) {
    const z = li * p.layerHeight;
    const t = li / (layerCount - 1);
    const ring = [];
    const baseR = baseProfile(t, p);
    // Full modifier amplitude across the entire height — top and bottom outlines
    // match the rest of the surface (no fade-to-circle at the rim/base).
    const modFade = 1;
    const twistRad = p.twistEnabled ? (p.twistDegrees * Math.PI / 180) * t : 0;
    for (let si = 0; si < p.segments; si++) {
      const theta0 = (si / p.segments) * TAU;
      const theta = theta0 + twistRad;
      let r = baseR;
      if (p.flutesEnabled) {
        const soft = Math.cos(theta * p.flutesCount) * 0.5 - 0.5;
        r += soft * p.flutesDepth * modFade;
      }
      if (p.wavesEnabled) {
        r += Math.sin((z / p.height) * TAU * p.wavesFreq) * p.wavesAmp * modFade;
      }
      if (p.facetsEnabled && p.facetsSides >= 3) {
        const n = p.facetsSides;
        const sectorAngle = TAU / n;
        const a = ((theta % sectorAngle) + sectorAngle) % sectorAngle - sectorAngle / 2;
        const polyR = baseR * Math.cos(Math.PI / n) / Math.cos(a);
        r = lerp(r, polyR, p.facetsSharpness * modFade);
      }
      if (p.lumpsEnabled) {
        r += ringNoise(theta * 1.5, p.lumpsSeed + z * 0.02, 3) * p.lumpsAmount * modFade;
      }
      if (p.spiralEnabled) {
        const pitchTurns = p.height / Math.max(1, p.spiralPitch);
        const ribPhase = theta * p.spiralCount + (z / p.height) * TAU * pitchTurns * p.spiralCount;
        r += (Math.cos(ribPhase) * 0.5 - 0.5) * p.spiralDepth * modFade;
      }
      if (p.embossEnabled) {
        const u = theta * baseR;
        const v = z;
        let d = 0;
        if (p.embossPattern === "diamond") {
          const sx = p.embossScale;
          const cx2 = ((u % sx) + sx) % sx - sx / 2;
          const cy2 = ((v % sx) + sx) % sx - sx / 2;
          const diamond = (Math.abs(cx2) + Math.abs(cy2)) / (sx / 2);
          d = (1 - Math.min(1, diamond)) * 2 - 1;
        } else if (p.embossPattern === "hex") {
          const sx = p.embossScale;
          const row = Math.floor(v / (sx * 0.866));
          const offset = (row % 2) * sx / 2;
          const cx2 = (((u + offset) % sx) + sx) % sx - sx / 2;
          const cy2 = ((v % (sx * 0.866)) + sx * 0.866) % (sx * 0.866) - sx * 0.433;
          d = 1 - Math.min(1, Math.sqrt(cx2 * cx2 + cy2 * cy2) / (sx * 0.45));
        }
        r += d * p.embossDepth * modFade;
      }
      ring.push({ x: Math.cos(theta0) * r, y: Math.sin(theta0) * r, z: z, r: r, theta: theta0 });
    }
    layers.push(ring);
  }
  let pathLength = 0;
  for (const ring of layers) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      pathLength += Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  pathLength += p.height;
  const filamentDiameter = 1.75, lineWidth = 0.4;
  const lineArea = lineWidth * p.layerHeight;
  const filamentArea = Math.PI * (filamentDiameter / 2) * (filamentDiameter / 2);
  const filamentLength = (pathLength * lineArea) / filamentArea;
  const baseVolume = Math.PI * layers[0][0].r * layers[0][0].r * (p.layerHeight * 3);
  const baseFilamentLength = baseVolume / filamentArea;
  const totalFilament = (filamentLength + baseFilamentLength) / 1000;
  const density = 1.24;
  const weight = (filamentLength * filamentArea + baseVolume) / 1000 * density;
  const timeSeconds = pathLength / 80;
  return { layers: layers, params: p, layerCount: layerCount, stats: {
    layerCount: layerCount, filamentMeters: totalFilament, weightGrams: weight,
    timeSeconds: timeSeconds, pathLengthM: pathLength / 1000,
  }};
}

export const PRESETS = {
  "cylinder": { height: 120, bottomRadius: 30, topRadius: 30, waistPinch: 0, waistHeight: 0.5 },
  "tumbler": { height: 100, bottomRadius: 28, topRadius: 34, waistPinch: 0, waistHeight: 0.5 },
  "amphora": { height: 160, bottomRadius: 22, topRadius: 18, waistPinch: 0.6, waistHeight: 0.35 },
  "bowl": { height: 55, bottomRadius: 20, topRadius: 50, waistPinch: 0, waistHeight: 0.5 },
  "planter": { height: 90, bottomRadius: 35, topRadius: 48, waistPinch: 0, waistHeight: 0.5 },
  "bud vase": { height: 140, bottomRadius: 18, topRadius: 14, waistPinch: -0.3, waistHeight: 0.7 },
  "hourglass": { height: 130, bottomRadius: 32, topRadius: 32, waistPinch: -0.7, waistHeight: 0.5 },
  "bulb": { height: 110, bottomRadius: 20, topRadius: 16, waistPinch: 0.9, waistHeight: 0.4 },
};

// Binary STL exporter — outer wall surface + flat bottom cap, open top.
// Standard authoring pattern for vase-mode-compatible STLs: the slicer
// reads the outer surface and spiralizes it. Triangle winding is chosen so
// every face's normal points away from the central Z axis (walls) or
// straight down (bottom cap).
export function stlFromVase(vase) {
  const layers = vase.layers;
  const layerCount = layers.length;
  const segments = layers[0].length;
  const wallTris = (layerCount - 1) * segments * 2;
  const bottomTris = segments;
  const triCount = wallTris + bottomTris;
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  // 80-byte header is left zero-filled; uint32 triangle count follows.
  view.setUint32(80, triCount, true);
  let off = 84;
  const writeTri = (ax, ay, az, bx, by, bz, cx, cy, cz) => {
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len > 0) { nx /= len; ny /= len; nz /= len; } else { nx = ny = nz = 0; }
    view.setFloat32(off, nx, true); view.setFloat32(off + 4, ny, true); view.setFloat32(off + 8, nz, true);
    view.setFloat32(off + 12, ax, true); view.setFloat32(off + 16, ay, true); view.setFloat32(off + 20, az, true);
    view.setFloat32(off + 24, bx, true); view.setFloat32(off + 28, by, true); view.setFloat32(off + 32, bz, true);
    view.setFloat32(off + 36, cx, true); view.setFloat32(off + 40, cy, true); view.setFloat32(off + 44, cz, true);
    view.setUint16(off + 48, 0, true);
    off += 50;
  };
  // Outer wall: for each pair of adjacent layers (lower L, upper U) and
  // adjacent segments (i, i+1), emit two triangles. With segments running
  // CCW about +Z and U above L, the order L[i] → L[i+1] → U[i+1] and
  // L[i] → U[i+1] → U[i] yields radially-outward normals.
  for (let li = 0; li < layerCount - 1; li++) {
    const L = layers[li], U = layers[li + 1];
    for (let si = 0; si < segments; si++) {
      const ni = (si + 1) % segments;
      const a = L[si], b = L[ni], c = U[ni], d = U[si];
      writeTri(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      writeTri(a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    }
  }
  // Bottom cap: triangle fan from origin to layer-0 ring. Order
  // center → ring[i+1] → ring[i] gives a -Z normal (outward, since the
  // bottom faces down).
  const ring0 = layers[0];
  const z0 = ring0[0].z;
  for (let si = 0; si < segments; si++) {
    const ni = (si + 1) % segments;
    const a = ring0[si], b = ring0[ni];
    writeTri(0, 0, z0, b.x, b.y, b.z, a.x, a.y, a.z);
  }
  return buffer;
}
