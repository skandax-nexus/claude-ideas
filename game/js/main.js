// AFTERZERO - game bootstrap and main loop.
import * as THREE from '../vendor/three.module.min.js';
import { FactStore } from './core/FactStore.js';
import { RealityEngine } from './core/RealityEngine.js';
import { Objectives } from './core/Objectives.js';
import { TOKENS, DEFAULT_LAWS } from './core/Laws.js';
import { compileCondition } from './core/conditions.js';
import { World } from './world/World.js';
import { Director } from './world/Director.js';
import { rooms, interactables, items, tokens, triggers } from './world/maps.js';
import { rules, objectiveLayers, endings, discoveries } from './world/story.js';
import { Player } from './entities/Player.js';
import { Observer } from './entities/Observer.js';
import { Input } from './ui/Input.js';
import { HUD } from './ui/HUD.js';
import { Synth } from './audio/Synth.js';
import { makeDevice, makeKeyItem, makeCoreItem } from './world/models.js';

const SAVE_KEY = 'afterzero.save.v1';
const VERSION = '0.1.0';

const THEMES = {
  PHYSICAL: { fog: 0x0a0e14, sky: 0xbcd0e0, ground: 0x3a3430, hemi: 1.35, density: 0.03, device: 0xe8f4ff },
  INVERTED: { fog: 0x180812, sky: 0xff9ac0, ground: 0x4a1828, hemi: 1.2, density: 0.034, device: 0xff5ab4 },
  ECHO: { fog: 0x02161c, sky: 0x60e8ff, ground: 0x003038, hemi: 0.7, density: 0.045, device: 0x4ff0ff },
};

function storage(fn, fallback = null) {
  try {
    return fn(window.localStorage);
  } catch {
    return fallback;
  }
}

