// THE LAST VERSION OF EARTH: the Finale, AFTERZERO (OVERHAUL.md §5 M23; about 50 minutes), and the three endings.
//
// One road from the 41's shelter to the original Chronolith, held open through the storm by two men with the same
// scar: the Witness holds the street that fell while Kai crosses by switching years; then they swap, and Kai holds
// the settlement's bridge while the Witness crosses (the only time two holds happen). The people Kai's choices
// changed stand along it. At the ring, Mira chooses first; then Kai chooses what to preserve and what to release.
// The ending sequence (Runtime.ending, voicelines.endingLines): the bible's text, what the ending adds, Kai's quote,
// one epilogue line per fact the player set (ledger.EPILOGUE), four clock ticks and the voice in every speaker.
import { intent } from './npcs.js';
import { NO_MODEL } from './processes.js';
import { L, N, K, REV, FX, C, SAYS, person, scarModel } from './act3.js';
import { ringsOfLight, skyPanes, paneDoor, anchorLight, goneLight } from './stagefx.js';

// after the epilogue: four clock ticks, then the voice in every speaker (voicelines.js re-exports it)
export const POSTCREDIT = [{ who: 'VOICE', text: 'Version one hundred and eighteen.', voice: { fx: 'pa' } }];

const M23_HINTS = {
  streets: ['The avenue from the first morning is between me and the hill.', 'Watchers on the avenue, unless Jun\'s passengers cleared it.', 'Get to the fallen street without being seen.'],
  street: ['The street has fallen in.', 'He holds the far half. The near half stood in 2026.', 'Switch to 2026, cross, and step onto what he holds.'],
  settlement: ['The settlement again, and Niko\'s stone has a new line on it.', 'The telling-stone. Tala, if the river was taught to stay.', 'Read the telling-stone, and find Tala if the river stayed.'],
  bridge: ['The stream. The bridge has fallen.', 'My turn to hold. He crosses first.', 'REVERSE the bridge, and cross after him.'],
  lab: ['Rook left a last transmission at the Helix lab, and Iven is waiting.', 'Rook\'s transmission, and Iven himself.', 'Hear Rook\'s transmission, and hear Iven.'],
  city: ['The future city is the last stretch before the hill.', 'The memorial, Sera, and Anja are all in 2196.', 'Find two of them: the memorial, Sera or Anja.'],
  mira: ['Mira is not waiting. She is choosing.', 'She is at the original Chronolith, by the ring.', 'Go to the ring and ask her.'],
  choose: ['The ring can do three things, and only one of them.', 'Destroy it, split the years, or become the anchor.', 'Stand at the ring and choose one.'],
  gallery: ['The people my choices changed are standing along the road.', 'They wait at places along the road, all the way to the hill.', 'Visit three of the people along the road.'],
  speakers: ['There is a voice in every speaker on the platform again.', 'Stand on the platform and listen to the speakers.', 'When they have spoken, walk north.'],
  pillar: ['A storm stood on its end.', 'Something in it is talking backwards.', 'REVERSE it: it runs forwards once.'],
  farewell: ['The Witness has stopped at the lab gate. He is not coming any further.', 'He has stopped walking, at the gate.', 'Go to the lab gate and talk to the Witness.'],
  meet: ['Mira came down the hill to meet me.', 'She is waiting at the foot of the hill.', 'Go to the foot of the hill and talk to Mira.'],
  climb: ['She wants to walk up the hill with me.', 'She walks at my pace, if I let her.', 'Walk up the hill beside her.'],
  count: ['Count it with her.', 'The ring\'s arm turns on the third count.', 'REVERSE it on the turn.'],
  platform: ['The 41 is at the platform.', 'Its doors are open.', 'Look at who is on it.'],
  keepsakes: ['Mira is at the top. I always carry things up hills.', 'She wants to see what I carried.', 'Talk to Mira at the top of the hill.'],
};

// (the closing pass) three storms stood on their ends along the road, each a world of hers: held, one plays forwards once
// in her voice; and the ring's own arm, which turns on the third count, the second she and Kai count together
const PILLAR = (id, at, aim, text) => ({ id, kind: 'recording', at, label: 'A STORM ON ITS END', weight: 0.5, grain: 'pen', aim, clip: { who: 'MIRA', text }, hints: M23_HINTS.pillar });
const M23_PROCESSES = [
  PILLAR('pillarA', 'tellingStone', [10, 1.6, 13], 'In one world I was born here. I kept the first fire. I was never once cold.'),
  PILLAR('pillarB', 'labGate', [-5, 1.6, -24], 'In one world I worked at Helix with no past, and hummed in the corridors. You walked past me every morning.'),
  PILLAR('pillarC', 'labGate', [-2.5, 1.6, 18], 'In one world I planted a garden by the sea and wrote letters to a brother I never had.'),
  {
    id: 'ringArm', kind: 'mechanism', at: 'originalRing', label: 'THE RING\'S SECOND', weight: 1, settle: 'settled', grain: 'metal', spin: [0, 0, 1, 1.4],
    beat: { period: 3, on: 0.9 }, offBeat: 'Off the count. With her, this time.',
    parts: [{ shape: 'box', size: [0.14, 1.8, 0.1], mat: 'brass', at: [0, 1.0, 2.4] }], aim: [0, 1.0, 2.4],
    hints: ['The ring has an arm, like the clockmaker\'s.', 'It turns on the third count.', 'Count three with her, and REVERSE on the turn.'],
  },
  // the street that fell: the Witness holds its far half (his REVERSE, scripted); Kai may hold it himself as well
  // (it answers Kai only once the Witness has it: before, it is his to hold, and he takes it as Kai reaches the pit)
  {
    id: 'streetCollapse', kind: 'collapse', at: 'streetCollapse', label: 'THE STREET', weight: 1.5, grain: 'stone', mat: 'concrete', arm: 't_m23_streets',
    span: { from: [0, 0, 0], to: [0, 0, 8.4], width: 12, pieces: 6, thick: 0.6, floor: -6 }, aim: [0, 0.6, 4],
    hints: ['The street fell.', 'Fallen things rise.', 'REVERSE the street, or let him hold it.'],
  },
  // the settlement's timber bridge, in the stream: Kai holds it while the Witness crosses
  {
    id: 'settlementBridge', kind: 'collapse', at: 'settlementBridge', label: 'THE BRIDGE', weight: 1, grain: 'wood', mat: 'wood',
    span: { from: [0, 0, -5.6], to: [0, 0, 5.6], width: 4, pieces: 6, thick: 0.4, floor: -2.6 }, aim: [0, 0.4, 0],
    hints: ['The bridge fell into the stream.', 'Fallen things rise.', 'REVERSE the bridge.'],
  },
];
// (the road is every year at once: the people on it stand in all three, never as echoes)
const EVERY = ['PRESENT', 'PAST', 'FUTURE'];
const M23_SAY = {
  across: [N('The Witness crosses while it holds. He does not look down.')],
};
// past the street that fell (t_m23_street, the pit z 120 .. 136): the opening streets' checkpoint, the 41's platform
// behind the pit, is no way back any more (v2.1 playtest acts-3 F06: the Chronolith let go of Kai in 2026 past the
// street and put him back on the platform, with the street fallen and the Witness gone to the bridge)
const BEHIND_PIT = 119;
function seamSpawn(rt) {
  const s = rt.level?.landmarks?.seam41;
  return s ? [s[0], s[1] + 0.86, s[2], s[3] || 0] : null;
}
// the two holds: his, while the street is the way; then Kai's, which lets him across
function m23Step(rt) {
  const g = rt.g, f = g.facts, procs = rt.inv?.procs || [];
  if (f.get('t_m23_street') && g.room === rt.level?.outdoorRoom) {
    // a snap back, a catch or a fall puts Kai at the seam, on ground every year has (the quarter's box behind it, the
    // checkpoint main.stepDeck sets each frame, is the platform's until z 110: this step comes after it)
    const seam = seamSpawn(rt);
    if (seam && Array.isArray(g.checkpoint) && g.checkpoint[2] > BEHIND_PIT) g.checkpoint = seam;
    // and a save that has him behind the pit with the street crossed (one from before this, the playtest's own, or one
    // made after walking back) loads him at the seam, not stranded on the platform
    if (seam && rt.pendingResume === rt.deck && !rt.m23Placed && g.player.pos.z > BEHIND_PIT) g.player.place(seam);
    if (rt.pendingResume === rt.deck) rt.m23Placed = true;
  }
  if (rt.pendingResume !== rt.deck) rt.m23Placed = false;
  const street = procs.find((x) => x.rec.id === 'streetCollapse');
  if (street) {
    const holding = f.get('t_m23_streets') && !f.get('t_m23_street');
    if (holding && street.heldBy !== 'witness') {
      street.heldBy = 'witness';
      street.reverse();
      rt.inv.snd?.start?.(street.rec.grain);
    } else if (!holding && street.heldBy === 'witness' && f.get('t_m23_street')) {
      street.heldBy = null;
      street.release();
    }
  }
  // (he crosses only if he came this far: he held the street that fell, t_m23_street)
  if (f.get('rev_settlementBridge') && f.get('t_m23_street') && f.get('t_m23_settlement') && !f.get('m23_witness_across')) {
    f.set('m23_witness_across', true);
    g.hud.say(M23_SAY.across, f);
  }
}

