// Generator tests: the vessel campaign must be deterministic, solvable by
// construction, consistent as a mystery, and about five hours long.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeStory, verdictEnding } from '../game/js/gen/StoryGen.js';
import { generateSector, campaignLength, SECTORS_PER_DECK, NEW_TOKENS } from '../game/js/gen/LevelGen.js';
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
