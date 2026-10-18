// THE LAST VERSION OF EARTH: the runtime main.js hands the game to when the
// edition is on. It owns the chapters and missions, the objective layers, scenes
// and dialogue choices, Chronolith stability, Echo Step, causal anchors, the
// case board and the endings. The engine, the worlds and the HUD are the same as
// Station Zero's; this is the layer that tells them what Kai's verbs are.
import * as THREE from '../../../vendor/three.module.min.js';
import { generateZone } from '../../gen/ZoneGen.js';
import { generateSector } from '../../gen/LevelGen.js';
import { setChapters, latestFor, describeSave, listSaves } from '../../ui/Saves.js';
import { makeCastModel } from '../../world/People.js';
import { PROLOGUE } from './prologue.js';
import { ACTS, ENDINGS } from './acts.js';
import { CAST, DIALOGUE, NPCS, TRUST, KNOWLEDGE, npcState } from './npcs.js';
import { dressStates, stateWeather } from './dress.js';

export const CHAPTERS = {
  prologue: { name: 'PROLOGUE', sub: 'The Zero Second: Rain City, Helix, the first switch', question: 'What happened in the chamber, and why does the voice know Kai?' },
  act1: { name: 'ACT I', sub: 'The World That Remembers', question: 'How can the machine predate its inventors?' },
  act2: { name: 'ACT II', sub: 'The Nine-Minute War', question: 'Is the Witness protecting Kai, or controlling him?' },
  act3: { name: 'ACT III', sub: 'The Last Version of Earth', question: 'What did the previous attempts cost?' },
  act4: { name: 'ACT IV', sub: 'The Unwritten Second', question: 'Can Mira be saved without repeating the catastrophe?' },
  finale: { name: 'FINALE', sub: 'Afterzero', question: 'What must be accepted rather than fixed?' },
  cases: { name: 'CASES', sub: 'Two optional quest chains: Tala\'s river, Mara\'s two records', question: 'Whose record do you believe, and what does it cost them?' },
};
export const ORDER = ['prologue', 'act1', 'act2', 'act3', 'act4', 'finale'];
export const MISSIONS = { prologue: PROLOGUE, ...ACTS };

// facts a chapter started from the menu counts as already true
const PRIMES = {
  prologue: [],
  act1: ['has_chronolith', 'chronolith_seen', 'drawing_seen', 'fractured', 'mira_gone'],
  act2: ['version_17', 'ev_witness_recording', 'found_not_built'],
  act3: ['echo_step', 'ev_prisoners', 'ev_stabilizer'],
  act4: ['ev_memorial', 'ev_anja_lock', 'ev_version17'],
  finale: ['ally'],
  cases: ['has_chronolith', 'echo_step', 'zero_second', 'after_zero'],
};

// the generators' challenge hints, said in Kai's voice and in the edition's verbs
export const HINTS = {
  roof: ['The scene is on a roof.', 'In the past the old stairs still stand. Where the district can invert, the dome is a floor.', 'Switch to the past and climb the remembered stairs. Or invert the district, walk the dome and switch back above the roof.'],
  canal: ['The water cuts the district in two.', 'A bridge used to be here. In the past it still does.', 'Switch to the past and cross the old bridge. Or invert and walk over it on the dome.'],
  drones: ['The watchers look along the street. Only the street.', 'Stay behind buildings. Where the district can invert, go up. An Echo Step draws them off.', 'Invert and cross on the dome, or wait for the patrol to pass and use the alleys. Echo Step if I have it.'],
  gate: ['The way on is closed.', 'It opens when this place has told me what it is for.', 'Finish the scene here. Then walk to the gate.'],
  'pit:gravity': ['The floor stops. The ceiling does not.', 'Inverted, the ceiling is a floor.', 'Switch to INVERTED, walk across on the ceiling, switch back over the far ledge.'],
  'pit:echo': ['Something was built here once.', 'In the past the bridge still stands, and the past holds weight.', 'Switch to the past and walk the old bridge.'],
  'ledge:echo': ['There were stairs here once.', 'In the past there still are.', 'Switch to the past and climb.'],
  'exit:ceiling': ['The door is on the ceiling.', 'So walk there.', 'Switch to INVERTED and walk through the door on the ceiling.'],
  'exit:key': ['The lock wants a key. There is one, somewhere else in time.', 'The key exists in the past. The lock works now. What I carry out of the past comes apart unless I anchor it: C.', 'Take the key in the past, press C to anchor it, switch back, use the lock.'],
  'exit:core:gravity': ['The socket is empty. A core is on the ceiling.', 'Inverted, the ceiling is a floor.', 'Switch to INVERTED, take the core, switch back, put it in the socket.'],
  'exit:core:echo': ['The core is on a high shelf. A stair used to lead there.', 'The stair stands in the past.', 'Switch to the past, climb, take the core, carry it to the socket.'],
  sweepers: ['The beams sweep on a rhythm. Watch it twice.', 'Learn the loop, then cross between sweeps. Inverted, the loop runs backwards.', 'Wait for the beam to pass, then walk through behind it.'],
  sentinel: ['It watches the floor in front of it.', 'Stay behind the pillars. Move when it turns. Inverted, it patrols backwards.', 'Wait behind a pillar until it walks away, then cross behind it.'],
  'exit:open': ['The door is open.', 'Just walk.', 'Walk through the door.'],
};

// the system lines TICK says in Station Zero, in this edition's voice
const LINES = {
  lock_state: 'The lock reads the present. The room is somewhere else right now.',
  lock_key: 'It wants a key. I saw one in another year.',
  socket_empty: 'An empty socket. There is a cell for it somewhere near.',
  key_dissolve: 'It came apart when the year changed. Next time, anchor it first. C.',
  caught: 'It walked me back to the last anchor. It only watches the floor in front of it.',
  plaque: 'Records have a residue. Read it in the past.',
  no_chronolith: 'I can\'t change the year. Not yet.',
  no_state: 'This place does not have that year.',
  hold: 'Hold on.',
};

