/* js/qr.js — QR code generator that runs in the browser (no outside service, works offline).
   encode(text, level) -> { size, ver, dark(x, y), isEye(x, y) }
   toSvg(qr, options)  -> SVG markup   (styles: soft, dots, pixel, classic) */
const QR = (() => {
  const ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  const BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  const LEVELS = { L: 0, M: 1, Q: 2, H: 3 }, FORMAT_BITS = [1, 0, 3, 2];
  const bit = (n, i) => ((n >>> i) & 1) !== 0;

  function rawModules(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  const dataWords = (v, l) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[l][v] * BLOCKS[l][v];

  function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; }
  function rsDivisor(deg) {
    const r = new Array(deg - 1).fill(0).concat([1]); let root = 1;
    for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 2); }
    return r;
  }
  function rsRemainder(data, div) {
    const r = new Array(div.length).fill(0);
    data.forEach((b) => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); });
    return r;
  }
  function interleave(data, v, l) {
    const nb = BLOCKS[l][v], eccLen = ECC_PER_BLOCK[l][v], raw = Math.floor(rawModules(v) / 8);
    const nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1)); k += d.length;
      const e = rsRemainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) out.push(b[i]); });
    return out;
  }

  function encode(text, level) {
    const lv = LEVELS[level] ?? 1, bytes = Array.from(new TextEncoder().encode(String(text)));
    let ver = 0, bitsUsed = 0;
    for (let v = 1; v <= 40; v++) {
      const cc = v <= 9 ? 8 : 16; bitsUsed = 4 + cc + bytes.length * 8;
      if (bytes.length < (1 << cc) && bitsUsed <= dataWords(v, lv) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('Too much data for a QR code');
    const bits = [], push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(4, 4); push(bytes.length, ver <= 9 ? 8 : 16); bytes.forEach((b) => push(b, 8));
    const cap = dataWords(ver, lv) * 8; push(0, Math.min(4, cap - bits.length)); push(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) push(pad, 8);
    const data = new Array(bits.length / 8).fill(0); bits.forEach((b, i) => { data[i >>> 3] |= b << (7 - (i & 7)); });
    const words = interleave(data, ver, lv), size = ver * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFn = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };

    for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const na = ver === 1 ? 0 : Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2, al = [6];
    for (let p = size - 7; al.length < na; p -= step) al.splice(1, 0, p);
    al.forEach((ax, i) => al.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const formatBits = (mask) => {
      const d = (FORMAT_BITS[lv] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setFn(8, i, bit(b, i)); setFn(8, 7, bit(b, 6)); setFn(8, 8, bit(b, 7)); setFn(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(b, i));
      setFn(8, size - 8, true);
    };
    formatBits(0);
    if (ver >= 7) {
      let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const c = bit(b, i), a = size - 11 + (i % 3), q = Math.floor(i / 3); setFn(a, q, c); setFn(q, a, c); }
    }
    for (let i = 0, right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!fn[y][x] && i < words.length * 8) { m[y][x] = bit(words[i >>> 3], 7 - (i & 7)); i++; }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
    const applyMask = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0; const line = (get) => {
        let s = '0000', run = 1;
        for (let i = 0; i < size; i++) { s += get(i) ? '1' : '0'; if (i && get(i) === get(i - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
        s += '0000';
        for (const pat of ['00001011101', '10111010000']) for (let at = s.indexOf(pat); at >= 0; at = s.indexOf(pat, at + 1)) p += 40;
      };
      for (let y = 0; y < size; y++) line((x) => m[y][x]);
      for (let x = 0; x < size; x++) line((y) => m[y][x]);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (m[y][x]) dark++; if (x && y && m[y][x] === m[y][x - 1] && m[y][x] === m[y - 1][x] && m[y][x] === m[y - 1][x - 1]) p += 3; }
      return p + (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;
    };
    let best = 0, bestScore = Infinity;
    for (let k = 0; k < 8; k++) { applyMask(k); formatBits(k); const s = penalty(); if (s < bestScore) { best = k; bestScore = s; } applyMask(k); }
    applyMask(best); formatBits(best);
    const inEye = (x, y) => (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
    return { size, ver, dark: (x, y) => x >= 0 && y >= 0 && x < size && y < size && m[y][x], isEye: inEye };
  }

  /* The clear square left in the middle for the logo, in modules (centered, always an odd count so it sits on the grid) */
  function logoBox(qr, frac) {
    let n = Math.round(qr.size * frac); if (n % 2 === 0) n++; const a = Math.floor((qr.size - n) / 2); return { a, b: a + n, n };
  }

  /* options: style (soft | dots | pixel | classic), logoShape (square | circle), eyeR ([outer, inner] corner radius), fg, eye, margin (modules), logo (fraction of width, 0 for none), bg (or null for transparent) */
  function toSvg(qr, o = {}) {
    const style = o.style || 'soft', fg = o.fg || '#111827', eye = o.eye || fg, margin = o.margin ?? 2, bg = o.bg === undefined ? '#ffffff' : o.bg;
    const box = o.logo ? logoBox(qr, o.logo) : null, total = qr.size + margin * 2, s = qr.size;
    const round = o.logoShape === 'circle', mid = qr.size / 2;
    /* square logos clear a square; round logos clear a circle (less of the code is lost, so the logo can be bigger and still scan) */
    const inLogo = (x, y) => !box ? false : round
      ? Math.hypot(x + .5 - mid, y + .5 - mid) <= box.n / 2 + .9
      : x >= box.a - 1 && x < box.b + 1 && y >= box.a - 1 && y < box.b + 1;
    let mods = '';
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      if (!qr.dark(x, y) || qr.isEye(x, y) || inLogo(x, y)) continue;
      const X = x + margin, Y = y + margin;
      if (style === 'dots') mods += `<circle cx="${X + .5}" cy="${Y + .5}" r=".46"/>`;
      else if (style === 'pixel') mods += `<rect x="${X + .16}" y="${Y + .16}" width=".68" height=".68" rx=".08"/>`;
      else if (style === 'classic') mods += `<rect x="${X}" y="${Y}" width="1.02" height="1.02"/>`;
      else mods += `<rect x="${X + .06}" y="${Y + .06}" width=".88" height=".88" rx=".3"/>`;
    }
    const ring = (x, y) => {
      const X = x + margin, Y = y + margin, er = o.eyeR, r1 = er ? er[0] : style === 'classic' ? 0 : 1.2, r2 = er ? er[1] : style === 'classic' ? 0 : 0.6;   /* gently rounded: sharper than most styled codes on purpose, so every scanner finds the corners */
      return `<path fill-rule="evenodd" fill="${eye}" d="${rr(X, Y, 7, r1)}${rr(X + 1, Y + 1, 5, Math.max(0, r1 - 1))}"/><rect x="${X + 2}" y="${Y + 2}" width="3" height="3" rx="${r2}" fill="${eye}"/>`;
    };
    function rr(x, y, w, r) { return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${w - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${w - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision" role="img" aria-label="QR code">`
      + (bg ? `<rect width="${total}" height="${total}" fill="${bg}"/>` : '') + `<g fill="${fg}">${mods}</g>` + ring(0, 0) + ring(s - 7, 0) + ring(0, s - 7) + '</svg>';
  }
  /* True when the module at (x, y) falls inside the cleared logo zone (used by the scan self-test) */
  function inLogoZone(qr, frac, shape, x, y) {
    const box = logoBox(qr, frac), mid = qr.size / 2;
    return shape === 'circle' ? Math.hypot(x + .5 - mid, y + .5 - mid) <= box.n / 2 + .9 : x >= box.a - 1 && x < box.b + 1 && y >= box.a - 1 && y < box.b + 1;
  }
  return { encode, toSvg, logoBox, inLogoZone };
})();
if (typeof module !== 'undefined') module.exports = QR;
