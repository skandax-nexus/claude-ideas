// THE LAST VERSION OF EARTH: the places (OVERHAUL.md §3.1, §4). PLACES is the registry; buildPlace
// turns one place into the level of one mission's sector (D2 step 1: sector i loads the whole map
// and activates quarter i: its spawn, its beat's set piece, its exit at the quarter's threshold).
//
//   level.place     the place key          level.landmarks  { name: [x, y, z, yaw] }
//   level.quarters  [{ name, area, spawn, threshold }]
//   level.years     { PRESENT: {...}, PAST: {...}, FUTURE: {...} } (this mission's years only)
//   level.scenery   (root, rt) => ({ setEra, update, refresh, dispose })   (browser only)
//   level.crowd     [{ era, region, role, path, n }]                        (U4's crowds)
//   level.sites     { processId: { at, parts } }                            (U1's REVERSE)
import { Place, stageBeat, assemble, yearsFor, signature, quartersOf } from './Place.js';
import { SKIES, themeOf, sunVector } from './years.js';
import { STYLES } from './styles.js';
import * as A from './archetypes.js';
import { mountPlace } from './mount.js';
import rain_south from './specs/rain_south.js';
import helix from './specs/helix.js';
import helix_v17 from './specs/helix_v17.js';
import valley_upper from './specs/valley_upper.js';
import valley_river from './specs/valley_river.js';
import oldtown from './specs/oldtown.js';
import observatory from './specs/observatory.js';
import northbank from './specs/northbank.js';
import dam from './specs/dam.js';
import hospital from './specs/hospital.js';
import warport from './specs/warport.js';
import drowned from './specs/drowned.js';
import lockcity from './specs/lockcity.js';
import sinkhole from './specs/sinkhole.js';
import array from './specs/array.js';
import fracture from './specs/fracture.js';
import unwritten from './specs/unwritten.js';
import memory from './specs/memory.js';
import spire from './specs/spire.js';
import firstsecond from './specs/firstsecond.js';
import afterzero from './specs/afterzero.js';

export const PLACES = { rain_south, helix, helix_v17, valley_upper, valley_river, oldtown, observatory, northbank, dam, hospital, warport, drowned, lockcity, sinkhole, array, fracture, unwritten, memory, spire, firstsecond, afterzero };
export { yearsFor, signature, quartersOf, SKIES };

// the palette DeckWorld lights its own few pieces with (doors, the train): the style's, with this
// mission's default year (never a Vessel look)
function paletteFor(spec, years) {
  const st = STYLES[spec.style] || {};
  const y = years.PRESENT || Object.values(years)[0] || {};
  return { ...st.palette, fog: y.fog ?? st.palette?.fog, night: y.night ?? 0, weather: y.weather ?? null, sky: y.ibl || st.palette?.sky || 'dusk', grade: y.grade || {}, density: 1, probe: false, ...(y.emergency ? { emergency: y.emergency } : {}) };
}

