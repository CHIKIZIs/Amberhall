// 3D-сцена: рендер, модели из примитивов, арена, эффекты.
import * as T from 'three';
import { LOCS, RAR, rng } from './data.js';

export let renderer, scene, camera;
let battleRoot, lobbyRoot, fxRoot, sun, hemi;
const G = {
  sphere: new T.SphereGeometry(1, 16, 12), box: new T.BoxGeometry(1, 1, 1), cyl: new T.CylinderGeometry(1, 1, 1, 14),
  cone: new T.ConeGeometry(1, 1, 12), disc: new T.CircleGeometry(1, 32), ring: new T.RingGeometry(0.88, 1, 40),
  bow: new T.TorusGeometry(0.42, 0.045, 6, 14, Math.PI), plane: new T.PlaneGeometry(1, 1),
};
const mats = new Map();
export function mat(color, emissive) {
  const k = color + '|' + (emissive || 0);
  if (!mats.has(k)) mats.set(k, new T.MeshLambertMaterial({ color, emissive: emissive || 0 }));
  return mats.get(k);
}
const WHITE = new T.MeshBasicMaterial({ color: 0xffffff });
const SHADOW = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
function P(parent, g, m, sx, sy, sz, x, y, z) {
  const o = new T.Mesh(g, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); parent.add(o); return o;
}

export function init(canvas) {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(48, 1, 0.5, 120);
  hemi = new T.HemisphereLight(0xffffff, 0x556655, 1.9); scene.add(hemi);
  sun = new T.DirectionalLight(0xfff2d8, 2.1); sun.position.set(-6, 14, 8); scene.add(sun);
  battleRoot = new T.Group(); lobbyRoot = new T.Group(); fxRoot = new T.Group();
  scene.add(battleRoot, lobbyRoot, fxRoot);
  buildLobby();
  resize();
}
export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w / h < 0.62 ? 50 : 42; camera.updateProjectionMatrix();
}
export const render = () => renderer.render(scene, camera);
const v3 = new T.Vector3();
export function project(x, y, z) {
  v3.set(x, y, z).project(camera);
  return [(v3.x + 1) / 2 * window.innerWidth, (1 - v3.y) / 2 * window.innerHeight, v3.z < 1];
}

