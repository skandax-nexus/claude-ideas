// AFTERZERO - game bootstrap and main loop.
//
// Two modes share one player, one reality engine and one law device:
//   station - the handcrafted Station Zero prologue (world/maps.js)
//   deck    - the generated vessel campaign (gen/ + world/DeckWorld.js)
import * as THREE from '../vendor/three.module.min.js';
import { FactStore } from './core/FactStore.js';
import { RealityEngine } from './core/RealityEngine.js';
import { Objectives } from './core/Objectives.js';
import { TOKENS, DEFAULT_LAWS, describeLaw } from './core/Laws.js';
import { compileCondition } from './core/conditions.js';
import { World } from './world/World.js';
import { Director } from './world/Director.js';
import { rooms as STATION_ROOMS, interactables, items as STATION_ITEMS, tokens as STATION_TOKENS, triggers } from './world/maps.js';
import { rules, objectiveLayers, endings, discoveries } from './world/story.js';
import { Player } from './entities/Player.js';
import { Observer } from './entities/Observer.js';
import { Input } from './ui/Input.js';
import { HUD } from './ui/HUD.js';
import { Synth } from './audio/Synth.js';
import { makeDevice, makeKeyItem, makeCoreItem } from './world/models.js';
import { Npcs } from './world/Npcs.js';
import { DeckWorld } from './world/DeckWorld.js';
import { PostFX } from './world/PostFX.js';
import { makeStory, verdictEnding, WISH_OPTIONS } from './gen/StoryGen.js';
import { generateSector, SECTORS_PER_DECK } from './gen/LevelGen.js';
import { makeZoneStory, makeCradleStory } from './gen/ZoneStory.js';
import { generateZone } from './gen/ZoneGen.js';
import { forgeGame, makeForgeStory, tuneLevel, rulesOverride, forgeEnding, describeRules, gearTick, GEAR, GEAR_KEYS, GENRES, GENRE_KEYS, LENGTHS, THEMES as FORGE_THEMES, THEME_KEYS, RULE_OPTIONS, RULE_KEYS, ROLES, ROLE_KEYS } from './gen/Forge.js';
import { Weather } from './world/Weather.js';
import { WATER_NORMALS } from './world/materials.js';
import { SmartRenderer } from './core/SmartRenderer.js';
import { loadSettings, saveSettings, CAMERA_PRESETS, QUALITY } from './ui/Settings.js';
import { writeSave, readSave, listSaves, latestSave, describeSave, deleteSave, latestFor, CHAPTERS, SLOTS, rememberEnding, lastEnding, ENDING_TITLES } from './ui/Saves.js';
import { MiniMap } from './ui/MiniMap.js';
import { Voice } from './audio/Voice.js';
import { Fx } from './world/Fx.js';
import { HEROES, OPTIONS, heroSpec, hex } from './ui/Heroes.js';
import { loadActors, actorsReady, actorLoaded, MODELS, loadErrors, setActorQuality } from './world/Actors.js';
import { LOOKS, HAIR, TOPS, LOOK_DEFAULT, lookOf } from './world/People.js';
import { EDITION, NS } from './core/Edition.js';
import { LV } from './editions/lastversion/index.js';

const VERSION = '0.3.0';
const BOOT_KEY = 'afterzero.boot';
// the film grade for Station Zero and the vessel: clean, cool shadows, warm light
const STATION_GRADE = { shadowTint: 0x2a4a66, highlightTint: 0xfff0dc, toning: 0.08, contrast: 1.14, saturation: 1.02 };
// the vessel's emergency light after SEVERED (story.after.dark)
const EMERGENCY = new THREE.Color(0xff6a48);

// Bright, soft looks per reality state: daylight, rose dusk, mint memory.
const THEMES = {
  PHYSICAL: { fog: 0xe4edf5, sky: 0xffffff, ground: 0xd5dce4, hemi: 0.72, sun: 2.3, sunColor: 0xfff3e0, density: 0.012, device: 0x6fb8ff },
  INVERTED: { fog: 0xf5e3ec, sky: 0xfff2f7, ground: 0xe8d3de, hemi: 0.7, sun: 2.0, sunColor: 0xffe2ec, density: 0.013, device: 0xff7aa8 },
  ECHO: { fog: 0xd8f2f0, sky: 0xf0fffd, ground: 0xc8e6e3, hemi: 0.66, sun: 1.8, sunColor: 0xe6fffb, density: 0.016, device: 0x2bc4cf },
  ...LV.themes, // THE LAST VERSION's PRESENT / PAST / FUTURE
};

const _c = new THREE.Color(), _c2 = new THREE.Color(), _fog = new THREE.Color(), _tint = new THREE.Color(); // per-frame scratch colours

// Every token the prologue can teach; the vessel starts with all of them.
const BASE_TOKENS = ['GRAVITY', 'INVERTS', 'INVERTED', 'PHYSICAL', 'ECHO', 'HELD', 'PERSISTS', 'OBSERVER', 'FREEZES', 'ALL', 'ECHOES', 'SOLIDIFIES'];
// WORLD FORGE gear icons (the dock and the phone's gear pad)
const GEAR_ICONS = {
  STASIS: '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  GRAPPLE: '<svg viewBox="0 0 24 24"><path d="M3 12h11a4 4 0 1 1-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="12" r="2" fill="currentColor"/></svg>',
  LENS: '<svg viewBox="0 0 24 24"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  RIG: '<svg viewBox="0 0 24 24"><path d="M3 20h5v-5h5v-5h5V5h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  FLARE: '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.2L21 9l-5 4.2 1.6 6.8L12 16.5 6.4 20l1.6-6.8L3 9l6.8-.8z" fill="currentColor"/></svg>',
  KEYFORGE: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12h9M18 12v3M15 12v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// Software rasterisers (no GPU) get the LOW preset by default.
function softwareGL(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return /swiftshader|llvmpipe|software/i.test(name);
  } catch {
    return false;
  }
}

function session(fn, fallback = null) {
  try {
    return fn(window.sessionStorage);
  } catch {
    return fallback;
  }
}

// Generated crew get a voice that fits them, varied a little per person.
function crewVoice(c) {
  const v = ((c.seed || 0) % 7) - 3;
  if (c.pronoun?.their === 'her') return { pitch: 1.14 + v * 0.03, gender: 'f', rate: 1.0 };
  if (c.pronoun?.their === 'his') return { pitch: 0.84 + v * 0.03, gender: 'm', rate: 0.97 };
  return { pitch: 1.0 + v * 0.03, gender: 'n', rate: 0.99 };
}

