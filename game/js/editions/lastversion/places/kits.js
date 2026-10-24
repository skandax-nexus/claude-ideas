// THE LAST VERSION OF EARTH: records, fragments and set pieces as things of their place (OVERHAUL.md
// §4.6 rule 5): a telling-stone, a ledger on a lectern, a bronze plate, a phone booth, a cairn, a glass
// case... never a Station Zero terminal or a HALCYON crystal. Each kit is a small group with its
// origin on the ground, facing +z; mount.js puts it where the record stands.
import * as THREE from '../../../../vendor/three.module.min.js';
import { paintedMap, SURFACES } from './materials.js';
import { pbrTex } from '../../../world/materials.js';

// (closing: visuals) a kit's surfaces carry the place's own textures (o.tex: a surface of materials.js, painted or
// scanned): carved stone, wood with its grain, painted panels, paper with writing, canvas; never a plain-coloured box
function texOf(name) {
  const d = SURFACES[name];
  if (!d) return null;
  return d.paint ? paintedMap(name) : d.scan ? pbrTex(d.scan, 'color', 1) : null;
}
const _mats = new Map();
function mat(color, o = {}) {
  const k = `${color}|${JSON.stringify(o)}`;
  if (!_mats.has(k)) {
    const map = o.tex ? texOf(o.tex) : null;
    const m = o.basic ? new THREE.MeshBasicMaterial({ color, transparent: !!o.opacity, opacity: o.opacity ?? 1 }) : new THREE.MeshStandardMaterial({ color, map, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity });
    m.userData.keep = true;
    _mats.set(k, m);
  }
  return _mats.get(k);
}
// the textures kits take: stone, wood, panel, paper, canvas (a tinted texture: the colour multiplies it)
const STONE = { rough: 0.95, tex: 'stone' }, WOOD = { rough: 0.7, tex: 'wood' }, PANEL = { rough: 0.5, metal: 0.15, tex: 'panel' }, PAPER = { rough: 0.9, tex: 'paper' }, CANVAS = { rough: 0.95, tex: 'canvas' };
const box = (g, w, h, d, c, x = 0, y = 0, z = 0, o = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o));
  m.position.set(x, y + h / 2, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  g.add(m);
  return m;
};
const cyl = (g, r, h, c, x = 0, y = 0, z = 0, o = {}) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 12), mat(c, o));
  m.position.set(x, y + h / 2, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.rz) m.rotation.z = o.rz;
  g.add(m);
  return m;
};
const ring = (g, R, r, c, x, y, z, o = {}) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, 32, o.arc ?? Math.PI * 2), mat(c, o));
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.rz) m.rotation.z = o.rz;
  g.add(m);
  return m;
};
// carved marks on a face (dark notches): the kit's own glyphs, never letters
const notches = (g, w, h, z, c, y0 = 0.3) => {
  for (let i = 0; i < 6; i++) box(g, 0.05 + (i % 3) * 0.04, 0.12, 0.02, c, -w / 2 + 0.12 + (i * (w - 0.24)) / 5, y0 + (i % 2) * (h * 0.3), z);
};

