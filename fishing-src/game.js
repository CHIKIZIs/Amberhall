'use strict';
/* Тихая Гавань — 3D рыбалка. Сцена собрана из low-poly примитивов Three.js. */
THREE.ColorManagement.legacyMode=false;
const C=h=>new THREE.Color(h);
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
const hash=(a,b)=>{const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x)};
const $=id=>document.getElementById(id);

/* ───────── данные ───────── */
const FISH=[
 {id:'sprat',   n:'Килька',       v:6,  d:.20,wt:40,min:.05,max:.15,vs:2.4,m:{len:.5,h:.12,w:.07,top:'#4f7891',belly:'#e2ebef',fin:'#9fb6c2'}},
 {id:'roach',   n:'Плотва',       v:11, d:.30,wt:32,min:.2, max:.7, vs:1.9,m:{len:.7,h:.26,w:.1,top:'#4d6b5e',belly:'#e8e2cf',fin:'#d0503a',hump:1}},
 {id:'perch',   n:'Окунь',        v:18, d:.38,wt:24,min:.3, max:1.2,vs:1.8,m:{len:.8,h:.3,w:.13,top:'#5a7a2c',belly:'#ecdc9c',fin:'#e3672c',pat:'stripes',sf:22,stripe:'#24321a',spiky:1,hump:1}},
 {id:'boot',    n:'Старый сапог', v:1,  d:.10,wt:6, min:.4, max:.9, vs:1.7,junk:1,m:{kind:'boot'}},
 {id:'flounder',n:'Камбала',      v:28, d:.48,wt:15,min:.5, max:2.5,vs:1.6,m:{len:.9,h:.12,w:.6,top:'#8a7252',belly:'#efe8dc',fin:'#9b8462',pat:'spots',stripe:'#4a3a26',tail:'round',dorsal:.3,eyesTop:1}},
 {id:'mackerel',n:'Скумбрия',     v:38, d:.58,wt:10,min:.4, max:1.8,vs:1.6,m:{len:.95,h:.2,w:.14,top:'#2e6f8c',belly:'#dfe7ea',fin:'#6c8fa0',pat:'wavy',stripe:'#14303f'}},
 {id:'crab',    n:'Краб',         v:48, d:.62,wt:8, min:.3, max:1.5,vs:1.9,m:{kind:'crab'}},
 {id:'squid',   n:'Кальмар',      v:70, d:.72,wt:5, min:.5, max:3,  vs:1.7,m:{kind:'squid'}},
 {id:'puffer',  n:'Фугу',         v:110,d:.80,wt:3, min:.4, max:2,  vs:1.9,m:{len:.6,h:.48,w:.46,top:'#c9b468',belly:'#f4efdc',fin:'#d8c27a',pat:'spots',stripe:'#5a4a20',tail:'round',spikes:1,dorsal:.25}},
 {id:'tuna',    n:'Тунец',        v:160,d:.88,wt:2, min:8,  max:40, vs:1.15,m:{len:2.1,h:.55,w:.42,top:'#1d3252',belly:'#cfd8df',fin:'#f2c94c',tail:'crescent',dorsal:.5,tailL:.22}},
 {id:'shark',   n:'Акула',        v:260,d:.95,wt:1, min:30, max:120,vs:.95,m:{len:3,h:.62,w:.55,top:'#6c7b88',belly:'#eef1f3',fin:'#61707c',tail:'crescent',dorsal:1.4,tailL:.25,tailH:1.4}},
 {id:'gold',    n:'Золотая рыбка',v:400,d:1,  wt:.5,min:.2, max:.6, vs:2.2,gold:1,m:{len:.55,h:.3,w:.14,top:'#ff8a12',belly:'#ffd36a',fin:'#ffb23a',tail:'fancy',glow:'#ff6a00',hump:1,tailL:.35}}
];
const UPS=[
 {k:'rod', n:'Удочка', e:'🎣',d:'Шире зелёная зона при вываживании'},
 {k:'bait',n:'Наживка',e:'🪱',d:'Быстрее клюёт, чаще редкая рыба'},
 {k:'line',n:'Леска',  e:'🧵',d:'Рыба срывается медленнее, дольше окно подсечки'}
];
const COST=[60,150,350,800,1800],MAXLV=5;

/* ───────── сохранение ───────── */
const KEY='quietHarbor.v1';
let save={coins:0,up:{rod:0,bait:0,line:0},dex:{},mute:false};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s)save=Object.assign(save,s)}catch(e){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}};

/* ───────── рендер ───────── */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.id='c';document.body.prepend(renderer.domElement);

const scene=new THREE.Scene();scene.background=C('#113a44');
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
const CAM_T=new THREE.Vector3(-2.2,0,-1.2),CAM_D=new THREE.Vector3(1,1.08,1).normalize();
camera.position.copy(CAM_T).addScaledVector(CAM_D,90);camera.lookAt(CAM_T);
function resize(){
  const w=innerWidth,h=innerHeight,asp=w/h;renderer.setSize(w,h);
  let vh=20.5;if(asp<1.7)vh=20.5*1.7/asp;
  camera.left=-vh*asp/2;camera.right=vh*asp/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();

scene.add(new THREE.HemisphereLight('#ffd9b8','#1f5a5c',.55));
const sun=new THREE.DirectionalLight('#ffc890',1.35);
sun.position.set(-16,26,12);sun.target.position.set(-2,0,0);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:90});
sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;
scene.add(sun,sun.target);

/* ───────── хелперы ───────── */
const mats={};
function M(color,o){const k=color+(o?JSON.stringify(o):'');return mats[k]||(mats[k]=new THREE.MeshStandardMaterial(Object.assign({color,flatShading:true,roughness:.85},o||{})))}
function add(geo,mat,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function lineObj(pts,color='#3a2a1c'){const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));return new THREE.Line(g,new THREE.LineBasicMaterial({color}))}
function sag(a,b,s,n=12){const r=[];for(let i=0;i<=n;i++){const t=i/n;r.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)-s*4*t*(1-t),lerp(a[2],b[2],t)])}return r}

const haloTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba(255,214,150,1)');r.addColorStop(.22,'rgba(255,150,60,.55)');r.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const halos=[];
function halo(x,y,z,s){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.85}));sp.position.set(x,y,z);sp.scale.set(s,s,1);scene.add(sp);halos.push(sp);return sp}

/* ───────── вода ───────── */
const WH=(x,z,t)=>.11*Math.sin(x*.42+t*1.1)+.08*Math.sin(z*.55-t*.85)+.05*Math.sin((x+z)*.9+t*1.7);
let wg=new THREE.PlaneGeometry(150,150,75,75);wg.rotateX(-Math.PI/2);wg.translate(4,0,0);wg=wg.toNonIndexed();
const wPos=wg.attributes.position,wBase=Float32Array.from(wPos.array);
{const col=new Float32Array(wPos.count*3),a=C('#1b5a68'),b=C('#3a8a94'),c=new THREE.Color();
 for(let i=0;i<wPos.count;i+=3){c.copy(a).lerp(b,hash(i*.0131,i*.0077));for(let k=0;k<3;k++)c.toArray(col,(i+k)*3)}
 wg.setAttribute('color',new THREE.BufferAttribute(col,3))}
const water=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.16,metalness:.2,transparent:true,opacity:.74}));
water.receiveShadow=true;scene.add(water);
function animWater(t){const a=wPos.array;for(let i=0;i<a.length;i+=3)a[i+1]=WH(wBase[i],wBase[i+2],t);wPos.needsUpdate=true}
const bed=add(new THREE.PlaneGeometry(150,150),M('#0d3442',{flatShading:false}),4,-2.4,0);bed.rotation.x=-Math.PI/2;bed.castShadow=false;
for(let i=0;i<90;i++){const r=add(new THREE.DodecahedronGeometry(rnd(.3,1.4),0),M(i%2?'#1b4d50':'#163f44'),rnd(-4,62),-2.3,rnd(-45,62));r.rotation.set(rnd(0,3),rnd(0,3),0);r.castShadow=false}

function buoyGeoF(r=.42,t=.13){let g=new THREE.TorusGeometry(r,t,6,16).toNonIndexed();const p=g.attributes.position,col=new Float32Array(p.count*3),red=C('#d63c2c'),wh=C('#f3ece0');
  for(let i=0;i<p.count;i+=3){const cx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,cy=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;const a=Math.atan2(cy,cx)+Math.PI/4;const c=(Math.floor((a+Math.PI)/(Math.PI/2))%2)?red:wh;for(let k=0;k<3;k++)c.toArray(col,(i+k)*3)}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g}
