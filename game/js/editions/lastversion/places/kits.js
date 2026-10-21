// THE LAST VERSION OF EARTH: records, fragments and set pieces as things of their place (OVERHAUL.md
// §4.6 rule 5): a telling-stone, a ledger on a lectern, a bronze plate, a phone booth, a cairn, a glass
// case... never a Station Zero terminal or a HALCYON crystal. Each kit is a small group with its
// origin on the ground, facing +z; mount.js puts it where the record stands.
import * as THREE from '../../../../vendor/three.module.min.js';

const _mats = new Map();
function mat(color, o = {}) {
  const k = `${color}|${JSON.stringify(o)}`;
  if (!_mats.has(k)) {
    const m = o.basic ? new THREE.MeshBasicMaterial({ color, transparent: !!o.opacity, opacity: o.opacity ?? 1 }) : new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity });
    m.userData.keep = true;
    _mats.set(k, m);
  }
  return _mats.get(k);
}
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
  tellingStone(g) { box(g, 1.1, 1.3, 0.45, 0x8a8274, 0, 0, 0, { rough: 0.95 }); notches(g, 1.1, 1.0, 0.24, 0x3a342a, 0.35); },
  carvedStone(g) { box(g, 0.7, 0.5, 0.5, 0x9a9282, 0, 0, 0, { rough: 0.95, ry: 0.3 }); notches(g, 0.6, 0.3, 0.26, 0x3a342a, 0.15); },
  stele(g) { box(g, 1.6, 2.6, 0.4, 0x9a9080, 0, 0, 0, { rough: 0.95 }); notches(g, 1.4, 2.0, 0.21, 0x3a342a, 0.6); },
  altar(g) { box(g, 1.4, 0.8, 0.9, 0x8a8274, 0, 0, 0, { rough: 0.95 }); },
  riverStone(g) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(0x7a7a70, { rough: 0.9 })); m.scale.set(1.2, 0.7, 1); m.position.y = 0.3; g.add(m); },
  sluice(g) { box(g, 0.25, 1.6, 0.25, 0x6a4a2a, -0.7); box(g, 0.25, 1.6, 0.25, 0x6a4a2a, 0.7); box(g, 1.6, 0.25, 0.25, 0x6a4a2a, 0, 1.5); cyl(g, 0.08, 1.0, 0x6a4a2a, 0, 0.5, 0.2); },
  muralPanel(g) { box(g, 1.4, 1.6, 0.12, 0xe8e0cc); },
  cairn(g) { for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4 - i * 0.07, 8, 6), mat(0x8a8478, { rough: 0.95 })); m.scale.y = 0.6; m.position.y = 0.2 + i * 0.26; g.add(m); } },
  // the observatory: a bronze plate on a stone post, a shard, the dates ring
  bronzePlate(g) { box(g, 0.4, 1.0, 0.4, 0x8a7a62); box(g, 0.9, 0.06, 0.6, 0xa8743a, 0, 1.0, 0, { metal: 0.8, rough: 0.35, rx: -0.4 }); },
  bronzeShard(g) { box(g, 0.5, 0.06, 0.3, 0x7a5a38, 0, 0.05, 0, { metal: 0.7, rough: 0.45, ry: 0.6 }); box(g, 0.6, 0.4, 0.6, 0x8a7a62); },
  datesRing(g) { box(g, 0.6, 0.6, 0.6, 0x4a4844); },
  // Rain City: a news box, a phone booth, an ad board
  newsBox(g) { box(g, 0.5, 0.95, 0.45, 0x2a5a8a, 0, 0, 0, { rough: 0.5 }); box(g, 0.42, 0.3, 0.02, 0xd8d8d0, 0, 0.55, 0.23); },
  phoneBooth(g) { box(g, 1.0, 2.3, 1.0, 0x2a2e36, 0, 0, 0, { rough: 0.4, metal: 0.4 }); box(g, 0.8, 1.3, 0.02, 0x9fd8ff, 0, 0.8, 0.51, { basic: true, opacity: 0.4 }); },
  adBoard(g) { box(g, 0.2, 2.2, 0.2, 0x2a2e34); box(g, 1.8, 1.0, 0.12, 0xbfe4ff, 0, 1.6, 0, { basic: true }); },
  // Helix: a lectern with a file, a recorder on a stand, a glass case, a staff badge on a peg
  lectern(g) { box(g, 0.5, 1.0, 0.4, 0xd8dce0, 0, 0, 0, { rough: 0.4 }); box(g, 0.7, 0.05, 0.5, 0xd8dce0, 0, 1.0, 0, { rx: -0.35 }); box(g, 0.4, 0.03, 0.3, 0xf4f0e4, 0, 1.06, 0.03, { rx: -0.35 }); },
  recorder(g) { box(g, 0.35, 1.0, 0.35, 0x2a2e34); box(g, 0.5, 0.18, 0.35, 0x1a1d22, 0, 1.0); box(g, 0.08, 0.06, 0.02, 0xff6a48, 0.15, 1.08, 0.18, { basic: true }); },
  fileFolder(g) { box(g, 0.32, 0.03, 0.42, 0xd8c08a, 0, 0.78); },
  glassCase(g) { box(g, 0.9, 1.0, 0.6, 0xd8dce0); box(g, 0.86, 0.6, 0.56, 0xcfe4ff, 0, 1.0, 0, { basic: true, opacity: 0.25 }); },
  badge(g) { box(g, 0.1, 0.14, 0.02, 0xeef0f2, 0, 1.4); },
  // Old Town: a ledger on a shop counter, a brass plate, a clock case, the escapement on its bench
  ledger(g) { box(g, 1.2, 0.95, 0.6, 0x5a3a24, 0, 0, 0, { rough: 0.6 }); box(g, 0.5, 0.06, 0.36, 0x6a2a1a, 0, 0.95); box(g, 0.46, 0.02, 0.34, 0xf4ecd8, 0, 1.0); },
  brassPlate(g) { box(g, 0.5, 0.35, 0.03, 0xc89a4a, 0, 1.1, 0, { metal: 0.85, rough: 0.3 }); },
  clockCase(g) { box(g, 0.6, 1.9, 0.4, 0x5a3a24); cyl(g, 0.22, 0.04, 0xf4f0e4, 0, 1.45, 0.21, { rx: Math.PI / 2 }); },
  escapement(g) { box(g, 1.2, 0.85, 0.7, 0x5a3a24); ring(g, 0.32, 0.03, 0xc89a4a, 0, 1.2, 0, { metal: 0.85, rough: 0.3 }); ring(g, 0.18, 0.025, 0xc89a4a, 0.3, 1.05, 0.05, { metal: 0.85, rough: 0.3 }); },
  crate(g) { box(g, 0.9, 0.8, 0.7, 0x8a6440); },
  // the old hall's sweeping arm: a brass bar from the pivot, both ways
  brassArm(g, r = 7) { box(g, r * 2, 0.12, 0.16, 0xc89a4a, 0, -0.06, 0, { metal: 0.85, rough: 0.3 }); cyl(g, 0.2, 0.3, 0x8a6a3a, 0, -0.15, 0, { metal: 0.8 }); },
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
