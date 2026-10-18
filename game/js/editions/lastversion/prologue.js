// THE LAST VERSION OF EARTH: the Prologue, THE ZERO SECOND (about two hours).
//
//   Mission 1  THE LAST NORMAL DAY   Rain City, 2049 (an open district, theme 'rain')
//   Mission 2  HELIX GOES DARK       the Helix facility under emergency light (authored rooms)
//   Mission 3  THE FIRST SWITCH      the facility cycling 2049 / 2026 / 2196 (authored rooms, three states)
//
// Everything here is authored. Lines quoted from the bible are verbatim; the rest
// follows its voice rules: short in danger, longer in safe places, objects and
// disagreement instead of speeches, recurring phrases that change meaning.
import { Deck, makeClock, makeToy, makeScreen, makeCell, makePanel, makeDrawing, makeChronolith, makeBoard } from './Build.js';
import { AMBIENT, DIALOGUE, JUN_HOOK, IVEN_HOOK, intent } from './npcs.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text, when) => L('NONE', text, when);
const K = (text, when) => L('KAI', text, when);

// Rain City's people: commuters on the sidewalks, a crowd at the checkpoint, waiters on the platform
function commuters(M, rng) {
  const A = AMBIENT.rain;
  let k = 0;
  const add = (pos, o = {}) => M.npcs.push({
    id: `amb_${k}`, crew: `amb_${k}`, first: A.names[k % A.names.length], seed: 100 + k, ambient: true,
    pronoun: k % 2 ? { their: 'his', them: 'him' } : { their: 'her', them: 'her' },
    pos, yaw: o.yaw ?? rng.float(0, 6.28), barks: o.barks || A.barks, barkEvery: 22, freezeWhen: 'zero_second && !after_zero', silent: !o.talk, ...o, id: `amb_${k++}`,
  });
  // walkers along the sidewalks (each a loop between two points)
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * 5.9;
    const z0 = -8 - i * 6, z1 = z0 - rng.float(12, 22);
    add([x, 0, z0], { path: [[x, z0], [x, z1]], speed: rng.float(0.9, 1.3) });
  }
  // the crowd before the checkpoint
  for (let i = 0; i < 6; i++) add([-3.6 + i * 1.5, 0, -56 - (i % 3) * 1.4], { yaw: Math.PI, barks: [A.barks[0], A.barks[1], A.barks[3]] });
  // waiting on the platform
  for (let i = 0; i < 4; i++) add([-3 + i * 2.6, 0, -80 - i * 3.5], { yaw: -Math.PI / 2 });
}