const EV_LABELS = {
  toy: 'A toy that un-fell', clock: 'A clock running backward', camera: 'A camera showing tomorrow', stopped_clock: 'Every clock stopped at 8:14',
  rook_log: 'Rook moved the test to 05:40', rook_evasion: 'Rook denies anything before Helix', dale: 'Dale told the truth about the chamber', drawing: 'Kai and Mira drawn beside the machine, 23 years ago',
  mira_archive: 'Mira in the junior programme, 2026', others_before: 'Others came before the first fire', found_not_built: 'Helix found the machine', clock_question: 'Which version of the question',
  witness_recording: 'A recording in my own older voice', version17: 'This is VERSION 17', sera_doubt: 'Sera doubts the official record', prisoners: 'The prisoners in the loops',
  stabilizer: 'The stabilizer: the district or the people', memorial: 'The memorial carries my name', anja_lock: 'Anja\'s lock holds a city at one day', dual_archive: 'Two archives, both true',
  mira_memory: 'Mira remembers more than one life', gate_resets: 'Jun\'s gate resets itself', water_gates: 'Three stone gates on the channel', iven_testimony: 'Iven refused to sign', raw_log: 'The raw experiment log',
  three_notes: 'The three-note song', three_photos: 'A child in three photographs', water_route: 'The water route through the ruins',
};

const _v = new THREE.Vector3();

export class LastVersion {
  constructor(game, def) {
    this.g = game;
    this.def = def;
    game.edition = this;
    this.stability = 1;
    this.echoCd = 0;
    this.anchored = null;
    this.loopT = 0;
    this.hintTier = 0;
    this.hintKey = null;
    setChapters(CHAPTERS);
    const hud = game.hud;
    hud.states = def.states.map((key) => ({ key, label: def.labels[key] }));
    hud.speakers = def.speakers;
    hud.stabilityBar = true;
    game.facts.onChange(() => this.onFact());
    // a watcher that rewinds its own damage, lured into a live conduit, stays down
    game.deckWorld.onSentinelDown = (s) => {
      if (!game.campaign?.lv) return;
      game.fx.burst([s.pos.x, 1.2, s.pos.z], 0xffb36b, 50, 2.2);
      game.audio.door?.();
      game.facts.set(s.def.downSets || 'unit_down');
    };
  }

  engineOptions() {
    return this.def.engineOptions();
  }

  // --- the title and the menus --------------------------------------------------------------
  title() {
    const $ = (s) => document.querySelector(s);
    document.body.classList.add('lastversion');
    $('#title h1').innerHTML = 'AFTER<span>ZERO</span>';
    let sub = $('#title .sub');
    if (!sub) {
      sub = document.createElement('p');
      sub.className = 'sub';
      $('#title h1').after(sub);
    }
    sub.textContent = this.def.subtitle;
    $('#title .tag').textContent = this.def.tagline;
    $('#title .ver').textContent = 'v2.0 · The Last Version of Earth';
    $('#begin small').textContent = 'Choose a chapter: the Prologue, Acts I to IV, the Finale, or the Cases';
    const dim = $('#title p.dim');
    if (dim) dim.textContent = 'A temporal thriller about a machine that lets you stand in different years of the same place. The Prologue is about two hours; the whole campaign about twenty-five.';
    const ctl = $('#title .controls.desktop-only');
    if (ctl) ctl.innerHTML = '<span><b>WASD</b> move</span><span><b>MOUSE</b> look</span><span><b>SPACE</b> jump</span><span><b>Z</b> walk / run</span><span><b>E</b> / click use</span><span><b>Q</b> switch year</span><span><b>1 2 3 4</b> choose a year</span><span><b>C</b> anchor what you carry</span><span><b>X</b> Echo Step</span><span><b>H</b> think</span><span><b>J</b> case board</span><span><b>M</b> map</span><span><b>F5</b> quick save</span><span><b>ESC</b> pause</span>';
    const hero = $('#hero .herohint');
    if (hero) hero.textContent = 'You are Kai Varen, temporal systems engineer. Choose how you look.';
    for (const [sel, text] of [['#dock .hint span', 'THINK'], ['#dock .combo span', 'ECHO STEP'], ['#buttons .combo span', 'ECHO'], ['#dock .journal span', 'CASE']]) {
      const el = $(sel);
      if (el) el.textContent = text;
    }
    const mapLegend = $('#map .legend .npc');
    if (mapLegend) mapLegend.textContent = 'People';
    const vt = $('#verdict .dim');
    if (vt) vt.textContent = '';
  }

  openChapters(from) {
    const g = this.g;
    g.menuBack = from;
    g.menu = 'chapters';
    g.input.release();
    const html = [...ORDER, 'cases'].map((ch) => {
      const c = CHAPTERS[ch];
      const last = latestFor(ch);
      const d = last && describeSave(last.data);
      const ms = MISSIONS[ch];
      const list = ms.map((m) => `${typeof m.n === 'number' ? m.n : 'Case ' + m.n}. ${m.name}`).join(' · ');
      return `<div class="chapcard"><h3>${c.name}</h3><p>${c.sub}</p><p class="dim" style="font-size:11px">${list}</p><div class="acts">
        ${last ? `<button class="cont" data-cont="${last.slot}">CONTINUE<small>${d.title} · ${d.sub}</small></button>` : ''}
        <button data-newch="${ch}">NEW GAME</button></div></div>`;
    }).join('');
    document.querySelector('#chapters .body').innerHTML = html;
    for (const b of document.querySelectorAll('#chapters [data-cont]')) {
      b.onclick = () => {
        g.menu = null;
        g.begin('load', b.dataset.cont === 'auto' ? 'auto' : +b.dataset.cont);
      };
    }
    for (const b of document.querySelectorAll('#chapters [data-newch]')) b.onclick = () => g.openSaves('new', 'chapters', { action: `lv:${b.dataset.newch}` });
    g.hud.show('chapters');
  }