// the ending choice's three answers: what Kai says (the label), what she answers, and what happens (said by the choice;
// staged by beat, below)
const CHOICE = {
  A: { label: 'Destroy the Chronolith.', lines: [L('MIRA', 'Then let me watch it go. Hold my hand while it does.'),
    N('The ring comes apart in rings of light. Her hand is in his, and then it is only light, and then it is morning.')] },
  B: { label: 'Separate the states into independent branches.', lines: [L('MIRA', 'Then I\'ll live in one of them. Write to me. You never write.'),
    N('The sky breaks into panes, each a different sky. She walks into one of them and turns round to wave.')] },
  C: { label: 'Become the anchor. Absorb the contradictions.', lines: [L('MIRA', 'Kai, what are you doing?'), K('Counting. You first.'),
    N('He steps into the ring. Down at the lab gate a man with a scarred wrist looks up, and is not there any more.')] },
};

// The choice, staged (playtest v2.1 F05: its spectacle was narrated over the game's camera, with the joystick, YEAR and the
// objective "The next door is open. Keep going." still up). As the choice's lines are said (Runtime.choose), a moment of
// cinema.js runs over them: letterboxed, the HUD gone, Kai held, its camera a rig that follows the line being said: the two
// of them at the ring as he says it; her, as she answers; then what the narration says, drawn (stagefx.js): A, the ring
// turning to light and leaving in rings of light, and then the morning; B, the sky breaking into panes, and a pane by her
// that she walks into after she waves; C, Kai walking into the ring as it fills with light, and the Witness at the lab gate
// gone in a column of it. While it plays, m23_beat holds the ending's sky and the ring as they were (afterzero.js), so the
// morning, the panes and the warm light come when the narration says they do. The ending's own sequence (Runtime.ending)
// replaces the moment as it starts, so there is no frame of the game's camera between the two.
const RING_C = [0, 9.6, -152]; // (the original Chronolith's centre: afterzero.js, HILL + 5.6)
function beat(rt, key) {
  const g = rt.g, f = g.facts, pl = g.player;
  const said = [{ who: 'KAI', text: CHOICE[key].label }, ...CHOICE[key].lines];
  const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
  const total = said.reduce((a, l) => a + dur(l), 0) + 3.5;
  const narr = said.length - 1; // (the last line is the narration)
  f.set('m23_beat', true);
  const mira = () => g.deckWorld?.npcs.find((n) => n.n.id === 'mira23')?.model;
  const v3 = (o) => [o.x, o.y, o.z];
  const feet = () => [pl.pos.x, pl.pos.y - 0.86, pl.pos.z];
  const st = { phase: -1, t: 0, shot: null, done: {} };
  const once = (k, fn) => { if (!st.done[k]) { st.done[k] = true; fn(); } };
  const settle = () => {
    if (f.get('m23_beat')) {
      f.set('m23_beat', false);
      g.deckWorld?.refresh?.();
    }
  };
  // the shots, built when their line begins (where Kai and Mira stand then)
  const two = () => { // the two of them, the ring standing behind them
    const k = feet(), m = mira() ? v3(mira().position) : [k[0] + 2, k[1], k[2] - 3];
    const mid = [(k[0] + m[0]) / 2, k[1] + 1.55, (k[2] + m[2]) / 2];
    let ux = mid[0] - RING_C[0], uz = mid[2] - RING_C[2];
    const d = Math.hypot(ux, uz) || 1;
    ux /= d;
    uz /= d;
    const look = [mid[0] + (RING_C[0] - mid[0]) * 0.25, mid[1] + (RING_C[1] - mid[1]) * 0.22, mid[2] + (RING_C[2] - mid[2]) * 0.25];
    return { cam: [mid[0] + ux * 5.6 - uz * 1.6, mid[1] + 0.3, mid[2] + uz * 5.6 + ux * 1.6], to: [mid[0] + ux * 4.8 - uz * 1.3, mid[1] + 0.35, mid[2] + uz * 4.8 + ux * 1.3], look };
  };
  const her = () => { // her, from just beside him
    const k = feet(), mm = mira();
    const m = mm ? v3(mm.position) : [k[0] + 2, k[1], k[2] - 3];
    let ux = k[0] - m[0], uz = k[2] - m[2];
    const d = Math.hypot(ux, uz) || 1;
    ux /= d;
    uz /= d;
    const r = Math.min(2.2, d + 0.6);
    return { cam: [m[0] + ux * r + uz * 0.65, m[1] + 1.5, m[2] + uz * r - ux * 0.65], to: [m[0] + ux * (r - 0.25) + uz * 0.6, m[1] + 1.5, m[2] + uz * (r - 0.25) - ux * 0.6], look: [m[0], m[1] + 1.38, m[2]] };
  };
  const him = () => { // him, from just beside her
    const k = feet(), mm = mira();
    const m = mm ? v3(mm.position) : [k[0] + 2, k[1], k[2] - 3];
    let ux = m[0] - k[0], uz = m[2] - k[2];
    const d = Math.hypot(ux, uz) || 1;
    ux /= d;
    uz /= d;
    const r = Math.min(2.2, d + 0.6);
    return { cam: [k[0] + ux * r - uz * 0.65, k[1] + 1.55, k[2] + uz * r + ux * 0.65], to: [k[0] + ux * (r - 0.25) - uz * 0.6, k[1] + 1.55, k[2] + uz * (r - 0.25) + ux * 0.6], look: [k[0], k[1] + 1.45, k[2]] };
  };
  // (inside the circle of stones, which stood between a camera outside it and the ring)
  const ringWide = () => ({ cam: [RING_C[0] + 3.2, RING_C[1] - 3.2, RING_C[2] + 12.5], to: [RING_C[0] + 2.2, RING_C[1] - 2.9, RING_C[2] + 14.5], look: [RING_C[0], RING_C[1] + 0.6, RING_C[2]] });
  const skyUp = () => { const k = feet(); return { cam: [k[0] - 1.4, k[1] + 1.1, k[2] + 2.6], to: [k[0] - 1.8, k[1] + 0.9, k[2] + 3.4], look: [RING_C[0], RING_C[1] + 22, RING_C[2] - 22] }; };
  const behindToRing = () => ({ cam: [RING_C[0] + 1.5, RING_C[1] - 4.3, RING_C[2] + 9.6], to: [RING_C[0] + 1.0, RING_C[1] - 4.1, RING_C[2] + 8.2], look: [RING_C[0], RING_C[1] - 1.6, RING_C[2]] });
  const atGate = () => {
    const w = g.deckWorld?.npcs.find((n) => n.n.id === 'witness_gate')?.model;
    const p = w ? v3(w.position) : [-2.4, 0, -23.2];
    // (from the hill's side: he looks up toward it, and the sunrise is on his face)
    return { cam: [p[0] + 0.9, p[1] + 1.35, p[2] - 3.2], to: [p[0] + 0.7, p[1] + 1.4, p[2] - 2.6], look: [p[0], p[1] + 1.6, p[2]], at: p };
  };
  const which = () => { // the line being said, by its text (0 until the first is up; said.length once they are over)
    const c = g.hud.subT > 0 ? g.hud.cur : null;
    if (g.hud.talking) st.heard = true;
    if (!c) return g.hud.talking || !st.heard ? Math.max(0, st.phase) : said.length;
    const i = said.findIndex((l) => l.text === c.text);
    return i < 0 ? st.phase : i;
  };
  const walk = { from: null, to: null, t: 0 };
  const rig = (dt) => {
    const ph = which();
    if (ph !== st.phase) {
      st.phase = ph;
      st.t = 0;
      st.len = ph < said.length ? dur(said[ph]) : 4;
      // what each line shows
      if (ph >= said.length) st.shot = st.cur ? { cam: st.cur, look: st.shot.look, at: st.shot.at } : ringWide(); // (held where it is)
      else if (ph < narr) {
        const who = said[ph].who;
        st.shot = ph === 0 ? two() : who === 'MIRA' ? her() : him();
      } else if (key === 'A') {
        st.shot = ringWide();
        once('rings', () => rt.cinema.addFx(ringsOfLight({ center: RING_C, R: 5, n: 9, every: 0.55, life: 4.4 })));
      } else if (key === 'B') {
        st.shot = skyUp();
        once('panes', () => {
          settle(); // (the sky breaks into panes now)
          g.hud.flash('rgba(255,240,220,0.55)');
          rt.cinema.addFx(skyPanes({ center: [RING_C[0], 4, RING_C[2] + 6], toward: -Math.PI / 2 }));
        });
      } else {
        // C: he is set at the ring's foot and walks into it; it fills with light round him
        st.shot = behindToRing();
        once('anchor', () => {
          st.anchor = rt.cinema.addFx(anchorLight({ center: RING_C, R: 4.4 }));
          // (he stops short of the ring's own gate, the mission's exit, [-2, 2] m round its foot: walked into, it would end
          // the mission under the moment; the light takes him there)
          walk.from = [RING_C[0] + 0.3, pl.pos.y, RING_C[2] + 6.4];
          walk.to = [RING_C[0], pl.pos.y, RING_C[2] + 2.7];
          walk.t = 0;
        });
      }
    }
    st.t += dt;
    const lineT = st.t, len = st.len || 4;
    // (while they talk he turns to her, as she does to him: her shot and his reverse see faces)
    if (ph < narr && mira()) {
      const m = mira().position, dx = m.x - pl.pos.x, dz = m.z - pl.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.3) pl.facing?.set(dx / d, 0, dz / d);
    }
    // A: then it is only light, and then it is morning (the ring is gone with it, and her hand)
    if (key === 'A' && ph === narr && lineT > len * 0.6) once('morning', () => {
      g.hud.flash('rgba(255,255,255,0.95)');
      f.set('m23_mira_gone', true);
      settle();
    });
    // B: she walks into a pane of another sky, and turns round to wave
    if (key === 'B' && ph === narr && lineT > len * 0.45) once('door', () => {
      const m = mira();
      const at = m ? v3(m.position) : feet();
      const k = feet();
      const yaw = Math.atan2(k[0] - at[0], k[2] - at[2]);
      rt.cinema.addFx(paneDoor({ at: [at[0] - Math.cos(yaw) * 0.2 - Math.sin(yaw) * 0.4, at[1], at[2] + Math.sin(yaw) * 0.2 - Math.cos(yaw) * 0.4], yaw, color: 0xffa060 }));
      m?.userData.wave?.();
      st.shot = her();
      st.t = 0;
    });
    if (key === 'B' && ph === narr && lineT > len * 0.5 && st.done.door && st.t > Math.max(1.6, len * 0.4)) once('through', () => {
      const m = mira();
      if (m) rt.cinema.addFx(goneLight({ at: v3(m.position), color: 0xffd8b0 }));
      f.set('m23_mira_gone', true);
      g.deckWorld?.refresh?.();
    });
    // C: the walk into the ring, then the man at the lab gate who is not there any more
    let hide = false;
    if (key === 'C' && ph >= narr) {
      if (walk.from) {
        walk.t += dt;
        const u = Math.min(1, walk.t / 2.6);
        pl.pos.x = walk.from[0] + (walk.to[0] - walk.from[0]) * u;
        pl.pos.z = walk.from[2] + (walk.to[2] - walk.from[2]) * u;
        pl.facing?.set(walk.to[0] - walk.from[0], 0, walk.to[2] - walk.from[2]).normalize();
        pl.speed = u < 1 ? 1.4 : 0; // (his walk, in the model's stride: Player.updateModel)
        if (u >= 1) once('into', () => {
          if (st.anchor) st.anchor.flare = 1;
          g.fx?.burst?.([RING_C[0], RING_C[1] - 3.4, RING_C[2]], 0xe8dcff, 40, 2.2);
        });
      }
      hide = !!st.done.into;
      if (ph === narr && lineT > len * 0.5) once('gate', () => {
        st.shot = atGate();
        st.t = 0;
      });
      if (st.done.gate && st.t > 1.6) once('gone', () => {
        rt.cinema.addFx(goneLight({ at: st.shot.at || [-2.4, 0, -23.2] }));
        f.set('m23_gone', true);
        g.deckWorld?.refresh?.();
      });
    }
    if (ph >= said.length) settle(); // (the lines are over: the ending's sky, as the ending begins)
    const s = st.shot;
    if (!s) return null;
    const k = Math.min(1, st.t / Math.max(1, len));
    const e = k * k * (3 - 2 * k);
    const cam = s.to ? s.cam.map((v, i) => v + (s.to[i] - v) * e) : s.cam;
    st.cur = cam;
    return { cam, look: s.look, hide };
  };
  rt.cinema.play({ shots: null, lines: [], total, rig }, settle);
}

