#!/usr/bin/env node
// Collects every line the game can speak and splits them into the phrases and
// words the voice pack records (see game/js/audio/voiceKey.js). Writes
// <out>/script.json for tools/voice-pack.py, which renders the recordings.
//
//   node tools/voice-pack.mjs <outdir> [seeds=400]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game', 'js');
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const out = process.argv[2];
const SEEDS = +(process.argv[3] || 400);

const story = await imp('world/story.js');
const { makeStory, verdictEnding, VOCAB } = await imp('gen/StoryGen.js');
const { HINTS } = await imp('gen/LevelGen.js');
const { LESSONS } = await imp('core/ObserverBrain.js');
const { voicePieces } = await imp('audio/voiceKey.js');
const vocab = VOCAB();

const lines = []; // [voice, text]
const add = (voice, text) => text && lines.push([voice, text]);
const crewVoice = (c) => 'CREW_' + ({ her: 'f', his: 'm' }[c.pronoun?.their] || 'n');

// hand-written prologue
const walk = (o) => {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.text === 'string' && o.who) add(o.who, o.text);
  for (const v of Object.values(o)) walk(v);
};
walk(story.scripts);
walk(story.juno);
for (const h of story.hints) h.tiers.forEach((t) => add('TICK', t));
for (const e of Object.values(story.endings)) e.text.forEach((t) => add('NONE', t));
for (const tiers of Object.values(HINTS)) tiers.forEach((t) => add('TICK', t));
for (const t of Object.values(LESSONS)) add('OBSERVER', t);

