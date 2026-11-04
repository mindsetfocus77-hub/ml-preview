/* =========================================================================
   Miss Lith — WebGL
   · seda: shader de fondo a resolución reducida
   · tambor: carrusel 3D de la galería
   Si algo falla, la retícula HTML de la galería se queda como está.
   ========================================================================= */
import * as THREE from 'three';

const reduce = (window.ML && window.ML.reduce) ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

/* El 3D lee su color de los mismos tokens que el CSS, así sigue al tema. */
const css = getComputedStyle(document.documentElement);

function token (name, into) {
  const h = css.getPropertyValue(name).trim().replace('#', '');
  const n = parseInt(h, 16);
  const v = into || new THREE.Vector3();
  return Number.isNaN(n)
    ? v
    : v.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/* ───────────────────────────── SEDA ───────────────────────────── */

function silk () {
  const cv = document.getElementById('silk');
  if (!cv) return;

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false });
  // es un fondo difuso: a media resolución se ve igual y cuesta la cuarta parte
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1) * (coarse ? 0.45 : 0.6));

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uRes:   { value: new THREE.Vector2(1, 1) },
    uT:     { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.55) },
    uA:     { value: token('--silk-a') },   // fondo
    uB:     { value: token('--silk-b') },   // pliegue
    uC:     { value: token('--silk-c') }    // brillo
  };

  window.addEventListener('ml:tema', () => {
    token('--silk-a', uniforms.uA.value);
    token('--silk-b', uniforms.uB.value);
    token('--silk-c', uniforms.uC.value);
  });

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      void main(){ gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec2  uRes;
      uniform float uT;
      uniform vec2  uMouse;
      uniform vec3  uA;
      uniform vec3  uB;
      uniform vec3  uC;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i),                 hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.3; a *= 0.5; }
        return v;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float ar = uRes.x / uRes.y;
        vec2 p = vec2(uv.x * ar, uv.y);

        float t = uT * 0.042;

        // deformación del dominio: pliegues de tela
        vec2 q = vec2(fbm(p * 1.5 + vec2(0.0, t)),
                      fbm(p * 1.5 + vec2(5.2, 1.3) - t));
        float f = fbm(p * 1.8 + 2.6 * q + vec2(t * 0.4, 0.0));

        vec3 col = mix(uA, uB, smoothstep(0.26, 0.95, f));
        col = mix(col, uC, smoothstep(0.74, 1.06, f) * 0.20);

        // bloom bajo el cursor
        float d = distance(p, vec2(uMouse.x * ar, uMouse.y));
        col += uC * 0.060 * exp(-d * 2.8);
        col += uB * 0.200 * exp(-d * 1.5);

        // viñeta
        float v = smoothstep(1.30, 0.22, distance(uv, vec2(0.5)));
        col *= 0.42 + 0.58 * v;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  };
  resize();
  window.addEventListener('resize', resize);

  let mx = 0.5, my = 0.55;
  if (!coarse) {
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX / window.innerWidth;
      my = 1 - e.clientY / window.innerHeight;
    }, { passive: true });
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    uniforms.uT.value = reduce ? 12.0 : clock.getElapsedTime();
    uniforms.uMouse.value.x += (mx - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (my - uniforms.uMouse.value.y) * 0.05;
    renderer.render(scene, camera);
  });
}

/* ───────────────────────────── TAMBOR ─────────────────────────── */