export function buildPlace(key, story, si, rt, opts = {}) {
  const spec = PLACES[key];
  if (!spec) throw new Error(`no place ${key}`);
  const deck = opts.deck;
  const rid = `${deck.mkey}_${key}`;
  const P = new Place(spec, { key, rid, deck, si, seed: key });
  const ctx = { deck, si, wing: deck.wing, mission: deck.mkey, story, rt, A };
  // a mission's own rooms come first, so the place builds round them (Helix's wings round M2's and M3's rooms)
  if (typeof deck.rooms === 'function') deck.rooms(P, story, si, rt);
  spec.build(P, ctx);
  A.edges(P, spec.edges);
  // the mission's set pieces, placed on the place's landmarks
  if (deck.overlay) deck.overlay(P, si, ctx);
  // the quarters: each is somewhere to come back to
  // (a quarter's spawn is a landmark: Kai faces the way the landmark faces)
  const quarters = quartersOf(spec, deck);
  P.quarterSpawns = quarters.map((q) => (q.spawn ? q.spawn : ((l) => [l[0], l[1], l[2], l[3] + Math.PI])(P.at(q.spawnAt))));
  quarters.forEach((q, i) => {
    const s = P.quarterSpawns[i];
    const [x0, z0, x1, z1] = q.area;
    P.checkpoints.push({ box: [x0, -12, z0, x1, 30, z1], spawn: [s[0], s[1] + 0.86, s[2], s[3] || 0], room: rid });
  });
  // this sector's beat, at its landmark
  const beat = deck.beats?.[si];
  if (beat) stageBeat(P, story, deck, si, beat, rid);
  // three memory fragments, each a kit prop at a landmark of this quarter
  const lore = story.fragments?.[story.decks.indexOf(deck)] || [];
  const fspots = spec.frags?.[deck.mkey]?.[si] || quarters[si]?.frags || [];
  fspots.forEach((name, k) => {
    const text = lore[si * 3 + k];
    if (!text || !P.landmarks[name]) return;
    const [x, y, z, yaw] = P.landmarks[name];
    P.inter.push({ id: `frag_${rid}_${si}_${k}`, kind: 'fragment', pos: [x, y + 1.1, z], yaw, r: 2.4, prompt: P.style.kits?.fragmentPrompt || 'LOOK CLOSER', text, n: si * 3 + k, room: rid, kit: P.style.kits?.fragment || 'cairn' });
  });
  // the watchers of this quarter (they patrol ground at y 0: a watcher's eye is fixed at 1.6 m)
  const nw = deck.drones?.[si] ?? 0;
  const paths = spec.watch?.[deck.mkey]?.[si] || quarters[si]?.watch || [];
  for (let k = 0; k < Math.min(nw, paths.length); k++) P.sentinels.push({ path: paths[k], speed: 2.0 + si * 0.2, range: 9, fov: 0.75, room: rid, id: `${rid}_s${k}` });
  // the way on: at this quarter's threshold, or for the last sector the mission's exit landmark
  if (!P.exit) {
    const last = si >= (deck.sectors || 1) - 1;
    // (spec.sectors[mkey]: a mission with fewer sectors than the place has quarters, each sector its first
    // quarter; a sector's way on is the threshold of the last quarter it spans)
    const qmap = spec.sectors?.[deck.mkey];
    const exName = last ? spec.exits?.[deck.mkey] || deck.exitAt : quarters[qmap ? qmap[si + 1] - 1 : si]?.threshold?.at;
    if (exName && P.landmarks[exName]) {
      const [x, y, z] = P.landmarks[exName];
      const g = spec.gates?.[deck.mkey];
      P.exit = { room: rid, box: [x - 2, y - 1, z - 2, x + 2, y + 5, z + 2] };
      P.exitAt = [x, y, z];
      // the gate: shut until the quarter's scene is done (a real gate where the place has one)
      const gb = g?.box || [x - 1.8, y, z - 0.3, x + 1.8, y + 3.4, z + 0.3];
      P.cols.push({ box: gb, mat: 'door', solid: !!g?.solid, when: '!beat_done', id: `gate_${rid}`, room: rid, lvMat: g?.mat || 'gateVeil', ghost: !g?.visible });
    }
  }
  const years = yearsFor(spec, deck);
  const level = assemble(P, { story, deck, si, beat, years, palette: paletteFor(spec, years), name: opts.name });
  // mounted by the runtime in the browser, once DeckWorld has built the level (mount.js: the scenery,
  // the sky and the horizon into the level's root): { setEra, setYear, refresh, update, dispose }
  level.scenery = (root, rt) => mountPlace(rt);
  level.heightAt = (x, z) => P.heightAt(x, z); // the ground under a point (the crowds stand on it: crowds.js)
  return level;
}

// what main.js's lights take from the current year of a place (edition.themeFor)
export function themeFor(level, state) {
  const y = level?.years?.[state];
  if (!y) return null;
  const c = (level._themes ||= {}); // (asked every frame: one object per year)
  return (c[state] ||= themeOf(y));
}

// where the sun shines from, as an offset from the player for the shadow camera (edition.sunDir)
export function sunDir(level, state) {
  const y = level?.years?.[state];
  if (!y) return null;
  const c = (level._suns ||= {}); // (asked every frame: one array per year, so main.js sees the same numbers)
  if (c[state]) return c[state];
  const [x, yy, z] = sunVector(y.sun);
  const up = Math.max(0.28, yy); // a sun under 16° would stretch the shadows beyond the shadow map
  const k = 26 / Math.hypot(x, up, z);
  return (c[state] = [x * k, up * k, z * k]);
}