export const M23 = {
  key: 'm23', n: 23, chapter: 'finale', name: 'AFTERZERO', title: 'Past, present, future and inversion collide', subtitle: 'Fragments of the opening streets, the settlement, the laboratory and the future city.',
  logline: 'One road through every year, held open by two men with the same scar.',
  place: 'afterzero', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 0, 0, 1, 0], unstable: true, ambience: 'rain', ambient: 'rain',
  named: ['witness', 'mira', 'jun', 'tala', 'sera', 'anja', 'iven', 'clockmaker', 'odile'],
  motto: 'A SECOND THAT BELONGS TO NOBODY', gate: 'THE ORIGINAL CHRONOLITH', crew: C('mira'),
  minutes: { main: 40, optional: 10 }, gateAfter: true,
  processes: M23_PROCESSES,
  zones: [{ at: 'settlementBridge', box: [-8, -1, 7, 8, 4, 14], set: { m23_across: true } },
    // (the closing pass: half way up the hill and near the top, walking behind her, she talks)
    { at: 'hillFoot', box: [-9, -1, 12, 9, 7, 16], set: { m23_climb1: true }, when: 'm23_met' },
    { at: 'hillFoot', box: [-9, -1, 26, 9, 9, 30], set: { m23_climb2: true }, when: 'm23_climb1' }],
  rules: [
    { id: 'climb1', when: 'm23_climb1 && !t_m23_climb', say: [L('MIRA', 'You carried me up here once. On your back. You said the ring was a giant\'s bracelet.'), K('You believed me.'),
      L('MIRA', 'I was nine. I believed you about everything. That was the trouble.')] },
    { id: 'climb2', when: 'm23_climb2 && !t_m23_climb', say: [L('MIRA', 'Slow down. You always walk as if you\'re late.'), K('I am late. Twenty-three years late.'),
      L('MIRA', 'No. You\'re exactly when I asked you to be. Look back.'), N('Below them every year of the road is lit at once: the avenue, the first fire, the lab, the gardens of 2196.')] },
  ],
  watch: [[[[-8, 152], [8, 142]], [[-10, 160], [-2, 146]]], [], [], [[[-3, -36], [-3, -96]]], []],
  fragSpots: [['busField'], ['labGate'], ['hillFoot']],
  fragments: [[
    'The 41, standing in a field, its doors open. The seats are dry.',
    'A Helix door with no lock, in a wall that is not finished.',
    'The first light of a sunrise, in the Notch, for the first time.',
  ]],
  beats: [{ kind: 'custom', goal: 'Reach Mira at the original Chronolith.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (the closing pass: her first, at the ring, before the road)
    shots: [{ cam: [7, 6.4, -134], to: [5, 6.6, -138], look: [2.2, 5.4, -146], t: 9 }, { cam: 'platform41', look: 'streetCollapse', t: 9 }],
    cast: [{ crew: 'mira', at: 'miraStands', off: [0, 0, 0], turn: Math.PI }],
    lines: [FX(L('MIRA', 'Kai. If you can hear me, don\'t run. Walk. I want to see you come.'), 'echo'), N('Rain City, the first fire, the lab and 2196, all at once. The 41 arrives on time.'), L('JUN', 'On time. I don\'t know what to do with myself.', 'jun_line || jun_evidence'),
      N('The platform is empty. Somebody has turned off the announcement.', '!jun_line && !jun_evidence')],
  },
  quarters: [
    {
      name: 'THE OPENING STREETS',
      threads: [
        // (the voice in every speaker, the last time: hers, not his)
        { id: 'speakers', kind: 'cinema', lines: [FX(L('MIRA', 'Kai Varen. Build nothing. Walk north, to the hill.'), 'pa'), K('Not his voice. Hers.'), L('WITNESS', 'She was always going to be better at it than me.')],
          goal: 'The speakers on the platform.', because: 'There is a voice in every one of them again.', hints: M23_HINTS.speakers },
        // (the line across the whole avenue before the fallen street, pavements and all: whichever way Kai comes, the
        // Witness takes the street as he gets there; the strips beside the pit are closed by fallen facades)
        // (the closing pass: the 41 has come back, and who is on its platform is what Kai did for them)
        { id: 'platform', kind: 'scene', scene: 'platform41', at: 'platform41', after: ['speakers'], spot: { prompt: 'THE 41', offset: [0, 1.2, 2.2], r: 3, model: NO_MODEL },
          goal: 'The 41 is at the platform, its doors open.', because: 'It came back. Somebody is waiting by it.', done: 'ev_platform41', hints: M23_HINTS.platform },
        { id: 'streets', kind: 'stealth', at: [0, 0, 141, 0], box: [-50, 137, 50, 147], after: ['platform'], goal: 'Cross the opening streets.', because: 'The avenue from the first morning, and the watchers on it.',
          say: [L('WITNESS', 'I will hold the route. Go to her.'), K('Why now?'), REV(L('WITNESS', 'Because this is the version where I ask.'))], hints: M23_HINTS.streets, minutes: 6 },
        { id: 'street', kind: 'go', at: [0, 0, 114, 0], box: [-50, 104, 50, 119], after: ['streets'], goal: 'Over the street that fell.', because: 'He is holding it. In his ring, my colour.',
          say: [N('Behind Kai, the street goes down into the dark without a sound.')], hints: M23_HINTS.street, minutes: 4 },
      ],
      sides: [
        { id: 'gallery', name: 'THE CONSEQUENCES GALLERY', done: 'ev_gallery', minutes: 10,
          threads: [{ id: 'galleryVisit', kind: 'clue', need: 3, of: ['ev_gal_jun', 'ev_gal_ezra', 'ev_gal_listeners', 'ev_gal_prisoners', 'ev_gal_odile', 'ev_gal_keeper', 'ev_gal_scav'], set: { ev_gallery: true },
            spots: [
              { id: 'galScav', scene: 'galScav', at: 'seraGarden', prompt: 'A LAMP', offset: [-3, 1.2, 4], r: 2.4, model: NO_MODEL },
              { id: 'galOdile', scene: 'galOdile', at: 'labGate', prompt: 'A BENCH', offset: [3, 1.0, 1], r: 2.4, model: NO_MODEL },
              { id: 'galPrisoners', scene: 'galPrisoners', at: 'labDoor', prompt: 'THE LAB STEPS', offset: [3, 1.0, 1], r: 2.6, model: NO_MODEL },
              { id: 'galEzra', scene: 'galEzra', at: 'tellingStone', prompt: 'A CLOCK ON A POST', offset: [0, 1.2, 4], r: 2.4, kit: 'clockPost' },
              { id: 'galListeners', scene: 'galListeners', at: 'busField', prompt: 'THE 41 IN THE FIELD', offset: [0, 1.2, 2.4], r: 2.6, model: NO_MODEL },
              { id: 'galJun', scene: 'galJun', at: 'junPassengers', prompt: 'JUN\'S PASSENGERS', offset: [1.6, 1.2, 0], r: 2.6, model: NO_MODEL },
              { id: 'galKeeper', scene: 'galKeeper', at: 'platform41', prompt: 'A TICKET', offset: [2.4, 1.0, 0.6], r: 2.4, model: NO_MODEL },
            ],
            goal: 'Visit the people your choices changed.', because: 'They stand along the road.', hints: M23_HINTS.gallery, minutes: 10 }] },
      ],
    },
    {
      name: 'THE SETTLEMENT, AGAIN',
      threads: [
        { id: 'settlement', kind: 'clue', need: 1, of: ['ev_telling_line', 'ev_tala23'], after: ['street'],
          spots: [{ id: 'tellingLine', scene: 'tellingLine', at: 'tellingStone', prompt: 'THE TELLING-STONE', offset: [0, 1.3, 1.4], r: 2.6, model: NO_MODEL }],
          goal: 'The settlement, again.', because: 'Niko\'s stone, with a new line on it.', hints: M23_HINTS.settlement, minutes: 4 },
        { id: 'pillarA', kind: 'invert', target: 'pillarA', scene: 'pillarLook', at: 'tellingStone', after: ['settlement'], spot: { id: 'pillarA_look', prompt: 'A STORM ON ITS END', offset: [10, 1.6, 11.6], r: 2.6, model: scarModel },
          goal: 'A storm stands on its end in the meadow.', because: 'Something in it is talking backwards, in her voice.', hints: M23_HINTS.pillar },
        { id: 'bridge', kind: 'tasks', of: ['m23_witness_across', 'm23_across'], at: 'settlementBridge', after: ['pillarA'],
          say: [REV(L('WITNESS', 'And, Kai. For once, you are on time.'))],
          goal: 'Hold the bridge while he crosses.', because: 'Now we swap.', hints: M23_HINTS.bridge, minutes: 4 },
      ],
    },
    {
      name: 'THE HELIX LAB',
      threads: [
        { id: 'lab', kind: 'clue', need: 2, of: ['ev_rook_last', 'ev_iven_signed'], after: ['bridge'],
          spots: [
            { id: 'rookLast', scene: 'rookLast', at: 'rookTransmission', prompt: 'ROOK\'S TRANSMISSION', offset: [0, 1.4, 0.6], r: 2.4, kit: 'recorder' },
            { id: 'ivenSigned', scene: 'ivenSigned', at: 'ivenStatement', prompt: 'IVEN', offset: [0, 1.2, 1.2], r: 2.6, model: NO_MODEL },
          ],
          goal: 'The Helix laboratory.', because: 'Rook left a last transmission. Iven is waiting.', hints: M23_HINTS.lab, minutes: 4 },
        { id: 'pillarB', kind: 'invert', target: 'pillarB', scene: 'pillarLook', at: 'labGate', after: ['lab'], spot: { id: 'pillarB_look', prompt: 'A STORM ON ITS END', offset: [-5, 1.6, -22.6], r: 2.6, model: scarModel },
          goal: 'Another storm on its end, in the lab.', because: 'Her voice again. Another world.', hints: M23_HINTS.pillar },
        // (the closing pass: the Witness stops at the lab gate; the ring would turn for his hand, so he holds the road instead)
        { id: 'farewell', kind: 'talk', npc: 'witness_lab', at: 'labGate', after: ['pillarB'], goal: 'The Witness has stopped at the lab gate.', because: 'He is not coming any further.', done: 'm23_farewell', hints: M23_HINTS.farewell },
      ],
    },
    {
      name: '2196',
      threads: [
        { id: 'city', kind: 'clue', need: 2, of: ['ev_memorial23', 'ev_sera23', 'ev_anja23'], after: ['lab'],
          spots: [{ id: 'memorial23', scene: 'memorial23', at: 'memorial2196', prompt: 'THE MEMORIAL', offset: [0, 1.2, 1.8], r: 2.6, kit: 'memorialCore' }],
          goal: 'The future city.', because: 'The memorial, Sera, Anja.', hints: M23_HINTS.city, minutes: 5 },
        { id: 'pillarC', kind: 'invert', target: 'pillarC', scene: 'pillarLook', at: 'labGate', after: ['city'], spot: { id: 'pillarC_look', prompt: 'A STORM ON ITS END', offset: [-2.5, 1.6, 19.4], r: 2.6, model: scarModel },
          goal: 'The last storm on its end, on the causeway.', because: 'Where the rain rises.', hints: M23_HINTS.pillar },
      ],
    },
    {
      name: 'THE ORIGINAL CHRONOLITH',
      threads: [
        // (the closing pass: she comes down the hill to meet him, and walks back up it beside him)
        { id: 'meet', kind: 'talk', npc: 'mira_foot', at: 'hillFoot', after: ['pillarC'], goal: 'Mira, at the foot of the hill.', because: 'She came down to meet me.', done: 'm23_met', hints: M23_HINTS.meet },
        { id: 'climb', kind: 'chase', npc: 'mira_walk', path: [[0, 0, -110], [0, 2, -116], [0, 4, -126], [2, 4, -136], 'miraStands'], leash: 14, ahead: 4, speed: 1.2, after: ['meet'],
          goal: 'Up the hill, beside her.', because: 'She wants to walk it.', hints: M23_HINTS.climb },
        // (the closing pass: before she asks to be asked, what he carried up the hill)
        { id: 'keepsakes', kind: 'talk', npc: 'mira23', at: 'miraStands', after: ['climb'], goal: 'Mira, at the top. She wants to see my pockets.', because: 'I always carry things up hills.', done: 'm23_kept', hints: M23_HINTS.keepsakes },
        { id: 'mira', kind: 'talk', npc: 'mira23', at: 'miraStands', after: ['keepsakes'], goal: 'Reach Mira at the original Chronolith.', because: 'She is not waiting. She is choosing.', done: 'm23_asked', hints: M23_HINTS.mira, minutes: 4 },
        { id: 'count', kind: 'invert', target: 'ringArm', at: 'originalRing', after: ['mira'],
          say: [L('MIRA', 'That one was ours. Nobody else\'s.'), K('What happens to it now?'), L('MIRA', 'Now you choose. I already did.')],
          goal: 'Count a second with her.', because: 'The ring\'s arm turns on the third count.', hints: M23_HINTS.count },
        { id: 'choose', kind: 'choice', scene: 'ending', at: 'endingChoice', after: ['count'], spot: { prompt: 'THE ORIGINAL CHRONOLITH', offset: [0, 1.2, 0], r: 3, model: NO_MODEL },
          goal: 'Choose what to preserve and what to release.', because: 'Three things the ring can do, and only one of them.', done: 'ending', hints: M23_HINTS.choose, minutes: 3 },
      ],
    },
  ],
  talks: {
    witness_lab: [
      {
        when: '!m23_farewell',
        lines: [L('WITNESS', 'This is as far as I go. The ring knows my hand. It would turn for me.'), L('WITNESS', 'Let me hold the storm off the road. Let me fix one thing.'),
          K('Don\'t fix it. Look at it.'), N('He turns, and looks back down the road: the 41 in its field, the first fire, the rain.'), L('WITNESS', 'It\'s beautiful. Why is it beautiful?'),
          // (the closing pass: what she told him once)
          K('Because nobody fixed it.'), L('WITNESS', 'She asked me once what I wanted. I said: her. She said: wrong answer.'),
          L('WITNESS', 'I have been working out the right one for thirty years. I think it was: to see her want something.')],
        choices: [
          intent('comfort', 'Thank you.', { lines: [L('WITNESS', 'Don\'t. I did all of it. Go and undo a little.')], set: { m23_farewell: 'thanked' } }),
          intent('investigate', 'Will I become you?', { lines: [L('WITNESS', 'Which version of the question are you asking?'), K('The one where you get to rest.'), L('WITNESS', 'Then no.')], set: { m23_farewell: 'asked' } }),
          intent('challenge', 'You don\'t get to stay behind.', { lines: [L('WITNESS', 'Somebody has to hold the gate. I am very good at waiting.')], set: { m23_farewell: 'stayed' } }),
        ],
      },
      { when: 'm23_farewell', lines: [L('WITNESS', 'Go on. She is counting.')] },
    ],
    mira_foot: [
      {
        when: '!m23_met',
        lines: [L('MIRA', 'You walked. Good. I wanted to see you come.'), K('You look like her.'), L('MIRA', 'I am her. I\'m also everyone else I was. You heard some of them on the way.'),
          L('MIRA', 'Walk with me. Not ahead. With.')],
        set: { m23_met: true },
      },
      { when: 'm23_met', lines: [L('MIRA', 'With me, Kai.')] },
    ],
    tala23: [{ when: 'true', lines: [L('TALA', 'The river knows the way now. So did you.')], set: { ev_tala23: true } }],
    sera23: [
      {
        when: '!ev_sera23',
        lines: [L('SERA', 'You came back.', 'trust_sera == "accept"'), L('SERA', 'You said it wasn\'t you. Then it was.', 'trust_sera == "deny"'), L('SERA', 'Kai.', '!(trust_sera == "accept") && !(trust_sera == "deny")'),
          // (the closing pass: the frozen block, Mission 13, as she lives with it)
          L('SERA', 'My mother came out of the block with the kettle still in her hand. She makes tea at the wrong time now. On purpose.', 'civilians_freed && ev_block'),
          L('SERA', 'You freed the block. My mother was in it. You didn\'t know. I\'m glad you didn\'t.', 'civilians_freed && !ev_block'),
          L('SERA', 'My mother\'s kitchen still hangs over the district. I visit. I bring my own tea. She\'s still pouring.', 'stabilizer_destroyed && ev_block'),
          L('SERA', 'The block is still frozen. My mother is in it. I never told you. I visit on Sundays.', 'stabilizer_destroyed && !ev_block'),
          K('I\'m sorry.', 'stabilizer_destroyed'), L('SERA', 'I asked you to choose as if she were nobody\'s. You did. It\'s why I trust you.', 'stabilizer_destroyed && ev_block'),
          L('SERA', 'The garden has water. Go on. She\'s on the hill.', 'garden_restored'), L('SERA', 'Go on. She\'s on the hill.', '!garden_restored')],
        set: { ev_sera23: true },
      },
      { when: 'ev_sera23', lines: [L('SERA', 'The hill, Kai.')] },
    ],
    anja23: [
      {
        when: '!ev_anja23',
        lines: [L('ANJA', 'Tomorrow came. They hated us for a week. Then they planted things.', 'city_freed'), L('ANJA', 'The lock holds. I check it at noon, and now I remember why.', 'city_stabilized'), L('ANJA', 'Go and count your second.')],
        set: { ev_anja23: true },
      },
      { when: 'ev_anja23', lines: [L('ANJA', 'Count it.')] },
    ],
    mira23: [
      {
        when: 'm23_kept && !m23_asked',
        lines: [L('MIRA', 'Ask me.'), K('Ask you what?'), L('MIRA', 'What I want. Nobody has. Not in a hundred and seventeen worlds.'), K('What do you want?'),
          REV(L('MIRA', 'A second that is mine. Not saved. Not fixed. Mine. Count it with me.')),
          K('I thought the answer was to find the right world.'), L('MIRA', 'And now?'), K('Now I think we kept asking the world to pay for our answer.'),
          // (the closing pass: what he did in her memory, Mission 20)
          L('MIRA', 'In the world without you, a stranger hummed my last note in the garden. I knew it was you. I didn\'t know how.', 'm20_note == "sung"'),
          L('MIRA', 'In the world without you, I found my last note by myself. It took years. Thank you for letting me.', 'm20_note == "left"'),
          // (the letter Kai kept in Mission 17: she knows)
          L('MIRA', 'You kept my letter. Did you ever read it?', 'letter == "kept"'), K('No. It was yours to send.', 'letter == "kept"'),
          L('MIRA', 'Then I will. Afterwards.', 'letter == "kept"')],
        set: { m23_asked: true },
      },
      // (the closing pass: before she asks to be asked, what he carried up the hill; its own node, the first she plays)
      {
        when: '!m23_kept',
        lines: [L('MIRA', 'Empty your pockets. You always carry things up hills.'),
          K('Your tape. You buried it on the ridge.', 'mira_tape == "kept"'), L('MIRA', 'I said the rings knew you. I was nine, and right, which is unbearable.', 'mira_tape == "kept"'),
          K('I left your tape where you put it.', 'mira_tape == "left"'), L('MIRA', 'Good. Some things should stay where a nine-year-old put them.', 'mira_tape == "left"'),
          K('A photograph. Us, old, on a bench.', 'photo_taken'), L('MIRA', 'We look tired. We look as if we argued about the bench.', 'photo_taken'),
          K('A watch that goes forwards very slowly.', 'ev_ezra26'), L('MIRA', 'Ezra\'s. I said it would do. It did.', 'ev_ezra26'),
          K('And a sun with a face on it.', 'm11_boy == "drew"'), L('MIRA', 'You did it wrong. You did it the way I do it.', 'm11_boy == "drew"'),
          L('MIRA', 'Is that all of it?'), K('That\'s all of it.'), L('MIRA', 'Then put it down. You don\'t need your hands full for this.')],
        set: { m23_kept: true },
      },
      { when: 'm23_asked', lines: [L('MIRA', 'Count it with me, Kai. The arm, on the third.')] },
    ],
  },
  scenes: {
    tellingLine: { lines: [N('The telling-stone has a new line, cut in Niko\'s hand: HE CAME BACK.')], set: { ev_telling_line: true } },
    platform41: {
      lines: [N('The 41 stands at the platform with its doors open. The board over it says ON TIME, and nobody believes it.'),
        L('JUN', 'Everyone you got off it is here, Kai. All of them. They wanted to watch it leave without them.', 'jun_line'),
        L('JUN', 'I kept your notes on the relay. They\'re how I knew it would come back.', '!jun_line && jun_evidence'),
        N('Nobody on the platform. The doors wait, and close, and the 41 goes north without anyone.', '!jun_line && !jun_evidence'),
        K('Where does it go now?'), N('The driver shrugs, and points up the road, at the hill.')],
      set: { ev_platform41: true }, log: 'The 41 came back on time. It went north, toward the hill.',
    },
    rookLast: {
      lines: [FX(L('ROOK', 'Kai. I have the lab\'s power. It stays on until you\'re through. Go.', 'rook_fate == "persuade"'), 'radio'),
        FX(L('ROOK', 'This is Elias Rook, on a borrowed radio. They let me say one thing. I\'m sorry.', 'rook_fate == "expose"'), 'radio'),
        FX(L('ROOK', 'For the record. The chamber is yours, Kai. It always was.', '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'recording')],
      set: { ev_rook_last: true },
    },
    ivenSigned: { lines: [L('IVEN', 'Statement of Iven Marr. I signed for it.')], set: { ev_iven_signed: true } },
    memorial23: { lines: [N('The memorial. KAI VAREN.'), N('Under it, newly cut: AND HE CAME BACK.', 'trust_sera == "accept"'), N('And at its foot, in a different hand: HE SIGNED FOR IT.', 'm22_signed == "signed"'), N('At its foot, a space somebody keeps clear, as if for a name.', 'm22_signed == "blank"')], set: { ev_memorial23: true } },
    pillarLook: { lines: [K('A storm, turned on its end. Inside it, something is talking backwards. Held, it would run forwards once.')] },
    galScav: {
      lines: [SAYS('A GIRL WITH A LAMP', 'CROWD_CHILD', 'My lamp still works! Dad says thank you. He says it every night.', 'm18_scav == "shared"'),
        N('A scavenger\'s lamp in the reeds, dark, and nobody by it.', 'm18_scav == "refused"'), N('A lamp on a post in the garden, unlit.', '!m18_scav')],
      set: { ev_gal_scav: true },
    },
    galJun: {
      lines: [L('JUN', 'They all got off. Every one of them.', 'jun_line'), L('JUN', 'The evidence went in. Somebody read it.', 'jun_evidence'), N('Jun\'s booth, empty. The 41 runs without him.', '!jun_line && !jun_evidence')],
      set: { ev_gal_jun: true },
    },
    galListeners: {
      lines: [SAYS('ONE WHO LISTENED', 'CROWD_F2', 'You said get out of the tower. We did. We never said thank you.', 'warned_evacuees'), N('A bus in a field. Nobody waiting for it.', '!warned_evacuees')],
      set: { ev_gal_listeners: true },
    },
    galEzra: {
      lines: [SAYS('EZRA MOLL', 'CLOCKMAKER', 'Wednesday. I have had nine of them now.', 'ezra_debt == "release"'), SAYS('EZRA MOLL', 'CLOCKMAKER', 'The clock keeps its own time. So do I.', 'ezra_debt == "finish"'),
        N('A clock on a post, ticking, with no maker\'s mark.', '!ezra_debt')],
      set: { ev_gal_ezra: true },
    },
    galPrisoners: {
      lines: [N('Twelve people from the dam\'s loops, on the lab steps, arguing about breakfast.', 'prisoners_freed || m21_cells'), N('Twelve empty chairs on the lab steps.', '!prisoners_freed && !m21_cells')],
      set: { ev_gal_prisoners: true },
    },
    galKeeper: {
      lines: [SAYS('THE TICKET KEEPER', 'CROWD_M', 'It came. Eight fourteen, on time. I made them punch it.', 'm14_ticket == "kept"'),
        SAYS('THE TICKET KEEPER', 'CROWD_M', 'It came, and I was late for it. Of course I was. It runs in the family.', 'm14_ticket == "asked"'),
        N('A ticket for the 41 on the shelter\'s bench, a hundred and forty-seven years old, not punched.', '!m14_ticket')],
      set: { ev_gal_keeper: true },
    },
    galOdile: {
      lines: [SAYS('NURSE ODILE', 'ODILE', 'My shift finished. Thirty-two went home.', 'odile_released'), N('A nurse\'s watch on a bench, still running.', '!odile_released')],
      set: { ev_gal_odile: true },
    },
    ending: {
      lines: [N('Three things the ring can do, and only one of them.'), N('Orren\'s record: released. Fought over. A person.', 'ev_unwritten_record')],
      choices: [
        // (the closing pass: each choice is seen before the ending: the sky changes with it, and she answers)
        // (playtest v2.1 F05: and it is staged, then: beat, below: its own camera and what the narration says, drawn)
        intent('challenge', CHOICE.A.label, { set: { ending: 'A' }, ending: 'A', lines: CHOICE.A.lines, then: 'beatA' }),
        intent('investigate', CHOICE.B.label, { set: { ending: 'B' }, ending: 'B', lines: CHOICE.B.lines, then: 'beatB' }),
        intent('comfort', CHOICE.C.label, { set: { ending: 'C' }, ending: 'C', lines: CHOICE.C.lines, then: 'beatC' }),
      ],
    },
  },
  step: m23Step,
  // (THINK on the platform's side of the pit once the street is crossed, walked back over it: the settlement's tiers
  // would not say how to get across again)
  hints: [{ over: true, when: 't_m23_street && !t_m23_bridge', test: (rt) => rt.g.room === rt.level?.outdoorRoom && rt.g.player.pos.z > BEHIND_PIT,
    tiers: ['The street fell in behind him, and I am on the wrong side of it again.', 'The near half still stands in 2026. The far half rises if it is held.',
      'Switch to 2026, walk the near half, and REVERSE the street to cross the rest.'] }],
  fx: { beatA: (rt) => beat(rt, 'A'), beatB: (rt) => beat(rt, 'B'), beatC: (rt) => beat(rt, 'C') }, // (the ending choice, staged)
  spoken: M23_SAY, // (what its code says: the Witness crossing)
  // quest chain A's consequence: the passengers Kai got off the 41 clear the opening streets of watchers
  adjust(level, rt) {
    if (!rt.g.facts.get('jun_line')) return;
    level.sentinels = (level.sentinels || []).filter((s) => !/_q0s\d$/.test(s.id));
  },
  overlay(P) {
    person(P, { id: 'jun23', crew: 'jun', at: 'platform41', off: [-2, 0, 1], turn: Math.PI / 2, silent: true, when: 'jun_line || jun_evidence', temporal: EVERY });
    // (the closing pass: Mission 14's ticket keeper, on the platform the 41 has come back to; Mission 12's glazier at the lab)
    person(P, { id: 'm23_keeper', crew: 'm14_keeper', first: 'The ticket keeper', seed: 1404, ambient: true, at: 'platform41', off: [2.4, 0, 2.2], turn: -Math.PI / 2, silent: true, when: 'm14_ticket', temporal: EVERY });
    person(P, { id: 'm23_glazier', crew: 'm12_glazier', first: 'The glazier', seed: 1201, ambient: true, at: 'labDoor', off: [-3.2, 0, 1.6], turn: Math.PI, silent: true, when: 'm12_glazier == "saved"', temporal: EVERY });
    person(P, { id: 'm23_passenger', crew: 'm23_passenger', first: 'A passenger', seed: 2301, ambient: true, at: 'junPassengers', off: [0, 0, 2], turn: Math.PI / 2, silent: true, when: 'jun_line' });
    person(P, { id: 'witness_street', crew: 'witness', at: 'streetCollapse', off: [5, 0, 13], turn: Math.PI, silent: true, when: 't_m23_streets && !t_m23_street' });
    person(P, { id: 'witness_bridge', crew: 'witness', at: 'settlementBridge', off: [2.6, 0, -8], turn: 0, silent: true, when: 't_m23_street && !m23_witness_across' });
    person(P, { id: 'witness_far', crew: 'witness', at: 'settlementBridge', off: [2.6, 0, 8.4], turn: Math.PI, silent: true, when: 'm23_witness_across && !t_m23_lab' });
    // (at the lab gate: he stops, talks, and stays there holding the road while Kai goes on; in Ending C he is not)
    person(P, { id: 'witness_lab', crew: 'witness', at: 'labGate', off: [-2.4, 0, 1.4], turn: Math.PI, prompt: 'TALK TO HIM', when: 't_m23_lab && !m23_farewell' });
    person(P, { id: 'witness_gate', crew: 'witness', at: 'labGate', off: [-2.4, 0, -1.2], turn: 0, silent: true, when: 'm23_farewell && (!(ending == "C") || (m23_beat && !m23_gone))' });
    // Mira: down the hill to meet him, then up it beside him
    person(P, { id: 'mira_foot', crew: 'mira', at: 'hillFoot', off: [0, 0, -4], turn: 0, prompt: 'TALK TO MIRA', when: 't_m23_pillarC && !m23_met' });
    person(P, { id: 'mira_walk', crew: 'mira', at: 'hillFoot', off: [0, 0, -5], turn: Math.PI, when: 'm23_met && !t_m23_climb' });
    person(P, { id: 'tala23', crew: 'tala', at: 'tala', off: [0, 0, 1.2], turn: Math.PI, prompt: 'TALK TO TALA', when: 'water_route', temporal: EVERY });
    person(P, { id: 'ezra23', crew: 'clockmaker', at: 'tellingStone', off: [1.6, 0, 4], turn: Math.PI, silent: true, when: 'ezra_debt' });
    person(P, { id: 'm23_listener', crew: 'm23_listener', first: 'One who listened', seed: 2302, ambient: true, at: 'busField', off: [-1.6, 0, 2], turn: Math.PI, silent: true, when: 'warned_evacuees' });
    person(P, { id: 'odile23', crew: 'odile', at: 'labGate', off: [3, 0, 2], turn: Math.PI, silent: true, when: 'odile_released' });
    person(P, { id: 'iven23', crew: 'iven', at: 'ivenStatement', off: [0, 0, 1.6], turn: Math.PI, silent: true, temporal: EVERY });
    person(P, { id: 'sera23', crew: 'sera', at: 'seraGarden', off: [0, 0, 1.6], turn: Math.PI, prompt: 'TALK TO SERA', temporal: EVERY });
    person(P, { id: 'anja23', crew: 'anja', at: 'anja', off: [2.4, 0, 0], turn: -Math.PI / 2, prompt: 'TALK TO ANJA', temporal: EVERY });
    person(P, { id: 'mira23', crew: 'mira', at: 'miraStands', off: [0, 0, 0], turn: 0, prompt: 'TALK TO MIRA', when: 't_m23_climb && !m23_mira_gone' });
    // the endings' people (Runtime.ending stages them; Kai himself is not on screen): A, Kai under the 41's board; B,
    // Sera at the seam where one world ends, and someone on the other side; C, Mira at a window box in Rain City
    person(P, { id: 'kai_end', crew: 'kai', at: 'board41', silent: true, when: 'ending == "A"', temporal: EVERY });
    person(P, { id: 'sera_end', crew: 'sera', at: 'seam41', off: [0, 0, -5], silent: true, when: 'ending == "B"', temporal: EVERY });
    person(P, { id: 'm23_guard', crew: 'm23_guard', first: 'Someone', seed: 2303, ambient: true, at: 'seam41', off: [0, 0, 4], turn: Math.PI, silent: true, when: 'ending == "B"', temporal: EVERY });
    person(P, { id: 'mira_end', crew: 'mira', at: 'windowBox', silent: true, when: 'ending == "C"', temporal: EVERY });
  },
  // (the Finale has no hook: the ending sequence is Runtime.ending's; the voice in every speaker closes it)
  hook: { cue: 'postcredit', minutes: 5, lines: POSTCREDIT },
  done: 'ending',
};
M23.outro = M23.hook.lines;

export const FINALE = [M23];

// the endings: the bible's text (two paragraphs: what happens, and Kai's quote), and what each ending adds
// (§5 M23 "Ending additions": after the bible's text, before its quote)
export const ENDINGS = {
  A: {
    title: 'THE FIXED WORLD', text: ['Kai destroys the Chronolith. Temporal fractures close and history stabilizes, but Mira\'s reconstructed existence cannot survive.', 'For the first time, tomorrow belonged to tomorrow.'],
    after: [N('Rain City. The 41 is late.'), N('Kai Varen looks up at the board, and smiles at it.')],
  },
  B: {
    title: 'THE INFINITE WAR', text: ['Kai separates temporal states into independent branches. Mira survives, but civilizations begin fighting over the boundaries between timelines.', 'We had saved every possible tomorrow. None of them agreed on the future.'],
    after: [N('At the line where one world ends and the next begins, Sera Voss stands guard. On the other side, someone stands guard back.')],
  },
  C: {
    title: 'AFTERZERO', text: ['Kai becomes the anchor that absorbs contradictions. Mira wakes in a world where Kai was never born, with only a faint memory of a voice urging her to live.', 'I finally found a second that belongs to nobody.'],
    after: [N('Rain City, a Tuesday. The 41 is late.'), N('A woman plants something in a window box and hums three notes: up, up, and then down.'), { who: 'KAI', text: 'Live.', voice: { fx: 'echo' } }],
    // (the epilogue's lines come from the worlds Kai passed through, not from hers, where he was never born)
    frame: [N('In the worlds he passed through, what he did stayed done.')],
  },
};

// the endings, staged (Runtime.ending): one shot for the bible's text, one for each line the ending adds, and one for
// Kai's quote and the epilogue; Kai himself is never on screen (A has him under the 41's board, in a body of his own)
// (the ring's shots inside its circle of stones: from outside it the nearest stones and lintels filled the frame, black
// against the dawn: playtest v2.1 F04/F05)
const RING = { cam: [6.5, 8.6, -137], to: [4.2, 7.8, -139.5], look: [0, 8.4, -152] };
const STOP = { cam: [1, 3.2, 151], to: [-1.5, 2.9, 155], look: [-12.2, 2.9, 163.4] }; // (the 41's sign over the shelter)
export const ENDING_SHOTS = {
  A: [RING, STOP, { cam: [-11.6, 1.75, 162.2], to: [-11.4, 1.7, 162.6], look: [-9.4, 1.62, 163.4] }, { cam: [0, 5, 176], to: [0, 18, 160], look: [0, 3, 110] }],
  B: [RING, { cam: [7, 2.4, 108.5], to: [8.5, 2.9, 108.5], look: [0, 1.4, 108.5] }, { cam: [0, 6, 122], to: [0, 22, 100], look: [0, 0, 60] }],
  C: [{ cam: [6.8, 6.6, -137.5], to: [4, 6.2, -140], look: [0, 8.6, -152] }, STOP, { cam: [-11.4, 1.75, 174.5], to: [-11.7, 1.7, 173], look: [-13.6, 1.3, 169.5] },
    { cam: [-12, 1.6, 171.6], to: [-12.2, 1.6, 171.2], look: [-13.3, 1.5, 169.5] }, { cam: [-10, 3, 172], to: [0, 20, 160], look: [0, 2, 120] }],
};
