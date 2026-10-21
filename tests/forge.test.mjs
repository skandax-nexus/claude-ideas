// WORLD FORGE (v1.0): the Forge is deterministic, every act it plans is solvable under that act's
// local rules with the laws the device knows and the kit, no line has an unfilled {slot}, every
// gear and rule combination is documented, and the existing chapters are untouched by its hooks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { forgeGame, makeForgeStory, tuneLevel, checkSolvable, rulesOverride, gearRule, ruleCombos, forgeEnding, describeRules, FORGE_LINES, GENRE_KEYS, GEAR_KEYS, THEME_KEYS, LENGTHS, ROLE_KEYS, GENRES } from '../game/js/gen/Forge.js';
import { generateSector } from '../game/js/gen/LevelGen.js';
import { generateZone } from '../game/js/gen/ZoneGen.js';
import { GRAMMAR } from '../game/js/core/Laws.js';

const SEEDS = Array.from({ length: 300 }, (_, i) => 11 + i * 7919);
const LEN = Object.keys(LENGTHS);
const UNFILLED = /\{[a-zA-Z]+\}/;
const strip = (st) => JSON.stringify(st.decks.map((d) => ({ ...d, planPuzzle: undefined })));

test('same Forge number and choices, same game', () => {
  const choices = { genre: 'HEIST', length: 'FULL', title: 'The Vault Night', hero: 'Mika', cast: [{ name: 'Aria', role: 'guide' }, { name: 'Dev', role: 'engineer' }], gear: ['STASIS', 'FLARE'], acts: [{ theme: 'neon', name: 'OLD TOWN', rules: { gravity: 'INVERTED', light: 'NIGHT' } }] };
  const a = forgeGame(4242, choices), b = forgeGame(4242, choices);
  assert.deepEqual(a, b);
  assert.notEqual(JSON.stringify(a.acts), JSON.stringify(forgeGame(4243, choices).acts));
  assert.equal(strip(makeForgeStory(a)), strip(makeForgeStory(b)));
  // the choices are kept
  assert.equal(a.title, 'The Vault Night');
  assert.equal(a.hero, 'Mika');
  assert.equal(a.genre, 'HEIST');
  assert.equal(a.acts.length, 5);
  assert.equal(a.acts[0].theme, 'neon');
  assert.equal(a.acts[0].name, 'OLD TOWN');
  assert.equal(a.acts[0].rules.gravity, 'INVERTED');
  assert.equal(a.acts[0].rules.light, 'NIGHT');
  assert.deepEqual(a.cast.slice(0, 2).map((c) => [c.first, c.roleKey]), [['Aria', 'guide'], ['Dev', 'engineer']]);
  assert.ok(a.gear.includes('STASIS') && a.gear.includes('FLARE') && a.gear.length === 4 && new Set(a.gear).size === 4);
  const st = makeForgeStory(a);
  const lv = generateSector(st, 1, 0, st.seed);
  assert.equal(JSON.stringify(lv), JSON.stringify(generateSector(makeForgeStory(b), 1, 0, st.seed)));
});

