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
    patchedCapture: false,
  };

  const sequence = {
    before: [
      { id:'front-three-quarter', kind:'exterior', carY:0 },
      { id:'passenger-side', kind:'exterior', carY:-Math.PI/2 },
      { id:'rear-three-quarter', kind:'exterior', carY:Math.PI },
      { id:'driver-side', kind:'exterior', carY:Math.PI/2 },
      { id:'driver-seat', kind:'interior', door:'Door_Front_Left', doorAngle:65, approach:[3.25,1.72,1.95], camera:[1.95,1.38,1.28], target:[0.10,0.82,0.25], fov:61, carY:0 },
      { id:'passenger-area', kind:'interior', door:'Door_Front_Right', doorAngle:-65, approach:[-3.25,1.72,1.95], camera:[-1.95,1.38,1.28], target:[-0.10,0.82,0.25], fov:61, carY:0 },
      { id:'rear-seats', kind:'interior', door:'Door_Rear_Left', doorAngle:-65, approach:[3.15,1.68,-0.75], camera:[1.95,1.38,-0.62], target:[0.0,0.80,-0.48], fov:62, carY:0 },
    ],
    work: [
      { id:'front-three-quarter', kind:'exterior', carY:0 },
      { id:'passenger-side', kind:'exterior', carY:-Math.PI/2 },
      { id:'rear-three-quarter', kind:'exterior', carY:Math.PI },
      { id:'driver-side', kind:'exterior', carY:Math.PI/2 },
      { id:'driver-seat', kind:'interior', door:'Door_Front_Left', doorAngle:65, approach:[3.25,1.72,1.95], camera:[1.95,1.38,1.28], target:[0.10,0.82,0.25], fov:61, carY:0 },
      { id:'passenger-area', kind:'interior', door:'Door_Front_Right', doorAngle:-65, approach:[-3.25,1.72,1.95], camera:[-1.95,1.38,1.28], target:[-0.10,0.82,0.25], fov:61, carY:0 },
      { id:'rear-seats', kind:'interior', door:'Door_Rear_Left', doorAngle:-65, approach:[3.15,1.68,-0.75], camera:[1.95,1.38,-0.62], target:[0.0,0.80,-0.48], fov:62, carY:0 },
    ],
    proof: [
      { id:'rear-seats', kind:'interior', door:'Door_Rear_Left', doorAngle:-65, approach:[3.15,1.68,-0.75], camera:[1.95,1.38,-0.62], target:[0.0,0.80,-0.48], fov:62, carY:0 },
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
      .camera-car-placeholder { transition: opacity 160ms ease, visibility 160ms ease; }
      .viewfinder.car-guide-ready .camera-car-placeholder { opacity:0; visibility:hidden; }
      .car-guide-stage {
        position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0;
        transition:opacity 180ms ease; contain:layout paint style;
      }
      .car-guide-stage.ready { opacity:1; }
      .car-guide-stage canvas { width:100%; height:100%; display:block; }
      .car-guide-stage::after {
        content:""; position:absolute; inset:0; pointer-events:none; opacity:0;
        background:rgba(255,255,255,.24);
      }
      .car-guide-stage.car-guide-flash::after { animation:coastops-car-flash 130ms ease-out; }
      @keyframes coastops-car-flash { 0%{opacity:.46} 100%{opacity:0} }
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
        existing.addEventListener('load', () => resolve(window.gsap), { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve(window.gsap);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime() {
    if (state.runtime) return state.runtime;
    if (state.loading && state.modelPromise) return state.modelPromise;
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
      mountFromDom();
      applyPose(currentPose(), false);
      return state.runtime;
    }).catch(error => {
      state.loading = false;
      console.warn('[CoastOps car guide] 3D guide unavailable; keeping SVG fallback.', error);
      return null;
    });

    return state.modelPromise;
  }

  function setupThree() {
    if (state.renderer) return;
    const { THREE } = state.runtime;

    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
    state.cameraTarget = new THREE.Vector3(0, 0.68, 0);

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
    state.renderer.toneMappingExposure = 1.05;
    state.renderer.domElement.setAttribute('aria-hidden', 'true');

    const hemi = new THREE.HemisphereLight(0xeef6f2, 0x17201d, 1.7);
    state.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(5, 7, 5);
    state.scene.add(key);

    const fill = new THREE.DirectionalLight(0xceded8, 1.45);
    fill.position.set(-5, 3, 2);
    state.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xa9c9c1, 1.0);
    rim.position.set(0, 4, -6);
    state.scene.add(rim);

    state.cabinLight = new THREE.PointLight(0xffead1, 0, 7, 2);
    state.cabinLight.position.set(0, 1.25, 0.05);
    state.scene.add(state.cabinLight);

    state.scene.add(makeContactShadow());

    const loop = () => {
      state.raf = requestAnimationFrame(loop);
      if (!state.mounted || document.hidden || !state.renderer || !state.stage?.isConnected) return;
      state.camera.lookAt(state.cameraTarget);
      state.renderer.render(state.scene, state.camera);
    };
    loop();
  }

  function makeContactShadow() {
    const { THREE } = state.runtime;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 118);
    g.addColorStop(0, 'rgba(0,0,0,.48)');
    g.addColorStop(.52, 'rgba(0,0,0,.24)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.7, 2.35),
      new THREE.MeshBasicMaterial({ map: tex, transparent:true, depthWrite:false, opacity:.8 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.012, -0.05);
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
        if (name === 'composit') {
          mat.color?.setHex(0xc8cecc);
          mat.metalness = 0.48;
          mat.roughness = 0.24;
        } else if (name === 'red glass') {
          mat.color?.setHex(0x8f1f22);
          mat.transparent = true;
          mat.opacity = 0.78;
          mat.roughness = Math.max(0.10, mat.roughness || 0);
          mat.metalness = 0;
          mat.depthWrite = false;
        } else if (name.includes('glass')) {
          mat.color?.setHex(0x31413f);
          mat.transparent = true;
          mat.opacity = 0.42;
          mat.roughness = Math.max(0.08, mat.roughness || 0);
          mat.metalness = 0;
          mat.depthWrite = false;
        } else if (name === 'leather') {
          mat.color?.setHex(0x8d7962);
          mat.metalness = 0.05;
          mat.roughness = 0.62;
        } else if (name === 'light' || name === 'red light') {
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 1.35;
        } else if (name === 'jant' || name === 'silver') {
          mat.roughness = Math.max(0.18, mat.roughness || 0);
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
    if (state.mode === mode) return;
    state.mode = mode;
    state.index = 0;
    if (state.ready) applyPose(currentPose(), false);
  }

  function exteriorCamera() {
    const { THREE } = state.runtime;
    const aspect = Math.max(0.35, state.camera?.aspect || 0.5);
    const fov = 42;
    const vHalf = THREE.MathUtils.degToRad(fov * 0.5);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const limiting = Math.max(THREE.MathUtils.degToRad(8), Math.min(vHalf, hHalf));
    const distance = (state.modelRadius || 2.8) / Math.sin(limiting) * 0.93;
    const direction = new THREE.Vector3(0.58, 0.30, 0.76).normalize();
    const target = new THREE.Vector3(0, 0.69, 0);
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
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(angleDeg)
    );
    door.object.quaternion.copy(q.multiply(door.baseQuaternion));
    door.angle = angleDeg;
  }

  function tweenDoor(timeline, name, targetAngle, duration, at) {
    const door = state.doors.get(name);
    if (!door) return;
    const proxy = { angle: door.angle };
    timeline.to(proxy, {
      angle: targetAngle,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => applyDoor(name, proxy.angle),
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

  function applyPose(pose, animate = true) {
    if (!state.ready || !state.car || !state.runtime) return;
    const { gsap } = state.runtime;
    state.transition?.kill?.();

    const exterior = pose.kind === 'exterior';
    const ext = exterior ? exteriorCamera() : null;
    const finalCamera = exterior ? ext.camera : pose.camera;
    const finalTarget = exterior ? ext.target : pose.target;
    const finalFov = exterior ? ext.fov : pose.fov;
    const targetCarY = nearestAngle(state.car.rotation.y, pose.carY || 0);

    if (!animate || reducedMotion) {
      state.car.rotation.y = targetCarY;
      for (const name of state.doors.keys()) applyDoor(name, name === pose.door ? pose.doorAngle : 0);
      state.cabinLight.intensity = exterior ? 0 : 18;
      setCameraImmediate(finalCamera, finalTarget, finalFov);
      return;
    }

    const duration = exterior ? 0.34 : 0.42;
    const tl = gsap.timeline({ defaults:{ overwrite:'auto' } });
    state.transition = tl;

    if (exterior) {
      closeOtherDoors(tl, null, 0.22, 0);
      tl.to(state.car.rotation, { y:targetCarY, duration, ease:'power2.inOut' }, 0)
        .to(state.camera.position, { x:finalCamera[0], y:finalCamera[1], z:finalCamera[2], duration, ease:'power2.inOut' }, 0)
        .to(state.cameraTarget, { x:finalTarget[0], y:finalTarget[1], z:finalTarget[2], duration, ease:'power2.inOut' }, 0)
        .to(state.camera, { fov:finalFov, duration, ease:'power2.inOut', onUpdate:()=>state.camera.updateProjectionMatrix() }, 0)
        .to(state.cabinLight, { intensity:0, duration:0.20, ease:'power1.out' }, 0);
    } else {
      const approach = pose.approach || finalCamera;
      closeOtherDoors(tl, pose.door, 0.18, 0);
      tl.to(state.car.rotation, { y:targetCarY, duration:0.24, ease:'power2.inOut' }, 0)
        .to(state.camera.position, { x:approach[0], y:approach[1], z:approach[2], duration:0.22, ease:'power2.inOut' }, 0)
        .to(state.cameraTarget, { x:finalTarget[0], y:finalTarget[1], z:finalTarget[2], duration:0.30, ease:'power2.inOut' }, 0.08)
        .to(state.camera, { fov:Math.max(finalFov-4, 54), duration:0.22, ease:'power2.inOut', onUpdate:()=>state.camera.updateProjectionMatrix() }, 0);
      tweenDoor(tl, pose.door, pose.doorAngle, 0.28, 0.08);
      tl.to(state.camera.position, { x:finalCamera[0], y:finalCamera[1], z:finalCamera[2], duration:0.27, ease:'power2.out' }, 0.15)
        .to(state.camera, { fov:finalFov, duration:0.25, ease:'power2.out', onUpdate:()=>state.camera.updateProjectionMatrix() }, 0.15)
        .to(state.cabinLight, { intensity:18, duration:0.24, ease:'power1.out' }, 0.11);
    }
  }

  function next() {
    const mode = detectMode();
    setMode(mode);
    const seq = currentSequence();
    state.index = (state.index + 1) % seq.length;
    if (state.ready) applyPose(currentPose(), true);
    flashCapture();
    return currentPose()?.id;
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
    setTimeout(() => stage.classList.remove('car-guide-flash'), 130);
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

  function mountFromDom() {
    const viewfinder = document.querySelector('.camera-screen .viewfinder');
    if (!viewfinder) {
      state.mounted = false;
      state.stage = null;
      state.viewfinder = null;
      state.resizeObserver?.disconnect();
      maybePrewarm();
      return;
    }
    setMode(detectMode());
    attachStage(viewfinder);
    ensureRuntime();
  }

  function maybePrewarm() {
    if (state.ready || state.loading) return;
    if (!document.querySelector('.photo-hub,[onclick*="openCamera"]')) return;
    const warm = () => ensureRuntime();
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout:1200 });
    else setTimeout(warm, 250);
  }

  function patchCapture() {
    if (state.patchedCapture || typeof window.capture !== 'function') return;
    const originalCapture = window.capture;
    window.capture = function(...args) {
      const result = originalCapture.apply(this, args);
      mountFromDom();
      next();
      return result;
    };
    state.patchedCapture = true;
  }

  window.carGuide = {
    next,
    reset,
    mount: mountFromDom,
    get step() { return currentPose()?.id || null; },
    get ready() { return state.ready; },
  };

  injectStyles();
  patchCapture();
  mountFromDom();

  const observer = new MutationObserver(() => {
    patchCapture();
    mountFromDom();
  });
  observer.observe(document.getElementById('app') || document.body, { childList:true, subtree:false });
})();
