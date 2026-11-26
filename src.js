{
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- split headings into words ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span></span>`).join(' ');
  });

  /* ---------- loader ---------- */
  const countEl = document.getElementById('count');
  const chipFill = document.querySelector('.loader-chip i');
  const start = performance.now(), dur = reduce ? 200 : 1500;
  const finish = () => {
    document.body.classList.add('ready');
    document.body.classList.remove('loading');
    setTimeout(() => document.querySelector('.hero h1').classList.add('in'), reduce ? 0 : 450);
  };
  (function tick(now) {
    const p = clamp((now - start) / dur);
    countEl.textContent = Math.round(ease(p) * 100);
    chipFill.style.setProperty('--s', ease(p));
    if (p < 1) requestAnimationFrame(tick); else setTimeout(finish, 180);
  })(start);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const goTo = href => {
    let y;
    if (href === '#silicon') {
      const h = document.querySelector('.hero');
      y = h.offsetTop + (h.offsetHeight - innerHeight) * 0.75;
    } else {
      const el = document.querySelector(href);
      if (!el) return;
      y = el.getBoundingClientRect().top + scrollY;
    }
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- menu ---------- */
  const menuBtn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const href = a.getAttribute('href');
    const wasOpen = document.body.classList.contains('menu-open');
    setMenu(false);
    setTimeout(() => goTo(href), wasOpen ? 350 : 0);
  }));

  /* ---------- reveal on scroll ---------- */
  const revealer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
  }), { threshold: 0.2 });
  document.querySelectorAll('.reveal, [data-split]').forEach(el => { if (!el.closest('.hero')) revealer.observe(el); });

  /* ---------- counters ---------- */
  const counter = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    counter.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
    (function step(now) {
      const p = reduce ? 1 : clamp((now - t0) / 1400);
      el.textContent = Math.round(ease(p) * to) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }), { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => counter.observe(el));

  /* ---------- section progress helper ---------- */
  const progressOf = el => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  /* ---------- chapter rail + progress bar ---------- */
  const bar = document.querySelector('.progress span');
  const rail = [...document.querySelectorAll('.chapters li')];
  const hero = document.querySelector('.hero');
  const chapterEls = ['browser', 'data', 'people', 'next'].map(id => document.getElementById(id));
  const updateRail = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    let cur = progressOf(hero) > 0.5 ? 'silicon' : 'top';
    chapterEls.forEach(el => { if (el.getBoundingClientRect().top < innerHeight * 0.5) cur = el.id; });
    rail.forEach(li => li.classList.toggle('on', li.dataset.for === cur));
  };

  /* ---------- hero copy driven by scroll ---------- */
  const root = hero.querySelector('.stage');
  const updateHeroCopy = p => {
    const o1 = clamp(1 - p * 3.2), o2 = clamp((p - 0.42) / 0.18);
    root.style.setProperty('--o1', o1);
    root.style.setProperty('--y1', `${-p * 120}px`);
    root.style.setProperty('--pe1', o1 > 0.1 ? 'auto' : 'none');
    root.style.setProperty('--o2', o2);
    root.style.setProperty('--y2', `${(1 - o2) * 40}px`);
    root.style.setProperty('--pe2', o2 > 0.5 ? 'auto' : 'none');
  };

  /* ---------- 3D chip ---------- */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });

  let renderChip = () => {};
  const canvas = document.getElementById('gl');
  let glOK = false;
  try {
    if (window.THREE) {
      const T = THREE;
      const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
      const group = new T.Group(); scene.add(group);

      const cu = new T.MeshStandardMaterial({ color: 0xc8641e, metalness: 0.85, roughness: 0.3 });
      const glow = new T.MeshStandardMaterial({ color: 0xc8641e, emissive: 0xf08a3c, emissiveIntensity: 0.45 });
      const pkg = new T.Mesh(new T.BoxGeometry(4, 0.34, 4), new T.MeshStandardMaterial({ color: 0x1c1f23, roughness: 0.55, metalness: 0.25 }));
      group.add(pkg);
      const die = new T.Mesh(new T.BoxGeometry(3, 0.1, 3), new T.MeshStandardMaterial({ color: 0x2a2e34, roughness: 0.35, metalness: 0.55 }));
      die.position.y = 0.22; group.add(die);

      const pinG = new T.BoxGeometry(0.16, 0.06, 0.6);
      for (let i = 0; i < 9; i++) {
        const o = -1.6 + i * 0.4;
        [[o, 2.25, 0], [o, -2.25, 0], [2.25, o, Math.PI / 2], [-2.25, o, Math.PI / 2]].forEach(([x, z, r]) => {
          const pin = new T.Mesh(pinG, cu); pin.position.set(x, -0.08, z); pin.rotation.y = r; group.add(pin);
        });
      }

      const blocks = [];
      const label = text => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 512;
        const x = cv.getContext('2d');
        x.fillStyle = '#30353c'; x.fillRect(0, 0, 512, 512);
        x.strokeStyle = '#f08a3c'; x.lineWidth = 10; x.strokeRect(14, 14, 484, 484);
        x.fillStyle = '#f08a3c'; x.font = '700 92px Sora, Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(text, 256, 236);
        x.fillStyle = 'rgba(240,138,60,.45)';
        for (let r = 0; r < 3; r++) x.fillRect(120 + r * 30, 330 + r * 34, 272 - r * 60, 12);
        const tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
        return tex;
      };
      const side = new T.MeshStandardMaterial({ color: 0x30353c, roughness: 0.4, metalness: 0.5 });
      const topMats = [];
      const edgeMat = new T.LineBasicMaterial({ color: 0xf08a3c, transparent: true, opacity: 0.8 });
      [['Software', -0.72, -0.72], ['Data', 0.72, -0.72], ['Python', -0.72, 0.72], ['Web', 0.72, 0.72]].forEach(([name, x, z], i) => {
        const g = new T.BoxGeometry(1.2, 0.14, 1.2);
        const tex = label(name);
        const top = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.5, metalness: 0.2 });
        topMats.push(top);
        const m = new T.Mesh(g, [side, side, top, side, side, side]);
        m.add(new T.LineSegments(new T.EdgesGeometry(g), edgeMat));
        m.position.set(x, 0.34, z); m.userData = { y: 0.34, i };
        group.add(m); blocks.push(m);
      });
      const blockMat = { set emissiveIntensity(v) { topMats.forEach(t => { t.emissiveIntensity = v * 0.9; }); } };
      document.fonts && document.fonts.ready.then(() => topMats.forEach((t, i) => { t.map.image = label(['Software', 'Data', 'Python', 'Web'][i]).image; t.map.needsUpdate = true; }));

      const traceMat = new T.MeshStandardMaterial({ color: 0xc8641e, emissive: 0xc8641e, emissiveIntensity: 0.35, metalness: 0.6, roughness: 0.4 });
      [[0, 0.28, -1.45, 0.05, 0.02, 0.2], [0, 0.28, 1.45, 0.05, 0.02, 0.2], [-1.45, 0.28, 0, 0.2, 0.02, 0.05], [1.45, 0.28, 0, 0.2, 0.02, 0.05], [0, 0.29, 0, 0.18, 0.06, 0.18]]
        .forEach(([x, y, z, w, h, d]) => { const t = new T.Mesh(new T.BoxGeometry(w, h, d), traceMat); t.position.set(x, y, z); group.add(t); });

      // pulses running around the die edge
      const loop = [[-1.42, -1.42], [1.42, -1.42], [1.42, 1.42], [-1.42, 1.42]];
      const pulses = [];
      for (let k = 0; k < 6; k++) {
        const s = new T.Mesh(new T.SphereGeometry(0.045, 12, 12), glow);
        s.userData.o = k / 6; group.add(s); pulses.push(s);
      }
      const ringPos = (t, out) => {
        const seg = Math.floor(t * 4) % 4, f = (t * 4) % 1, a = loop[seg], b = loop[(seg + 1) % 4];
        out.set(lerp(a[0], b[0], f), 0.3, lerp(a[1], b[1], f));
      };

      scene.add(new T.AmbientLight(0xffffff, 0.55));
      const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(4, 8, 5); scene.add(key);
      const rim = new T.DirectionalLight(0xf08a3c, 0.6); rim.position.set(-5, 2, -4); scene.add(rim);
      const spot = new T.PointLight(0xff8a3c, 1.4, 9); scene.add(spot);

      const camA = new T.Vector3(0, 5.2, 9.5), camB = new T.Vector3(-2.4, 7.4, 4.2), tmp = new T.Vector3();
      const resize = () => {
        const w = root.clientWidth, h = root.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      new ResizeObserver(resize).observe(root); resize();

      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);

      renderChip = (time, p) => {
        if (!visible) return;
        const narrow = camera.aspect < 0.85;
        mouse.sx = lerp(mouse.sx, mouse.x, 0.06); mouse.sy = lerp(mouse.sy, mouse.y, 0.06);
        const e = ease(clamp(p / 0.85));
        group.rotation.y = (reduce ? 0.5 : time * 0.00012) * (1 - e) + mouse.sx * 0.35 + e * 0.6;
        group.rotation.x = mouse.sy * 0.15;
        group.position.x = narrow ? 0 : lerp(2.6, -1.3, e);
        group.position.y = narrow ? lerp(2.15, 1.1, e) : 0;
        blocks.forEach(b => { b.position.y = b.userData.y + ease(clamp((p - 0.1 - b.userData.i * 0.06) / 0.5)) * (0.9 + b.userData.i * 0.15); });
        blockMat.emissiveIntensity = 0.04 + e * 0.12;
        pulses.forEach(s => ringPos(((reduce ? 0 : time * 0.00012) + s.userData.o) % 1, s.position));
        spot.position.set(mouse.sx * 3, 2.4, mouse.sy * 3);
        camera.position.copy(tmp.copy(camA).lerp(camB, e)).multiplyScalar(narrow ? lerp(2.2, 1.6, e) : lerp(1.1, 1, e));
        camera.lookAt(0, narrow ? 0.3 : 0, 0);
        renderer.render(scene, camera);
      };
      glOK = true;
    }
  } catch (err) { glOK = false; }

  if (!glOK) {
    // fallback: flat SVG chip
    document.body.classList.add('no-gl');
    let s = '<svg viewBox="0 0 400 400">';
    for (let i = 0; i < 9; i++) { const p = 80 + i * 30;
      s += `<rect x="${p - 5}" y="40" width="10" height="30" rx="2" fill="#c8641e"/><rect x="${p - 5}" y="330" width="10" height="30" rx="2" fill="#c8641e"/><rect x="40" y="${p - 5}" width="30" height="10" rx="2" fill="#c8641e"/><rect x="330" y="${p - 5}" width="30" height="10" rx="2" fill="#c8641e"/>`; }
    s += '<rect x="64" y="64" width="272" height="272" rx="16" fill="#1c1f23"/><rect x="88" y="88" width="224" height="224" rx="8" fill="#2a2e34"/>';
    [[100, 100, 'Software'], [206, 100, 'Data'], [100, 206, 'Python'], [206, 206, 'Web']].forEach(([x, y, t]) => { s += `<rect x="${x}" y="${y}" width="94" height="94" rx="6" fill="#30353c" stroke="#f08a3c" stroke-opacity=".7"/><text x="${x + 47}" y="${y + 52}" text-anchor="middle" fill="#f08a3c" font-family="Sora, Inter, sans-serif" font-weight="700" font-size="15">${t}</text>`; });
    document.querySelector('.fallback').innerHTML = s + '</svg>';
  }

  /* ---------- mini brick game ---------- */
  const game = document.getElementById('game'), gx = game.getContext('2d');
  const G = { w: 0, h: 0, bricks: [], ball: { x: 0, y: 0, vx: 0, vy: 0, r: 7 }, pad: { x: 0, w: 0 }, user: 0, visible: false };
  const resetBricks = () => {
    const cols = G.w < 360 ? 6 : 8, rows = 5, gap = 6, top = 34, bw = (G.w - 40 - gap * (cols - 1)) / cols, bh = 16;
    G.bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      G.bricks.push({ x: 20 + c * (bw + gap), y: top + r * (bh + gap), w: bw, h: bh, alive: true, r });
  };
  const resetBall = () => {
    const sp = Math.max(3.2, G.w / 150);
    Object.assign(G.ball, { x: G.w / 2, y: G.h * 0.62, vx: sp * (Math.random() < 0.5 ? -0.7 : 0.7), vy: -sp, r: Math.max(5, G.w / 80) });
  };
  const sizeGame = () => {
    const dpr = Math.min(devicePixelRatio, 2), r = game.getBoundingClientRect();
    G.w = r.width; G.h = r.height; game.width = G.w * dpr; game.height = G.h * dpr;
    gx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.pad.w = Math.max(70, G.w * 0.18); G.pad.x = G.w / 2;
    resetBricks(); resetBall();
  };
  new ResizeObserver(sizeGame).observe(game);
  new IntersectionObserver(([e]) => { G.visible = e.isIntersecting; }).observe(game);
  const takePaddle = e => { const r = game.getBoundingClientRect(); G.pad.x = clamp(e.clientX - r.left, G.pad.w / 2, G.w - G.pad.w / 2); G.user = performance.now(); };
  game.addEventListener('pointermove', takePaddle);
  game.addEventListener('pointerdown', takePaddle);
  const shades = ['#f08a3c', '#e07a30', '#c8641e', '#a9531a', '#8a4416'];
  const stepGame = now => {
    if (!G.visible || !G.w) return;
    const b = G.ball, pad = G.pad, py = G.h - 26;
    if (now - G.user > 1800) pad.x = lerp(pad.x, clamp(b.x, pad.w / 2, G.w - pad.w / 2), 0.12);
    if (!reduce) { b.x += b.vx; b.y += b.vy; }
    if (b.x < b.r || b.x > G.w - b.r) { b.vx *= -1; b.x = clamp(b.x, b.r, G.w - b.r); }
    if (b.y < b.r) { b.vy = Math.abs(b.vy); }
    if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + 12 && Math.abs(b.x - pad.x) < pad.w / 2 + b.r) {
      const hit = (b.x - pad.x) / (pad.w / 2), sp = Math.hypot(b.vx, b.vy);
      b.vx = sp * hit * 0.8; b.vy = -Math.sqrt(Math.max(sp * sp - b.vx * b.vx, sp * sp * 0.3));
    }
    if (b.y > G.h + 20) resetBall();
    for (const k of G.bricks) {
      if (!k.alive) continue;
      if (b.x + b.r > k.x && b.x - b.r < k.x + k.w && b.y + b.r > k.y && b.y - b.r < k.y + k.h) {
        k.alive = false;
        const ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r)), oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r));
        if (ox < oy) b.vx *= -1; else b.vy *= -1;
        break;
      }
    }
    if (G.bricks.every(k => !k.alive)) { resetBricks(); resetBall(); }
    gx.clearRect(0, 0, G.w, G.h);
    gx.fillStyle = '#121416'; gx.fillRect(0, 0, G.w, G.h);
    G.bricks.forEach(k => { if (k.alive) { gx.fillStyle = shades[k.r]; gx.beginPath(); gx.roundRect ? gx.roundRect(k.x, k.y, k.w, k.h, 4) : gx.rect(k.x, k.y, k.w, k.h); gx.fill(); } });
    gx.fillStyle = '#ecebe8'; gx.beginPath(); gx.roundRect ? gx.roundRect(pad.x - pad.w / 2, py, pad.w, 10, 5) : gx.rect(pad.x - pad.w / 2, py, pad.w, 10); gx.fill();
    gx.fillStyle = '#ffffff'; gx.shadowColor = '#f08a3c'; gx.shadowBlur = 16;
    gx.beginPath(); gx.arc(b.x, b.y, b.r, 0, Math.PI * 2); gx.fill(); gx.shadowBlur = 0;
  };

  /* ---------- data dots: scatter to bars ---------- */
  const dots = document.getElementById('dots'), dx = dots.getContext('2d');
  const dataSec = document.getElementById('data');
  const steps = [...document.querySelectorAll('.steps li')];
  const N = 84, heights = [5, 9, 7, 14, 11, 16, 10], D = { w: 0, h: 0, pts: [], visible: false };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const buildDots = () => {
    const dpr = Math.min(devicePixelRatio, 2), r = dots.getBoundingClientRect();
    D.w = r.width; D.h = r.height; dots.width = D.w * dpr; dots.height = D.h * dpr; dx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const total = heights.reduce((a, b) => a + b, 0), cols = heights.length, pad = D.w * 0.1;
    const colW = (D.w - pad * 2) / cols, cell = Math.min(colW / 2.2, (D.h * 0.7) / Math.max(...heights));
    seed = 7; D.pts = [];
    let n = 0;
    heights.forEach((hgt, c) => {
      const count = Math.round(hgt / total * N);
      for (let k = 0; k < count; k++, n++) {
        const col = k % 2, row = Math.floor(k / 2);
        D.pts.push({ sx: pad + rnd() * (D.w - pad * 2), sy: D.h * 0.1 + rnd() * D.h * 0.75, ph: rnd() * 6.28,
          tx: pad + c * colW + colW / 2 + (col - 0.5) * cell, ty: D.h * 0.86 - row * cell, c });
      }
    });
    D.cell = cell;
  };
  new ResizeObserver(buildDots).observe(dots);
  new IntersectionObserver(([e]) => { D.visible = e.isIntersecting; }).observe(dots);
  const drawDots = (time, p) => {
    if (!D.visible || !D.w) return;
    const stacked = innerWidth <= 900;
    const pr = stacked ? clamp((innerHeight - dots.getBoundingClientRect().top) / (innerHeight * 0.9)) : p;
    const t = ease(clamp((pr - 0.2) / 0.55));
    const active = pr < 0.33 ? 0 : pr < 0.66 ? 1 : 2;
    steps.forEach((li, i) => li.classList.toggle('on', i <= active));
    dx.clearRect(0, 0, D.w, D.h);
    dx.strokeStyle = 'rgba(236,235,232,.18)'; dx.lineWidth = 1;
    dx.beginPath(); dx.moveTo(D.w * 0.08, D.h * 0.86 + D.cell * 0.6); dx.lineTo(D.w * 0.92, D.h * 0.86 + D.cell * 0.6); dx.stroke();
    const r = Math.max(3, D.cell * 0.36);
    D.pts.forEach(pt => {
      const j = reduce ? 0 : (1 - t) * 6;
      const x = lerp(pt.sx + Math.sin(time * 0.001 + pt.ph) * j, pt.tx, t);
      const y = lerp(pt.sy + Math.cos(time * 0.0013 + pt.ph) * j, pt.ty, t);
      dx.fillStyle = t > 0.6 ? (pt.c === 5 ? '#f08a3c' : 'rgba(236,235,232,.85)') : `rgba(240,138,60,${0.45 + 0.4 * Math.sin(pt.ph)})`;
      dx.beginPath(); dx.arc(x, y, r, 0, Math.PI * 2); dx.fill();
    });
  };

  /* ---------- marquee ---------- */
  const tracks = [...document.querySelectorAll('.track')].map(tr => {
    tr.innerHTML += tr.innerHTML;
    return { el: tr, dir: +tr.dataset.dir, x: 0 };
  });
  let lastY = scrollY, vel = 0;

  /* ---------- custom cursor + magnetic ---------- */
  const cur = document.querySelector('.cursor'), curLabel = cur.querySelector('.cursor-label');
  const C = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  if (finePointer && !reduce) {
    document.documentElement.classList.add('has-cursor');
    addEventListener('pointermove', e => { C.tx = e.clientX; C.ty = e.clientY; });
    document.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { cur.classList.add('big'); curLabel.textContent = el.dataset.cursor; });
      el.addEventListener('pointerleave', () => { cur.classList.remove('big'); });
    });
    document.querySelectorAll('a:not([data-cursor]), button').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('link'));
      el.addEventListener('pointerleave', () => cur.classList.remove('link'));
    });
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      el.style.transition = 'transform .3s cubic-bezier(.2,.8,.2,1)';
    });
  }

  /* ---------- main loop ---------- */
  const loop = time => {
    const hp = progressOf(hero);
    updateHeroCopy(hp);
    renderChip(time, hp);
    updateRail();
    stepGame(time);
    drawDots(time, progressOf(dataSec));
    vel = lerp(vel, scrollY - lastY, 0.1); lastY = scrollY;
    if (!reduce) tracks.forEach(t => {
      const half = t.el.scrollWidth / 2;
      t.x -= t.dir * (0.6 + Math.min(Math.abs(vel) * 0.25, 8));
      if (t.x <= -half) t.x += half; if (t.x > 0) t.x -= half;
      t.el.style.transform = `translateX(${t.x}px)`;
    });
    C.x = lerp(C.x, C.tx, 0.2); C.y = lerp(C.y, C.ty, 0.2);
    cur.style.transform = `translate(${C.x}px, ${C.y}px)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