  // --- starting and resuming ------------------------------------------------------------------
  makeStory(chapter) {
    const ms = MISSIONS[chapter];
    // a generated puzzle may only use what this place's states can do: INVERTED flips gravity, PAST holds the residue
    const fits = (m) => (k) => (k !== 'gravity' || m.states.includes('INVERTED')) && (k !== 'echo' || m.states.includes('PAST'));
    const decks = ms.map((m, i) => ({
      ...m, index: i, mkey: m.key, mechs: (m.mechs || ['echo', 'gravity', 'sentinel', 'time']).filter(fits(m)), key: m.kind === 'rooms' ? m.deckKey : m.key, rooms: m.roomsNames || m.rooms, names: m.kind === 'zone' ? m.rooms : undefined, crew: m.crew ?? 0,
      hints: { roof: HINTS.roof, canal: HINTS.canal, drones: HINTS.drones, gate: HINTS.gate },
    }));
    return {
      zones: true, lv: true, chapter, seed: `lv-${chapter}`, residue: 'PAST', label: 'THE LAST VERSION', // each chapter its own places
      question: CHAPTERS[chapter].question,
      cast: CAST, captain: CAST[0], truth: {}, decks,
      fragments: decks.map((d) => d.fragments?.[0] || []),
      after: { key: 'NONE', sentinels: 'hunt', dark: 0 },
      mechs: ['echo', 'gravity', 'sentinel', 'time'], mechDeck: 4,
    };
  }

  start(chapter, saved = null) {
    const g = this.g;
    if (!CHAPTERS[chapter]) chapter = 'prologue';
    g.mode = 'deck';
    g.run = chapter;
    this.chapter = chapter;
    g.story = this.makeStory(chapter);
    g.facts.rulesEnabled = false;
    g.facts.set('has_tick'); // the THINK button
    g.facts.set('lv_chapter', chapter);
    if (!saved) {
      // everything before this chapter counts as played
      const upTo = chapter === 'cases' ? ['cases'] : ORDER.slice(0, ORDER.indexOf(chapter) + 1);
      for (const c of upTo) for (const k of PRIMES[c] || []) g.facts.set(k);
    }
    if (!saved && chapter !== 'prologue' && !g.facts.get('faction')) g.facts.set('faction', 'neutral');
    g.engine.unlockSlot(3);
    g.world.root.visible = false;
    g.observer.mesh.visible = false;
    g.npcs.juno.visible = false;
    g.campaign = saved || { lv: true, chapter, deck: 0, sector: 0, flags: {}, visited: [], stability: 1 };
    g.campaign.lv = true;
    this.stability = g.campaign.stability ?? 1;
    g.held = saved ? saved.held || null : null;
    this.anchored = null;
    g.engine.setGlobal('heldPersists', false);
    g.loadSector(!saved, saved?.room, saved?.pos);
  }

  resume(campaign) {
    this.start(campaign.chapter, campaign);
  }

  get deck() {
    return this.g.story?.decks[this.g.campaign?.deck ?? 0];
  }

  get beat() {
    const d = this.deck;
    return d?.beats?.[this.g.campaign.sector] || { kind: 'custom' };
  }

  // the level for the current mission and sector
  buildLevel(c) {
    const g = this.g;
    const story = g.story;
    const deck = story.decks[c.deck];
    story.after.dark = deck.dark || 0;
    let level;
    if (deck.build) level = deck.build(story, c.sector, this);
    else if (deck.kind === 'rooms') level = generateSector(story, c.deck, c.sector, story.seed);
    else level = generateZone(story, c.deck, c.sector);
    level.deckName = deck.name;
    level.palette = deck.palette;
    const states = level.states || deck.states || ['PRESENT'];
    // the generator's routes speak Station Zero's states: PHYSICAL is this edition's present, ECHO its past
    const RENAME = { PHYSICAL: 'PRESENT', ECHO: 'PAST' };
    for (const id of level.order) for (const w of [...(level.rooms[id].route || []), ...(level.rooms[id].keyRoute || [])]) if (RENAME[w.state]) w.state = RENAME[w.state];
    for (const id of level.order) {
      const room = level.rooms[id];
      g.engine.setAvailable(id, room.states || states);
      for (const ch of room.challenges || []) ch.hints = HINTS[ch.key] || ch.hints;
      // a room keeps the baseline until the player switches it (saves restore the rest)
      if (!c.flags || !Object.keys(c.flags).length) g.engine.setState(id, g.engine.baseline, { force: true });
    }
    // a 'tasks' beat: things to do along the avenue, each perhaps in its own state; the last one opens the gate
    const beat = deck.beats?.[c.sector];
    if (beat?.kind === 'tasks') {
      const rid = level.order[0];
      const spots = [[-3.6, -18], [3.6, -34], [-3.6, -68]];
      beat.tasks.forEach((t, i) => {
        const [x, z] = t.at || spots[i % spots.length];
        level.elements.push({ box: [x - 0.5, 0, z - 0.4, x + 0.5, 1.0, z + 0.4], mat: 'prop', solid: true, room: rid });
        level.interactables.push({ id: `task_${i}`, kind: 'scene', scene: `task_${i}`, task: i, pos: [x, 1.3, z], r: 2.8, prompt: t.prompt, color: t.state ? { PAST: 0xffc07a, PRESENT: 0x9fd8ff, FUTURE: 0x9fffb0 }[t.state] : 0xffc04a, room: rid });
        level.texts.push({ text: t.prompt, pos: [x, 2.4, z], rotY: 0, size: 0.3, color: '#ffe6c0', room: rid });
      });
      if (beat.npc) level.npcs.push({ id: `npc_${rid}`, crew: beat.npc, pos: [1.8, 0, -8], yaw: Math.PI, room: rid, lines: beat.lines || [], hologram: !!beat.hologram });
    }
    // people who only exist in some of this place's states leave an echo in the others (NPC failure handling)
    for (const n of level.npcs) {
      const def = NPCS[n.crew];
      if (n.temporal || !def?.temporal || n.hologram) continue;
      if (beat?.kind === 'encounter' && n.id.startsWith('npc_')) continue; // the person a beat is about is always met in person
      const real = def.temporal.filter((s) => this.def.states.includes(s));
      const here = level.rooms[n.room]?.states || states;
      if (real.length && here.some((s) => real.includes(s)) && here.some((s) => !real.includes(s))) n.temporal = real;
    }
    deck.adjust?.(level, this); // a consequence of an earlier choice can change the place
    if (!deck.noDress) dressStates(level, states);
    this.level = level;
    this.unstable = !!(level.unstable || deck.unstable);
    return level;
  }