export const M01 = {
  key: 'm01', n: 1, chapter: 'prologue', name: 'THE LAST NORMAL DAY', title: 'Rain City, 2049', subtitle: 'Eight-fourteen on a Tuesday. The 41 is late.',
  // PAST here is not 2026: it is 8:13, the minute before the crash, which the station keeps falling back into (quest chain A)
  kind: 'zone', theme: 'rain', sectors: 1, states: ['PRESENT', 'PAST'], canal: false, drones: [0], noDress: true, stateWeather: { PAST: 'rain' },
  ambience: 'rain',
  palette: { fog: 0x6f7c8c, wall: '#5a6470', floor: '#3a4048', accent: 0xffc06a, accent2: 0x9fd8ff, light: 0xffe0b0, tint: 0x6a7890, night: 0.55, weather: 'rain', sky: 'night', grade: { shadowTint: 0x1c2a44, highlightTint: 0xffe6c8, toning: 0.16, contrast: 1.1, saturation: 0.92 } },
  rooms: ['RAIN CITY - SOUTH SQUARE'], motto: 'RAIN CITY',
  gate: 'HELIX TEMPORAL RESEARCH - STAFF ENTRANCE',
  // rects kept clear of buildings: the checkpoint band and the station
  clear: [[-34, -70, 34, -54], [-34, -101, 34, -72]],
  fragments: [[
    'A wet newspaper on a bench: HELIX DENIES "TIME TESTS" - DIRECTOR ROOK: "WE STUDY CLOCKS, NOT MIRACLES".',
    'A pharmacy receipt dated tomorrow. The total is right. The date is not.',
    'A child\'s mitten on the platform railing. Somebody has tied it there so it will not be lost twice.',
  ]],
  beats: [{ kind: 'custom', goal: 'Get to work.' }],
  overlay(M, si, { rng }) {
    // Kai's door
    M.texts.push({ text: 'VAREN - 4B', pos: [2.4, 2.3, 3.6], rotY: Math.PI, size: 0.36, color: '#ffe0b0' });
    commuters(M, rng);
    // --- the optional anomalies -----------------------------------------------------
    M.box([-7.0, 0, -17.2, -6.2, 0.45, -14.8], { mat: 'crate' }); // a bench
    M.npcs.push({ id: 'amb_child', crew: 'amb_child', first: 'Child', seed: 77, ambient: true, pronoun: { their: 'her', them: 'her' }, pos: [-6.4, 0, -18.2], yaw: 0.4, silent: true, height: 1.25, freezeWhen: 'zero_second && !after_zero' });
    M.inter.push({ id: 'toy', kind: 'scene', scene: 'toy', pos: [-6.0, 0.25, -16.6], r: 2.4, prompt: 'LOOK', model: () => makeToy(), once: true });
    M.box([5.85, 0, -30.15, 6.15, 3.0, -29.85], { mat: 'trimDark' }); // a transit clock on a pole
    M.inter.push({ id: 'clock', kind: 'scene', scene: 'clock', pos: [6.0, 3.1, -30], yaw: -Math.PI / 2, r: 3.2, prompt: 'LOOK AT THE CLOCK', model: () => makeClock({ mode: 'backwards' }), once: true });
    M.box([-6.15, 0, -44.15, -5.85, 1.3, -43.85], { mat: 'trimDark' }); // a shop's security feed on a stand
    M.inter.push({ id: 'camera', kind: 'scene', scene: 'camera', pos: [-6.0, 1.7, -44], yaw: Math.PI / 2, r: 3.0, prompt: 'WATCH THE FEED', model: () => makeScreen(0xbfe4ff), once: true });
    // --- Rook's call, on the way -----------------------------------------------------
    M.triggers.push({ box: [-5, -1, -27, 5, 4, -22], set: { rook_message: true }, once: true });
    // --- the checkpoint ---------------------------------------------------------------
    M.box([-34, 0, -62.4, -2, 2.4, -61.6], { mat: 'trim' });
    M.box([2, 0, -62.4, 34, 2.4, -61.6], { mat: 'trim' });
    M.box([-6.4, 0, -66, -2.4, 3.2, -62.6], { mat: 'facade' });
    M.texts.push({ text: 'CHECKPOINT - HELIX CONTRACTORS', pos: [-4.4, 3.6, -62.5], rotY: 0, size: 0.4, color: '#ffc06a' });
    M.box([-2, 0, -62.4, 2, 3.2, -61.6], { mat: 'door', when: '!checkpoint_passed', id: 'gate_checkpoint' });
    M.glows.push([-4.4, 0.02, -60.5, 3.2, 0xffc06a]);
    M.npcs.push({ id: 'guard', crew: 'guard', pos: [3.0, 0, -60.4], yaw: Math.PI, dialogue: DIALOGUE.guard, prompt: 'TALK TO THE OFFICER', freezeWhen: 'zero_second && !after_zero' });
    // --- the station ----------------------------------------------------------------------
    for (const z of [-76, -84, -92]) for (const x of [-12, 12]) M.box([x - 0.4, 0, z - 0.4, x + 0.4, 5, z + 0.4], { mat: 'pillar' });
    M.box([-14, 5, -96, 14, 5.4, -74], { mat: 'trimDark' });
    M.box([8, -0.02, -100, 30, 0.06, -74], { mat: 'trimDark' }); // the tracks
    M.box([7.8, 0.06, -100, 8.2, 0.09, -74], { mat: 'lamp', solid: false }); // the yellow line
    for (const x of [10.5, 12.5]) M.box([x - 0.08, 0.06, -100, x + 0.08, 0.12, -74], { mat: 'metal', solid: false });
    M.texts.push({ text: 'LINE 41 - ON TIME - 08:14', pos: [0, 4.2, -77.8], rotY: 0, size: 0.46, color: '#9fd8ff', when: '!zero_second' });
    M.texts.push({ text: 'LINE 41 - ARRIVING - YESTERDAY', pos: [0, 4.2, -77.8], rotY: 0, size: 0.46, color: '#ffc06a', when: 'zero_second' });
    M.inter.push({ id: 'board_back', kind: 'scene', scene: 'board', pos: [0, 4.2, -78.3], r: 0, prompt: '', model: () => makeBoard(5.2, 0.8) });
    M.inter.push({ id: 'clock_station', kind: 'scene', scene: 'station_clock', pos: [-11.5, 3.6, -84], yaw: Math.PI / 2, r: 3.0, prompt: 'LOOK AT THE CLOCK', model: () => makeClock({ mode: 'stopped' }), once: true, when: 'zero_second' });
    M.box([-16, 0, -82, -13, 2.8, -78], { mat: 'facade' });
    M.texts.push({ text: 'OPERATOR', pos: [-12.95, 2.3, -80], rotY: Math.PI / 2, size: 0.34, color: '#ffe0b0' });
    M.npcs.push({ id: 'jun', crew: 'jun', pos: [-12.2, 0, -80], yaw: Math.PI / 2, dialogue: DIALOGUE.jun, freezeWhen: 'zero_second && !after_zero' });
    // the 41, after the Zero Second: three carriages, the last one up on the platform
    M.box([9, 0, -99, 13, 3.4, -87], { mat: 'car', when: 'zero_second && !@PAST' });
    M.box([11, 0, -87, 15, 3.4, -78], { mat: 'car', when: 'zero_second && !@PAST' });
    M.box([5.5, 0.6, -78, 9.5, 4.0, -70.5], { mat: 'car', when: 'zero_second && !@PAST' });
    M.box([4.8, 0, -79, 5.6, 1.1, -76.5], { mat: 'crate', when: 'zero_second && !@PAST' }); // a bench, thrown
    M.texts.push({ text: '08:13', pos: [-11.6, 3.0, -84], rotY: Math.PI / 2, size: 0.5, color: '#ffe0b0', when: '@PAST' });
    // quest chain A, LAST TRAIN HOME: relay 41-B feeds the maintenance gate by Jun's booth
    M.box([-16, 0, -89, -15, 2.4, -87], { mat: 'prop' });
    M.box([-16.3, 0, -93.6, -15.9, 3.0, -90.4], { mat: 'door', when: '!jun_line', id: 'door_gate41' });
    M.texts.push({ text: 'MAINTENANCE GATE 41-B', pos: [-15.8, 3.4, -92], rotY: Math.PI / 2, size: 0.32, color: '#ffc06a' });
    M.texts.push({ text: 'RELAY 41-B', pos: [-14.9, 2.7, -88], rotY: Math.PI / 2, size: 0.3, color: '#9fd8ff' });
    M.inter.push({ id: 'relay', kind: 'scene', scene: 'relay', pos: [-14.6, 1.4, -88], yaw: Math.PI / 2, r: 2.6, prompt: 'INSPECT THE RELAY', model: () => makePanel(0x9fd8ff), when: 'zero_second && !@PAST && !jun_rerouted' });
    M.inter.push({ id: 'reroute', kind: 'scene', scene: 'reroute', pos: [-14.6, 1.4, -88], yaw: Math.PI / 2, r: 2.6, prompt: 'REROUTE THE POWER (8:13)', model: () => makePanel(0xffd27a), when: '@PAST && !jun_rerouted' });
    M.inter.push({ id: 'relay_choice', kind: 'scene', scene: 'relay_choice', pos: [-14.6, 1.4, -88], yaw: Math.PI / 2, r: 2.6, prompt: 'THE RELAY: THE LINE, OR THE EVIDENCE', model: () => makePanel(0x7fe0a8), when: 'jun_rerouted && !jun_choice && !@PAST' });
    M.texts.push({ text: 'LINE 41 - EVACUATION SERVICE - BOARDING', pos: [0, 3.5, -77.8], rotY: 0, size: 0.36, color: '#7fe0a8', when: 'jun_line' });
    M.texts.push({ text: 'HELIX EVIDENCE TERMINAL - ONLINE', pos: [-12.95, 1.7, -80], rotY: Math.PI / 2, size: 0.26, color: '#7fe0a8', when: 'jun_evidence' });
    M.glows.push([7, 0.02, -82, 4, 0xff6a48]);
    M.npcs.push({ id: 'trapped_a', crew: 'trapped_a', first: 'Woman', seed: 201, ambient: true, pronoun: { their: 'her', them: 'her' }, pos: [6.2, 0, -89], yaw: -Math.PI / 2, when: 'zero_second && !rescued_a', scene: 'rescue_a', prompt: 'PULL HER FREE' });
    M.npcs.push({ id: 'trapped_b', crew: 'trapped_b', first: 'Man', seed: 202, ambient: true, pronoun: { their: 'his', them: 'him' }, pos: [3.9, 0, -74.5], yaw: Math.PI, when: 'zero_second && !rescued_b', scene: 'rescue_b', prompt: 'PULL HIM FREE' });
    // the Child in the Station (optional, recurring): only after the clocks stop
    M.npcs.push({ id: 'child', crew: 'child', pos: [-20, 0, -92], yaw: 0.6, hologram: true, height: 1.22, dialogue: DIALOGUE.child, when: 'zero_second', barks: ['Do you know the song? It goes up and then it goes up again and then it stops.'] });
    // Mira, for one second, at the far end
    M.npcs.push({ id: 'mira', crew: 'mira', pos: [0, 0, -99.2], yaw: 0, silent: true, when: 'voice_heard && !mira_gone' });
    M.triggers.push({ box: [-30, -1, -100, 30, 6, -73], set: { zero_second: true }, once: true, when: 'checkpoint_passed && rook_message' });
  },
  intro: [
    N('Rain City, 2049. Eight-fourteen on a Tuesday.'),
    K('The 41 is late. The 41 is never late.'),
  ],
  objectives: [
    { when: 'true', text: 'Get to Helix. The 41 is late, so walk.', because: 'It is a Tuesday.' },
    { when: 'rook_message', text: 'Reach the Helix staff gate, past the station.', because: 'Rook called. Rook never calls.' },
    { when: 'checkpoint_passed', text: 'Cross the station to the staff gate.', because: 'The checkpoint let me through.' },
    { when: 'zero_second', text: 'Get the trapped people out of the wreck.', because: 'The 41 came in at full speed. The clocks stopped first.' },
    { when: 'rescued', text: 'Find out who spoke through the speakers.', because: 'Every speaker said my name.' },
    { when: 'voice_heard', text: 'Follow the woman with Mira\'s face.', because: 'She has been dead for twenty-three years.' },
    { when: 'mira_gone', text: 'Go in. Rook is waiting.', because: 'The crowd closed. She was never there. The staff gate is open.' },
  ],
  hints: [
    { when: '!rook_message', tiers: ['Work is north. Everything in this city is north.', 'Follow the avenue. The phone will ring.', 'Walk north along the avenue until Rook calls.'] },
    { when: '!checkpoint_passed', tiers: ['The checkpoint is a conversation.', 'Talk to the officer at the gate. Any answer but silence gets me through.', 'Walk to the checkpoint, talk to the officer and pick anything but WAIT.'] },
    { when: '!zero_second', tiers: ['The station is past the checkpoint.', 'The platform. Jun Park is in the operator booth if I want to know why the board is wrong.', 'Walk onto the platform. Whatever is going to happen will happen there.'] },
    { when: '!rescued', tiers: ['Two people did not get clear of the train.', 'One by the carriage on the platform. One by the first carriage, further up the tracks.', 'Walk up to each of them and PULL FREE.'] },
    { when: '!mira_gone', tiers: ['She was at the far end of the station.', 'Walk toward her. Do not expect her to wait.', 'Walk to the woman by the north gate.'] },
    { when: 'mira_gone', tiers: ['The staff gate is open now.', 'North. Past where she stood.', 'Walk through the gate at the north end.'] },
  ],
  scenes: {
    toy: { lines: [N('A child drops a toy. It hits the pavement, bounces once - and then it is in her hand again, as if the pavement had never happened.'), K('I saw that backwards.')], set: { ev_toy: true }, log: 'A toy fell and then un-fell. The child did not notice. I did.' },
    clock: { lines: [N('The transit clock runs backward. The second hand is very sure of itself.'), K('Eight-fourteen. Eight-thirteen. Eight-twelve.')], set: { ev_clock: true }, log: 'A clock on the avenue runs backward, one confident second at a time.' },
    camera: { lines: [N('A security feed in a shop window. The timestamp says tomorrow. In it, this corner is empty and the rain has stopped.'), K('That\'s this corner. That\'s tomorrow.')], set: { ev_camera: true }, log: 'A camera is showing tomorrow. Tomorrow, the rain has stopped.' },
    relay: { lines: [N('Relay 41-B, the feed for the maintenance gate. Burnt through where the 41 hit the line.'), K('Dead now. It was live at 8:13. And 8:13 keeps coming back.')], set: { ev_relay: true }, log: 'Relay 41-B is dead in the present. Every forty-one seconds the station falls back to 8:13, when it was not.' },
    reroute: { lines: [N('8:13. The relay is whole and humming. You throw the bypass before the minute closes.'), K('Rerouted. In a minute that has already happened.')], set: { jun_rerouted: true, ev_gate_resets: true }, log: 'I rerouted the relay at 8:13, in the minute before the crash. The bypass held when the station came back.' },
    relay_choice: {
      lines: [N('The bypass held through the crash. The relay can carry the repaired line and get the passengers out, or feed the Helix evidence terminal in Jun\'s booth. Not both.')],
      choices: [
        intent('comfort', 'Run the line. Get them home.', { lines: [L('JUN', 'They\'re getting on. Kai - they\'re getting on.'), N('The gate opens. People Jun kept apologizing to walk out of the next carriage.')], set: { jun_line: true, jun_choice: true, quest_jun: 'resolved' }, log: 'I gave the relay to the line. Jun\'s passengers got off. Somebody will remember that route.' }),
        intent('investigate', 'Power the evidence terminal.', { lines: [N('The terminal wakes: a Helix order with Rook\'s name on it, timestamped before the Zero Second, which every recording says has not happened yet.'), L('JUN', 'I hope whatever\'s on it is worth a train.')], set: { jun_evidence: true, jun_choice: true, ev_rook_log: true, ev_rook_terminal: true, quest_jun: 'resolved' }, log: 'I gave the relay to the evidence terminal: Rook\'s order, timestamped before the Zero Second. The passengers stayed in the next carriage.' }),
      ],
    },
    station_clock: { lines: [N('Eight-fourteen. Both hands, and the second hand, and the one on the wall behind it. Every clock in the station agrees for the first time all day.')], set: { ev_stopped_clock: true } },
    rescue_a: { lines: [N('A woman pinned under a thrown bench, between the carriage and the wall.'), K('Hold on. I\'ve got you. Don\'t look at it, look at me.')], set: { rescued_a: true } },
    rescue_b: { lines: [N('A man with his coat caught in the door of a carriage that is not on the tracks any more.'), K('Arms out of the sleeves. Leave the coat. Leave it.')], set: { rescued_b: true } },
  },
  rules: [
    { id: 'rook_call', when: 'rook_message', say: [
      L('ROOK', 'Kai. Where are you.'), K('Twelve minutes out. The 41 is-'),
      L('ROOK', 'Not the front entrance. Staff gate, past the station. Come in now. Something happened in the chamber last night and I need you to tell me it didn\'t.'),
      K('Tell you what didn\'t happen?'), L('ROOK', 'Just come in.'),
    ] },
    { id: 'zero', when: 'zero_second', then: 'zeroSecond' },
    { id: 'rescued', when: 'rescued_a && rescued_b', set: { rescued: true }, then: 'afterRescue' },
  ],
  outro: [
    K('She died twenty-three years ago. I was at the funeral. I was twelve.'),
    N('The staff gate is open. Nobody is checking badges any more.'),
  ],
  done: 'mira_gone',
  // mission-specific behaviour the runtime calls by name
  fx: {
    zeroSecond(rt) {
      const g = rt.g;
      g.audio.silence(1.0);
      g.hud.flash('rgba(255,255,255,0.7)');
      g.deckWorld.flags.freeze_people = true;
      g.deckWorld.refresh();
      g.weather.set(null);
      g.hud.say([N('All the clocks stop.')], g.facts);
      g.after(1.1, () => {
        g.weather.set('rain');
        g.audio.caught();
        g.hud.flash('rgba(255,120,80,0.5)');
        g.hud.say([N('The 41 comes in at full speed and does not stop.'), K('Get back! Get off the platform!')], g.facts);
      });
      g.after(3.4, () => {
        g.deckWorld.flags.freeze_people = false;
        g.facts.set('after_zero');
      });
    },
    afterRescue(rt) {
      const g = rt.g;
      g.after(1.0, () => g.hud.say([
        L('ROOK', 'The event lasted one second.'), K('What event?'), L('ROOK', 'That\'s the problem. Every recording says it hasn\'t happened yet.'),
      ], g.facts, () => {
        g.hud.say([N('Every speaker in the station, at once:'), L('VOICE', 'Kai Varen. Do not build the machine.')], g.facts, () => {
          g.facts.set('voice_heard');
          g.deckWorld.refresh();
          g.hud.say([N('A woman in the crowd at the far end turns. For one second she has Mira\'s face.')], g.facts);
        });
      }));
    },
  },
  // Mira vanishes when you come close; the announcement repeats every 41 seconds
  step(rt, dt) {
    const g = rt.g;
    const f = g.facts;
    if (f.get('voice_heard') && !f.get('mira_gone')) {
      const m = g.deckWorld.npcs.find((n) => n.n.id === 'mira');
      if (m && m.model.visible && g.player.pos.distanceTo(m.model.position) < 3.6) {
        f.set('mira_gone');
        g.fx.burst(m.model.position.clone().setY(1.2).toArray(), 0xc4566a, 40, 1.6);
        g.deckWorld.refresh();
        g.hud.say([K('Mira?'), N('The crowd closes. There is nobody there.')], f);
      }
    }
    if (f.get('after_zero') && g.player.pos.z < -72) {
      rt.annT = (rt.annT ?? 38) + dt;
      if (rt.annT >= 41 && !g.hud.talking) {
        rt.annT = 0;
        g.hud.say([N('[ANNOUNCEMENT] The 8:14 service to Helix North is now arriving. Yesterday.')], f);
        // quest chain A: with the announcement the station falls back to 8:13 for a few seconds
        if (f.get('quest_jun') === 'active' && !f.get('jun_rerouted')) {
          g.engine.setState(g.room, 'PAST', { force: true });
          g.audio.sweep(true);
          if (!g.settings.comfort) g.hud.flash('rgba(255,210,150,0.35)');
          g.hud.toast('<small>08:13</small><br>For a few seconds it is a minute before the crash.', 2600);
          rt.flickT = 7;
        }
      }
    }
    if (rt.flickT > 0 && (rt.flickT -= dt) <= 0) {
      g.engine.setState(g.room, 'PRESENT', { force: true });
      g.audio.sweep(false);
    }
  },
};

