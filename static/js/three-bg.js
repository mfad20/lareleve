/**
 * LA RELÈVE — Three.js Interactive Network Background
 * Cinematic particle network with mouse interaction
 */

(function () {
  'use strict';

  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ─────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* ── Scene & Camera ───────────────────────────────── */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 80;

  /* ── Config ───────────────────────────────────────── */
  const CONFIG = {
    PARTICLE_COUNT: window.innerWidth < 768 ? 60 : 120,
    CONNECTION_DIST: 22,
    PARTICLE_SIZE: 0.55,
    SPEED: 0.06,
    MOUSE_INFLUENCE: 14,
    COLOR_PRIMARY: new THREE.Color(0xD4AF37),   // Or (dominant)
    COLOR_ACCENT: new THREE.Color(0x0F3460),    // Bleu premium (accent)
    COLOR_DIM: new THREE.Color(0x071A52),       // Bleu nuit
  };

  /* ── Mouse ────────────────────────────────────────── */
  const mouse = { x: 0, y: 0, active: false };
  const mouseVec = new THREE.Vector3();

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.active = true;
    mouseVec.set(mouse.x * 55, mouse.y * 35, 0);
  });

  /* ── Particles ────────────────────────────────────── */
  const positions = new Float32Array(CONFIG.PARTICLE_COUNT * 3);
  const velocities = [];
  const sizes = new Float32Array(CONFIG.PARTICLE_COUNT);
  const colors = new Float32Array(CONFIG.PARTICLE_COUNT * 3);

  for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3]     = (Math.random() - 0.5) * 140;
    positions[i3 + 1] = (Math.random() - 0.5) * 90;
    positions[i3 + 2] = (Math.random() - 0.5) * 40;

    velocities.push({
      x: (Math.random() - 0.5) * CONFIG.SPEED,
      y: (Math.random() - 0.5) * CONFIG.SPEED,
      z: (Math.random() - 0.5) * CONFIG.SPEED * 0.3,
    });

    sizes[i] = CONFIG.PARTICLE_SIZE * (0.6 + Math.random() * 0.8);

    // Colour distribution
    const r = Math.random();
    let col;
    if (r < 0.55) col = CONFIG.COLOR_PRIMARY;
    else if (r < 0.75) col = CONFIG.COLOR_ACCENT;
    else col = CONFIG.COLOR_DIM;

    col.toArray(colors, i3);
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: CONFIG.PARTICLE_SIZE,
    vertexColors: true,
    transparent: true,
    opacity: 0.70,
    sizeAttenuation: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ── Connection Lines ─────────────────────────────── */
  const MAX_CONNECTIONS = CONFIG.PARTICLE_COUNT * 3;
  const linePositions = new Float32Array(MAX_CONNECTIONS * 2 * 3);
  const lineColors    = new Float32Array(MAX_CONNECTIONS * 2 * 3);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors,    3));

  const lineMat = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.50,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })
  );
  scene.add(lineMat);

  /* ── Floating Orbs (background glow) ─────────────── */
  const orbGroup = new THREE.Group();
  scene.add(orbGroup);

  const orbData = [
    { color: 0xD4AF37, x: -40, y: 20, z: -30, size: 12, speed: 0.0004 },
    { color: 0x0F3460, x:  45, y: -18, z: -20, size: 8,  speed: 0.0006 },
    { color: 0x071A52, x:   5, y:  30, z: -40, size: 16, speed: 0.0003 },
  ];

  orbData.forEach((o) => {
    const geo  = new THREE.SphereGeometry(o.size, 16, 16);
    const mat  = new THREE.MeshBasicMaterial({
      color: o.color,
      transparent: true,
      opacity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(o.x, o.y, o.z);
    mesh.userData.speed = o.speed;
    mesh.userData.origin = { x: o.x, y: o.y };
    orbGroup.add(mesh);
  });

  /* ── Update Connections ───────────────────────────── */
  function updateConnections() {
    let connIdx = 0;

    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < CONFIG.PARTICLE_COUNT; j++) {
        if (connIdx >= MAX_CONNECTIONS) break;

        const i3 = i * 3;
        const j3 = j * 3;

        const dx = positions[i3]     - positions[j3];
        const dy = positions[i3 + 1] - positions[j3 + 1];
        const dz = positions[i3 + 2] - positions[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONFIG.CONNECTION_DIST) {
          const alpha = 1 - dist / CONFIG.CONNECTION_DIST;
          const base  = connIdx * 6;

          // Start
          linePositions[base]     = positions[i3];
          linePositions[base + 1] = positions[i3 + 1];
          linePositions[base + 2] = positions[i3 + 2];
          // End
          linePositions[base + 3] = positions[j3];
          linePositions[base + 4] = positions[j3 + 1];
          linePositions[base + 5] = positions[j3 + 2];

          // Colour — bleu électrique pour toutes les lignes (#3B82F6)
          const r = 0.231 * alpha;
          const g = 0.510 * alpha;
          const b = 0.965 * alpha;

          lineColors[base]     = r; lineColors[base + 1] = g; lineColors[base + 2] = b;
          lineColors[base + 3] = r; lineColors[base + 4] = g; lineColors[base + 5] = b;

          connIdx++;
        }
      }
    }

    // Clear leftover segments
    for (let k = connIdx * 6; k < MAX_CONNECTIONS * 6; k++) {
      linePositions[k] = 0;
      lineColors[k]    = 0;
    }

    lineGeo.setDrawRange(0, connIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate    = true;
  }

  /* ── Animation Loop ───────────────────────────────── */
  let frameId;
  let time = 0;
  const BOUNDS = { x: 72, y: 48, z: 22 };

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.01;

    // Move particles
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const v  = velocities[i];

      // Mouse push
      if (mouse.active) {
        const dx = positions[i3]     - mouseVec.x;
        const dy = positions[i3 + 1] - mouseVec.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONFIG.MOUSE_INFLUENCE) {
          const force = (1 - d / CONFIG.MOUSE_INFLUENCE) * 0.004;
          v.x += dx * force;
          v.y += dy * force;
        }
      }

      // Damping
      v.x *= 0.995;
      v.y *= 0.995;

      positions[i3]     += v.x;
      positions[i3 + 1] += v.y;
      positions[i3 + 2] += v.z;

      // Bounce off bounds
      if (Math.abs(positions[i3])     > BOUNDS.x) v.x *= -1;
      if (Math.abs(positions[i3 + 1]) > BOUNDS.y) v.y *= -1;
      if (Math.abs(positions[i3 + 2]) > BOUNDS.z) v.z *= -1;
    }

    particleGeo.attributes.position.needsUpdate = true;
    updateConnections();

    // Animate orbs
    orbGroup.children.forEach((orb, idx) => {
      const s = orb.userData.speed;
      orb.position.x = orb.userData.origin.x + Math.sin(time * s * 1000 + idx) * 6;
      orb.position.y = orb.userData.origin.y + Math.cos(time * s * 800  + idx) * 4;
    });

    // Gentle camera drift
    camera.position.x += (mouse.x * 4 - camera.position.x) * 0.015;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.015;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize ───────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  });

  /* ── Pause when hidden ────────────────────────────── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
    } else {
      animate();
    }
  });
})();
