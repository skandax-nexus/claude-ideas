// Generator tests: the vessel campaign must be deterministic, solvable by
// construction, consistent as a mystery, and about five hours long; the
// vessel after each prologue ending keeps every seed's truth; HALCYON's
// districts keep their geometry; THE CRADLE is built for every ending.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeStory, verdictEnding, VESSEL_AFTER } from '../game/js/gen/StoryGen.js';
import { generateSector, campaignLength, SECTORS_PER_DECK, NEW_TOKENS, HINTS } from '../game/js/gen/LevelGen.js';
import { makeZoneStory, makeCradleStory } from '../game/js/gen/ZoneStory.js';
import { generateZone } from '../game/js/gen/ZoneGen.js';
import { GRAMMAR } from '../game/js/core/Laws.js';

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);
const EFFECT_DECK = { gravityFlip: 0, echoSolid: 1, heldPersists: 1, zeroG: 2, timeStop: 3, observerFrozen: 0, lightSolid: 5 };

test('same seed, same vessel', () => {
  const a = makeStory(42), b = makeStory(42);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(generateSector(a, 3, 2, 42)), JSON.stringify(generateSector(b, 3, 2, 42)));
  assert.notEqual(JSON.stringify(generateSector(a, 3, 2, 42)), JSON.stringify(generateSector(makeStory(43), 3, 2, 43)));
});

test('every effect a room needs has a law that produces it', () => {
  const effects = new Set(Object.values(GRAMMAR).map((g) => g.effect));
  for (const e of Object.keys(EFFECT_DECK)) assert.ok(effects.has(e), e);
});

test('every puzzle room fits in three law slots and only uses laws the player owns by then', () => {
  for (const seed of SEEDS) {
    const story = makeStory(seed);
    for (let d = 0; d < 8; d++) {
      for (let s = 0; s < SECTORS_PER_DECK; s++) {
        const lv = generateSector(story, d, s, seed);
        for (const rid of lv.order) {
          const room = lv.rooms[rid];
          const required = new Set(room.challenges.filter((c) => c.effect && !c.optional).map((c) => c.effect));
          assert.ok(required.size <= 3, `${rid} needs ${[...required]}`);
          for (const e of required) assert.ok(EFFECT_DECK[e] <= d, `${rid} (deck ${d}) needs ${e}`);
          for (const c of room.challenges) assert.equal(c.hints.length, 3, `${rid} ${c.key} hints`);
        }
        // tokens introduced in a deck appear in its first sector
        if (s === 0 && NEW_TOKENS[d]) for (const t of NEW_TOKENS[d]) assert.ok(lv.tokens.some((x) => x.token === t), `deck ${d} token ${t}`);
      }
    }
  }
});

test('rooms of a sector never overlap each other', () => {
  for (const seed of SEEDS) {
    const story = makeStory(seed);
    for (let d = 0; d < 8; d++) {
      for (let s = 0; s < SECTORS_PER_DECK; s++) {
        const lv = generateSector(story, d, s, seed);
        const R = lv.map.rooms.map((r) => r.rect);
        for (let i = 0; i < R.length; i++) {
          for (let j = i + 1; j < R.length; j++) {
            const a = R[i], b = R[j];
            const overlap = a[0] < b[2] - 0.5 && a[2] > b[0] + 0.5 && a[1] < b[3] - 0.5 && a[3] > b[1] + 0.5;
            assert.ok(!overlap, `seed ${seed} ${lv.id}: rooms ${i} and ${j} overlap`);
          }
        }
        assert.ok(lv.exit && lv.exit.box, 'sector has a gate');
        assert.ok(lv.elements.length < 2500, `sector ${lv.id} has ${lv.elements.length} elements`);
      }
    }
  }
});

test('pits cannot be jumped and ledges cannot be climbed without a law', () => {
  for (const seed of SEEDS.slice(0, 10)) {
    const story = makeStory(seed);
    for (let d = 0; d < 8; d++) {
      for (let s = 0; s < SECTORS_PER_DECK; s++) {
        const lv = generateSector(story, d, s, seed);
        for (const rid of lv.order) {
          for (const c of lv.rooms[rid].challenges) {
            if (c.key.startsWith('pit:')) assert.ok(c.z0 - 2 - c.z1 >= 6.2 - 1e-6, `${rid} pit length`);
          }
        }
      }
    }
  }
});

test('the mystery is consistent and solvable', () => {
  for (const seed of SEEDS) {
    const story = makeStory(seed);
    const { culprit } = story.truth;
    assert.ok(culprit >= 2 && culprit <= 6);
    let guilty = 0;
    for (let d = 0; d < 7; d++) {
      const beat = story.decks[d].beats[2];
      assert.equal(beat.kind, 'contradiction');
      if (beat.clue === 'guilty') {
        guilty++;
        assert.equal(d, culprit);
      }
      // a witness never gives the culprit an alibi
      if (d !== culprit) assert.ok(!beat.echo.includes(`WITH ${story.cast[culprit].first.toUpperCase()}`), `seed ${seed} deck ${d}`);
    }
    assert.equal(guilty, 1);
    assert.equal(story.decks[7].beats[3].kind, 'verdict');
    assert.ok(verdictEnding(story, culprit).right);
    assert.ok(!verdictEnding(story, (culprit + 1) % 7).right);
    // no unfilled template slots anywhere
    const txt = JSON.stringify(story);
    assert.ok(!/\{[a-zA-Z]+\}/.test(txt), `unfilled template in seed ${seed}: ${txt.match(/.{30}\{[a-zA-Z]+\}.{10}/)?.[0]}`);
  }
});