test('every act of every genre and length is solvable under its rules (300 seeds)', () => {
  let games = 0, sectors = 0;
  const seen = { nullField: 0, zero: 0, inverted: 0, open: 0, deck: 0 };
  for (const seed of SEEDS) {
    for (const genre of GENRE_KEYS) {
      const length = LEN[(seed + GENRE_KEYS.indexOf(genre)) % 3];
      // a third of the games pin hard rules on the player's side too
      const acts = seed % 3 === 0 ? [{ theme: THEME_KEYS[seed % THEME_KEYS.length], rules: { gravity: 'ZERO' } }, { theme: THEME_KEYS[(seed + 5) % THEME_KEYS.length], rules: { nullField: true } }, { rules: { gravity: 'INVERTED', echoes: 'HIDDEN' } }] : [];
      const g = forgeGame(seed, { genre, length, acts, cast: [{ name: 'Aria', role: ROLE_KEYS[seed % ROLE_KEYS.length] }] });
      const st = makeForgeStory(g);
      games++;
      assert.equal(g.acts.length, LENGTHS[length].acts);
      assert.equal(g.acts[g.acts.length - 1].kinds[g.acts[g.acts.length - 1].kinds.length - 1], 'verdict');
      assert.equal(st.decks[st.decks.length - 1].beats.at(-1).kind, 'verdict');
      assert.ok(!UNFILLED.test(strip(st)), `unfilled slot in ${genre} ${seed}: ${strip(st).match(/.{30}\{[a-zA-Z]+\}.{10}/)?.[0]}`);
      // the whole geometry for a slice of the games, the plans for all of them
      const full = seed % 10 === 1;
      for (const act of g.acts) {
        if (act.rules.nullField) seen.nullField++;
        if (act.rules.gravity === 'ZERO') seen.zero++;
        if (act.rules.gravity === 'INVERTED') seen.inverted++;
        seen[act.kind]++;
        for (let s = 0; s < act.sectors; s++) {
          if (!full && act.kind === 'open' && s > 0) continue;
          const lv = tuneLevel(act.kind === 'open' ? generateZone(st, act.index, s) : generateSector(st, act.index, s, st.seed), act);
          sectors++;
          const bad = checkSolvable(lv, act, g.gear);
          assert.deepEqual(bad, [], `${genre} ${length} seed ${seed} act ${act.index} (${act.theme}) sector ${s}: ${bad.join('; ')}`);
          assert.ok(lv.exit && lv.exit.box, 'every sector has a gate');
          if (act.rules.nullField) for (const rid of lv.order) for (const c of lv.rooms[rid].challenges) assert.ok(c.optional || !c.effect, `${rid} needs ${c.key} in a null field`);
          if (act.rules.watchers === 'NONE') assert.equal(lv.sentinels.length, 0);
          if (act.rules.time === 'SWEEPERS') assert.ok(lv.hazards.length > 0, `${genre} seed ${seed} act ${act.index}: SWEEPERS but no beams`);
          // TICK's answers name a state that does what they say (INVERTED: PHYSICAL is upside down; ZERO: no state flips you)
          if (!act.rules.nullField) for (const rid of lv.order) for (const c of lv.rooms[rid].challenges) {
            const said = (c.hints || []).join(' ');
            if (act.rules.gravity === 'INVERTED') assert.ok(!/SHIFT TO INVERTED(,| AND) (WALK|CROSS)/.test(said), `${rid} ${c.key}: ${said}`);
            if (act.rules.gravity === 'ZERO') assert.ok(!/INVERTED/.test(said), `${rid} ${c.key}: ${said}`);
          }
        }
      }
    }
  }
  console.log(`  ${games} games forged, ${sectors} sectors generated and checked; null-field acts ${seen.nullField}, zero-g ${seen.zero}, inverted ${seen.inverted}, open ${seen.open}, deck ${seen.deck}`);
  assert.ok(seen.nullField > 100 && seen.zero > 100 && seen.inverted > 100 && seen.open > 500 && seen.deck > 500);
});

test('the rules become engine overrides, and the device still has a law for every effect', () => {
  const effects = new Set(Object.values(GRAMMAR).map((g) => g.effect));
  for (const e of ['gravityFlip', 'zeroG', 'echoSolid', 'echoVisible', 'timeStop', 'observerFrozen', 'lightSolid', 'heldPersists']) assert.ok(effects.has(e));
  assert.equal(rulesOverride({ gravity: 'NORMAL', echoes: 'HIDDEN', time: 'NORMAL', watchers: 'NONE', light: 'DAY', nullField: false }), null);
  const nul = rulesOverride({ gravity: 'ZERO', echoes: 'SOLID', time: 'NORMAL', watchers: 'NONE', light: 'DAY', nullField: true });
  for (const e of effects) assert.equal(nul[e], false, `null field switches off ${e}`);
  const inv = rulesOverride({ gravity: 'INVERTED', echoes: 'VISIBLE', time: 'NORMAL', watchers: 'NONE', light: 'DAY', nullField: false });
  assert.deepEqual(inv, { gravityFlip: { PHYSICAL: true, INVERTED: false, ECHO: false }, echoVisible: true });
  assert.deepEqual(rulesOverride({ gravity: 'ZERO', echoes: 'SOLID', time: 'SWEEPERS', watchers: 'HUNT', light: 'NIGHT', nullField: false }), { zeroG: true, echoSolid: true });
});

