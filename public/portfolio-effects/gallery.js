(function () {
  'use strict';
  const M = window.MotionMath, SH = window.PortfolioShaders;
  const $ = selector => document.querySelector(selector);
  const accents = ['#a88aff', '#ead07e', '#70d3e3', '#a3c593', '#79baff', '#dcc1a3'];
  const rgb = hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255);
  function model(x, y, z, ry, rz, sx, sy, sz) {
    const cy = Math.cos(ry), ay = Math.sin(ry), cz = Math.cos(rz), az = Math.sin(rz);
    return new Float32Array([cz * cy * sx, az * cy * sx, -ay * sx, 0,
      -az * sy, cz * sy, 0, 0, cz * ay * sz, az * ay * sz, cy * sz, 0, x, y, z, 1]);
  }
  function projection(aspect) {
    const f = 1 / Math.tan(Math.PI / 8), near = .1, far = 30;
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
  }
  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++)
      out[col * 4 + row] = a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    return out;
  }
  function triangulate(points) {
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inside = (p, a, b, c) => cross(a, b, p) >= -1e-8 && cross(b, c, p) >= -1e-8 && cross(c, a, p) >= -1e-8;
    const indices = points.map((p, i) => i), out = [];
    let guard = 0;
    while (indices.length > 3 && guard++ < 100) {
      let found = false;
      for (let j = 0; j < indices.length; j++) {
        const ia = indices[(j + indices.length - 1) % indices.length], ib = indices[j], ic = indices[(j + 1) % indices.length];
        const a = points[ia], b = points[ib], c = points[ic];
        if (cross(a, b, c) <= 1e-8 || indices.some(k => k !== ia && k !== ib && k !== ic && inside(points[k], a, b, c))) continue;
        out.push(ia, ib, ic); indices.splice(j, 1); found = true; break;
      }
      if (!found) throw new Error('Invalid monogram geometry');
    }
    if (indices.length === 3) out.push(...indices);
    return out;
  }
  function markGeometry() {
    let points = [[-.52, .60], [.56, .60], [.35, .34], [-.12, .34], [.37, .06], [.51, -.15], [.28, -.60], [-.58, -.60], [-.35, -.34], [.12, -.34], [-.40, -.05], [-.55, .15]];
    const area = points.reduce((s, p, i) => s + p[0] * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * p[1], 0);
    if (area < 0) points.reverse();
    const inner = points.map(p => [p[0] * .93, p[1] * .93]);
    const triangles = triangulate(inner), vertices = [];
    function triangle(a, b, c) {
      const u = b.map((x, i) => x - a[i]), v = c.map((x, i) => x - a[i]);
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const length = Math.hypot(...n) || 1; n = n.map(x => x / length);
      for (const p of [a, b, c]) vertices.push(...p, ...n);
    }
    for (let i = 0; i < triangles.length; i += 3) {
      triangle(...triangles.slice(i, i + 3).map(k => [...inner[k], .16]));
      triangle(...triangles.slice(i, i + 3).reverse().map(k => [...inner[k], -.16]));
    }
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const a = [...points[i], .09], b = [...points[j], .09], c = [...points[j], -.09], d = [...points[i], -.09];
      triangle(a, d, c); triangle(a, c, b);
      const f = [...inner[i], .16], g = [...inner[j], .16], h = [...inner[i], -.16], k = [...inner[j], -.16];
      triangle(f, a, b); triangle(f, b, g); triangle(d, h, k); triangle(d, k, c);
    }
    return new Float32Array(vertices);
  }
  function prepareArt(project, index) {
    project.accent = accents[index];
    project.aspect = project.coverSize[0] / project.coverSize[1];
    project.sceneURL = project.cover;
    project.artReady = Promise.resolve(project.sceneURL);
    return project;
  }
  class SceneRenderer {
    constructor(canvas, data, onLost, onReady) {
      this.canvas = canvas; this.data = data;
      const gl = this.gl = canvas.getContext('webgl', { alpha: false, antialias: true, depth: true, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL unavailable');
      this.programs = {
        background: this.program(SH.backgroundVertex, SH.backgroundFragment),
        card: this.program(SH.cardVertex, SH.cardFragment),
        mark: this.program(SH.markVertex, SH.markFragment)
      };
      this.quad = this.buffer(new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
      const plane = [];
      for (let i = 0; i < 80; i++) {
        const x = i / 80, right = (i + 1) / 80;
        for (const p of [[x, 0], [right, 0], [right, 1], [x, 0], [right, 1], [x, 1]]) plane.push(p[0] - .5, p[1] - .5, 0, ...p);
      }
      this.plane = this.buffer(new Float32Array(plane)); this.planeCount = plane.length / 5;
      const mark = markGeometry(); this.mark = this.buffer(mark); this.markCount = mark.length / 6;
      this.textures = data.map((p, i) => {
        const texture = this.texture(new Uint8Array([...rgb(p.accent).map(v => v * 22), 255]));
        p.artReady.then(url => {
          const image = new Image(); image.onload = () => { if (!gl.isContextLost()) { gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); onReady(); } };
          image.src = url;
        }); return texture;
      });
      const type = document.createElement('canvas'); type.width = type.height = 1024;
      const ctx = type.getContext('2d'); ctx.clearRect(0, 0, 1024, 1024); ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '900 235px Arial';
      ctx.fillText('SUYANG', 512, 480); ctx.font = '900 270px Arial'; ctx.fillText('VISUAL', 512, 750);
      this.typeTexture = this.texture(type); type.width = type.height = 1;
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); onLost(); }, { once: true });
    }
    program(vertex, fragment) {
      const gl = this.gl;
      const compile = (type, source) => {
        const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      const uniforms = {}, attributes = {};
      for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) { const u = gl.getActiveUniform(program, i); uniforms[u.name] = gl.getUniformLocation(program, u.name); }
      for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); i++) { const a = gl.getActiveAttrib(program, i); attributes[a.name] = gl.getAttribLocation(program, a.name); }
      return { program, uniforms, attributes };
    }
    buffer(vertices) { const gl = this.gl, buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); return buffer; }
    texture(source) {
      const gl = this.gl, texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (source instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      return texture;
    }
    bindTexture(texture, slot, uniform) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + slot); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(uniform, slot); }
    resize(width, height) {
      const dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 1.65);
      this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); this.projection = projection(width / height);
    }
    attribute(program, name, length, stride, offset) {
      const gl = this.gl, location = program.attributes[name]; if (location === undefined || location < 0) return;
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, length, gl.FLOAT, false, stride, offset);
    }
    render(state, width, height, pointer, time, hovered) {
      const gl = this.gl; if (gl.isContextLost()) return;
      gl.clearColor(.025, .026, .032, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const from = Math.floor(state.position), next = Math.min(from + 1, this.data.length - 1), blend = state.position - from;
      const accent = rgb(this.data[from].accent).map((v, i) => M.mix(v, rgb(this.data[next].accent)[i], blend));
      let program = this.programs.background, u = program.uniforms;
      gl.disable(gl.DEPTH_TEST); gl.useProgram(program.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      this.attribute(program, 'a_position', 2, 0, 0);
      gl.uniform2f(u.u_resolution, width, height); gl.uniform2f(u.u_pointer, pointer.x, pointer.y); gl.uniform1f(u.u_time, time); gl.uniform1f(u.u_mix, blend); gl.uniform1f(u.u_strength, 1); gl.uniform3fv(u.u_accent, accent);
      this.bindTexture(this.textures[from], 0, u.u_previous); this.bindTexture(this.textures[next], 1, u.u_next); this.bindTexture(this.typeTexture, 2, u.u_type);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(false);
      program = this.programs.mark; u = program.uniforms; gl.useProgram(program.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.mark);
      this.attribute(program, 'a_position', 3, 24, 0); this.attribute(program, 'a_normal', 3, 24, 12);
      const endReveal = M.smooth(6.60, 7.15, state.u), scale = M.mix(2.70, 2.40, state.cards) + endReveal * 1.2;
      const markModel = model(pointer.x * .13, .11 + pointer.y * .045, -5.7, time * .17 + state.u * .30, -.12 + Math.sin(time * .22) * .045, scale, scale, scale);
      gl.uniformMatrix4fv(u.u_model, false, markModel); gl.uniformMatrix4fv(u.u_matrix, false, multiply(this.projection, markModel)); gl.uniform1f(u.u_time, time); gl.uniform3fv(u.u_accent, accent);
      gl.uniform1f(u.u_opacity, M.mix(.85, .24, state.cards) * (1 - state.stack)); this.bindTexture(this.textures[from], 0, u.u_image); gl.drawArrays(gl.TRIANGLES, 0, this.markCount);
      if (state.cards > .001) {
        program = this.programs.card; u = program.uniforms; gl.useProgram(program.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.plane);
        this.attribute(program, 'a_position', 3, 20, 0); this.attribute(program, 'a_uv', 2, 20, 12);
        const entry = M.smooth(.82, M.FIRST, state.u), exit = 1 - M.smooth(6.72, 7.55, state.u);
        const sorted = this.data.map((p, i) => ({ i, p, pose: M.pose(i, state.position, width, height, p.aspect, pointer, entry) })).sort((a, b) => Math.abs(b.pose.q) - Math.abs(a.pose.q));
        for (const item of sorted) {
          const p = item.pose; if (p.opacity < .001) continue;
          const matrix = model(p.x, p.y, p.z, p.turn, Math.sin(p.theta) * .016, p.unitWidth * p.scale, p.unitHeight * p.scale, 1);
          gl.uniformMatrix4fv(u.u_matrix, false, multiply(this.projection, matrix)); gl.uniform1f(u.u_bend, .18 + Math.abs(p.q) * .05); gl.uniform1f(u.u_time, time);
          gl.uniform4f(u.u_crop, 0, 0, 1, 1); gl.uniform1f(u.u_opacity, p.opacity * exit); gl.uniform1f(u.u_hover, Math.abs(p.q) < .5 ? hovered : 0);
          this.bindTexture(this.textures[item.i], 0, u.u_image); gl.drawArrays(gl.TRIANGLES, 0, this.planeCount);
        }
      }
      gl.depthMask(true);
    }
  }
  function initialize(data, onOpen) {
    data.forEach(prepareArt);
    const world = $('#world'), experience = $('#experience'), works = $('#works'), vision = $('#vision-panel'), portal = $('#portal');
    const embedded = document.body.classList.contains('embed-mode') || window.parent !== window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), coarse = window.matchMedia('(pointer: coarse)');
    let width = world.clientWidth, height = world.clientHeight, step = height * .82, offset = 0, target = 0, display = 0, current = -1;
    let paused = false, hovering = false, hover = 0, tick = 0, lastTime = 0, activeTime = 0, scrollTimer, navigation, visible = true, drag = null, lastRendered = -1;
    const pointer = { x: 0, y: 0 }, pointerTarget = { x: 0, y: 0 }, hitboxes = [], pages = [], fallbackImages = [];
    let renderer;
    const fallback = () => { renderer = null; world.classList.remove('has-webgl'); };
    try { renderer = new SceneRenderer($('#scene'), data, fallback, wake); world.classList.add('has-webgl'); }
    catch (error) { console.warn('Using the portfolio fallback renderer:', error.message); fallback(); }
    $('#scene').addEventListener('webglcontextrestored', () => { try { renderer = new SceneRenderer($('#scene'), data, fallback, wake); renderer.resize(width, height); world.classList.add('has-webgl'); wake(); } catch (error) { fallback(); } });
    function title(index) {
      const p = data[index], heading = $('#project-title'); heading.replaceChildren(); heading.setAttribute('aria-label', p.title);
      heading.classList.toggle('latin-title', /^[\x00-\x7F]+$/.test(p.displayTitle));
      // Reveal Chinese characters individually; keep English words intact for natural kerning.
      const parts = p.displayTitle.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*|[^\x00-\x7F]|\s|./gu) || [];
      parts.forEach((letter, i) => {
        const mask = document.createElement('span'); mask.className = 'letter-mask'; mask.setAttribute('aria-hidden', 'true');
        const glyph = document.createElement('span'); glyph.textContent = letter === ' ' ? '\u00a0' : letter; glyph.style.animationDelay = (i * 18) + 'ms'; mask.append(glyph); heading.append(mask);
      });
      $('#project-number').textContent = String(index + 1).padStart(2, '0');
      $('#project-category').textContent = p.english; $('#project-subtitle').textContent = p.subtitle; $('#project-description').textContent = p.desc;
      const tags = $('#project-tags'); tags.replaceChildren(); p.tag.split(' / ').forEach(t => { const span = document.createElement('span'); span.textContent = t; tags.append(span); });
      $('#scene-status').textContent = '项目 ' + (index + 1) + '：' + p.title;
      $('#gallery-count').textContent = String(index + 1).padStart(2, '0') + ' — 06';
      world.style.setProperty('--accent', p.accent);
      pages.forEach((button, i) => { button.classList.toggle('active', i === index); button.setAttribute('aria-current', i === index ? 'true' : 'false'); });
      $('#previous-project').disabled = index === 0; $('#next-project').disabled = index === data.length - 1;
    }
    data.forEach((p, i) => {
      const hit = document.createElement('button'); hit.className = 'project-hitbox'; hit.setAttribute('aria-label', '查看项目：' + p.title);
      hit.onclick = () => { if (drag && drag.moved) return; if (Math.abs(M.state(display).position - i) > .18) goProject(i); else onOpen(i); };
      hit.onpointerenter = () => { if (i === current) { hovering = true; wake(); } };
      hit.onpointerleave = () => { hovering = false; wake(); };
      $('#project-hitboxes').append(hit); hitboxes.push(hit);
      const page = document.createElement('button'); page.textContent = String(i + 1).padStart(2, '0'); page.setAttribute('aria-label', p.title); page.onclick = () => goProject(i);
      $('#gallery-pagination').append(page); pages.push(page);
      const fallbackCard = document.createElement('div'); fallbackCard.className = 'fallback-card';
      const image = document.createElement('img'); image.src = p.cover; image.alt = ''; fallbackCard.append(image); $('#fallback-cards').append(fallbackCard); fallbackImages.push(fallbackCard);
      p.artReady.then(url => { image.src = url; wake(); });
      const tile = document.createElement('button'); tile.className = 'directory-project';
      const preview = document.createElement('img'); preview.src = p.cover; preview.alt = ''; preview.loading = 'lazy';
      preview.width = p.coverSize[0]; preview.height = p.coverSize[1];
      const number = document.createElement('span'); number.className = 'directory-number'; number.textContent = '0' + (i + 1);
      const name = document.createElement('h2'); name.textContent = p.title;
      const tag = document.createElement('p'); tag.textContent = p.tag;
      tile.append(preview, number, name, tag); tile.onclick = () => { $('#directory').close(); goProject(i); }; $('#directory-grid').append(tile);
      p.artReady.then(url => preview.src = url);
    });
    function measure() {
      const previousStep = step, oldUnit = (window.scrollY - offset) / previousStep;
      width = world.clientWidth; height = world.clientHeight; step = height * .82;
      offset = experience.getBoundingClientRect().top + window.scrollY;
      experience.style.height = (height + step * M.END) + 'px';
      if (renderer) renderer.resize(width, height);
      if (lastTime && Math.abs(previousStep - step) > 30 && oldUnit > .05) window.scrollTo(0, offset + M.clamp(oldUnit, 0, M.END) * step);
      target = M.scrollState(window.scrollY, offset, step).unit; wake();
    }
    function cancelNavigation() { if (navigation) { navigation.resolve(false); navigation = null; } }
    function goToScroll(destination, duration) {
      cancelNavigation(); clearTimeout(scrollTimer); hovering = false;
      if (embedded) {
        window.parent.postMessage({ type: 'portfolio-effects:navigate', scrollTop: destination }, window.location.origin);
        return Promise.resolve(true);
      }
      const distance = destination - window.scrollY;
      if (Math.abs(distance) < 2 || reduced.matches) { window.scrollTo(0, destination); target = display = M.scrollState(destination, offset, step).unit; wake(); return Promise.resolve(true); }
      return new Promise(resolve => { navigation = { from: window.scrollY, destination, start: performance.now(), duration, resolve }; wake(); });
    }
    const goUnit = (unit, duration = 850) => goToScroll(offset + M.clamp(unit, 0, M.END) * step, duration);
    const goHome = (duration = 1100) => goToScroll(0, duration);
    const goIntro = (duration = 850) => {
      const intro = $('#intro-page');
      return intro ? goToScroll(intro.getBoundingClientRect().top + window.scrollY, duration) : goUnit(0, duration);
    };
    const goProject = index => goUnit(M.FIRST + M.clamp(index, 0, data.length - 1));
    function scheduleSnap() {
      clearTimeout(scrollTimer);
      if (embedded) return;
      scrollTimer = setTimeout(() => {
        if (paused || navigation || document.querySelector('dialog[open]') || (drag && drag.moved)) return;
        const progress = M.scrollState(window.scrollY, offset, step);
        if (!progress.entered) return;
        const unit = progress.unit, snap = M.snapPoint(unit, data.length);
        if (snap !== null && Math.abs(unit - snap) > .025) goUnit(snap, 720);
      }, 220);
    }
    let wasGallery = 0;
    function frame(now) {
      tick = 0;
      const dt = Math.min(64, now - (lastTime || now - 16)); lastTime = now;
      if (navigation) {
        const n = navigation, t = M.clamp((now - n.start) / n.duration);
        window.scrollTo(0, M.mix(n.from, n.destination, M.ease(t)));
        if (t === 1) { navigation = null; n.resolve(true); }
      }
      const progress = M.scrollState(window.scrollY, offset, step);
      target = progress.unit;
      document.body.classList.toggle('in-gallery', progress.entered);
      display = reduced.matches ? target : M.mix(display, target, 1 - Math.exp(-dt * .015));
      if (Math.abs(display - target) < .001) display = target;
      pointer.x = M.mix(pointer.x, pointerTarget.x, 1 - Math.exp(-dt * .008)); pointer.y = M.mix(pointer.y, pointerTarget.y, 1 - Math.exp(-dt * .008));
      hover = M.mix(hover, hovering ? 1 : 0, 1 - Math.exp(-dt * .012));
      const s = M.state(display, data.length);
      if (visible && !document.hidden && (!paused || Math.abs(display - lastRendered) > .001)) {
        if (!paused && !reduced.matches) activeTime += dt / 1000;
        if (renderer && s.stack < 1) { renderer.render(s, width, height, pointer, activeTime, hover); lastRendered = display; }
      }
      works.style.opacity = s.gallery; works.style.visibility = s.gallery < .002 ? 'hidden' : 'visible'; works.inert = s.gallery < .65;
      $('#scene-word').style.opacity = s.word; $('#scene-word').style.transform = 'translate(-50%,-50%) scale(' + M.mix(.75, 1.08, M.smooth(.15, 1.5, display)) + ')';
      if (current !== s.index || (s.gallery > .35 && wasGallery <= .35)) { current = s.index; title(current); }
      wasGallery = s.gallery;
      $('#site-header').classList.toggle('ink', s.lightHeader); $('#site-header').classList.toggle('under-dialog', paused);
      $('#gallery-progress-fill').style.transform = 'scaleX(' + ((s.position + 1) / data.length) + ')';
      $('.orb').style.transform = 'rotate(' + (s.position * 27 + pointer.x * 12) + 'deg)';
      const entry = M.smooth(.82, M.FIRST, display);
      data.forEach((p, i) => {
        const pose = M.pose(i, s.position, width, height, p.aspect, pointer, entry), b = pose.bounds, hit = hitboxes[i];
        Object.assign(hit.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', zIndex: String(30 - Math.round(Math.abs(pose.q) * 5)), visibility: pose.opacity > .05 && s.gallery > .6 ? 'visible' : 'hidden' });
        hit.tabIndex = i === current ? 0 : -1;
        if (!renderer) {
          const card = fallbackImages[i];
          Object.assign(card.style, { width: pose.screenWidth + 'px', height: pose.screenHeight + 'px', left: pose.centerX + 'px', top: pose.centerY + 'px', opacity: String(pose.opacity * (1 - M.smooth(6.72, 7.55, display))), zIndex: String(30 - Math.round(Math.abs(pose.q) * 5)), transform: 'translate(-50%,-50%) perspective(900px) rotateY(' + (pose.turn * 180 / Math.PI) + 'deg)' });
        }
      });
      vision.style.transform = 'translate3d(0,' + ((1 - s.stack) * 100) + '%,0)'; vision.style.visibility = s.stack < .001 ? 'hidden' : 'visible'; vision.inert = s.stack < .95;
      vision.classList.toggle('revealed', s.stack > .8);
      const rect = M.portalRect(width, height, s.expand);
      Object.assign(portal.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', opacity: String(M.smooth(8.15, 8.7, display)) });
      const portalTurn = (1 - s.expand) * M.mix(72, 26, M.smooth(8.15, 8.7, display));
      portal.style.transform = 'perspective(1400px) rotateY(' + portalTurn + 'deg) rotateZ(' + ((1 - s.expand) * -7) + 'deg)';
      portal.style.setProperty('--portal-expand', s.expand);
      $('#contact-content').style.opacity = s.contact; $('#contact-content').inert = s.contact < .8;
      $('#contact-content').style.transform = 'translateY(' + ((1 - s.contact) * 36) + 'px)';
      world.classList.toggle('cursor-active', hovering && s.gallery > .9 && !coarse.matches && !paused);
      const inMotion = Math.abs(display - target) > .001 || Math.abs(hover - (hovering ? 1 : 0)) > .01;
      if (!document.hidden && (navigation || inMotion || (visible && !paused && !reduced.matches && s.stack < 1))) wake();
    }
    function wake() { if (!tick && !document.hidden) tick = requestAnimationFrame(frame); }
    window.addEventListener('scroll', () => { target = M.scrollState(window.scrollY, offset, step).unit; if (!navigation) scheduleSnap(); wake(); }, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    document.addEventListener('visibilitychange', () => { lastTime = 0; if (!document.hidden) wake(); });
    window.addEventListener('wheel', event => {
      if (embedded || paused || document.querySelector('dialog[open]')) return;
      cancelNavigation();
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.3 && M.state(display).gallery > .9) {
        event.preventDefault(); window.scrollTo(0, window.scrollY + event.deltaX); scheduleSnap(); wake();
      }
    }, { passive: false });
    world.addEventListener('pointermove', event => {
      const rect = world.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      pointerTarget.x = (x / width - .5) * 2; pointerTarget.y = (.5 - y / height) * 2;
      $('#gallery-cursor').style.left = x + 'px'; $('#gallery-cursor').style.top = y + 'px';
      if (drag && !paused && M.state(display).gallery > .9) {
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!drag.moved && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.4) { drag.moved = true; cancelNavigation(); world.setPointerCapture(event.pointerId); }
        if (drag.moved) { event.preventDefault(); window.scrollTo(0, offset + M.clamp(drag.unit - dx / width * 1.7, M.FIRST, M.LAST) * step); hovering = false; }
      }
      wake();
    });
    world.addEventListener('pointerleave', () => { pointerTarget.x = pointerTarget.y = 0; hovering = false; wake(); });
    world.addEventListener('pointerdown', event => {
      if (paused || M.state(display).gallery < .9 || event.target.closest('a,button') && !event.target.closest('.project-hitbox')) return;
      drag = { x: event.clientX, y: event.clientY, unit: target, moved: false }; cancelNavigation();
    });
    const release = event => {
      if (!drag) return;
      if (world.hasPointerCapture(event.pointerId)) world.releasePointerCapture(event.pointerId);
      const moved = drag.moved;
      if (moved) { clearTimeout(scrollTimer); const snap = M.snapPoint(M.clamp((window.scrollY - offset) / step, 0, M.END)); if (snap !== null) goUnit(snap, 650); }
      setTimeout(() => drag = null, 0);
    };
    window.addEventListener('pointerup', release); world.addEventListener('pointercancel', release);
    document.addEventListener('keydown', event => {
      if (paused || document.querySelector('dialog[open]') || event.target.closest('input,textarea,select') || M.state(display).gallery < .8) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); current === data.length - 1 && event.key === 'ArrowDown' ? goUnit(M.STACK_END) : goProject(current + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); current === 0 && event.key === 'ArrowUp' ? goUnit(0) : goProject(current - 1); }
    });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); }, { threshold: 0 }).observe(world);
    $('#previous-project').onclick = () => goProject(current - 1); $('#next-project').onclick = () => goProject(current + 1);
    $('#project-open').onclick = () => onOpen(current);
    $('#works-link').onclick = event => { event.preventDefault(); goProject(0); };
    const explore = $('.explore-link'), introWorks = $('#intro-works');
    if (explore) explore.onclick = event => { event.preventDefault(); goIntro(); };
    if (introWorks) introWorks.onclick = event => { event.preventDefault(); goProject(0); };
    // Standalone works.html keeps its native link back to home.html.
    if ($('#hero')) $('.brand').onclick = event => { event.preventDefault(); goHome(); };
    $('#back-to-start').onclick = $('#footer-restart').onclick = () => goHome(1200);
    reduced.addEventListener('change', () => { display = target; wake(); });
    measure(); display = target; title(0); wake();
    syncInitialHash();
    function syncInitialHash() {
      const match = window.location.hash.match(/^#project-([0-5])$/);
      if (match) goProject(Number(match[1]));
      else if (window.location.hash === '#works') goProject(0);
    }
    const api = {
      data, goProject, goUnit, goHome, goIntro, get index() { return current; },
      setPaused(value) { paused = value; if (value) { cancelNavigation(); clearTimeout(scrollTimer); hovering = false; } wake(); },
      jumpToProject(index) { cancelNavigation(); const unit = M.FIRST + M.clamp(index, 0, data.length - 1); window.scrollTo(0, offset + unit * step); target = display = unit; wake(); },
      getBounds(index) { const pose = M.pose(index, M.state(display).position, width, height, data[index].aspect, pointer, 1); return pose.bounds; },
      get viewport() { return { width, height }; }, reduced
    };
    window.PortfolioGallery = api;
    return api;
  }
  window.initializePortfolioGallery = initialize;
})();