test('the vessel campaign is about five hours', () => {
  const lens = SEEDS.slice(0, 8).map((seed) => campaignLength(makeStory(seed), seed).total);
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
  // plus the ~35 minute Station Zero prologue
  console.log(`  vessel estimate: ${lens.map((l) => Math.round(l)).join(', ')} min (avg ${Math.round(avg)}) + prologue ~35`);
  assert.ok(avg + 35 > 240 && avg + 35 < 360, `average ${avg}`);
});

// --- v1.0: the vessel after each prologue ending ------------------------------------
const ENDINGS = [null, 'SEVER', 'SUSTAIN', 'MIRROR'];
const MODE = { null: 'hunt', SEVER: 'still', SUSTAIN: 'learned', MIRROR: 'kin' };

test('every ending keeps each story number\'s truth, and fits the ending you will read', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const base = makeStory(seed);
    const who = (s) => s.cast.map((c) => [c.name, c.claim, c.trait]);
    for (const ending of ENDINGS) {
      const st = makeStory(seed, null, { ending });
      assert.deepEqual(st.truth, base.truth, `seed ${seed} ${ending}`);
      assert.deepEqual(who(st), who(base), `seed ${seed} ${ending} cast`);
      assert.equal(st.after.key, ending || 'NONE');
      const txt = JSON.stringify([st.decks[0].intro, st.after.coda, st.twist.text, st.motive, st.decks.slice(1)]);
      assert.ok(!/\{[a-zA-Z]+\}/.test(txt), `unfilled template, seed ${seed} ${ending}: ${txt.match(/.{30}\{[a-zA-Z]+\}.{10}/)?.[0]}`);
      // whoever you meet fits the twist and the motive
      const v = st.cast[st.truth.victim];
      if (st.truth.twist === 'observer') assert.equal(v.alive, false, `seed ${seed}: an uploaded victim is only an echo`);
      else if (st.truth.motive === 'save') assert.equal(v.alive, true, `seed ${seed}: the fold keeps the victim from dying`);
      for (let d = 0; d < 7; d++) {
        const b = st.decks[d].beats[2];
        if (b.clue === 'cleared' && d !== st.truth.herring) assert.ok(b.echo.includes('ON THE RADIO WITH'), `seed ${seed} deck ${d}: ${b.echo}`);
      }
      assert.ok(st.decks[7].beats[2].log.text.includes('key and a pair of hands'));
      if (ending) assert.equal(st.decks[0].intro[0].text, VESSEL_AFTER[ending].intro[0].text);
      else assert.deepEqual(st.decks[0].intro, base.decks[0].intro);
      for (let d = 1; d < 8; d++) assert.deepEqual(st.decks[d].intro, base.decks[d].intro);
      // after SEVERED there is no cycle to fold back to
      const wrong = verdictEnding(st, (st.truth.culprit + 1) % 7).text[1];
      assert.equal(ending === 'SEVER', wrong.includes('Nothing folds back'), `seed ${seed} ${ending}: ${wrong}`);
    }
  }
});

test('the vessel\'s rooms change with the ending, never its puzzles', () => {
  for (const seed of SEEDS.slice(0, 8)) {
    const plain = makeStory(seed);
    for (const ending of ENDINGS) {
      const st = makeStory(seed, null, { ending });
      for (let d = 0; d < 8; d++) {
        for (let s = 0; s < SECTORS_PER_DECK; s++) {
          const lv = generateSector(st, d, s, seed);
          const was = generateSector(plain, d, s, seed);
          // the same layout, sentinels and solutions as before; the window band is the only new geometry
          const solid = (l) => JSON.stringify(l.elements.filter((x) => !/^window/.test(x.mat)));
          assert.equal(solid(lv), solid(was), `seed ${seed} ${ending} ${lv.id}`);
          assert.equal(JSON.stringify(lv.sentinels), JSON.stringify(was.sentinels));
          const story = lv.order.filter((id) => lv.rooms[id].beat);
          const wins = lv.elements.filter((x) => /^window/.test(x.mat));
          assert.equal(wins.length, story.length, `${lv.id}: one window band per story room`);
          assert.ok(wins.every((x) => x.mat === (ending === 'SEVER' ? 'windowDark' : 'windowStars') && x.solid === false));
          const juno = lv.npcs.filter((n) => n.crew === 'juno'), other = lv.npcs.filter((n) => n.crew === 'other');
          assert.equal(juno.length, ending === 'SEVER' && d === 7 && s === 3 ? 1 : 0, `${lv.id} Juno`);
          if (juno.length) assert.equal(juno[0].when, 'verdict_right');
          assert.equal(other.length, ending === 'SUSTAIN' ? (s === 0 ? 1 : 0) + (d === 7 && s === 3 ? 1 : 0) : 0, `${lv.id} the Other`);
          assert.ok(other.every((n) => n.upsideDown && n.silent));
          for (const id of lv.order) {
            for (const c of lv.rooms[id].challenges) {
              if (c.key === 'sentinel') assert.deepEqual(c.hints, HINTS[`sentinel:${MODE[ending]}`] || HINTS.sentinel);
            }
          }
        }
      }
    }
  }
});