// ---------- Модели ----------
const SKIN = 0xf2c79a, STEEL = 0xdfe6ee, WOOD = 0x8a5a2b, DARK = 0x2a2233;
function weaponMesh(type, parent, left, color) {
  const g = new T.Group(); parent.add(g);
  const glow = color || 0xdfe6ee;
  if (type === 'sword') {
    P(g, G.box, mat(glow), 0.13, 0.95, 0.24, 0, 0.62, 0); P(g, G.box, mat(0xffc531), 0.16, 0.09, 0.52, 0, 0.12, 0); P(g, G.cyl, mat(WOOD), 0.06, 0.22, 0.06, 0, 0, 0);
  } else if (type === 'daggers') {
    P(g, G.box, mat(glow), 0.1, 0.5, 0.18, 0, 0.36, 0); P(g, G.box, mat(DARK), 0.13, 0.07, 0.3, 0, 0.1, 0);
    const g2 = new T.Group(); left.add(g2);
    P(g2, G.box, mat(glow), 0.1, 0.5, 0.18, 0, 0.36, 0); P(g2, G.box, mat(DARK), 0.13, 0.07, 0.3, 0, 0.1, 0);
    g2.rotation.x = 1.2;
  } else if (type === 'hammer') {
    P(g, G.cyl, mat(WOOD), 0.07, 1.1, 0.07, 0, 0.5, 0); P(g, G.box, mat(glow), 0.5, 0.42, 0.72, 0, 1.08, 0); P(g, G.box, mat(0xffc531), 0.54, 0.12, 0.76, 0, 1.08, 0);
  } else if (type === 'bow') {
    const b = new T.Group(); left.add(b);
    const arc = new T.Mesh(G.bow, mat(color || WOOD)); arc.rotation.set(0, Math.PI / 2, -Math.PI / 2); arc.scale.set(1.2, 1.2, 1.2); b.add(arc);
    P(b, G.cyl, mat(0xffffff), 0.012, 1.0, 0.012, 0, 0, 0); b.position.set(0, 0, 0.2);
  } else if (type === 'staff') {
    P(g, G.cyl, mat(WOOD), 0.06, 1.6, 0.06, 0, 0.5, 0);
    P(g, G.sphere, new T.MeshBasicMaterial({ color: color || 0x7fe3ff }), 0.2, 0.2, 0.2, 0, 1.42, 0);
  } else if (type === 'club') {
    const c = P(g, G.cone, mat(WOOD), 0.2, 0.95, 0.2, 0, 0.5, 0); c.rotation.x = Math.PI;
  }
  g.rotation.x = type === 'staff' ? 0.25 : 1.2;
  return g;
}
// o: {body, skin, accent, hat, weapon, wcolor, s}
export function humanoid(o) {
  const root = new T.Group(), g = new T.Group(); root.add(g);
  const s = o.s || 1, skin = mat(o.skin || SKIN), body = mat(o.body), acc = mat(o.accent || 0xffc531);
  const legL = P(g, G.box, mat(DARK), 0.24, 0.34, 0.3, -0.2, 0.17, 0), legR = P(g, G.box, mat(DARK), 0.24, 0.34, 0.3, 0.2, 0.17, 0);
  P(g, G.sphere, body, 0.5, 0.5, 0.44, 0, 0.74, 0);
  P(g, G.cyl, acc, 0.47, 0.1, 0.42, 0, 0.5, 0);
  const head = new T.Group(); head.position.set(0, 1.4, 0); g.add(head);
  P(head, G.sphere, skin, 0.42, 0.4, 0.4, 0, 0, 0);
  P(head, G.sphere, mat(0x1a1420), 0.065, 0.085, 0.05, -0.15, -0.03, 0.37); P(head, G.sphere, mat(0x1a1420), 0.065, 0.085, 0.05, 0.15, -0.03, 0.37);
  if (o.hat === 'helm') {
    P(head, G.sphere, acc, 0.45, 0.25, 0.44, 0, 0.27, -0.03); P(head, G.cone, mat(0xe8443a), 0.1, 0.4, 0.1, 0, 0.6, -0.05);
  } else if (o.hat === 'horns') {
    const a = P(head, G.cone, mat(0xf3ead2), 0.1, 0.36, 0.1, -0.3, 0.34, 0), b = P(head, G.cone, mat(0xf3ead2), 0.1, 0.36, 0.1, 0.3, 0.34, 0);
    a.rotation.z = 0.5; b.rotation.z = -0.5;
  } else if (o.hat === 'hood') {
    P(head, G.sphere, body, 0.46, 0.4, 0.45, 0, 0.08, -0.08); P(head, G.cone, body, 0.2, 0.36, 0.2, 0, 0.48, -0.16);
  } else if (o.hat === 'cone') {
    P(head, G.cone, acc, 0.4, 0.8, 0.4, 0, 0.62, 0); P(head, G.cyl, acc, 0.56, 0.05, 0.56, 0, 0.25, 0);
  } else if (o.hat === 'crown') {
    P(head, G.cyl, mat(0xffc531, 0x553300), 0.36, 0.2, 0.36, 0, 0.38, 0);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; P(head, G.cone, mat(0xffc531, 0x553300), 0.08, 0.24, 0.08, Math.sin(a) * 0.3, 0.58, Math.cos(a) * 0.3); }
    const a = P(head, G.cone, mat(0x2a2233), 0.13, 0.5, 0.13, -0.42, 0.2, 0), b = P(head, G.cone, mat(0x2a2233), 0.13, 0.5, 0.13, 0.42, 0.2, 0);
    a.rotation.z = 0.9; b.rotation.z = -0.9;
  }
  const armR = new T.Group(); armR.position.set(0.56, 0.95, 0.05); g.add(armR);
  const armL = new T.Group(); armL.position.set(-0.56, 0.95, 0.05); g.add(armL);
  P(armR, G.sphere, skin, 0.15, 0.15, 0.15, 0, -0.12, 0.08); P(armL, G.sphere, skin, 0.15, 0.15, 0.15, 0, -0.12, 0.08);
  const hR = new T.Group(); hR.position.set(0, -0.12, 0.08); armR.add(hR);
  const hL = new T.Group(); hL.position.set(0, -0.12, 0.08); armL.add(hL);
  if (o.weapon) weaponMesh(o.weapon, hR, hL, o.wcolor);
  if (o.cape) P(g, G.box, mat(o.cape), 0.7, 0.75, 0.06, 0, 0.72, -0.4).rotation.x = 0.18;
  const sh = new T.Mesh(G.disc, SHADOW); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.setScalar(0.62); root.add(sh);
  root.scale.setScalar(s);
  root.userData = { g, legL, legR, armR, armL, head, walk: 0, type: 'h' };
  return root;
}
export function critter(color, accent, s = 1) {
  const root = new T.Group(), g = new T.Group(); root.add(g);
  P(g, G.sphere, mat(color), 0.42, 0.34, 0.58, 0, 0.4, 0);
  P(g, G.sphere, mat(color), 0.3, 0.28, 0.3, 0, 0.56, 0.42);
  const e1 = P(g, G.cone, mat(accent), 0.09, 0.3, 0.09, -0.16, 0.86, 0.38), e2 = P(g, G.cone, mat(accent), 0.09, 0.3, 0.09, 0.16, 0.86, 0.38);
  e1.rotation.z = 0.3; e2.rotation.z = -0.3;
  P(g, G.sphere, mat(0x1a1420), 0.05, 0.06, 0.04, -0.12, 0.6, 0.68); P(g, G.sphere, mat(0x1a1420), 0.05, 0.06, 0.04, 0.12, 0.6, 0.68);
  const legL = P(g, G.box, mat(DARK), 0.14, 0.2, 0.16, -0.22, 0.1, 0.1), legR = P(g, G.box, mat(DARK), 0.14, 0.2, 0.16, 0.22, 0.1, 0.1);
  P(g, G.cone, mat(accent), 0.08, 0.34, 0.08, 0, 0.5, -0.62).rotation.x = -1.9;
  const sh = new T.Mesh(G.disc, SHADOW); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.setScalar(0.5); root.add(sh);
  root.scale.setScalar(s); root.userData = { g, legL, legR, walk: 0, type: 'c' };
  return root;
}
export function bomb(color) {
  const root = new T.Group(), g = new T.Group(); root.add(g);
  const m = new T.MeshLambertMaterial({ color: 0x2c2c38 });
  P(g, G.sphere, m, 0.46, 0.46, 0.46, 0, 0.56, 0);
  P(g, G.cyl, mat(color), 0.48, 0.08, 0.48, 0, 0.56, 0);
  P(g, G.cyl, mat(0xc9b28a), 0.05, 0.26, 0.05, 0, 1.1, 0);
  P(g, G.sphere, new T.MeshBasicMaterial({ color: 0xffd23d }), 0.09, 0.09, 0.09, 0, 1.26, 0);
  P(g, G.sphere, mat(0xffffff), 0.1, 0.12, 0.05, -0.16, 0.64, 0.4); P(g, G.sphere, mat(0xffffff), 0.1, 0.12, 0.05, 0.16, 0.64, 0.4);
  const legL = P(g, G.box, mat(color), 0.16, 0.16, 0.24, -0.2, 0.08, 0.04), legR = P(g, G.box, mat(color), 0.16, 0.16, 0.24, 0.2, 0.08, 0.04);
  const sh = new T.Mesh(G.disc, SHADOW); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; sh.scale.setScalar(0.5); root.add(sh);
  root.userData = { g, legL, legR, walk: 0, type: 'b', fuseMat: m };
  return root;
}
const ARMOR_COL = [0x3f8f4f, 0xd9963a, 0x4fa3d9, 0x8a3040];
export function heroModel(st, rival) {
  const rc = parseInt(RAR[st.armorRar].color.slice(1), 16), wc = st.wRar > 0 ? parseInt(RAR[st.wRar].color.slice(1), 16) : 0;
  return humanoid({ body: rival ? 0xc23b3b : ARMOR_COL[st.armorTier], accent: st.armorRar > 0 ? rc : 0xdfe6ee, hat: 'helm', weapon: st.wtype,
    wcolor: wc || undefined, cape: rival ? 0x5a1d1d : 0x2d4fa8, skin: rival ? 0xd9a57a : SKIN, s: 1.05 });
}
export function enemyModel(type, loc) {
  const c = LOCS[loc].enemy;
  if (type === 'grunt') return humanoid({ body: c[0], skin: c[1], accent: c[2], hat: 'horns', weapon: 'club', s: 0.92 });
  if (type === 'runner') return critter(c[0], c[1], 0.9);
  if (type === 'archer') return humanoid({ body: c[2], skin: c[1], accent: c[0], hat: 'hood', weapon: 'bow', s: 0.86 });
  if (type === 'bomber') return bomb(c[0]);
  if (type === 'brute') return humanoid({ body: c[0], skin: c[1], accent: c[2], hat: 'horns', weapon: 'club', s: 1.55 });
  if (type === 'shaman') return humanoid({ body: c[2], skin: c[1], accent: 0x9b5de5, hat: 'cone', weapon: 'staff', wcolor: 0xff5ad1, s: 0.95 });
  return humanoid({ body: c[2], skin: c[0], accent: c[1], hat: 'crown', weapon: 'hammer', s: 2.3, cape: 0x5a1d1d });
}
export function animate(model, dt, moving, atkT, atkDur) {
  const u = model.userData;
  if (moving) u.walk += dt * 13; else u.walk = 0;
  const sw = Math.sin(u.walk);
  u.legL.position.z = (u.type === 'c' ? 0.1 : 0) + sw * 0.16; u.legR.position.z = (u.type === 'c' ? 0.1 : 0) - sw * 0.16;
  u.g.position.y = moving ? Math.abs(sw) * 0.07 : 0;
  if (u.armR) {
    const k = atkT > 0 ? 1 - atkT / atkDur : 1;
    u.armR.rotation.x = atkT > 0 ? -2.3 + k * 3.0 : sw * 0.4;
    u.armL.rotation.x = -sw * 0.4;
    u.g.rotation.y = atkT > 0 ? (0.5 - k) * 0.7 : 0;
  }
}
export function flash(model, on) {
  model.traverse(o => {
    if (!o.isMesh || o.material === SHADOW) return;
    if (on) { if (!o.userData.m) { o.userData.m = o.material; o.material = WHITE; } }
    else if (o.userData.m) { o.material = o.userData.m; o.userData.m = null; }
  });
}