var BUOY=buoyGeoF(),buoyMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.6});
/* ───────── пирс ───────── */
const DY=1.6,UY=4.2;
const planks=[];
function panel(x0,z0,sx,sz,alongX,y){
  if(alongX){const n=Math.round(sz/.5);for(let i=0;i<n;i++)planks.push([x0+sx/2,y,z0+.25+i*.5,sx-.05,.45])}
  else{const n=Math.round(sx/.5);for(let i=0;i<n;i++)planks.push([x0+.25+i*.5,y,z0+sz/2,.45,sz-.05])}
}
for(let i=0;i<4;i++)for(let j=0;j<6;j++)panel(-14+i*3,-10+j*3,3,3,(i+j)%2===0,DY);
panel(-14,-10,6.5,3.5,false,UY);panel(-14,-6.5,6.5,3.5,true,UY);
// мостик-переход
for(let i=0;i<64;i++){const z=-10.35-i*.5,t=i/63;planks.push([-4.4,DY-.05-Math.sin(t*Math.PI)*.45,z,2.3,.42])}
{
  const pm=new THREE.InstancedMesh(B(1,.16,1),new THREE.MeshStandardMaterial({flatShading:true,roughness:.9}),planks.length);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),s3=new THREE.Vector3(),base=C('#e2a66a'),c=new THREE.Color();
  planks.forEach((p,i)=>{
    q.setFromEuler(new THREE.Euler((hash(i,5)-.5)*.02,0,(hash(i,6)-.5)*.02));
    m4.compose(v.set(p[0],p[1]-.08,p[2]),q,s3.set(p[3],1,p[4]));pm.setMatrixAt(i,m4);
    c.copy(base).offsetHSL((hash(i,1)-.5)*.025,(hash(i,2)-.5)*.12,(hash(i,3)-.5)*.09);pm.setColorAt(i,c);
  });
  pm.castShadow=pm.receiveShadow=true;scene.add(pm);
}
const WOOD='#9a5a30',WOODD='#6e3d1e',WET='#2f2620';
// балки-обвязка
add(B(.3,.36,18.3),M(WOOD),-2.1,DY-.3,-1);
add(B(12.3,.36,.3),M(WOOD),-8,DY-.3,8.1);
add(B(.3,.3,7.2),M(WOOD),-7.6,UY-.28,-6.5);
add(B(6.6,.3,.3),M(WOOD),-10.8,UY-.28,-3.1);
function post(x,z,top,bottom=-2.4){
  add(B(.38,top-.05,.38),M('#a5643a'),x,top/2,z);
  add(B(.4,-bottom+.12,.4),M(WET),x,bottom/2+.05,z).castShadow=false;
}
const posts=[[-2.15,-9.8],[-2.15,-6.5],[-2.15,-3.2],[-2.15,.1],[-2.15,3.4],[-2.15,6.7],[-2.15,8.1],[-5.4,8.15],[-8.7,8.15],[-12,8.15]];
posts.forEach(([x,z])=>post(x,z,DY-.12));
// мостик: сваи и верёвки
for(let i=0;i<=8;i++){const z=-10.4-i*4,s=Math.sin(i/8*Math.PI)*.45;
  for(const x of[-5.6,-3.2]){add(B(.18,1.2,.18),M(WOODD),x,DY+.35-s,z);add(B(.3,3,.3),M(WET),x,DY-1.8-s,z).castShadow=false}}
for(const x of[-5.6,-3.2]){const pts=[];for(let i=0;i<=32;i++){const t=i/32,z=-10.4-t*32;pts.push([x,DY+.9-Math.sin(t*Math.PI)*.45-Math.abs(Math.sin(t*8*Math.PI))*.12,z])}scene.add(lineObj(pts,'#4a3524'))}
// верхний ярус: стойки, перила
[[-7.65,-3.05],[-7.65,-9.9],[-11,-3.05],[-13.9,-3.05]].forEach(([x,z])=>add(B(.34,UY-DY,.34),M('#a5643a'),x,DY+(UY-DY)/2-.1,z));
for(const x of[-9,-10.4,-11.8,-13.2])add(B(.12,1,.12),M(WOODD),x,UY+.5,-3.1);
add(B(5.3,.12,.14),M(WOODD),-11.1,UY+1,-3.1);
for(const z of[-9.4,-7.8,-6.2])add(B(.12,1,.12),M(WOODD),-7.6,UY+.5,z);
add(B(.14,.12,6.1),M(WOODD),-7.6,UY+1,-6.85);
// лестница
for(let i=0;i<7;i++)add(B(.36,.1,1.4),M('#d79c62'),-5.55-i*.32,DY+.37*(i+1),-3.9);
for(const z of[-4.65,-3.15]){const s=add(B(3.1,.18,.1),M(WOOD),-6.55,DY+1.45,z);s.rotation.z=-.86}
// хижина
(function(){
  const x0=-13.6,x1=-8.4,z0=-9.6,z1=-4.4,y0=UY,hh=3.1;
  add(B(x1-x0-.1,hh,z1-z0-.1),M('#6d8b7d'),(x0+x1)/2,y0+hh/2,(z0+z1)/2);
  for(let k=0;k<10;k++){const y=y0+.16+k*.31,c=M(k%2?'#88a99a':'#7c9c8e');
    add(B(x1-x0,.3,.08),c,(x0+x1)/2,y,z1+.02);add(B(.08,.3,z1-z0),c,x1+.02,y,(z0+z1)/2)}
  add(B(.16,hh,.16),M('#5c7a6c'),x1+.05,y0+hh/2,z1+.05);
  const roof=add(B(x1-x0+1,.18,z1-z0+1.3),M('#4a5878'),(x0+x1)/2,y0+hh+.45,(z0+z1)/2+.25);roof.rotation.x=.16;
  for(let i=0;i<9;i++){const r=add(B(.07,.08,z1-z0+1.3),M('#3a4664'),x0-.4+i*.72,y0+hh+.56,(z0+z1)/2+.25);r.rotation.x=.16}
  const glass=new THREE.MeshStandardMaterial({color:'#ffb35a',emissive:'#ff9a3a',emissiveIntensity:1.6,flatShading:true});
  const frame=M('#efe6d0');
  const win=(x,z,rot)=>{const g=new THREE.Group();g.position.set(x,y0+1.8,z);g.rotation.y=rot;scene.add(g);
    add(B(1.55,1.25,.08),frame,0,0,0,g);add(B(1.35,1.05,.1),glass,0,0,.02,g).castShadow=false;
    add(B(.07,1.05,.14),frame,0,0,.04,g);add(B(1.35,.07,.14),frame,0,0,.04,g);
    halo(x+Math.sin(rot)*.5,y0+1.8,z+Math.cos(rot)*.5,3.6)};
  win(-11.7,z1+.06,0);win(x1+.06,-6.5,Math.PI/2);
  const L=new THREE.PointLight('#ff9a48',2.4,9,1.4);L.position.set(-11.2,y0+1.8,z1+1.4);scene.add(L);
  const b=add(BUOY,buoyMat,x1+.14,y0+1.3,-8.6);b.rotation.y=Math.PI/2;
  // дверь
  add(B(.08,2.1,1),M('#5a4030'),x1+.08,y0+1.05,-4.95);
})();

/* ───────── предметы ───────── */
const TIRE=new THREE.TorusGeometry(.36,.15,6,12);
function tire(x,y,z,ry=Math.PI/2){const t=add(TIRE,M('#232022'),x,y,z);t.rotation.y=ry;return t}
const barrelGeo=(()=>{const pts=[new THREE.Vector2(0,-.5)];for(let i=0;i<=6;i++){const t=i/6;pts.push(new THREE.Vector2(.36+.07*Math.sin(t*Math.PI),t-.5))}pts.push(new THREE.Vector2(0,.5));return new THREE.LatheGeometry(pts,11)})();
function barrel(x,y,z,s=1){const g=new THREE.Group();g.position.set(x,y+.5*s,z);g.scale.setScalar(s);add(barrelGeo,M('#7a4222'),0,0,0,g);
  const hoop=new THREE.TorusGeometry(.415,.03,4,14);for(const yy of[-.3,.3]){const m=add(hoop,M('#2b1a10'),0,yy,0,g);m.rotation.x=Math.PI/2}
  scene.add(g);return g}
function crate(x,y,z,s=.75,ry=0){const g=new THREE.Group();g.position.set(x,y+s/2,z);g.rotation.y=ry;add(B(s,s,s),M('#c98a50'),0,0,0,g);
  for(const yy of[-s*.33,s*.33])add(B(s+.04,s*.12,s+.04),M('#9c5f30'),0,yy,0,g);scene.add(g);return g}