/** Carga una imagen y la reescala: 2000px de alto por ocho no caben en VRAM. */
function loadTexture (src, maxW) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width  = Math.round(img.naturalWidth  * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);

      const tex = new THREE.CanvasTexture(c);
      // NoColorSpace a propósito: el shader es propio y no incluye <colorspace_fragment>,
      // así que con SRGBColorSpace three decodifica a lineal, nadie vuelve a codificar
      // y las fotos salen oscuras. Sin decodificar, pasan tal cual.
      tex.colorSpace  = THREE.NoColorSpace;
      tex.anisotropy  = 4;
      tex.needsUpdate = true;
      resolve({ tex, ar: img.naturalWidth / img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function drum () {
  const wrap = document.getElementById('drum');
  const cv   = document.getElementById('drum-c');
  const grid = document.getElementById('grid');
  const hint = document.getElementById('drum-hint');
  const srcs = (window.ML && window.ML.sources) || [];
  if (!wrap || !cv || !srcs.length) return;

  const loaded = await Promise.all(srcs.map((s) => loadTexture(s, 620)));

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  // no gastar GPU mientras el carrusel está fuera de pantalla
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; },
      { rootMargin: '150px' }).observe(wrap);
  }

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  const group = new THREE.Group();
  group.rotation.x = -0.04;
  scene.add(group);

  const PW = 1.85, PH = 2.78;        // plano 2:3, como las fotos
  const COPIES = 2;                   // dos vueltas: el tambor se ve lleno
  const N = loaded.length * COPIES;
  const R = (N * (PW + 0.32)) / (Math.PI * 2);

  const vert = `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `;
  const frag = `
    precision highp float;
    uniform sampler2D uTex;
    uniform float uDim;      // 0 de frente … 1 de espaldas
    uniform float uHot;
    uniform float uAr;       // proporción del plano
    uniform float uImgAr;    // proporción de la imagen
    uniform vec3  uTint;     // tinte de los planos del fondo
    varying vec2 vUv;

    void main(){
      // encaje tipo cover: la imagen llena el plano sin deformarse
      vec2 uv = vUv;
      float s = uImgAr / uAr;
      if (s > 1.0) uv.x = (uv.x - 0.5) / s + 0.5;
      else         uv.y = (uv.y - 0.5) * s + 0.5;

      vec3 c = texture2D(uTex, uv).rgb;

      c = mix(c, uTint, uDim * 0.78);
      c *= mix(1.0, 0.46, uDim);
      c += vec3(0.07, 0.035, 0.035) * uHot;

      // esquinas redondeadas, corregidas por proporción
      float r = 0.055;
      vec2 p  = (vUv - 0.5) * vec2(uAr, 1.0);
      vec2 hf = vec2(0.5 * uAr, 0.5);
      vec2 q  = abs(p) - (hf - r);
      float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

      float a = 1.0 - smoothstep(-0.004, 0.004, d);
      if (a < 0.01) discard;
      gl_FragColor = vec4(c, a);
    }
  `;

  const geo = new THREE.PlaneGeometry(PW, PH, 1, 1);
  const meshes = [];

  // un solo Vector3 compartido por los 16 materiales: al mutarlo cambian todos
  const tint = token('--drum-tint');
  window.addEventListener('ml:tema', () => token('--drum-tint', tint));

  for (let i = 0; i < N; i++) {
    const src = loaded[i % loaded.length];

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex:   { value: src.tex },
        uDim:   { value: 0 },
        uHot:   { value: 0 },
        uAr:    { value: PW / PH },
        uImgAr: { value: src.ar },
        uTint:  { value: tint }
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      side: THREE.DoubleSide
    });

    const m = new THREE.Mesh(geo, mat);
    const a = (i / N) * Math.PI * 2;
    m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    m.rotation.y = a;
    m.userData.i = i % loaded.length;
    group.add(m);
    meshes.push(m);
  }

  const resize = () => {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // encuadra el frente del tambor: más lejos cuanto más estrecha la pantalla
    const fit = PH * 1.42 / (2 * Math.tan((camera.fov * Math.PI / 180) / 2));
    camera.position.set(0, 0.1, R + Math.max(fit, (PW * 2.1) / camera.aspect / (2 * Math.tan((camera.fov * Math.PI / 180) / 2))));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };

  /* arrastre + inercia */
  let rot = 0, vel = 0, drag = false, lastX = 0, moved = 0, hot = -1;

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(99, 99);
  let pickDirty = false;

  const down = (x) => { drag = true; lastX = x; moved = 0; vel = 0; hint && hint.classList.add('gone'); };
  const move = (x) => {
    const d = (x - lastX) / cv.clientWidth;
    lastX = x; moved += Math.abs(d);
    vel = d * 3.2;
  };

  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); down(e.clientX); });
  cv.addEventListener('pointermove', (e) => {
    if (drag) { move(e.clientX); return; }
    const r = cv.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pickDirty = true;
  });
  cv.addEventListener('pointerup',     () => { drag = false; });
  cv.addEventListener('pointercancel', () => { drag = false; });
  cv.addEventListener('pointerleave',  () => { drag = false; hot = -1; });

  /* clic (sin arrastre) → lightbox */
  cv.addEventListener('click', (e) => {
    if (moved > 0.012) return;
    const r = cv.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(meshes, false);
    if (hits.length && window.ML) window.ML.openLightbox(hits[0].object.userData.i);
  });

  const wp = new THREE.Vector3();

  renderer.setAnimationLoop(() => {
    if (document.hidden || !onScreen) return;

    if (!drag) {
      vel *= 0.945;
      if (!reduce) vel += 0.0004;        // giro lento continuo
    }
    rot += vel;
    group.rotation.y = rot;

    if (pickDirty) {
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(meshes, false);
      hot = hits.length ? hits[0].object.userData.i : -1;
      pickDirty = false;
    }

    for (const m of meshes) {
      m.getWorldPosition(wp);
      const dim = THREE.MathUtils.clamp(0.5 - wp.z / (R * 2), 0, 1);
      const u = m.material.uniforms;
      u.uDim.value += (dim - u.uDim.value) * 0.2;
      u.uHot.value += ((m.userData.i === hot ? 1 : 0) - u.uHot.value) * 0.15;
    }

    renderer.render(scene, camera);
  });

  /* ya hay 3D: fuera la retícula */
  wrap.hidden = false;
  if (grid) grid.hidden = true;
  resize();
  window.addEventListener('resize', resize);
  setTimeout(() => hint && hint.classList.add('gone'), 6000);
}

/* ───────────────────────────── ARRANQUE ───────────────────────── */

try { silk(); } catch (e) { console.warn('seda:', e); }
drum().catch((e) => console.warn('tambor:', e));
