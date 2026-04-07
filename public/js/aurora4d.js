/*!
 * aurora4d.js — Daltons AI interactive 4D background system
 * Three.js particle field with mouse parallax & scroll depth
 */
(function () {
  'use strict';

  const CFG = {
    count: 1800,
    spread: 28,
    depth: 12,
    speed: 0.00018,
    mouseStrength: 0.00012,
    colors: [
      [0.0, 0.83, 1.0],   // cyan #00D4FF
      [0.79, 0.36, 0.96], // purple #C95BF5
      [0.79, 0.64, 0.15], // gold #C9A227
      [0.06, 0.73, 0.51], // green #10B981
    ],
  };

  let canvas, renderer, scene, camera, particles, uniforms;
  let mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0, raf;

  /* ── bootstrap ─────────────────────────────────────────────────────────── */
  function init() {
    canvas = document.getElementById('cv');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'cv';
      canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
      document.body.prepend(canvas);
    }

    if (!window.THREE) { loadThree(boot); } else { boot(); }
  }

  function loadThree(cb) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ── Three.js setup ─────────────────────────────────────────────────────── */
  function boot() {
    const THREE = window.THREE;
    const W = window.innerWidth, H = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.z = CFG.depth;

    /* geometry */
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(CFG.count * 3);
    const col = new Float32Array(CFG.count * 3);
    const sz  = new Float32Array(CFG.count);
    const vel = new Float32Array(CFG.count * 3);

    for (let i = 0; i < CFG.count; i++) {
      const ci = i * 3;
      pos[ci]     = (Math.random() - 0.5) * CFG.spread;
      pos[ci + 1] = (Math.random() - 0.5) * CFG.spread;
      pos[ci + 2] = (Math.random() - 0.5) * CFG.spread;

      vel[ci]     = (Math.random() - 0.5) * 0.004;
      vel[ci + 1] = (Math.random() - 0.5) * 0.004;
      vel[ci + 2] = (Math.random() - 0.5) * 0.001;

      const c = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      col[ci]     = c[0] * brightness;
      col[ci + 1] = c[1] * brightness;
      col[ci + 2] = c[2] * brightness;

      sz[i] = 0.4 + Math.random() * 3.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sz,  1));

    /* shader material */
    const mat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float d = -mv.z;
          vAlpha = smoothstep(18.0, 2.0, d) * 0.85;
          gl_PointSize = size * (300.0 / d);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          float r = length(gl_PointCoord - 0.5) * 2.0;
          if(r > 1.0) discard;
          float a = pow(1.0 - r, 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, a);
        }`,
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* connection lines (subtle) */
    buildLines(THREE);

    resize();
    bind();
    loop();
  }

  function buildLines(THREE) {
    const pts = [];
    const n = 120;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 4 + Math.sin(a * 5) * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 3) * 2));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.06 });
    scene.add(new THREE.Line(geo, mat));
  }

  /* ── animate ─────────────────────────────────────────────────────────────── */
  let t = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    t += CFG.speed * 60;

    /* smooth mouse */
    mouse.tx += (mouse.x - mouse.tx) * 0.04;
    mouse.ty += (mouse.y - mouse.ty) * 0.04;

    camera.position.x = mouse.tx * CFG.mouseStrength * 800;
    camera.position.y = -mouse.ty * CFG.mouseStrength * 600 - scrollY * 0.002;
    camera.lookAt(0, 0, 0);

    /* drift particles */
    const pos = particles.geometry.attributes.position;
    const half = CFG.spread / 2;
    for (let i = 0; i < CFG.count; i++) {
      const ci = i * 3;
      pos.array[ci]     += Math.sin(t + i * 0.3) * 0.0012;
      pos.array[ci + 1] += Math.cos(t + i * 0.2) * 0.0012;
      pos.array[ci + 2] += Math.sin(t * 0.5 + i * 0.1) * 0.0006;
      // wrap
      if (Math.abs(pos.array[ci])     > half) pos.array[ci]     *= -0.98;
      if (Math.abs(pos.array[ci + 1]) > half) pos.array[ci + 1] *= -0.98;
      if (Math.abs(pos.array[ci + 2]) > half) pos.array[ci + 2] *= -0.98;
    }
    pos.needsUpdate = true;

    particles.rotation.y = t * 0.06;
    particles.rotation.x = t * 0.022;

    renderer.render(scene, camera);
  }

  /* ── helpers ──────────────────────────────────────────────────────────────── */
  function resize() {
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }

  function bind() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX - window.innerWidth / 2;
      mouse.y = e.clientY - window.innerHeight / 2;
    });
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      mouse.x = t.clientX - window.innerWidth / 2;
      mouse.y = t.clientY - window.innerHeight / 2;
    }, { passive: true });
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  }

  /* ── reveal on scroll ───────────────────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.rv, .rv-l, .rv-r, [data-rv]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ── 3D tilt on cards ───────────────────────────────────────────────────── */
  function initTilt() {
    document.querySelectorAll('.glass, .glass-light, .tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.015)`;
        el.style.transition = 'transform 0.1s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(.16,1,.3,1)';
      });
    });
  }

  /* ── cursor glow ────────────────────────────────────────────────────────── */
  function initCursor() {
    if (window.matchMedia('(pointer:coarse)').matches) return;
    const glow = document.createElement('div');
    glow.style.cssText = `
      position:fixed;width:400px;height:400px;border-radius:50%;pointer-events:none;z-index:1;
      background:radial-gradient(circle,rgba(0,212,255,.06) 0%,transparent 70%);
      transform:translate(-50%,-50%);transition:opacity .3s;mix-blend-mode:screen;`;
    document.body.appendChild(glow);
    window.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }

  /* ── entry ────────────────────────────────────────────────────────────────── */
  function start() {
    init();
    initReveal();
    initTilt();
    initCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