const lanternMat=new THREE.MeshStandardMaterial({color:'#ffb060',emissive:'#ff8a2a',emissiveIntensity:2.4,flatShading:true});
function lantern(x,y,z,light){const g=new THREE.Group();g.position.set(x,y,z);
  add(B(.2,.28,.2),lanternMat,0,0,0,g).castShadow=false;add(B(.27,.06,.27),M('#3a2414'),0,.17,0,g);add(B(.25,.05,.25),M('#3a2414'),0,-.16,0,g);
  scene.add(g);halo(x,y,z,1.9);
  if(light){const L=new THREE.PointLight('#ff9a48',2,7,1.5);L.position.set(x,y,z);scene.add(L)}return g}
function lampPost(x,z,y0,light){add(B(.2,1.3,.2),M('#8e5230'),x,y0+.65,z);lantern(x+.22,y0+1.05,z,light)}
lampPost(-2.15,-9.8,DY,false);lampPost(-2.15,-3.2,DY,true);lampPost(-2.15,3.4,DY,true);lampPost(-2.15,8.1,DY,false);lampPost(-8.7,8.15,DY,false);
lampPost(-3.2,-10.4,DY+.35,false);lampPost(-7.65,-3.05,UY,true);
lantern(-8.4+.2,DY+1.4,-1.6,false);
// на помосте
barrel(-9.2,DY,-1.2);barrel(-8.9,DY,-2.2,.95);barrel(-10.1,DY,-1.8,1.05);barrel(-6.4,DY,-8.8);barrel(-5.5,DY,-9.3,.9);barrel(-12.6,DY,1.2);
crate(-4,DY,1.2);crate(-4.8,DY,1.6,.7,.3);crate(-4.3,DY+.75,1.35,.6,.1);crate(-3.3,DY,-6.2,.7,.2);crate(-3.6,DY,-7.2,.65);crate(-6.3,DY,4.4,.7,.5);
{const b=add(new THREE.CylinderGeometry(.22,.17,.36,9),M('#b7a6d6'),-6.9,DY+.18,-.4);
 const r=add(new THREE.CylinderGeometry(.22,.17,.36,9),M('#d0473a'),-9.4,DY+.18,2.6);
 add(B(.32,.46,.2),M('#3d8a3a'),-5.8,DY+.23,5.6);add(B(.06,.1,.12),M('#2a5f28'),-5.8,DY+.5,5.6)}
tire(-2.38,DY-.55,-4.8);tire(-2.38,DY-.55,1.8);tire(-2.38,DY-.55,5.2);
{const t=add(TIRE,M('#232022'),-7.8,DY+.15,2.2);t.rotation.x=Math.PI/2}
{const b=add(BUOY,buoyMat,-12.2,DY+.5,7.9);b.rotation.set(-.2,0,0)}

/* ───────── корпус лодки ───────── */
function hullGeo(L,W,cols,sheer=1){
  const N=16,rows=[];
  for(let i=0;i<=N;i++){const t=i/N,z=-L/2+t*L;
    const w=t<.6?W*(.9+.1*t/.6):W*Math.sqrt(Math.max(0,1-Math.pow((t-.6)/.4,2)));
    const sh=sheer*(1+.45*t*t);
    const prof=[[-w,sh],[-w*.99,sh-.22*sheer],[-w*.95,.1],[-w*.72,-.36*sheer],[0,-.6*sheer]];
    const pts=prof.concat(prof.slice(0,4).reverse().map(([x,y])=>[-x,y]));
    rows.push(pts.map(([x,y])=>[x,y,z]))}
  const pos=[],col=[],cc=cols.map(C);
  const push=(p,c)=>{pos.push(...p);col.push(c.r,c.g,c.b)};
  for(let i=0;i<N;i++)for(let k=0;k<8;k++){const c=cc[k<4?k:7-k],a=rows[i][k],b=rows[i][k+1],d=rows[i+1][k+1],e=rows[i+1][k];
    push(a,c);push(b,c);push(d,c);push(a,c);push(d,c);push(e,c)}
  const r0=rows[0];for(let k=0;k<8;k++){push([0,.3,r0[0][2]],cc[1]);push(r0[k],cc[1]);push(r0[k+1],cc[1])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();return g}
const hullMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.55,side:THREE.DoubleSide});

/* ───────── лодка ───────── */
const boat=new THREE.Group();boat.position.set(1,0,-.3);scene.add(boat);
(function(){
  const h=add(hullGeo(9,1.6,['#f0e2c0','#2f7cbf','#2a64a0','#1a2d44']),hullMat,0,0,0,boat);
  const sh=new THREE.Shape();for(let i=0;i<=16;i++){const t=i/16,w=(t<.6?1.6*(.9+.1*t/.6):1.6*Math.sqrt(Math.max(0,1-Math.pow((t-.6)/.4,2))))*.93;sh[i?'lineTo':'moveTo'](-w,-(-4.5+t*9))}
  for(let i=16;i>=0;i--){const t=i/16,w=(t<.6?1.6*(.9+.1*t/.6):1.6*Math.sqrt(Math.max(0,1-Math.pow((t-.6)/.4,2))))*.93;sh.lineTo(w,-(-4.5+t*9))}
  const dg=new THREE.ShapeGeometry(sh);dg.rotateX(-Math.PI/2);add(dg,M('#4f6457'),0,.55,0,boat);
  // планширь
  for(const s of[-1,1])add(B(.12,.1,6.6),M('#e9d6ae'),s*1.53,1.06,-1.2,boat);
  // кабина
  add(B(2.3,1.7,2.1),M('#c87a80'),0,1.4,-1.1,boat);
  add(B(2.6,.16,2.5),M('#6b3a48'),0,2.33,-1.1,boat);
  const oct=add(new THREE.CylinderGeometry(.36,.36,.1,8),M('#2a2030',{roughness:.2}),1.16,1.5,-1.1,boat);oct.rotation.z=Math.PI/2;
  const rim=add(new THREE.TorusGeometry(.38,.05,4,8),M('#efe2c4'),1.18,1.5,-1.1,boat);rim.rotation.y=Math.PI/2;
  add(B(1.7,.6,.08),M('#2a2030',{roughness:.2}),0,1.65,.0,boat);
  for(const x of[-.5,.4])add(new THREE.CylinderGeometry(.03,.03,.9,4),M('#2a2a2a'),x,2.8,-1.6,boat);
  // барабан, ящики
  const dr=add(new THREE.CylinderGeometry(.55,.55,1.1,12),M('#e0877d'),0,1.15,1.5,boat);dr.rotation.z=Math.PI/2;
  for(const s of[-1,1]){const r=add(new THREE.CylinderGeometry(.6,.6,.08,12),M('#b85c58'),s*.55,1.15,1.5,boat);r.rotation.z=Math.PI/2}
  const c1=new THREE.Group();c1.position.set(-.6,.95,-3.2);boat.add(c1);add(B(.7,.7,.7),M('#c98a50'),0,0,0,c1);
  const c2=new THREE.Group();c2.position.set(.5,.85,-3.5);boat.add(c2);add(B(.6,.5,.6),M('#5e6b3a'),0,0,0,c2);
  // А-рама и снасти
  for(const s of[-1,1]){const p=add(new THREE.CylinderGeometry(.06,.06,3.4,5),M('#3a2a20'),s*.55,2.1,-3.1,boat);p.rotation.z=-s*.16;p.rotation.x=.3}
  const top=[0,3.7,-2.6];
  boat.add(lineObj([top,[0,1.3,4.6]],'#2b2420'),lineObj([top,[1.5,1.1,2.4]],'#2b2420'),lineObj([top,[-1.5,1.1,2.4]],'#2b2420'),lineObj([top,[0,1.2,-4.5]],'#2b2420'));
  // спасательные круги на борту
  const b1=add(BUOY,buoyMat,1.62,.75,.6,boat);b1.rotation.y=Math.PI/2;
  const b2=add(BUOY,buoyMat,1.5,.85,2.7,boat);b2.rotation.y=Math.PI/2+.25;b2.scale.setScalar(.85);
  const b3=add(BUOY,buoyMat,-1.62,.75,1.4,boat);b3.rotation.y=Math.PI/2;
  tire(-1.62,.6,-2.6);
})();
// фонарь кабины как часть лодки
const boatLamp=new THREE.Mesh(B(.2,.28,.2),lanternMat);boatLamp.position.set(1.2,1.95,-.1);boat.add(boatLamp);
const boatHalo=halo(0,0,0,1.8);const boatLight=new THREE.PointLight('#ff9a48',1.8,7,1.5);scene.add(boatLight);
// швартовы
const moor=[lineObj(sag([-.6,1.1,-4.4],[-2.15,DY-.2,-6.5],.4),'#d8c9a0'),lineObj(sag([-.6,1.4,3.6],[-2.15,DY-.2,3.4],.3),'#d8c9a0')];scene.add(...moor);
// перевёрнутая лодочка у края помоста
{const rb=add(hullGeo(3.4,.7,['#e9e1d0','#d9cfbd','#c9bca6','#8c5b3a'],.45),hullMat,-12.3,DY+.9,4.6);rb.rotation.set(0,.15,-1.25)}

