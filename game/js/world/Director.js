// The Director runs authored moments: what happens when you touch, play,
// speak to or carry things. All persistent consequences go through facts
// so the world (and the save file) can re-derive itself from them.
import * as THREE from '../../vendor/three.module.min.js';
import { scripts } from './story.js';
import { SHADOW, interactables } from './maps.js';

const BASE_TOKENS = ['GRAVITY', 'INVERTS', 'PHYSICAL', 'INVERTED', 'ECHO'];

export class Director {
  constructor(game) {
    this.g = game;
    this.timers = [];
    this.armT = 0;
    this.shadowZ = 0;
    this.lookEast = 0;
    this.shadowI = interactables.find((i) => i.id === 'shadow');
    game.engine.on('shift', (e) => this.onShift(e));
  }

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  say(id, done) {
    this.g.hud.say(scripts[id], this.g.facts, done);
  }

  // Story events raised by rules ({ event: 'id' }).
  event(id) {
    if (id === 'juno_drop') {
      this.g.npcs.dropJuno();
      this.after(0.9, () => this.say('juno_drop'));
    }
  }

  // --- interactions --------------------------------------------------------
  use(id) {
    const { facts } = this.g;
    switch (id) {
      case 'shard': return this.touchShard();
      case 'r1':
        return this.say('r1', () => {
          if (facts.get('heard_varga') && facts.get('machine_activated')) facts.set('heard_varga_after'); // the grown recording, heard (not a first hearing after the activation)
          facts.set('heard_varga');
        });
      case 'r0': return this.say('r0', () => facts.set('heard_self'));
      case 'r2':
        return this.say('r2', () => {
          facts.set('vault_seen');
          // Varga went up. The long way through HALCYON starts here (once).
          if (!facts.get('zones_started') && !facts.get('ending')) {
            this.g.hud.say([
              { who: 'JUNO', text: 'Ren - behind the vault. A service hatch, and a ladder. It goes a long way up. And further down.' },
              { who: 'JUNO', text: 'If Varga is later, she went somewhere. I think she went up.' },
            ], facts, () => this.g.enterHalcyon());
          }
        });
      case 'machine': return this.machine();
      case 'archive_lock': return this.archiveLock();
      case 'custodian': return this.custodian();
      case 'shadow': return this.say('shadow_cold');
      case 'brain':
        return this.say('brain', () => {
          facts.set('brain_seen');
          this.say('observer_tethered');
        });
      case 'observer': return this.say('observer_face', () => facts.set('observer_faced'));
    }
  }

  touchShard() {
    const { facts, engine, audio, hud } = this.g;
    const n = facts.get('shard_touch') || 0;
    if (n === 0) {
      facts.set('shard_touch', 1);
      engine.setOverride('antechamber', { zeroG: true });
      audio.sweep(true);
      if (!this.g.settings.comfort) hud.flash('rgba(140,110,255,0.5)');
    } else if (n === 1) {
      engine.setOverride('antechamber', null);
      engine.lock('antechamber', false);
      for (const t of BASE_TOKENS) facts.set(`token_${t}`);
      facts.set('has_device');
      facts.set('shard_touch', 2);
      engine.setState('antechamber', 'INVERTED');
      audio.sweep(false);
      if (!this.g.settings.comfort) hud.flash('rgba(255,90,180,0.55)');
      this.after(1.8, () => this.say('other_speaks'));
      this.after(2.5, () =>
        hud.toast(this.g.input.touch
          ? 'The object is part of you now.<br><small>SHIFT changes the state of the room you stand in.</small>'
          : 'The object is part of you now.<br><small>[Q] / right-click: shift the room you stand in &nbsp; [1][2][3]: choose a state</small>', 6000));
    }
  }

