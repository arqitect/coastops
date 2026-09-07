(() => {
  const MODEL_URL = new URL('./assets/coastops-car.glb', import.meta.url).href;
  const THREE_IMPORT = 'three';
  const LOADER_IMPORT = 'three/addons/loaders/GLTFLoader.js';
  const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js';

  const state = {
    mode: null,
    index: 0,
    mounted: false,
    ready: false,
    loading: false,
    failed: false,
    runtime: null,
    renderer: null,
    scene: null,
    camera: null,
    cameraTarget: null,
    gltfScene: null,
    car: null,
    doors: new Map(),
    cabinLight: null,
    stage: null,
    viewfinder: null,
    resizeObserver: null,
    raf: 0,
    modelPromise: null,
    transition: null,
    modelRadius: 2.8,
  };

  const exteriorSequence = [
    { id:'front-three-quarter', kind:'exterior', carY:0 },
    { id:'passenger-side', kind:'exterior', carY:-Math.PI/2 },
    { id:'rear-three-quarter', kind:'exterior', carY:Math.PI },
    { id:'driver-side', kind:'exterior', carY:Math.PI/2 },
  ];

  const interiorSequence = [
    {
      id:'driver-seat', kind:'interior', carY:0,
      door:'Door_Front_Left', doorAngle:34, preDoor:18,
      approach:[2.9,1.56,2.02], camera:[2.38,1.34,1.56],
      target:[0.48,0.98,0.34], fov:49, cabinLight:1.45,
    },
    {
      id:'passenger-area', kind:'interior', carY:0,
      door:'Door_Front_Right', doorAngle:-34, preDoor:-18,
      approach:[-2.9,1.56,2.02], camera:[-2.38,1.34,1.56],
      target:[-0.48,0.98,0.34], fov:49, cabinLight:1.42,
    },
    {
      id:'rear-seats', kind:'interior', carY:0,
      door:'Door_Rear_Left', doorAngle:32, preDoor:16,
      approach:[2.82,1.5,-0.92], camera:[2.3,1.28,-0.9],
      target:[0.04,0.96,-0.38], fov:51, cabinLight:1.5,
    },
  ];

  const sequence = {
    before: [...exteriorSequence, ...interiorSequence],
    work: [...exteriorSequence, ...interiorSequence],
    proof: [
      interiorSequence[2],
      { id:'passenger-exterior', kind:'exterior', carY:-Math.PI/2 },
      { id:'rear-three-quarter', kind:'exterior', carY:Math.PI },
      { id:'front-three-quarter', kind:'exterior', carY:0 },
      { id:'driver-side', kind:'exterior', carY:Math.PI/2 },
    ],
  };

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectStyles() {
    if (document.getElementById('coastops-car-guide-styles')) return;
    const style = document.createElement('style');
    style.id = 'coastops-car-guide-styles';
    style.textContent = `
      .camera-car-placeholder { transition:opacity 150ms ease, visibility 150ms ease; }
      .viewfinder.car-guide-ready .camera-car-placeholder { opacity:0; visibility:hidden; }
      .car-guide-stage {
        position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0;
        transition:opacity 170ms ease; contain:layout paint style;
        background:
          radial-gradient(ellipse at 50% 70%, rgba(213,224,222,.16) 0%, rgba(40,49,49,.06) 34%, transparent 61%),
          radial-gradient(circle at 22% 17%, rgba(227,235,235,.12), transparent 37%),
          linear-gradient(155deg, #202727 0%, #101515 52%, #080b0c 100%);
      }
      .car-guide-stage.ready { opacity:1; }
      .car-guide-stage canvas { width:100%; height:100%; display:block; }
      .car-guide-stage::after {
        content:""; position:absolute; inset:0; pointer-events:none; opacity:0;
        background:rgba(255,255,255,.22);
      }
      .car-guide-stage.car-guide-flash::after { animation:coastops-car-flash 120ms ease-out; }
      @keyframes coastops-car-flash { 0%{opacity:.42} 100%{opacity:0} }
      @media (prefers-reduced-motion:reduce) {
        .camera-car-placeholder,.car-guide-stage { transition:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function detectMode() {
    if (document.querySelector('.camera-screen.proof-camera')) return 'proof';
    const title = document.querySelector('.camera-title')?.textContent || '';
    return title.includes('Before') ? 'before' : 'work';
  }

  function nearestAngle(current, target) {
    const turn = Math.PI * 2;
    while (target - current > Math.PI) target -= turn;
    while (target - current < -Math.PI) target += turn;
    return target;
  }

  function loadScript(src) {
    if (window.gsap) return Promise.resolve(window.gsap);
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === src);
      if (existing) {
        const finish = () => window.gsap ? resolve(window.gsap) : reject(new Error('GSAP failed to initialize'));
        existing.addEventListener('load', finish, { once:true });
        existing.addEventListener('error', reject, { once:true });
        setTimeout(() => window.gsap && resolve(window.gsap), 0);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => window.gsap ? resolve(window.gsap) : reject(new Error('GSAP failed to initialize'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    if (state.ready) return state.runtime;
    if (state.failed) return null;
    if (state.modelPromise) return state.modelPromise;

    state.loading = true;
    state.modelPromise = Promise.all([
      import(THREE_IMPORT),
      import(LOADER_IMPORT),
      loadScript(GSAP_URL),
    ]).then(async ([THREE, loaderModule, gsap]) => {
      state.runtime = { THREE, GLTFLoader: loaderModule.GLTFLoader, gsap };
      setupThree();
      await loadModel();
      state.ready = true;
      state.loading = false;
      sync();
      applyPose(currentPose(), false);
      return state.runtime;
    }).catch(error => {
      state.loading = false;
      state.failed = true;
      state.modelPromise = null;
      console.warn('[CoastOps car guide] 3D guide unavailable; keeping SVG fallback.', error);
      return null;
    });

    return state.modelPromise;
  }

  function setupThree() {
    if (state.renderer) return;
    const { THREE } = state.runtime;

    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(41, 1, 0.05, 80);
    state.cameraTarget = new THREE.Vector3(0, 0.72, 0);

    state.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });
    state.renderer.setClearColor(0x000000, 0);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    state.renderer.outputColorSpace = THREE.SRGBColorSpace;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.12;
    state.renderer.domElement.setAttribute('aria-hidden', 'true');

    const ambient = new THREE.AmbientLight(0xf5f7f7, 1.18);
    state.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xf4f8f8, 0x141718, 0.88);
    state.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(4.8, 6.8, 5.6);
    state.scene.add(key);

    const fill = new THREE.DirectionalLight(0xcad9df, 1.55);
    fill.position.set(-6.2, 2.8, 3.8);
    state.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xb8d2de, 1.48);
    rim.position.set(-0.4, 3.7, -6.6);
    state.scene.add(rim);

    const overhead = new THREE.SpotLight(0xffffff, 1.65, 18, Math.PI / 3.1, 0.62, 1.4);
    overhead.position.set(0, 8.6, 2.2);
    overhead.target.position.set(0, 0.35, 0);
    state.scene.add(overhead, overhead.target);

    state.cabinLight = new THREE.PointLight(0xffe8c7, 0.18, 5.5, 2);
    state.cabinLight.position.set(0, 1.18, 0.05);
    state.scene.add(state.cabinLight);

    state.scene.add(makeContactShadow());
    startRenderLoop();
  }

  function startRenderLoop() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(renderFrame);
  }

  function renderFrame() {
    state.raf = 0;
    if (!state.mounted || !state.renderer || !state.stage?.isConnected) {
      state.mounted = false;
      return;
    }
    if (!document.hidden) {
      state.camera.lookAt(state.cameraTarget);
      state.renderer.render(state.scene, state.camera);
    }
    state.raf = requestAnimationFrame(renderFrame);
  }

  function makeContactShadow() {
    const { THREE } = state.runtime;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 64, 7, 128, 64, 120);
    g.addColorStop(0, 'rgba(0,0,0,.48)');
    g.addColorStop(.48, 'rgba(0,0,0,.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 2.4),
      new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false, opacity:.72 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.01, -0.04);
    mesh.renderOrder = -1;
    return mesh;
  }

  async function loadModel() {
    const { THREE, GLTFLoader } = state.runtime;
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(MODEL_URL);
    state.gltfScene = gltf.scene;
    state.scene.add(gltf.scene);
    state.car = gltf.scene.getObjectByName('CoastOps_Car') || gltf.scene;

    const required = ['Door_Front_Left','Door_Front_Right','Door_Rear_Left','Door_Rear_Right'];
    for (const name of required) {
      const door = gltf.scene.getObjectByName(name);
      if (!door) throw new Error(`Required node missing: ${name}`);
      state.doors.set(name, {
        object: door,
        baseQuaternion: door.quaternion.clone(),
        angle: 0,
        motion: { angle:0 },
      });
    }

    tuneMaterials(gltf.scene, THREE);

    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    gltf.scene.position.x -= center.x;
    gltf.scene.position.z -= center.z;
    gltf.scene.position.y -= bounds.min.y;
    state.modelRadius = Math.max(2.55, Math.hypot(size.x, size.z) * 0.50);
  }

  function tuneMaterials(root, THREE) {
    const seen = new Set();
    root.traverse(obj => {
      if (!obj.isMesh) return;
      obj.frustumCulled = true;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (!mat || seen.has(mat.uuid)) continue;
        seen.add(mat.uuid);
        const name = (mat.name || '').toLowerCase();

        if (name === 'composit' || name.includes('body')) {
          mat.color?.setHex(0xd9dddc);
          if ('metalness' in mat) mat.metalness = 0.34;
          if ('roughness' in mat) mat.roughness = 0.23;
          if ('clearcoat' in mat) mat.clearcoat = 0.72;
          if ('clearcoatRoughness' in mat) mat.clearcoatRoughness = 0.16;
        } else if (name === 'red glass') {
          mat.color?.setHex(0x7e1c20);
          mat.transparent = true;
          mat.opacity = 0.76;
          if ('roughness' in mat) mat.roughness = 0.14;
          if ('metalness' in mat) mat.metalness = 0;
          mat.depthWrite = false;
        } else if (name.includes('glass')) {
          mat.color?.setHex(0x273231);
          mat.transparent = true;
          mat.opacity = 0.46;
          if ('roughness' in mat) mat.roughness = 0.12;
          if ('metalness' in mat) mat.metalness = 0;
          mat.depthWrite = false;
        } else if (name === 'leather' || name.includes('leather')) {
          mat.color?.setHex(0x655242);
          if ('metalness' in mat) mat.metalness = 0.02;
          if ('roughness' in mat) mat.roughness = 0.58;
        } else if (name === 'light' || name === 'red light') {
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 1.25;
        } else if (name === 'jant' || name === 'silver' || name.includes('rim')) {
          if ('metalness' in mat) mat.metalness = Math.max(0.55, mat.metalness || 0);
          if ('roughness' in mat) mat.roughness = Math.max(0.22, mat.roughness || 0);
        }
        mat.needsUpdate = true;
      }
    });
  }

  function currentSequence() {
    return sequence[state.mode || 'before'];
  }

  function currentPose() {
    const seq = currentSequence();
    return seq[((state.index % seq.length) + seq.length) % seq.length];
  }

  function setMode(mode) {
    if (!sequence[mode]) mode = 'work';
    if (state.mode === mode) return false;
    state.mode = mode;
    state.index = 0;
    if (state.ready) applyPose(currentPose(), false);
    return true;
  }

  function exteriorCamera() {
    const { THREE } = state.runtime;
    const aspect = Math.max(0.35, state.camera?.aspect || 0.5);
    const fov = 41;
    const vHalf = THREE.MathUtils.degToRad(fov * 0.5);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const limiting = Math.max(THREE.MathUtils.degToRad(8), Math.min(vHalf, hHalf));
    const distance = state.modelRadius / Math.sin(limiting) * 0.91;
    const direction = new THREE.Vector3(0.58, 0.27, 0.77).normalize();
    const target = new THREE.Vector3(0, 0.72, 0);
    return {
      camera: target.clone().add(direction.multiplyScalar(distance)).toArray(),
      target: target.toArray(),
      fov,
    };
  }

  function applyDoor(name, angleDeg) {
    const door = state.doors.get(name);
    if (!door || !state.runtime) return;
    const { THREE } = state.runtime;
    const localYaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(angleDeg)
    );
    door.object.quaternion.copy(door.baseQuaternion).multiply(localYaw);
    door.angle = angleDeg;
    door.motion.angle = angleDeg;
  }

  function tweenDoor(timeline, name, targetAngle, duration, at) {
    const door = state.doors.get(name);
    if (!door) return;
    timeline.to(door.motion, {
      angle:targetAngle,
      duration,
      onUpdate:() => applyDoor(name, door.motion.angle),
    }, at);
  }

  function closeOtherDoors(timeline, keepName, duration, at) {
    for (const name of state.doors.keys()) {
      if (name === keepName) continue;
      tweenDoor(timeline, name, 0, duration, at);
    }
  }

  function setCameraImmediate(position, target, fov) {
    state.camera.position.fromArray(position);
    state.cameraTarget.fromArray(target);
    state.camera.fov = fov;
    state.camera.updateProjectionMatrix();
    state.camera.lookAt(state.cameraTarget);
  }

  function killTransition() {
    if (!state.transition) return;
    state.transition.kill();
    state.transition = null;
  }

  function applyPose(pose, animate = true) {
    if (!state.ready || !state.car || !state.runtime || !pose) return;
    const { gsap } = state.runtime;
    killTransition();

    const exterior = pose.kind === 'exterior';
    const ext = exterior ? exteriorCamera() : null;
    const finalCamera = exterior ? ext.camera : pose.camera;
    const finalTarget = exterior ? ext.target : pose.target;
    const finalFov = exterior ? ext.fov : pose.fov;
    const targetCarY = nearestAngle(state.car.rotation.y, pose.carY ?? 0);
    const cabinIntensity = exterior ? 0.18 : (pose.cabinLight ?? 1.45);

    if (!animate || reducedMotion) {
      state.car.rotation.y = targetCarY;
      for (const name of state.doors.keys()) {
        applyDoor(name, name === pose.door ? (pose.doorAngle ?? 0) : 0);
      }
      state.cabinLight.intensity = cabinIntensity;
      setCameraImmediate(finalCamera, finalTarget, finalFov);
      return;
    }

    let tl;
    tl = gsap.timeline({
      defaults:{ ease:'power2.out', overwrite:'auto' },
      onComplete:() => {
        if (state.transition === tl) state.transition = null;
      },
    });
    state.transition = tl;

    if (exterior) {
      closeOtherDoors(tl, null, 0.2, 0);
      tl.to(state.car.rotation, { y:targetCarY, duration:0.34 }, 0)
        .to(state.camera.position, {
          x:finalCamera[0], y:finalCamera[1], z:finalCamera[2], duration:0.34,
        }, 0)
        .to(state.cameraTarget, {
          x:finalTarget[0], y:finalTarget[1], z:finalTarget[2], duration:0.34,
        }, 0)
        .to(state.camera, {
          fov:finalFov, duration:0.32,
          onUpdate:() => state.camera.updateProjectionMatrix(),
        }, 0)
        .to(state.cabinLight, { intensity:cabinIntensity, duration:0.2 }, 0);
      return;
    }

    const approach = pose.approach || finalCamera;
    const preDoor = pose.preDoor ?? Math.sign(pose.doorAngle || 1) * 17;
    const approachFov = Math.min(55, finalFov + 4);

    closeOtherDoors(tl, pose.door, 0.18, 0);
    tl.to(state.car.rotation, { y:targetCarY, duration:0.22 }, 0)
      .to(state.camera.position, {
        x:approach[0], y:approach[1], z:approach[2], duration:0.24,
      }, 0)
      .to(state.cameraTarget, {
        x:finalTarget[0], y:finalTarget[1], z:finalTarget[2], duration:0.3,
      }, 0.08)
      .to(state.camera, {
        fov:approachFov, duration:0.2,
        onUpdate:() => state.camera.updateProjectionMatrix(),
      }, 0.02);

    tweenDoor(tl, pose.door, preDoor, 0.16, 0.02);
    tweenDoor(tl, pose.door, pose.doorAngle, 0.22, 0.18);

    tl.to(state.camera.position, {
      x:finalCamera[0], y:finalCamera[1], z:finalCamera[2], duration:0.27,
    }, 0.17)
      .to(state.camera, {
        fov:finalFov, duration:0.24,
        onUpdate:() => state.camera.updateProjectionMatrix(),
      }, 0.18)
      .to(state.cabinLight, { intensity:cabinIntensity, duration:0.3 }, 0.12);
  }

  function next() {
    if (!state.mode) setMode(detectMode());
    sync();
    const seq = currentSequence();
    state.index = (state.index + 1) % seq.length;
    if (state.ready) applyPose(currentPose(), true);
    else ensureRuntime();
    flashCapture();
    return currentPose()?.id || null;
  }

  function reset() {
    state.index = 0;
    if (state.ready) applyPose(currentPose(), false);
  }

  function flashCapture() {
    const stage = state.stage;
    if (!stage) return;
    stage.classList.remove('car-guide-flash');
    void stage.offsetWidth;
    stage.classList.add('car-guide-flash');
    setTimeout(() => stage.classList.remove('car-guide-flash'), 120);
  }

  function resize() {
    if (!state.renderer || !state.stage || !state.camera) return;
    const rect = state.stage.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    state.renderer.setSize(rect.width, rect.height, false);
    state.camera.aspect = rect.width / rect.height;
    state.camera.updateProjectionMatrix();
    if (state.ready && currentPose()?.kind === 'exterior' && !state.transition?.isActive?.()) {
      applyPose(currentPose(), false);
    }
  }

  function attachStage(viewfinder) {
    if (!viewfinder) return;
    let stage = viewfinder.querySelector('.car-guide-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'car-guide-stage';
      stage.setAttribute('aria-hidden', 'true');
      viewfinder.appendChild(stage);
    }

    state.stage = stage;
    state.viewfinder = viewfinder;
    state.mounted = true;
    startRenderLoop();

    if (state.renderer && state.renderer.domElement.parentElement !== stage) {
      stage.appendChild(state.renderer.domElement);
    }

    if (state.ready) {
      viewfinder.classList.add('car-guide-ready');
      stage.classList.add('ready');
    }

    state.resizeObserver?.disconnect();
    if ('ResizeObserver' in window) {
      state.resizeObserver = new ResizeObserver(resize);
      state.resizeObserver.observe(stage);
    }
    requestAnimationFrame(resize);
  }

  function sync() {
    const viewfinder = document.querySelector('.camera-screen .viewfinder');
    if (!viewfinder) {
      state.mounted = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.stage = null;
      state.viewfinder = null;
      state.resizeObserver?.disconnect();
      maybePrewarm();
      return false;
    }

    if (!state.mode) setMode(detectMode());
    attachStage(viewfinder);
    ensureRuntime();
    return true;
  }

  function maybePrewarm() {
    if (state.ready || state.loading || state.failed || state.modelPromise) return;
    if (!document.querySelector('.photo-hub,[onclick*="openCamera"]')) return;
    const warm = () => ensureRuntime();
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout:1200 });
    else setTimeout(warm, 250);
  }

  window.carGuide = {
    sync,
    setMode,
    next,
    reset,
    get step() { return currentPose()?.id || null; },
    get ready() { return state.ready; },
  };

  injectStyles();
  if (document.querySelector('.camera-screen .viewfinder')) {
    setMode(detectMode());
    sync();
  } else {
    maybePrewarm();
  }
})();