// ---------- Декор и арена ----------
function decor(loc, r, big) {
  const g = new T.Group(), k = r();
  if (loc === 0) {
    if (k < 0.6 || big) { P(g, G.cyl, mat(0x7a4f28), 0.22, 1, 0.22, 0, 0.5, 0); P(g, G.cone, mat(0x2f8f3a), 1, 1.4, 1, 0, 1.5, 0); P(g, G.cone, mat(0x3aa646), 0.75, 1.2, 0.75, 0, 2.3, 0); }
    else if (k < 0.8) P(g, G.sphere, mat(0x8c9499), 0.7, 0.5, 0.6, 0, 0.3, 0);
    else { P(g, G.sphere, mat(0x3aa646), 0.6, 0.45, 0.6, 0, 0.35, 0); P(g, G.sphere, mat(0xff6b8b), 0.1, 0.1, 0.1, 0.3, 0.6, 0.3); }
  } else if (loc === 1) {
    if (k < 0.5 || big) { P(g, G.cyl, mat(0x4f9a4a), 0.3, 1.7, 0.3, 0, 0.85, 0); P(g, G.sphere, mat(0x4f9a4a), 0.3, 0.3, 0.3, 0, 1.7, 0);
      P(g, G.cyl, mat(0x4f9a4a), 0.16, 0.7, 0.16, 0.5, 1.1, 0); P(g, G.cyl, mat(0x4f9a4a), 0.16, 0.5, 0.16, -0.5, 0.85, 0); }
    else if (k < 0.8) { P(g, G.sphere, mat(0xb9824a), 0.75, 0.55, 0.65, 0, 0.3, 0); P(g, G.sphere, mat(0xa87340), 0.4, 0.35, 0.4, 0.5, 0.2, 0.3); }
    else { P(g, G.cyl, mat(0xf3ead2), 0.07, 0.9, 0.07, 0, 0.2, 0).rotation.z = 1.2; P(g, G.sphere, mat(0xf3ead2), 0.22, 0.2, 0.26, 0.5, 0.2, 0); }
  } else if (loc === 2) {
    if (k < 0.5 || big) { const m = mat(0x8fe1ff, 0x1a4d66); P(g, G.cone, m, 0.45, 1.9, 0.45, 0, 0.95, 0); P(g, G.cone, m, 0.3, 1.2, 0.3, 0.4, 0.6, 0.1).rotation.z = -0.4; P(g, G.cone, m, 0.28, 1, 0.28, -0.35, 0.5, -0.1).rotation.z = 0.4; }
    else if (k < 0.8) { P(g, G.cyl, mat(0x6b4a2b), 0.18, 0.8, 0.18, 0, 0.4, 0); P(g, G.cone, mat(0xeaf6fb), 0.9, 1.3, 0.9, 0, 1.3, 0); P(g, G.cone, mat(0xffffff), 0.65, 1.1, 0.65, 0, 2.0, 0); }
    else P(g, G.sphere, mat(0xffffff), 0.75, 0.5, 0.7, 0, 0.25, 0);
  } else {
    if (k < 0.5 || big) { P(g, G.cone, mat(0x241a1c), 0.55, 2.2, 0.55, 0, 1.1, 0); P(g, G.cone, mat(0x33262a), 0.35, 1.3, 0.35, 0.45, 0.65, 0.1).rotation.z = -0.3; }
    else if (k < 0.8) { P(g, G.sphere, mat(0x33262a), 0.75, 0.5, 0.65, 0, 0.3, 0); P(g, G.sphere, new T.MeshBasicMaterial({ color: 0xff7a1a }), 0.3, 0.2, 0.3, 0.1, 0.55, 0.1); }
    else { P(g, G.cyl, mat(0x241a1c), 0.14, 1.5, 0.14, 0, 0.75, 0); P(g, G.cyl, mat(0x241a1c), 0.08, 0.7, 0.08, 0.3, 1.3, 0).rotation.z = -0.9; }
  }
  g.rotation.y = r() * 6.28; const s = 0.85 + r() * 0.35; g.scale.setScalar(s);
  return g;
}
function checker(a, b) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = a; x.fillRect(0, 0, 64, 64); x.fillStyle = b; x.fillRect(0, 0, 32, 32); x.fillRect(32, 32, 32, 32);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = T.NearestFilter; t.colorSpace = T.SRGBColorSpace; return t;
}
function clear(group) {
  for (let i = group.children.length; i--;) {
    const c = group.children[i]; group.remove(c);
    c.traverse(o => { if (o.isMesh && o.userData.own) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  }
}
export function buildArena(loc, seed, W, D, nObst) {
  clear(battleRoot); clear(fxRoot); fx.length = 0;
  const Lc = LOCS[loc], r = rng(seed);
  scene.background = new T.Color(Lc.sky); scene.fog = new T.Fog(Lc.sky, 26, 52);
  hemi.groundColor.set(Lc.ground); sun.intensity = loc === 3 ? 1.5 : 2.1; hemi.intensity = loc === 3 ? 1.6 : 1.9;
  const gr = new T.Mesh(new T.PlaneGeometry(120, 120), new T.MeshLambertMaterial({ color: Lc.ground }));
  gr.userData.own = 1; gr.rotation.x = -Math.PI / 2; gr.position.y = -0.02; battleRoot.add(gr);
  const tex = checker(Lc.floorA, Lc.floorB); tex.repeat.set(W / 4, D / 4);
  const fl = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshLambertMaterial({ map: tex })); fl.userData.own = 1;
  fl.rotation.x = -Math.PI / 2; battleRoot.add(fl);
  const rim = mat(Lc.rim);
  P(battleRoot, G.box, rim, W + 0.9, 0.5, 0.45, 0, 0.25, -D / 2 - 0.22); P(battleRoot, G.box, rim, W + 0.9, 0.5, 0.45, 0, 0.25, D / 2 + 0.22);
  P(battleRoot, G.box, rim, 0.45, 0.5, D, -W / 2 - 0.22, 0.25, 0); P(battleRoot, G.box, rim, 0.45, 0.5, D, W / 2 + 0.22, 0.25, 0);
  for (let i = 0; i < 46; i++) {
    const x = (r() - 0.5) * 44, z = (r() - 0.5) * 60;
    if (Math.abs(x) < W / 2 + 1.6 && Math.abs(z) < D / 2 + 1.6) continue;
    if (z > D / 2 && Math.abs(x) < 6) continue; // не загораживаем камеру
    const d = decor(loc, r, r() < 0.6); d.position.set(x, 0, z); battleRoot.add(d);
  }
  const obst = []; let guard = 0;
  while (obst.length < nObst && guard++ < 200) {
    const x = (r() - 0.5) * (W - 3), z = (r() - 0.5) * (D - 5);
    if (Math.hypot(x, z - D * 0.3) < 3.2 || Math.hypot(x, z + D * 0.3) < 3.2) continue;
    if (obst.some(o => Math.hypot(o.x - x, o.z - z) < 3.4)) continue;
    const d = decor(loc, r, true); d.position.set(x, 0, z); d.scale.multiplyScalar(0.72); battleRoot.add(d);
    obst.push({ x, z, r: 0.75 });
  }
  battleRoot.visible = true; lobbyRoot.visible = false;
  return obst;
}
export function add(o) { battleRoot.add(o); }
export function remove(o) { battleRoot.remove(o); }

// ---------- Лобби ----------
let lobbyHero = null, lobbyT = 0;
function buildLobby() {
  P(lobbyRoot, G.cyl, mat(0x4b3aa8), 1.7, 0.3, 1.7, 0, -0.15, 0); P(lobbyRoot, G.cyl, mat(0xffc531), 1.82, 0.12, 1.82, 0, -0.26, 0);
  P(lobbyRoot, G.cyl, mat(0x30246e), 2.4, 0.2, 2.4, 0, -0.42, 0);
}
export function showLobby(st) {
  battleRoot.visible = false; lobbyRoot.visible = true; clear(fxRoot); fx.length = 0;
  if (lobbyHero) lobbyRoot.remove(lobbyHero);
  lobbyHero = heroModel(st); lobbyRoot.add(lobbyHero);
  scene.background = new T.Color(0x2a1c66); scene.fog = null; hemi.groundColor.set(0x4b3aa8); hemi.intensity = 2; sun.intensity = 2.1;
  const far = camera.aspect < 0.62 ? 9.8 : 8;
  camera.position.set(0, 1.7, far); camera.lookAt(0, -1.45, 0);
}
export const lobby = () => lobbyHero;
export function lobbyTick(dt) {
  if (!lobbyHero) return; lobbyT += dt;
  lobbyHero.rotation.y = Math.sin(lobbyT * 0.6) * 0.55;
  lobbyHero.userData.g.position.y = Math.sin(lobbyT * 2.2) * 0.03;
  lobbyHero.userData.armR.rotation.x = Math.sin(lobbyT * 2.2) * 0.08; lobbyHero.userData.armL.rotation.x = -Math.sin(lobbyT * 2.2) * 0.08;
}
let camX = 0, camZ = 0, shakeT = 0;
export function shake(a) { shakeT = Math.max(shakeT, a); }
export function follow(x, z, dt, snap, W, D) {
  const lim = Math.max(0, W / 2 - 4.6), tx = Math.max(-lim, Math.min(lim, x)), tz = Math.min(D / 2 - 4, z);
  const k = snap ? 1 : Math.min(1, dt * 6);
  camX += (tx - camX) * k; camZ += (tz - camZ) * k;
  const sx = shakeT > 0 ? (Math.random() - 0.5) * shakeT : 0, sz = shakeT > 0 ? (Math.random() - 0.5) * shakeT : 0;
  shakeT = Math.max(0, shakeT - dt * 1.8);
  camera.position.set(camX + sx, 17.5, camZ + 14.2 + sz); camera.lookAt(camX + sx, 0, camZ - 2.2 + sz);
}

// ---------- Эффекты ----------
const fx = [];
function addFx(mesh, life, tick) { fxRoot.add(mesh); fx.push({ mesh, life, max: life, tick }); return mesh; }
export function tickFx(dt) {
  for (let i = fx.length; i--;) {
    const f = fx[i]; f.life -= dt;
    if (f.life <= 0) { fxRoot.remove(f.mesh); if (f.mesh.material && f.mesh.userData.own) f.mesh.material.dispose(); fx.splice(i, 1); continue; }
    f.tick(f.mesh, 1 - f.life / f.max, dt);
  }
}
const tmat = (color, op) => new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
const arcGeo = new Map();
export function slash(x, z, face, range, arc, color = 0xffffff) {
  const k = range.toFixed(1) + arc.toFixed(1);
  if (!arcGeo.has(k)) arcGeo.set(k, new T.RingGeometry(range * 0.45, range, 20, 1, -arc / 2, arc));
  const m = new T.Mesh(arcGeo.get(k), tmat(color, 0.8)); m.userData.own = 1;
  m.rotation.set(-Math.PI / 2, 0, face - Math.PI / 2); m.position.set(x, 0.5, z);
  addFx(m, 0.18, (o, t) => { o.material.opacity = 0.8 * (1 - t); o.scale.setScalar(0.85 + t * 0.2); });
}
export function burst(x, z, radius, color, life = 0.35) {
  const m = new T.Mesh(G.disc, tmat(color, 0.6)); m.userData.own = 1; m.rotation.x = -Math.PI / 2; m.position.set(x, 0.08, z);
  addFx(m, life, (o, t) => { o.scale.setScalar(radius * (0.3 + 0.7 * Math.sqrt(t))); o.material.opacity = 0.6 * (1 - t); });
  const r = new T.Mesh(G.ring, tmat(0xffffff, 0.9)); r.userData.own = 1; r.rotation.x = -Math.PI / 2; r.position.set(x, 0.1, z);
  addFx(r, life, (o, t) => { o.scale.setScalar(radius * (0.3 + 0.75 * Math.sqrt(t))); o.material.opacity = 0.9 * (1 - t); });
}
export function puff(x, y, z, color, n = 6, spread = 3) {
  const m = mat(color);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, sp = spread * (0.4 + Math.random()), vy = 2 + Math.random() * 3.5;
    const o = new T.Mesh(G.box, m); o.position.set(x, y, z); const s = 0.1 + Math.random() * 0.14; o.scale.setScalar(s);
    const v = { x: Math.cos(a) * sp, y: vy, z: Math.sin(a) * sp };
    addFx(o, 0.45 + Math.random() * 0.25, (q, t, dt) => { v.y -= 14 * dt; q.position.x += v.x * dt; q.position.y = Math.max(0.05, q.position.y + v.y * dt); q.position.z += v.z * dt; q.rotation.x += dt * 9; q.scale.setScalar(s * (1 - t * 0.8)); });
  }
}
// Предупреждение об ударе по площади: красный круг, который заполняется.
export function telegraph(x, z, radius, time, color = 0xff3b3b) {
  const a = new T.Mesh(G.disc, tmat(color, 0.22)); a.userData.own = 1; a.rotation.x = -Math.PI / 2; a.position.set(x, 0.05, z); a.scale.setScalar(radius);
  addFx(a, time, () => {});
  const b = new T.Mesh(G.disc, tmat(color, 0.42)); b.userData.own = 1; b.rotation.x = -Math.PI / 2; b.position.set(x, 0.06, z);
  addFx(b, time, (o, t) => o.scale.setScalar(Math.max(0.01, radius * t)));
  const c = new T.Mesh(G.ring, tmat(color, 0.9)); c.userData.own = 1; c.rotation.x = -Math.PI / 2; c.position.set(x, 0.07, z); c.scale.setScalar(radius);
  addFx(c, time, () => {});
}
export function lineTelegraph(x, z, face, len, width, time) {
  const m = new T.Mesh(G.plane, tmat(0xff3b3b, 0.3)); m.userData.own = 1;
  m.rotation.set(-Math.PI / 2, 0, face); m.scale.set(width, len, 1);
  m.position.set(x + Math.sin(face) * len / 2, 0.05, z + Math.cos(face) * len / 2);
  addFx(m, time, (o, t) => { o.material.opacity = 0.25 + 0.3 * t; });
}
export function portal(x, z, time, color) {
  const c = new T.Mesh(G.ring, tmat(color, 0.9)); c.userData.own = 1; c.rotation.x = -Math.PI / 2; c.position.set(x, 0.06, z);
  addFx(c, time, (o, t) => { o.scale.setScalar(0.3 + 0.6 * t); o.rotation.z += 0.2; });
}
export function meteor(x, z, time) {
  const o = new T.Mesh(G.sphere, new T.MeshBasicMaterial({ color: 0xff8a2a })); o.userData.own = 1; o.scale.setScalar(0.9);
  addFx(o, time, (q, t) => q.position.set(x - (1 - t) * 4, 0.5 + (1 - t) * 16, z - (1 - t) * 3));
}
const projGeo = { arrow: new T.CylinderGeometry(0.05, 0.05, 1.1, 6), orb: G.sphere };
export function projectile(kind, color) {
  let o;
  if (kind === 'arrow') { o = new T.Group(); const s = new T.Mesh(projGeo.arrow, new T.MeshBasicMaterial({ color })); s.rotation.x = Math.PI / 2; o.add(s); }
  else { o = new T.Mesh(G.sphere, new T.MeshBasicMaterial({ color })); o.scale.setScalar(kind === 'orb' ? 0.32 : 0.22); }
  fxRoot.add(o); return o;
}
export function removeProj(o) { fxRoot.remove(o); }