  onSectorLoaded(intro, start) {
    const g = this.g;
    const c = g.campaign;
    const deck = this.deck;
    const chapter = CHAPTERS[this.chapter];
    g.audio.setAmbience(deck.ambience || null);
    this.weatherState = null;
    this.loopT = deck.loop || 0;
    this.hintKey = null;
    this.anchored = null;
    g.engine.setGlobal('heldPersists', false);
    if (intro) {
      g.held = null;
      const kicker = `${chapter.name} · ${typeof deck.n === 'number' ? `MISSION ${deck.n}` : `CASE ${deck.n}`}${deck.sectors > 1 ? ` · ${c.sector + 1} OF ${deck.sectors}` : ''}`;
      if (c.sector === 0) {
        g.hud.card(kicker, deck.name, deck.title || deck.subtitle, 4200);
        if (deck.intro?.length) g.after(2.6, () => g.hud.say(deck.intro, g.facts));
      } else g.hud.card(kicker, this.level.rooms[start].name, deck.subtitle || '', 2600);
    }
    this.objective(true);
  }

  // --- objectives ------------------------------------------------------------------------------
  objectiveText() {
    const g = this.g;
    const deck = this.deck;
    if (!deck) return '';
    if (deck.objectives) {
      let text = '';
      for (const l of deck.objectives) if (g.facts.test(l.when)) text = l.text;
      return text;
    }
    const done = g.deckWorld.flags.beat_done;
    const beat = this.beat;
    if (done) return 'The way on is open. Walk to the gate.';
    return beat.goal || 'Look around. Someone left something here.';
  }

  objective(force = false) {
    const text = this.objectiveText();
    if (force || text !== this.lastObjective) {
      const animate = !force && !!this.lastObjective;
      this.lastObjective = text;
      this.g.hud.objective(text, animate);
      if (animate) this.g.audio.blip(330, 0.4, 'triangle', 0.15);
    }
  }

  // --- facts, rules, the mission's end ------------------------------------------------------------
  onFact() {
    const g = this.g;
    if (!g.campaign?.lv || !this.deck) return;
    const deck = this.deck;
    const flags = g.deckWorld.flags;
    for (const r of deck.rules || []) {
      if (flags[`rule_${r.id}`]) continue;
      if (!g.facts.test(r.when)) continue;
      flags[`rule_${r.id}`] = true;
      if (r.set) for (const [k, v] of Object.entries(r.set)) g.facts.set(k, v);
      if (r.say) g.hud.say(r.say, g.facts);
      if (r.then) deck.fx?.[r.then]?.(this);
    }
    if (deck.done && !flags.beat_done && g.facts.test(deck.done)) g.beatDone();
    g.deckWorld.refresh?.();
    this.objective();
  }

  // --- interactions --------------------------------------------------------------------------------
  useDeck(f) {
    const g = this.g;
    if (f.id.startsWith('dnpc:')) {
      this.talk(f.npc);
      return true;
    }
    if (!f.id.startsWith('deck:')) return false;
    const it = f.it;
    if (it.kind === 'scene') {
      this.scene(it);
      return true;
    }
    if (it.kind === 'socket' && (it.any || it.only)) {
      const held = g.held;
      const state = g.engine.state(g.room);
      if (it.only && state !== it.only) {
        g.audio.deny();
        this.say(`The socket is from ${this.def.labels[it.only]}. It is not here now.`);
        return true;
      }
      if (!held || !(it.any ? held.startsWith(it.needs) : held === it.needs)) {
        g.audio.deny();
        this.say(LINES.socket_empty);
        return true;
      }
      g.deckWorld.flags[`used_${held}`] = true;
      g.deckWorld.flags[`filled_${it.id}`] = true;
      g.held = null;
      g.audio.insert();
      g.fx.burst(it.pos, 0x7fe0a8, 30, 1.8);
      if (it.any) {
        const n = (g.facts.get('cells_in') || 0) + 1;
        g.facts.set('cells_in', n);
        g.facts.set(`cells_${n}`);
        g.hud.toast(`<small>LIFT POWER</small><br>${n} / 3`);
      } else {
        g.facts.set(`${it.needs}_connected`);
        g.hud.toast('Connected.');
      }
      g.campaign.flags = { ...g.deckWorld.flags };
      g.deckWorld.refresh();
      return true;
    }
    return false;
  }

  say(text, who = 'KAI') {
    this.g.hud.say([{ who, text }], this.g.facts);
  }