/* ───────── чайки ───────── */
function gull(){const g=new THREE.Group(),wm=M('#eef0ef'),gm=M('#9aa3a6');
  const b=add(new THREE.SphereGeometry(.22,7,5),wm,0,0,0,g);b.scale.set(1.5,.85,.85);
  add(new THREE.SphereGeometry(.13,6,4),wm,.3,.16,0,g);
  const bk=add(new THREE.ConeGeometry(.04,.15,4),M('#f0a030'),.46,.15,0,g);bk.rotation.z=-Math.PI/2;
  add(B(.22,.04,.16),gm,-.36,.03,0,g);
  const wl=new THREE.Group(),wr=new THREE.Group();wl.position.set(-.02,.1,.1);wr.position.set(-.02,.1,-.1);
  add(B(.34,.03,.55),gm,0,0,.27,wl);add(B(.34,.03,.55),gm,0,0,-.27,wr);g.add(wl,wr);g.userData.w=[wl,wr];
  scene.add(g);return g}
const gulls=[];
{const g1=gull();g1.position.set(-2.15,DY+.25,6.7);g1.rotation.y=.6;g1.userData.w[0].rotation.x=-1.25;g1.userData.w[1].rotation.x=1.25;
 const g2=gull();boat.add(g2);g2.position.set(.2,2.6,-1);g2.rotation.y=2.4;g2.userData.w[0].rotation.x=-1.25;g2.userData.w[1].rotation.x=1.25;
 const g3=gull();g3.userData.float=1;g3.position.set(9,0,-7);g3.userData.w[0].rotation.x=-1.25;g3.userData.w[1].rotation.x=1.25;gulls.push(g3);
 const g4=gull();g4.userData.fly=1;g4.scale.setScalar(1.1);gulls.push(g4)}

/* ───────── модели рыб ───────── */
const finMats={};
const finMat=c=>finMats[c]||(finMats[c]=new THREE.MeshStandardMaterial({color:c,flatShading:true,side:THREE.DoubleSide,roughness:.6,transparent:true,opacity:.92}));
function tri(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);return new THREE.ShapeGeometry(s)}
const EYE=new THREE.SphereGeometry(1,6,4),EYEM=new THREE.MeshStandardMaterial({color:'#0d0d10',roughness:.15});
function bodyGeo(m){
  const g=new THREE.SphereGeometry(1,14,9).toNonIndexed(),p=g.attributes.position,L=m.len/2,H=m.h/2,Wd=m.w/2;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),tp=x<0?1+x*.62:1-x*x*.18;
    p.setXYZ(i,x*L,(y*H+(m.hump?Math.max(0,y)*H*.25*(1-Math.abs(x)):0))*tp,z*Wd*tp)}
  const col=new Float32Array(p.count*3),top=C(m.top),bel=C(m.belly),dark=C(m.stripe||'#1d2a22'),c=new THREE.Color();
  for(let i=0;i<p.count;i+=3){const cx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3/L,cy=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3/H;
    let f=clamp((cy+.25)/.9,0,1);f=f*f*(3-2*f);c.copy(bel).lerp(top,f);
    if(m.pat==='stripes'&&cy>-.35&&Math.sin(cx*m.sf)>.5)c.lerp(dark,.55);
    if(m.pat==='wavy'&&cy>.05&&Math.sin(cx*14+cy*9)>.3)c.lerp(dark,.6);
    if(m.pat==='spots'&&cy>-.1&&hash(i,7)>.8)c.lerp(dark,.5);
    c.offsetHSL(0,0,(hash(i,3)-.5)*.05);for(let k=0;k<3;k++)c.toArray(col,(i+k)*3)}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();return g}
function makeFish(f){
  const m=f.m,g=new THREE.Group();g.userData.f=f;
  if(m.kind==='boot'){const mt=M('#5d3b22'),dk=M('#2a1a10');add(B(.26,.55,.3),mt,-.12,.28,0,g);add(B(.55,.2,.3),mt,.03,.1,0,g);add(B(.6,.06,.32),dk,.04,0,0,g);add(B(.3,.06,.32),dk,-.12,.56,0,g);
    for(let i=0;i<3;i++)add(B(.02,.02,.32),M('#d9c9a0'),0,.3+i*.08,0,g).position.x=.02;g.userData.tail=new THREE.Group();return g}
  if(m.kind==='crab'){const red=M('#d4532d'),dk=M('#9a3018');
    const b=add(new THREE.SphereGeometry(.3,8,5),red,0,0,0,g);b.scale.set(1,.45,1.35);
    const legs=new THREE.Group();g.add(legs);
    for(const s of[1,-1])for(let i=0;i<4;i++){const l=add(new THREE.CylinderGeometry(.03,.02,.42,4),dk,-.2+i*.11,-.04,s*.42,legs);l.rotation.x=s*1.15;l.rotation.z=(i-1.5)*.25}
    for(const s of[1,-1]){add(B(.22,.07,.07),red,.33,.0,s*.2,g);const cl=add(B(.17,.12,.13),red,.48,.02,s*.22,g);cl.rotation.y=-s*.3;
      add(new THREE.CylinderGeometry(.015,.015,.12,4),dk,.24,.15,s*.07,g);add(EYE,EYEM,.24,.22,s*.07,g).scale.setScalar(.03)}
    g.userData.tail=legs;return g}
  if(m.kind==='squid'){const pk=new THREE.MeshStandardMaterial({color:'#e9a597',flatShading:true,roughness:.45});
    const mt=add(new THREE.ConeGeometry(.17,.85,8),pk,.2,0,0,g);mt.rotation.z=-Math.PI/2;
    for(const s of[1,-1]){const fn=new THREE.Mesh(tri([[0,0],[.22,.0],[.05,.2]]),finMat('#e08a7c'));fn.position.set(.42,0,s*.06);fn.rotation.x=s*Math.PI/2;g.add(fn)}
    add(new THREE.SphereGeometry(.15,7,5),pk,-.27,0,0,g);
    for(const s of[1,-1])add(EYE,EYEM,-.27,.04,s*.13,g).scale.setScalar(.04);
    const tn=new THREE.Group();tn.position.x=-.38;g.add(tn);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,t=add(new THREE.CylinderGeometry(.025,.008,.5,4),pk,-.24,Math.sin(a)*.06,Math.cos(a)*.06,tn);t.rotation.z=Math.PI/2+Math.sin(a)*.25;t.rotation.x=Math.cos(a)*.25}
    g.userData.tail=tn;return g}
  const bm=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.4,metalness:.15,emissive:m.glow||'#000000',emissiveIntensity:m.glow?.45:0});
  const body=new THREE.Mesh(bodyGeo(m),bm);body.castShadow=true;g.add(body);
  const L=m.len/2,H=m.h/2,Wd=m.w/2,fm=finMat(m.fin);
  const tail=new THREE.Group();tail.position.x=-L*.93;g.add(tail);
  const a=m.len*(m.tailL||.28),b=H*(m.tailH||1.1);let tg;
  if(m.tail==='crescent')tg=tri([[0,0],[-a*.55,b*1.25],[-a*.8,b*1.3],[-a*.35,0],[-a*.8,-b*1.1],[-a*.55,-b*1.05]]);
  else if(m.tail==='round')tg=tri([[0,0],[-a*.7,b*.8],[-a,b*.4],[-a*1.05,0],[-a,-b*.4],[-a*.7,-b*.8]]);
  else if(m.tail==='fancy')tg=tri([[0,0],[-a*.8,b*1.5],[-a*1.5,b*1.3],[-a*1.05,0],[-a*1.5,-b*1.3],[-a*.8,-b*1.5]]);
  else tg=tri([[0,0],[-a,b],[-a*.7,0],[-a,-b]]);
  const tm=new THREE.Mesh(tg,fm);if(m.eyesTop)tm.rotation.x=Math.PI/2;tail.add(tm);
  const dh=H*(m.dorsal||.7);
  if(m.spiky){const pts=[[-L*.45,H*.8]];for(let i=0;i<5;i++){const x=-L*.45+i*L*.16;pts.push([x+L*.07,H*.85+dh],[x+L*.16,H*.9])}pts.push([L*.3,H*.85]);g.add(new THREE.Mesh(tri(pts),fm))}
  else if(m.eyesTop){for(const s of[1,-1]){const d=new THREE.Mesh(tri([[-L*.85,0],[L*.75,0],[L*.3,Wd*.35],[-L*.6,Wd*.3]]),fm);d.rotation.x=-s*Math.PI/2;d.position.z=s*Wd*.85;g.add(d)}}
  else g.add(new THREE.Mesh(tri([[-L*.4,H*.85],[L*.15,H*.9],[-L*.25,H*.9+dh]]),fm));
  if(!m.eyesTop)g.add(new THREE.Mesh(tri([[-L*.5,-H*.8],[-L*.15,-H*.85],[-L*.42,-H*.85-dh*.45]]),fm));
  for(const s of[1,-1]){
    if(!m.eyesTop){const pf=new THREE.Mesh(tri([[0,0],[-L*.35,H*.25],[-L*.3,-H*.2]]),fm);pf.position.set(L*.38,-H*.25,s*Wd*.75);pf.rotation.y=s*.5;g.add(pf)}
    const e=add(EYE,EYEM,m.eyesTop?L*.55:L*.66,m.eyesTop?H*.85:H*.2,m.eyesTop?s*Wd*.22:s*Wd*.64,g);e.scale.setScalar(Math.max(.028,(m.eyesTop?Wd*.08:H*.15)))}
  if(m.spikes){const cg=new THREE.ConeGeometry(.025,.11,4),up=new THREE.Vector3(0,1,0);
    for(let i=0;i<34;i++){const y=1-2*(i+.5)/34,r=Math.sqrt(1-y*y),th=i*2.39996,n=new THREE.Vector3(Math.cos(th)*r,y,Math.sin(th)*r);
      if(n.x<-.75)continue;const sp=add(cg,fm,n.x*L*.95,n.y*H*.95,n.z*Wd*.95,g);sp.quaternion.setFromUnitVectors(up,n)}}
  g.userData.tail=tail;return g}

