(() => {
  const MODEL_URL = new URL('./assets/coastops-car.glb', import.meta.url).href;
  const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js';
  const DOORS = ['Door_Front_Left','Door_Front_Right','Door_Rear_Left','Door_Rear_Right'];

  const frontThreeQuarter = { id:'front-three-quarter', kind:'exterior', carY:0 };
  const driverSide = { id:'driver-side', kind:'exterior', carY:Math.PI/2 };
  const rearThreeQuarter = { id:'rear-three-quarter', kind:'exterior', carY:Math.PI };
  const passengerSide = { id:'passenger-side', kind:'exterior', carY:-Math.PI/2 };

  // Interior coordinates are authored in the car's local frame, then rotated with carY.
  // The camera stays outside the opening at roughly steering-wheel / seat-back height,
  // matching common dealership/detailing photos rather than flying into the hinge.
  const driverSeat = {
    id:'driver-seat', kind:'interior', carY:0,
    door:'Door_Front_Left', doorAngle:78, preDoor:34,
    approach:[4.42,1.48,-0.28], camera:[4.02,1.34,-0.24],
    target:[1.14,0.95,0.14], fov:50, cabinLight:1.48,
  };

  const rearSeats = {
    id:'rear-seats', kind:'interior', carY:Math.PI,
    door:'Door_Rear_Left', doorAngle:72, preDoor:30,
    approach:[4.28,1.44,-1.26], camera:[3.90,1.30,-1.24],
    target:[1.02,0.94,-1.00], fov:50, cabinLight:1.50,
  };

  const passengerArea = {
    id:'passenger-area', kind:'interior', carY:-Math.PI/2,
    door:'Door_Front_Right', doorAngle:78, preDoor:34,
    approach:[-4.42,1.48,-0.28], camera:[-4.02,1.34,-0.24],
    target:[-1.14,0.95,0.14], fov:50, cabinLight:1.46,
  };

  // One continuous clockwise visual tour with interior beats between exterior rotations.
  // This reads more like a guided walkaround than "four exteriors, then three doors".
  const walkaround = [
    frontThreeQuarter,
    driverSeat,
    driverSide,
    rearThreeQuarter,
    rearSeats,
    passengerSide,
    passengerArea,
  ];

  const sequences = {
    before:walkaround,
    work:walkaround,
    proof:[rearSeats, passengerSide, passengerArea, rearThreeQuarter, frontThreeQuarter],
  };

  const state = {
    mode:null,
    index:0,
    pending:0,
    ready:false,
    failed:false,
    runtimePromise:null,
    THREE:null,
    gsap:null,
    GLTFLoader:null,
    renderer:null,
    scene:null,
    camera:null,
    target:null,
    car:null,
    modelRadius:2.8,
    carCenter:null,
    doors:new Map(),
    cabinLight:null,
    stage:null,
    viewfinder:null,
    resizeObserver:null,
    transition:null,
    raf:0,
    mounted:false,
  };

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injectStyles(){
    if(document.getElementById('coastops-car-guide-styles')) return;
    const style=document.createElement('style');
    style.id='coastops-car-guide-styles';
    style.textContent=`
      .camera-car-placeholder{transition:opacity 150ms ease,visibility 150ms ease}
      .viewfinder.car-guide-ready .camera-car-placeholder{opacity:0;visibility:hidden}
      .car-guide-stage{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity 170ms ease;contain:layout paint style;background:radial-gradient(ellipse at 50% 70%,rgba(213,224,222,.16),rgba(40,49,49,.06) 34%,transparent 61%),radial-gradient(circle at 22% 17%,rgba(227,235,235,.12),transparent 37%),linear-gradient(155deg,#202727,#101515 52%,#080b0c)}
      .car-guide-stage.ready{opacity:1}
      .car-guide-stage canvas{width:100%;height:100%;display:block}
      .car-guide-stage::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;background:rgba(255,255,255,.22)}
      .car-guide-stage.car-guide-flash::after{animation:coastops-car-flash 120ms ease-out}
      @keyframes coastops-car-flash{0%{opacity:.42}100%{opacity:0}}
      @media(prefers-reduced-motion:reduce){.camera-car-placeholder,.car-guide-stage{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function detectMode(){
    if(document.querySelector('.camera-screen.proof-camera')) return 'proof';
    return (document.querySelector('.camera-title')?.textContent||'').includes('Before') ? 'before' : 'work';
  }

  function seq(){ return sequences[state.mode||'before']; }
  function pose(){ const s=seq(); return s[((state.index%s.length)+s.length)%s.length]; }

  function nearestAngle(current,target){
    const turn=Math.PI*2;
    while(target-current>Math.PI) target-=turn;
    while(target-current<-Math.PI) target+=turn;
    return target;
  }

  function loadGsap(){
    if(window.gsap) return Promise.resolve(window.gsap);
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src===GSAP_URL);
      if(existing){
        if(window.gsap) return resolve(window.gsap);
        existing.addEventListener('load',()=>window.gsap?resolve(window.gsap):reject(new Error('GSAP failed to initialize')),{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=GSAP_URL;
      script.async=true;
      script.onload=()=>window.gsap?resolve(window.gsap):reject(new Error('GSAP failed to initialize'));
      script.onerror=reject;
      document.head.appendChild(script);
    });
  }

  async function ensureRuntime(){
    if(state.ready) return state;
    if(state.failed) return null;
    if(state.runtimePromise) return state.runtimePromise;

    state.runtimePromise=Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      loadGsap(),
    ]).then(async([THREE,loaderModule,gsap])=>{
      state.THREE=THREE;
      state.GLTFLoader=loaderModule.GLTFLoader;
      state.gsap=gsap;
      setupThree();
      await loadModel();
      state.ready=true;
      sync();
      applyPose(pose(),false);
      flushPending();
      return state;
    }).catch(error=>{
      state.failed=true;
      state.runtimePromise=null;
      console.warn('[CoastOps car guide] 3D guide unavailable; keeping SVG fallback.',error);
      return null;
    });
    return state.runtimePromise;
  }

  function setupThree(){
    if(state.renderer) return;
    const T=state.THREE;
    state.scene=new T.Scene();
    state.camera=new T.PerspectiveCamera(41,1,.05,80);
    state.target=new T.Vector3(0,.72,0);
    state.renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',premultipliedAlpha:true});
    state.renderer.setClearColor(0x000000,0);
    state.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));
    state.renderer.outputColorSpace=T.SRGBColorSpace;
    state.renderer.toneMapping=T.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure=1.12;
    state.renderer.domElement.setAttribute('aria-hidden','true');

    state.scene.add(new T.AmbientLight(0xf5f7f7,1.18));
    state.scene.add(new T.HemisphereLight(0xf4f8f8,0x141718,.88));
    const light=(color,intensity,pos)=>{const l=new T.DirectionalLight(color,intensity);l.position.set(...pos);state.scene.add(l);};
    light(0xffffff,3.4,[4.8,6.8,5.6]);
    light(0xcad9df,1.55,[-6.2,2.8,3.8]);
    light(0xb8d2de,1.48,[-.4,3.7,-6.6]);
    const overhead=new T.SpotLight(0xffffff,1.65,18,Math.PI/3.1,.62,1.4);
    overhead.position.set(0,8.6,2.2);
    overhead.target.position.set(0,.35,0);
    state.scene.add(overhead,overhead.target);
    state.cabinLight=new T.PointLight(0xffe8c7,.18,5.5,2);
    state.cabinLight.position.set(0,1.18,.05);
    state.scene.add(state.cabinLight,makeContactShadow());
  }

  function makeContactShadow(){
    const T=state.THREE,c=document.createElement('canvas');
    c.width=256;c.height=128;
    const ctx=c.getContext('2d'),g=ctx.createRadialGradient(128,64,7,128,64,120);
    g.addColorStop(0,'rgba(0,0,0,.48)');g.addColorStop(.48,'rgba(0,0,0,.25)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,256,128);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(5.8,2.4),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.72}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(0,.01,-.04);mesh.renderOrder=-1;
    return mesh;
  }

  async function loadModel(){
    const T=state.THREE,gltf=await new state.GLTFLoader().loadAsync(MODEL_URL);
    state.scene.add(gltf.scene);

    const initialBounds=new T.Box3().setFromObject(gltf.scene),center=initialBounds.getCenter(new T.Vector3());
    gltf.scene.position.x-=center.x;
    gltf.scene.position.z-=center.z;
    gltf.scene.position.y-=initialBounds.min.y;
    gltf.scene.updateMatrixWorld(true);

    state.car=gltf.scene.getObjectByName('CoastOps_Car')||gltf.scene;
    const bounds=new T.Box3().setFromObject(gltf.scene),size=bounds.getSize(new T.Vector3());
    state.carCenter=bounds.getCenter(new T.Vector3());
    state.modelRadius=Math.max(2.55,Math.hypot(size.x,size.z)*.5);

    for(const name of DOORS){
      const object=gltf.scene.getObjectByName(name);
      if(!object) throw new Error(`Required node missing: ${name}`);
      const door={object,baseQuaternion:object.quaternion.clone(),motion:{angle:0},openSign:1};
      state.doors.set(name,door);
      door.openSign=detectOutwardSign(door);
      applyDoor(name,0);
    }

    tuneMaterials(gltf.scene);
  }

  function doorLateralDistance(object){
    const box=new state.THREE.Box3().setFromObject(object);
    const center=box.getCenter(new state.THREE.Vector3());
    return Math.abs(center.x-(state.carCenter?.x||0));
  }

  function applyDoorRaw(door,signedAngle){
    const T=state.THREE;
    const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),T.MathUtils.degToRad(signedAngle));
    door.object.quaternion.copy(yaw).multiply(door.baseQuaternion);
    door.object.updateMatrixWorld(true);
  }

  function detectOutwardSign(door){
    applyDoorRaw(door,11);
    const plus=doorLateralDistance(door.object);
    applyDoorRaw(door,-11);
    const minus=doorLateralDistance(door.object);
    door.object.quaternion.copy(door.baseQuaternion);
    door.object.updateMatrixWorld(true);
    return plus>=minus ? 1 : -1;
  }

  function tuneMaterials(root){
    const seen=new Set();
    root.traverse(obj=>{
      if(!obj.isMesh) return;
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const mat of mats){
        if(!mat||seen.has(mat.uuid)) continue;
        seen.add(mat.uuid);
        const name=(mat.name||'').toLowerCase();
        if(name==='composit'||name.includes('body')){
          mat.color?.setHex(0xd9dddc);if('metalness'in mat)mat.metalness=.34;if('roughness'in mat)mat.roughness=.23;if('clearcoat'in mat)mat.clearcoat=.72;if('clearcoatRoughness'in mat)mat.clearcoatRoughness=.16;
        }else if(name.includes('glass')){
          mat.color?.setHex(name.includes('red')?0x7e1c20:0x273231);mat.transparent=true;mat.opacity=name.includes('red')?.76:.46;if('roughness'in mat)mat.roughness=.12;if('metalness'in mat)mat.metalness=0;mat.depthWrite=false;
        }else if(name.includes('leather')){
          mat.color?.setHex(0x655242);if('metalness'in mat)mat.metalness=.02;if('roughness'in mat)mat.roughness=.58;
        }else if(name==='light'||name==='red light'){
          if('emissiveIntensity'in mat)mat.emissiveIntensity=1.25;
        }
        mat.needsUpdate=true;
      }
    });
  }

  function setMode(mode){
    if(!sequences[mode]) mode='work';
    if(state.mode===mode) return false;
    state.mode=mode;state.index=0;state.pending=0;
    if(state.ready) applyPose(pose(),false);
    return true;
  }

  function exteriorCamera(){
    const T=state.THREE,aspect=Math.max(.35,state.camera?.aspect||.5),fov=41;
    const v=T.MathUtils.degToRad(fov*.5),h=Math.atan(Math.tan(v)*aspect),limiting=Math.max(T.MathUtils.degToRad(8),Math.min(v,h));
    const distance=state.modelRadius/Math.sin(limiting)*.91,direction=new T.Vector3(.58,.27,.77).normalize(),target=new T.Vector3(0,.72,0);
    return{camera:target.clone().add(direction.multiplyScalar(distance)).toArray(),target:target.toArray(),fov};
  }

  function rotateLocal(point,angle){
    const v=new state.THREE.Vector3(...point);
    v.applyAxisAngle(new state.THREE.Vector3(0,1,0),angle||0);
    return v.toArray();
  }

  function interiorFrame(nextPose){
    const angle=nextPose.carY||0;
    return{
      camera:rotateLocal(nextPose.camera,angle),
      approach:rotateLocal(nextPose.approach||nextPose.camera,angle),
      target:rotateLocal(nextPose.target,angle),
      fov:nextPose.fov,
    };
  }

  function applyDoor(name,angle){
    const door=state.doors.get(name);if(!door)return;
    applyDoorRaw(door,angle*door.openSign);
    door.motion.angle=angle;
  }

  function tweenDoor(tl,name,angle,duration,at){
    const door=state.doors.get(name);if(!door)return;
    tl.to(door.motion,{angle,duration,onUpdate:()=>applyDoor(name,door.motion.angle)},at);
  }

  function closeOtherDoors(tl,keep,duration,at){for(const name of state.doors.keys())if(name!==keep)tweenDoor(tl,name,0,duration,at);}

  function setCamera(position,target,fov){
    state.camera.position.fromArray(position);state.target.fromArray(target);state.camera.fov=fov;state.camera.updateProjectionMatrix();state.camera.lookAt(state.target);
  }

  function killTransition(){if(state.transition){state.transition.kill();state.transition=null;}}

  function applyPose(nextPose,animate=true){
    if(!state.ready||!state.car||!nextPose)return;
    killTransition();

    const isExterior=nextPose.kind==='exterior';
    const frame=isExterior?exteriorCamera():interiorFrame(nextPose);
    const camera=frame.camera,target=frame.target,fov=frame.fov;
    const approach=isExterior?camera:frame.approach;
    const carY=nearestAngle(state.car.rotation.y,nextPose.carY??0);
    const cabin=isExterior?.18:(nextPose.cabinLight??1.45);

    if(!animate||reducedMotion){
      state.car.rotation.y=carY;
      for(const name of state.doors.keys())applyDoor(name,name===nextPose.door?(nextPose.doorAngle??0):0);
      state.cabinLight.intensity=cabin;
      setCamera(camera,target,fov);
      return;
    }

    let tl;
    tl=state.gsap.timeline({defaults:{ease:'power2.out',overwrite:'auto'},onComplete:()=>{if(state.transition===tl)state.transition=null;}});
    state.transition=tl;

    if(isExterior){
      closeOtherDoors(tl,null,.19,0);
      tl.to(state.car.rotation,{y:carY,duration:.34},0)
        .to(state.camera.position,{x:camera[0],y:camera[1],z:camera[2],duration:.34},0)
        .to(state.target,{x:target[0],y:target[1],z:target[2],duration:.34},0)
        .to(state.camera,{fov,duration:.30,onUpdate:()=>state.camera.updateProjectionMatrix()},0)
        .to(state.cabinLight,{intensity:cabin,duration:.18},0);
      return;
    }

    const preDoor=nextPose.preDoor??17,approachFov=Math.min(54,fov+3);
    closeOtherDoors(tl,nextPose.door,.17,0);
    tl.to(state.car.rotation,{y:carY,duration:.20},0)
      .to(state.camera.position,{x:approach[0],y:approach[1],z:approach[2],duration:.23},.02)
      .to(state.target,{x:target[0],y:target[1],z:target[2],duration:.32},.04)
      .to(state.camera,{fov:approachFov,duration:.18,onUpdate:()=>state.camera.updateProjectionMatrix()},.02);

    tweenDoor(tl,nextPose.door,preDoor,.13,.02);
    tweenDoor(tl,nextPose.door,nextPose.doorAngle,.20,.14);

    tl.to(state.camera.position,{x:camera[0],y:camera[1],z:camera[2],duration:.25},.18)
      .to(state.camera,{fov,duration:.22,onUpdate:()=>state.camera.updateProjectionMatrix()},.18)
      .to(state.cabinLight,{intensity:cabin,duration:.28},.10);
  }

  function flushPending(){
    if(!state.ready||!state.pending)return;
    const count=state.pending;state.pending=0;
    state.index=(state.index+count)%seq().length;
    applyPose(pose(),true);
  }

  function next(){
    if(!state.mode)setMode(detectMode());
    sync();
    if(!state.ready){state.pending=(state.pending+1)%seq().length;ensureRuntime();flash();return pose()?.id||null;}
    state.index=(state.index+1)%seq().length;
    applyPose(pose(),true);flash();return pose()?.id||null;
  }

  function reset(){state.index=0;state.pending=0;if(state.ready)applyPose(pose(),false);}

  function flash(){
    if(!state.stage)return;
    state.stage.classList.remove('car-guide-flash');void state.stage.offsetWidth;state.stage.classList.add('car-guide-flash');
    setTimeout(()=>state.stage?.classList.remove('car-guide-flash'),120);
  }

  function resize(){
    if(!state.renderer||!state.stage||!state.camera)return;
    const rect=state.stage.getBoundingClientRect();if(rect.width<2||rect.height<2)return;
    state.renderer.setSize(rect.width,rect.height,false);state.camera.aspect=rect.width/rect.height;state.camera.updateProjectionMatrix();
    if(state.ready&&pose()?.kind==='exterior'&&!state.transition){const ext=exteriorCamera();setCamera(ext.camera,ext.target,ext.fov);}
  }

  function renderFrame(){
    state.raf=0;
    if(!state.mounted||!state.stage?.isConnected||!state.renderer){state.mounted=false;return;}
    if(!document.hidden){state.camera.lookAt(state.target);state.renderer.render(state.scene,state.camera);}
    state.raf=requestAnimationFrame(renderFrame);
  }

  function startLoop(){if(!state.raf)state.raf=requestAnimationFrame(renderFrame);}

  function attach(viewfinder){
    let stage=viewfinder.querySelector('.car-guide-stage');
    if(!stage){stage=document.createElement('div');stage.className='car-guide-stage';stage.setAttribute('aria-hidden','true');viewfinder.appendChild(stage);}
    state.stage=stage;state.viewfinder=viewfinder;state.mounted=true;
    if(state.renderer&&state.renderer.domElement.parentElement!==stage)stage.appendChild(state.renderer.domElement);
    if(state.ready){viewfinder.classList.add('car-guide-ready');stage.classList.add('ready');}
    state.resizeObserver?.disconnect();
    if('ResizeObserver'in window){state.resizeObserver=new ResizeObserver(resize);state.resizeObserver.observe(stage);}
    requestAnimationFrame(resize);startLoop();
  }

  function sync(){
    const viewfinder=document.querySelector('.camera-screen .viewfinder');
    if(!viewfinder){state.mounted=false;if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.stage=null;state.viewfinder=null;state.resizeObserver?.disconnect();return false;}
    if(!state.mode)setMode(detectMode());attach(viewfinder);ensureRuntime();return true;
  }

  window.carGuide={sync,setMode,next,reset,get step(){return pose()?.id||null;},get ready(){return state.ready;}};

  injectStyles();
  ensureRuntime();
  if(document.querySelector('.camera-screen .viewfinder')){setMode(detectMode());sync();}
})();