  // an NPC: a conversation with intent, or the beat's lines
  talk(n) {
    const g = this.g;
    const def = NPCS[n.crew.id];
    n.talkT = 6;
    n.model.userData.wave?.();
    const p = n.model.position;
    g.talkWith = [p.x, p.y + 1.55, p.z];
    g.audio.greet('CREW');
    if (n.isEcho) {
      // not here in this year: their echo plays what the year kept of them
      const year = this.def.labels[g.engine.state(g.room)];
      const name = def?.name || n.crew.name;
      const lines = n.n.echoLines || def?.echo || [{ who: 'NONE', text: `${name} is not here in ${year}. What is here is an echo: a few seconds of ${def?.pronoun?.their || 'their'} day, repeating.` }, ...(def?.barks?.length ? [{ who: def.voice, text: def.barks[0] }] : [])];
      g.facts.set(`echo_${n.crew.id}`);
      if (!g.deckWorld.flags[`echo_${n.n.id}`]) {
        g.deckWorld.flags[`echo_${n.n.id}`] = true;
        g.log.push(`${name} is not in ${year}. An echo stood in: <i>${(lines[lines.length - 1] || {}).text || ''}</i>`);
      }
      this.playNode({ lines: lines.map((l) => (l.who === def?.voice ? { ...l, name: `${(def.first || name).toUpperCase()} (ECHO)` } : l)) }, n);
      return;
    }
    g.facts.set(`met_${n.crew.id}`);
    if (n.n.scene) {
      const sc = this.deck.scenes?.[n.n.scene];
      if (sc) this.playNode(sc, n, `npc_${n.n.id}`);
      return;
    }
    const dialogue = n.n.dialogue || (n.n.lines?.length ? null : DIALOGUE[n.crew.id]);
    if (dialogue) {
      const node = dialogue.find((d) => g.facts.test(d.when || 'true'));
      if (node) {
        this.playNode(node, n);
        return;
      }
    }
    const lines = n.n.lines || [{ who: 'NONE', text: '...' }];
    const beat = this.beat;
    const isBeat = beat.kind === 'encounter' && n.n.id.startsWith('npc_'); // a 'tasks' beat's person only talks
    this.playNode({ lines, choices: n.n.choices, after: n.n.after, beatDone: isBeat }, n);
    if (isBeat) g.log.push(`Met ${n.crew.name}${n.n.hologram ? ' - only an echo' : ''}.`);
  }

  // a scene: something to inspect
  scene(it) {
    const g = this.g;
    const deck = this.deck;
    if (it.task !== undefined) return this.task(it);
    const sc = deck.scenes?.[it.scene];
    if (!sc) return;
    if (sc.when && !g.facts.test(sc.when, g.engine.state(g.room))) {
      const no = deck.scenes[`${it.scene}_no`];
      g.audio.deny();
      if (no) this.playNode(no);
      else this.say('Not like this. Not now.');
      return;
    }
    g.audio.terminal();
    g.fx.burst(it.pos, it.color ?? 0xffc04a, 24, 1.4);
    if (it.once) {
      g.deckWorld.flags[`done_${it.id}`] = true;
      g.campaign.flags = { ...g.deckWorld.flags };
    }
    this.playNode(sc, null, it.id);
  }

  // one of a 'tasks' beat's things to do
  task(it) {
    const g = this.g;
    const beat = this.beat;
    const t = beat.tasks?.[it.task];
    if (!t) return;
    const flags = g.deckWorld.flags;
    if (flags[`done_${it.id}`]) return;
    if (t.state && g.engine.state(g.room) !== t.state) {
      g.audio.deny();
      this.say(t.no || `Not in this year. It only answers in ${this.def.labels[t.state]}.`);
      return;
    }
    flags[`done_${it.id}`] = true;
    g.campaign.flags = { ...flags };
    g.audio.terminal();
    g.fx.burst(it.pos, it.color ?? 0xffc04a, 30, 1.6);
    const done = beat.tasks.filter((_, i) => flags[`done_task_${i}`]).length;
    g.hud.toast(`<small>${beat.goal.split(':')[0].split('.')[0].toUpperCase()}</small><br>${done} / ${beat.tasks.length}`, 2000);
    const all = done === beat.tasks.length;
    g.hud.say(t.lines || [], g.facts, () => {
      if (!all) return;
      if (beat.after?.length) g.hud.say(beat.after, g.facts, () => g.beatDone());
      else g.beatDone();
    });
    g.deckWorld.refresh();
  }

  // lines, then (maybe) a choice, then what follows
  playNode(node, n = null, id = null) {
    const g = this.g;
    const gender = n ? { her: 'f', his: 'm' }[(n.n.pronoun || n.crew.pronoun)?.their] || 'n' : 'n';
    const lines = (node.lines || []).map((l) => (l.who === 'CREW' && n ? { ...l, name: l.name || (n.n.first || n.crew.name).toUpperCase(), color: l.color || n.crew.color, voice: l.voice || { gender } } : l));
    const after = () => {
      if (node.choices) this.choose(node.choices, n, node, lines[lines.length - 1]);
      else {
        this.apply(node, n);
        if (node.after?.length) g.hud.say(node.after, g.facts, () => this.applyAfter(node));
        else this.applyAfter(node);
      }
    };
    if (lines.length) g.hud.say(lines, g.facts, after);
    else after();
  }

  applyAfter(node) {
    if (node.beatDone) this.g.beatDone();
    if (node.ending) this.ending(node.ending);
  }

  apply(node, n) {
    const g = this.g;
    const id = node.npc || n?.crew?.id;
    if (node.set) for (const [k, v] of Object.entries(node.set)) g.facts.set(k, v);
    if (node.ev) g.facts.set(`ev_${node.ev}`);
    if (id && node.trust) g.facts.set(`trust_${id}`, Math.max(-1, Math.min(1, (g.facts.get(`trust_${id}`) ?? 0) + node.trust)));
    if (id && node.know) g.facts.set(`know_${id}`, Math.max(g.facts.get(`know_${id}`) ?? 0, node.know));
    if (id && node.quest) g.facts.set(`quest_${id}`, node.quest);
    if (node.log) g.log.push(node.log);
    if (node.then) this.deck.fx?.[node.then]?.(this);
  }

  choose(choices, n, node, lastLine) {
    const g = this.g;
    const opts = choices.filter((c) => !c.when || g.facts.test(c.when));
    const $ = (s) => document.querySelector(s);
    const sp = lastLine ? (g.hud.speakers[lastLine.who] || {}).name || lastLine.name || '' : '';
    $('#choice .line').innerHTML = lastLine ? `${sp ? `<b>${sp}</b> ` : ''}${lastLine.text}` : '';
    $('#choice .body').innerHTML = opts.map((c, i) => `<button data-choice="${i}" class="${c.intent}"><small>${c.intent.toUpperCase()}</small>${c.label}</button>`).join('');
    for (const b of document.querySelectorAll('#choice [data-choice]')) {
      b.onclick = () => {
        const c = opts[+b.dataset.choice];
        g.closeMenu();
        g.audio.ui('press');
        this.apply(node, n);
        this.apply(c, n);
        g.log.push(`<i>${c.intent}:</i> "${c.label}"${n ? ` (${n.crew.name})` : ''}`);
        const done = () => {
          if (c.after?.length || node.after?.length) g.hud.say([...(c.after || []), ...(node.after || [])], g.facts, () => { this.applyAfter(c); this.applyAfter(node); });
          else {
            this.applyAfter(c);
            this.applyAfter(node);
          }
        };
        if (c.lines?.length) g.hud.say(c.lines, g.facts, done);
        else done();
      };
    }
    g.voice.stop();
    g.openMenu('choice');
  }