// lines written inline in the code
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const lit = String.raw`'((?:[^'\\]|\\.)*)'|\x60((?:[^\x60\\]|\\.)*)\x60`;
const unq = (a, b) => (a ?? b).replace(/\\'/g, "'").replace(/\$\{[^}]*\}/g, 'Zora');
for (const f of ['main.js', 'world/Npcs.js', 'world/Director.js', 'world/World.js', 'world/DeckWorld.js']) {
  const s = src(f);
  for (const m of s.matchAll(new RegExp(String.raw`who: '(\w+)', text: (?:${lit})`, 'g'))) add(m[1], unq(m[2], m[3]));
  // TICK talks in capitals; anything else sentence-like in a hud.say call
  for (const m of s.matchAll(new RegExp(lit, 'g'))) {
    const t = unq(m[1], m[2]);
    if (/^[A-Z][A-Z0-9 ,.'?!()-]{14,}$/.test(t) && / /.test(t) && /[.?!]$/.test(t)) add('TICK', t);
  }
}
for (const m of src('world/Npcs.js').matchAll(/'([A-Z][a-z][^']{8,}[.?!])'/g)) add('YOU', m[1]);
for (const m of src('entities/Observer.js').matchAll(/onSay\('([^']+)'\)/g)) add('OBSERVER', m[1]);

// HALCYON, the open districts in the middle of the prologue, and THE CRADLE after it (one telling per ending)
const { makeZoneStory, makeCradleStory, FRAGMENTS, CRADLE_FRAGMENTS, CRADLE_HINTS } = await imp('gen/ZoneStory.js');
[...FRAGMENTS.flat(), ...CRADLE_FRAGMENTS].forEach((t) => add('NONE', t));
const { ZONE_HINTS } = await imp('gen/ZoneGen.js');
{
  const voiceOf = (c) => 'CREW_' + ({ her: 'f', his: 'm' }[c.pronoun?.their] || 'n');
  for (const zs of [makeZoneStory(), ...['SEVER', 'SUSTAIN', 'MIRROR', null].map((e) => makeCradleStory(e))]) {
    for (const d of zs.decks) {
      d.intro.forEach((l) => add(l.who, l.text));
      const c = zs.cast[d.crew];
      for (const b of d.beats) {
        if (b.log) add(b.kind === 'contradiction' ? 'YOU' : b.log.who || 'NONE', typeof b.log === 'string' ? b.log : b.log.text);
        if (b.tick) add('TICK', b.tick);
        if (b.junoAfter) [].concat(b.junoAfter).forEach((t) => add('JUNO', t));
        if (b.kind === 'contradiction') { add('NONE', b.official); add('NONE', b.echo); }
        if (b.lines) b.lines.forEach((l) => add(l.who === 'CREW' ? voiceOf(c) : l.who, l.text));
        // main.onDeckRoom's line is spoken whole: zone names (Kade, Abena, Theo, Ilse) are not generated words
        if (b.kind === 'encounter') add('JUNO', `Someone's in there. Ren - be gentle. It might be ${c.first}.`);
      }
    }
  }
  for (const tiers of [...Object.values(ZONE_HINTS), ...Object.values(CRADLE_HINTS)]) tiers.forEach((t) => add('TICK', t));
}

// the generated vessel campaign, over many seeds
for (let s = 1; s <= SEEDS; s++) {
  const st = makeStory(s * 104729 + 17);
  for (const d of st.decks) {
    d.intro.forEach((l) => add(l.who, l.text));
    const c = d.crew != null ? st.cast[d.crew] : null;
    for (const b of d.beats) {
      if (b.log) add(b.log.who || 'NONE', b.log.text);
      if (b.tick) add('TICK', b.tick);
      if (b.junoAfter) add('JUNO', b.junoAfter);
      if (b.kind === 'contradiction') { add('NONE', b.official); add('NONE', b.echo); add('YOU', b.log); }
      if (b.lines) b.lines.forEach((l) => add(crewVoice(c), l.text));
    }
  }
  st.cast.forEach((c, i) => verdictEnding(st, i).text.forEach((t) => add('NONE', t)));
}
// the vessel after each prologue ending: Deck 1's opening (its {trail} line is spliced like today's),
// the bridge coda, SEVERED's retry and its telling of THE WATCHER'S NAME
for (const ending of ['SEVER', 'SUSTAIN', 'MIRROR', null]) {
  for (let s = 1; s <= 40; s++) {
    const st = makeStory(s * 7919 + 3, s % 4 === 0 ? { twist: 'observer' } : null, { ending });
    st.decks[0].intro.forEach((l) => add(l.who, l.text));
    (st.after.coda || []).forEach((l) => add(l.who, l.text));
    verdictEnding(st, st.truth.culprit).text.forEach((t) => add('NONE', t));
    verdictEnding(st, (st.truth.culprit + 1) % 7).text.forEach((t) => add('NONE', t));
  }
}

// WORLD FORGE: every fixed line the Forge can say (gen/Forge.js). Names the player types, and the
// few lines that carry them, fall back to the device voice; cast lines are recorded once, in the
// neutral crew voice, which the other crew voices fall back on (audio/Voice.js).
const { FORGE_LINES } = await imp('gen/Forge.js');
for (const [voice, text] of FORGE_LINES()) add(voice === 'CREW' ? 'CREW_n' : voice, text);

// AFTERZERO: THE LAST VERSION OF EARTH (v2.0): every line the edition can speak (game/js/editions/lastversion),
// in its own speakers' voices: KAI, MIRA, WITNESS (also the voice in every speaker), ROOK, NIKO, SERA, ANJA,
// IVEN, JUN, TALA, MARA, ORREN, CHILD, the narrator (NONE) and the neutral crew voice for the people in passing
const { allLines: lastVersionLines } = await imp('editions/lastversion/index.js');
const lvFrom = lines.length;
for (const [voice, text] of lastVersionLines()) add(voice === 'YOU' ? 'KAI' : voice === 'VOICE' ? 'WITNESS' : voice, text);
// (and the lines its scripted moments speak from code: L('WHO', '...'), N('...') the narrator, K('...') Kai)
for (const f of ['prologue.js', 'acts.js']) {
  const code = src(`editions/lastversion/${f}`);
  const q = String.raw`'((?:[^'\\]|\\.)*)'`;
  for (const m of code.matchAll(new RegExp(String.raw`\bL\('(\w+)', ${q}`, 'g'))) add(m[1] === 'CREW' ? 'CREW_n' : m[1] === 'VOICE' ? 'WITNESS' : m[1], unq(m[2]));
  for (const m of code.matchAll(new RegExp(String.raw`\bN\(${q}`, 'g'))) add('NONE', unq(m[1]));
  for (const m of code.matchAll(new RegExp(String.raw`\bK\(${q}`, 'g'))) add('KAI', unq(m[1]));
}
const lvLines = lines.slice(lvFrom);

// you sound like your look: everything Ren says is also recorded in a male voice
for (const [voice, text] of [...lines]) if (voice === 'YOU' || voice === 'OTHER') add(`${voice}_m`, text);

// unique pieces per voice
const pieces = new Map();
let n = 0;
for (const [voice, text] of lines) {
  for (const p of voicePieces(text, vocab)) {
    if (!p.key) continue;
    const k = voice + '|' + p.key;
    if (!pieces.has(k)) pieces.set(k, { voice, key: p.key, say: p.say, word: !!p.word });
    n++;
  }
}
const list = [...pieces.values()].sort((a, b) => (a.voice + a.key).localeCompare(b.voice + b.key));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'script.json'), JSON.stringify(list, null, 0));
const byVoice = {};
for (const p of list) byVoice[p.voice] = (byVoice[p.voice] || 0) + 1;
const chars = list.reduce((a, p) => a + p.say.length, 0);
console.log(`${lines.length} lines, ${n} pieces, ${list.length} unique recordings (${chars} chars, ~${Math.round(chars / 14.5 / 60)} min)`, byVoice);
{
  const lv = new Set();
  for (const [voice, text] of lvLines) for (const p of voicePieces(text, vocab)) if (p.key) lv.add(voice + '|' + p.key);
  const lvChars = [...lv].reduce((a, k) => a + pieces.get(k).say.length, 0);
  console.log(`THE LAST VERSION OF EARTH: ${lvLines.length} lines, ${lv.size} unique recordings (${lvChars} chars, ~${Math.round(lvChars / 14.5 / 60)} min) in ${new Set(lvLines.map(([v]) => v)).size} voices`);
}