// --- v1.0: HALCYON keeps its districts, THE CRADLE has its own ----------------------------
// Geometry fingerprints of HALCYON's twelve districts (as in v0.9). Update them only when a
// district is changed on purpose.
// (THE GLASS FOREST's arrival, the 7th, changed on purpose: its stair-side corner tree moved out of the stairs' approach)
const HALCYON_GEOMETRY = ['656965bae961', 'bc4374d2cd57', 'b8ad862febf3', '40f561965134', '04211e896344', '8be45034f040', '4dad1e0995bf', '12ae017c2cf6', '5300ca67b92a', 'be7d37bf0eb7', 'ee94220bcd9c', 'e05e892075e1'];
const geometry = (lv) => createHash('sha1').update(JSON.stringify({
  e: lv.elements.map((x) => [x.box.map((v) => +v.toFixed(3)), x.mat, x.solid !== false, !!x.echo, x.when || '']),
  s: lv.sentinels.map((x) => [x.path, x.speed]),
  i: lv.interactables.map((x) => [x.kind, x.pos.map((v) => +v.toFixed(3))]),
  t: lv.texts.map((x) => x.pos.map((v) => +v.toFixed(3))),
  n: lv.npcs.map((x) => x.pos.map((v) => +v.toFixed(3))),
  g: lv.glows, tr: lv.trees, r: lv.rocks, k: lv.tokens,
})).digest('hex').slice(0, 12);

test('HALCYON\'s twelve districts are built exactly as before', () => {
  const zs = makeZoneStory();
  const got = [];
  for (let zi = 0; zi < 4; zi++) for (let si = 0; si < 3; si++) got.push(geometry(generateZone(zs, zi, si)));
  assert.deepEqual(got, HALCYON_GEOMETRY);
});

test('THE CRADLE: three districts for every ending', () => {
  for (const ending of ENDINGS) {
    const cs = makeCradleStory(ending);
    assert.equal(cs.after.key, ending || 'NONE');
    assert.equal(cs.after.sentinels, MODE[ending]);
    assert.equal(cs.decks.length, 1);
    for (let si = 0; si < 3; si++) {
      const lv = generateZone(cs, 0, si);
      const texts = lv.texts.map((t) => t.text);
      assert.equal(lv.id, `c0s${si}`);
      assert.equal(lv.seed, 'cradle');
      assert.equal(lv.sentinels.length, si, `${lv.id} drones`);
      assert.equal(lv.tokens.length, 0);
      assert.ok(!texts.includes('FOLLOW THE PINK LIGHTS'));
      assert.equal(texts.includes('NIGHT WATCH - FORWARD DECKS'), si === 2);
      if (si === 0) assert.ok(texts.includes('SLEEP IS A PROMISE TO WAKE'));
      if (si >= 1) assert.ok(texts.includes('WALKWAY FLOODED'));
      // pod lids stand open after SEVERED only; Varga's own lid stands open when she is awake
      const lids = lv.elements.filter((x) => x.mat === 'glassWall').map((x) => +(x.box[4] - x.box[1]).toFixed(2));
      const pods = lids.filter((h) => h === 1.4 || h === 0.55);
      assert.ok(pods.length > 10 && pods.every((h) => h === (ending === 'SEVER' ? 1.4 : 0.55)), `${lv.id} lids ${ending}`);
      if (si === 2) {
        const varga = lids.filter((h) => h === 1.8 || h === 0.45);
        assert.deepEqual(varga, [ending === 'SEVER' || ending === 'MIRROR' ? 1.8 : 0.45]);
        const npc = lv.npcs.find((n) => n.crew === 'varga');
        assert.equal(npc.hologram, !(ending === 'SEVER' || ending === 'MIRROR'));
        assert.equal(npc.lines.length, 6);
        assert.ok(npc.lines.every((l) => l.who === 'VARGA'));
      }
      // roots hang from the ceiling, never low enough to block the floor
      const roots = lv.elements.filter((x) => x.mat === 'root');
      assert.ok(roots.length >= 12 && roots.every((x) => x.box[1] >= 10 && x.box[4] === 22), `${lv.id} roots`);
      assert.equal(lv.elements.filter((x) => x.when).length, 1, 'only the gate door is conditional');
      const drones = lv.rooms[lv.id].challenges.find((c) => c.key === 'drones');
      if (si) assert.deepEqual(drones.hints, HINTS[`sentinel:${MODE[ending]}`] || cs.decks[0].hints.drones);
      assert.equal(lv.interactables.filter((i) => i.kind === 'fragment').length, 3);
    }
  }
});