  // --- hints: Kai thinking --------------------------------------------------------------------------
  hint() {
    const g = this.g;
    const deck = this.deck;
    let text;
    let key;
    if (deck.hints) {
      const h = deck.hints.find((x) => g.facts.test(x.when));
      if (h) {
        key = h.when;
        if (this.hintKey !== key) {
          this.hintKey = key;
          this.hintTier = 0;
        }
        text = h.tiers[Math.min(this.hintTier, h.tiers.length - 1)];
        this.hintTier++;
      }
    }
    if (!text) {
      const r = this.level.rooms[g.room];
      const p = g.player.pos;
      const inside = (b) => p.x >= b[0] && p.x < b[3] && p.z >= b[2] && p.z < b[5];
      const ch = r.challenges?.find((c) => inside(c.box)) || r.challenges?.[0];
      if (ch?.hints) {
        key = ch.key + g.room;
        if (this.hintKey !== key) {
          this.hintKey = key;
          this.hintTier = 0;
        }
        text = ch.hints[Math.min(this.hintTier, 2)];
        this.hintTier++;
      } else text = g.deckWorld.flags.beat_done ? 'The next door is open. Keep going.' : this.beat.kind === 'contradiction' ? 'Read the record on the wall. Then read it again in the past.' : this.beat.kind === 'tasks' ? 'There are things to do along the avenue. Some of them only answer in their own year.' : 'Look around. Someone left something for me.';
    }
    g.facts.inc('hints_used');
    g.audio.blip(988, 0.1);
    this.say(text);
  }

  line(key) {
    return LINES[key] || '';
  }

  // --- the gate -----------------------------------------------------------------------------------------
  exitReached() {
    const g = this.g;
    const c = g.campaign;
    if (!g.deckWorld.flags.beat_done) {
      if (!this.gateWarned) this.say(this.beat.kind === 'custom' ? 'Not yet. Something here is unfinished.' : 'The gate waits for the scene. Finish it first.');
      this.gateWarned = true;
      return;
    }
    if (g.transitioning) return;
    g.transitioning = true;
    const deck = this.deck;
    const last = c.sector >= deck.sectors - 1;
    const go = () => {
      g.hud.fade(true);
      g.audio.chime();
      setTimeout(() => {
        if (!last) {
          c.sector++;
        } else {
          g.facts.set(`${deck.mkey}_done`);
          c.sector = 0;
          if (c.deck + 1 < g.story.decks.length) c.deck++;
          else {
            // the chapter is done
            const next = ORDER[ORDER.indexOf(this.chapter) + 1];
            if (this.chapter === 'cases' || !next) {
              g.hud.fade(false);
              g.transitioning = false;
              this.casesDone();
              return;
            }
            c.chapter = next;
            this.chapter = next;
            g.run = next;
            g.story = this.makeStory(next);
            g.facts.set('lv_chapter', next);
            c.deck = 0;
          }
        }
        c.flags = {};
        c.visited = [];
        this.gateWarned = false;
        g.loadSector(true);
        g.hud.fade(false);
        g.transitioning = false;
      }, 900);
    };
    if (last && deck.outro?.length) g.hud.say(deck.outro, g.facts, go);
    else go();
  }

  casesDone() {
    const g = this.g;
    const $ = (s) => document.querySelector(s);
    $('#ending .body').innerHTML = `<h2>THE CASES ARE CLOSED</h2><p>Tala's river and Mara's two records: each chain has an outcome, and the main story remains completable either way.</p>
      <button class="big" id="lvTitle">BACK TO THE TITLE</button>`;
    $('#lvTitle').onclick = () => location.reload();
    g.saveTo('auto');
    g.openMenu('ending');
  }