  machine() {
    const { facts, hud, audio } = this.g;
    if (!facts.get('core_installed')) {
      if (this.g.held === 'core') {
        this.g.held = null;
        facts.set('core_installed');
        audio.chime();
        this.say('machine_installed');
      } else this.say('machine_empty');
    } else if (!facts.get('machine_activated')) {
      if (this.armT > 0) {
        this.armT = 0;
        facts.set('machine_activated');
        if (!this.g.settings.comfort) hud.flash('rgba(255,255,255,0.9)');
        audio.sweep(true);
        setTimeout(() => audio.sweep(false), 300);
        this.say('machine_activate');
      } else {
        // armed while the warning plays and for a while after it (it used to expire before
        // the warning finished, so a second use could never activate it, above all on touch)
        this.armT = 20;
        this.say('machine_warn');
      }
    } else if (!facts.get('brain_seen') && this.g.engine.state('lab') === 'ECHO') this.use('brain');
    else if (facts.get('ending')) this.g.finish(facts.get('ending')); // the choice is made: show it again
    else if (facts.get('brain_seen') && facts.get('zones_done')) this.g.openDecision();
    else if (facts.get('brain_seen')) this.say('machine_wait'); // the choice waits until Varga's trail has been followed up the tower
    else this.say('machine_hum');
  }

  archiveLock() {
    const { facts, engine, audio } = this.g;
    if (this.g.held === 'key') {
      if (engine.state('lab') === 'ECHO') {
        audio.deny();
        this.say('lock_echo_key');
      } else {
        this.g.held = null;
        facts.set('archive_open');
        audio.chime();
        this.say('lock_open');
      }
    } else {
      audio.deny();
      this.say('lock_no_key', () => facts.set('custodian_denied'));
    }
  }

  custodian() {
    const { facts, engine, hud, audio } = this.g;
    if (!facts.get('custodian_remembers')) {
      this.say('custodian_first', () => {
        facts.set('custodian_remembers');
        this.g.grantToken('ECHOES');
        this.g.grantToken('SOLIDIFIES');
        engine.unlockSlot(3);
        audio.chime();
        hud.toast('THIRD LAW SLOT UNLOCKED');
      });
    } else this.say('custodian_hint');
  }

  // --- reactions -----------------------------------------------------------
  onShift({ room, to }) {
    const { facts } = this.g;
    if (to === 'ECHO') facts.set('seen_echo');
    if (room === 'lab' && to === 'ECHO' && !facts.get('shadow_passage_open')) {
      facts.set('shadow_solid_seen');
      if (Math.abs(this.shadowZ - SHADOW.panelZ) < SHADOW.tolerance) {
        this.after(0.6, () => {
          facts.set('shadow_passage_open');
          this.g.audio.chime();
          this.say('shadow_opens');
        });
      }
    }
  }

  update(dt) {
    const { facts, engine, player, world, observer } = this.g;
    for (const t of this.timers) t.t -= dt;
    const due = this.timers.filter((t) => t.t <= 0);
    this.timers = this.timers.filter((t) => t.t > 0);
    due.forEach((t) => t.fn());
    if (this.armT > 0 && !this.g.hud.talking) this.armT -= dt;

    // The Other dissolves when you come close.
    if (facts.test('shard_touch >= 2 && !other_gone')) {
      const o = world.props.other.position;
      if (Math.hypot(player.pos.x - o.x, player.pos.z - o.z) < 2.4) facts.set('other_gone');
    }

    // The mirrored shadow on the lab's east wall.
    const labState = engine.state('lab');
    const open = facts.get('shadow_passage_open');
    if (this.g.room === 'lab' && labState !== 'ECHO') {
      this.shadowZ = THREE.MathUtils.clamp(-player.pos.z, -SHADOW.range, SHADOW.range);
      if (player.H.x > 0.6 && player.speed > 1 && player.pos.x > -6 && !open) {
        this.lookEast += dt;
        if (this.lookEast > 1.2) facts.set('noticed_shadow');
      }
    }
    const P = world.props;
    P.shadowWall.visible = !open && labState !== 'ECHO';
    P.shadowWall.position.z += (this.shadowZ - P.shadowWall.position.z) * Math.min(1, dt * 10);
    P.shadow.visible = !open && labState === 'ECHO';
    P.shadow.position.z = this.shadowZ;
    this.shadowI.pos[2] = this.shadowZ;

    // When the Observer reaches the doorway after activation.
    if (facts.get('observer_tethered') && !facts.get('observer_arrived') && !observer.path.length && observer.mode === 'tethered') {
      facts.set('observer_arrived');
    }
  }
}