/* миниатюры рыб для интерфейса */
const thumbs={};
(function(){
  const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setSize(240,160);tr.setPixelRatio(1);
  tr.outputEncoding=THREE.sRGBEncoding;tr.toneMapping=THREE.ACESFilmicToneMapping;tr.toneMappingExposure=1.2;
  const ts=new THREE.Scene();ts.add(new THREE.HemisphereLight('#ffffff','#556677',1.1));const dl=new THREE.DirectionalLight('#fff3e0',1.3);dl.position.set(2,4,5);ts.add(dl);
  const cam=new THREE.PerspectiveCamera(30,1.5,.05,100);
  for(const f of FISH){const m=makeFish(f);m.rotation.set(.2,-.5,0);if(f.m.eyesTop)m.rotation.x=.75;if(f.m.kind==='crab')m.rotation.set(.6,-.9,0);ts.add(m);
    const box=new THREE.Box3().setFromObject(m),c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());
    const d=Math.max(Math.max(s.x,s.z)/2/.39,s.y/2/.26)*1.2+Math.max(s.x,s.z)/2;
    cam.position.set(c.x,c.y+d*.18,c.z+d);cam.lookAt(c);tr.render(ts,cam);thumbs[f.id]=tr.domElement.toDataURL();ts.remove(m)}
  tr.dispose();
})();

/* ───────── рыбак ───────── */
const PIER_POS=new THREE.Vector3(-2.75,DY,6.4),FIS=PIER_POS.clone();
const fisher=new THREE.Group();fisher.position.copy(PIER_POS);scene.add(fisher);
const rodPivot=new THREE.Group(),tipObj=new THREE.Object3D();
(function(){
  const g=fisher,yel=M('#e8a52c'),yelD=M('#c98a1e');
  for(const s of[1,-1]){add(B(.22,.8,.22),M('#2b3a55'),0,.42,s*.14,g);add(B(.32,.16,.26),M('#1b1a1a'),.05,.08,s*.14,g)}
  add(B(.46,.85,.6),yel,0,1.22,0,g);add(B(.48,.12,.62),yelD,0,.86,0,g);
  add(new THREE.SphereGeometry(.23,8,6),M('#e8b48c'),.02,1.86,0,g);
  add(new THREE.CylinderGeometry(.25,.28,.16,8),M('#b8392c'),0,2.02,0,g);add(new THREE.SphereGeometry(.22,8,4,0,Math.PI*2,0,Math.PI/2),M('#b8392c'),0,2.08,0,g);
  add(new THREE.SphereGeometry(.06,5,4),M('#efe6d0'),0,2.34,0,g);
  for(const s of[1,-1]){const a=add(B(.5,.16,.16),yel,.25,1.35,s*.24,g);a.rotation.z=-.5}
  rodPivot.position.set(.5,1.15,0);g.add(rodPivot);
  const rod=add(new THREE.CylinderGeometry(.02,.05,3.4,5),M('#3e2412'),0,1.5,0,rodPivot);
  add(new THREE.CylinderGeometry(.06,.06,.4,6),M('#1d1d1d'),0,-.05,0,rodPivot);
  add(new THREE.CylinderGeometry(.09,.09,.08,8),M('#888'),.08,.25,0,rodPivot).rotation.z=Math.PI/2;
  tipObj.position.set(0,3.2,0);rodPivot.add(tipObj);
})();
const tipPos=new THREE.Vector3();

/* поплавок и леска */
const bobber=new THREE.Group();
add(new THREE.SphereGeometry(.16,8,6,0,Math.PI*2,0,Math.PI/2),M('#d8402f',{roughness:.4}),0,0,0,bobber);
add(new THREE.SphereGeometry(.16,8,6,0,Math.PI*2,Math.PI/2,Math.PI/2),M('#f4efe6',{roughness:.4}),0,0,0,bobber);
add(new THREE.CylinderGeometry(.015,.015,.3,4),M('#2a2a2a'),0,.25,0,bobber);
bobber.visible=false;scene.add(bobber);
const LN=26,lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array((LN+1)*3),3));
const fLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:'#f6f1e2',transparent:true,opacity:.9}));fLine.frustumCulled=false;scene.add(fLine);
const aimRing=new THREE.Mesh(new THREE.RingGeometry(.55,.72,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffe2a6',transparent:true,opacity:.85,depthWrite:false}));aimRing.visible=false;scene.add(aimRing);

/* ───────── эффекты ───────── */
const ripG=new THREE.RingGeometry(.9,1,28).rotateX(-Math.PI/2),ripples=[];
function ripple(x,z,s=1){const m=new THREE.Mesh(ripG,new THREE.MeshBasicMaterial({color:'#e8fbf6',transparent:true,opacity:.7,depthWrite:false}));m.position.set(x,.14,z);m.scale.setScalar(.1);scene.add(m);ripples.push({m,t:0,s})}
const dropG=new THREE.IcosahedronGeometry(.06,0),dropM=new THREE.MeshBasicMaterial({color:'#eafcf8'}),drops=[];
function splash(x,z,n=10,pw=1){for(let i=0;i<n;i++){const m=new THREE.Mesh(dropG,dropM);m.position.set(x,.1,z);scene.add(m);drops.push({m,v:new THREE.Vector3(rnd(-1.5,1.5)*pw,rnd(2.5,5)*pw,rnd(-1.5,1.5)*pw),t:0})}}

/* окружающие рыбы */
const ambient=[];
for(let i=0;i<8;i++){const f=FISH[[0,1,2,5,0,1,4,2][i]],m=makeFish(f);m.scale.setScalar(f.vs*.9);m.position.set(rnd(2,20),-rnd(.45,1.2),rnd(-8,16));m.userData.h=rnd(0,6.28);m.userData.sp=rnd(.6,1.3);scene.add(m);ambient.push(m)}

/* ───────── звук ───────── */
let ac=null;
function audio(){if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ac&&ac.state==='suspended')ac.resume()}
function tone(f,d=.12,type='sine',vol=.07,slide=0,delay=0){
  if(save.mute||!ac)return;const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d+.02)}
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const sfx={cast(){tone(420,.25,'triangle',.06,-250)},splash(){tone(200,.18,'sawtooth',.04,-120);tone(900,.08,'sine',.03,-400,.02)},
  bite(){tone(880,.1,'square',.05);tone(1180,.14,'square',.05,0,.1)},win(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.07,0,i*.08))},
  lose(){tone(300,.35,'sine',.07,-200)},buy(){tone(660,.1,'triangle',.06);tone(990,.15,'triangle',.06,0,.08)}};

