// THE LAST VERSION OF EARTH: an echo who looks like somebody (playtest v2.1 F16).
// A hologram person (Actors.js) wears one flat glow on every surface, and in the pale glows of Helix's people (crewGlow:
// their colour lifted toward white) Lin in the containment cube, the morning's echoes and Ezra at sixty-five read as white
// mannequins. A mission that wants its echoes known lends each one the textures of the same person in the flesh, dressed
// the same way (People.makeCrewModel through the edition's dresser), under a faint tint of the glow: a translucent face,
// hair and clothes. The hologram's transparency, its fade and its cut-out hair stay as they were.
import * as THREE from '../../../vendor/three.module.min.js';
import { makeCrewModel } from '../../world/People.js';

const meshes = (root) => {
  const out = [];
  root.traverse((o) => { if (o.isMesh) out.push(o); });
  return out;
};

// one model (a hologram's root, as DeckWorld built it for this crew); once
export function lendLook(model, crew, height) {
  const U = model?.userData;
  if (!U || U.lvLook) return false;
  U.lvLook = true; // (once, whatever comes of it)
  if (!U.spec?.hologram || !crew) return false;
  let ref;
  try {
    ref = makeCrewModel(crew, { hologram: false, height: height || U.spec.height });
  } catch {
    return false;
  }
  const a = meshes(model), b = ref ? meshes(ref) : [];
  const same = ref?.userData?.spec?.model === U.spec.model && a.length === b.length;
  if (same) {
    const glow = new THREE.Color(U.spec.glow ?? 0x8fe0ff);
    a.forEach((o, i) => {
      const ms = [].concat(o.material), rs = [].concat(b[i].material);
      ms.forEach((m, k) => {
        const r = rs[k];
        if (!m?.isMeshStandardMaterial || m.alphaTest > 0 || !r?.map) return;
        m.map = r.map;
        m.color.set(0xffffff).lerp(glow, 0.3);
        m.emissive.copy(glow);
        m.emissiveIntensity = 0.16;
        m.needsUpdate = true;
      });
    });
  }
  // (the stand-in's own pieces: its materials are clones, its garments may have geometry of their own; the textures
  // are the shared, cached ones the echo now wears)
  ref?.traverse((x) => {
    if (!x.isMesh) return;
    if (x.userData.ownGeometry) x.geometry.dispose();
    for (const m of [].concat(x.material)) m?.dispose?.();
  });
  return same;
}

// every echo of a mission's people that is a hologram (its own body, or the echo a temporal person leaves in other
// years), as it first comes into view: one person's textures at a time, never a whole place's at its first frame
export function lendLooks(g, filter = () => true) {
  for (const e of g.deckWorld?.npcs || []) {
    if (!filter(e.n)) continue;
    if (e.n.hologram && e.model?.visible && !e.model.userData?.lvLook) return lendLook(e.model, e.crew, e.n.height);
    if (e.echo?.visible && !e.echo.userData?.lvLook) return lendLook(e.echo, e.crew, e.n.height);
  }
  return false;
}
