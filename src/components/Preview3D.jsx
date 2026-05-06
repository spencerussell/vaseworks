// Preview3D.jsx — SVG-based 3D-ish rendering of the vase with layer contour lines.
// Uses isometric projection with a user-controlled rotation (drag to spin).
// Renders filled base, contour layers (clipped by build progress), outline silhouette.
import React from 'react';

const P3D_COLORS = {
  bg: '#0d0f10',
  grid: '#1a1d1f',
  layer: '#4ec9b0',
  layerFade: '#2a5f54',
  silhouette: '#7be0cc',
  base: '#c34a36',
  baseStroke: '#ff8a5b',
  axis: '#2a2e30',
  accent: '#f5d547',
  label: '#6b7577',
};

function project(x, y, z, yaw, pitch) {
  // yaw: rotate around z-axis, pitch: tilt
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy - y * sy;
  const y1 = x * sy + y * cy;
  // now tilt about x-axis (rotate y/z)
  const y2 = y1 * cp - z * sp;
  const z2 = y1 * sp + z * cp;
  return { x: x1, y: y2, depth: z2 };
}

export function Preview3D({ vase, progress, yaw, pitch, onYawChange, onPitchChange, width = 640, height = 640, showLayers = true, showPath = false, renderMode = 'wire' }) {
  const dragging = React.useRef(null);

  const onDown = (e) => {
    const pt = e.touches ? e.touches[0] : e;
    dragging.current = { x: pt.clientX, y: pt.clientY, yaw, pitch };
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - dragging.current.x;
    const dy = pt.clientY - dragging.current.y;
    onYawChange(dragging.current.yaw + dx * 0.01);
    onPitchChange(Math.max(-1.45, Math.min(0.05, dragging.current.pitch - dy * 0.008)));
  };
  const onUp = () => { dragging.current = null; };

  React.useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  });

  if (!vase) return null;

  const { layers, params } = vase;
  const maxR = Math.max(...layers.map(r => Math.max(...r.map(p => Math.hypot(p.x, p.y))))) + 4;
  const totalHeight = params.height;

  // Auto-fit: project a representative sample of vertices to find the actual on-screen
  // bounding box, then center it in the viewport. This adapts cleanly to any pitch/yaw
  // (a tilted vase needs less vertical space than its physical height).
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
  let projMinX = Infinity, projMaxX = -Infinity, projMinY = Infinity, projMaxY = -Infinity;
  // Sample top, mid, bottom rings (covers the silhouette extent under any rotation)
  const sampleRings = [layers[0], layers[Math.floor(layers.length / 2)], layers[layers.length - 1]];
  for (const ring of sampleRings) {
    for (const pt of ring) {
      // project without scaling
      const x1 = pt.x * cyaw - pt.y * syaw;
      const y1 = pt.x * syaw + pt.y * cyaw;
      const y2 = y1 * cp - pt.z * sp;
      if (x1 < projMinX) projMinX = x1;
      if (x1 > projMaxX) projMaxX = x1;
      if (y2 < projMinY) projMinY = y2;
      if (y2 > projMaxY) projMaxY = y2;
    }
  }
  const projW = projMaxX - projMinX;
  const projH = projMaxY - projMinY;
  // Fit with padding (use 78% of viewport in each axis)
  const scaleX = (width * 0.78) / projW;
  const scaleY = (height * 0.78) / projH;
  const scale = Math.min(scaleX, scaleY);
  // Center the projected bounding box in the viewport
  const cx = width / 2 - ((projMinX + projMaxX) / 2) * scale;
  const cy = height / 2 + ((projMinY + projMaxY) / 2) * scale;

  const toScreen = (x, y, z) => {
    const p = project(x, y, z, yaw, pitch);
    return { x: cx + p.x * scale, y: cy - p.y * scale, depth: p.depth };
  };

  const visibleLayerCount = Math.max(1, Math.round(layers.length * progress));

  // Build path strings for each layer contour
  const layerPaths = [];
  if (showLayers && renderMode === 'wire') {
    // Render a fixed, sensible number of contour lines independent of layer count.
    // (More lines just creates visual noise — we want roughly even spacing on screen.)
    const targetLines = 140;
    const step = Math.max(1, Math.ceil(layers.length / targetLines));
    for (let li = 0; li < visibleLayerCount; li += step) {
      const ring = layers[li];
      const pts = ring.map(p => toScreen(p.x, p.y, p.z));
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) d += `L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
      d += 'Z';
      const t = li / layers.length;
      layerPaths.push({ d, t, li });
    }
  }

  // Build quad faces for solid mode — one quad per (segment, layer-pair)
  // Each quad is shaded by its normal (approximated from the two points on the ring).
  // We draw all quads sorted by depth (painter's algorithm).
  const faces = [];
  if (renderMode === 'solid' && visibleLayerCount >= 2) {
    // High-quality fixed sampling for the solid render. Enough vertical pairs and
    // horizontal segments to read as a smooth surface without flooding the SVG.
    const maxPairs = Math.min(layers.length, 150);
    const layerStep = Math.max(1, Math.ceil(layers.length / maxPairs));
    const segCountTotal = layers[0].length;
    const targetSegs = 144;
    const segStep = Math.max(1, Math.round(segCountTotal / targetSegs));
    // Light direction in SCREEN space (stays fixed relative to viewer as vase orbits).
    // We rotate each face's world-space normal by the same yaw/pitch, then dot with this.
    const lightDir = { x: -0.35, y: 0.35, z: 0.85 };
    const lMag = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= lMag; lightDir.y /= lMag; lightDir.z /= lMag;
    const cyR = Math.cos(yaw), syR = Math.sin(yaw);
    const cpR = Math.cos(pitch), spR = Math.sin(pitch);
    const rotateNormal = (nx, ny, nz) => {
      // Same transform as project(): yaw about z, then pitch about x
      const x1 = nx * cyR - ny * syR;
      const y1 = nx * syR + ny * cyR;
      const y2 = y1 * cpR - nz * spR;
      const z2 = y1 * spR + nz * cpR;
      return { x: x1, y: y2, z: z2 };
    };

    // Build the strided index lists once so we know our quad grid.
    const liList = [];
    for (let li = 0; li < visibleLayerCount - 1; li += layerStep) {
      liList.push(li);
    }
    if (liList.length === 0 || liList[liList.length - 1] !== visibleLayerCount - 1) {
      liList.push(visibleLayerCount - 1);
    }
    const siList = [];
    for (let si = 0; si < segCountTotal; si += segStep) siList.push(si);

    // ---- Pass 1: per-vertex normals (averaged across the quads touching each vertex)
    // grid[liIdx][siIdx] = {nx, ny, nz} in WORLD space, before camera rotation.
    const rows = liList.length, cols = siList.length;
    const vNorm = new Float32Array(rows * cols * 3);
    const cellAt = (riA, riB, ci) => {
      const a = layers[liList[riA]][siList[ci]];
      const b = layers[liList[riA]][siList[(ci + 1) % cols]];
      const c = layers[liList[riB]][siList[(ci + 1) % cols]];
      const d = layers[liList[riB]][siList[ci]];
      const e1x = b.x - a.x, e1y = b.y - a.y, e1z = b.z - a.z;
      const e2x = d.x - a.x, e2y = d.y - a.y, e2z = d.z - a.z;
      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;
      const m = Math.hypot(nx, ny, nz) || 1;
      nx /= m; ny /= m; nz /= m;
      const cxw = (a.x + c.x) / 2, cyw = (a.y + c.y) / 2;
      if (nx * cxw + ny * cyw < 0) { nx = -nx; ny = -ny; nz = -nz; }
      return { nx, ny, nz };
    };
    // For each vertex (ri, ci), average the up-to-4 quads it touches.
    for (let ri = 0; ri < rows; ri++) {
      for (let ci = 0; ci < cols; ci++) {
        let nx = 0, ny = 0, nz = 0;
        // four neighbouring quads: [ri-1,ci-1], [ri-1,ci], [ri,ci-1], [ri,ci]
        const ciLeft = (ci - 1 + cols) % cols;
        const tries = [
          [ri - 1, ciLeft], [ri - 1, ci],
          [ri, ciLeft],     [ri, ci],
        ];
        let count = 0;
        for (const [rA, cA] of tries) {
          if (rA < 0 || rA >= rows - 1) continue;
          const n = cellAt(rA, rA + 1, cA);
          nx += n.nx; ny += n.ny; nz += n.nz; count++;
        }
        if (count === 0) {
          // top/bottom edge — use radial outward as fallback
          const p = layers[liList[ri]][siList[ci]];
          const m = Math.hypot(p.x, p.y) || 1;
          nx = p.x / m; ny = p.y / m; nz = 0;
        } else {
          const m = Math.hypot(nx, ny, nz) || 1;
          nx /= m; ny /= m; nz /= m;
        }
        const idx = (ri * cols + ci) * 3;
        vNorm[idx] = nx; vNorm[idx + 1] = ny; vNorm[idx + 2] = nz;
      }
    }

    // ---- Pass 2: emit one quad per cell, with a linear gradient interpolating shade
    //               between two opposite corners (cheap Gouraud-ish).
    const shadeFor = (nx, ny, nz) => {
      const rn = rotateNormal(nx, ny, nz);
      const l = Math.max(0, rn.x * lightDir.x + rn.y * lightDir.y + rn.z * lightDir.z);
      return 0.22 + 0.78 * l;
    };
    const colFor = (s) => {
      const r1 = Math.round(70 + s * 180);
      const g1 = Math.round(55 + s * 140);
      const b1 = Math.round(40 + s * 95);
      return `rgb(${r1},${g1},${b1})`;
    };
    let gradId = 0;
    for (let ri = 0; ri < rows - 1; ri++) {
      const riNext = ri + 1;
      for (let ci = 0; ci < cols; ci++) {
        const ciNext = (ci + 1) % cols;
        const a = layers[liList[ri]][siList[ci]];
        const b = layers[liList[ri]][siList[ciNext]];
        const c = layers[liList[riNext]][siList[ciNext]];
        const d = layers[liList[riNext]][siList[ci]];
        // shades at the four corners using per-vertex normals
        const iA = (ri * cols + ci) * 3;
        const iB = (ri * cols + ciNext) * 3;
        const iC = (riNext * cols + ciNext) * 3;
        const iD = (riNext * cols + ci) * 3;
        const sA = toScreen(a.x, a.y, a.z);
        const sB = toScreen(b.x, b.y, b.z);
        const sC = toScreen(c.x, c.y, c.z);
        const sD = toScreen(d.x, d.y, d.z);
        // Back-face cull: average the four corner normals and test their camera-space
        // depth component. In our projection larger depth = closer to viewer, so a
        // normal whose depth component is negative points away from the camera.
        const avgNx = (vNorm[iA] + vNorm[iB] + vNorm[iC] + vNorm[iD]) / 4;
        const avgNy = (vNorm[iA + 1] + vNorm[iB + 1] + vNorm[iC + 1] + vNorm[iD + 1]) / 4;
        const avgNz = (vNorm[iA + 2] + vNorm[iB + 2] + vNorm[iC + 2] + vNorm[iD + 2]) / 4;
        const camN = rotateNormal(avgNx, avgNy, avgNz);
        const isBack = camN.z < -0.05;
        // Render back-facing quads too — they form the visible inside wall when
        // looking down through the open top. They use the inverted normal for
        // shading (the inside surface faces inward, so flip for correct light)
        // and are tinted darker to read as ambient-lit interior.
        const shA = shadeFor(
          isBack ? -vNorm[iA] : vNorm[iA],
          isBack ? -vNorm[iA + 1] : vNorm[iA + 1],
          isBack ? -vNorm[iA + 2] : vNorm[iA + 2]
        );
        const shB = shadeFor(
          isBack ? -vNorm[iB] : vNorm[iB],
          isBack ? -vNorm[iB + 1] : vNorm[iB + 1],
          isBack ? -vNorm[iB + 2] : vNorm[iB + 2]
        );
        const shC = shadeFor(
          isBack ? -vNorm[iC] : vNorm[iC],
          isBack ? -vNorm[iC + 1] : vNorm[iC + 1],
          isBack ? -vNorm[iC + 2] : vNorm[iC + 2]
        );
        const shD = shadeFor(
          isBack ? -vNorm[iD] : vNorm[iD],
          isBack ? -vNorm[iD + 1] : vNorm[iD + 1],
          isBack ? -vNorm[iD + 2] : vNorm[iD + 2]
        );
        // Inside walls: dim the shade so the interior reads darker than exterior
        const interiorMul = isBack ? 0.55 : 1;
        const sh1 = ((shA + shB) / 2) * interiorMul;
        const sh2 = ((shC + shD) / 2) * interiorMul;
        const depth = (sA.depth + sB.depth + sC.depth + sD.depth) / 4;
        // If shades are nearly identical, skip gradient (saves DOM nodes)
        const useGrad = Math.abs(sh1 - sh2) > 0.04;
        const fill1 = colFor(sh1);
        const fill2 = colFor(sh2);
        faces.push({
          sA, sB, sC, sD, depth, isBack,
          useGrad, fill1, fill2,
          // gradient runs top-edge midpoint → bottom-edge midpoint
          gx1: (sA.x + sB.x) / 2, gy1: (sA.y + sB.y) / 2,
          gx2: (sD.x + sC.x) / 2, gy2: (sD.y + sC.y) / 2,
          gid: 'q' + (gradId++),
        });
      }
    }
    faces.sort((p, q) => p.depth - q.depth);
  }

  // Silhouette: left + right profile (at current yaw, max x projection)
  // Approximate by taking, for each layer, the points whose screen-x is min and max
  const leftSil = [], rightSil = [];
  for (let li = 0; li < layers.length; li++) {
    const ring = layers[li];
    let minP = null, maxP = null;
    for (const p of ring) {
      const s = toScreen(p.x, p.y, p.z);
      if (!minP || s.x < minP.x) minP = s;
      if (!maxP || s.x > maxP.x) maxP = s;
    }
    leftSil.push(minP);
    rightSil.push(maxP);
  }

  // Base disc: top ring of base (bottom layer) with subtle oval shading
  const baseRing = layers[0];
  const basePts = baseRing.map(p => toScreen(p.x, p.y, p.z));

  // Print nozzle: at top of currently visible layers, at angle based on progress
  let nozzle = null;
  if (progress > 0 && progress < 1) {
    const li = Math.min(layers.length - 1, visibleLayerCount);
    const ring = layers[li];
    const localT = (progress * layers.length) - Math.floor(progress * layers.length);
    const si = Math.floor(localT * ring.length);
    nozzle = toScreen(ring[si].x, ring[si].y, ring[si].z);
  }

  // Floor shadow ellipse
  const floorR = maxR;
  const floorPts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    floorPts.push(toScreen(Math.cos(a) * floorR, Math.sin(a) * floorR, 0));
  }
  const floorD = 'M' + floorPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', background: P3D_COLORS.bg, cursor: dragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={onDown}
      onTouchStart={onDown}
    >
      <defs>
        <pattern id="p3d-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={P3D_COLORS.grid} strokeWidth="1"/>
        </pattern>
        <radialGradient id="p3d-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={P3D_COLORS.layer} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={P3D_COLORS.layer} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill="url(#p3d-grid)"/>
      {/* glow around vase */}
      <ellipse cx={cx} cy={cy - totalHeight * scale * 0.4} rx={maxR * scale * 2.2} ry={totalHeight * scale * 0.9} fill="url(#p3d-glow)"/>

      {/* floor shadow */}
      <path d={floorD} fill="#000" opacity="0.45" filter="blur(2px)"/>

      {/* solid base disc (printed first) */}
      <path d={'M' + basePts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z'}
        fill={P3D_COLORS.base} stroke={P3D_COLORS.baseStroke} strokeWidth="1.2"/>

      {/* layer contours (wire mode) */}
      {renderMode === 'wire' && (
        <g>
          {layerPaths.map((lp, i) => {
            const opacity = 0.38 + lp.t * 0.55;
            return (
              <path key={i} d={lp.d}
                fill="none"
                stroke={P3D_COLORS.layer}
                strokeWidth="0.9"
                opacity={opacity}
              />
            );
          })}
        </g>
      )}

      {/* solid shaded faces */}
      {renderMode === 'solid' && (
        <g>
          <defs>
            {faces.filter(f => f.useGrad).map(f => (
              <linearGradient key={f.gid} id={f.gid}
                gradientUnits="userSpaceOnUse"
                x1={f.gx1.toFixed(1)} y1={f.gy1.toFixed(1)}
                x2={f.gx2.toFixed(1)} y2={f.gy2.toFixed(1)}>
                <stop offset="0%" stopColor={f.fill1}/>
                <stop offset="100%" stopColor={f.fill2}/>
              </linearGradient>
            ))}
          </defs>
          {faces.map((f, i) => {
            const fill = f.useGrad ? `url(#${f.gid})` : f.fill1;
            return (
              <polygon key={i}
                points={`${f.sA.x.toFixed(1)},${f.sA.y.toFixed(1)} ${f.sB.x.toFixed(1)},${f.sB.y.toFixed(1)} ${f.sC.x.toFixed(1)},${f.sC.y.toFixed(1)} ${f.sD.x.toFixed(1)},${f.sD.y.toFixed(1)}`}
                fill={fill}
                stroke={f.fill1}
                strokeWidth="0.4"
              />
            );
          })}
        </g>
      )}

      {/* back silhouette faint (wire only) */}
      {renderMode === 'wire' && (
        <>
          <path
            d={'M' + leftSil.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}
            fill="none" stroke={P3D_COLORS.silhouette} strokeWidth="1.4" opacity="0.35"
          />
          <path
            d={'M' + rightSil.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}
            fill="none" stroke={P3D_COLORS.silhouette} strokeWidth="1.4" opacity="0.35"
          />
        </>
      )}

      {/* nozzle */}
      {nozzle && (
        <g>
          <line x1={nozzle.x} y1={nozzle.y - 30} x2={nozzle.x} y2={nozzle.y}
            stroke={P3D_COLORS.accent} strokeWidth="2"/>
          <polygon points={`${nozzle.x - 5},${nozzle.y - 30} ${nozzle.x + 5},${nozzle.y - 30} ${nozzle.x + 2},${nozzle.y - 24} ${nozzle.x - 2},${nozzle.y - 24}`}
            fill={P3D_COLORS.accent}/>
          <circle cx={nozzle.x} cy={nozzle.y} r={3} fill={P3D_COLORS.accent}/>
          <circle cx={nozzle.x} cy={nozzle.y} r={7} fill="none" stroke={P3D_COLORS.accent} strokeWidth="1" opacity="0.5"/>
        </g>
      )}

      {/* axis indicator bottom-left */}
      <g transform={`translate(40, ${height - 40})`}>
        <line x1="0" y1="0" x2="24" y2="0" stroke="#e63946" strokeWidth="2"/>
        <line x1="0" y1="0" x2="0" y2="-24" stroke="#f5d547" strokeWidth="2"/>
        <line x1="0" y1="0" x2="-12" y2="10" stroke="#3a86ff" strokeWidth="2"/>
        <text x="28" y="3" fill="#e63946" fontSize="10" fontFamily="ui-monospace, monospace">X</text>
        <text x="3" y="-26" fill="#f5d547" fontSize="10" fontFamily="ui-monospace, monospace">Z</text>
        <text x="-22" y="18" fill="#3a86ff" fontSize="10" fontFamily="ui-monospace, monospace">Y</text>
      </g>

      {/* corner labels */}
      <text x="16" y="24" fill={P3D_COLORS.label} fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="1">
        PREVIEW
      </text>

    </svg>
  );
}