test('every gear is documented under every rule combination (324 combinations x 6 gear)', () => {
  const combos = ruleCombos();
  assert.equal(combos.length, 3 * 3 * 2 * 3 * 3 * 2);
  let refused = 0;
  for (const rules of combos) {
    for (const g of GEAR_KEYS) {
      const r = gearRule(g, rules);
      assert.equal(typeof r.ok, 'boolean');
      if (!r.ok) { refused++; assert.ok(r.note, `${g} refused without a reason`); }
      if (rules.nullField) assert.equal(r.ok, false, `${g} works in a null field`);
    }
    if (!rules.nullField) {
      assert.equal(gearRule('GRAPPLE', rules).ok, rules.gravity !== 'ZERO');
      assert.equal(gearRule('RIG', rules).ok, rules.gravity !== 'ZERO');
      assert.equal(gearRule('LENS', rules).ok, rules.echoes === 'HIDDEN');
      assert.equal(gearRule('FLARE', rules).ok, !(rules.light === 'DAY' && rules.watchers === 'NONE'));
      assert.equal(gearRule('KEYFORGE', rules).ok, true);
      assert.equal(gearRule('STASIS', rules).ok, true);
      if (rules.light === 'EMERGENCY') assert.equal(gearRule('FLARE', rules).dur, 30);
      if (rules.light === 'NIGHT' && rules.gravity !== 'ZERO') assert.equal(gearRule('RIG', rules).dur, 12);
      if (rules.watchers === 'HUNT') assert.equal(gearRule('STASIS', rules).dur, 4);
    }
  }
  assert.ok(refused > 0);
  // the rules card lists every rule and the kit
  const g = forgeGame(7, { genre: 'HORROR', length: 'SHORT' });
  const d = describeRules(g.acts[0], g.gear);
  assert.equal(d.rows.length, 5 + (g.acts[0].rules.nullField ? 1 : 0));
  assert.equal(d.gear.length, 4);
});

test('the cast: typed names and roles, one antagonist the genre chose, lines that change with your choices', () => {
  for (const genre of GENRE_KEYS) {
    const g = forgeGame(99, { genre, length: 'EPIC', cast: Array.from({ length: 8 }, (_, i) => ({ name: `Name${i}`, role: ROLE_KEYS[i] })) });
    assert.equal(g.cast.length, 8);
    assert.deepEqual(g.cast.map((c) => c.roleKey), ROLE_KEYS);
    const ants = g.cast.filter((c) => c.antagonist);
    assert.equal(ants.length, 1);
    assert.notEqual(g.cast.indexOf(ants[0]), 0, 'never the first person you meet');
    assert.ok(GENRES[genre].antRoles.includes(ants[0].roleKey), `${genre}: ${ants[0].roleKey}`);
    const st = makeForgeStory(g);
    // 3-6 lines per encounter, a choice in the complication acts, the antagonist at the twist
    const encounters = st.decks.flatMap((d) => d.beats.filter((b) => b.kind === 'encounter').map((b) => ({ d, b })));
    assert.ok(encounters.length >= 3);
    for (const { d, b } of encounters) {
      assert.ok(b.lines.length >= 3 && b.lines.length <= 6, `${b.lines.length} lines`);
      if (d.index > 0) assert.ok(b.lines.some((l) => l.when), 'a line depends on what you chose');
      if (d.part === 'twist') assert.equal(g.cast[b.crew].antagonist, true);
      if (b.choice) { assert.equal(b.choice.options.length, 2); assert.ok(b.choice.reply.trust && b.choice.reply.doubt); }
    }
    assert.ok(st.decks.some((d) => d.beats.some((b) => b.choice)), 'at least one choice');
    const twist = st.decks.find((d) => d.part === 'twist');
    const rec = twist.beats.find((b) => b.kind === 'contradiction');
    if (rec) { assert.equal(rec.clue, 'guilty'); assert.equal(g.cast[rec.crew].antagonist, true); }
    // the ending: two or three options, the text coloured by trust and doubt
    assert.ok(g.endings.length >= 2 && g.endings.length <= 3);
    const mk = (t, d) => ({ get: (k) => ({ forge_trust: t, forge_doubt: d })[k] || 0 });
    for (const e of g.endings) {
      const a = forgeEnding(g, e.key, mk(2, 0)), b = forgeEnding(g, e.key, mk(0, 2));
      assert.ok(a.text[0].length > 40 && !UNFILLED.test(a.text[0]));
      assert.notEqual(a.coda[0].text, b.coda[0].text);
    }
  }
});

test('the Forge writes few new fixed lines, in the game\'s voice', () => {
  const lines = FORGE_LINES();
  assert.ok(lines.length < 220, `${lines.length} lines`);
  for (const [voice, text] of lines) {
    assert.ok(['JUNO', 'TICK', 'NONE', 'CREW', 'YOU'].includes(voice));
    if (voice === 'TICK') assert.equal(text, text.toUpperCase(), text);
    assert.ok(!UNFILLED.test(text), text);
  }
  console.log(`  ${lines.length} fixed Forge lines`);
});