  // --- each frame ----------------------------------------------------------------------------------------
  step(dt) {
    const g = this.g;
    if (!g.campaign?.lv || !this.level) return;
    const facts = g.facts;
    const flags = g.deckWorld.flags;
    const p = g.player.pos;
    // authored triggers
    (this.level.triggers || []).forEach((t, i) => {
      if (t.once && flags[`trig_${i}`]) return;
      if (t.room && t.room !== g.room) return;
      if (t.when && !facts.test(t.when)) return;
      const b = t.box;
      if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) {
        flags[`trig_${i}`] = true;
        for (const [k, v] of Object.entries(t.set)) facts.set(k, v);
      }
    });
    // Chronolith stability: drains in unstable places outside the present, comes back in it
    const state = g.engine.state(g.room);
    const out = state !== g.engine.baseline;
    const draining = out && this.unstable;
    if (draining) this.stability = Math.max(0, this.stability - dt * 0.045);
    else if (!out) this.stability = Math.min(1, this.stability + dt * 0.1);
    g.hud.setStability(this.stability, !!facts.get('has_chronolith') && (out || this.stability < 1), draining);
    if (draining && this.stability <= 0 && !g.catching) this.snapBack();
    g.campaign.stability = this.stability;
    // Echo Step cooldown, the afterimage
    this.echoCd = Math.max(0, this.echoCd - dt);
    if (this.ghost && (this.ghostT -= dt) <= 0) this.ghost.visible = false;
    // an anchor holds only while the thing is in your hands
    if (this.anchored && g.held !== this.anchored) {
      this.anchored = null;
      g.engine.setGlobal('heldPersists', false);
    }
    // local loops: the city resets every so often; the watchers go back to their rounds
    if (this.loopT > 0) {
      this.loopT -= dt;
      if (this.loopT <= 0) {
        this.loopT = this.deck.loop;
        for (const s of g.deckWorld.sentinels) {
          s.pos.copy(s.home);
          s.reset();
        }
        g.audio.sweep(false);
        g.hud.toast('<small>LOCAL LOOP</small><br>The street resets. You do not.', 2600);
        facts.inc('loops_seen');
      }
    }
    this.deck.step?.(this, dt);
  }

  snapBack() {
    const g = this.g;
    g.catching = true;
    g.hud.fade(true);
    g.audio.deny();
    setTimeout(() => {
      g.engine.setState(g.room, g.engine.baseline, { force: true });
      g.player.setGravity(g.engine.gravity(g.room));
      g.player.place(g.checkpoint);
      this.stability = 0.5;
      g.hud.fade(false);
      g.catching = false;
      g.deckWorld.refresh();
      this.say('The Chronolith let go of me. Back to the present, back to the last anchor.');
    }, 700);
  }

  // --- the verbs -----------------------------------------------------------------------------------------
  shift(to) {
    const g = this.g;
    const { engine, facts } = g;
    if (!facts.get('has_chronolith')) {
      g.audio.deny();
      if (!this.noChronoSaid) {
        this.noChronoSaid = true;
        this.say(LINES.no_chronolith);
      }
      return;
    }
    if (engine.locked.has(g.room)) return g.audio.deny();
    if (to) {
      if (/^\d$/.test(to)) to = engine.states[+to - 1];
      else if (!engine.states.includes(to)) to = engine.states[['PHYSICAL', 'INVERTED', 'ECHO'].indexOf(to)];
      if (!to) return g.audio.deny();
      if (!engine.statesOf(g.room).includes(to)) {
        g.audio.deny();
        g.hud.toast(`<small>${this.def.labels[to]}</small><br>${LINES.no_state}`, 1800);
        return;
      }
    }
    const ok = to ? engine.setState(g.room, to) : engine.cycle(g.room);
    if (!ok) return g.audio.deny();
    const s = engine.state(g.room);
    g.audio.sweep(s !== engine.baseline);
    if (!g.settings.comfort) g.hud.flash({ PAST: 'rgba(255,200,120,0.35)', FUTURE: 'rgba(120,230,170,0.35)', INVERTED: 'rgba(255,90,180,0.35)' }[s] || 'rgba(255,255,255,0.3)');
    facts.inc('switches');
    this.deck?.onShift?.(this, s);
    if (!facts.get('first_switch')) {
      facts.set('first_switch');
      g.log.push(`I switched the room to ${this.def.labels[s]}. The place stayed. The year did not.`);
    }
  }

  echoStep() {
    const g = this.g;
    if (!g.facts.get('echo_step')) {
      g.audio.deny();
      g.hud.toast('<small>ECHO STEP</small><br>Not yet. Something in Act II comes loose.', 1800);
      return;
    }
    if (this.echoCd > 0) {
      g.audio.deny();
      g.hud.toast(`<small>ECHO STEP</small><br>${Math.ceil(this.echoCd)} s`, 1200);
      return;
    }
    if (this.stability < 0.3) {
      g.audio.deny();
      g.hud.toast('<small>ECHO STEP</small><br>Not enough stability.', 1600);
      return;
    }
    this.echoCd = 8;
    this.stability -= 0.25;
    const p = g.player.pos.clone();
    // the afterimage stays where you were; the watchers follow it
    if (!this.ghost) {
      this.ghost = makeCastModel('other', g.settings.hero);
      g.scene.add(this.ghost);
    }
    this.ghost.visible = true;
    this.ghost.position.set(p.x, p.y - g.player.half.y, p.z);
    this.ghost.rotation.y = Math.atan2(g.player.H.x, g.player.H.z);
    this.ghost.userData.setOpacity?.(0.55);
    this.ghostT = 4;
    g.deckWorld.setDecoy(p, 4);
    // and you step: forward, up to five metres, as far as the air is clear and the ground will take you
    const eye = g.player.eye(new THREE.Vector3());
    const fwd = g.player.forward(new THREE.Vector3()).setY(0).normalize();
    const clear = Math.min(5, g.player.rayDistance(eye, fwd, 5.4) - 0.4);
    let best = 0;
    for (let d = 0.5; d <= clear; d += 0.5) {
      const from = _v.copy(p).addScaledVector(fwd, d).setY(p.y + 0.3);
      if (g.player.rayDistance(from, new THREE.Vector3(0, -1, 0), 3) < 3) best = d;
    }
    if (best > 0) g.player.place([p.x + fwd.x * best, p.y, p.z + fwd.z * best, Math.atan2(g.player.H.x, g.player.H.z)]);
    g.audio.sweep(true);
    g.fx.burst(p.toArray(), 0x8ff4ff, 40, 2.4);
    if (!g.settings.comfort) g.hud.flash('rgba(140,240,255,0.3)');
    g.facts.inc('echo_steps');
  }

  anchor() {
    const g = this.g;
    if (!g.facts.get('has_chronolith')) return;
    const it = g.heldItem();
    if (!it) {
      g.audio.deny();
      this.say('Nothing in my hands to hold on to.');
      return;
    }
    if (this.anchored === it.id) {
      g.hud.toast(`<small>ANCHORED</small><br>${it.label} already persists.`, 1400);
      return;
    }
    this.anchored = it.id;
    g.engine.setGlobal('heldPersists', true);
    this.stability = Math.max(0, this.stability - 0.15);
    g.audio.chime();
    g.fx.burst([g.player.pos.x, g.player.pos.y, g.player.pos.z], 0xffd27a, 30, 1.6);
    g.hud.toast(`<small>CAUSAL ANCHOR</small><br>${it.label} will survive the switch.`, 2400);
    g.facts.set('anchored_once');
    g.log.push(`I anchored the ${it.label.toLowerCase()}. It comes with me through the years now.`);
  }

  // each year of an open district has its own hour: 2026 at dusk, 2196 in a pale dawn
  stateNight(state, night) {
    if (!this.level?.zone || this.deck?.noDress) return night;
    return night * ({ PAST: 0.55, FUTURE: 0.4, INVERTED: 0.85 }[state] ?? 1);
  }

  // each state tints the place
  theme(dt, state) {
    const g = this.g;
    if (g.mode !== 'deck') return;
    g.deckWorld.setLook(state, Math.min(1, dt * 2));
    // an open district's weather follows its year
    if (this.level?.zone && state !== this.weatherState) {
      this.weatherState = state;
      const w = this.deck?.stateWeather?.[state] ?? stateWeather(state, this.level.palette);
      if (w !== g.weather.kind) g.weather.set(w);
    }
  }

  roomEntered() {}

  // --- the case board (the journal) ------------------------------------------------------------------------
  renderJournal(game, el) {
    const { facts, story, campaign } = game;
    const deck = this.deck;
    const chapter = CHAPTERS[this.chapter] || CHAPTERS.prologue;
    const evs = Object.keys(facts.facts).filter((k) => k.startsWith('ev_') && facts.facts[k]).map((k) => `<li><span class="ev">◆</span> ${EV_LABELS[k.slice(3)] || k.slice(3).replace(/_/g, ' ')}</li>`).join('') || '<li class="dim">Nothing pinned yet.</li>';
    const people = Object.values(NPCS).filter((n) => facts.get(`met_${n.id}`) && n.id !== 'kai').map((n) => {
      const s = npcState(facts, n.id);
      return `<li><span><b>${n.name}</b> <small>${n.role}</small></span><span class="st ${s.trust > 0 ? 'good' : s.trust < 0 ? 'bad' : ''}">${TRUST[s.trust].toUpperCase()} · ${KNOWLEDGE[s.knowledge].toUpperCase()}${s.quest ? ` · ${s.quest.toUpperCase()}` : ''}</span></li>`;
    }).join('') || '<li class="dim">Nobody yet.</li>';
    const choices = [['faction', 'Standing'], ['ending', 'Ending'], ['ally', 'Ally'], ['prisoners_freed', 'Prisoners freed'], ['city_freed', 'City freed'], ['city_stabilized', 'City stabilized'], ['stabilizer_destroyed', 'Stabilizer destroyed'], ['civilians_freed', 'Civilians freed']]
      .filter(([k]) => facts.get(k)).map(([k, l]) => `<li>${l}: <b>${String(facts.get(k)).toUpperCase()}</b></li>`).join('');
    const logs = game.log.slice().reverse().map((l) => `<li>${l}</li>`).join('') || '<li class="dim">Nothing yet.</li>';
    el.innerHTML = `
      <h3>WHERE YOU ARE</h3><p><b>${chapter.name} &middot; ${deck?.name || ''}</b><br><span class="dim">${deck?.title || ''}${deck?.sectors > 1 ? ` &middot; part ${campaign.sector + 1} of ${deck.sectors}` : ''} &middot; stability ${Math.round(this.stability * 100)}%</span></p>
      <h3>THE QUESTION</h3><p class="dim">${story.question}</p>
      <h3>EVIDENCE</h3><ul class="board">${evs}</ul>
      <h3>PEOPLE</h3><ul class="board">${people}</ul>
      ${choices ? `<h3>WHAT YOU CHOSE</h3><ul class="board">${choices}</ul>` : ''}
      <h3>CASE LOG</h3><ul class="log">${logs}</ul>`;
  }

  saveMeta() {
    const d = this.deck;
    return { where: `THE LAST VERSION · ${d?.name || ''}`, chapter: `${typeof d?.n === 'number' ? `Mission ${d.n}` : `Case ${d?.n}`}${d?.sectors > 1 ? ` · ${this.g.campaign.sector + 1}/${d.sectors}` : ''}` };
  }

  mapTitle() {
    const d = this.deck;
    return `${d?.name || 'THE LAST VERSION'}${d?.sectors > 1 ? ` · PART ${this.g.campaign.sector + 1}/${d.sectors}` : ''}`;
  }

  // --- the ending ---------------------------------------------------------------------------------------------
  ending(key) {
    const g = this.g;
    const e = ENDINGS[key];
    if (!e) return;
    g.facts.set('ending', key);
    const mins = Math.round(g.playTime / 60);
    const evs = Object.keys(g.facts.facts).filter((k) => k.startsWith('ev_') && g.facts.facts[k]).length;
    const show = () => {
      const $ = (s) => document.querySelector(s);
      $('#ending .body').innerHTML = `
        <h2>ENDING ${key} — ${e.title}</h2>${e.text.map((p, i) => `<p${i === e.text.length - 1 ? ' class="dim"' : ''}>${i === e.text.length - 1 ? `“${p}”` : p}</p>`).join('')}
        <p class="dim">A post-credit clock begins ticking. A voice confirms: “Version one hundred and eighteen.”</p>
        <div class="stats"><span>${Math.floor(mins / 60)} h ${mins % 60} min</span><span>${evs} pieces of evidence</span><span>standing: ${g.facts.get('faction') || 'neutral'}</span><span>ally: ${g.facts.get('ally') || 'none'}</span></div>
        <button class="big" id="lvCases">THE CASES<small>Two optional quest chains: Tala's river, Mara's two records</small></button>
        <button id="lvTitle">BACK TO THE TITLE</button>`;
      $('#lvCases').onclick = () => g.begin('lv:cases', null, g.slot ?? null);
      $('#lvTitle').onclick = () => location.reload();
      g.saveTo('auto');
      g.openMenu('ending');
    };
    g.hud.flash('rgba(255,255,255,0.9)');
    g.audio.silence(1.0);
    g.after(1.2, () => g.hud.say([{ who: 'NONE', text: e.text[0] }, { who: 'NONE', text: 'A post-credit clock begins ticking.' }, { who: 'VOICE', text: 'Version one hundred and eighteen.' }], g.facts, show));
  }
}