/* ───────── игровая логика ───────── */
let st='idle',T=0,power=0,pdir=1,holding=false,sfxTick=0;
let rodA=1.0,aimDir=new THREE.Vector3(1,0,.35).normalize(),target=new THREE.Vector3(),castFrom=new THREE.Vector3();
let flyT=0,waitT=0,waitE=0,biteT=0,biteWin=1.1,cur=null,curW=0,fishM=null,fishFrom=new THREE.Vector3(),reel=null,jumpT=0,flashT=0,flashTxt='';
const bobPos=new THREE.Vector3();
function pickFish(pw,fz=0){const rb=1+save.up.bait*.35+pw*.9+fz*2.6;let tot=0;const ws=FISH.map(f=>{const x=f.wt*(f.v>=70?rb:1);tot+=x;return x});
  let r=Math.random()*tot;for(let i=0;i<FISH.length;i++)if((r-=ws[i])<=0)return FISH[i];return FISH[0]}
function castTarget(p){const d=3.5+p*14;const t=FIS.clone().addScaledVector(aimDir,d);t.y=0;
  if(!onBoat){if(t.x>-.9&&t.x<3.4&&t.z>-5.3&&t.z<4.8)t.z=4.9;t.x=Math.max(t.x,-.6)}
  else{const dx=t.x-boat.position.x,dz=t.z-boat.position.z,l=Math.hypot(dx,dz);if(l<3.2){t.x=boat.position.x+dx/(l||1)*3.2;t.z=boat.position.z+dz/(l||1)*3.2}
    if(t.x<-1&&t.z<9)t.x=-1}
  return t}
/* зоны: чем дальше от пирса, тем реже и ценнее рыба */
const far=v=>clamp((Math.hypot(v.x-1,v.z)-9)/32,0,1);
const zoneName=v=>{const f=far(v);return f<.15?'⚓ У пирса':f<.6?'🌊 Залив · редкая рыба чаще':'🐋 Открытое море · крупная добыча'};
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitV=new THREE.Vector3();
function aimAt(e){ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,camera);
  if(!ray.ray.intersectPlane(plane,hitV))return;const d=hitV.clone().sub(FIS);d.y=0;if(d.lengthSq()<.5)return;
  let a=Math.atan2(d.z,d.x);if(!onBoat)a=clamp(a,-.75,1.3);aimDir.set(Math.cos(a),0,Math.sin(a))}

const cv=renderer.domElement;
const uiOpen=()=>['shop','dex','result'].some(id=>$(id).classList.contains('on'));
cv.addEventListener('pointerdown',e=>{e.preventDefault();audio();if(uiOpen())return;holding=true;
  if(st==='idle'&&steering){setDest(e);return}
  if(st==='idle'&&!autopilot){aimAt(e);st='charge';power=0;pdir=1}
  else if(st==='wait')retract();
  else if(st==='bite')startReel()});
cv.addEventListener('pointermove',e=>{if(st==='charge')aimAt(e)});
['boatUI'].forEach(id=>$(id).addEventListener('pointerdown',e=>e.stopPropagation()));
const release=()=>{holding=false;if(st==='charge')cast()};
cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',release);cv.addEventListener('contextmenu',e=>e.preventDefault());

function cast(){st='fly';flyT=0;sfx.cast();const p=Math.max(power,.08);target=castTarget(p);castFrom.copy(tipPos);bobber.visible=true;aimRing.visible=false;cur=pickFish(p,far(target));castPow=p}
let castPow=0;
function land(){st='wait';sfx.splash();ripple(target.x,target.z,1.2);ripple(target.x,target.z,.7);splash(target.x,target.z,10,.8);
  waitT=rnd(2.2,5)*(1-.1*save.up.bait);waitE=0;biteWin=1.1+.12*save.up.line;
  fishM=makeFish(cur);fishM.scale.setScalar(cur.vs);
  let a=rnd(0,Math.PI*2);fishFrom.set(target.x+Math.cos(a)*6,-.55,target.z+Math.sin(a)*6);if(blocked(fishFrom.x,fishFrom.z,0))fishFrom.set(target.x-Math.cos(a)*6,-.55,target.z-Math.sin(a)*6);
  fishM.position.copy(fishFrom);scene.add(fishM)}
function dropFish(){if(fishM){scene.remove(fishM);fishM=null}}
function retract(){st='idle';bobber.visible=false;dropFish()}
function bite(){st='bite';biteT=0;sfx.bite();buzz(90);ripple(bobPos.x,bobPos.z,.9);splash(bobPos.x,bobPos.z,5,.5)}
function startReel(){st='reel';reel={bar:.3,vel:0,fish:.5,ft:.5,fTimer:0,prog:.3,barH:.2+.032*save.up.rod,pos:target.clone()};holding=true;$('reel').querySelector('img').src=thumbs[cur.id]}
function fail(){st='idle';bobber.visible=false;sfx.lose();buzz([40,40,40]);flash('Рыба ушла…');
  if(fishM){const m=fishM;fishM=null;const dir=new THREE.Vector3(rnd(-1,1),0,rnd(.2,1)).normalize();let t=0;fleeing.push({m,dir,t})}}
const fleeing=[];
function win(){st='jump';jumpT=0;bobber.visible=false;sfx.win();buzz([30,50,80]);ripple(bobPos.x,bobPos.z,1.4);splash(bobPos.x,bobPos.z,16,1.1);fishFrom.copy(bobPos)}
function showResult(){
  const f=cur;curW=+(f.min+Math.pow(Math.random(),1.6)*(f.max-f.min)).toFixed(2);
  const coins=Math.round(f.v*(.8+.4*(curW-f.min)/(f.max-f.min)));
  const first=!save.dex[f.id];const d=save.dex[f.id]||(save.dex[f.id]={n:0,best:0});
  d.n++;d.best=Math.max(d.best,curW);save.coins+=coins;persist();updCoins();
  st='result';
  $('rc').innerHTML=`${first?'<span class="new">НОВЫЙ ВИД!</span>':''}<img src="${thumbs[f.id]}" alt=""><h3>${f.n}</h3><p>${curW<10?curW.toFixed(2):curW.toFixed(1)} кг</p><div class="coin">+${coins} 🪙</div><div class="tap">Нажми, чтобы продолжить</div>`;
  $('result').classList.add('on')}
$('result').addEventListener('pointerdown',()=>{$('result').classList.remove('on');dropFish();st='idle'});
function flash(t){flashT=1.8;flashTxt=t}

/* ───────── плавание на лодке ───────── */
let onBoat=false,steering=false,autopilot=false,boatLean=0,wakeT=0,zoneCur='';
const MOOR=new THREE.Vector3(1,0,-.3),dest=new THREE.Vector3(),wp=[];
const BOAT_SEAT=new THREE.Vector3(0,.55,3.05);
let boatSpeed=0;
// пирс, мостик и края карты — сюда лодка не заплывёт
function blocked(x,z,r=1.6){return (x<-.3&&z<10.6+r&&z>-46)||x<-22||x>50||z<-44||z>50}
function setDest(e){ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,camera);
  if(!ray.ray.intersectPlane(plane,hitV))return;dest.set(clamp(hitV.x,-21,49),0,clamp(hitV.z,-43,49));wp.length=0;
  if(blocked(dest.x,dest.z)){flash('Туда не проплыть');return}
  wp.push(dest.clone());ripple(dest.x,dest.z,.8);aimRing.visible=true;aimRing.position.set(dest.x,.16,dest.z)}
function board(){if(st!=='idle')return;onBoat=true;steering=true;boat.add(fisher);fisher.position.copy(BOAT_SEAT);fisher.rotation.y=Math.PI/2;
  moor.forEach(l=>l.visible=false);flash('Ты в лодке! Тапни по воде, чтобы плыть');sfx.cast()}
function goHome(){if(st!=='idle'&&st!=='wait')return;if(st==='wait')retract();steering=false;autopilot=true;wp.length=0;
  if(boat.position.x<.8)wp.push(new THREE.Vector3(3,0,12.5));wp.push(new THREE.Vector3(3,0,-9));wp.push(new THREE.Vector3(1,0,-6));wp.push(MOOR.clone())}
function disembark(){onBoat=false;autopilot=false;steering=false;scene.add(fisher);fisher.position.copy(PIER_POS);fisher.rotation.y=0;
  boat.rotation.y=0;boat.position.x=MOOR.x;boat.position.z=MOOR.z;moor.forEach(l=>l.visible=true);aimRing.visible=false}