const KITS = {
  // the settlement: a waist-high telling-stone with carved rows
  tellingStone(g) { box(g, 1.1, 1.3, 0.45, 0xc8c0b0, 0, 0, 0, STONE); notches(g, 1.1, 1.0, 0.24, 0x3a342a, 0.35); },
  carvedStone(g) { box(g, 0.7, 0.5, 0.5, 0xd8d0c0, 0, 0, 0, { ...STONE, ry: 0.3 }); notches(g, 0.6, 0.3, 0.26, 0x3a342a, 0.15); },
  stele(g) { box(g, 1.6, 2.6, 0.4, 0xd0c8b8, 0, 0, 0, STONE); notches(g, 1.4, 2.0, 0.21, 0x3a342a, 0.6); },
  altar(g) { box(g, 1.4, 0.8, 0.9, 0xc8c0b0, 0, 0, 0, STONE); box(g, 1.5, 0.08, 1.0, 0xb8b0a0, 0, 0.8, 0, STONE); },
  riverStone(g) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(0x7a7a70, { rough: 0.9 })); m.scale.set(1.2, 0.7, 1); m.position.y = 0.3; g.add(m); },
  sluice(g) { box(g, 0.25, 1.6, 0.25, 0xb08a60, -0.7, 0, 0, WOOD); box(g, 0.25, 1.6, 0.25, 0xb08a60, 0.7, 0, 0, WOOD); box(g, 1.6, 0.25, 0.25, 0xb08a60, 0, 1.5, 0, WOOD); box(g, 1.2, 0.9, 0.06, 0xa07a50, 0, 0.4, 0.02, WOOD); cyl(g, 0.08, 1.0, 0x6a4a2a, 0, 0.5, 0.2); },
  muralPanel(g) { box(g, 1.4, 1.6, 0.12, 0xffffff, 0, 0, 0, { rough: 0.9, tex: 'mural' }); },
  cairn(g) { for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4 - i * 0.07, 8, 6), mat(0x8a8478, { rough: 0.95 })); m.scale.y = 0.6; m.position.y = 0.2 + i * 0.26; g.add(m); } },
  // the observatory: a bronze plate on a stone post, a shard, the dates ring
  bronzePlate(g) { box(g, 0.4, 1.0, 0.4, 0xd0c4ac, 0, 0, 0, STONE); box(g, 0.9, 0.06, 0.6, 0xa8743a, 0, 1.0, 0, { metal: 0.8, rough: 0.35, rx: -0.4 }); },
  bronzeShard(g) { box(g, 0.5, 0.06, 0.3, 0x7a5a38, 0, 0.6, 0, { metal: 0.7, rough: 0.45, ry: 0.6 }); box(g, 0.6, 0.6, 0.6, 0xd0c4ac, 0, 0, 0, STONE); },
  datesRing(g) { box(g, 0.6, 0.6, 0.6, 0x8a8478, 0, 0, 0, STONE); ring(g, 0.26, 0.03, 0xa8743a, 0, 0.62, 0, { rx: Math.PI / 2, metal: 0.8, rough: 0.35 }); },
  // Rain City: a news box, a phone booth, an ad board
  newsBox(g) { box(g, 0.5, 0.95, 0.45, 0x4a7aaa, 0, 0, 0, PANEL); box(g, 0.42, 0.3, 0.02, 0xffffff, 0, 0.55, 0.23, PAPER); },
  phoneBooth(g) { box(g, 1.0, 2.3, 1.0, 0x4a5058, 0, 0, 0, PANEL); box(g, 0.8, 1.3, 0.02, 0x9fd8ff, 0, 0.8, 0.51, { basic: true, opacity: 0.4 }); },
  adBoard(g) { box(g, 0.2, 2.2, 0.2, 0x2a2e34); box(g, 1.8, 1.0, 0.12, 0xbfe4ff, 0, 1.6, 0, { basic: true }); },
  // Helix: a lectern with a file, a recorder on a stand, a glass case, a staff badge on a peg
  lectern(g) { box(g, 0.5, 1.0, 0.4, 0xf0f2f4, 0, 0, 0, PANEL); box(g, 0.7, 0.05, 0.5, 0xe0e4e8, 0, 1.0, 0, { ...PANEL, rx: -0.35 }); box(g, 0.4, 0.03, 0.3, 0xffffff, 0, 1.06, 0.03, { ...PAPER, rx: -0.35 }); },
  recorder(g) { box(g, 0.35, 1.0, 0.35, 0x5a5e64, 0, 0, 0, PANEL); box(g, 0.5, 0.18, 0.35, 0x2a2d32, 0, 1.0); ring(g, 0.06, 0.015, 0x9aa0a6, -0.1, 1.2, 0.0, { metal: 0.6 }); ring(g, 0.06, 0.015, 0x9aa0a6, 0.1, 1.2, 0.0, { metal: 0.6 }); box(g, 0.08, 0.06, 0.02, 0xff6a48, 0.15, 1.08, 0.18, { basic: true }); },
  fileFolder(g) { box(g, 0.32, 0.03, 0.42, 0xd8c08a, 0, 0.78); box(g, 0.28, 0.01, 0.38, 0xffffff, 0, 0.81, 0, PAPER); },
  glassCase(g) { box(g, 0.9, 1.0, 0.6, 0xe8ecf0, 0, 0, 0, PANEL); box(g, 0.86, 0.6, 0.56, 0xcfe4ff, 0, 1.0, 0, { basic: true, opacity: 0.25 }); },
  badge(g) { box(g, 0.1, 0.14, 0.02, 0xeef0f2, 0, 1.4); },
  // Old Town: a ledger on a shop counter, a brass plate, a clock case, the escapement on its bench
  ledger(g) { box(g, 1.2, 0.95, 0.6, 0x9a7050, 0, 0, 0, WOOD); box(g, 0.5, 0.06, 0.36, 0x6a2a1a, 0, 0.95); box(g, 0.46, 0.02, 0.34, 0xffffff, 0, 1.0, 0, PAPER); },
  brassPlate(g) { box(g, 0.5, 0.35, 0.03, 0xc89a4a, 0, 1.1, 0, { metal: 0.85, rough: 0.3 }); },
  clockCase(g) { box(g, 0.6, 1.9, 0.4, 0x9a6a44, 0, 0, 0, WOOD); cyl(g, 0.22, 0.04, 0xf4f0e4, 0, 1.45, 0.21, { rx: Math.PI / 2 }); ring(g, 0.23, 0.02, 0xc89a4a, 0, 1.45, 0.23, { metal: 0.85, rough: 0.3 }); },
  escapement(g) { box(g, 1.2, 0.85, 0.7, 0x9a6a44, 0, 0, 0, WOOD); ring(g, 0.32, 0.03, 0xc89a4a, 0, 1.2, 0, { metal: 0.85, rough: 0.3 }); ring(g, 0.18, 0.025, 0xc89a4a, 0.3, 1.05, 0.05, { metal: 0.85, rough: 0.3 }); },
  crate(g) { box(g, 0.9, 0.8, 0.7, 0xffffff, 0, 0, 0, { rough: 0.85, tex: 'crate' }); },
  // the old hall's sweeping arm: a brass bar from the pivot, both ways
  brassArm(g, r = 7) { box(g, r * 2, 0.12, 0.16, 0xc89a4a, 0, -0.06, 0, { metal: 0.85, rough: 0.3 }); cyl(g, 0.2, 0.3, 0x8a6a3a, 0, -0.15, 0, { metal: 0.8 }); },
  // --- Acts II-IV and the Finale (U3) -----------------------------------------------------------------
  // Northbank: an iron-framed notice board, the evacuation order board, an enamel street sign, a clock on a post
  noticeBoard(g) { box(g, 0.1, 1.9, 0.1, 0x2e3238, -0.7); box(g, 0.1, 1.9, 0.1, 0x2e3238, 0.7); box(g, 1.5, 1.0, 0.06, 0x5a7a6a, 0, 0.9, 0, PANEL); box(g, 1.3, 0.8, 0.02, 0xffffff, 0, 1.0, 0.04, PAPER); },
  orderBoard(g) { box(g, 1.8, 2.4, 0.15, 0x4a5a54, 0, 0, 0, PANEL); box(g, 1.6, 1.6, 0.02, 0xffffff, 0, 0.6, 0.09, PAPER); box(g, 1.6, 0.25, 0.03, 0xc83a2a, 0, 2.0, 0.09); },
  enamelSign(g) { box(g, 0.08, 1.6, 0.08, 0x2e3238); box(g, 0.7, 0.3, 0.03, 0x1e3a6a, 0, 1.5, 0.05); },
  clockPost(g) { cyl(g, 0.09, 3.2, 0x2e3238); cyl(g, 0.38, 0.12, 0xf4f0e4, 0, 3.0, 0.08, { rx: Math.PI / 2 }); ring(g, 0.4, 0.04, 0x2e3238, 0, 3.0, 0.1); },
  // the dam: a logbook on a steel stand, the intake board, a tag on a rail, a switch panel
  logbook(g) { box(g, 0.08, 1.0, 0.08, 0x7a8088); box(g, 0.5, 0.06, 0.36, 0xa8b0b8, 0, 1.0, 0, { ...PANEL, rx: -0.3 }); box(g, 0.34, 0.04, 0.26, 0x2a3a5a, 0, 1.06, 0.02, { rx: -0.3 }); },
  intakeBoard(g) { box(g, 1.6, 1.8, 0.1, 0x6a7078, 0, 0.6, 0, PANEL); for (let i = 0; i < 4; i++) box(g, 0.3, 0.4, 0.02, 0xffffff, -0.55 + i * 0.37, 1.6, 0.06, PAPER); },
  tagPlate(g) { box(g, 0.9, 0.9, 0.1, 0x7a8088, 0, 0, 0, PANEL); box(g, 0.3, 0.2, 0.02, 0xffc44a, 0, 0.7, 0.06); },
  switchPanel(g) { box(g, 1.2, 1.8, 0.5, 0x8a9098, 0, 0, 0, PANEL); box(g, 0.2, 0.4, 0.1, 0xff6a48, -0.3, 1.1, 0.28); box(g, 0.2, 0.4, 0.1, 0x9fd8ff, 0.3, 1.1, 0.28); },
  // the hospital: a chart board on wheels, a whiteboard, a wristband in a tray, a bedside cabinet
  chartBoard(g) { box(g, 0.6, 0.06, 0.4, 0xd0d4d8, 0, 0.1); box(g, 0.06, 1.2, 0.06, 0xd0d4d8, 0, 0.1); box(g, 0.5, 0.65, 0.04, 0xf4f6f8, 0, 1.0, 0, { rx: -0.2 }); },
  whiteboard(g) { box(g, 1.8, 1.1, 0.06, 0xf8f8f8, 0, 0.9); box(g, 1.9, 0.06, 0.12, 0x9aa0a6, 0, 0.85); box(g, 0.08, 0.9, 0.08, 0x9aa0a6, -0.8); box(g, 0.08, 0.9, 0.08, 0x9aa0a6, 0.8); },
  wristband(g) { box(g, 0.5, 0.8, 0.4, 0xe8eef0); box(g, 0.2, 0.02, 0.06, 0x3f9cff, 0, 0.81); },
  bedside(g) { box(g, 0.6, 0.8, 0.5, 0xe8eef0); box(g, 0.5, 0.04, 0.4, 0xc8d0d4, 0, 0.8); cyl(g, 0.05, 0.25, 0xe86a9c, 0.1, 0.82, 0); },
  // the port: a field-order board on an easel among sandbags, a sign on sandbags, a helmet, a device case
  fieldBoard(g) { box(g, 1.4, 0.5, 0.8, 0xc8b88a, 0, 0, 0, CANVAS); box(g, 0.08, 1.8, 0.08, 0x5a4a3a, -0.5, 0.3, -0.2, { rx: 0.15 }); box(g, 0.08, 1.8, 0.08, 0x5a4a3a, 0.5, 0.3, -0.2, { rx: 0.15 }); box(g, 1.1, 0.8, 0.03, 0xffffff, 0, 1.1, -0.05, { ...PAPER, rx: -0.15 }); },
  sandbagSign(g) { box(g, 1.8, 0.9, 0.9, 0xc8b88a, 0, 0, 0, CANVAS); box(g, 1.4, 0.7, 0.04, 0xd8c8a0, 0, 1.0, 0.1, WOOD); },
  helmet(g) { box(g, 0.7, 0.6, 0.7, 0x5a5048); const m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4a5a64, { rough: 0.6 })); m.position.y = 0.6; g.add(m); },
  deviceCase(g) { box(g, 0.9, 0.5, 0.6, 0x4a5058, 0, 0, 0, PANEL); box(g, 0.5, 0.04, 0.3, 0xffc44a, 0, 0.5, 0, { emissive: 0x442200 }); },
  // the lagoon city: a beacon case, a warden's sign, a stack of stones, the memorial's core plinth
  beaconCase(g) { box(g, 0.8, 0.8, 0.5, 0xb09a78, 0, 0, 0, WOOD); box(g, 0.6, 0.1, 0.3, 0x9fff7a, 0, 0.8, 0, { emissive: 0x204010 }); },
  wardenSign(g) { box(g, 0.1, 2.0, 0.1, 0x7a4a2a); box(g, 1.4, 0.8, 0.05, 0xe8d8b8, 0, 1.5, 0.05, { ...WOOD, rz: 0.05 }); box(g, 1.4, 0.12, 0.06, 0xb83a2a, 0, 1.85, 0.05, { rz: 0.05 }); },
  stackedStones(g) { for (let i = 0; i < 4; i++) box(g, 0.5 - i * 0.08, 0.16, 0.4 - i * 0.06, 0x8a8a7a, (i % 2) * 0.04, i * 0.16, 0, { ry: i * 0.6 }); },
  memorialCore(g) { box(g, 1.2, 1.0, 1.2, 0xe0dcd0, 0, 0, 0, STONE); cyl(g, 0.2, 0.3, 0xc9b8ff, 0, 1.0, 0, { emissive: 0x302050 }); },
  // the lock city: a timetable board, the archive's card cabinet, the register on a lectern, the lock console
  timetable(g) { box(g, 0.12, 2.6, 0.12, 0x5a5a60, -1.0); box(g, 0.12, 2.6, 0.12, 0x5a5a60, 1.0); box(g, 2.2, 1.0, 0.12, 0x1a1c22, 0, 1.6); for (let i = 0; i < 4; i++) box(g, 1.9, 0.12, 0.02, 0xffc860, 0, 1.7 + i * 0.2, 0.07); },
  cardCabinet(g) { box(g, 1.2, 1.3, 0.6, 0xb08a60, 0, 0, 0, WOOD); for (let i = 0; i < 6; i++) box(g, 0.32, 0.14, 0.02, 0xc8a870, -0.38 + (i % 3) * 0.38, 0.4 + Math.floor(i / 3) * 0.45, 0.31, { metal: 0.6, rough: 0.4 }); },
  registerBook(g) { box(g, 0.5, 1.0, 0.4, 0xc0b098, 0, 0, 0, WOOD); box(g, 0.5, 0.05, 0.36, 0x3a5a8a, 0, 1.0, 0, { rx: -0.3 }); },
  lockConsole(g) { box(g, 1.4, 1.0, 0.8, 0xe0d8e8, 0, 0, 0, PANEL); box(g, 1.0, 0.04, 0.5, 0xfff0c8, 0, 1.0, 0, { emissive: 0x403020 }); },
  // the quarry museum: a display case with a lantern, a label plinth, a small curio box, a reel on a stand
  museumCase(g) { box(g, 0.9, 0.9, 0.6, 0x9a7a5a, 0, 0, 0, WOOD); box(g, 0.86, 0.6, 0.56, 0xe0ecf4, 0, 0.9, 0, { basic: true, opacity: 0.22 }); box(g, 0.2, 0.2, 0.2, 0xffc27a, 0.3, 1.55, 0, { basic: true }); },
  museumLabel(g) { box(g, 0.5, 1.0, 0.3, 0xa08a6a, 0, 0, 0, WOOD); box(g, 0.6, 0.04, 0.4, 0xffffff, 0, 1.0, 0, { ...PAPER, rx: -0.4 }); },
  curioBox(g) { box(g, 0.6, 0.9, 0.6, 0xa08a6a, 0, 0, 0, WOOD); box(g, 0.3, 0.2, 0.25, 0x9a7a4a, 0, 0.9, 0, { metal: 0.5, rough: 0.5 }); },
  reelStand(g) { box(g, 0.5, 1.0, 0.4, 0x7a6a5a, 0, 0, 0, WOOD); ring(g, 0.22, 0.05, 0x4a3a2a, -0.13, 1.25, 0); ring(g, 0.22, 0.05, 0x4a3a2a, 0.13, 1.25, 0); },
  // the desert array: a rack of recording drums, a tag on a dish rail, an evidence tray, a reel player
  drumRack(g) { box(g, 1.6, 2.0, 0.6, 0x3a3e44, 0, 0, 0, { metal: 0.5 }); for (let i = 0; i < 3; i++) cyl(g, 0.2, 0.5, 0xc89a4a, -0.5 + i * 0.5, 1.2, 0.2, { rz: Math.PI / 2, metal: 0.7 }); },
  recordingTag(g) { box(g, 0.12, 1.4, 0.12, 0x8a9096); box(g, 0.6, 0.4, 0.03, 0xff3a2a, 0, 1.2, 0.07); },
  evidenceTray(g) { box(g, 1.0, 0.85, 0.6, 0x8a8078, 0, 0, 0, PANEL); box(g, 0.9, 0.06, 0.5, 0x9aa0a6, 0, 0.85); box(g, 0.3, 0.01, 0.4, 0xffffff, -0.2, 0.91, 0, PAPER); },
  reelPlayer(g) { box(g, 0.9, 1.0, 0.5, 0x8a7058, 0, 0, 0, WOOD); ring(g, 0.2, 0.04, 0x2a2420, -0.2, 1.25, 0.1); ring(g, 0.2, 0.04, 0x2a2420, 0.2, 1.25, 0.1); },
  // the Fracture: Sera's manual on a crate, a road sign, the evacuation list, the anchor panel
  manualStand(g) { box(g, 0.9, 0.8, 0.7, 0xffffff, 0, 0, 0, { rough: 0.85, tex: 'crate' }); box(g, 0.5, 0.04, 0.36, 0xffffff, 0, 0.82, 0, { ...PAPER, rx: -0.2 }); },
  roadSignKit(g) { box(g, 0.1, 2.2, 0.1, 0x8a9096); box(g, 1.6, 0.8, 0.05, 0x1e5a3a, 0, 2.0, 0.05); },
  evacList(g) { box(g, 0.1, 1.6, 0.1, 0x7a4a2a); box(g, 0.5, 0.7, 0.03, 0xffffff, 0, 1.2, 0.06, PAPER); },
  anchorPanel(g) { box(g, 1.0, 1.6, 0.4, 0x7a7a80, 0, 0, 0, PANEL); box(g, 0.6, 0.2, 0.04, 0xff3a2a, 0, 1.3, 0.22, { emissive: 0x401010 }); },
  // the Unwritten Second: a symbol stone, a mirror plate, a chalk mark, a door frame standing alone
  symbolStone(g) { box(g, 0.9, 1.1, 0.4, 0xfffcf4, 0, 0, 0, STONE); ring(g, 0.25, 0.04, 0xd8b060, 0, 0.75, 0.21); },
  mirrorPlate(g) { box(g, 1.6, 0.06, 1.0, 0xe8e4f8, 0, 0.02); box(g, 0.1, 1.0, 0.1, 0xd8b060, -0.75); },
  chalkMark(g) { box(g, 0.6, 0.4, 0.6, 0xe4e0d8, 0, 0, 0, { ry: 0.4 }); },
  doorFrame(g) { box(g, 0.12, 2.3, 0.15, 0xf4f4f0, -0.55); box(g, 0.12, 2.3, 0.15, 0xf4f4f0, 0.55); box(g, 1.22, 0.12, 0.15, 0xf4f4f0, 0, 2.3); },
  // Mira's memory: a note on a fridge, the drawing in a frame, a keepsake box, a child's chair
  fridgeNote(g) { box(g, 0.7, 1.8, 0.6, 0xf8f8f4, 0, 0, 0, PANEL); box(g, 0.25, 0.3, 0.01, 0xfff0a0, 0.1, 1.2, 0.305, PAPER); box(g, 0.04, 0.4, 0.03, 0x9aa0a6, -0.28, 1.0, 0.31, { metal: 0.6 }); },
  drawingFrame(g) { box(g, 0.1, 1.2, 0.1, 0x8a6a4a); box(g, 0.9, 0.7, 0.04, 0xffffff, 0, 1.2, 0.04, { rough: 0.9, tex: 'mural' }); },
  keepsake(g) { box(g, 0.5, 0.75, 0.4, 0xffffff, 0, 0, 0, { rough: 0.9, tex: 'cardboard' }); box(g, 0.3, 0.12, 0.2, 0xffd040, 0, 0.75); },
  memoryChair(g) { box(g, 0.45, 0.45, 0.45, 0xffd040); box(g, 0.45, 0.5, 0.06, 0xffd040, 0, 0.45, -0.2); },
  // the Spire: a black lectern, an order screen, an elite's badge on a plinth, the citadel console
  commandLectern(g) { box(g, 0.5, 1.0, 0.4, 0x2a2c32, 0, 0, 0, { metal: 0.4 }); box(g, 0.7, 0.05, 0.5, 0x1a3a6a, 0, 1.0, 0, { rx: -0.35, emissive: 0x0a1a30 }); },
  orderScreen(g) { box(g, 0.12, 1.4, 0.12, 0x2a2c32); box(g, 1.6, 1.0, 0.06, 0x0a1a30, 0, 1.4, 0, { emissive: 0x0a2040 }); },
  eliteBadge(g) { box(g, 0.6, 0.9, 0.6, 0x2a2c32); ring(g, 0.14, 0.03, 0xffc44a, 0, 1.05, 0, { metal: 0.8 }); },
  citadelConsole(g) { box(g, 1.6, 1.0, 0.8, 0x2a2c32, 0, 0, 0, { metal: 0.5 }); box(g, 1.2, 0.04, 0.5, 0x9fd8ff, 0, 1.0, 0, { emissive: 0x103040 }); },
  // the composites: the evidence table, the chain wall, a quote stone, a seal plinth
  evidenceTable(g) { box(g, 2.0, 0.85, 0.9, 0x8a6a4a, 0, 0, 0, WOOD); for (let i = 0; i < 4; i++) box(g, 0.3, 0.02, 0.4, 0xffffff, -0.7 + i * 0.47, 0.86, 0, { ...PAPER, ry: (i - 1.5) * 0.15 }); },
  chainWall(g) { box(g, 2.4, 2.0, 0.4, 0xd0c8b8, 0, 0, 0, STONE); box(g, 2.0, 1.4, 0.02, 0xffffff, 0, 0.4, 0.21, PAPER); },
  quoteStone(g) { box(g, 0.8, 0.6, 0.6, 0xc8c0b0, 0, 0, 0, { ...STONE, ry: 0.2 }); },
  sealPlinth(g) { box(g, 1.0, 1.0, 1.0, 0x9a9aa0, 0, 0, 0, STONE); ring(g, 0.35, 0.06, 0x9a7a4a, 0, 1.05, 0, { rx: Math.PI / 2, metal: 0.8 }); },
};

export function makeKit(name, arg) {
  const g = new THREE.Group();
  (KITS[name] || KITS.carvedStone)(g, arg);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.kit = name;
  return g;
}

export const KIT_NAMES = Object.keys(KITS);

// a faint glint over a record not yet read (it goes when the fragment is read)
export function makeGlint(color = 0xffe2b0) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), mat(color, { basic: true }));
  g.add(m);
  g.userData.gem = m;
  return g;
}
