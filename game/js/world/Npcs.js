// Characters you can meet: Juno (engineer who lives on the lab ceiling) and
// TICK (a little drone companion who doubles as the hint system).
import * as THREE from '../../vendor/three.module.min.js';
import { makeTick } from './models.js';
import { makeHuman, CAST_SPECS } from './humans.js';
import { juno as JUNO_LINES, hints } from './story.js';

const JUNO_SPOT = new THREE.Vector3(-5, 0, 2.5);

export class Npcs {
  constructor(game) {
    this.g = game;
    this.juno = makeHuman(CAST_SPECS.juno);
    this.juno.visible = false;
    this.juno.position.copy(JUNO_SPOT);
    game.scene.add(this.juno);
    this.dropT = -1;
    this.talkT = 0;

    this.tick = makeTick();
    this.tick.visible = false;
    game.scene.add(this.tick);
    this.hintKey = null;
    this.hintTier = 0;
  }

  get junoHere() {
    return !!this.g.facts.get('met_juno');
  }

  /** Juno lets go of the ceiling and lands next to you. */
  dropJuno() {
    this.dropT = 0;
    this.juno.visible = true;
  }

  talkToJuno() {
    const { facts, hud } = this.g;
    const line = JUNO_LINES.find((l) => facts.test(l.when)) || JUNO_LINES[JUNO_LINES.length - 1];
    this.talkT = 3;
    hud.say(line.lines, facts);
  }

  hint() {
    const { facts, hud } = this.g;
    if (!facts.get('has_tick')) {
      hud.say([{ who: 'YOU', text: facts.get('has_device') ? 'Think. What changed when I touched it?' : 'Look closer at the floating thing.' }], facts);
      return;
    }
    const h = hints.find((x) => facts.test(x.when));
    if (!h) {
      hud.say([{ who: 'TICK', text: 'NO HINTS NEEDED. YOU ARE DOING GREAT. PROBABLY.' }], facts);
      return;
    }
    if (h !== this.hintKey) {
      this.hintKey = h;
      this.hintTier = 0;
    }
    const text = h.tiers[Math.min(this.hintTier, h.tiers.length - 1)];
    this.hintTier++;
    facts.inc('hints_used');
    this.g.audio.blip(988, 0.1);
    hud.say([{ who: 'TICK', text }], facts);
  }

  focusCandidates() {
    if (!this.junoHere || this.dropT >= 0) return [];
    const p = this.juno.position;
    return [{ id: 'npc:juno', pos: [p.x, p.y + 1.5, p.z], r: 3.2, prompt: 'TALK TO JUNO' }];
  }

  update(dt, t) {
    const { player, facts, room } = this.g;
    // Juno: lives in the lab once you've met her
    this.juno.visible = this.junoHere && room !== 'antechamber' && this.g.mode !== 'deck';
    if (this.dropT >= 0) {
      this.dropT += dt;
      const k = Math.min(1, this.dropT / 0.9);
      this.juno.position.set(JUNO_SPOT.x, THREE.MathUtils.lerp(9, 0, k * k), JUNO_SPOT.z);
      this.juno.rotation.set(0, 0, THREE.MathUtils.lerp(Math.PI, 0, THREE.MathUtils.smootherstep(k, 0, 1)));
      if (k >= 1) this.dropT = -1;
      this.juno.userData.animate(dt, 0, t, true);
    } else if (this.juno.visible) {
      const to = player.pos.clone().sub(this.juno.position);
      to.y = 0;
      if (to.length() < 8) {
        const yaw = Math.atan2(to.x, to.z);
        this.juno.rotation.y += Math.atan2(Math.sin(yaw - this.juno.rotation.y), Math.cos(yaw - this.juno.rotation.y)) * Math.min(1, dt * 4);
      }
      this.talkT = Math.max(0, this.talkT - dt);
      this.juno.userData.animate(dt, 0, t);
      this.juno.userData.setTalking?.(this.talkT > 0 && this.g.hud.talking);
      this.juno.userData.lookAt?.(to.length() < 8 ? player.pos.clone().addScaledVector(player.U, 0.6) : null);
    }

    // TICK: hovers over your shoulder, glances at what you're looking at
    this.tick.visible = !!facts.get('has_tick');
    if (this.tick.visible) {
      const right = player.right(new THREE.Vector3());
      const target = player.pos.clone().addScaledVector(player.U, 1.05 + Math.sin(t * 2.2) * 0.06).addScaledVector(right, 0.75).addScaledVector(player.H, 0.25);
      if (this.tick.position.distanceTo(target) > 8) this.tick.position.copy(target);
      this.tick.position.lerp(target, 1 - Math.exp(-dt * 5));
      const look = this.g.focus ? new THREE.Vector3(...this.g.focus.pos) : player.pos.clone().addScaledVector(player.H, 6);
      this.tick.up.copy(player.U);
      this.tick.lookAt(look);
      this.tick.userData.rotor.rotation.z += dt * 18;
      const hasHint = this.g.mode === 'deck' || hints.some((x) => facts.test(x.when));
      this.tick.userData.eye.material.color.setHex(hasHint && Math.sin(t * 5) > 0.3 ? 0xffffff : 0x7fe8ff);
    }
  }
}