function sail(dt){
  let moving=false;
  if(onBoat&&wp.length&&st==='idle'){
    const w=wp[0],dx=w.x-boat.position.x,dz=w.z-boat.position.z,dist=Math.hypot(dx,dz);
    const want=Math.atan2(dx,dz);let d=((want-boat.rotation.y)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
    const last=wp.length===1;
    if(dist<(last&&autopilot?.15:.8)){wp.shift();if(!wp.length){aimRing.visible=false;if(autopilot){disembark();return}}}
    else{boat.rotation.y+=clamp(d,-dt*1.6,dt*1.6);boatLean=lerp(boatLean,-clamp(d,-.5,.5)*.12,dt*3);
      const sp=Math.max(0,Math.cos(d))*Math.min(4.2,dist*1.5+.6);boatSpeed=lerp(boatSpeed,sp,dt*2);
      const nx=boat.position.x+Math.sin(boat.rotation.y)*boatSpeed*dt,nz=boat.position.z+Math.cos(boat.rotation.y)*boatSpeed*dt;
      const home=autopilot&&last;
      if(home||!blocked(nx,nz)){boat.position.x=nx;boat.position.z=nz}
      else if(!blocked(nx,boat.position.z)){boat.position.x=nx}else if(!blocked(boat.position.x,nz)){boat.position.z=nz}
      else{wp.length=0;aimRing.visible=false;flash('Здесь мелко — дальше не проплыть')}
      moving=boatSpeed>.4}
  }else{boatSpeed=lerp(boatSpeed,0,dt*2);boatLean=lerp(boatLean,0,dt*2)}
  if(moving){wakeT-=dt;if(wakeT<=0){wakeT=.18;const bx=boat.position.x-Math.sin(boat.rotation.y)*4.3,bz=boat.position.z-Math.cos(boat.rotation.y)*4.3;ripple(bx,bz,.7);
    const fx=boat.position.x+Math.sin(boat.rotation.y)*4.4,fz=boat.position.z+Math.cos(boat.rotation.y)*4.4;ripple(fx,fz,.4);if(Math.random()<.5)splash(fx,fz,2,.4)}}
  // камера следует за лодкой
  const goal=onBoat?new THREE.Vector3(boat.position.x-2.5,0,boat.position.z-1.5):PIER_CAM;
  CAM_T.lerp(goal,Math.min(1,dt*2.2));camera.position.copy(CAM_T).addScaledVector(CAM_D,90);
  sun.target.position.copy(CAM_T);sun.position.copy(CAM_T).add(SUN_OFF);
}
const SUN_OFF=new THREE.Vector3(-14,26,11),PIER_CAM=CAM_T.clone();
let uiKey='';
function boatUI(){const k=st+'|'+onBoat+'|'+steering+'|'+autopilot;if(k===uiKey)return;uiKey=k;
  const free=st==='idle'||st==='wait';let h='';
  if(!onBoat&&free)h='<button class="act" id="aBoard">⛵ Сесть в лодку</button>';
  else if(onBoat&&!autopilot&&free)h=(steering?'<button class="act on" id="aFish">🎣 Рыбачить</button>':'<button class="act" id="aSteer">🧭 Плыть</button>')+'<button class="act" id="aHome">⚓ К пирсу</button>';
  $('boatUI').innerHTML=h;
  const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  b('aBoard',board);b('aHome',goHome);
  b('aSteer',()=>{if(st==='wait')retract();steering=true;uiKey=''});
  b('aFish',()=>{steering=false;wp.length=0;aimRing.visible=false;uiKey=''})}

const HINTS={idle:'Зажми на воде — прицел и сила, отпусти — <b>бросок</b>',charge:'Веди пальцем для прицела. Дальше — крупнее рыба',fly:'',
  wait:'Жди поклёвку… <span style="opacity:.7">(тап — смотать)</span>',bite:'<b>ПОДСЕКАЙ!</b> Тапни сейчас',reel:'<b>Удерживай</b> — зелёная зона должна держать рыбу',jump:'',result:''};
let hintCur='';
const scr=new THREE.Vector3();
function toScreen(v){scr.copy(v).project(camera);return[(scr.x+1)/2*innerWidth,(1-scr.y)/2*innerHeight]}

function update(dt){
  T+=dt;animWater(T);
  // лодка покачивается
  sail(dt);boat.position.y=WH(boat.position.x,boat.position.z,T)*.8-.05;boat.rotation.z=Math.sin(T*1.1)*.025+boatLean;boat.rotation.x=Math.sin(T*.8)*.012;
  boatLamp.getWorldPosition(boatHalo.position);boatLight.position.copy(boatHalo.position);
  for(const h of halos)h.material.opacity=.75+Math.sin(T*6+h.position.x*3)*.07;
  // чайки
  for(const g of gulls){if(g.userData.float){g.position.y=WH(g.position.x,g.position.z,T)+.08;g.position.x+=dt*.15;g.rotation.y=Math.PI;if(g.position.x>24)g.position.x=4}
    if(g.userData.fly){const a=T*.25;g.position.set(6+Math.cos(a)*11,7+Math.sin(T*.7)*.6,-2+Math.sin(a)*9);g.rotation.y=-a-Math.PI/2;g.rotation.z=.25;
      const f=Math.sin(T*7)*.6;g.userData.w[0].rotation.x=-f;g.userData.w[1].rotation.x=f}}
  // окружающие рыбы
  for(const m of ambient){const u=m.userData;u.h+=Math.sin(T*.3+u.sp*9)*dt*.4;
    m.position.x+=Math.cos(u.h)*u.sp*dt;m.position.z-=Math.sin(u.h)*u.sp*dt;
    const ax=m.position.x-CAM_T.x-6,az=m.position.z-CAM_T.z-6;if(ax*ax+az*az>420||blocked(m.position.x,m.position.z,0)){u.h+=Math.PI*dt*2}if(ax*ax+az*az>1600){m.position.set(CAM_T.x+6+rnd(-10,10),m.position.y,CAM_T.z+6+rnd(-10,10));if(blocked(m.position.x,m.position.z,0))m.position.set(boat.position.x+rnd(3,8),m.position.y,boat.position.z+rnd(3,8))}
    m.rotation.y=u.h;m.userData.tail.rotation.y=Math.sin(T*8*u.sp)*.45}
  for(let i=fleeing.length-1;i>=0;i--){const q=fleeing[i];q.t+=dt;q.m.position.addScaledVector(q.dir,dt*6);q.m.position.y-=dt*.5;q.m.rotation.y=Math.atan2(-q.dir.z,q.dir.x);q.m.userData.tail.rotation.y=Math.sin(T*25)*.6;if(q.t>1.6){scene.remove(q.m);fleeing.splice(i,1)}}

  let ra=1.0;
  if(st==='charge'){
    power+=pdir*dt*.95;if(power>=1){power=1;pdir=-1}if(power<=0){power=0;pdir=1}
    ra=lerp(.6,-.7,Math.min(1,power*1.6));
    const t=castTarget(Math.max(power,.08));aimRing.visible=true;aimRing.position.set(t.x,.16,t.z);aimRing.scale.setScalar(1+Math.sin(T*8)*.08);
    sfxTick-=dt;if(sfxTick<=0){tone(300+power*500,.05,'sine',.025);sfxTick=.09}
  }else if(st==='fly'){
    flyT+=dt;const k=clamp(flyT/.8,0,1);ra=1.35;
    bobPos.lerpVectors(castFrom,target,k);bobPos.y=lerp(castFrom.y,0,k)+Math.sin(k*Math.PI)*(2.5+castPow*3);
    if(k>=1)land();
  }else if(st==='wait'){
    waitE+=dt;const k=clamp(waitE/waitT,0,1),e=1-Math.pow(1-k,2);
    bobPos.set(target.x,WH(target.x,target.z,T)+(k>.6&&Math.sin(T*9)>.9?-.08:0),target.z);
    if(Math.random()<dt*.5)ripple(target.x,target.z,.5);
    if(fishM){const p=fishM.position,nx=lerp(fishFrom.x,target.x-.3,e),nz=lerp(fishFrom.z,target.z,e);
      const dx=nx-p.x,dz=nz-p.z;if(dx*dx+dz*dz>1e-6)fishM.rotation.y=Math.atan2(-dz,dx);p.set(nx,-.55,nz);fishM.userData.tail.rotation.y=Math.sin(T*(k>.9?14:7))*.45}
    if(waitE>=waitT)bite();
  }else if(st==='bite'){
    biteT+=dt;bobPos.set(target.x,-.18+Math.sin(T*30)*.05,target.z);
    if(fishM){fishM.userData.tail.rotation.y=Math.sin(T*20)*.6;fishM.position.y=-.45}
    if(biteT>biteWin)fail();
  }else if(st==='reel'){
    const r=reel,f=cur;r.fTimer-=dt;
    if(r.fTimer<=0){r.fTimer=rnd(.5,1.4)*(1.25-f.d*.5);r.ft=clamp(r.fish+rnd(-1,1)*(.25+f.d*.55),0,1)}
    r.fish+=(r.ft-r.fish)*Math.min(1,dt*(1.2+f.d*3.2));
    r.vel+=(holding?3.4:-2.6)*dt;r.vel=clamp(r.vel,-1.15,1.15);r.bar+=r.vel*dt;
    const top=1-r.barH;if(r.bar<0){r.bar=0;r.vel=Math.max(0,-r.vel*.3)}if(r.bar>top){r.bar=top;r.vel=Math.min(0,-r.vel*.3)}
    r.inZ=r.fish>=r.bar-.015&&r.fish<=r.bar+r.barH+.015;
    r.prog=clamp(r.prog+(r.inZ?dt*.34:-dt*.2*(1-.1*save.up.line)),0,1);
    ra=.85+Math.sin(T*28)*.04+(1-r.prog)*.15;
    const near=FIS.clone().add(target.clone().sub(FIS).setY(0).normalize().multiplyScalar(onBoat?2.6:1.8));near.y=0;const want=target.clone().lerp(near,r.prog*.85);
    r.pos.lerp(want,Math.min(1,dt*3));
    const jit=r.inZ?.08:.2;
    bobPos.set(r.pos.x+Math.sin(T*21)*jit,WH(r.pos.x,r.pos.z,T)-.05,r.pos.z+Math.cos(T*17)*jit);
    if(fishM){fishM.position.set(bobPos.x-.2,-.4,bobPos.z+.1);fishM.rotation.y=Math.sin(T*6)*1.2+.6;fishM.userData.tail.rotation.y=Math.sin(T*26)*.7}
    if(Math.random()<dt*(r.inZ?6:3)){ripple(bobPos.x,bobPos.z,.5);splash(bobPos.x,bobPos.z,2,.5)}
    if(r.prog>=1)win();else if(r.prog<=0)fail();
  }else if(st==='jump'){
    jumpT+=dt;const k=clamp(jumpT/1,0,1),to=new THREE.Vector3(FIS.x+.9,FIS.y+2.1,FIS.z+.3);ra=.2;
    if(fishM){fishM.position.lerpVectors(fishFrom,to,k);fishM.position.y=lerp(-.3,to.y,k)+Math.sin(k*Math.PI)*3.2;
      fishM.rotation.set(Math.sin(T*10)*.4,1.4,k*Math.PI*2);fishM.userData.tail.rotation.y=Math.sin(T*30)*.7}
    if(k>=1)showResult();
  }else if(st==='result'){
    ra=.2;if(fishM){fishM.rotation.y+=dt*1.2;fishM.rotation.z=Math.sin(T*3)*.2;fishM.position.y=FIS.y+2.1+Math.sin(T*2)*.08}
  }
  rodA=lerp(rodA,ra,Math.min(1,dt*(st==='fly'?18:8)));
  // поворот рыбака к цели
  const look=st==='idle'||st==='charge'?aimDir:new THREE.Vector3(bobPos.x-FIS.x,0,bobPos.z-FIS.z).normalize();
  const yaw=Math.atan2(-look.z,look.x)-(onBoat?boat.rotation.y:0);let dy=((yaw-fisher.rotation.y)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;fisher.rotation.y+=dy*Math.min(1,dt*6);
  rodPivot.rotation.z=-rodA;boat.updateMatrixWorld(true);fisher.updateMatrixWorld(true);fisher.getWorldPosition(FIS);tipObj.getWorldPosition(tipPos);
  // поплавок и леска
  if(bobber.visible)bobber.position.copy(bobPos);
  const lp=lineGeo.attributes.position.array;
  if(bobber.visible){const slack=st==='wait'?.9:st==='fly'?.1:st==='bite'?.25:.05;
    for(let i=0;i<=LN;i++){const t=i/LN;lp[i*3]=lerp(tipPos.x,bobPos.x,t);lp[i*3+1]=lerp(tipPos.y,bobPos.y+.1,t)-slack*4*t*(1-t);lp[i*3+2]=lerp(tipPos.z,bobPos.z,t)}}
  else for(let i=0;i<=LN;i++){const t=i/LN;lp[i*3]=tipPos.x;lp[i*3+1]=tipPos.y-t*.7;lp[i*3+2]=tipPos.z}
  lineGeo.attributes.position.needsUpdate=true;
  // эффекты
  for(let i=ripples.length-1;i>=0;i--){const q=ripples[i];q.t+=dt;q.m.scale.setScalar(.1+q.t*1.8*q.s);q.m.material.opacity=.7*(1-q.t/1.2);q.m.position.y=WH(q.m.position.x,q.m.position.z,T)+.06;if(q.t>1.2){scene.remove(q.m);q.m.material.dispose();ripples.splice(i,1)}}
  for(let i=drops.length-1;i>=0;i--){const q=drops[i];q.t+=dt;q.v.y-=12*dt;q.m.position.addScaledVector(q.v,dt);if(q.m.position.y<-.1||q.t>1.5){scene.remove(q.m);drops.splice(i,1)}}
  // интерфейс
  $('charge').style.display=st==='charge'?'block':'none';$('charge').firstChild.style.width=(power*100)+'%';
  const bt=$('bite');if(st==='bite'){const[sx,sy]=toScreen(bobPos);bt.style.display='grid';bt.style.left=sx+'px';bt.style.top=sy+'px'}else bt.style.display='none';
  const rl=$('reel');if(st==='reel'){rl.style.display='flex';const tr=rl.querySelector('.track'),H=tr.clientHeight,z=rl.querySelector('.zone');
    z.style.height=(reel.barH*H)+'px';z.style.top=((1-reel.bar-reel.barH)*H)+'px';z.classList.toggle('on',reel.inZ);
    rl.querySelector('img').style.top=((1-reel.fish)*H)+'px';rl.querySelector('.prog i').style.height=(reel.prog*100)+'%'}else rl.style.display='none';
  if(flashT>0)flashT-=dt;
  const h=flashT>0?flashTxt:(st==='idle'&&steering)?'Тапни по воде — <b>лодка поплывёт туда</b>':(st==='idle'&&autopilot)?'Возвращаемся к пирсу…':HINTS[st];
  boatUI();const zn=zoneName(onBoat?boat.position:PIER_POS);if(zn!==zoneCur){zoneCur=zn;$('zone').textContent=zn}if(h!==hintCur){hintCur=h;$('hint').innerHTML=h}
}

/* ───────── магазин и коллекция ───────── */
function updCoins(){$('coins').textContent='🪙 '+save.coins}
function renderShop(){$('shopList').innerHTML=UPS.map(u=>{const lv=save.up[u.k],max=lv>=MAXLV,c=COST[lv];
  return `<div class="row"><div class="ic">${u.e}</div><div class="tx"><b>${u.n}</b><small>${u.d}</small><div class="dots">${Array.from({length:MAXLV},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div></div><button class="buy" data-up="${u.k}" ${max||save.coins<c?'disabled':''}>${max?'МАКС':c+' 🪙'}</button></div>`}).join('')}
function renderDex(){const got=Object.keys(save.dex).length;$('dexSub').textContent=`Открыто видов: ${got} из ${FISH.length}`;
  $('dexGrid').innerHTML=FISH.map(f=>{const d=save.dex[f.id];return d?`<div class="card"><img src="${thumbs[f.id]}" alt=""><b>${f.n}</b>×${d.n} · рекорд ${d.best<10?d.best.toFixed(2):d.best.toFixed(1)} кг</div>`:`<div class="card lock"><img src="${thumbs[f.id]}" alt=""><b>???</b>не поймана</div>`}).join('')}
const openUI=id=>{if(st!=='idle'&&st!=='wait')return;$(id).classList.add('on');id==='shop'?renderShop():renderDex();holding=false};
$('bShop').onclick=()=>openUI('shop');$('bDex').onclick=()=>openUI('dex');
$('bSnd').onclick=()=>{save.mute=!save.mute;persist();$('bSnd').textContent=save.mute?'🔇':'🔊'};
$('bFs').onclick=async()=>{try{const d=document.documentElement;if(!document.fullscreenElement){await(d.requestFullscreen||d.webkitRequestFullscreen).call(d);if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape').catch(()=>{})}else await document.exitFullscreen()}catch(e){}};
$('bPortrait').onclick=()=>document.body.classList.add('portraitOk');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('.overlay').classList.remove('on'));
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('pointerdown',e=>{if(e.target===o)o.classList.remove('on')}));
$('shopList').addEventListener('click',e=>{const k=e.target.dataset&&e.target.dataset.up;if(!k)return;const lv=save.up[k],c=COST[lv];
  if(lv<MAXLV&&save.coins>=c){save.coins-=c;save.up[k]++;persist();sfx.buy();updCoins();renderShop()}});
$('bSnd').textContent=save.mute?'🔇':'🔊';updCoins();

/* ───────── цикл ───────── */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}
$('loading').remove();requestAnimationFrame(loop);
window.__game={get st(){return st},get reel(){return reel},save};
