/* Lithophane geometry: image brightness → plastic thickness → a closed, printable mesh.
 *
 * Every shape is built the same way: a list of rings, each ring a row of U points round (or across) the shape.
 * Neighbouring rings are joined with quads. The ring list walks over the outside surface, round any rim, and back
 * along the inside, so the result is one closed surface with no booleans needed:
 *   - wrapU: the rings close on themselves (cylinder, bauble); otherwise the two open sides are capped.
 *   - loop: the last ring joins back to the first (panels, cylinder, bauble with a hole at the bottom);
 *     otherwise the first and last rings are closed with a fan to a pole point (bauble with no hole).
 * Display orientation is Z up: panels stand upright, the bauble hangs with its neck at the top.
 */
const Litho = (() => {
  const SHAPES = {
    bauble: { name: 'Bauble', wrap: true },
    flat: { name: 'Flat panel', wrap: false },
    curved: { name: 'Curved panel', wrap: false },
    cylinder: { name: 'Cylinder', wrap: true },
  };

  // How big the image area is on each shape, in mm (U across, V down), and the best image size in pixels.
  function imageArea(shape, p) {
    let U, V;
    if (shape === 'bauble') {
      const R = p.sphereD / 2, Rc = p.cylD / 2;
      const psiEnd = Math.PI - Math.asin(Math.min(0.999, Rc / R));
      const psi0 = p.bottomHole > 0 ? Math.asin(Math.min(0.999, p.bottomHole / 2 / R)) : 0;
      U = Math.PI * p.sphereD; V = R * (psiEnd - psi0);
      return { U, V, psi0, psiEnd, degTall: (psiEnd - psi0) * 180 / Math.PI };
    }
    if (shape === 'cylinder') { U = Math.PI * p.cylDiam; V = p.height - 2 * p.rim; return { U, V }; }
    U = p.width - 2 * p.frame; V = p.height - 2 * p.frame;
    return { U, V };
  }

  // brightness (0 = black … 1 = white) → thickness in mm. 'natural' follows how light fades through white PLA,
  // so equal steps of brightness look like equal steps when lit; 'linear' is a straight line.
  function thickness(lum, p) {
    const lo = p.minT, hi = p.maxT, out = new Float32Array(lum.length);
    if (p.curve === 'linear') {
      for (let i = 0; i < lum.length; i++) out[i] = hi - (hi - lo) * lum[i];
    } else {
      const k = 1.2, tMin = Math.exp(-k * (hi - lo));     // light let through at the thickest point, relative to the thinnest
      for (let i = 0; i < lum.length; i++) {
        const want = tMin + (1 - tMin) * lum[i];
        out[i] = lo + Math.min(hi - lo, -Math.log(want) / k);
      }
    }
    return out;
  }

  // Ring builder ------------------------------------------------------------------------------------------------
  function assemble(rings, ringT, U, opts) {
    const K = rings.length, poles = opts.poles || null;
    const nv = K * U + (poles ? 2 : 0);
    const pos = new Float32Array(nv * 3), tv = new Float32Array(nv);
    for (let k = 0; k < K; k++) { pos.set(rings[k], k * U * 3); tv.set(ringT[k], k * U); }
    const P0 = K * U, P1 = K * U + 1;
    if (poles) { pos.set(poles[0], P0 * 3); pos.set(poles[1], P1 * 3); tv[P0] = poles[2]; tv[P1] = poles[3]; }
    const idx = [];
    const id = (k, u) => k * U + u;
    const uMax = opts.wrapU ? U : U - 1;
    const kMax = opts.loop ? K : K - 1;
    for (let k = 0; k < kMax; k++) {
      const k1 = (k + 1) % K;
      for (let u = 0; u < uMax; u++) {
        const u1 = (u + 1) % U;
        idx.push(id(k, u), id(k1, u), id(k, u1), id(k, u1), id(k1, u), id(k1, u1));
      }
    }
    if (poles) {
      for (let u = 0; u < uMax; u++) {
        const u1 = (u + 1) % U;
        idx.push(P0, id(0, u), id(0, u1));
        idx.push(P1, id(K - 1, u1), id(K - 1, u));
      }
    }
    if (!opts.wrapU) {
      // cap both open sides: ring i pairs with ring K-1-i (outside row i with inside row i)
      for (let i = 0; i < K / 2 - 1; i++) {
        const A = i, B = i + 1, C = K - 2 - i, D = K - 1 - i;
        idx.push(id(B, 0), id(A, 0), id(D, 0), id(B, 0), id(D, 0), id(C, 0));
        const e = U - 1;
        idx.push(id(D, e), id(A, e), id(B, e), id(C, e), id(D, e), id(B, e));
      }
    }
    const tri = new Uint32Array(idx);
    if (signedVolume(pos, tri) < 0) for (let i = 0; i < tri.length; i += 3) { const t = tri[i + 1]; tri[i + 1] = tri[i + 2]; tri[i + 2] = t; }
    return { pos, idx: tri, thick: tv };
  }

  function signedVolume(pos, idx) {
    let v = 0;
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      v += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
         - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
         + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
    }
    return v / 6;
  }

  // pad a cols×rows thickness grid with a solid border of `n` cells at thickness `t`
  function pad(T, cols, rows, nx, ny, t) {
    const C = cols + 2 * nx, Rr = rows + 2 * ny, out = new Float32Array(C * Rr).fill(t);
    for (let r = 0; r < rows; r++) out.set(T.subarray(r * cols, r * cols + cols), (r + ny) * C + nx);
    return { T: out, cols: C, rows: Rr };
  }

  // Shapes ------------------------------------------------------------------------------------------------------
  // T: thickness grid (cols × rows, row 0 = top of the image). Returns { pos, idx, thick, size, notes }.
  function build(shape, p, T, cols, rows) {
    if (shape === 'flat' || shape === 'curved') return panel(shape, p, T, cols, rows);
    if (shape === 'cylinder') return cylinder(p, T, cols, rows);
    return bauble(p, T, cols, rows);
  }

  function panel(shape, p, T0, cols0, rows0) {
    const a = imageArea(shape, p);
    const cell = a.U / Math.max(1, cols0 - 1);
    const n = p.frame > 0 ? Math.max(1, Math.round(p.frame / cell)) : 0;
    const { T, cols, rows } = n ? pad(T0, cols0, rows0, n, n, p.frameT) : { T: T0, cols: cols0, rows: rows0 };
    const W = p.width, H = p.height;
    const at = (u, v, t) => {      // u, v in mm from the top-left of the panel; t = distance out from the back
      const x = u - W / 2, z = H - v;
      if (shape === 'flat') return [x, t, z];             // viewer at -y: flat face towards them, relief behind
      const R = p.radius, ang = x / R;                    // curved: an arc round a centre behind the panel,
      return [(R + t) * Math.sin(ang), R - (R + t) * Math.cos(ang), z];   // relief on the outside, towards the viewer
    };
    const du = W / (cols - 1), dv = H / (rows - 1);
    const rings = [], ringT = [];
    for (let r = 0; r < rows; r++) {          // front face rows, top to bottom (the relief faces away from the viewer)
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols);
      for (let c = 0; c < cols; c++) { const t = T[r * cols + c]; ring.set(at(c * du, r * dv, t), c * 3); rt[c] = t; }
      rings.push(ring); ringT.push(rt);
    }
    for (let r = rows - 1; r >= 0; r--) {     // flat side, bottom to top
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols);
      for (let c = 0; c < cols; c++) { ring.set(at(c * du, r * dv, 0), c * 3); rt[c] = T[r * cols + c]; }
      rings.push(ring); ringT.push(rt);
    }
    const m = assemble(rings, ringT, cols, { wrapU: false, loop: true });
    return p.scaffold ? withScaffold(shape, p, m) : m;
  }

  // Scaffold: thin snap-off fins that brace a standing panel while it prints. One fin on each side of the panel at
  // the left and right borders, so they only ever touch the frame, never the picture. Each fin is a right triangle
  // standing on the bed: `scaffoldD` out from the panel, `scaffoldH` up it, `scaffoldW` thick. They overlap the
  // frame by 0.2 mm so the slicer joins them on; the thin joint snaps off after printing.
  function scaffoldFins(shape, p) {
    const W = p.width, H = p.height, R = p.radius;
    const h = Math.min(H, Math.max(5, p.scaffoldH)), fw = Math.max(0.4, p.scaffoldW), ov = 0.2;
    const fins = [];
    for (const uc of [p.frame / 2, W - p.frame / 2]) {
      const x = uc - W / 2;
      // base: the smooth face at this column; n: the way thickness grows (towards the relief); e: across the panel
      let base, n, e;
      if (shape === 'flat') { base = [x, 0, 0]; n = [0, 1, 0]; e = [1, 0, 0]; }
      else { const a = x / R; base = [R * Math.sin(a), R - R * Math.cos(a), 0]; n = [Math.sin(a), -Math.cos(a), 0]; e = [Math.cos(a), Math.sin(a), 0]; }
      for (const dir of [1, -1]) {                   // +1: fin on the relief side, -1: on the smooth side
        const start = dir === 1 ? p.frameT - ov : ov;
        let d = p.scaffoldD;
        if (shape === 'curved' && dir === -1) d = Math.min(d, R * 0.8);   // keep it inside the arc
        const o = [base[0] + n[0] * start, base[1] + n[1] * start, 0];
        const tri = [[0, 0], [d + ov, 0], [0, h]];
        const v = [];
        for (const sgn of [-1, 1]) for (const [sd, z] of tri) {
          v.push(o[0] + dir * n[0] * sd + sgn * fw / 2 * e[0], o[1] + dir * n[1] * sd + sgn * fw / 2 * e[1], z);
        }
        fins.push(v);
      }
    }
    return fins;
  }
  function withScaffold(shape, p, m) {
    const fins = scaffoldFins(shape, p);
    const nv0 = m.pos.length / 3, pos = new Float32Array(m.pos.length + fins.length * 18), thick = new Float32Array(nv0 + fins.length * 6);
    pos.set(m.pos); thick.set(m.thick);
    const idx = Array.from(m.idx);
    fins.forEach((v, f) => {
      const b = nv0 + f * 6;
      pos.set(v, b * 3); thick.fill(p.frameT, b, b + 6);
      // vertices 0-2: one face of the triangle, 3-5: the other
      const t = [0, 1, 2, 5, 4, 3, 0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0];
      const fi = new Uint32Array(t.map((k) => b + k));
      const sub = new Float32Array(18); sub.set(v);
      if (signedVolume(sub, new Uint32Array(t)) < 0) for (let i = 0; i < fi.length; i += 3) { const q = fi[i + 1]; fi[i + 1] = fi[i + 2]; fi[i + 2] = q; }
      idx.push(...fi);
    });
    return { pos, idx: new Uint32Array(idx), thick };
  }

  function cylinder(p, T0, cols0, rows0) {
    const a = imageArea('cylinder', p);
    const cell = a.V / Math.max(1, rows0 - 1);
    const n = p.rim > 0 ? Math.max(1, Math.round(p.rim / cell)) : 0;
    const { T, cols, rows } = n ? pad(T0, cols0, rows0, 0, n, p.frameT) : { T: T0, cols: cols0, rows: rows0 };
    const Ri = p.cylDiam / 2 - p.maxT, H = p.height, dv = H / (rows - 1);
    const ang = (c) => -Math.PI / 2 + 2 * Math.PI * (c / cols - 0.5);   // image centre faces the viewer at -y
    const rings = [], ringT = [];
    for (let r = 0; r < rows; r++) {
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols), z = H - r * dv;
      for (let c = 0; c < cols; c++) { const t = T[r * cols + c], q = Ri + t, A = ang(c); ring.set([q * Math.cos(A), q * Math.sin(A), z], c * 3); rt[c] = t; }
      rings.push(ring); ringT.push(rt);
    }
    for (const z of [0, H]) {
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols).fill(p.frameT);
      for (let c = 0; c < cols; c++) { const A = ang(c); ring.set([Ri * Math.cos(A), Ri * Math.sin(A), z], c * 3); }
      rings.push(ring); ringT.push(rt);
    }
    return assemble(rings, ringT, cols, { wrapU: true, loop: true });
  }

  const NECK_BLEND = 2.5;   // mm of image, past the neck join, that eases up to full thickness

  // The rounded fillet between the sphere and the neck, on the outside. Returns its radius as built (capped so it
  // ends below the cap ledge), where it touches the neck (zc) and the sphere (polar angle phiT from the neck end).
  function neckFillet(p) {
    const R = p.sphereD / 2, Rc = p.cylD / 2, RcIn = Rc - p.cylT;
    const zLedge = Math.sqrt(R * R - RcIn * RcIn) + p.cylH - p.cylT;
    const at = (f) => { const zc = Math.sqrt((R + f) ** 2 - (Rc + f) ** 2); return { f, zc, phiT: Math.atan2(Rc + f, zc) }; };
    let f = Math.max(0, +p.neckFillet || 0);
    while (f > 0 && at(f).zc > zLedge - 0.5) f = Math.max(0, f - 0.1);
    f = Math.round(f * 10) / 10;
    return at(f);
  }

  // Bauble: hangs from its neck (Z up). Outside: bottom pole → image rows → fillet → neck → ledge → end face; inside:
  // bore → smooth inner sphere → inner pole. Neck sizes match the end cap maker: neck height runs from where a
  // sphere of the full diameter meets the neck's bore, to the open end; the ledge is as tall as the neck wall.
  function bauble(p, T0, cols, rows) {
    const a = imageArea('bauble', p);
    const R = p.sphereD / 2, Ri = R - p.maxT, Rc = p.cylD / 2, RcIn = Rc - p.cylT, Rl = p.ledgeD / 2;
    const zEnd = Math.sqrt(R * R - RcIn * RcIn) + p.cylH, zLedge = zEnd - p.cylT;
    const zMeet = Math.sqrt(R * R - Rc * Rc) + 0.3;
    const zIn = Math.sqrt(Ri * Ri - RcIn * RcIn);
    const fil = neckFillet(p), psiT = Math.PI - fil.phiT;       // where the outside leaves the sphere for the fillet
    // The image runs at full thickness up to the fillet, then eases down to the photo over NECK_BLEND mm, so the
    // sphere is at its full diameter where it meets the fillet (or the neck) and leaves no notch.
    const T = Float32Array.from(T0), dv = a.V / (rows - 1), off = R * (a.psiEnd - psiT);
    for (let r = 0; r < rows && r * dv < off + NECK_BLEND; r++) {
      const s = Math.max(0, (r * dv - off) / NECK_BLEND), w = 1 - s * s * (3 - 2 * s);
      for (let c = 0; c < cols; c++) { const i = r * cols + c; T[i] += (p.maxT - T[i]) * w; }
    }
    const ang = (c) => -Math.PI / 2 + 2 * Math.PI * (c / cols - 0.5);
    const psiAt = (r) => a.psiEnd - (a.psiEnd - a.psi0) * r / (rows - 1);    // row 0 at the neck
    const rings = [], ringT = [];
    const sph = (q, psi) => { const s = q * Math.sin(psi), z = -q * Math.cos(psi); return (A) => [s * Math.cos(A), s * Math.sin(A), z]; };
    const circle = (rad, z, t) => {
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols).fill(t);
      for (let c = 0; c < cols; c++) { const A = ang(c); ring.set([rad * Math.cos(A), rad * Math.sin(A), z], c * 3); }
      rings.push(ring); ringT.push(rt);
    };
    // outside, from the bottom up; rows under the fillet are left out, as the fillet covers them
    const solid = p.maxT + 1;
    for (let r = rows - 1; r >= 0; r--) {
      const psi = psiAt(r);
      if (fil.f > 0 && psi >= psiT - 1e-6) break;
      const ring = new Float32Array(cols * 3), rt = new Float32Array(cols);
      for (let c = 0; c < cols; c++) { const t = T[r * cols + c]; ring.set(sph(Ri + t, psi)(ang(c)), c * 3); rt[c] = t; }
      rings.push(ring); ringT.push(rt);
    }
    if (fil.f > 0) {
      // the fillet: an arc round (Rc + f, zc), from where it touches the sphere to where it touches the neck
      const cx = Rc + fil.f, th0 = Math.atan2(-fil.zc, -cx), th1 = -Math.PI, n = Math.max(6, Math.ceil(fil.f * 3));
      for (let i = 0; i <= n; i++) {
        const th = th0 + (th1 - th0) * i / n;
        circle(i === n ? Rc : cx + fil.f * Math.cos(th), fil.zc + fil.f * Math.sin(th), solid);
      }
    } else {
      circle(Rc, zMeet, solid);
    }
    circle(Rc, zLedge, solid); circle(Rl, zLedge, solid); circle(Rl, zEnd, solid);
    circle(RcIn, zEnd, solid); circle(RcIn, zIn, solid);
    // inside, from the neck down
    for (let r = 0; r < rows; r++) {
      const psi = psiAt(r), ring = new Float32Array(cols * 3), rt = new Float32Array(cols);
      for (let c = 0; c < cols; c++) { ring.set(sph(Ri, psi)(ang(c)), c * 3); rt[c] = T[r * cols + c]; }
      rings.push(ring); ringT.push(rt);
    }
    if (a.psi0 > 0) return assemble(rings, ringT, cols, { wrapU: true, loop: true });
    let avg = 0; for (let c = 0; c < cols; c++) avg += T[(rows - 1) * cols + c]; avg /= cols;
    // the first ring sits right at the pole when there is no hole: drop it so the fan has real triangles
    rings.shift(); ringT.shift(); rings.pop(); ringT.pop();
    return assemble(rings, ringT, cols, { wrapU: true, loop: false, poles: [[0, 0, -(Ri + avg)], [0, 0, -Ri], avg, avg] });
  }

  // Print orientation and file output ---------------------------------------------------------------------------
  // bauble: neck down on the bed; everything else as displayed (standing up). Moved so it sits on z = 0.
  function forPrint(shape, pos) {
    const out = new Float32Array(pos.length);
    const flip = shape === 'bauble';
    let zmin = Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      out[i] = pos[i]; out[i + 1] = flip ? -pos[i + 1] : pos[i + 1]; out[i + 2] = flip ? -pos[i + 2] : pos[i + 2];
      if (out[i + 2] < zmin) zmin = out[i + 2];
    }
    for (let i = 2; i < out.length; i += 3) out[i] -= zmin;
    return out;
  }

  function bounds(pos) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = pos[i + k]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; }
    return { lo, hi, size: hi.map((h, k) => h - lo[k]) };
  }

  function toSTL(pos, idx) {
    const n = idx.length / 3, buf = new ArrayBuffer(84 + 50 * n), dv = new DataView(buf);
    const head = 'Lithophane Studio';
    for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
    dv.setUint32(80, n, true);
    let o = 84;
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
      dv.setFloat32(o, nx, true); dv.setFloat32(o + 4, ny, true); dv.setFloat32(o + 8, nz, true); o += 12;
      for (const q of [a, b, c]) { dv.setFloat32(o, pos[q], true); dv.setFloat32(o + 4, pos[q + 1], true); dv.setFloat32(o + 8, pos[q + 2], true); o += 12; }
      o += 2;
    }
    return buf;
  }

  // every edge used exactly twice, once each way: the mesh is closed and consistently wound
  function checkClosed(idx) {
    const m = new Map();
    for (let i = 0; i < idx.length; i += 3) for (let e = 0; e < 3; e++) {
      const a = idx[i + e], b = idx[i + (e + 1) % 3], key = a * 4294967296 + b;
      m.set(key, (m.get(key) || 0) + 1);
    }
    let bad = 0;
    for (const [key, n] of m) { const a = Math.floor(key / 4294967296), b = key % 4294967296; if (n !== 1 || m.get(b * 4294967296 + a) !== 1) bad++; }
    return bad === 0;
  }

  return { SHAPES, imageArea, neckFillet, thickness, build, forPrint, bounds, toSTL, signedVolume, checkClosed };
})();
if (typeof module !== 'undefined') module.exports = Litho;