class Game {
  constructor() {
    this.canvas = document.querySelector('#game');
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.touch ? 1.25 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0e14, 0.03);
    this.scene.background = new THREE.Color(0x05070a);
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 600);
    this.scene.add(this.camera);

    this.hemi = new THREE.HemisphereLight(0xbcd0e0, 0x2a2622, 1.0);
    this.scene.add(this.hemi);
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
    this.player = new Player(this.camera);
    this.observer = new Observer(this.scene);
    this.director = new Director(this);
    this.wire();
    this.buildViewModels();

    this.room = null;
    this.held = null;
    this.paused = true;
    this.menu = null;
    this.time = 0;
    this.playTime = 0;
    this.catching = false;
    this.focus = null;

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.setupMenus();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  newState() {
    this.facts = new FactStore();
    this.engine = new RealityEngine({ slots: 3, unlocked: 2, laws: DEFAULT_LAWS });
    this.engine.lock('antechamber');
    this.objectives = new Objectives(objectiveLayers, this.facts);
    this.log = [];
    this.timeline = [];
  }

  // Connect systems: any change in facts, room states or laws re-derives the world.
  wire() {
    const { facts, engine } = this;
    facts.onEffect = (e) => {
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
      this.objectives.update();
      this.dirty = true;
    });
    facts.addRules(rules);
    engine.on('shift', (e) => {
      this.world.refresh();
      if (e.room === this.room) this.audio.setState(e.to);
      this.dirty = true;
    });
    engine.on('laws', () => {
      this.world.refresh();
      this.dirty = true;
    });
    this.objectives.onChange = (layer) => {
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

  buildViewModels() {
    this.device = makeDevice();
    this.device.position.set(-0.3, -0.24, -0.55);
    this.camera.add(this.device);
    this.heldModels = { key: makeKeyItem(true), core: makeCoreItem() };
    for (const m of Object.values(this.heldModels)) {
      m.position.set(0.3, -0.26, -0.6);
      m.scale.setScalar(0.6);
      m.visible = false;
      this.camera.add(m);
    }
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 85 : 72;
    this.camera.updateProjectionMatrix();
  }

  // --- menus ------------------------------------------------------------
  setupMenus() {
    const $ = (s) => document.querySelector(s);
    const hasSave = storage((s) => !!s.getItem(SAVE_KEY), false);
    $('#continue').style.display = hasSave ? '' : 'none';
    $('#begin').onclick = () => this.begin(false);
    $('#continue').onclick = () => this.begin(true);
    for (const b of document.querySelectorAll('[data-close]')) b.onclick = () => this.closeMenu();
    $('#resume').onclick = () => this.closeMenu();
    $('#restart').onclick = () => {
      storage((s) => s.removeItem(SAVE_KEY));
      location.reload();
    };
    $('#mute').onclick = () => this.audio.toggleMute();
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && !this.paused && !this.menu && !this.touch) this.openMenu('pause');
    });
    this.hud.show('title');
  }

  begin(cont) {
    this.audio.start();
    if (cont && this.load()) this.hud.toast('Memory restored.');
    else {
      storage((s) => s.removeItem(SAVE_KEY));
      this.enterRoom('antechamber', true);
    }
    this.paused = false;
    this.hud.show(null);
    this.world.refresh();
    this.objectives.update(true);
    this.hud.objective(this.objectives.text, false);
    if (this.touch) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      screen.orientation?.lock?.('landscape').catch(() => {});
    } else this.canvas.requestPointerLock?.();
  }

  openMenu(id) {
    if (id === 'laws' && !this.facts.get('has_device')) return;
    this.menu = id;
    this.input.release();
    if (id === 'laws') {
      this.hud.lawDraft = null;
      this.hud.renderLaws(this);
    }
    if (id === 'journal') this.hud.renderJournal(this);
    this.hud.show(id);
  }

  closeMenu() {
    this.menu = null;
    this.hud.show(null);
    if (!this.touch) this.canvas.requestPointerLock?.();
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
      <h3>THREE QUESTIONS</h3>
      <label>What do you think happened?<textarea id="q1"></textarea></label>
      <label>What do you want to investigate next?<textarea id="q2"></textarea></label>
      <label>Would you voluntarily play another 20 minutes?
        <span class="yn"><button data-yn="yes">YES</button><button data-yn="maybe">MAYBE</button><button data-yn="no">NO</button></span></label>
      <button class="big" id="copyReport">COPY PLAYTEST REPORT</button>
      <button id="again">PLAY AGAIN</button>`;
    let yn = '';
    for (const b of document.querySelectorAll('[data-yn]')) b.onclick = () => {
      yn = b.dataset.yn;
      document.querySelectorAll('[data-yn]').forEach((x) => x.classList.toggle('sel', x === b));
    };
    $('#copyReport').onclick = () => {
      const full = { ...report, answers: { happened: $('#q1').value, next: $('#q2').value, another20: yn } };
      const txt = JSON.stringify(full, null, 2);
      storage((s) => s.setItem('afterzero.report', txt));
      navigator.clipboard?.writeText(txt).then(() => this.hud.toast('Report copied.'), () => {});
      $('#copyReport').textContent = 'COPIED';
    };
    $('#again').onclick = () => {
      storage((s) => s.removeItem(SAVE_KEY));
      location.reload();
    };
    this.save();
    this.openMenu('ending');
  }

  // --- world ----------------------------------------------------------------
  roomAt(p) {
    for (const [id, r] of Object.entries(rooms)) {
      for (const b of r.bounds) {
        if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) return id;
      }
    }
    return this.room;
  }

  enterRoom(id, place = false) {
    const r = rooms[id];
    this.room = id;
    if (place) {
      this.player.setGravity(this.engine.gravity(id));
      this.player.place(r.spawn);
    }
    this.lights.forEach((l, i) => {
      const d = r.lights[i];
      if (!d) return (l.intensity = 0);
      l.position.set(d[0], d[1], d[2]);
      l.color.setHex(d[3]);
      l.intensity = d[4] * 4;
      l.distance = d[5];
    });
    this.audio.setState(this.engine.state(id));
    this.dirty = true;
  }

  grantToken(t) {
    if (this.facts.get(`token_${t}`)) return;
    this.facts.set(`token_${t}`);
    this.audio.chime();
    this.hud.toast(`LAW TOKEN <b class="tok">${TOKENS[t].label}</b><br><small>${this.touch ? 'LAWS' : '[L]'} to rewrite the device</small>`);
    if (!this.facts.get('first_token')) {
      this.facts.set('first_token');
      this.director.say('law_hint_first');
    }
  }

  onLawInstalled(i, law) {
    this.audio.blip(520, 0.2, 'square', 0.08);
    const isDefault = law && law.subject === 'GRAVITY' && law.verb === 'INVERTS' && law.target === 'INVERTED';
    if (law && !isDefault) this.facts.set('wrote_law');
    this.dirty = true;
  }

  shift(to) {
    if (!this.facts.get('has_device')) return;
    if (this.engine.locked.has(this.room)) return this.audio.deny();
    const ok = to ? this.engine.setState(this.room, to) : this.engine.cycle(this.room);
    if (!ok) return;
    const s = this.engine.state(this.room);
    this.audio.sweep(s !== 'PHYSICAL');
    this.hud.flash(s === 'ECHO' ? 'rgba(80,240,255,0.35)' : s === 'INVERTED' ? 'rgba(255,90,180,0.35)' : 'rgba(255,255,255,0.3)');
  }

  caught(state) {
    if (this.catching) return;
    this.catching = true;
    this.observer.brain.recordCatch(state);
    this.facts.inc('times_caught');
    this.hud.fade(true);
    this.audio.blip(70, 0.8, 'sawtooth', 0.3);
    setTimeout(() => {
      this.held = null;
      this.observer.reset();
      this.enterRoom('hall', true);
      this.director.say('caught');
      this.hud.fade(false);
      this.catching = false;
    }, 1100);
  }

  respawn(msg) {
    this.held = this.held === 'core' ? 'core' : null;
    this.player.place(rooms[this.room].spawn);
    if (msg) this.director.say(msg);
  }

  // Interaction candidates in front of the player.
  findFocus() {
    const eye = this.player.eye(new THREE.Vector3());
    const fwd = this.player.forward(new THREE.Vector3());
    const cands = [];
    for (const i of interactables) {
      if (!i.r || !compileCondition(i.when)(this.world.ctx(i.room))) continue;
      cands.push({ id: i.id, pos: i.pos, r: i.r, prompt: i.prompt });
    }
    for (const it of items) {
      if (this.held === it.id || !this.world.isItemAvailable(it.id)) continue;
      cands.push({ id: `item:${it.id}`, pos: it.pos, r: 2.2, prompt: `TAKE ${it.label}` });
    }
    if (this.facts.test('observer_tethered && brain_seen && !observer_faced')) {
      const o = this.observer.pos;
      cands.push({ id: 'observer', pos: [o.x, 2.4, o.z], r: 3.6, prompt: 'FACE IT' });
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
    if (f && f.id.startsWith('item:')) {
      const id = f.id.slice(5);
      this.held = id;
      this.audio.blip(880, 0.12);
      if (id === 'key') this.facts.set('key_taken');
      return;
    }
    // Re-using whatever is talking (or nothing) skips the current line.
    if (this.hud.talking && (!f || f.id === this.lastUse)) return this.hud.skipSub();
    if (!f) return;
    this.lastUse = f.id;
    this.director.use(f.id);
  }

  // --- save / load -------------------------------------------------------------
  save() {
    const data = {
      v: VERSION,
      facts: this.facts.serialize(),
      engine: this.engine.serialize(),
      brain: this.observer.serialize(),
      room: this.room,
      log: this.log,
      timeline: this.timeline,
      playTime: this.playTime,
    };
    storage((s) => s.setItem(SAVE_KEY, JSON.stringify(data)));
  }

  load() {
    const raw = storage((s) => s.getItem(SAVE_KEY));
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      this.restoring = true;
      this.facts.restore(d.facts);
      this.engine.restore(d.engine);
      this.observer.brain.restore(d.brain);
      this.log = d.log || [];
      this.timeline = d.timeline || [];
      this.playTime = d.playTime || 0;
      this.restoring = false;
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
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    const active = !this.paused && !this.menu;

    for (const a of this.input.consumeActions()) {
      if (a === 'pause') {
        if (this.menu) this.closeMenu();
        else if (!this.paused) this.openMenu('pause');
        continue;
      }
      if (a === 'laws' || a === 'journal') {
        if (this.menu === a) this.closeMenu();
        else if (!this.paused && (!this.menu || this.menu === 'laws' || this.menu === 'journal')) this.openMenu(a);
        continue;
      }
      if (!active) continue;
      if (a === 'use') this.use();
      else if (a === 'shift') this.shift();
      else if (a.startsWith('set:')) this.shift(a.slice(4));
    }

    if (active) this.step(dt);
    else this.input.consumeLook();

    this.world.update(dt, this.time, this.held);
    this.hud.update(active ? dt : 0);
    this.player.updateCamera();
    this.updateTheme(dt);
    this.renderer.render(this.scene, this.camera);
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
    player.setGravity(engine.gravity(this.room));
    player.update(dt, input, this.world.colliders);

    const r = this.roomAt(player.pos);
    if (r !== this.room) this.enterRoom(r);

    // falling out of the world
    const killY = rooms[this.room].killY;
    if ((killY !== undefined && player.pos.y < killY) || player.pos.y < -14 || player.pos.y > 16) {
      this.respawn(this.room === 'archive' ? 'archive_fall' : null);
    }

    for (const t of triggers) {
      if (t.room !== this.room) continue;
      const b = t.box, p = player.pos;
      if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) {
        for (const [k, v] of Object.entries(t.set)) if (facts.get(k) !== v) facts.set(k, v);
      }
    }

    // tokens: walk into them
    for (const tk of tokens) {
      if (facts.get(`token_${tk.token}`)) continue;
      const d = Math.hypot(player.pos.x - tk.pos[0], player.pos.y - tk.pos[1], player.pos.z - tk.pos[2]);
      if (d < 1.3) this.grantToken(tk.token);
    }

    // echo matter dissolves unless a law says it persists
    if (this.held) {
      const it = items.find((i) => i.id === this.held);
      const s = engine.state(this.room);
      if (it.echo && s !== 'ECHO' && !engine.has('heldPersists', s)) {
        this.held = null;
        facts.set('key_dissolved');
        this.director.say('key_dissolves');
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
    const od = player.pos.distanceTo(this.observer.pos);
    const threat = inHall && !facts.get('observer_tethered') ? Math.max(this.observer.suspicion, Math.max(0, 1 - od / 14) * 0.4) : 0;
    this.audio.setThreat(threat);
    this.hud.eye(this.observer.suspicion, inHall && !facts.get('observer_tethered'));

    this.director.update(dt);

    this.focus = this.findFocus();
    this.hud.prompt(this.focus && !this.hud.talking ? `${this.touch ? '' : '[E] '}${this.focus.prompt}` : '');
    const it = items.find((i) => i.id === this.held);
    this.hud.held(it?.label, it?.echo);
    this.hud.setState(!!facts.get('has_device'), this.room, engine.state(this.room), rooms[this.room].name, engine.locked.has(this.room));

    for (const [id, m] of Object.entries(this.heldModels)) {
      m.visible = this.held === id;
      m.rotation.y = this.time;
    }
    this.device.visible = !!facts.get('has_device');

    this.saveT = (this.saveT || 0) - dt;
    if (this.dirty && this.saveT <= 0) {
      this.save();
      this.dirty = false;
      this.saveT = 3;
    }
  }

  // Deterministic fixed-step simulation without rendering. Used by the
  // automated playtest (tests/smoke.mjs) and handy for AI-driven QA bots.
  simulate(sec, dt = 1 / 30) {
    for (let t = 0; t < sec; t += dt) {
      this.time += dt;
      this.step(dt);
      this.world.update(dt, this.time, this.held);
      this.hud.update(dt);
    }
    this.player.updateCamera();
  }

  updateTheme(dt) {
    const s = this.room ? this.engine.state(this.room) : 'PHYSICAL';
    const th = THEMES[s];
    const k = Math.min(1, dt * 3);
    const tint = new THREE.Color(rooms[this.room || 'antechamber'].tint);
    this.scene.fog.color.lerp(new THREE.Color(th.fog), k);
    this.scene.background.copy(this.scene.fog.color);
    this.scene.fog.density += (th.density - this.scene.fog.density) * k;
    this.hemi.color.lerp(new THREE.Color(th.sky).lerp(tint, 0.25), k);
    this.hemi.groundColor.lerp(new THREE.Color(th.ground), k);
    this.hemi.intensity += (th.hemi - this.hemi.intensity) * k;
    const dc = this.device.userData;
    dc.shell.material.color.lerp(new THREE.Color(th.device), k);
    dc.shell.rotation.y += dt * 1.5;
    dc.shell.rotation.x += dt * 0.6;
    // When the machine runs, the lab breathes amber.
    if (this.facts.get('machine_activated') && this.room === 'lab') {
      this.lights[0].color.setRGB(1, 0.62 + Math.sin(this.time * 2.4) * 0.15, 0.35);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    window.AZ = new Game();
  } catch (e) {
    document.querySelector('#title .body').innerHTML = `<p class="err">This device could not start WebGL.<br><small>${e.message}</small></p>`;
    throw e;
  }
});