class Game {
  constructor() {
    this.canvas = document.querySelector('#game');
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.touch, powerPreference: 'high-performance' });
    this.settings = loadSettings(this.touch, softwareGL(this.renderer));
    this.editionDef = EDITION === 'lastversion' ? LV : null; // which game this page is
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xe4edf5, 0.012);
    this.scene.background = new THREE.Color(0xe4edf5);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 600);
    this.scene.add(this.camera);
    this.postfx = new PostFX(this.renderer, this.scene, this.camera);
    this.smart = new SmartRenderer(this);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0xd5dce4, 1.25);
    this.scene.add(this.hemi);
    // ambient light from the district's sky photo (see PostFX.setEnvironment)
    this.skyLight = new THREE.LightProbe();
    this.skyLight.intensity = 0;
    this.scene.add(this.skyLight);
    // a soft "skylight" sun that follows the player so shadows stay crisp and cheap
    this.sun = new THREE.DirectionalLight(0xfff3e0, 1.5);
    this.sun.castShadow = true;
    Object.assign(this.sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    this.lights = Array.from({ length: 4 }, () => {
      const l = new THREE.PointLight(0xffffff, 0, 20, 1);
      this.scene.add(l);
      return l;
    });

    this.newState();
    this.hud = new HUD();
    this.audio = new Synth();
    this.input = new Input(this.canvas, document.querySelector('#ui'));
    this.world = new World(this.scene, this.facts, this.engine);
    this.player = new Player(this.camera, this.scene);
    if (this.settings.hero) this.player.setModel(this.settings.hero);
    this.world.refreshCast(this.settings.hero);
    this.voice = new Voice(this.audio);
    this.voice.youMale = actorsReady() && lookOf(this.settings.hero).voice === 'm';
    this.fx = new Fx(this.scene);
    this.weather = new Weather(this.scene);
    this.lastEvent = 0;
    this.observer = new Observer(this.scene);
    this.director = new Director(this);
    this.npcs = new Npcs(this);
    this.deckWorld = new DeckWorld(this.scene, this.engine, this.facts);
    this.minimap = new MiniMap(document.querySelector('#minimap'), document.querySelector('#bigmap'));
    this.edition = this.editionDef ? this.editionDef.makeRuntime(this) : null;
    this.wire();
    this.buildViewModels();

    this.mode = 'station';
    this.level = this.stationLevel = { rooms: STATION_ROOMS, items: STATION_ITEMS, tokens: STATION_TOKENS };
    this.stationVisited = new Set();
    this.story = null;
    this.campaign = null;
    this.room = null;
    this.held = null;
    this.paused = true;
    this.menu = null;
    this.time = 0;
    this.playTime = 0;
    this.catching = false;
    this.focus = null;
    this.frameN = 0;
    this.timers = []; // game-time timers: deterministic in captures and simulations

    window.addEventListener('resize', () => this.resize());
    this.applySettings();
    this.setupMenus();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  newState() {
    this.facts = new FactStore();
    // THE LAST VERSION runs the engine on PAST / PRESENT / FUTURE / INVERTED without laws
    this.engine = new RealityEngine(this.editionDef ? this.editionDef.engineOptions() : { slots: 3, unlocked: 2, laws: DEFAULT_LAWS });
    this.engine.lock('antechamber');
    this.objectives = new Objectives(objectiveLayers, this.facts);
    this.log = [];
    this.timeline = [];
    this.combos = [];
    this.comboIndex = -1;
  }

  // Connect systems: any change in facts, room states or laws re-derives the world.
  wire() {
    const { facts, engine } = this;
    facts.onEffect = (e) => {
      if (e.event && !this.restoring) this.director.event(e.event);
      if (e.log) {
        this.log.push(e.log);
        if (!this.restoring) this.hud.toast(`<small>THEORY LOG</small><br>${e.log}`, 4200);
      }
    };
    facts.onChange((k, v) => {
      if (discoveries.includes(k) && v && !this.timeline.some((t) => t.fact === k)) {
        this.timeline.push({ fact: k, t: Math.round(this.playTime) });
      }
      this.world.refresh();
      this.deckWorld?.refresh();
      if (this.mode === 'station') this.objectives.update();
      this.dirty = true;
    });
    facts.addRules(rules);
    engine.on('shift', (e) => {
      this.world.refresh();
      this.deckWorld?.refresh();
      if (e.room === this.room) this.audio.setState(e.to);
      this.dirty = true;
    });
    engine.on('laws', () => {
      if (!this.hud.lawsSelf) this.hud.lawDraft = null; // changed elsewhere: redraw from the running laws
      this.world.refresh();
      this.deckWorld?.refresh();
      this.dirty = true;
    });
    this.hud.onLine = (who, line) => {
      this.audio.talk(who);
      this.lastEvent = this.time;
      if (line) this.voice.speak(line.text, who, line.voice);
    };
    this.hud.onSkip = () => this.voice.stop();
    this.hud.durFn = (l) => (this.voice.enabled && this.voice.available ? this.voice.duration(l.text, l.who, l.voice) : 0);
    this.objectives.onChange = (layer) => {
      if (this.mode !== 'station') return;
      this.hud.objective(layer.text);
      this.audio.blip(330, 0.4, 'triangle', 0.15);
    };
    this.observer.onCatch = (state) => this.caught(state);
    this.observer.onSay = (t) => {
      if (this.room === 'hall' && !this.hud.talking) this.hud.line(t, 'OBSERVER');
    };
    this.observer.brain.onLesson = (lesson, text) => {
      this.hud.line(text, 'OBSERVER');
      this.log.push(`The Observer: ${text}`);
      this.dirty = true;
    };
  }

  // The device glows in the character's left hand; carried items in the right.
  buildViewModels() {
    const hands = this.player.model.userData;
    this.device = makeDevice();
    this.device.scale.setScalar(1.0);
    hands.handL.add(this.device);
    this.heldModels = { key: makeKeyItem(true), core: makeCoreItem() };
    for (const m of Object.values(this.heldModels)) {
      m.scale.setScalar(0.7);
      m.visible = false;
      hands.handR.add(m);
    }
  }

  after(sec, fn) {
    this.timers.push({ at: this.time + sec, fn });
  }

  runTimers() {
    if (!this.timers.length) return;
    const due = this.timers.filter((t) => t.at <= this.time);
    this.timers = this.timers.filter((t) => t.at > this.time);
    due.forEach((t) => t.fn());
  }

  // --- settings -------------------------------------------------------------
  applySettings() {
    const s = this.settings;
    if (s.smart === undefined) s.smart = true;
    if (this.smart.chosenWas !== s.quality) {
      this.smart.chosenWas = s.quality;
      this.smart.reset();
    }
    this.applyQuality();
    this.player.cam = { ...CAMERA_PRESETS[s.camera] };
    this.player.zoom = s.zoom;
    this.player.comfort = s.comfort;
    this.input.sensitivity = 0.0024 * s.sensitivity;
    this.input.touchSensitivity = 0.0065 * s.sensitivity;
    this.input.invertY = s.invertY;
    this.audio.setVolume?.(s.volume);
    if (this.voice) this.voice.enabled = s.voice !== false;
    document.body.classList.toggle('minimap', s.minimap);
    document.body.classList.toggle('text-lg', s.textSize > 1);
    this.resize();
  }

  // the quality preset in use: the one chosen, or lower while the smart renderer eases off
  applyQuality() {
    const q = this.smart.quality();
    // street lamps that really light whoever walks under them (more of them on better quality)
    this.lampLights = this.lampLights || [];
    while (this.lampLights.length > (q.lamps || 0)) this.scene.remove(this.lampLights.pop());
    while (this.lampLights.length < (q.lamps || 0)) {
      const l = new THREE.PointLight(0xffd2a0, 0, 10, 2);
      l.userData.want = 0;
      this.lampLights.push(l);
      this.scene.add(l);
    }
    this.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.postfx.apply(q);
    setActorQuality(q); // skin, eye and hair shading follow the preset
    this.smart.apply();
  }

  changeSetting(k, v) {
    this.settings[k] = v;
    saveSettings(this.settings);
    this.applySettings();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // upright screens: widen the view so you still see the room around you
    const hfov = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.settings.fov) / 2) * Math.max(1, 1.5 / (w / h))) * 180) / Math.PI;
    this.camera.fov = w < h ? Math.min(96, Math.max(this.settings.fov, hfov)) : this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.postfx.resize();
  }

  // --- menus ------------------------------------------------------------
  setupMenus() {
    const $ = (s) => document.querySelector(s);
    $('#begin').onclick = () => this.openChapters('title');
    $('#continue').onclick = () => {
      const l = latestSave();
      if (l) this.begin('load', l.slot);
    };
    $('#loadBtn').onclick = () => this.openSaves('load', 'title');
    $('#settingsBtn').onclick = () => this.openSettings('title');
    for (const b of document.querySelectorAll('[data-close]')) b.onclick = () => this.closeMenu();
    for (const b of document.querySelectorAll('[data-back]')) b.onclick = () => this.back();
    $('#resume').onclick = () => this.closeMenu();
    $('#saveBtn').onclick = () => this.openSaves('save', 'pause');
    $('#loadBtn2').onclick = () => this.openSaves('load', 'pause');
    $('#mapBtn').onclick = () => this.openMenu('map');
    $('#settingsBtn2').onclick = () => this.openSettings('pause');
    $('#quit').onclick = () => {
      this.saveTo('auto');
      location.reload();
    };
    $('#mute').onclick = () => this.audio.toggleMute();
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && !this.paused && !this.menu && !this.touch) this.openMenu('pause');
    });
    $('#heroBtn').onclick = () => this.openHero('title');
    $('#heroBtn2').onclick = () => this.openHero('pause');
    // menus answer with a soft tick
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest?.('.overlay button, #dock button')) this.audio.ui('press');
    });
    this.refreshTitle();
    this.edition?.title();
    this.hud.show('title');
    try { window.AndroidUI?.setLandscape(false); } catch { /* not in the app */ }
    this.enterRoom('antechamber', true);
    // a load / new game requested before the page reloaded
    const boot = session((s) => JSON.parse(s.getItem(BOOT_KEY) || 'null'));
    if (boot?.action === 'forgePanel') {
      session((s) => s.removeItem(BOOT_KEY));
      this.openForge('title', boot.opts?.choices || null);
    } else if (boot) {
      session((s) => s.removeItem(BOOT_KEY));
      $('#continue').style.display = '';
      $('#continueInfo').textContent = 'Tap to enter';
      $('#continue').onclick = () => this.begin(boot.action, boot.slot, boot.saveSlot, boot.opts);
    }
  }

  refreshTitle() {
    const $ = (s) => document.querySelector(s);
    const l = latestSave();
    $('#continue').style.display = l ? '' : 'none';
    if (l) {
      const d = describeSave(l.data);
      $('#continueInfo').textContent = `${d.title} · ${d.sub}`;
    }
  }

  // New game / vessel / load. Starting fresh in a page that already played
  // goes through a reload, so no state ever leaks between runs.
  // action: 'new' (the prologue), 'halcyon', 'cradle', 'vessel', 'studio' or 'load';
  // saveSlot: the slot a new game autosaves into; opts.ending: the prologue ending a
  // replayed vessel keeps (TELL IT AGAIN after SEVERED stays after SEVERED).
  begin(action, slot, saveSlot = null, opts = null) {
    if (!this.started && !this.settings.hero && action !== 'load') {
      this.openHero('title', () => this.begin(action, slot, saveSlot, opts));
      return;
    }
    if (this.started) {
      session((s) => s.setItem(BOOT_KEY, JSON.stringify({ action, slot, saveSlot, opts })));
      location.reload();
      return;
    }
    this.slot = action === 'load' ? (typeof slot === 'number' ? slot : null) : saveSlot;
    this.run = action.startsWith('lv:') ? action.slice(3) : { new: 'prologue', halcyon: 'halcyon', cradle: 'cradle', vessel: 'vessel', studio: 'studio', forge: 'forge' }[action] || 'prologue';
    this.started = true;
    document.body.classList.add('playing');
    this.player.cinema = null;
    this.audio.start();
    this.audio.setVolume?.(this.settings.volume);
    let ok = false;
    if (action === 'load') ok = this.load(slot);
    else if (['cradle', 'vessel', 'studio'].includes(action)) this.adoptLastEnding();
    if (ok) this.hud.toast('Memory restored.');
    else if (action.startsWith('lv:')) this.edition.start(action.slice(3));
    else if (action === 'vessel') this.startVessel(undefined, null, null, opts?.ending);
    else if (action === 'studio') this.startVessel(opts?.seed, null, opts?.wish);
    else if (action === 'cradle') this.beginCradle();
    else if (action === 'forge') this.startForge(opts?.seed, null, opts?.choices);
    else if (action === 'halcyon') {
      // jump straight to the open districts: Station Zero counts as played up to the vault
      this.facts.rulesEnabled = false;
      for (const k of ['left_antechamber', 'met_juno', 'has_tick', 'has_device', 'seen_echo', 'heard_varga', 'heard_self', 'wrote_law', 'archive_open', 'custodian_remembers', 'vault_seen']) this.facts.set(k);
      for (const t of ['GRAVITY', 'INVERTS', 'PHYSICAL', 'INVERTED', 'ECHO', 'HELD', 'PERSISTS', 'ECHOES', 'SOLIDIFIES', 'ALL']) this.facts.set(`token_${t}`);
      this.engine.setLaw(1, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' });
      this.facts.primeRules();
      this.enterRoom('lab', true);
      this.startZones();
    }
    else this.enterRoom('antechamber', true);
    this.paused = false;
    this.hud.show(null);
    this.world.refresh();
    if (this.mode === 'station') {
      this.objectives.update(true);
      this.hud.objective(this.objectives.text, false);
    }
    if (this.touch) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      screen.orientation?.lock?.('landscape').catch(() => {});
    } else this.canvas.requestPointerLock?.();
  }

  openMenu(id) {
    if (id === 'laws' && !this.facts.get('has_device')) return;
    this.menu = id;
    this.input.release();
    this.hud.rulesHide?.(); // the local rules card steps aside for any panel
    if (id === 'laws') this.hud.renderLaws(this); // the draft is kept between visits
    if (id === 'journal') this.hud.renderJournal(this);
    this.hud.show(id);
    if (id === 'map') {
      document.querySelector('#mapTitle').textContent = this.mode === 'deck'
        ? (this.campaign.lv ? this.edition.mapTitle()
          : this.campaign.forge ? `${this.story.title.toUpperCase()} · ACT ${this.campaign.deck + 1} · ${this.forgeAct().name} · ${this.forgeAct().open ? 'DISTRICT' : 'SECTOR'} ${this.campaign.sector + 1}/${this.forgeAct().sectors}`
          : this.campaign.zones ? `${this.zoneWhere()} · DISTRICT ${this.campaign.sector + 1}/${this.story.decks[this.campaign.deck].sectors}` : `DECK ${this.campaign.deck + 1} · ${this.story.decks[this.campaign.deck].name} · SECTOR ${this.campaign.sector + 1}/4`)
        : 'STATION ZERO';
      requestAnimationFrame(() => this.minimap.drawBig(this.player, this.room, this.mapMarkers()));
    }
  }

  closeMenu() {
    this.menu = null;
    this.hud.show(null);
    if (!this.touch && this.started) this.canvas.requestPointerLock?.();
    if (!this.started) this.hud.show('title');
  }

  back() {
    this.player.cinema = null;
    const to = this.menuBack || 'title';
    this.menuBack = null;
    if (to === 'title') {
      this.menu = null;
      this.refreshTitle();
      this.hud.show('title');
    } else this.openMenu(to);
  }

  // STORY STUDIO: a vessel story made from the player's wishes (offline: the
  // story generator composes it; see gen/StoryGen.js WISH_OPTIONS).
  openStudio(from) {
    this.menuBack = from;
    this.menu = 'studio';
    this.input.release();
    const $ = (q) => document.querySelector(q);
    const opt = (k, any = true) => `<select id="st_${k}">${any ? '<option value="">Surprise me</option>' : ''}${Object.entries(WISH_OPTIONS[k]).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`;
    $('#studio .body').innerHTML = `
      <label>Title<input id="st_title" maxlength="40" placeholder="e.g. The Night Shift"></label>
      <label>Mood${opt('mood')}</label>
      <label>Why the time loop exists${opt('motive')}</label>
      <label>The final twist${opt('twist')}</label>
      <label>Crew names <small>up to 8, separated by commas</small><input id="st_names" maxlength="160" placeholder="e.g. Aria, Dev, Mina, Rohan"></label>
      <label>Story number <small>the same number and wishes always tell the same story</small><input id="st_seed" inputmode="numeric" maxlength="9" placeholder="random"></label>
      <p class="dim">Names you type are spoken by your device's own voice; everything else uses the recorded voices.</p>
      <button class="big" id="st_go">CREATE STORY<small>Then choose a save slot</small></button>`;
    $('#st_go').onclick = () => {
      const v = (k) => $(`#st_${k}`).value.trim();
      const wish = {
        title: v('title') || null,
        mood: v('mood') || null,
        motive: v('motive') || null,
        twist: v('twist') || null,
        names: v('names') ? v('names').split(',').map((x) => x.trim()).filter(Boolean) : [],
      };
      const seed = /^\d+$/.test(v('seed')) ? +v('seed') : (Math.random() * 1e9) | 0;
      this.openSaves('new', 'studio', { action: 'studio', opts: { seed, wish } });
    };
    this.hud.show('studio');
  }

  // WORLD FORGE: build your own game. Everything is optional except the Forge number, which can
  // be random; the Forge decides whatever is left blank (gen/Forge.js).
  openForge(from, preset = null) {
    this.menuBack = from;
    this.menu = 'forge';
    this.input.release();
    const $ = (q) => document.querySelector(q);
    const pre = preset || this.forgeDraft || {};
    const opt = (id, entries, cur, any = 'Forge decides') => `<select id="${id}">${any ? `<option value="">${any}</option>` : ''}${entries.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const actsHtml = (n, acts = []) => Array.from({ length: n }, (_, i) => {
      const a = acts[i] || {};
      const r = a.rules || {};
      return `<div class="fact" data-act="${i}"><div class="fhead"><b>ACT ${i + 1}</b>${opt(`fg_theme_${i}`, THEME_KEYS.map((k) => [k, FORGE_THEMES[k].label]), a.theme)}<input id="fg_name_${i}" maxlength="28" placeholder="Name it (optional)" value="${esc(a.name)}"></div>
        <div class="frules">${RULE_KEYS.map((k) => `<label>${k.toUpperCase()}${opt(`fg_${k}_${i}`, Object.keys(RULE_OPTIONS[k]).map((v) => [v, v]), r[k], 'Forge')}</label>`).join('')}<label class="nul">NULL FIELD<input type="checkbox" id="fg_null_${i}" ${r.nullField ? 'checked' : ''}></label></div></div>`;
    }).join('');
    const castHtml = Array.from({ length: 8 }, (_, i) => {
      const m = pre.cast?.[i] || {};
      return `<div class="crow"><input id="fg_cast_${i}" maxlength="16" placeholder="Name ${i + 1}" value="${esc(m.name)}">${opt(`fg_role_${i}`, ROLE_KEYS.map((k) => [k, ROLES[k].label]), m.role)}</div>`;
    }).join('');
    const gearHtml = Array.from({ length: 4 }, (_, i) => opt(`fg_gear_${i}`, GEAR_KEYS.map((k) => [k, GEAR[k].name]), pre.gear?.[i])).join('');
    const len = pre.length || 'SHORT';
    $('#forge .body').innerHTML = `
      <div class="frow3">
        <label>Title<input id="fg_title" maxlength="40" placeholder="e.g. The Night Shift" value="${esc(pre.title)}"></label>
        <label>Hero's name <small>the station still calls you Ren</small><input id="fg_hero" maxlength="16" placeholder="Ren" value="${esc(pre.hero)}"></label>
        <label>Forge number<span class="seedrow"><input id="fg_seed" inputmode="numeric" maxlength="9" placeholder="random" value="${esc(pre.seed)}"><button id="fg_random" type="button">RANDOM</button></span></label>
      </div>
      <div class="frow">
        <label>Genre${opt('fg_genre', GENRE_KEYS.map((k) => [k, GENRES[k].label]), pre.genre)}<p class="tagline" id="fg_tag"></p></label>
        <label>Length${opt('fg_len', Object.entries(LENGTHS).map(([k, l]) => [k, `${l.label} - ${l.sub}`]), len, null)}</label>
      </div>
      <h3>THE WORLD <small>one location per act, with its local rules; leave anything to the Forge</small></h3>
      <div id="fg_acts">${actsHtml(LENGTHS[len].acts, pre.acts)}</div>
      <h3>THE CAST <small>up to 8 names and roles; one of them will be the ${'antagonist'}. Typed names are spoken by your device's own voice</small></h3>
      ${castHtml}
      <h3>THE KIT <small>four reality tools, not weapons: AFTERZERO has no combat. Each location's rules decide which work there</small></h3>
      <div class="grow">${gearHtml}</div>
      <p class="dim">The same Forge number and the same choices always build the same game.</p>
      <button class="big" id="fg_go">FORGE<small>Then choose a save slot</small></button>`;
    const read = () => {
      const v = (id) => ($(`#${id}`)?.value ?? '').trim();
      const n = LENGTHS[v('fg_len')]?.acts || 3;
      return {
        title: v('fg_title') || null, hero: v('fg_hero') || null, genre: v('fg_genre') || null, length: v('fg_len') || null, seed: v('fg_seed'),
        acts: Array.from({ length: n }, (_, i) => ({ theme: v(`fg_theme_${i}`) || null, name: v(`fg_name_${i}`) || null, rules: { ...Object.fromEntries(RULE_KEYS.map((k) => [k, v(`fg_${k}_${i}`) || null])), nullField: $(`#fg_null_${i}`)?.checked ? true : null } })),
        cast: Array.from({ length: 8 }, (_, i) => ({ name: v(`fg_cast_${i}`) || null, role: v(`fg_role_${i}`) || null })).filter((m) => m.name || m.role),
        gear: Array.from({ length: 4 }, (_, i) => v(`fg_gear_${i}`)).filter(Boolean),
      };
    };
    $('#fg_len').onchange = () => {
      const cur = read();
      $('#fg_acts').innerHTML = actsHtml(LENGTHS[cur.length].acts, cur.acts);
    };
    $('#fg_random').onclick = () => ($('#fg_seed').value = String((Math.random() * 1e9) | 0));
    const tag = () => ($('#fg_tag').textContent = GENRES[$('#fg_genre').value]?.tag || 'The Forge picks a genre: thriller, horror, mystery, adventure, heist or survival.');
    $('#fg_genre').onchange = tag;
    tag();
    $('#fg_go').onclick = () => {
      const choices = read();
      const seed = /^\d+$/.test(choices.seed) ? +choices.seed : (Math.random() * 1e9) | 0;
      this.forgeDraft = { ...choices, seed: String(seed) };
      this.openSaves('new', 'forge', { action: 'forge', opts: { seed, choices } });
    };
    this.hud.show('forge');
  }

  // NEW GAME: pick a chapter. Each card continues its own latest save.
  openChapters(from) {
    if (this.edition) return this.edition.openChapters(from);
    this.menuBack = from;
    this.menu = 'chapters';
    this.input.release();
    const order = ['prologue', 'halcyon', 'cradle', 'vessel', 'studio', 'forge'];
    const action = { prologue: 'new', halcyon: 'halcyon', cradle: 'cradle', vessel: 'vessel', studio: 'studio', forge: 'forge' };
    const le = lastEnding();
    document.querySelector('#chapters .body').innerHTML = order.map((ch) => {
      const c = CHAPTERS[ch];
      const last = latestFor(ch);
      const d = last && describeSave(last.data);
      const after = ['cradle', 'vessel', 'studio'].includes(ch) ? `<p class="dim">${le ? `After ${ENDING_TITLES[le.key]}` : ch === 'cradle' ? 'Before the choice' : 'The ship as it was'}</p>` : '';
      return `<div class="chapcard"><h3>${c.name}</h3><p>${c.sub}</p>${after}<div class="acts">
        ${last ? `<button class="cont" data-cont="${last.slot}">CONTINUE<small>${d.title} · ${d.sub}</small></button>` : ''}
        <button data-newch="${ch}">${ch === 'studio' ? 'CREATE A STORY' : ch === 'forge' ? 'BUILD A GAME' : 'NEW GAME'}</button></div></div>`;
    }).join('');
    for (const b of document.querySelectorAll('#chapters [data-cont]')) {
      b.onclick = () => {
        this.menu = null;
        this.begin('load', b.dataset.cont === 'auto' ? 'auto' : +b.dataset.cont);
      };
    }
    for (const b of document.querySelectorAll('#chapters [data-newch]')) {
      b.onclick = () => (b.dataset.newch === 'studio' ? this.openStudio('chapters') : b.dataset.newch === 'forge' ? this.openForge('chapters') : this.openSaves('new', 'chapters', { action: action[b.dataset.newch] }));
    }
    this.hud.show('chapters');
  }

  openSaves(mode, from, pending = null) {
    this.menuBack = from;
    this.menu = 'saves';
    this.input.release();
    const $ = (s) => document.querySelector(s);
    $('#savesTitle').textContent = mode === 'save' ? 'SAVE GAME' : mode === 'new' ? 'CHOOSE A SAVE SLOT' : 'LOAD GAME';
    const rows = (mode === 'new' ? '<p class="dim">Your new game autosaves into this slot as you play.</p>' : '') + listSaves()
      .filter((s) => mode === 'load' ? s.data : s.slot !== 'auto')
      .map((s) => {
        const d = describeSave(s.data);
        const label = s.slot === 'auto' ? 'OLD AUTOSAVE' : `SLOT ${s.slot + 1}`;
        const empty = mode === 'new' ? 'Empty · start here' : mode === 'save' ? 'Save here' : 'Empty';
        const run = s.data ? `<span class="run">${d.run}</span>` : '';
        const del = s.data ? `<button class="del" data-del="${s.slot}" aria-label="Delete ${label}">DELETE</button>` : '';
        return `<div class="slotrow"><button class="slotbtn ${s.data ? '' : 'empty'}" data-slot="${s.slot}"><span><b>${run}${d.title}</b><small>${d.sub || empty}</small></span><span class="tag2">${label}</span></button>${del}</div>`;
      }).join('') || '<p class="dim">No saved games yet.</p>';
    $('#saves .body').innerHTML = rows;
    for (const b of document.querySelectorAll('#saves [data-del]')) {
      b.onclick = () => {
        if (!b.classList.contains('sure')) {
          b.classList.add('sure');
          b.textContent = 'SURE?';
          return;
        }
        deleteSave(b.dataset.del === 'auto' ? 'auto' : +b.dataset.del);
        this.hud.toast('Save deleted.');
        this.openSaves(mode, from, pending);
      };
    }
    for (const b of document.querySelectorAll('#saves [data-slot]')) {
      b.onclick = () => {
        const slot = b.dataset.slot === 'auto' ? 'auto' : +b.dataset.slot;
        if (mode === 'new') {
          // a used slot needs a second tap: it will be overwritten
          if (!b.classList.contains('empty') && !b.classList.contains('sure')) {
            b.classList.add('sure');
            b.querySelector('small').textContent = 'Tap again to replace this save with a new game';
            return;
          }
          this.menu = null;
          this.begin(pending.action, null, slot, pending.opts || null);
        } else if (mode === 'save') {
          this.saveTo(slot);
          this.hud.toast(`Saved to slot ${slot + 1}.`);
          this.openSaves('save', from);
        } else if (from === 'title') {
          this.menu = null;
          this.begin('load', slot);
        } else this.begin('load', slot);
      };
    }
    this.hud.show('saves');
  }

  // --- character select -----------------------------------------------------
  openHero(from, then = null) {
    this.menuBack = from;
    this.menu = 'hero';
    this.heroThen = then;
    this.input.release();
    if (!this.room) this.enterRoom('antechamber', true);
    const $ = (q) => document.querySelector(q);
    if (actorsReady()) {
      // one character (Ren), several looks
      const cur = { ...LOOK_DEFAULT, ...(this.settings.hero || {}) };
      if (!LOOKS[cur.id]) cur.id = LOOK_DEFAULT.id;
      const look = lookOf(cur);
      $('#hero h2').textContent = 'YOUR LOOK';
      $('#hero .herohint').textContent = 'The station calls you Ren. Choose how you remember yourself.';
      $('#hero .heroes').innerHTML = Object.entries(LOOKS).map(([id, h]) => `<button data-hero="${id}" class="look ${id === cur.id ? 'sel' : ''}"><img src="assets/looks/${id}.webp" alt=""><span>${h.name}</span></button>`).join('');
      $('#hero .heroes').classList.add('looks');
      const sw = (k, list, label) => `<div class="row2"><span>${label}</span><span class="sw">${list.map((v) => `<button style="background:${hex(v)}" class="${cur[k] === v ? 'sel' : ''}" data-k="${k}" data-v="${v}" aria-label="${label} ${hex(v)}"></button>`).join('')}</span></div>`;
      $('#hero .custom').innerHTML = `<p class="heroblurb">${look.blurb}</p>` + (look.colours ? sw('hair', HAIR, 'HAIR') + sw('top', TOPS, 'OUTFIT') : '');
    } else {
      const cur = this.settings.hero || { id: 'ren' };
      const base = HEROES[cur.id] || HEROES.ren;
      const spec = heroSpec(cur);
      $('#hero .heroes').classList.remove('looks');
      $('#hero .heroes').innerHTML = Object.entries(HEROES).map(([id, h]) => `<button data-hero="${id}" class="${id === (cur.id || 'ren') ? 'sel' : ''}">${h.name}<small>${h.role.toUpperCase()}</small></button>`).join('');
      const sw = (k, list, fmt) => `<div class="row2"><span>${fmt}</span><span class="sw">${list.map((v) => k === 'hairStyle'
        ? `<button class="txtb ${spec[k] === v ? 'sel' : ''}" data-k="${k}" data-v="${v}">${v}</button>`
        : `<button style="background:${hex(v)}" class="${spec[k] === v ? 'sel' : ''}" data-k="${k}" data-v="${v}" aria-label="${fmt} ${hex(v)}"></button>`).join('')}</span></div>`;
      $('#hero .custom').innerHTML = `<p class="heroblurb">${base.blurb}</p>` + sw('skin', OPTIONS.skin, 'SKIN') + sw('hair', OPTIONS.hair, 'HAIR') + sw('hairStyle', OPTIONS.hairStyle, 'STYLE') + sw('suit', OPTIONS.suit, 'SUIT');
    }
    for (const b of document.querySelectorAll('#hero [data-hero]')) b.onclick = () => this.pickHero({ id: b.dataset.hero }, from, then);
    for (const b of document.querySelectorAll('#hero .sw button')) {
      b.onclick = () => {
        const v = b.dataset.k === 'hairStyle' ? b.dataset.v : +b.dataset.v;
        this.pickHero({ ...(actorsReady() ? LOOK_DEFAULT : { id: 'ren' }), ...(this.settings.hero || {}), [b.dataset.k]: v }, from, then);
      };
    }
    $('#heroGo').textContent = then ? 'START' : 'DONE';
    $('#heroGo').onclick = () => {
      if (!this.settings.hero) this.changeSetting('hero', actorsReady() ? { ...LOOK_DEFAULT } : { id: 'ren' });
      this.player.cinema = null;
      this.menu = null;
      if (then) then();
      else this.back();
    };
    this.hud.show('hero');
  }

  pickHero(choice, from, then) {
    if (actorsReady() && !actorLoaded(lookOf(choice).model)) {
      // a look that hasn't arrived yet: fetch it, then try again
      loadActors([lookOf(choice).model]).then((ok) => ok && this.menu === 'hero' && this.pickHero(choice, from, then));
      return;
    }
    this.changeSetting('hero', choice);
    this.player.setModel(choice);
    this.voice.youMale = actorsReady() && lookOf(choice).voice === 'm';
    this.buildViewModels();
    this.world.refreshCast(choice);
    this.audio.ui('press');
    this.openHero(from, then);
  }

  openSettings(from) {
    this.menuBack = from;
    this.menu = 'settings';
    this.input.release();
    const s = this.settings;
    const seg = (k, opts) => `<span class="seg">${opts.map(([v, l]) => `<button data-k="${k}" data-v="${v}" class="${s[k] === v ? 'sel' : ''}">${l}</button>`).join('')}</span>`;
    const range = (k, min, max, step) => `<input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}">`;
    const toggle = (k) => seg(k, [[true, 'ON'], [false, 'OFF']]);
    if (s.voice === undefined) s.voice = true;
    document.querySelector('#settings .body').innerHTML = `
      <h3>CAMERA</h3>
      <div class="setting"><span>View<small>V cycles views in game</small></span>${seg('camera', Object.entries(CAMERA_PRESETS).map(([k, p]) => [k, p.label]))}</div>
      <div class="setting"><span>Zoom<small>Pinch with two fingers or use the mouse wheel; double-tap to reset</small></span>${range('zoom', 0.5, 2.5, 0.05)}</div>
      <div class="setting"><span>Field of view</span>${range('fov', 50, 90, 1)}</div>
      <div class="setting"><span>Look sensitivity</span>${range('sensitivity', 0.3, 2.5, 0.05)}</div>
      <div class="setting"><span>Invert look up/down</span>${toggle('invertY')}</div>
      <div class="setting"><span>Comfort mode<small>${this.edition ? 'Steadier camera, no flashes' : 'Instant gravity flips, steadier camera, no flashes'}</small></span>${toggle('comfort')}</div>
      <h3>SCREEN</h3>
      <div class="setting"><span>Graphics quality<small>The highest the game will use</small></span>${seg('quality', Object.entries(QUALITY).map(([k, q]) => [k, q.label]))}</div>
      <div class="setting"><span>Smart renderer<small>${this.smart.fps ? `Now ${Math.round(this.smart.fps)} fps at ${Math.round(this.smart.scale * 100)}% resolution` : 'Adjusts resolution and effects to stay smooth'}</small></span>${toggle('smart')}</div>
      <div class="setting"><span>Minimap</span>${toggle('minimap')}</div>
      <div class="setting"><span>Large subtitles</span>${seg('textSize', [[1, 'NORMAL'], [1.2, 'LARGE']])}</div>
      <h3>SOUND</h3>
      <div class="setting"><span>Volume</span>${range('volume', 0, 1, 0.05)}</div>
      <div class="setting"><span>Voiced dialogue<small>${this.voice.available ? 'Characters speak their lines aloud' : 'Not supported on this device'}</small></span>${seg('voice', [[true, 'ON'], [false, 'OFF']])}</div>
      <h3>DATA</h3>
      <div class="setting"><span>Start fresh<small>Clears saves, settings and your look on this device, then reloads</small></span><span class="seg"><button id="resetData">CLEAR</button></span></div>`;
    document.querySelector('#resetData').onclick = (e) => {
      if (e.currentTarget.dataset.sure !== '1') {
        e.currentTarget.dataset.sure = '1';
        e.currentTarget.textContent = 'TAP AGAIN TO CLEAR';
        return;
      }
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith('afterzero.')) localStorage.removeItem(k);
        sessionStorage.clear();
      } catch {
        /* no storage */
      }
      location.reload();
    };
    for (const b of document.querySelectorAll('#settings .seg button[data-k]')) { // not the CLEAR button
      b.onclick = () => {
        let v = b.dataset.v;
        if (v === 'true') v = true;
        else if (v === 'false') v = false;
        else if (!isNaN(+v)) v = +v;
        if (b.dataset.k === 'camera') this.settings.zoom = 1;
        this.changeSetting(b.dataset.k, v);
        this.openSettings(from);
      };
    }
    for (const r of document.querySelectorAll('#settings input[type=range]')) r.oninput = () => this.changeSetting(r.dataset.k, +r.value);
    this.hud.show('settings');
  }

  zoomBy(steps) {
    const z = THREE.MathUtils.clamp(this.settings.zoom * Math.pow(1.15, THREE.MathUtils.clamp(steps, -4, 4)), 0.5, 2.5);
    this.settings.zoom = +z.toFixed(3);
    this.player.zoom = this.settings.zoom;
    this.zoomSaveT = 1;
  }

  cycleCamera() {
    const keys = Object.keys(CAMERA_PRESETS);
    const next = keys[(keys.indexOf(this.settings.camera) + 1) % keys.length];
    this.settings.zoom = 1;
    this.changeSetting('camera', next);
    this.hud.toast(`<small>CAMERA</small><br>${CAMERA_PRESETS[next].label}`, 1400);
  }

  openDecision() {
    const $ = (s) => document.querySelector(s);
    const opts = [
      ['SEVER', 'Pull the core. End the field.'],
      ['SUSTAIN', 'Leave it running. Take Varga\'s place.'],
    ];
    if (this.facts.test(endings.MIRROR.when)) opts.push(['MIRROR', 'Let the Observer see you.']);
    $('#decision .body').innerHTML =
      '<p>The machine keeps one occupant alive. The occupant keeps the field alive. The field keeps something else shut.</p>' +
      opts.map(([k, t]) => `<button class="big" data-end="${k}">${k}<small>${t}</small></button>`).join('');
    for (const b of document.querySelectorAll('[data-end]')) b.onclick = () => this.finish(b.dataset.end);
    this.openMenu('decision');
  }

  finish(key) {
    const e = endings[key];
    this.facts.set('ending', key);
    rememberEnding(key, [...this.observer.brain.lessons]);
    const found = discoveries.filter((d) => this.facts.get(d)).length;
    const report = {
      version: VERSION,
      ending: key,
      minutes: +(this.playTime / 60).toFixed(1),
      discoveries: `${found}/${discoveries.length}`,
      tokens: Object.keys(TOKENS).filter((t) => this.facts.get(`token_${t}`)).length,
      timesCaught: this.facts.get('times_caught') || 0,
      observerLessons: [...this.observer.brain.lessons],
      objectiveLayers: this.objectives.history.map((h) => h.text),
      timeline: this.timeline,
    };
    const $ = (s) => document.querySelector(s);
    $('#ending .body').innerHTML = `
      <h2>${e.title}</h2>${e.text.map((p) => `<p>${p}</p>`).join('')}
      <div class="stats">
        <span>${report.minutes} min</span><span>${report.discoveries} discoveries</span>
        <span>caught ${report.timesCaught}x</span><span>${report.observerLessons.length} lessons taught to the Observer</span>
      </div>
      <button class="big" id="toCradle">GO BENEATH<small>${{ SEVER: 'Far beneath the station, something opened its eyes.', SUSTAIN: 'The keeper\'s rounds go down.', MIRROR: 'Something below heard the station say your name.' }[key]}</small></button>
      <button id="toVessel">SKIP TO THE VESSEL<small>Eight decks. A crew that vanished. One of them started this cycle.</small></button>
      <h3>THREE QUESTIONS</h3>
      <label>What do you think happened?<textarea id="q1"></textarea></label>
      <label>What do you want to investigate next?<textarea id="q2"></textarea></label>
      <label>Would you voluntarily play another 20 minutes?
        <span class="yn"><button data-yn="yes">YES</button><button data-yn="maybe">MAYBE</button><button data-yn="no">NO</button></span></label>
      <button class="big" id="copyReport">COPY PLAYTEST REPORT</button>
      <button id="again">PLAY THE PROLOGUE AGAIN</button>`;
    let yn = '';
    for (const b of document.querySelectorAll('[data-yn]')) b.onclick = () => {
      yn = b.dataset.yn;
      document.querySelectorAll('[data-yn]').forEach((x) => x.classList.toggle('sel', x === b));
    };
    $('#copyReport').onclick = () => {
      const full = { ...report, answers: { happened: $('#q1').value, next: $('#q2').value, another20: yn } };
      const txt = JSON.stringify(full, null, 2);
      try { window.localStorage.setItem('afterzero.report', txt); } catch { /* ignore */ }
      navigator.clipboard?.writeText(txt).then(() => this.hud.toast('Report copied.'), () => {});
      $('#copyReport').textContent = 'COPIED';
    };
    $('#again').onclick = () => this.begin('new');
    $('#toCradle').onclick = () => {
      this.closeMenu();
      this.run = 'cradle';
      this.startZones(null, 'cradle', key);
    };
    $('#toVessel').onclick = () => {
      this.closeMenu();
      const free = listSaves().find((s) => s.slot !== 'auto' && !s.data);
      if (free) this.slot = free.slot; // the finished prologue stays in its slot
      this.run = 'vessel';
      this.startVessel();
      this.hud.toast(`<small>THE VESSEL</small><br>Saving in slot ${(this.slot ?? 0) + 1}.`, 2400);
    };
    this.saveTo('auto');
    this.openMenu('ending');
  }

  // A chapter started from the chapter menu (after the page reload every new start goes through)
  // inherits the last prologue ending reached on this device, and what the Observer learned then.
  adoptLastEnding() {
    const last = lastEnding();
    if (!last) return;
    this.facts.set('ending', last.key);
    for (const l of last.lessons || []) this.observer.brain.lessons.add(l);
  }

  // THE CRADLE from the chapter menu: the prologue counts as played to the machine.
  beginCradle() {
    this.facts.rulesEnabled = false;
    for (const k of ['left_antechamber', 'met_juno', 'has_tick', 'has_device', 'seen_echo', 'heard_varga', 'heard_self', 'wrote_law', 'archive_open', 'custodian_remembers', 'vault_seen', 'zones_started', 'zones_done', 'core_installed', 'machine_activated', 'brain_seen']) this.facts.set(k);
    this.engine.setLaw(1, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' });
    this.enterRoom('lab', true);
    this.startZones(null, 'cradle', this.facts.get('ending') || null);
  }

  // --- HALCYON: the open districts in the middle of the prologue -------------------
  // Varga's vault recording sends Ren up into the arcology above Station Zero;
  // the last district's lift brings Ren back down to the lab.
  startZones(saved = null, set = saved?.set || 'halcyon', ending = saved ? saved.ending ?? null : null) {
    this.mode = 'deck';
    this.story = set === 'cradle' ? makeCradleStory(ending) : makeZoneStory();
    this.facts.set('observer_taught', this.observer.brain.lessons.size > 0);
    if (this.story.after?.sentinels === 'learned' && !this.observer.brain.lessons.size) this.story.after.sentinels = 'hunt';
    this.campaign = saved || { zones: true, set, ending, deck: 0, sector: 0, flags: {}, visited: [] };
    this.campaign.zones = true;
    this.facts.rulesEnabled = false;
    this.facts.set('zones_started');
    for (const t of BASE_TOKENS) this.facts.set(`token_${t}`);
    this.engine.unlockSlot(3);
    this.world.root.visible = false;
    this.observer.mesh.visible = false;
    this.npcs.juno.visible = false;
    this.held = saved ? saved.held || null : null;
    this.loadSector(!saved, saved?.room, saved?.pos);
  }

  enterHalcyon() {
    if (this.mode !== 'station' || this.transitioning) return;
    this.transitioning = true;
    this.hud.fade(true);
    this.audio.sweep?.(true);
    setTimeout(() => {
      this.startZones();
      this.hud.fade(false);
      this.transitioning = false;
    }, 1400);
  }

  returnToStation() {
    this.weather.set(null);
    this.postfx.setGrade(STATION_GRADE);
    this.postfx.setEnvironment(null);
    this.deckWorld.dispose();
    this.level = this.stationLevel;
    this.minimap.stationMode = false; // redraw Station Zero's map
    this.mode = 'station';
    this.campaign = null;
    this.story = null;
    this.held = null;
    this.facts.rulesEnabled = true;
    this.facts.set('zones_done');
    this.world.root.visible = true;
    this.observer.mesh.visible = true;
    this.npcs.juno.visible = this.facts.get('met_juno');
    if (this.run === 'halcyon') this.run = 'prologue'; // the rest is the prologue's last act
    this.enterRoom('lab', true);
    this.objectives.update(true);
    this.hud.objective(this.objectives.text);
    this.hud.card('STATION ZERO', 'Home', 'The lift opens into the laboratory', 4200);
    this.after(2.4, () => this.hud.say([
      { who: 'JUNO', text: 'You are back. Same lab. It looks different now that we know what it is for.' },
      { who: 'JUNO', text: 'The core is in the observation hall. The machine is waiting. Varga said look inside it before you choose.', when: '!core_installed' },
      { who: 'JUNO', text: 'The machine is waiting. Varga said look inside it before you choose.', when: 'core_installed' },
    ], this.facts));
    this.saveTo('auto');
  }

  // --- the vessel -------------------------------------------------------------
  startVessel(seed = (Math.random() * 1e9) | 0, saved = null, wish = null, ending) {
    this.mode = 'deck';
    seed = seed ?? ((Math.random() * 1e9) | 0);
    wish = saved?.wish || wish;
    // the prologue ending reaches the vessel: a save keeps its own, else what this run chose (or adopted), else none
    ending = saved ? saved.ending ?? null : ending !== undefined ? ending : this.facts.get('ending') || null;
    this.story = makeStory(seed, wish, { ending });
    this.facts.set('observer_taught', this.observer.brain.lessons.size > 0);
    if (this.story.after.sentinels === 'learned' && !this.observer.brain.lessons.size) this.story.after = { ...this.story.after, sentinels: 'hunt' };
    this.campaign = saved || { seed, wish, ending, deck: 0, sector: 0, flags: {}, visited: [] };
    this.facts.rulesEnabled = false; // Station Zero's scripted rules stay behind
    for (const t of BASE_TOKENS) this.facts.set(`token_${t}`);
    for (const k of ['has_device', 'has_tick', 'met_juno', 'left_antechamber']) this.facts.set(k);
    this.engine.unlockSlot(3);
    this.engine.lock('antechamber', false);
    this.world.root.visible = false;
    this.observer.mesh.visible = false;
    this.held = saved ? saved.held || null : null;
    this.loadSector(!saved, saved?.room, saved?.pos);
  }

  // --- WORLD FORGE: a game built from the player's choices ---------------------------
  startForge(seed = (Math.random() * 1e9) | 0, saved = null, choices = null) {
    this.mode = 'deck';
    seed = seed ?? ((Math.random() * 1e9) | 0);
    choices = saved?.choices || choices || {};
    this.forge = forgeGame(seed, choices);
    this.story = makeForgeStory(this.forge);
    this.campaign = saved || { forge: true, seed, choices, deck: 0, sector: 0, flags: {}, visited: [] };
    this.campaign.forge = true;
    this.gearCd = {};
    this.flareT = 0;
    this.facts.rulesEnabled = false;
    for (const t of [...BASE_TOKENS, 'TIME', 'LIGHT']) this.facts.set(`token_${t}`); // the device knows every word: the puzzle is the rules
    for (const k of ['has_device', 'has_tick', 'met_juno', 'left_antechamber']) this.facts.set(k);
    this.engine.unlockSlot(3);
    this.engine.lock('antechamber', false);
    this.world.root.visible = false;
    this.observer.mesh.visible = false;
    this.npcs.juno.visible = false;
    this.held = saved ? saved.held || null : null;
    document.body.classList.add('forge');
    this.renderGearDock();
    this.loadSector(!saved, saved?.room, saved?.pos);
  }

  forgeAct() {
    return this.story.decks[this.campaign.deck];
  }

  // the rules card and the journal share one rendering of an act's rules and the kit
  rulesHtml(act) {
    const d = describeRules(act, this.forge.gear);
    const rows = d.rows.map((r) => `<li class="${r.key === 'NULL FIELD' ? 'nul' : ''}"><b>${r.key}</b><div><em>${r.value}</em> <span>${r.text}</span></div></li>`).join('');
    const gear = d.gear.map((g) => `<span class="gc ${g.ok ? '' : 'no'}">${g.name}${g.note ? `<small>${g.note}</small>` : ''}</span>`).join('');
    return { rows, gear };
  }

  showRules(ms = 7000) {
    if (!this.campaign?.forge) return;
    const act = this.forgeAct();
    const R = this.rulesHtml(act);
    this.hud.rules(`ACT ${act.index + 1} · ${act.name}`, R.rows, R.gear, ms);
  }

  toggleRules() {
    if (!this.campaign?.forge) return;
    if (this.hud.rulesShown) this.hud.rulesHide();
    else this.showRules(0);
  }

  renderGearDock() {
    const kit = this.campaign?.forge ? this.forge.gear : [];
    for (const b of document.querySelectorAll('[data-act^="gear:"]')) {
      const i = +b.dataset.act.slice(5);
      const key = kit[i];
      b.classList.toggle('off', !key);
      if (!key) continue;
      b.querySelector('i').innerHTML = GEAR_ICONS[key];
      b.querySelector('span').textContent = GEAR[key].short;
      b.title = `${GEAR[key].name}: ${GEAR[key].desc}`;
    }
    document.querySelector('#dock .rules')?.classList.toggle('off', !this.campaign?.forge);
  }

  // one press of a gear slot: 'ok', or why not ('refused', 'cooling', 'spent', 'none')
  useGear(i) {
    if (this.mode !== 'deck' || !this.campaign?.forge) return 'off';
    const key = this.forge.gear[i];
    if (!key) return 'off';
    const act = this.forgeAct();
    const rule = act.gearAllowed[key];
    const G = GEAR[key];
    const say = (t) => t && this.hud.say([{ who: 'TICK', text: t }], this.facts);
    const toast = (t) => this.hud.toast(`<small>${G.name}</small><br>${t}`, 2600);
    if (!rule.ok) {
      this.audio.deny();
      toast(rule.note.toUpperCase());
      say(gearTick(key, 'refused'));
      this.showRules(5000);
      return 'refused';
    }
    if ((this.gearCd[key] || 0) > this.time) {
      this.audio.deny();
      toast(`CHARGING · ${Math.ceil(this.gearCd[key] - this.time)} S`);
      return 'cooling';
    }
    const flags = this.deckWorld.flags;
    const p = this.player.pos;
    const room = this.room;
    const near = (list, at) => list.filter((o) => at(o).room === room).map((o) => ({ o, d: Math.hypot(at(o).x - p.x, at(o).z - p.z) })).sort((a, b) => a.d - b.d)[0]?.o;
    if (key === 'STASIS') {
      const s = near(this.deckWorld.sentinels, (o) => ({ room: o.def.room, x: o.pos.x, z: o.pos.z }));
      const h = near(this.deckWorld.hazards, (o) => ({ room: o.hz.room, x: o.hz.pivot[0], z: o.hz.pivot[2] }));
      if (!s && !h) {
        this.audio.deny();
        say(gearTick(key, 'none'));
        return 'none';
      }
      if (s) { s.stasisT = rule.dur; s.mode = 'patrol'; s.suspicion = 0; this.fx.burst([s.pos.x, 1.2, s.pos.z], 0xb6a6ff, 30, 1.6); }
      if (h) { h.stasisT = rule.dur; this.fx.burst(h.hz.pivot, 0xb6a6ff, 20, 1.2); }
    } else if (key === 'GRAPPLE' || key === 'RIG') {
      // hard light in front of you, along the nearest axis, on the surface you stand on
      const f = this.player.forward(new THREE.Vector3());
      const ax = Math.abs(f.x) > Math.abs(f.z) ? [Math.sign(f.x) || 1, 0] : [0, Math.sign(f.z) || -1];
      const up = this.player.gravity === 1 ? -1 : 1; // on the ceiling, "up" is down
      const feet = p.y - up * this.player.half.y;
      const boxes = [];
      if (key === 'GRAPPLE') {
        const len = 8.5, w = 0.5;
        const x0 = p.x + ax[0] * -0.4, z0 = p.z + ax[1] * -0.4, x1 = p.x + ax[0] * len, z1 = p.z + ax[1] * len;
        boxes.push([Math.min(x0, x1) - (ax[0] ? 0 : w), feet - (up > 0 ? 0.22 : 0), Math.min(z0, z1) - (ax[1] ? 0 : w), Math.max(x0, x1) + (ax[0] ? 0 : w), feet + (up > 0 ? 0 : 0.22), Math.max(z0, z1) + (ax[1] ? 0 : w)]);
      } else {
        const steps = 6, tread = 1.2, rise = 0.75, w = 1.1;
        for (let k = 0; k < steps; k++) {
          const a = 0.6 + k * tread, b = a + tread;
          const top = feet + up * (k + 1) * rise;
          const x0 = p.x + ax[0] * a, z0 = p.z + ax[1] * a, x1 = p.x + ax[0] * b, z1 = p.z + ax[1] * b;
          boxes.push([Math.min(x0, x1) - (ax[0] ? 0 : w), Math.min(top, top - up * 0.3), Math.min(z0, z1) - (ax[1] ? 0 : w), Math.max(x0, x1) + (ax[0] ? 0 : w), Math.max(top, top - up * 0.3), Math.max(z0, z1) + (ax[1] ? 0 : w)]);
        }
      }
      for (const b of boxes) this.deckWorld.addTemp(b, rule.dur);
      this.fx.burst([p.x + ax[0] * 2, feet + up * 0.5, p.z + ax[1] * 2], 0xffd36a, 30, 1.8);
    } else if (key === 'LENS') {
      this.deckWorld.lens(rule.dur);
      this.fx.burst([p.x, p.y + 0.8, p.z], 0x3cc4cf, 34, 2.2);
    } else if (key === 'FLARE') {
      this.flareT = rule.dur;
      this.flareAt = [p.x, p.y + 0.6, p.z];
      for (const s of this.deckWorld.sentinels) if (s.def.room === room) s.lure = { x: p.x, z: p.z, t: rule.dur };
      this.fx.burst(this.flareAt, 0xffb060, 40, 2.6);
    } else if (key === 'KEYFORGE') {
      if (flags[`gear_KEYFORGE_${act.index}`]) {
        this.audio.deny();
        say(gearTick(key, 'spent'));
        return 'spent';
      }
      const it = this.heldItem();
      if (!it || !it.echo) {
        this.audio.deny();
        say(gearTick(key, 'none'));
        return 'none';
      }
      it.echo = false;
      flags[`forged_${it.id}`] = true;
      flags[`gear_KEYFORGE_${act.index}`] = true;
      this.campaign.flags = { ...flags };
      this.fx.burst([p.x, p.y + 0.6, p.z], 0xffd27a, 30, 1.6);
    }
    this.gearCd[key] = this.time + G.cooldown;
    this.audio.insert();
    toast(G.desc.toUpperCase());
    say(gearTick(key, 'use'));
    this.dirty = true;
    return 'ok';
  }

  // the cast's two-option encounters: a fact is set, later lines and the ending change with it
  openForgeChoice(beat, npc) {
    const ch = beat.choice;
    if (this.deckWorld.flags[`chosen_${beat.choice.fact}`]) return;
    const $ = (q) => document.querySelector(q);
    $('#forgechoice .body').innerHTML = `<p>${ch.prompt}</p>` + ch.options.map((o) => `<button class="big" data-fch="${o.key}">${o.label}</button>`).join('');
    for (const b of document.querySelectorAll('[data-fch]')) b.onclick = () => this.chooseForge(beat, npc, b.dataset.fch);
    this.openMenu('forgechoice');
  }

  chooseForge(beat, npc, key) {
    const ch = beat.choice;
    const o = ch.options.find((x) => x.key === key) || ch.options[0];
    this.facts.set(ch.fact, o.tag);
    this.facts.inc(`forge_${o.tag}`);
    this.deckWorld.flags[`chosen_${ch.fact}`] = true;
    this.campaign.flags = { ...this.deckWorld.flags };
    this.log.push(`<b>${ch.prompt}</b> You chose: ${o.label}.`);
    this.closeMenu();
    const reply = ch.reply[o.tag];
    const voice = npc ? crewVoice(npc.crew) : undefined;
    this.hud.say([{ ...reply, voice }, { who: 'TICK', text: ch.tick }], this.facts);
    if (beat.junoAfter) this.hud.say([{ who: 'JUNO', text: beat.junoAfter }], this.facts);
    this.audio.chime();
    this.beatDone();
  }

  // the finale: a two or three option decision; the ending depends on it and on what you chose before
  openForgeDecision() {
    if (this.facts.get('verdict_right')) return this.hud.toast('The chair has its answer.');
    const beat = this.deckBeat();
    const $ = (q) => document.querySelector(q);
    $('#forgeQ').textContent = beat.question;
    $('#forgeend .body').innerHTML = beat.options.map((o) => `<button class="big" data-fend="${o.key}">${o.label}</button>`).join('');
    for (const b of document.querySelectorAll('[data-fend]')) b.onclick = () => this.endForge(b.dataset.fend);
    this.openMenu('forgeend');
  }

  endForge(key) {
    const end = forgeEnding(this.forge, key, this.facts);
    this.facts.set('verdict_right');
    this.facts.set('forge_ending', key);
    this.beatDone();
    const $ = (q) => document.querySelector(q);
    const mins = Math.round(this.playTime / 60);
    const g = this.forge;
    const show = () => {
      $('#ending .body').innerHTML = `
      <h2>${end.title}</h2>${end.text.map((t) => `<p>${t}</p>`).join('')}
      <p class="dim">${end.coda[0].text}</p>
      <div class="stats"><span>${g.title.toUpperCase()} · ${GENRES[g.genre].label}</span><span>${Math.floor(mins / 60)} h ${mins % 60} min</span><span>${g.cast.filter((c) => this.facts.get(`met_${c.id}`)).length}/${g.cast.length} met</span><span>trusted ${end.trust} · doubted ${end.doubt}</span><span>Forge ${g.seed}</span></div>
      <button class="big" id="forgeAgain">BACK TO THE FORGE<small>Build another game, or the same one with a new number</small></button>
      <button id="keepPlaying">STAY HERE</button>`;
      $('#forgeAgain').onclick = () => {
        this.saveTo('auto');
        session((s) => s.setItem(BOOT_KEY, JSON.stringify({ action: 'forgePanel', opts: { choices: { ...(this.campaign.choices || {}), seed: '' } } })));
        location.reload();
      };
      $('#keepPlaying').onclick = () => this.closeMenu();
      this.saveTo('auto');
      this.openMenu('ending');
    };
    this.closeMenu();
    this.hud.say(end.coda, this.facts, show);
  }

  loadSector(intro, roomId, pos) {
    const c = this.campaign;
    const act = c.forge ? this.forgeAct() : null;
    let lv = c.lv ? this.edition.buildLevel(c) : c.zones || act?.open ? generateZone(this.story, c.deck, c.sector) : generateSector(this.story, c.deck, c.sector, c.seed);
    if (act) {
      lv = tuneLevel(lv, act);
      // the act's local rules, applied to every room (RealityEngine overrides)
      for (const k of Object.keys(this.engine.overrides)) if (/^(d\d+s\d+r\d+|f\d+s\d+)$/.test(k)) delete this.engine.overrides[k];
      const o = rulesOverride(act.rules);
      for (const rid of lv.order) this.engine.setOverride(rid, o);
      this.flareT = 0;
    }
    this.level = lv;
    this.deckWorld.hero = this.settings.hero; // the Other wears your face
    this.deckWorld.build(lv, this.story, c.flags);
    this.weather.set(lv.palette.weather);
    this.postfx.setGrade(lv.palette.grade || STATION_GRADE);
    this.postfx.setEnvironment(lv.palette.sky || null);
    this.minimap.setMap(lv.map, c.visited);
    this.minimap.stationMode = false;
    const start = roomId && lv.rooms[roomId] ? roomId : lv.order[0];
    this.enterRoom(start, true);
    if (pos) this.player.place(pos);
    this.checkpoint = pos || lv.rooms[start].spawn;
    const deck = this.story.decks[c.deck];
    if (c.lv) {
      this.edition.onSectorLoaded(intro, start);
      this.saveTo('auto');
      return;
    }
    if (intro && c.forge) {
      this.held = null;
      if (c.sector === 0) {
        this.gearCd = {}; // the kit recharges at the door of a new location
        this.hud.card(`${this.story.title.toUpperCase()} · ACT ${c.deck + 1} OF ${this.story.decks.length}`, deck.name, deck.subtitle, 4200);
        this.after(2.6, () => this.hud.say(deck.intro, this.facts));
        this.after(5.2, () => this.showRules(8000));
        if (deck.ruleTick) this.after(5.4, () => this.hud.say([{ who: 'TICK', text: deck.ruleTick }], this.facts));
      } else {
        this.hud.card(`${deck.name} · ${deck.open ? 'DISTRICT' : 'SECTOR'} ${c.sector + 1} OF ${deck.sectors}`, this.level.rooms[lv.order[0]].name, '', 2600);
        this.after(1.2, () => this.showRules(5000));
      }
    } else if (intro) {
      this.held = null;
      const per = deck.sectors || SECTORS_PER_DECK;
      if (c.sector === 0) {
        this.hud.card(c.zones ? (this.story.cardTop || `HALCYON · CHAPTER ${c.deck + 1} OF ${this.story.decks.length}`) : `DECK ${c.deck + 1} OF 8${this.story.after?.title ? ` · AFTER ${this.story.after.title}` : ''}`, deck.name, deck.subtitle, 4200);
        this.after(2.6, () => this.hud.say(deck.intro, this.facts));
      } else this.hud.card(`${deck.name} · ${c.zones ? 'DISTRICT' : 'SECTOR'} ${c.sector + 1} OF ${per}`, this.level.rooms[lv.order[0]].name, '', 2600);
    }
    if (c.forge && !intro && pos) this.after(1.2, () => this.showRules(5000));
    this.updateDeckObjective(true);
    this.saveTo('auto');
  }

  completeSector() {
    const c = this.campaign;
    if (c.lv) return this.edition.exitReached();
    if (this.level.rooms[this.level.order[this.level.order.length - 1]]?.beat === 'verdict' && !this.facts.get('verdict_right')) {
      if (!this.gateWarned) this.hud.say([{ who: 'JUNO', text: 'The gate won\'t open for a guess. Sit in the chair first.' }], this.facts);
      this.gateWarned = true;
      return;
    }
    if (this.transitioning) return;
    const per = this.story.decks[c.deck].sectors || SECTORS_PER_DECK;
    const lastDeck = this.story.decks.length - 1;
    if (c.zones && c.set === 'cradle' && c.sector === per - 1) {
      // the night watch gate climbs to the forward decks: the vessel, in the world the ending made
      this.transitioning = true;
      this.hud.fade(true);
      this.audio.chime();
      const ending = c.ending ?? null;
      setTimeout(() => {
        this.run = 'vessel';
        this.startVessel(undefined, null, null, ending);
        this.hud.fade(false);
        this.transitioning = false;
      }, 1200);
      return;
    }
    if (c.zones && c.deck === lastDeck && c.sector === per - 1) {
      // the lift at the top of the tower goes home
      this.transitioning = true;
      this.hud.fade(true);
      this.audio.chime();
      setTimeout(() => {
        this.returnToStation();
        this.hud.fade(false);
        this.transitioning = false;
      }, 1200);
      return;
    }
    if (c.deck === lastDeck && c.sector === per - 1) {
      // the last gate: the vessel is done; offer the next cycle
      if (this.menu !== 'ending') this.openMenu('ending');
      return;
    }
    this.transitioning = true;
    this.hud.fade(true);
    this.audio.chime();
    setTimeout(() => {
      c.sector++;
      if (c.sector >= per) {
        c.sector = 0;
        c.deck = Math.min(lastDeck, c.deck + 1);
      }
      c.flags = {};
      c.visited = [];
      this.loadSector(true);
      this.hud.fade(false);
      this.transitioning = false;
    }, 900);
  }

  deckBeat() {
    if (this.campaign?.lv) return this.edition.beat;
    const deck = this.story.decks[this.campaign.deck];
    return deck.beats[this.campaign.sector];
  }

  updateDeckObjective(force = false) {
    if (this.campaign?.lv) return this.edition.objective(force);
    const deck = this.story.decks[this.campaign.deck];
    const beat = this.deckBeat();
    const crew = beat.crew != null ? this.story.cast[beat.crew] : deck.crew !== null ? this.story.cast[deck.crew] : null;
    const done = this.deckWorld.flags.beat_done;
    let goal;
    if (beat.goal && !done) goal = beat.goal;
    else if (beat.goal) goal = beat.gate ? `The gate is open: ${beat.gate}.` :'The north gate is open.';
    else if (beat.kind === 'verdict') goal = this.facts.get('verdict_right') ? 'Walk through the last gate.' : 'Reach the chair. Name whose hands were on the first law.';
    else if (done) goal = 'Find the way to the next sector.';
    else if (beat.kind === 'arrival' || beat.kind === 'log') goal = crew ? `Find ${crew.first}'s log.` : 'Find the captain\'s log.';
    else if (beat.kind === 'contradiction') goal = `Compare ${crew.first}'s record with its echo.`;
    else goal = `Find ${crew.first}.`;
    const text = `${deck.name} · ${goal}`;
    if (force || text !== this.lastObjective) {
      this.lastObjective = text;
      this.hud.objective(text, !force);
    }
  }

  beatDone() {
    if (this.deckWorld.flags.beat_done) return;
    this.deckWorld.flags.beat_done = true;
    this.campaign.flags.beat_done = true;
    this.deckWorld.refresh(); // doors that wait for the scene (HALCYON's gates) open now
    this.audio.chime();
    this.updateDeckObjective();
    this.dirty = true;
  }

  useDeck(f) {
    if (this.campaign?.lv && this.edition.useDeck(f)) return;
    const it = f.it;
    const flags = this.deckWorld.flags;
    const beat = this.deckBeat();
    const say = (lines, done) => this.hud.say(lines, this.facts, done);
    const sys = (key, tick) => (this.edition ? [{ who: 'KAI', text: this.edition.line(key) }] : [{ who: 'TICK', text: tick }]);
    if (f.id.startsWith('ditem:')) {
      this.held = f.id.slice(6);
      this.audio.pickup();
      const ip = this.level.items.find((i) => i.id === this.held)?.pos;
      if (ip) this.fx.burst(ip, 0xffd27a);
      return;
    }
    if (f.id.startsWith('dnpc:')) {
      const n = f.npc;
      n.talkT = 6;
      n.model.userData.wave?.();
      this.facts.set(`met_${n.crew.id}`);
      const lines = n.n.lines || [{ who: 'CREW', name: n.crew.name.toUpperCase(), color: n.crew.color, text: '...' }];
      const voice = crewVoice(n.crew);
      this.audio.greet('CREW');
      const p = n.model.position;
      this.talkWith = [p.x, p.y + 1.55, p.z];
      const choosing = beat.choice && !flags[`chosen_${beat.choice.fact}`] && n.n.id === `npc_${this.level.order.find((rid) => this.level.rooms[rid].beat)}`;
      say(lines.map((l) => (l.who === 'CREW' ? { ...l, voice } : l)), choosing ? () => this.openForgeChoice(beat, n) : undefined);
      if (n.n.junoAfter && !choosing) say([].concat(n.n.junoAfter).map((text) => ({ who: 'JUNO', text })));
      if (beat.kind === 'encounter' && !this.facts.get(`met_logged_${n.crew.id}`)) {
        this.facts.set(`met_logged_${n.crew.id}`);
        this.log.push(`Met ${n.crew.name} (${n.crew.role})${n.n.hologram ? ' - only an echo' : ' - alive'}.`);
      }
      if (beat.kind === 'encounter' && !choosing && !beat.choice) this.beatDone();
      return;
    }
    const kind = it.kind;
    if (kind === 'terminal') {
      this.audio.terminal();
      const pp = this.player.pos;
      this.fx.holo(it.pos, Math.atan2(pp.x - it.pos[0], pp.z - it.pos[2]), it.log.title, it.log.text, '#2f7f9e', this.voice.duration(it.log.text, it.log.who || 'NONE') + 1);
      say([{ who: it.log.who || 'NONE', name: it.log.title, color: '#4f6170', text: it.log.text }]);
      if (!flags[`done_${it.id}`]) {
        flags[`done_${it.id}`] = true;
        this.log.push(`<b>${it.log.title}</b> ${it.log.text}`);
        if (beat.junoAfter) say([].concat(beat.junoAfter).map((text) => ({ who: 'JUNO', text })));
        if (beat.kind === 'arrival' && beat.tick) say([{ who: 'TICK', text: beat.tick }]);
        if (beat.kind === 'arrival' || beat.kind === 'log') this.beatDone();
      }
    } else if (kind === 'plaque') {
      const state = this.engine.state(this.room);
      if (state !== this.engine.residue) {
        say([{ who: 'NONE', text: beat.official }]);
        if (!flags.plaqueHint) {
          flags.plaqueHint = true;
          say(this.edition ? sys('plaque') : [{ who: 'TICK', text: beat.tick }]);
        }
      } else {
        this.audio.terminal();
        this.fx.burst(it.pos, 0x3cc4cf, 30, 1.6);
        say([{ who: 'NONE', text: beat.echo }, { who: 'YOU', text: beat.log }]);
        if (!flags[`done_${it.id}`]) {
          flags[`done_${it.id}`] = true;
          const crew = this.story.cast[beat.crew ?? this.story.decks[this.campaign.deck].crew];
          this.facts.set(`clue_${crew.id}`, beat.clue);
          if (beat.twistRead) this.facts.set('forge_twist_read'); // the twist: every secret in the journal opens
          // discoveries rewrite what you thought you knew
          this.log = this.log.map((l) => (l.includes(crew.first) && !l.includes('↻')
            ? `${l} <i>↻ ${beat.clue === 'guilty' ? 'The echo contradicts this.' : 'The echo confirms this.'}</i>` : l));
          this.log.push(beat.log);
          this.hud.toast(`<small>${beat.toast || (beat.clue === 'guilty' ? 'CONTRADICTION FOUND' : 'ALIBI CONFIRMED')}</small><br>${crew.name}`, 4200);
          if (beat.junoAfter) say([].concat(beat.junoAfter).map((text) => ({ who: 'JUNO', text })));
          this.beatDone();
        }
      }
    } else if (kind === 'lock' || kind === 'socket') {
      const state = this.engine.state(this.room);
      if (this.held === it.needs && (kind === 'socket' || state === this.engine.baseline)) {
        this.held = null;
        flags[`used_${it.needs}`] = true;
        this.deckWorld.setFlag(`open_${it.room}`);
        this.campaign.flags = { ...flags };
        this.audio.insert();
        this.after(0.28, () => this.audio.door());
        this.fx.burst(it.pos, 0x7fe0a8, 30, 1.8);
        this.hud.toast(kind === 'lock' ? 'The lock accepts the key.' : 'The core hums. The door opens.');
      } else if (kind === 'lock' && this.held === it.needs) {
        this.audio.deny();
        say(sys('lock_state', 'THE LOCK ONLY READS PHYSICAL MATTER. THIS ROOM IS NOT PHYSICAL RIGHT NOW.'));
      } else {
        this.audio.deny();
        say(kind === 'lock' ? sys('lock_key', 'IT WANTS A KEY. I SAW ONE IN ANOTHER STATE OF THIS ROOM.') : sys('socket_empty', 'AN EMPTY CORE SOCKET. THERE IS A CORE IN THIS ROOM.'));
      }
    } else if (kind === 'beacon') {
      this.saveTo('auto');
      this.audio.beacon();
      this.fx.burst(it.pos, 0x9fe8ff, 40, 1.4);
      this.hud.toast('<small>MEMORY BEACON</small><br>Progress saved.');
    } else if (kind === 'fragment') {
      if (!flags[`done_${it.id}`]) {
        flags[`done_${it.id}`] = true;
        this.campaign.flags = { ...flags };
        this.facts.inc('fragments');
        const p = this.deckWorld.props[it.id];
        if (p) p.visible = false;
        this.audio.token();
        this.fx.burst(it.pos, this.level.palette.accent2 ?? 0x9fe8ff, 30, 1.4);
        const found = Object.keys(flags).filter((k) => k.startsWith('done_frag_')).length;
        this.hud.toast(`<small>MEMORY FRAGMENT ${found} / 3</small><br>${this.level.deckName}`, 2600);
        this.log.push(`<b>Memory fragment.</b> ${it.text}`);
        say([{ who: 'NONE', text: it.text }]);
      }
    } else if (kind === 'chair') {
      this.openVerdict();
    }
    this.dirty = true;
  }

  openVerdict() {
    if (this.campaign?.forge) return this.openForgeDecision();
    if (this.facts.get('verdict_right')) return this.hud.toast('The chair has its answer.');
    const $ = (s) => document.querySelector(s);
    $('#verdict .body').innerHTML = this.story.cast.map((c, i) => {
      const st = this.facts.get(`clue_${c.id}`);
      return `<button class="big" data-accuse="${i}">${c.name}<small>${c.role} · ${st === 'guilty' ? 'echo contradicts the record' : st === 'cleared' ? 'alibi confirmed' : 'no echo found'}</small></button>`;
    }).join('');
    for (const b of document.querySelectorAll('[data-accuse]')) b.onclick = () => this.accuse(+b.dataset.accuse);
    this.openMenu('verdict');
  }

  accuse(i) {
    const end = verdictEnding(this.story, i);
    this.facts.inc('verdicts');
    if (!end.right) {
      this.closeMenu();
      this.hud.say(end.text.map((text) => ({ who: 'NONE', text })), this.facts);
      return;
    }
    this.facts.set('verdict_right');
    this.deckWorld.refresh(); // whoever waits for the verdict steps in (Juno, after SEVERED)
    const $ = (s) => document.querySelector(s);
    const mins = Math.round(this.playTime / 60);
    const A = this.story.after || {};
    const again = A.again || ['CYCLE 43', 'A new vessel, a new crew, a new truth'];
    const coda = (A.coda || []).filter((l) => l.who === 'NONE').map((l) => `<p class="dim">${l.text}</p>`).join('');
    const show = () => {
      $('#ending .body').innerHTML = `
      <h2>${end.title}</h2>${end.text.map((p) => `<p>${p}</p>`).join('')}${coda}
      <div class="stats"><span>${Math.floor(mins / 60)} h ${mins % 60} min</span><span>${this.facts.get('verdicts')} verdict${this.facts.get('verdicts') > 1 ? 's' : ''}</span>
      <span>${this.story.cast.filter((c) => this.facts.get(`met_${c.id}`)).length}/7 crew met</span><span>seed ${this.campaign.seed}</span></div>
      <button class="big" id="newVessel">${again[0]}<small>${again[1]}</small></button>
      <button id="keepPlaying">STAY ON THE BRIDGE</button>`;
      $('#newVessel').onclick = () => this.begin('vessel', null, null, { ending: this.campaign.ending ?? null });
      $('#keepPlaying').onclick = () => this.closeMenu();
      this.saveTo('auto');
      this.openMenu('ending');
    };
    // the last scene on the bridge plays first, in the world the prologue ending made
    if (A.coda?.length) {
      this.closeMenu();
      this.hud.say(A.coda, this.facts, show);
    } else show();
  }

  deckHint() {
    if (this.campaign?.lv) return this.edition.hint();
    const r = this.level.rooms[this.room];
    const p = this.player.pos;
    const inside = (b) => p.x >= b[0] && p.x < b[3] && p.z >= b[2] && p.z < b[5];
    const ch = r.challenges?.find((c) => inside(c.box)) || r.challenges?.[0];
    let text;
    if (!ch) {
      const beat = this.deckBeat();
      text = this.deckWorld.flags.beat_done ? 'THE NEXT DOOR IS OPEN. KEEP GOING.' : beat.kind === 'contradiction' ? 'READ THE RECORD ON THE WALL. THEN READ IT AGAIN IN ECHO.' : 'LOOK AROUND THIS ROOM. SOMEONE LEFT SOMETHING FOR YOU.';
    } else {
      if (this.hintKey !== ch.key + this.room) {
        this.hintKey = ch.key + this.room;
        this.hintTier = 0;
      }
      text = ch.hints[Math.min(this.hintTier, 2)];
      this.hintTier++;
    }
    this.facts.inc('hints_used');
    this.audio.blip(988, 0.1);
    this.hud.say([{ who: 'TICK', text }], this.facts);
  }

  mapMarkers() {
    const out = [];
    if (this.mode === 'deck') {
      for (const n of this.deckWorld.npcs) if (!n.n.silent) out.push({ x: n.model.position.x, z: n.model.position.z, kind: 'npc' });
      for (const s of this.deckWorld.sentinels) out.push({ x: s.pos.x, z: s.pos.z, kind: 'sentinel' });
      for (const it of this.level.items) if (this.held !== it.id && !this.deckWorld.flags[`used_${it.id}`]) out.push({ x: it.pos[0], z: it.pos[2], kind: 'item' });
      for (const t of this.level.tokens) if (!this.facts.get(`token_${t.token}`)) out.push({ x: t.pos[0], z: t.pos[2], kind: 'token' });
      for (const it of this.level.interactables) if (it.kind === 'beacon') out.push({ x: it.pos[0], z: it.pos[2], kind: 'beacon' });
    } else {
      if (this.facts.get('met_juno')) out.push({ x: this.npcs.juno.position.x, z: this.npcs.juno.position.z, kind: 'npc' });
      if (this.facts.get('hall_seen')) out.push({ x: this.observer.pos.x, z: this.observer.pos.z, kind: 'sentinel' });
      for (const t of STATION_TOKENS) if (!this.facts.get(`token_${t.token}`) && this.stationVisited.has(t.room)) out.push({ x: t.pos[0], z: t.pos[2], kind: 'token' });
    }
    return out;
  }

  stationMap() {
    const rooms = [], corridors = [];
    for (const [id, r] of Object.entries(STATION_ROOMS)) {
      r.bounds.forEach((b, i) => (i === 0 ? rooms.push({ id, rect: [b[0], b[2], b[3], b[5]], name: r.name }) : corridors.push([b[0], b[2], b[3], b[5]])));
    }
    return { rooms, corridors };
  }

  // --- world ----------------------------------------------------------------
  roomAt(p) {
    if (this.mode === 'deck') return this.deckWorld.roomAt(p, this.room);
    for (const [id, r] of Object.entries(STATION_ROOMS)) {
      for (const b of r.bounds) {
        if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) return id;
      }
    }
    return this.room;
  }

  enterRoom(id, place = false) {
    const r = this.level.rooms[id];
    this.room = id;
    this.player.floatY = r.floatY ?? 1.25;
    if (place) {
      this.player.setGravity(this.engine.gravity(id));
      this.player.place(r.spawn);
    }
    const emergency = this.emergency();
    this.lights.forEach((l, i) => {
      const d = r.lights[i];
      if (!d) return (l.intensity = 0);
      l.position.set(d[0], d[1], d[2]);
      l.color.setHex(d[3]).lerp(EMERGENCY, emergency * 1.3);
      l.intensity = d[4] * (this.mode === 'deck' ? 1.25 : 2.2);
      l.distance = d[5];
    });
    this.audio.setState(this.engine.state(id));
    if (this.mode === 'deck') {
      this.checkpoint = r.spawn;
      if (!this.campaign.visited.includes(id)) this.campaign.visited.push(id);
      this.minimap.markVisited(id);
      this.onDeckRoom(id);
    } else {
      if (!this.minimap.data || this.minimap.stationMode !== true) {
        this.minimap.setMap(this.stationMap(), [...this.stationVisited]);
        this.minimap.stationMode = true;
      }
      this.stationVisited.add(id);
      this.minimap.markVisited(id);
    }
    this.dirty = true;
  }

  onDeckRoom(id) {
    const r = this.level.rooms[id];
    const key = `entered_${id}`;
    if (this.deckWorld.flags[key]) return;
    this.deckWorld.flags[key] = true;
    if (this.campaign?.lv) return this.edition.roomEntered(id);
    if (!r.beat) return;
    const beat = this.deckBeat();
    const deck = this.story.decks[this.campaign.deck];
    if (beat.kind === 'contradiction') this.hud.say([{ who: 'TICK', text: 'A RECORD ON THE WALL. RECORDS HAVE ECHOES.' }], this.facts);
    else if (beat.kind === 'encounter' && this.story.forge) this.hud.say([this.story.ahead], this.facts);
    else if (beat.kind === 'encounter') this.hud.say([{ who: 'JUNO', text: `Someone's in there. Ren - be gentle. It might be ${this.story.cast[deck.crew].first}.` }], this.facts);
    else if (beat.kind === 'verdict') this.hud.say([{ who: 'JUNO', text: 'This is it. The chair. Check your log before you sit.' }], this.facts);
  }

  grantToken(t) {
    if (this.facts.get(`token_${t}`)) return;
    this.facts.set(`token_${t}`);
    this.audio.token();
    const tk = this.level.tokens.find((x) => x.token === t);
    if (tk) this.fx.burst(tk.pos, 0x2fae6a, 34, 2);
    this.hud.toast(`LAW TOKEN <b class="tok">${TOKENS[t].label}</b><br><small>${this.touch ? 'LAWS' : '[L]'} to rewrite the device</small>`);
    if (this.mode === 'deck') {
      const lines = {
        TIME: 'A NEW SUBJECT: TIME. TIME  FREEZES IN  (A STATE) STOPS EVERYTHING THAT SWEEPS.',
        LIGHT: 'A NEW SUBJECT: HARD LIGHT. THE GOLD OUTLINES CAN CARRY WEIGHT IF YOU TELL THEM TO.',
      };
      if (lines[t]) this.hud.say([{ who: 'TICK', text: lines[t] }], this.facts);
    } else if (!this.facts.get('first_token')) {
      this.facts.set('first_token');
      this.director.say('law_hint_first');
    }
  }

  // --- law combos: a named set of laws you switch to with one press -----------
  saveCombo(name) {
    this.combos = this.combos || [];
    const laws = this.engine.laws.slice(0, this.engine.unlocked).map((l) => (l ? { ...l } : null));
    if (!laws.some(Boolean)) return '<span class="err">NO LAWS RUNNING TO SAVE</span>';
    if (this.combos.length >= 8) return '<span class="err">EIGHT COMBOS IS THE LIMIT. DELETE ONE FIRST.</span>';
    const i = this.combos.findIndex((c) => c.name === name);
    if (i >= 0) this.combos[i] = { name, laws };
    else this.combos.push({ name, laws });
    this.comboIndex = i >= 0 ? i : this.combos.length - 1;
    this.dirty = true;
    this.audio.ui('press');
    return `COMBO ${name} SAVED`;
  }

  deleteCombo(i) {
    this.combos?.splice(i, 1);
    if (this.comboIndex === i) this.comboIndex = -1;
    else if (this.comboIndex > i) this.comboIndex--;
    this.dirty = true;
  }

  // installs every law of the combo; refuses if a token or slot is missing
  switchCombo(i) {
    const c = this.combos?.[i];
    if (!c) return '';
    for (const l of c.laws) {
      if (!l) continue;
      for (const t of [l.subject, l.verb, l.target]) if (!this.facts.get(`token_${t}`)) return `<span class="err">${c.name} NEEDS THE TOKEN ${TOKENS[t]?.label || t}</span>`;
    }
    if (c.laws.length > this.engine.unlocked) return `<span class="err">${c.name} NEEDS SLOT ${this.engine.unlocked + 1}, WHICH IS LOCKED</span>`;
    this.hud.lawsSelf = true;
    for (let k = 0; k < this.engine.unlocked; k++) this.engine.setLaw(k, c.laws[k] || null);
    this.hud.lawsSelf = false;
    this.hud.lawDraft = null;
    for (let k = 0; k < this.engine.unlocked; k++) this.onLawInstalled(k, c.laws[k] || null);
    this.comboIndex = i;
    this.audio.blip(660, 0.25, 'triangle', 0.1);
    return `COMBO ${c.name} RUNNING`;
  }

  // the X key / dock button: the next combo in the list
  nextCombo() {
    if (!this.facts.get('has_device')) return;
    if (!this.combos?.length) return this.hud.toast('<small>LAW COMBOS</small><br>No combos yet. In LAWS, save the running laws as a combo.', 2600);
    const i = ((this.comboIndex ?? -1) + 1) % this.combos.length;
    const msg = this.switchCombo(i);
    const c = this.combos[i];
    this.hud.toast(`<small>${/err/.test(msg) ? 'COMBO BLOCKED' : 'COMBO'}</small><br>${/err/.test(msg) ? msg.replace(/<[^>]+>/g, '') : `${c.name}: ${c.laws.map((l) => (l ? describeLaw(l) : 'empty')).join(' · ')}`}`, 2600);
    if (this.menu === 'laws') this.hud.renderLaws(this, msg);
  }

  onLawInstalled(i, law) {
    this.audio.blip(520, 0.2, 'square', 0.08);
    const isDefault = law && law.subject === 'GRAVITY' && law.verb === 'INVERTS' && law.target === 'INVERTED';
    if (law && !isDefault) this.facts.set('wrote_law');
    if (law && law.subject === 'HELD' && law.verb === 'PERSISTS' && (law.target === 'PHYSICAL' || law.target === 'ALL')) this.facts.set('wrote_held_law');
    this.dirty = true;
  }

  shift(to) {
    if (this.edition) return this.edition.shift(to);
    if (!this.facts.get('has_device')) return;
    if (this.engine.locked.has(this.room)) return this.audio.deny();
    const ok = to ? this.engine.setState(this.room, to) : this.engine.cycle(this.room);
    if (!ok) return;
    const s = this.engine.state(this.room);
    this.audio.sweep(s !== 'PHYSICAL');
    if (!this.settings.comfort) this.hud.flash(s === 'ECHO' ? 'rgba(80,240,255,0.35)' : s === 'INVERTED' ? 'rgba(255,90,180,0.35)' : 'rgba(255,255,255,0.3)');
  }

  caught(state) {
    if (this.catching) return;
    this.catching = true;
    this.observer.brain.recordCatch(state);
    this.facts.inc('times_caught');
    this.hud.fade(true);
    this.audio.caught();
    setTimeout(() => {
      this.held = null;
      this.observer.reset();
      this.enterRoom('hall', true);
      this.director.say('caught');
      this.hud.fade(false);
      this.catching = false;
    }, 1100);
  }

  // Deck setbacks are gentle: a short fade back to the last checkpoint.
  deckSetback(kind) {
    if (this.catching) return;
    this.catching = true;
    if (kind === 'caught') this.audio.caught();
    else this.audio.deny();
    this.hud.fade(true);
    setTimeout(() => {
      this.player.setGravity(this.engine.gravity(this.room));
      this.player.place(this.checkpoint);
      for (const s of this.deckWorld.sentinels) s.reset();
      this.hud.fade(false);
      this.catching = false;
      if (kind === 'caught' && !this.facts.get('sentinel_tip')) {
        this.facts.set('sentinel_tip');
        const learned = this.story?.after?.sentinels === 'learned';
        this.hud.say(this.edition ? [{ who: 'KAI', text: this.edition.line('caught') }] : [{ who: 'TICK', text: learned ? 'IT KNEW WHERE YOU WOULD BE. YOU TAUGHT IT THAT, IN THE HALL.' : 'IT ONLY WATCHES THE FLOOR. OR YOU COULD ASK IT TO HOLD STILL. POLITELY. WITH A LAW.' }], this.facts);
      }
    }, kind === 'caught' ? 700 : 350);
  }

  respawn(msg) {
    if (this.mode === 'deck') return this.deckSetback('fall');
    this.held = this.held === 'core' ? 'core' : null;
    this.player.place(STATION_ROOMS[this.room].spawn);
    if (msg) this.director.say(msg);
  }

  // Interaction candidates in front of the player.
  findFocus() {
    const eye = this.player.eye(new THREE.Vector3());
    const fwd = this.player.forward(new THREE.Vector3());
    const cands = [];
    if (this.mode === 'deck') cands.push(...this.deckWorld.focusCandidates(this));
    else {
      for (const i of interactables) {
        if (!i.r || !compileCondition(i.when)(this.world.ctx(i.room))) continue;
        cands.push({ id: i.id, pos: i.pos, r: i.r, prompt: i.prompt });
      }
      for (const it of STATION_ITEMS) {
        if (this.held === it.id || !this.world.isItemAvailable(it.id)) continue;
        cands.push({ id: `item:${it.id}`, pos: it.pos, r: 2.2, prompt: `TAKE ${it.label}` });
      }
      cands.push(...this.npcs.focusCandidates());
      if (this.facts.test('observer_tethered && brain_seen && !observer_faced')) {
        const o = this.observer.pos;
        cands.push({ id: 'observer', pos: [o.x, 2.4, o.z], r: 3.6, prompt: 'FACE IT' });
      }
    }
    let best = null, bs = -Infinity;
    const v = new THREE.Vector3();
    for (const c of cands) {
      v.set(...c.pos).sub(eye);
      const d = v.length();
      if (d > c.r) continue;
      const dot = v.normalize().dot(fwd);
      if (dot < 0.55 && d > 1.2) continue;
      const s = dot - d * 0.08;
      if (s > bs) (bs = s), (best = c);
    }
    return best;
  }

  use() {
    const f = this.focus;
    if (f && (f.id.startsWith('item:') || f.id.startsWith('ditem:'))) {
      if (f.id.startsWith('ditem:')) return this.useDeck(f);
      const id = f.id.slice(5);
      if (this.held && this.held !== id) {
        this.audio.deny();
        return this.hud.toast(`<small>HANDS FULL</small><br>You are carrying the ${this.held === 'core' ? 'power core' : this.held}.`, 2200);
      }
      this.held = id;
      this.audio.pickup();
      this.fx.burst(f.pos, 0xffd27a);
      if (id === 'key') this.facts.set('key_taken');
      return;
    }
    // Re-using whatever is talking (or nothing) skips the current line - except the armed
    // machine: "USE AGAIN TO ACTIVATE" means exactly that, even while the warning plays.
    const armedMachine = this.mode === 'station' && f?.id === 'machine' && this.director.armT > 0;
    if (armedMachine && this.hud.talking) this.hud.skipAll?.();
    else if (this.hud.talking && (!f || f.id === this.lastUse)) return this.hud.skipSub();
    if (!f) return;
    this.lastUse = f.id;
    if (this.mode === 'deck') return this.useDeck(f);
    if (f.id === 'npc:juno') {
      this.audio.greet('JUNO');
      const j = this.npcs.juno.position;
      this.talkWith = [j.x, j.y + 1.5, j.z];
      return this.npcs.talkToJuno();
    }
    if (f.id === 'custodian') this.talkWith = [0, 1.75, -20.5];
    if (['r0', 'r1', 'r2'].includes(f.id)) this.audio.terminal();
    this.director.use(f.id);
  }

  heldItem() {
    if (!this.held) return null;
    return this.level.items.find((i) => i.id === this.held) || null;
  }

  // --- save / load -------------------------------------------------------------
  snapshot() {
    const data = {
      v: VERSION,
      edition: EDITION || undefined,
      mode: this.mode,
      facts: this.facts.serialize(),
      engine: this.engine.serialize(),
      brain: this.observer.serialize(),
      room: this.room,
      log: this.log,
      timeline: this.timeline,
      playTime: this.playTime,
      settingsCamera: this.settings.camera,
      held: this.mode === 'station' ? this.held : undefined,
      combos: this.combos || [],
      comboIndex: this.comboIndex ?? -1,
    };
    if (this.mode === 'deck') {
      const p = this.checkpoint || this.level.rooms[this.room].spawn;
      data.campaign = { ...this.campaign, flags: { ...this.deckWorld.flags }, held: this.held, room: this.room, pos: p };
    }
    return data;
  }

  // "HALCYON · NEON MERIDIAN"; THE CRADLE is one zone of its own name, so just "THE CRADLE"
  zoneWhere() {
    const name = this.story.decks[this.campaign.deck].name, label = this.story.label || 'HALCYON';
    return label === name ? name : `${label} · ${name}`;
  }

  saveMeta() {
    if (this.mode === 'deck') {
      if (this.campaign.lv) return this.edition.saveMeta();
      const d = this.story.decks[this.campaign.deck];
      if (this.campaign.forge) return { where: `${this.story.title.toUpperCase()} · ACT ${this.campaign.deck + 1} · ${d.name}`, chapter: `${d.open ? 'District' : 'Sector'} ${this.campaign.sector + 1}/${d.sectors}` };
      if (this.campaign.zones) return { where: this.zoneWhere(), chapter: `District ${this.campaign.sector + 1}/${d.sectors}` };
      const told = this.story.title ? `${this.story.title.toUpperCase()} · ` : '';
      return { where: `${told}DECK ${this.campaign.deck + 1} · ${d.name}`, chapter: `Sector ${this.campaign.sector + 1}/4` };
    }
    return { where: 'STATION ZERO', chapter: STATION_ROOMS[this.room]?.name || '' };
  }

  saveTo(slot) {
    if (!this.started || !this.room) return;
    if (slot === 'auto' && this.slot !== null && this.slot !== undefined) slot = this.slot; // this game's own slot
    writeSave(slot, this.snapshot(), { ...this.saveMeta(), run: this.run || 'prologue' });
  }

  // kept for tools and old callers
  save() {
    this.saveTo('auto');
  }

  load(slot = 'auto') {
    const d = readSave(slot);
    if (!d) return false;
    try {
      this.restoring = true;
      this.facts.restore(d.facts);
      this.engine.restore(d.engine);
      this.observer.brain.restore(d.brain);
      this.log = d.log || [];
      this.timeline = d.timeline || [];
      this.playTime = d.playTime || 0;
      this.combos = d.combos || [];
      this.comboIndex = d.comboIndex ?? -1;
      this.hud.lawDraft = null;
      this.restoring = false;
      this.run = d.meta?.run || (d.campaign?.forge ? 'forge' : d.campaign?.zones ? (d.campaign.set === 'cradle' ? 'cradle' : 'halcyon') : d.mode === 'deck' ? 'vessel' : 'prologue');
      if (d.mode === 'deck' && d.campaign?.lv && this.edition) {
        this.edition.resume(d.campaign);
        return true;
      }
      if (d.mode === 'deck' && d.campaign?.forge) {
        this.startForge(d.campaign.seed, d.campaign);
        return true;
      }
      if (d.mode === 'deck' && d.campaign?.zones) {
        this.startZones(d.campaign);
        return true;
      }
      if (d.mode === 'deck' && d.campaign) {
        this.startVessel(d.campaign.seed, d.campaign);
        return true;
      }
      this.held = d.held || null;
      // quit between Varga's vault recording and the climb: the way up is still waiting
      if (this.facts.get('vault_seen') && !this.facts.get('zones_done')) {
        this.enterRoom('archive', true);
        this.enterHalcyon();
        return true;
      }
      this.enterRoom(d.room && d.room !== 'antechamber' ? d.room : this.facts.get('left_antechamber') ? 'lab' : 'antechamber', true);
      return true;
    } catch (e) {
      console.warn('Save unreadable', e);
      this.restoring = false;
      return false;
    }
  }

  // --- main loop --------------------------------------------------------------
  frame() {
    const raw = this.clock.getDelta();
    this.smart.sample(raw);
    const dt = Math.min(0.05, raw);
    this.time += dt;
    // plays the same held upright or sideways
    const active = !this.paused && !this.menu;

    for (let a of this.input.consumeActions()) {
      this.lastEvent = this.time;
      if (a === 'pause') {
        this.voice.stop();
        if (['saves', 'settings', 'hero', 'chapters', 'studio', 'forge'].includes(this.menu)) {
          this.player.cinema = null;
          this.back();
        }
        else if (this.menu === 'ending' || this.menu === 'decision' || this.menu === 'forgechoice') { /* choose; endings are final */ }
        else if (this.menu) this.closeMenu();
        else if (!this.paused) this.openMenu('pause');
        continue;
      }
      if (a === 'laws' && this.edition) a = 'journal'; // no law device in THE LAST VERSION: L opens the case board
      if (a === 'laws' || a === 'journal' || a === 'map') {
        if (this.menu === a) this.closeMenu();
        else if (!this.paused && (!this.menu || ['laws', 'journal', 'map'].includes(this.menu))) this.openMenu(a);
        continue;
      }
      if (a === 'quicksave' && !this.paused) {
        this.saveTo('auto');
        this.hud.toast('Quick saved.', 1400);
        continue;
      }
      if (a === 'quickload' && this.started) {
        this.begin('load', this.slot ?? 'auto'); // the slot quick save wrote
        continue;
      }
      if (a === 'camera') {
        this.cycleCamera();
        continue;
      }
      if (!active) continue;
      if (a === 'use') this.use();
      else if (a.startsWith('gear:')) this.useGear(+a.slice(5));
      else if (a === 'rules') this.toggleRules();
      else if (a === 'hint') (this.mode === 'deck' ? this.deckHint() : this.npcs.hint());
      else if (a === 'combo') (this.edition ? this.edition.echoStep() : this.nextCombo());
      else if (a === 'anchor') this.edition?.anchor();
      else if (a === 'shift') this.shift();
      // (the number keys pick by position: THE LAST VERSION's 1 2 3 4 are 2049, 2026, 2196, INVERTED)
      else if (a.startsWith('set:')) this.shift(this.edition ? String(['PHYSICAL', 'INVERTED', 'ECHO'].indexOf(a.slice(4)) + 1 || a.slice(4)) : a.slice(4));
    }
    const z = this.input.consumeZoom();
    if (z) this.zoomBy(z);
    if (this.input.zoomReset) {
      this.input.zoomReset = false;
      this.settings.zoom = 1;
      this.player.zoom = 1;
      this.zoomSaveT = 1;
    }
    this.updateHudMood();
    if (this.zoomSaveT > 0 && (this.zoomSaveT -= dt) <= 0) saveSettings(this.settings);

    if (active) this.step(dt);
    else this.input.consumeLook();
    if (!this.started && this.menu !== 'hero') {
      // title backdrop: drift slowly around the floating object
      const a = this.time * 0.06;
      this.player.cinema = { pos: { x: Math.sin(a) * 3.2, y: 2.2, z: 21.5 + Math.cos(a) * 3.2 }, target: { x: 0, y: 1.6, z: 21.5 }, up: { x: 0, y: 1, z: 0 } };
      this.player.model.visible = false;
    }
    if (this.menu === 'hero') {
      const p = this.player.pos;
      const a = 0.35 + Math.sin(this.time * 0.25) * 0.5;
      const f = new THREE.Vector3(this.player.H.x, 0, this.player.H.z);
      const yaw = Math.atan2(f.x, f.z) + a;
      // keep the showcase camera out of walls
      const head = new THREE.Vector3(p.x, p.y + 0.5, p.z);
      const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      this.player.colliders = this.mode === 'deck' ? this.deckWorld.colliders : this.world.colliders;
      const upright = window.innerHeight > window.innerWidth;
      const want = upright ? 3.6 : 2.8;
      const r = Math.max(1.2, Math.min(want, this.player.rayDistance(head, dir, want) - 0.25));
      const c = { x: p.x + dir.x * r, y: p.y + (upright ? 0.2 : 0.45), z: p.z + dir.z * r };
      // frame the character clear of the menu: right of the side rail, or
      // above the bottom sheet when the phone is upright
      const dx = p.x - c.x, dz = p.z - c.z, dl = Math.hypot(dx, dz) || 1;
      const rx = -dz / dl, rz = dx / dl;
      const off = upright ? 0 : -0.55 * (r / 2.8);
      const ty = upright ? p.y - 0.85 : p.y + 0.15;
      this.player.cinema = { pos: c, target: { x: p.x + rx * off, y: ty, z: p.z + rz * off }, up: { x: 0, y: 1, z: 0 } };
      this.player.model.visible = true;
      this.player.grounded = true; // stand for the portrait, even in a weightless room
    }

    this.updateWorlds(active ? dt : 0, dt);
    this.player.updateCamera(dt);
    if (active) this.placeFocus();
    this.updateTheme(dt);
    if (this.settings.minimap && this.started && !this.menu && ++this.frameN % 3 === 0) this.minimap.drawMini(this.player, this.room, this.mapMarkers());
    this.postfx.render();
  }

  // The HUD steps back while you play and comes forward when something happens.
  updateHudMood() {
    if ((this.input.lastActivity || 0) > (this.lastActivitySeen || 0)) {
      this.lastActivitySeen = this.input.lastActivity;
      this.lastEvent = this.time;
    }
    const calm = this.started && !this.menu && !this.hud.talking && this.time - this.lastEvent > 4;
    document.body.classList.toggle('calm', calm);
    document.body.classList.toggle('talking', !!this.player.talkTarget);
    const dock = this.dockEls || (this.dockEls = {
      laws: document.querySelector('#dock .laws'), hint: document.querySelector('#dock .hint'), combo: document.querySelector('#dock .combo'), comboTouch: document.querySelector('#buttons .combo'),
    });
    dock.laws?.classList.toggle('off', !this.facts.get('has_device'));
    const noCombo = this.edition ? !this.facts.get('echo_step') : !this.facts.get('has_device') || !this.combos?.length;
    dock.combo?.classList.toggle('off', noCombo);
    dock.comboTouch?.classList.toggle('off', noCombo);
    dock.hint?.classList.toggle('off', !this.facts.get('has_tick'));
    dock.hint?.classList.toggle('ready', this.mode === 'deck' || !!this.facts.get('has_tick'));
    // WORLD FORGE: the four gear slots show their cooldown, and whether the local rules allow them
    if (this.campaign?.forge && this.story?.forge) {
      const act = this.forgeAct();
      dock.gear = dock.gear || [...document.querySelectorAll('[data-act^="gear:"]')];
      for (const b of dock.gear) {
        const key = this.forge.gear[+b.dataset.act.slice(5)];
        if (!key) continue;
        const rule = act.gearAllowed[key];
        const left = Math.max(0, (this.gearCd[key] || 0) - this.time);
        b.classList.toggle('no', !rule.ok);
        b.classList.toggle('cooling', left > 0);
        b.classList.toggle('spent', !!GEAR[key].once && !!this.deckWorld.flags[`gear_KEYFORGE_${act.index}`]);
        b.classList.toggle('on', (key === 'FLARE' && this.flareT > 0) || (key === 'LENS' && this.deckWorld.lensT > 0) || ((key === 'GRAPPLE' || key === 'RIG') && this.deckWorld.temps.length > 0));
        const cd = (left / GEAR[key].cooldown || 0).toFixed(2);
        if (b._cd !== cd) {
          b._cd = cd;
          b.style.setProperty('--cd', cd);
        }
      }
    }
  }

  updateWorlds(simDt, dt) {
    this.runTimers();
    this.fx.update(dt);
    this.bolt = this.weather.update(dt, this.time, this.player.pos);
    for (const t of WATER_NORMALS) { t.offset.x += dt * 0.012; t.offset.y += dt * 0.007; } // water moves
    this.world.update(dt, this.time, this.held);
    this.npcs.update(simDt, this.time);
    this.hud.update(simDt);
  }

  step(dt) {
    const { player, engine, facts } = this;
    this.playTime += dt;
    const look = this.input.consumeLook();
    player.look(look.dx, look.dy);
    const input = this.input.poll();
    if (this.catching) {
      input.forward = input.strafe = 0;
      input.jump = false;
    }
    const colliders = this.mode === 'deck' ? this.deckWorld.colliders : this.world.colliders;
    player.setGravity(engine.gravity(this.room));
    if (input.jump && player.grounded) this.audio.jump();
    const wasGrounded = player.grounded, vy = Math.abs(player.vel.y);
    player.update(dt, input, colliders);
    if (!wasGrounded && player.grounded && vy > 5) this.audio.land();
    // conversations: frame whoever is talking to you
    if (!this.hud.talking) this.talkWith = null;
    player.talkTarget = this.talkWith && !this.settings.comfort ? this.talkWith : null;

    const r = this.roomAt(player.pos);
    if (r !== this.room) this.enterRoom(r);
    const room = this.level.rooms[this.room];

    // falling out of the world
    const killY = room.killY;
    if ((killY !== undefined && player.pos.y < killY) || player.pos.y < -14 || player.pos.y > 30) {
      this.respawn(this.room === 'archive' ? 'archive_fall' : null);
    }

    if (this.mode === 'deck') this.stepDeck(dt);
    else this.stepStation(dt);

    // tokens: walk into them
    for (const tk of this.level.tokens) {
      if (facts.get(`token_${tk.token}`)) continue;
      const d = Math.hypot(player.pos.x - tk.pos[0], player.pos.y - tk.pos[1], player.pos.z - tk.pos[2]);
      if (d < 2.4) this.grantToken(tk.token);
    }

    // echo matter dissolves unless a law says it persists (or, in THE LAST VERSION, an anchor holds it)
    const held = this.heldItem();
    if (held && held.echo) {
      const s = engine.state(this.room);
      if (s !== engine.residue && !engine.has('heldPersists', s)) {
        this.held = null;
        if (this.edition) this.hud.say([{ who: 'KAI', text: this.edition.line('key_dissolve') }], this.facts);
        else if (this.mode === 'deck') this.hud.say([{ who: 'TICK', text: 'THE KEY WAS A MEMORY. IT STAYED BEHIND IN ECHO. A LAW COULD LET YOU KEEP IT.' }], this.facts);
        else {
          facts.set('key_dissolved');
          this.director.say('key_dissolves');
        }
      }
    }

    // soft footsteps
    if (player.grounded) {
      this.stepDist = (this.stepDist || 0) + player.speed * dt;
      if (this.stepDist > (player.running ? 2.2 : 1.7)) { this.stepDist = 0; this.audio.footstep(); }
    }
    this.audio.setDuck(this.hud.talking);

    this.focus = this.findFocus();
    const showFocus = this.focus && !this.hud.talking;
    this.hud.prompt(showFocus ? this.focus.prompt : '');
    this.promptPos = showFocus ? this.focus.pos : null; // placed by placeFocus, after the camera moves
    const it = this.heldItem();
    this.hud.held(it?.label, it?.echo);
    if (this.edition) this.hud.setState(!!facts.get('has_chronolith'), this.room, engine.state(this.room), room.name, engine.locked.has(this.room), engine.statesOf(this.room));
    else this.hud.setState(!!facts.get('has_device'), this.room, engine.state(this.room), room.name, engine.locked.has(this.room));

    const kind = it ? it.kind || it.id : null;
    for (const [id, m] of Object.entries(this.heldModels)) {
      m.visible = kind === id;
      m.rotation.y = this.time;
    }
    this.device.visible = !!facts.get('has_device');

    this.saveT = (this.saveT || 0) - dt;
    if (this.dirty && this.saveT <= 0) {
      this.saveTo('auto');
      this.dirty = false;
      this.saveT = 3;
    }
  }

  // The prompt floats over the thing you can use (tap it on touch screens),
  // and a soft ring marks it in the world. Placed after the camera has moved
  // for this frame, so neither trails the object by a frame when you look around.
  placeFocus() {
    this.camera.updateMatrixWorld();
    this.placePrompt(this.promptPos ?? null);
  }

  placePrompt(pos) {
    this.fx.focus(pos, 0xffffff, this.time, this.camera);
    if (!pos) return;
    const v = new THREE.Vector3(pos[0], pos[1] + 0.55, pos[2]).project(this.camera);
    const el = this.hud.el.prompt;
    if (v.z > 1) {
      el.classList.remove('on');
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    // whole pixels, written only when they change (each write costs a layout)
    const x = Math.round(THREE.MathUtils.clamp((v.x * 0.5 + 0.5) * w, 90, w - 90));
    const y = Math.round(THREE.MathUtils.clamp((-v.y * 0.5 + 0.5) * h, 120, h - 140));
    if (x === this._promptX && y === this._promptY) return;
    this._promptX = x;
    this._promptY = y;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  stepStation(dt) {
    const { player, engine, facts } = this;
    for (const t of triggers) {
      if (t.room !== this.room) continue;
      const b = t.box, p = player.pos;
      if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) {
        for (const [k, v] of Object.entries(t.set)) if (facts.get(k) !== v) facts.set(k, v);
      }
    }
    // Observer
    const inHall = this.room === 'hall';
    this.observer.update(dt, this.time, {
      player,
      inHall: inHall && !this.catching,
      roomState: engine.state('hall'),
      frozenByLaw: engine.hasIn('observerFrozen', 'hall'),
      tethered: facts.get('observer_tethered'),
      playerHidden: player.onCeiling() && player.pos.y > 4,
    });
    if (this.observer.mode === 'chase' && this.lastObserverMode !== 'chase') this.audio.alert();
    this.lastObserverMode = this.observer.mode;
    const od = player.pos.distanceTo(this.observer.pos);
    const threat = inHall && !facts.get('observer_tethered') ? Math.max(this.observer.suspicion, Math.max(0, 1 - od / 14) * 0.4) : 0;
    this.audio.setThreat(threat);
    this.hud.eye(this.observer.suspicion, inHall && !facts.get('observer_tethered'));
    this.director.update(dt);
  }

  stepDeck(dt) {
    const { player } = this;
    const lv = this.level;
    const p = player.pos;
    const inBox = (b) => p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5];
    if (player.grounded || player.gravity === 0) {
      for (const cp of lv.checkpoints) if (cp.room === this.room && inBox(cp.box)) this.checkpoint = cp.spawn;
    }
    if (lv.exit && inBox(lv.exit.box)) this.completeSector();
    const ev = this.deckWorld.update(dt, this.time, this);
    if (ev && !this.catching) this.deckSetback(ev);
    // threat music + the watcher meter follow the nearest sentinel
    let sus = 0, near = false;
    for (const s of this.deckWorld.sentinels) {
      if (s.def.room !== this.room) continue;
      near = true;
      sus = Math.max(sus, s.mode === 'chase' ? 1 : s.suspicion);
      if (s.mode === 'chase' && !s.alerted) {
        s.alerted = true;
        this.audio.alert();
      } else if (s.mode !== 'chase') s.alerted = false;
    }
    let threat = near ? Math.max(0.15, sus) : this.deckWorld.hazards.some((h) => h.hz.room === this.room) ? 0.3 : 0;
    if (this.campaign.forge) {
      threat = Math.max(threat, GENRES[this.forge.genre].threat); // the genre sets the floor of the music's tension
      if (this.flareT > 0) this.flareT -= dt;
    }
    this.audio.setThreat(threat);
    this.hud.eye(sus, near);
    if (this.campaign?.lv) this.edition.step(dt);
    this.updateDeckObjective();
  }

  // Deterministic fixed-step simulation without rendering. Used by the
  // automated playtest (tests/smoke.mjs) and handy for AI-driven QA bots.
  simulate(sec, dt = 1 / 30) {
    for (let t = 0; t < sec; t += dt) {
      this.time += dt;
      this.step(dt);
      this.updateWorlds(dt, dt);
    }
    this.player.updateCamera(1);
    this.placeFocus();
  }

  // Frame-exact capture for trailers: stop the real-time loop, then advance
  // and render one frame at a time (tools/record-videos.mjs).
  captureMode() {
    this.renderer.setAnimationLoop(null);
    this.capturing = true;
  }

  tickFrame(dt, noRender = false) {
    this.time += dt;
    this.updateHudMood();
    const active = !this.paused && !this.menu;
    if (active) this.step(dt);
    this.updateWorlds(dt, dt);
    this.player.updateCamera(dt);
    if (active) this.placeFocus();
    if (noRender) return;
    this.updateTheme(dt);
    if (this.settings.minimap && this.started) this.minimap.drawMini(this.player, this.room, this.mapMarkers());
    this.postfx.render();
  }

  // the nearest street lamps and lit shopfronts become real lights (every 0.25 s)
  updateLamps(dt) {
    const glows = this.mode === 'deck' && this.deckWorld.glows?.length && this.deckWorld.glows;
    this.lampT = (this.lampT || 0) - dt;
    if (this.lampT <= 0) {
      this.lampT = 0.25;
      const p = this.player.pos;
      const near = glows ? glows.filter((g) => g[5] || g[3] >= 3)
        .map((g) => ({ g, d: (g[0] - p.x) ** 2 + (g[2] - p.z) ** 2 }))
        .filter((o) => o.d < 18 * 18).sort((a, b) => a.d - b.d) : [];
      this.lampLights.forEach((l, i) => {
        const o = near[i];
        if (!o) return (l.userData.want = 0);
        const [x, , z, , c, h] = o.g;
        if (l.userData.at !== o.g) {
          l.userData.at = o.g;
          l.intensity = 0;
          l.position.set(x, h ? h - 0.35 : 2.4, z);
          l.color.setHex(h ? 0xffd2a0 : c);
          l.distance = h ? 11 : 7;
        }
        l.userData.want = h ? 14 : 6;
      });
    }
    const k = Math.min(1, dt * 4);
    for (const l of this.lampLights) l.intensity += (l.userData.want - l.intensity) * k;
  }

  // how much the vessel runs on emergency light (after SEVERED; districts have their own night)
  emergency() {
    if (this.mode !== 'deck' || !this.level?.palette) return 0;
    if (this.level.forge || this.level.palette.emergency !== undefined) return (this.level.palette.emergency || 0) * (1 - this.flare()); // WORLD FORGE's EMERGENCY light (a flare lifts it); THE LAST VERSION's Helix
    return this.level.palette.night === undefined ? this.story?.after?.dark || 0 : 0;
  }

  // how much a signal flare is lighting the act right now (0..1)
  flare() {
    return this.flareT > 0 ? Math.min(1, this.flareT / 2) * 0.85 : 0;
  }

  updateTheme(dt) {
    this.updateLamps(dt);
    const s = this.room ? this.engine.state(this.room) : this.engine.baseline;
    const th = THEMES[s] || THEMES.PHYSICAL;
    this.edition?.theme(dt, s);
    const k = Math.min(1, dt * 3);
    const deck = this.mode === 'deck';
    const pal = deck ? this.level.palette : null;
    const room = this.level.rooms[this.room || 'antechamber'] || STATION_ROOMS.antechamber;
    const tint = _tint.set(room.tint);
    // each place has its own air: a deck's palette, or a Station Zero room's own fog
    const fog = _fog.set(th.fog);
    if (deck) fog.lerp(_c.set(pal.fog), 1 - (this.edition?.stateFog?.(s) ?? (s === this.engine.baseline ? 0.1 : 0.55)) * (1 - (pal.night || 0) * 0.6));
    else if (room.fog !== undefined) fog.lerp(_c.set(room.fog), s === 'PHYSICAL' ? 0.85 : 0.5);
    this.scene.fog.color.lerp(fog, k);
    this.scene.background.copy(this.scene.fog.color);
    this.scene.fog.density += ((deck ? th.density * 0.3 * (pal.density ?? 1) * (this.edition?.stateDensity?.(s) ?? 1) : th.density * 0.45 * (room.density ?? 1)) - this.scene.fog.density) * k;
    const emergency = this.emergency();
    this.hemi.color.lerp(_c.set(th.sky).lerp(tint, 0.25).lerp(EMERGENCY, emergency), k);
    _c.set(th.ground);
    if (pal?.look) _c.lerp(_c2.set(pal.fog), 0.5);
    this.hemi.groundColor.lerp(_c, k);
    let night = (deck ? pal.night || { horror: 0.55, thriller: 0.3 }[this.story?.mood] || this.story?.after?.dark || 0 : room.night || 0) * (1 - this.flare());
    if (deck && this.edition?.stateNight) night = this.edition.stateNight(s, night); // THE LAST VERSION: each year has its own hour
    const env = (this.scene.environment ? 0.85 : 1) * (deck ? 0.72 : 1) * (1 - night * 0.55);
    // a sky photo lights the district: the probe takes over most of the flat hemisphere fill
    // (indoor decks only borrow the sky for reflections)
    const probe = deck && pal.probe !== false ? this.postfx.probe() : null;
    if (probe && this.skyLight.userData.sh !== probe) {
      this.skyLight.sh.copy(probe);
      this.skyLight.userData.sh = probe;
    }
    const skyAmt = probe ? 1 : 0;
    this.skyLight.intensity += (skyAmt * (1 - night * 0.35) * 1.1 - this.skyLight.intensity) * k;
    this.hemi.intensity += (th.hemi * env * (1 - skyAmt * 0.55) - this.hemi.intensity) * k;
    if (this.bolt) this.hemi.intensity = th.hemi * env + this.bolt * 2.2;
    this.sun.color.lerp(_c.set(th.sunColor), k);
    this.sun.intensity += (th.sun * (deck ? 0.8 : 1) * (1 - night * 0.7) - this.sun.intensity) * k;
    this.renderer.toneMappingExposure += ((deck ? 0.9 + night * 0.15 - emergency * 0.5 : 0.95 + night * 0.1) - this.renderer.toneMappingExposure) * k;
    const p = this.player.pos;
    this.sun.position.set(p.x + 6, p.y + 24, p.z + 9);
    this.sun.target.position.set(p.x, p.y, p.z);
    const dc = this.device.userData;
    dc.shell.material.color.lerp(_c.set(th.device), k);
    dc.shell.rotation.y += dt * 1.5;
    dc.shell.rotation.x += dt * 0.6;
    // When the machine runs, the lab breathes amber.
    if (this.mode === 'station' && this.facts.get('machine_activated') && this.room === 'lab') {
      this.lights[0].color.setRGB(1, 0.85 + Math.sin(this.time * 2.4) * 0.08, 0.7);
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // your look and Juno load first; the crew follow in the background.
  // The procedural cast stands in if the models can't load.
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(`${NS}settings.v1`) || 'null')?.hero;
  } catch {
    /* no storage */
  }
  if (!saved && EDITION === 'lastversion') saved = { id: 'real_m' }; // Kai
  const first = [...new Set(EDITION === 'lastversion' ? ['rb_ren_m', lookOf(saved).model, 'rb_doctor_f'] : ['rb_ren_f', 'rb_juno', lookOf(saved).model])];
  // wait for them (slow connections included) and say what's happening
  const ver = document.querySelector('#title .ver');
  const verText = ver?.textContent;
  if (ver) ver.textContent = 'Loading characters…';
  const ok = await Promise.race([loadActors(first), new Promise((r) => setTimeout(() => r(false), 90000))]);
  if (ver) ver.textContent = ok ? verText : `Characters could not load (${loadErrors[0] || 'timed out'})`;
  // the realistic crew next, in the background. The older stylised looks are not
  // preloaded: each one costs a long main-thread block when it arrives, so a look
  // loads only when it is picked on the character screen (pickHero fetches it and
  // retries), and the stylised crew load only as the fallback if the realistic crew
  // could not load.
  const rest = Object.keys(MODELS).filter((k) => !first.includes(k));
  loadActors(rest.filter((k) => k.startsWith('rb_'))).then((ok) => ok || loadActors(rest.filter((k) => /^[wm]_/.test(k))));
  try {
    window.AZ = new Game();
    window.AZSynth = Synth;
  } catch (e) {
    document.querySelector('#title .body').innerHTML = `<p class="err">This device could not start WebGL.<br><small>${e.message}</small></p>`;
    throw e;
  }
});
