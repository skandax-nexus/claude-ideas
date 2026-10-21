// The Observer's memory. It never reads the player's position directly to
// "cheat": it only learns from events it plausibly witnessed (where you hid
// while it was nearby, which aisle you crossed, how loudly you moved, which
// reality states you leaned on, which laws you used against it).
//
// Every lesson is legible: it is announced with a subtle line so the player
// can form a theory about what the Observer knows - and then exploit it.

export const LESSONS = {
  ceiling: 'It tilts its head upward, toward the ceiling.',
  freeze: 'It moved. It should not be able to move.',
  runner: 'It is listening for your footsteps now.',
  lane: 'It waits where you usually cross.',
  patient: 'It lingers longer than before.',
};

const HIDE_PAUSE = 2;
const HIDE_INSPECT = 3;

export class ObserverBrain {
  constructor(opts = {}) {
    this.ceilingAfter = opts.ceilingAfter ?? 10; // seconds of inverted exposure
    this.freezeAfter = opts.freezeAfter ?? 2; // freezes before immunity
    this.runnerAfter = opts.runnerAfter ?? 8; // seconds of running nearby
    this.mem = {
      hides: {},
      lanes: {},
      stateTime: { PHYSICAL: 0, INVERTED: 0, ECHO: 0 },
      runTime: 0,
      sneakTime: 0,
      catches: 0,
      freezes: 0,
      inspected: {},
    };
    this.lessons = new Set();
    this.onLesson = () => {};
    this.onReaction = () => {};
  }

  learn(lesson, detail) {
    if (this.lessons.has(lesson)) return false;
    this.lessons.add(lesson);
    this.onLesson(lesson, LESSONS[lesson], detail);
    return true;
  }

  // --- observations -----------------------------------------------------
  recordHide(spot) {
    const n = (this.mem.hides[spot] = (this.mem.hides[spot] || 0) + 1);
    const reaction = this.hideReaction(spot);
    this.onReaction(reaction, spot, n);
    return n;
  }

  hideReaction(spot) {
    const n = this.mem.hides[spot] || 0;
    if (n >= HIDE_INSPECT) return 'inspect';
    if (n >= HIDE_PAUSE) return 'pause';
    return 'pass';
  }

  recordCrossing(lane) {
    const n = (this.mem.lanes[lane] = (this.mem.lanes[lane] || 0) + 1);
    if (n >= 2) this.learn('lane', lane);
    return n;
  }

  recordStateTime(state, dt) {
    this.mem.stateTime[state] = (this.mem.stateTime[state] || 0) + dt;
    if (this.mem.stateTime.INVERTED >= this.ceilingAfter) this.learn('ceiling');
  }

  recordPace(running, dt) {
    if (running) this.mem.runTime += dt;
    else this.mem.sneakTime += dt;
    if (this.mem.runTime >= this.runnerAfter) this.learn('runner');
  }

  recordFreeze() {
    this.mem.freezes++;
    if (this.mem.freezes >= this.freezeAfter) this.learn('freeze');
  }

  recordCatch(state) {
    this.mem.catches++;
    if (state === 'INVERTED') this.learn('ceiling');
    if (this.mem.catches >= 2) this.learn('patient');
  }

  // --- capabilities derived from lessons ---------------------------------
  seesCeiling() {
    return this.lessons.has('ceiling');
  }

  ignoresFreeze() {
    return this.lessons.has('freeze');
  }

  hearingRadius(running) {
    if (!running) return 2.5;
    return this.lessons.has('runner') ? 12 : 6;
  }

  searchDuration() {
    return this.lessons.has('patient') ? 7 : 4;
  }

  favouriteLane() {
    let best = null, n = 1;
    for (const [lane, c] of Object.entries(this.mem.lanes)) if (c > n) (best = lane), (n = c);
    return best;
  }

  // Choose the next high-level plan. `now` is game time in seconds.
  decide(now, rng = Math.random) {
    // 1. Return to a hiding spot the player keeps using.
    let target = null, best = 0;
    for (const [spot, c] of Object.entries(this.mem.hides)) {
      const last = this.mem.inspected[spot] ?? -Infinity;
      if (c >= HIDE_INSPECT && now - last > 20 && c > best) (target = spot), (best = c);
    }
    if (target) {
      this.mem.inspected[target] = now;
      return { type: 'inspect', spot: target };
    }
    // 2. Guard the aisle the player habitually uses.
    const lane = this.lessons.has('lane') ? this.favouriteLane() : null;
    if (lane && rng() < 0.6) return { type: 'intercept', lane };
    // 3. Otherwise search.
    return { type: 'patrol' };
  }

  summary() {
    return [...this.lessons].map((l) => LESSONS[l]);
  }

  serialize() {
    return { mem: this.mem, lessons: [...this.lessons] };
  }

  restore(d) {
    this.mem = { ...this.mem, ...d.mem };
    this.lessons = new Set(d.lessons);
  }
}
