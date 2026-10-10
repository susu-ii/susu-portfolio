(function (root) {
  'use strict';
  const FIRST = 1.45, LAST = 6.45, STACK_START = 99, STACK_END = 100, EXPAND_START = 101, EXPAND_END = 102, END = 7.35;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const ease = t => 1 - Math.pow(1 - clamp(t), 4);
  function scrollState(scrollY, start, step) {
    return { entered: scrollY >= start, unit: clamp((scrollY - start) / step, 0, END) };
  }
  function state(u, count = 6) {
    const position = clamp(u - FIRST, 0, count - 1);
    const stack = smooth(STACK_START, STACK_END, u);
    const expand = smooth(EXPAND_START, EXPAND_END, u);
    return { u, position, index: Math.round(position), stack, expand,
      cards: smooth(.82, FIRST, u) * (1 - smooth(6.72, 7.55, u)),
      gallery: smooth(1.02, FIRST, u) * (1 - smooth(6.80, 7.25, u)), word: smooth(.18, .68, u) * (1 - smooth(.92, 1.65, u)),
      contact: smooth(.72, .97, expand), lightHeader: stack > .86 && expand < .72 };
  }
  function snapPoint(u, count = 6) {
    if (u < .35) return 0;
    if (u < FIRST + count - 1 + .3) return FIRST + Math.round(clamp(u - FIRST, 0, count - 1));
    if (u > STACK_START + .14 && u < STACK_END + .22) return STACK_END;
    if (u > EXPAND_START + .16 && u < EXPAND_END + .15) return EXPAND_END;
    return null;
  }
  function frameSize(width, height, aspect) {
    const maxWidth = width * (width < 700 ? .82 : .51), maxHeight = height * (width < 700 ? .39 : .52);
    const w = Math.min(maxWidth, maxHeight * aspect);
    return { width: w, height: w / aspect };
  }
  function pose(index, position, width, height, aspect, pointer = { x: 0, y: 0 }, entry = 1) {
    const q = index - position, theta = q * .82, size = frameSize(width, height, aspect);
    const f = Math.tan(Math.PI / 8), depth = 4.5, radius = 4.6, focal = height / (2 * f);
    const unitWidth = size.width * depth / focal, near = Math.exp(-q * q * 3);
    const x = Math.sin(theta) * radius + .10 + pointer.x * .07, y = (width < 700 ? .40 : .26) + pointer.y * .025;
    const z = -depth - radius * (1 - Math.cos(theta)), turn = theta + pointer.x * .035 * near + (1 - entry) * 1.10;
    const scale = mix(.65, 1, entry), opacity = (1 - smooth(1.65, 2.2, Math.abs(q))) * entry;
    const screenWidth = unitWidth * scale * focal / -z, screenHeight = screenWidth / aspect;
    const cy = Math.cos(turn), ay = Math.sin(turn), rz = Math.sin(theta) * .016, cz = Math.cos(rz), az = Math.sin(rz);
    const corners = [];
    for (const xx of [-.5, .5]) for (const yy of [-.5, .5]) {
      const lx = xx * unitWidth * scale, ly = yy * unitWidth / aspect * scale, lz = -.25 * (.18 + Math.abs(q) * .05);
      const rx = cy * lx + ay * lz, projectedDepth = -z + ay * lx - cy * lz;
      corners.push({ x: width / 2 + (x + cz * rx - az * ly) * focal / projectedDepth, y: height / 2 - (y + az * rx + cz * ly) * focal / projectedDepth });
    }
    const left = Math.min(...corners.map(p => p.x)), top = Math.min(...corners.map(p => p.y));
    const right = Math.max(...corners.map(p => p.x)), bottom = Math.max(...corners.map(p => p.y));
    return { q, theta, x, y, z, turn, scale, opacity, unitWidth, unitHeight: unitWidth / aspect,
      centerX: width / 2 + x * focal / -z, centerY: height / 2 - y * focal / -z, screenWidth, screenHeight,
      bounds: { left, top, width: right - left, height: bottom - top } };
  }
  function portalRect(width, height, progress) {
    const initial = { width: width * (width < 700 ? .48 : .25), height: height * .31 };
    const w = mix(initial.width, width, progress), h = mix(initial.height, height, progress);
    return { left: (width - w) / 2, top: (height - h) / 2, width: w, height: h };
  }
  const math = { FIRST, LAST, STACK_START, STACK_END, EXPAND_START, EXPAND_END, END, clamp, mix, smooth, ease, scrollState, state, snapPoint, frameSize, pose, portalRect };
  root.MotionMath = math;
  if (typeof module !== 'undefined' && module.exports) module.exports = math;
})(typeof window !== 'undefined' ? window : globalThis);