// --- Mission 2: HELIX GOES DARK -------------------------------------------------------------
const HELIX_PALETTE = { look: 'med', fog: 0x2a2226, density: 1.6, wall: '#5c5a62', floor: '#3b3a40', accent: 0xff6a48, accent2: 0xffb36b, light: 0xffb0a0, tint: 0x6a4a4a, night: 0.55, weather: 'motes', sky: 'warehouse', probe: false, ink: 0.85, grade: { shadowTint: 0x2a1418, highlightTint: 0xffc0a8, toning: 0.24, contrast: 1.14, saturation: 0.92 } };

const HELIX_SENTINEL_HINTS = ['The drone watches the floor in front of it. Only that.', 'Stay behind the pillars. Move when it turns. The cell is in the alcove past its loop.', 'Wait behind a pillar until the drone walks away, then cross behind it to the alcove on the east side.'];

function buildHelixDark(story, si, rt) {
  const D = new Deck({ id: 'm02', deckName: 'HELIX', palette: HELIX_PALETTE, seed: 'lv', states: ['PRESENT'], estimateMin: 40 });
  // r0 SECURITY
  D.room({ id: 'security', name: 'SECURITY', W: 12, L: 14, H: 6, kind: 'arrival', beat: 'custom' }, (R) => {
    R.floor();
    R.text('HELIX TEMPORAL RESEARCH - STAFF', [0, 4.6, -13.9], 0, { size: 0.5, color: '#ffb0a0' });
    R.text('LOCKDOWN IN EFFECT', [-5.9, 3.2, -7], Math.PI / 2, { size: 0.5, color: '#ff6a48' });
    R.prop('desk', -4, -4);
    R.prop('console', -4, -5.2);
    R.prop('crate', 4.4, -10);
    R.prop('crate', 3.2, -11.4, { size: 0.5 });
    R.npc({ id: 'lin', crew: 'researcher', pos: [4.2, 0, -5], yaw: -Math.PI * 0.75, lines: [
      L('CREW', 'Don\'t go to the lift. The lift is dead. Everything below three is dead.'),
      K('Rook said system failure.'),
      L('CREW', 'Rook said it twice. Systems don\'t scream, Kai. Something screamed.'),
      L('CREW', 'Power cells. Three of them, somewhere on this floor. The lift takes three. I am not going to look for them.'),
    ], barks: AMBIENT.helix.barks });
    R.scene('intercom', [-4, 1.5, -5.6], 'ANSWER THE INTERCOM', { color: 0xff6a48, once: true, scene: 'intercom' });
    R.trigger([-6, -1, -14, 6, 5, -10], { helix_entered: true });
  });
  // r1 DARK CORRIDOR: a malfunctioning drone on a loop, pillars, the first cell in an alcove
  D.room({ id: 'corridor', name: 'DARK CORRIDOR', W: 16, L: 24, H: 6 }, (R) => {
    R.floor();
    for (const [x, z] of [[-4, -7], [4, -7], [0, -12], [-4, -17], [4, -17]]) R.pillar(x, z, 0.7);
    R.sentinel({ path: [[-6, -4], [6, -4], [6, -20], [-6, -20]], speed: 1.9, range: 8, fov: 0.8 });
    // the east alcove with cell one
    R.box([7, 0, -14, 8, 2.4, -10], { mat: 'prop' });
    R.item({ id: 'cell_1', kind: 'core', pos: [7.5, 2.75, -12], label: 'POWER CELL' });
    R.text('EMERGENCY LIGHTING - DO NOT RUN', [0, 4.6, -23.9], 0, { size: 0.42, color: '#ff6a48' });
    R.challenge('helix:drone', 0, -24, HELIX_SENTINEL_HINTS);
    R.checkpoint(0, -2, -1.6);
  });
  // r2 POWER ROOM: three sockets restore the lift; Iven Marr; cell two up a short stair; cell three in Iven's locker
  D.room({ id: 'power', name: 'POWER ROOM', W: 14, L: 18, H: 6.5 }, (R) => {
    R.floor();
    for (const [i, x] of [[0, -3], [1, 0], [2, 3]]) {
      R.prop('console', x, -16.4);
      R.inter({ id: `socket_${i}`, kind: 'socket', pos: [x, 1.3, -16], r: 2.4, prompt: 'LIFT POWER SOCKET', needs: 'cell', any: true });
    }
    R.text('LIFT POWER  0 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: '!cells_1' });
    R.text('LIFT POWER  1 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: 'cells_1 && !cells_2' });
    R.text('LIFT POWER  2 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: 'cells_2 && !lift_powered' });
    R.text('LIFT POWER  3 / 3 - READY', [0, 3.4, -17.9], 0, { size: 0.42, color: '#7fe0a8', when: 'lift_powered' });
    // a gantry on the west side, up a stair, with cell two
    R.ledge(-7, -14, -3.6, -6, 2.6);
    R.stairs(-5.2, -3.8, -6, 2.6);
    R.item({ id: 'cell_2', kind: 'core', pos: [-5.4, 3.05, -11], label: 'POWER CELL' });
    // Iven's locker, east: opens when he gives the code
    R.box([5.6, 0, -11, 7, 2.2, -9.4], { mat: 'prop' });
    R.box([5.5, 0, -11, 5.6, 2.2, -9.4], { mat: 'door', when: '!quest_iven', id: 'door_locker' });
    R.item({ id: 'cell_3', kind: 'core', pos: [6.3, 1.0, -10.2], label: 'POWER CELL', when: 'quest_iven' });
    R.text('MARR', [5.45, 1.8, -10.2], -Math.PI / 2, { size: 0.28, color: '#ffb36b' });
    R.npc({ id: 'iven', crew: 'iven', pos: [4.6, 0, -7.4], yaw: -Math.PI * 0.7, dialogue: DIALOGUE.iven, barks: ['I signed nothing. Remember that when they ask.'] });
    R.scene('shift_notes', [6.4, 1.1, -5], 'READ THE SHIFT NOTES', { yaw: -Math.PI / 2, model: () => makePanel(0xffb36b), once: true });
    R.prop('crate', -5, -3);
    R.checkpoint(0, -2, -1.6);
  });
  // r3 RECORDS: three recorded conversations; one officer can be trusted
  D.room({ id: 'records', name: 'RECORDS', W: 12, L: 14, H: 6 }, (R) => {
    R.floor();
    const recs = [
      ['rec_pryce', -4, 'OFFICER PRYCE - 05:52', 'Pryce, night desk. Chamber door is logged shut all night. Nobody went in. Nobody. I checked the log myself and the log is clean, so there is nothing to discuss.'],
      ['rec_haig', 0, 'OFFICER HAIG - 05:58', 'Haig. I was not on shift. I was home. If the roster says otherwise the roster is wrong, and I would like that noted before anyone asks me anything.'],
      ['rec_dale', 4, 'OFFICER DALE - 06:01', 'Dale. I opened the chamber at 05:40 on the director\'s order. I logged it. The log has been edited since and I would like to say so while the recording still exists.'],
    ];
    for (const [id, x, title, text] of recs) {
      R.prop('console', x, -5.4);
      R.inter({ id, kind: 'terminal', pos: [x, 1.25, -5], yaw: 0, r: 2.4, prompt: 'PLAY RECORDING', log: { title, text } });
    }
    R.text('ROSTER 05:00 - PRYCE · HAIG · DALE', [-5.9, 3.0, -8], Math.PI / 2, { size: 0.34, color: '#dfe8f0' });
    R.text('CHAMBER DOOR LOG - EDITED 06:10', [5.9, 3.0, -8], -Math.PI / 2, { size: 0.34, color: '#ff6a48' });
    R.prop('console', 0, -12.6);
    R.scene('whose_code', [0, 1.3, -12.2], 'ENTER AN OFFICER\'S CODE', { model: () => makePanel(0xff6a48) });
    R.box([-1.5, 0, -14.4, 1.5, 4, -14], { mat: 'door', when: '!officer_trusted', id: 'door_records' });
    R.checkpoint(0, -2, -1.6);
  });
  // r4 CONDUIT HALL: the unit that rewinds damage; a live conduit along the east wall
  D.room({ id: 'conduit', name: 'CONDUIT HALL', W: 16, L: 24, H: 7 }, (R) => {
    R.floor();
    for (const [x, z] of [[-5, -6], [-5, -12], [-5, -18], [2, -9], [2, -15]]) R.pillar(x, z, 0.65);
    R.box([6.6, 0, -20, 7.4, 1.0, -4], { mat: 'pipe' });
    R.box([6.4, 1.0, -14, 7.6, 1.6, -10], { mat: 'glow', solid: false, when: 'conduit_live' });
    R.text('CONDUIT 4 - DAMAGED', [7.9, 2.6, -12], -Math.PI / 2, { size: 0.4, color: '#ffb36b' });
    R.prop('console', -6.6, -21);
    R.scene('breaker', [-6.6, 1.3, -20.6], 'THROW THE BREAKER', { model: () => makePanel(0xff6a48), once: true });
    R.sentinel({ path: [[-2, -4], [5, -4], [5, -20], [-2, -20]], speed: 2.1, range: 9, fov: 0.85, conduit: [5.4, -15, 8, -9], conduitWhen: 'conduit_live', unit: true });
    R.challenge('helix:unit', 0, -24, ['It puts itself back together. I watched it do it.', 'The damaged conduit on the east wall. If it were live, and the unit walked through it...', 'Throw the breaker at the far console, let the unit see me, and lead it along the east wall through the conduit.']);
    R.box([-1.5, 0, -24.4, 1.5, 4, -24], { mat: 'door', when: '!unit_down', id: 'door_conduit' });
    R.checkpoint(0, -2, -1.6);
  });
  // r5 ARCHIVE: Mira's file, and the drawing
  D.room({ id: 'archive', name: 'ARCHIVE', W: 12, L: 14, H: 6 }, (R) => {
    R.floor();
    R.prop('shelf', -4, -4);
    R.prop('shelf', -4, -8);
    R.prop('shelf', 4, -4);
    R.prop('console', 4, -9);
    R.inter({ id: 'mira_file', kind: 'terminal', pos: [4, 1.25, -8.6], yaw: 0, r: 2.4, prompt: 'OPEN THE FILE', log: { title: 'HELIX JUNIOR PROGRAMME - 2026', text: 'VAREN, MIRA. Age nine. Admitted to the junior observation programme by the director\'s office. Status: discharged. Reason for discharge: redacted. Next of kin: VAREN, KAI, age twelve.' } });
    R.scene('drawing', [0, 1.7, -13.85], 'LOOK AT THE DRAWING', { model: () => makeDrawing(), once: true });
    R.text('LIFT - LEVEL -3', [-5.9, 3.2, -11], Math.PI / 2, { size: 0.4, color: '#ffb36b' });
    R.box([-1.5, 0, -14.4, 1.5, 4, -14], { mat: 'door', when: '!lift_powered || !drawing_seen', id: 'door_lift' });
    R.checkpoint(0, -2, -1.6);
  });
  // r6 THE LIFT and the chamber antechamber
  D.room({ id: 'chamber', name: 'CHRONOLITH CHAMBER', W: 16, L: 20, H: 9, kind: 'encounter', beat: 'custom' }, (R) => {
    R.floor();
    R.text('CHAMBER - AUTHORISED PERSONNEL - DIRECTOR\'S OFFICE', [0, 6.2, -19.9], 0, { size: 0.42, color: '#ff6a48' });
    R.scene('chronolith', [0, 3.6, -12], 'APPROACH THE CHRONOLITH', { model: () => makeChronolith(1.6), r: 4.5, once: true });
    R.box([-3, -T0, -15, 3, 0.02, -9], { mat: 'glow', solid: false });
    R.checkpoint(0, -2, -1.6);
  });
  return D.finish({ gated: true });
}
const T0 = 0.4;

export const M02 = {
  key: 'm02', n: 2, chapter: 'prologue', name: 'HELIX GOES DARK', title: 'Helix Temporal Research Facility', subtitle: 'Lockdown. Emergency light. Rook calls it a system failure.',
  kind: 'custom', build: buildHelixDark, sectors: 1, states: ['PRESENT'], palette: HELIX_PALETTE, dark: 0.45,
  ambience: 'hum',
  intro: [
    N('The facility is dark. Every third light is red. Somewhere below, a pump is running backwards.'),
    L('ROOK', 'Kai. Lockdown is procedure. The chamber is off limits. Work from the lab.'),
    K('What happened in the chamber?'),
    L('ROOK', 'A system failure.'),
  ],
  objectives: [
    { when: 'true', text: 'Find a way down to the chamber.', because: 'Rook says it is off limits. Rook never says where things are.' },
    { when: 'helix_entered', text: 'Find three power cells and restore the lift.', because: 'The lift takes three cells. The lift is the only way down.' },
    { when: 'lift_powered', text: 'Get past security and reach the lift on level -3.', because: 'The lift has power. The doors between here and there do not know it yet.' },
    { when: 'drawing_seen', text: 'Enter the Chronolith chamber.', because: 'Somebody drew me beside the machine, twenty-three years ago.' },
  ],
  hints: [
    { when: '!cells_1 && !quest_iven', tiers: ['Three cells. One is past the drone.', 'The drone only watches what is in front of it. There is an alcove on the east side of the corridor.', 'In the corridor, wait behind a pillar until the drone passes, then take the cell from the east alcove and carry it to a socket in the power room.'] },
    { when: '!lift_powered', tiers: ['Three sockets on the far wall of the power room. Three cells.', 'One cell is in the corridor alcove, one on the gantry up the stair, and one in Marr\'s locker. Marr talks if I do.', 'Talk to Iven Marr and the locker opens. Carry each cell to a socket.'] },
    { when: 'lift_powered && !officer_trusted', tiers: ['Three recordings. One officer told the truth.', 'Compare each recording with the roster and the door log on the walls.', 'Dale\'s recording matches the edited log. Enter Dale\'s code.'] },
    { when: 'officer_trusted && !unit_down', tiers: ['The unit rewinds its own damage. I cannot outlast it.', 'The breaker at the far console makes the damaged conduit live.', 'Throw the breaker, let the unit see me, then lead it along the east wall through the conduit.'] },
    { when: 'unit_down && !drawing_seen', tiers: ['The archive is small. Look at the walls.', 'A child\'s drawing by the lift door.', 'Look at the drawing on the far wall of the archive.'] },
    { when: 'drawing_seen', tiers: ['The lift.', 'Through the lift door at the end of the archive.', 'Walk through the lift door and into the chamber.'] },
  ],
  scenes: {
    intercom: { lines: [L('ROOK', 'Kai. The chamber is off limits.'), K('Then why did you call me in?'), L('ROOK', 'Because you are the only one who can tell me the readings are wrong.'), K('Are they wrong?'), L('ROOK', 'Come to the lab and tell me.')], log: 'Rook wants me to say the readings are wrong. He did not say what they read.' },
    shift_notes: { lines: [N('Marr\'s shift notes, in pencil, taped to the panel: "Test moved to 05:40 by director\'s office. Not approved by maintenance. Not signed by me. - I.M."')], set: { ev_rook_log: true }, log: 'Iven Marr\'s shift notes: the test was moved to 05:40 by Rook\'s office, and Marr refused to sign.' },
    whose_code: {
      lines: [N('The panel wants an officer\'s code. Three names on the roster.')],
      choices: [
        { intent: 'investigate', label: 'Dale', lines: [N('The door accepts Dale\'s code.'), K('He logged it. They edited the log, and he said so anyway.')], set: { officer_trusted: true, ev_dale: true } },
        { intent: 'investigate', label: 'Pryce', lines: [N('ACCESS DENIED. ALERT.'), K('Pryce said the log was clean. The log was edited at 06:10.')], then: 'alarm' },
        { intent: 'investigate', label: 'Haig', lines: [N('ACCESS DENIED. ALERT.'), K('Haig said she was home. The roster has her at 05:00.')], then: 'alarm' },
        { intent: 'withdraw', label: 'Listen again' },
      ],
    },
    breaker: { lines: [N('The breaker goes over with a sound like a dropped tray. Along the east wall, the damaged conduit begins to spit light.'), K('Now it just has to see me.')], set: { conduit_live: true } },
    drawing: {
      lines: [N('A child\'s drawing, pinned to the wall of the archive: two figures holding hands beside a black circular machine. KAI + MIRA, in crayon.'), K('This drawing is twenty-three years old.'), L('ROOK', 'Then someone has been using your credentials.'), K('I was twelve.')],
      set: { drawing_seen: true, ev_drawing: true }, log: 'A drawing of me and Mira beside a black ring, twenty-three years old, in the archive of a facility that did not exist then.',
    },
    chronolith: { lines: [N('A black ring, taller than the room should allow. It is not running. It is waiting.'), K('Mira drew this. Before any of it was built.')], set: { chronolith_seen: true } },
  },
  rules: [
    { id: 'cells', when: 'cells_3', set: { lift_powered: true }, say: [N('The lift wakes up three floors down. You feel it through the floor before you hear it.')] },
    { id: 'unit', when: 'unit_down', say: [N('The unit walks into the live conduit and stops rewinding. It stands very still, and then it is only a shape.'), K('It couldn\'t put that back.')] },
  ],
  fx: {
    alarm(rt) {
      const g = rt.g;
      g.audio.alert();
      g.hud.flash('rgba(255,90,60,0.5)');
      g.after(0.6, () => g.deckSetback('caught'));
    },
  },
  outro: [N('The chamber door closes behind you. The ring does not move. Everything else in the room has started to.')],
  done: 'chronolith_seen',
};

// --- Mission 3: THE FIRST SWITCH ------------------------------------------------------------
const SWITCH_PALETTE = { ...HELIX_PALETTE, fog: 0x1e2430, wall: '#58606c', floor: '#363c46', accent: 0x4f9fe8, accent2: 0xc08a3e, light: 0xcfe0ff, tint: 0x4a5a7a, night: 0.4, weather: null, grade: { shadowTint: 0x14243a, highlightTint: 0xe0ecff, toning: 0.18, contrast: 1.12, saturation: 0.96 } };

// Iven Marr in the maintenance route (quest chain D)
const IVEN_ROUTE = [
  {
    when: '!quest_iven', lines: [...IVEN_HOOK, L('IVEN', 'My team is behind that lock. So is the raw log. The lock resets every time the building changes its mind about the year.')],
    choices: [
      intent('comfort', 'Your team first.', { lines: [L('IVEN', 'The service panel is in 2026. It was installed before the drone was. I\'ll keep the drone busy.')], trust: 1, quest: 'active', set: { iven_busy: true }, then: 'ivenLure' }),
      intent('investigate', 'Who signed for the test?', { lines: [L('IVEN', 'Rook\'s name is on the order. Mine is on the sheet that says no. Service panel is in 2026, if you want to see for yourself.')], ev: 'iven_testimony', quest: 'active' }),
      intent('withdraw', 'Not now.'),
    ],
  },
  { when: 'quest_iven == "active" && !iven_busy', lines: [L('IVEN', 'You came back. Panel in 2026, then in, before you change your mind about the year.'), K('And the drone?'), L('IVEN', 'I\'ll keep it busy. It knows my face. It thinks I\'m still on shift.')], set: { iven_busy: true }, then: 'ivenLure' },
  { when: 'quest_iven == "active"', lines: [L('IVEN', 'Panel in 2026. Then in. The terminal only answers in your year.')] },
  { when: 'iven_team_saved', lines: [L('IVEN', 'Three of them. All three. Nobody signs for that either, but I will.')] },
  { when: 'ev_raw_log', lines: [L('IVEN', 'You have the log. Use it on him. That is the only way it was worth it.')] },
];

function buildFirstSwitch(story, si, rt) {
  const D = new Deck({ id: 'm03', deckName: 'HELIX', palette: SWITCH_PALETTE, seed: 'lv', states: ['PRESENT', 'PAST', 'FUTURE'], unstable: true, estimateMin: 40 });
  // r0 the chamber: the Chronolith teaches the switch
  D.room({ id: 'chamber', name: 'CHRONOLITH CHAMBER', W: 16, L: 20, H: 9, kind: 'arrival', beat: 'custom' }, (R) => {
    R.floor();
    R.scene('touch', [0, 3.6, -12], 'TOUCH THE CHRONOLITH', { model: () => makeChronolith(1.6), r: 4.5, once: true });
    // 2026: scaffolding around a half-built ring, a thermos; 2196: the ceiling gone, moss, a fallen beam
    for (const [x, z] of [[-5, -8], [5, -8], [-5, -16], [5, -16]]) R.box([x - 0.15, 0, z - 0.15, x + 0.15, 7, z + 0.15], { mat: 'trimDark', when: '@PAST' });
    R.box([-5, 4.0, -16, 5, 4.2, -8], { mat: 'crate', solid: false, when: '@PAST' });
    R.text('HELIX - CHAMBER 1 - UNDER CONSTRUCTION - 2026', [0, 6.2, -19.9], 0, { size: 0.42, color: '#ffd9a0', when: '@PAST' });
    R.text('CHAMBER - AUTHORISED PERSONNEL - DIRECTOR\'S OFFICE', [0, 6.2, -19.9], 0, { size: 0.42, color: '#9fd8ff', when: '@PRESENT' });
    R.box([-8, 0, -20, 8, 0.3, -2], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.box([-7, 3, -14, 7, 3.4, -13.6], { mat: 'industrial', when: '@FUTURE' });
    R.text('2196', [0, 6.2, -19.9], 0, { size: 0.5, color: '#9fe8c8', when: '@FUTURE' });
    R.box([-1.5, 0, -20.4, 1.5, 4, -20], { mat: 'door', when: '!has_chronolith', id: 'door_chamber' });
    R.checkpoint(0, -2, -1.6);
  });
  // r1 the cable: connect it in 2026, throw the power in 2049
  D.room({ id: 'cable', name: 'TEMPORAL LAB', W: 14, L: 18, H: 6.5 }, (R) => {
    R.floor();
    R.prop('desk', -4, -5);
    R.prop('console', 4, -5);
    // in 2026 the far third of the floor is open framing: a cable drum on the floor, the socket on the wall
    R.box([-7.4, -0.4, -18, 7.4, 0, -12], { mat: 'trimDark', when: '@PAST' });
    R.item({ id: 'cable', kind: 'key', pos: [-4, 1.0, -9], echo: true, label: 'POWER CABLE' });
    R.box([-4.6, 0, -9.6, -3.4, 0.5, -8.4], { mat: 'prop', when: '@PAST' });
    R.inter({ id: 'cable_socket', kind: 'socket', pos: [5.9, 1.3, -14], yaw: -Math.PI / 2, r: 2.4, prompt: 'CABLE SOCKET (2026)', needs: 'cable', only: 'PAST' });
    R.text('MAIN FEED - NOT CONNECTED', [5.9, 2.6, -14], -Math.PI / 2, { size: 0.34, color: '#ffd9a0', when: '!cable_connected' });
    R.text('MAIN FEED - CONNECTED', [5.9, 2.6, -14], -Math.PI / 2, { size: 0.34, color: '#7fe0a8', when: 'cable_connected' });
    R.prop('console', 0, -16.6);
    R.scene('power', [0, 1.3, -16.2], 'ACTIVATE THE POWER (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT' });
    R.box([-1.5, 0, -18.4, 1.5, 4, -18], { mat: 'door', when: '!power_on', id: 'door_cable' });
    R.box([-7, 0, -18, 7, 0.25, -2], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.challenge('switch:cable', 0, -18, ['The cable only exists in 2026. The switch only works in 2049.', 'Switch to 2026 (the room cycles with Q, or 1 / 2 / 3). Take the cable to the socket on the east wall. Then switch back and throw the power.', 'Press 2 for 2026, take the cable, use the socket on the east wall, press 1 for 2049, use the panel at the far end.']);
    R.checkpoint(0, -2, -1.6);
  });
  // r2 collapsed machinery: in 2196 a lift platform spans it; stability drains while you are there
  D.room({ id: 'collapse', name: 'MACHINE HALL', W: 14, L: 22, H: 7 }, (R) => {
    R.floor(0, -6);
    R.pit(-6, -16, { depth: 5 });
    R.floor(-16, -22);
    // 2196: a maintenance lift, left parked across the gap, and the moss that grew on it
    R.box([-1.6, -0.4, -16.4, 1.6, 0, -5.6], { mat: 'industrial', when: '@FUTURE' });
    R.box([-1.6, 0, -16.4, 1.6, 0.05, -5.6], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.text('LIFT PARKED - 2196', [0, 3.5, -21.9], 0, { size: 0.42, color: '#9fe8c8', when: '@FUTURE' });
    R.text('MACHINE HALL - FLOOR COLLAPSED', [0, 3.5, -21.9], 0, { size: 0.42, color: '#9fd8ff', when: '!@FUTURE' });
    R.challenge('switch:lift', 0, -22, ['The floor is gone in every year but one.', 'In 2196 somebody parked a lift across the gap. Stability drains out there, so do not linger.', 'Press 3 for 2196, cross on the parked lift, press 1 for 2049 on the far side.']);
    R.checkpoint(0, -2, -1.6);
    R.checkpoint(-16, -22, -18);
  });
  // r3 quest chain D, THE TECHNICIAN'S KEY: Marr's maintenance route, behind a lock that resets
  // after every switch; the service panel exists only in 2026, the drone only in 2049
  D.room({ id: 'route', name: 'MAINTENANCE ROUTE', W: 16, L: 22, H: 6.5 }, (R) => {
    R.floor();
    R.npc({ id: 'iven3', crew: 'iven', pos: [-4.2, 0, -3.6], yaw: Math.PI * 0.8, dialogue: IVEN_ROUTE, barks: ['Panel was installed before the drone was.'] });
    R.pillar(-2.4, -11, 0.6);
    R.prop('crate', -5.6, -17.4);
    // the service panel: 2026 only
    R.box([-8, 0.6, -11.8, -7.7, 2.0, -10.2], { mat: 'prop', when: '@PAST' });
    R.scene('service_panel', [-7.5, 1.3, -11], 'SERVICE PANEL (2026)', { yaw: Math.PI / 2, model: () => makePanel(0xffd27a), when: '@PAST && !maint_open' });
    R.text('SERVICE PANEL - REMOVED 2031', [-7.9, 2.4, -11], Math.PI / 2, { size: 0.3, color: '#9fd8ff', when: '!@PAST' });
    // the maintenance strip along the east wall, behind a partition and a lock
    R.box([3, 0, -18, 3.4, 6.5, -12]);
    R.box([3, 0, -9, 3.4, 6.5, -4]);
    R.box([3, 4, -12, 3.4, 6.5, -9]);
    R.box([3, 0, -12, 3.4, 4, -9], { mat: 'door', when: '!maint_open', id: 'door_maint' });
    R.box([3.4, 0, -4.4, 8, 6.5, -4]);
    R.box([3.4, 0, -18, 8, 6.5, -17.6]);
    R.text('MAINTENANCE ROUTE - M. TEAM ONLY', [2.95, 4.6, -10.5], -Math.PI / 2, { size: 0.3, color: '#ffb36b' });
    R.text('LOCK RESETS ON STATE CHANGE', [2.95, 3.9, -10.5], -Math.PI / 2, { size: 0.24, color: '#ff6a48' });
    R.scene('release', [3.7, 1.3, -7.2], 'MANUAL RELEASE', { yaw: -Math.PI / 2, model: () => makePanel(0xff6a48), when: '!maint_open' });
    R.prop('console', 6.6, -15.6);
    R.scene('iven_terminal', [6.6, 1.3, -15.1], 'THE RAW LOG / THE TEAM (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT && quest_iven != "resolved"' });
    R.text('THE TEAM IS IN 2049', [6.6, 2.6, -17.5], 0, { size: 0.3, color: '#ffd9a0', when: '!@PRESENT' });
    R.prop('crate', 5.2, -6.2, { size: 0.5 });
    for (const [k, x, z] of [[0, 5.0, -12.6], [1, 6.4, -11.2], [2, 5.6, -9.4]]) R.npc({ id: `tech_${k}`, crew: `tech_${k}`, first: 'Technician', seed: 310 + k, ambient: true, pronoun: k === 1 ? { their: 'her', them: 'her' } : { their: 'his', them: 'him' }, pos: [x, 0, z], yaw: -Math.PI / 2, silent: true, when: 'iven_team_saved' });
    // the drone: 2049 only
    R.sentinel({ path: [[-6, -7], [1.6, -7], [1.6, -15.4], [-6, -15.4]], speed: 1.7, range: 7.5, fov: 0.8, when: '@PRESENT' });
    R.challenge('helix:route', 0, -22, ['The drone only exists in 2049.', 'Cross in another year, or let Marr keep it busy. Stability drains out of 2049.', 'Switch to 2026 or 2196 and walk straight through to the far door, then switch back.']);
    R.checkpoint(0, -2, -1.6);
  });
  // r4 control: the keycard waits in 2026 (anchor it), the panel works in 2049
  D.room({ id: 'control', name: 'CONTROL', W: 12, L: 16, H: 6, kind: 'encounter', beat: 'custom' }, (R) => {
    R.floor();
    R.prop('desk', 4, -4);
    R.item({ id: 'keycard', kind: 'key', pos: [4, 1.1, -4], echo: true, label: 'KEYCARD (2026)' });
    R.text('CONTROL ROOM - CARD ACCESS', [-1.9, 4.4, -9.9], 0, { size: 0.36, color: '#9fd8ff' });
    R.box([-5.6, 0, -10.4, -1.5, 4.5, -10], { mat: 'wall' });
    R.box([1.5, 0, -10.4, 5.6, 4.5, -10], { mat: 'wall' });
    R.box([-1.5, 0, -10.4, 1.5, 4, -10], { mat: 'door', when: '!open_control', id: 'door_control' });
    R.inter({ id: 'lock_control', kind: 'lock', pos: [2.2, 1.3, -9.6], r: 2.4, prompt: 'CARD LOCK (2049)', needs: 'keycard', opens: 'open_control' });
    R.prop('console', 0, -14.6);
    R.scene('panel', [0, 1.3, -14.2], 'THE CONTROL PANEL (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT && open_control' });
    R.challenge('switch:anchor', 0, -16, ['The lock reads 2049. The card is on a desk in 2026.', 'Whatever I carry out of 2026 comes apart in 2049 - unless I hold on to it. C anchors what I carry.', 'Press 2, take the keycard, press C to anchor it, press 1, use the lock, then the panel.']);
    R.checkpoint(0, -2, -1.6);
  });
  return D.finish({ gated: true });
}

export const M03 = {
  key: 'm03', n: 3, chapter: 'prologue', name: 'THE FIRST SWITCH', title: 'Helix, three years at once', subtitle: '2049. 2026. 2196. The facility cannot decide.',
  kind: 'custom', build: buildFirstSwitch, sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], unstable: true, palette: SWITCH_PALETTE,
  ambience: 'hum',
  intro: [N('The ring is awake. The room has three dates and is trying all of them.')],
  objectives: [
    { when: 'true', text: 'Touch the Chronolith.', because: 'It is waiting. I think it is waiting for me.' },
    { when: 'has_chronolith', text: 'Connect the cable in 2026, then activate the power in 2049.', because: 'The lab was never finished in one year.' },
    { when: 'power_on', text: 'Cross the collapsed machine hall.', because: 'The floor fell in. In one year, something is parked across the gap.' },
    { when: 'crossed', text: 'Reach the control panel in 2049.', because: 'The card lock reads this year. The card is in another.' },
    { when: 'fractured', text: 'Hold on.', because: 'The facility is coming apart. So is the year.' },
  ],
  hints: [
    { when: '!has_chronolith', tiers: ['The ring.', 'Walk up to it.', 'Approach the Chronolith and touch it.'] },
    { when: 'has_chronolith && !cable_connected', tiers: ['Switch years. Q cycles the room; 1, 2 and 3 pick one.', 'In 2026 there is a cable drum on the floor and a socket on the east wall.', 'Press 2, take the cable, use the socket on the east wall of the lab.'] },
    { when: 'cable_connected && !power_on', tiers: ['The feed is connected in 2026. The switch is in 2049.', 'Back to 2049 and the panel at the far end.', 'Press 1 and use the panel at the far end of the lab.'] },
    { when: 'power_on && !crossed', tiers: ['The floor is gone in every year but one.', 'In 2196 a lift is parked across the gap. Stability drains out there.', 'Press 3, cross on the lift, press 1 on the far side.'] },
    { when: 'crossed && !open_control', tiers: ['The lock reads 2049. The card is somewhere else.', 'The card is on the desk in 2026. Things from 2026 come apart in 2049 unless anchored. C anchors.', 'Press 2, take the keycard, press C, press 1, use the lock.'] },
    { when: 'open_control && !fractured', tiers: ['The panel.', 'In 2049.', 'Press 1 if needed and use the control panel.'] },
  ],
  scenes: {
    touch: { lines: [N('You put your hand on the ring. It is cold, and then it is every temperature it has ever been.')], set: { has_chronolith: true }, then: 'firstCycle', log: 'The Chronolith let me in. The room has three dates: 2026, 2049, 2196. I can choose which one I stand in.' },
    power: { when: 'cable_connected', lines: [N('The main feed comes up. Twenty-three years late, the lab has power.'), K('Connected in 2026. Switched on in 2049. That should not work.'), L('ROOK', 'It works. That is the problem.')], set: { power_on: true }, log: 'A cable connected in 2026 carries power in 2049. The years are not separate.' },
    power_no: { lines: [N('The panel is dead. MAIN FEED - NOT CONNECTED.'), K('Not connected. Not connected when?')] },
    service_panel: { lines: [N('A service panel from 2026, before the drone, before the lock had opinions. The release takes.'), K('Open. Until I change the year.')], set: { maint_open: true }, log: 'The 2026 service panel opens Marr\'s maintenance route. The lock resets the moment the year changes.' },
    release: { lines: [N('The manual release clunks. The route is open again, until the next switch.')], set: { maint_open: true } },
    iven_terminal: {
      lines: [N('The maintenance terminal, in 2049. Three technicians are sealed in the lower conduit, and the raw experiment log is open on the same circuit. The building is about to change its mind about the year.')],
      choices: [
        intent('comfort', 'Get the team out first.', { npc: 'iven', lines: [N('The conduit hatch opens. Three technicians climb out into a building that cannot decide what year it is, which is still better than the room they were in.'), L('IVEN', 'That is the whole of my statement, when they ask. You got them out.')], set: { iven_team_saved: true, quest_iven: 'resolved' }, trust: 1, log: 'I opened the conduit for Marr\'s team. The raw log went with the circuit.' }),
        intent('investigate', 'Keep the raw log.', { npc: 'iven', lines: [N('The log holds, unedited: the director\'s order, Marr\'s refusal, the test at 05:40, and a second entry at 05:40 that nobody wrote.'), L('IVEN', 'I would have chosen them. I understand why you did not.')], set: { ev_raw_log: true, ev_rook_log: true, quest_iven: 'resolved' }, trust: -1, log: 'I kept the raw experiment log: Rook\'s order, Marr\'s refusal, and an entry at 05:40 that nobody wrote. Marr\'s team waited.' }),
      ],
    },
    panel: {
      lines: [K('Control. Finally.'), N('The panel shows three dates, and a fourth it cannot name. Then every date on it starts to count the wrong way.'), L('ROOK', 'Kai, get out of there. The chamber is reading-'), N('The floor remembers being earth. The walls remember being nothing. The year lets go of you.')],
      set: { fractured: true }, then: 'fracture', log: 'The facility fractured. I was pulled into the past.',
    },
  },
  rules: [
    { id: 'crossed', when: 'crossed', say: [K('Across. In a year that has not happened yet.')] },
  ],
  // quest chain D: the maintenance lock resets every time the building changes its mind about the year
  onShift(rt) {
    const g = rt.g;
    if (g.facts.get('maint_open')) {
      g.facts.set('maint_open', false);
      g.deckWorld.refresh();
      g.hud.toast('<small>MAINTENANCE ROUTE</small><br>The lock resets.', 1800);
    }
  },
  fx: {
    ivenLure(rt) {
      // Marr walks out in front of the drone; it knows his face and follows him for a while
      const g = rt.g;
      const iv = g.deckWorld.npcs.find((n) => n.n.id === 'iven3');
      if (!iv) return;
      for (const s of g.deckWorld.sentinels) if (s.def.room === 'route') s.lure = { x: iv.model.position.x, z: iv.model.position.z, t: 45 };
      g.hud.toast('<small>IVEN MARR</small><br>The drone follows him. 45 seconds.', 2400);
    },
    firstCycle(rt) {
      const g = rt.g;
      const room = g.room;
      g.engine.setState(room, 'PAST', { force: true });
      g.audio.sweep(true);
      g.hud.say([N('2026. Scaffolding. The ring is half built, and someone has left a thermos on it.')], g.facts, () => {
        g.engine.setState(room, 'FUTURE', { force: true });
        g.audio.sweep(true);
        g.hud.say([N('2196. The ceiling is gone. Rain falls on the ring, and the ring is still here.')], g.facts, () => {
          g.engine.setState(room, 'PRESENT', { force: true });
          g.audio.sweep(false);
          g.hud.say([L('ROOK', 'Kai? The chamber is reading three dates at once.'), K('Which one is real?'), L('ROOK', 'All of them. That\'s why this is dangerous.'),
            N('Q cycles the year of the room you stand in. 1, 2 and 3 choose one. Stability drains while you are out of 2049.')], g.facts);
          g.deckWorld.refresh();
        });
      });
    },
    fracture(rt) {
      const g = rt.g;
      g.hud.flash('rgba(255,255,255,0.95)');
      g.audio.silence(0.8);
      g.after(1.0, () => {
        g.engine.setState(g.room, 'PAST', { force: true });
        g.deckWorld.refresh();
      });
    },
  },
  step(rt, dt) {
    const g = rt.g;
    if (g.room === 'collapse' && !g.facts.get('crossed') && g.player.pos.z < g.level.rooms.collapse.bounds[0][2] + 8 + 4 && g.player.grounded) g.facts.set('crossed');
  },
  outro: [N('Kai Varen falls out of 2049 and lands somewhere older than the building.')],
  done: 'fractured',
};

export const PROLOGUE = [M01, M02, M03];
