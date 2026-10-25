(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- entrance ---------- */
  (document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]) : Promise.resolve())
    .then(() => requestAnimationFrame(() => root.classList.add('ready')));

  /* ---------- theme toggle, with a circular reveal where supported ---------- */
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const themeBtn = $('#theme');
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      readColors();
    };
    if (!document.startViewTransition || reduceMotion) return apply();
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    root.style.setProperty('--tx', x + 'px');
    root.style.setProperty('--ty', y + 'px');
    root.style.setProperty('--tr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
    document.startViewTransition(apply);
  });

  /* ---------- nav: background, hide on scroll down, progress, active section ---------- */
  const nav = $('#nav');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    if (!root.classList.contains('menu-open')) nav.classList.toggle('hide', y > lastY && y > 480);
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const links = $$('.nav-links a');
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach(a => { const s = $(a.hash); if (s) spy.observe(s); });

  /* ---------- mobile menu ---------- */
  const menu = $('#menu'), menuBtn = $('#menu-btn');
  const setMenu = open => {
    menu.hidden = !open;
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('hide');
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- reveal on scroll, with decoding labels ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
  const scramble = el => {
    if (reduceMotion || el.dataset.done) return;
    el.dataset.done = 1;
    [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).forEach(node => {
      const final = node.textContent, total = 18;
      let frame = 0;
      const step = () => {
        frame++;
        node.textContent = final.split('').map((ch, i) => ch === ' ' || i < (frame / total) * final.length ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
        if (frame < total) requestAnimationFrame(step); else node.textContent = final;
      };
      step();
    });
  };
  const rev = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.hasAttribute('data-scramble')) scramble(e.target);
    rev.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal, [data-scramble]').forEach(el => rev.observe(el));
  $$('.featured, .about-row').forEach(g => $$(':scope > .reveal', g).forEach((el, i) => { el.style.transitionDelay = i * 90 + 'ms'; }));

  /* ---------- magnetic buttons + card spotlight ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * .18}px, ${(e.clientY - (r.top + r.height / 2)) * .28}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), border-color .3s, color .3s, background .3s';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 600);
      });
    });
    $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--sx', e.clientX - r.left + 'px');
      el.style.setProperty('--sy', e.clientY - r.top + 'px');
    }));
  }

  /* ---------- floating preview that follows the cursor over example rows ---------- */
  const preview = $('#preview');
  if (finePointer && preview) {
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, on = false, raf = 0, current = null, home = null;
    const follow = () => {
      const nx = x + (tx - x) * .14, ny = y + (ty - y) * .14;
      vx = nx - x; x = nx; y = ny;
      preview.style.setProperty('--px', x + 'px');
      preview.style.setProperty('--py', y + 'px');
      preview.style.setProperty('--pr', Math.max(-8, Math.min(8, vx * .5)) + 'deg');
      preview.style.setProperty('--ps', on ? 1 : .8);
      raf = on || Math.abs(vx) > .1 ? requestAnimationFrame(follow) : 0;
    };
    const place = e => { tx = e.clientX + 28; ty = e.clientY - preview.offsetHeight / 2; };
    $$('#example-index .row[data-preview]').forEach(row => {
      const media = $('.row-media', row);
      row.addEventListener('pointerenter', e => {
        if (current && current !== media) home.appendChild(current);
        current = media; home = row;
        preview.appendChild(media);
        place(e);
        if (!on) { x = tx; y = ty; }
        on = true; preview.classList.add('on');
        if (!raf) raf = requestAnimationFrame(follow);
      });
      row.addEventListener('pointermove', place);
      row.addEventListener('pointerleave', () => {
        on = false; preview.classList.remove('on');
        setTimeout(() => { if (!on && current) { home.appendChild(current); current = null; } }, 350);
      });
    });
  }

  /* ---------- copy the install line ---------- */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const status = btn.parentElement.querySelector('.copied');
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.classList.add('done');
      if (status) status.textContent = 'Copied';
      setTimeout(() => { btn.classList.remove('done'); if (status) status.textContent = ''; }, 2000);
    } catch (e) { if (status) status.textContent = 'Press ⌘C / Ctrl+C'; }
  }));


  /* =========================================================
     HERO: a small MapReduce run, drawn the way Explainer
     draws its worlds. Three reading machines split a
     sentence, tag every word, and send each word to the
     counting machine its hash picks; the counters stack
     their words and pass the totals on. The numbers in the
     strip above come from this run.
     ========================================================= */
  const canvas = $('#scan');
  const ctx = canvas.getContext('2d');
  let groundRGB = '15,15,15', hitRGB = '43,89,255', MONO = 'ui-monospace, monospace';
  function readColors() {
    const cs = getComputedStyle(root);
    groundRGB = cs.getPropertyValue('--scan-ground').trim() || groundRGB;
    hitRGB = cs.getPropertyValue('--scan-hit').trim() || hitRGB;
    MONO = cs.getPropertyValue('--mono').trim() || MONO;
  }
  readColors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
  new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- the world: the layout of the MapReduce page, in rough metres ----
  const BW = 1.7, BH = 1;                                   // a machine's half width and height
  const MAPS = [-6.6, 0, 6.6].map(z => ({ x: -4.5, z }));
  const REDS = [-6.6, 0, 6.6].map(z => ({ x: 4.2, z }));
  const IN = { x: -12, z: 0, r: 2.1 }, OUT = { x: 12, z: 0, r: 2.5 };
  const TEXTS = [
    'the quick brown fox jumps over the lazy dog and the fox naps',
    'to be or not to be that is the question',
    'a rose is a rose is a rose said gertrude stein',
  ];
  const fnv = s => { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

  // static points: the floor, the machines' edges, their trays, and the wires between them
  const G = [], F = [], T = [], Wd = [];
  const seg = (list, a, b, step) => {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / step));
    for (let i = 0; i <= n; i++) { const k = i / n; list.push(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }
  };
  const machine = m => {
    const xs = [m.x - BW, m.x + BW], zs = [m.z - BW, m.z + BW];
    for (const y of [0, BH]) {
      seg(F, [xs[0], y, zs[0]], [xs[1], y, zs[0]], .11); seg(F, [xs[0], y, zs[1]], [xs[1], y, zs[1]], .11);
      seg(F, [xs[0], y, zs[0]], [xs[0], y, zs[1]], .11); seg(F, [xs[1], y, zs[0]], [xs[1], y, zs[1]], .11);
    }
    for (const x of xs) for (const z of zs) seg(F, [x, 0, z], [x, BH, z], .11);
    for (let u = -BW + .3; u <= BW - .3 + 1e-6; u += .3) for (let v = -BW + .3; v <= BW - .3 + 1e-6; v += .3) T.push(m.x + u, BH, m.z + v);
  };
  const disc = c => {
    for (const [r, y] of [[c.r, 0], [c.r, .32], [c.r * .8, .32]]) {
      const n = Math.round(2 * Math.PI * r / .11);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; F.push(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r); }
    }
    for (let r = .35; r < c.r * .8; r += .35) {
      const n = Math.round(2 * Math.PI * r / .3);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r; T.push(c.x + Math.cos(a) * r, .32, c.z + Math.sin(a) * r); }
    }
  };
  MAPS.forEach(machine); REDS.forEach(machine); disc(IN); disc(OUT);
  for (let x = -20; x <= 20; x++) for (let z = -12; z <= 12; z++) {
    const d = Math.hypot(x / 20, z / 12), j = (fnv(x + ',' + z) % 1000) / 1000;
    if (j > d * 1.05 - .05) G.push(x, 0, z);
  }
  // a wire is a flat S-curve on the floor; the slips fly above it
  const wire = (a, b) => {
    const mx = (a[0] + b[0]) / 2;
    return p => { const u = 1 - p, k0 = u * u * u, k1 = 3 * u * u * p, k2 = 3 * u * p * p, k3 = p * p * p; return [k0 * a[0] + (k1 + k2) * mx + k3 * b[0], .02, k0 * a[1] + k1 * a[1] + k2 * b[1] + k3 * b[1]]; };
  };
  const toMap = MAPS.map(m => wire([IN.x + IN.r, IN.z], [m.x - BW, m.z]));
  const mapRed = MAPS.map(m => REDS.map(r => wire([m.x + BW, m.z], [r.x - BW, r.z])));
  const toOut = REDS.map(r => wire([r.x + BW, r.z], [OUT.x - OUT.r, OUT.z]));
  for (const f of [...toMap, ...mapRed.flat(), ...toOut]) for (let i = 0; i <= 70; i++) Wd.push(...f(i / 70));
  const GP = new Float32Array(G), FP = new Float32Array(F), TP = new Float32Array(T), WP = new Float32Array(Wd);

  // ---- the run: every number on screen is read off these plans ----
  function plan(text) {
    const words = text.split(' '), per = Math.ceil(words.length / 3);
    const chunks = [0, 1, 2].map(m => words.slice(m * per, (m + 1) * per));
    const slips = [];
    for (let k = 0; k < per; k++) for (let m = 0; m < 3; m++) if (chunks[m][k] != null) {
      const w = chunks[m][k];
      slips.push({ w, m, k, h: fnv(w) % 3, emit: 1.9 + slips.length * .17 });
    }
    const cols = [new Map(), new Map(), new Map()], s0 = slips[slips.length - 1].emit + .8;
    slips.forEach((s, i) => {
      s.send = s0 + i * .36; s.arrive = s.send + 1.2;
      const c = cols[s.h];
      if (!c.has(s.w)) c.set(s.w, { i: c.size, n: 0 });
      const col = c.get(s.w); s.col = col.i; s.lvl = col.n++;
    });
    const outAt = slips[slips.length - 1].arrive + .8, outs = [];
    cols.forEach((c, r) => [...c].forEach(([w, v], j) => outs.push({ w, r, col: v.i, n: v.n, at: outAt + r * .4 + j * .14 })));
    outs.forEach((o, i) => { o.slot = i; o.done = o.at + 1.1; });
    const last = Math.max(...outs.map(o => o.done));
    return { words, chunks, slips, cols, outAt, outs, end: last + 3.2 };
  }
  const PLANS = TEXTS.map(plan);
  let LOOP = PLANS.reduce((a, p) => a + p.end, 0);
  // a visitor's own words go through the same run: up to 12, so every counter has room for its stacks
  const MAX_WORDS = 12;
  let custom = false, told = false;
  function useText(str) {
    const words = str.toLowerCase().replace(/[^a-z0-9'’]+/g, ' ').split(' ').filter(Boolean).slice(0, MAX_WORDS);
    PLANS.splice(0, PLANS.length, ...(words.length >= 2 ? [plan(words.join(' '))] : TEXTS.map(plan)));
    LOOP = PLANS.reduce((a, p) => a + p.end, 0);
    simT = 0; box.ok = false; custom = words.length >= 2; told = false;
    if (reduceMotion) { simT = PLANS[0].slips[Math.min(6, PLANS[0].slips.length - 1)].send + .6; draw(); }
    return words.length >= 2 ? words.length : 0;
  }

  const mapSlot = (m, k) => [MAPS[m].x + ((k % 3) - 1) * .95, BH + .22, MAPS[m].z + (Math.floor(k / 3) - .5) * .95];
  const redSlot = (r, col, lvl) => [REDS[r].x + ((col % 3) - 1) * .95, BH + .22 + lvl * .34, REDS[r].z + (Math.floor(col / 3) - 1) * .95];
  const outSlot = i => { const a = i * 2.4, d = .3 + .26 * Math.sqrt(i); return [OUT.x + Math.cos(a) * d, .55, OUT.z + Math.sin(a) * d]; };
  const arc = (a, b, lift) => p => { const u = 1 - p, m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + lift, (a[2] + b[2]) / 2]; return [u * u * a[0] + 2 * u * p * m[0] + p * p * b[0], u * u * a[1] + 2 * u * p * m[1] + p * p * b[1], u * u * a[2] + 2 * u * p * m[2] + p * p * b[2]]; };
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const clamp01 = x => Math.max(0, Math.min(1, x));

  let W = 0, Hh = 0, dpr = 1, visible = true, raf = 0, prev = 0, simT = 0;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  const box = { x: 0, y: 0, w: 0, h: 0, ok: false };
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; Hh = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    box.ok = false;
  }
  addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
  if (finePointer) addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });

  const H_ = { phase: $('#h-phase'), words: $('#h-words'), sent: $('#h-sent'), hash: $('#h-hash') };
  let hudKey = '';

  function draw() {
    mx += (tmx - mx) * .04; my += (tmy - my) * .04;
    let t = ((simT % LOOP) + LOOP) % LOOP, P = PLANS[0];
    for (const p of PLANS) { if (t < p.end) { P = p; break; } t -= p.end; }
    const fade = clamp01(Math.min(t / .6, (P.end - t) / .9));
    ctx.clearRect(0, 0, W, Hh);

    const wide = W > 860;
    const cx = wide ? W * .7 : W * .5, cy = wide ? Hh * .45 : 224;
    const f = wide ? W * .58 : W * 1.04;
    const yaw = .22 + Math.sin(simT * .07) * .09 + mx * .4, tilt = .64 + my * .12, R = 34;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const o = [0, 0, 0];
    const proj = (x, y, z, out) => {
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y2 = y * ct + z1 * st, z2 = -y * st + z1 * ct + R;
      if (z2 < 2) return false;
      out[0] = cx + f * x1 / z2; out[1] = cy - f * y2 / z2; out[2] = z2;
      return out[0] > -10 && out[0] < W + 10 && out[1] > -10 && out[1] < Hh + 10;
    };
    const dim = wide ? 1 : .55;
    const cloud = (P3, size, alpha) => {
      const path = new Path2D();
      for (let i = 0; i < P3.length; i += 3) {
        if (!proj(P3[i], P3[i + 1], P3[i + 2], o)) continue;
        const s = Math.max(.7, Math.min(size, size * 30 / o[2]));
        path.rect(o[0] - s / 2, o[1] - s / 2, s, s);
      }
      ctx.fillStyle = `rgba(${groundRGB},${(alpha * dim).toFixed(3)})`;
      ctx.fill(path);
    };
    cloud(GP, 1.5, .16);
    cloud(WP, 1.3, .2);
    cloud(TP, 1.4, .16);
    cloud(FP, 1.6, .5);

    const vox = (p, rgb, a, scale = 1) => {
      if (a <= 0 || !proj(p[0], p[1], p[2], o)) return null;
      const s = Math.max(2.8, Math.min(8, 165 / o[2])) * scale * (wide ? 1 : .8);
      ctx.fillStyle = `rgba(${rgb},${(a * fade).toFixed(3)})`;
      ctx.fillRect(o[0] - s / 2, o[1] - s / 2, s, s);
      return [o[0], o[1]];
    };
    const lit = (fn, upto, a) => {                         // a wire lighting up behind what travels along it
      const path = new Path2D();
      for (let i = 0; i <= 50 * upto; i++) { if (proj(...fn(i / 50), o)) path.rect(o[0] - .9, o[1] - .9, 1.8, 1.8); }
      ctx.fillStyle = `rgba(${hitRGB},${(a * fade * dim).toFixed(3)})`; ctx.fill(path);
    };

    // split: each reading machine is handed its piece of the text
    P.chunks.forEach((c, m) => {
      const p = clamp01((t - .4 - m * .3) / 1.1);
      if (p <= 0) return;
      if (p < 1) { lit(toMap[m], p, .55); for (let j = 0; j < c.length; j++) vox(toMap[m](Math.max(0, ease(p) - j * .035)), hitRGB, .9 - j * .06, .6); }
      else lit(toMap[m], 1, .14 * (1 - clamp01((t - 1.8 - m * .3) / 1.5)));
    });

    // map: each word becomes a slip on top of its machine; shuffle: the slip flies to the counter its hash picks
    let flying = null, emitted = 0, sent = 0, lastMap = null;
    for (const s of P.slips) {
      if (t < s.emit) continue;
      emitted++; lastMap = s;
      const a = mapSlot(s.m, s.k);
      if (t < s.send) { const born = clamp01((t - s.emit) / .3); vox([a[0], a[1] + (1 - born) * .4, a[2]], groundRGB, .75 * born); continue; }
      vox(a, groundRGB, .16);
      const b = redSlot(s.h, s.col, s.lvl), p = (t - s.send) / 1.2;
      if (p < 1) {
        flying = s;
        const path = arc(a, b, 2.4), e = ease(p);
        lit(mapRed[s.m][s.h], 1, .32);
        for (let j = 1; j <= 14; j++) vox(path(Math.max(0, e - j * .022)), hitRGB, .5 * (1 - j / 15), .45);
        const q = vox(path(e), hitRGB, 1, 1.15);
        if (q) {
          ctx.font = `500 ${wide ? 11 : 10}px ${MONO}`;
          ctx.fillStyle = `rgba(${hitRGB},${fade.toFixed(3)})`;
          ctx.fillText(s.w, q[0] + 8, q[1] - 7);
        }
      } else {
        sent += s.w.length + 4;
        const gone = P.outs.find(x => x.r === s.h && x.col === s.col);
        const left = gone ? clamp01((t - gone.at) / .3) : 0;
        vox(b, hitRGB, .85 * (1 - left * .75));
      }
    }

    // reduce and output: each counter adds up its stacks and passes each total on
    let counted = 0;
    for (const x of P.outs) {
      if (t < x.at) continue;
      const a = redSlot(x.r, x.col, x.n - 1), b = outSlot(x.slot), p = (t - x.at) / 1.1;
      if (p < 1) { lit(toOut[x.r], 1, .22); vox(arc(a, b, 2)(ease(p)), hitRGB, 1, .9); }
      else { counted += x.n; vox(b, hitRGB, .9, .9); }
    }

    // labels, printed on the floor in front of each machine
    ctx.font = `500 ${wide ? 10 : 9}px ${MONO}`;
    ctx.fillStyle = `rgba(${groundRGB},${(.5 * dim).toFixed(3)})`;
    const label = (txt, x, z) => { if (proj(x, 0, z, o)) ctx.fillText(txt, o[0], o[1] + 12); };
    MAPS.forEach((m, i) => label(`map ${i}`, m.x - BW, m.z - BW));
    REDS.forEach((r, i) => label(`reduce ${i}`, r.x - BW, r.z - BW));
    label('input', IN.x - IN.r * .6, IN.z - IN.r);
    label('output', OUT.x - OUT.r * .6, OUT.z - OUT.r);

    // the focus: corner brackets on the machine the run is busy with, as Explainer's own pages do
    let target, tag, val;
    if (flying) { target = ['box', REDS[flying.h]]; tag = `reduce ${flying.h}`; val = `hash(${flying.w}) % 3 = ${flying.h}`; }
    else if (t >= P.outAt) { target = ['disc', OUT]; tag = 'output'; val = `${counted} of ${P.words.length} words counted`; }
    else if (lastMap && t < P.slips[0].send) { target = ['box', MAPS[lastMap.m]]; tag = `map ${lastMap.m}`; val = `reads “${lastMap.w}”`; }
    else if (!lastMap) { target = ['disc', IN]; tag = 'input'; val = `${P.words.length} words, 3 pieces`; }
    else { const s = [...P.slips].reverse().find(x => t >= x.arrive); target = ['box', REDS[s.h]]; tag = `reduce ${s.h}`; val = `hash(${s.w}) % 3 = ${s.h}`; }
    if (target) {
      const [kind, m] = target, corners = [];
      if (kind === 'box') { for (const dx of [-BW, BW]) for (const dz of [-BW, BW]) for (const y of [0, BH + 1.2]) corners.push([m.x + dx, y, m.z + dz]); }
      else { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (const y of [0, .8]) corners.push([m.x + Math.cos(a) * m.r, y, m.z + Math.sin(a) * m.r]); } }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of corners) { if (!proj(c[0], c[1], c[2], o)) continue; x0 = Math.min(x0, o[0]); y0 = Math.min(y0, o[1]); x1 = Math.max(x1, o[0]); y1 = Math.max(y1, o[1]); }
      const pad = wide ? 12 : 8, k = box.ok && !reduceMotion ? .16 : 1;
      box.x += (x0 - pad - box.x) * k; box.y += (y0 - pad - box.y) * k;
      box.w += (x1 - x0 + pad * 2 - box.w) * k; box.h += (y1 - y0 + pad * 2 - box.h) * k; box.ok = true;
      const L = wide ? 14 : 10, A = fade * (wide ? 1 : .8);
      ctx.strokeStyle = `rgba(${hitRGB},${A.toFixed(3)})`; ctx.lineWidth = 2; ctx.lineCap = 'square';
      ctx.beginPath();
      const { x, y, w, h } = box;
      ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
      ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
      ctx.moveTo(x, y + h - L); ctx.lineTo(x, y + h); ctx.lineTo(x + L, y + h);
      ctx.moveTo(x + w - L, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - L);
      ctx.stroke();
      ctx.font = `500 ${wide ? 10.5 : 9.5}px ${MONO}`;
      const tw = ctx.measureText(tag).width, vw = ctx.measureText(val).width, th = wide ? 19 : 17;
      ctx.fillStyle = `rgba(${hitRGB},${A.toFixed(3)})`;
      ctx.fillRect(x, y - th - 6, tw + vw + 24, th);
      ctx.fillStyle = `rgba(255,255,255,${A.toFixed(3)})`;
      ctx.fillText(tag, x + 8, y - 6 - th * .3);
      ctx.globalAlpha = .78 * A; ctx.fillText(val, x + 16 + tw, y - 6 - th * .3); ctx.globalAlpha = 1;
    }

    // a visitor's own words: once every total reaches the output, print them under the field
    if (custom && !told && counted === P.words.length) {
      told = true;
      const note = $('#try-note');
      if (note) note.textContent = [...P.outs].sort((a, b) => b.n - a.n || (a.w < b.w ? -1 : 1)).map(o => `${o.w} ${o.n}`).join(' · ');
    }

    // the strip above the hero reads the same run
    const phase = t < 1.9 ? 'split' : t < P.slips[0].send ? 'map' : t < P.outAt ? 'shuffle' : counted < P.words.length ? 'reduce' : 'done';
    const hs = flying ?? [...P.slips].reverse().find(x => t >= x.arrive);
    const key = `${phase}|${emitted}|${sent}|${hs ? hs.w : ''}`;
    if (key !== hudKey && H_.phase) {
      hudKey = key;
      H_.phase.textContent = phase; H_.words.textContent = emitted; H_.sent.textContent = sent + ' B';
      H_.hash.textContent = hs ? `hash(${hs.w}) % 3 = ${hs.h}` : 'hash(·) % 3';
    }
  }

  function loop(now) {
    const dt = Math.min(.05, prev ? (now - prev) / 1000 : 0);
    prev = now; simT += dt;
    draw();
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  const form = $('#try'), field = $('#try-words'), note = $('#try-note');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const n = useText(field.value);
    note.textContent = n ? `Counting your ${n} words.` : 'Back to the sample sentences.';
    if (!n) field.value = '';
    document.getElementById('top').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  resize();
  if (reduceMotion) { simT = PLANS[0].slips[6].send + .6; draw(); return; }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { prev = 0; raf = requestAnimationFrame(loop); }
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !raf) { prev = 0; raf = requestAnimationFrame(loop); }
  });
  window.__scene = { seek: s => { simT = s; draw(); }, plans: PLANS, use: useText };
})();
