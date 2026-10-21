// THE LAST VERSION OF EARTH: every line the edition can speak, from one place (OVERHAUL.md §8.2).
//
// spokenLines() walks every speaking path: the missions' data (intros, outros, cold opens and hooks,
// rules, scenes, choices and what Kai says when he picks one, beats, processes, hints, fragments), every
// built level (the people's lines, conversations, barks and echoes, records, fragments, challenge hints),
// the edition's tables (DIALOGUE, the people's barks and echoes, the crowds' barks in each region's crowd
// voices, Kai's thoughts, the runtime's own lines, REVERSE's lines and rules) and the cinematic lines (the
// chapter and mission cards, the ending sequence, the post-credit voice). Each entry is
//   { who, text, extra: { id, fx, cue }, group, path }
// who: the speaker as hud.say sees it; extra.id: the recorded voice that says it, when the speaker is not a
// voice of its own (CREW); group: the voice pack it belongs to (§8.3); path: where the line lives.
//
// tools/voice-pack.mjs --edition lastversion records them (with the pronunciation lexicon below), the unit
// tests check every one of them is in the packs, and index.js allLines() is a thin wrapper over it.
// Nothing here is a template: a line is recorded as written, and its subtitle is the same text.
import { MISSIONS, CHAPTERS, ORDER, HINTS, HINTS_REVERSE, LINES, LINE_SPEAKERS, LastVersion } from './Runtime.js';
import { ENDINGS, EPILOGUE } from './acts.js';
import { NPCS, CAST, DIALOGUE, AMBIENT } from './npcs.js';
import { INV_LINES, INV_SPEAKERS, RULES } from './inversion.js';
import { RealityEngine } from '../../core/RealityEngine.js';
import { FactStore } from '../../core/FactStore.js';

// the voice packs: common to every chapter, then one per chapter (game/assets/voice/lv/<group>/)
export const GROUPS = ['common', 'prologue', 'act1', 'act2', 'act3', 'act4', 'finale', 'cases'];

// speakers recorded under another name: you are Kai; the voice in every speaker is the Witness's;
// Mira at nine is the Child (the part of her that stayed nine)
export const ALIAS = { YOU: 'KAI', VOICE: 'WITNESS', MIRA9: 'CHILD' };
// the recorded voice a line is said in
export const voiceOf = (who, extra = {}) => extra?.id || ALIAS[who] || who;

// --- the cinematic lines ---------------------------------------------------------------------------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numberWords(n) {
  n = Math.floor(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberWords(n % 100) : '');
  if (n < 1e6) return numberWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + numberWords(n % 1000) : '');
  return String(n);
}
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);
export const titleCase = (s) => String(s).toLowerCase().split(' ').map((w, i) => (i && SMALL.has(w) ? w : w.replace(/^(\W*)(\w)/, (m, a, b) => a + b.toUpperCase()))).join(' ');

// a chapter's card, spoken by the narrator: its name, then the bible's question
export function chapterCardLines(chapter) {
  const c = CHAPTERS[chapter];
  if (!c) return [];
  return [{ who: 'NONE', text: c.say }, { who: 'NONE', text: c.question }];
}

// a mission's card: "Mission four. The Man from the Last Day." and its logline
export function missionCardLines(m) {
  const n = typeof m.n === 'number' ? `Mission ${numberWords(m.n)}` : `Case ${m.n}`;
  return [{ who: 'NONE', text: `${n}. ${titleCase(m.name)}.` }, ...((m.logline || m.subtitle) ? [{ who: 'NONE', text: m.logline || m.subtitle }] : [])];
}

// what Kai says when he picks a choice: its label (or what it says aloud), unless it is mute
export const choiceLine = (c) => (c && !c.mute && (c.say || c.label) ? { who: 'KAI', text: c.say || c.label } : null);

// the ending sequence (OVERHAUL.md §8.9, §5 M23): the bible's text, the ending's own added lines, the
// bible's quote in Kai's voice (C through the echo), then one line per consequence the player set
export function endingLines(key, facts = null) {
  const e = ENDINGS[key];
  if (!e) return [];
  const quote = { who: 'KAI', text: e.text[1], ...(key === 'C' ? { voice: { fx: 'echo' } } : {}) };
  return [{ who: 'NONE', text: e.text[0] }, ...(e.after || []), quote, ...EPILOGUE.filter((l) => !facts || facts.test(l.when))];
}
// after the epilogue: four clock ticks, then the voice in every speaker
export const POSTCREDIT = [{ who: 'VOICE', text: 'Version one hundred and eighteen.', voice: { fx: 'pa' } }];

// --- the pronunciation lexicon (§8.5): what the recording says; the subtitle (and the key) keep the digits --------
const YEARS = { 2049: 'twenty forty-nine', 2026: 'twenty twenty-six', 2196: 'twenty-one ninety-six', 2017: 'twenty seventeen', 2031: 'twenty thirty-one', 2061: 'twenty sixty-one' };
const ROMAN = { I: 'One', II: 'Two', III: 'Three', IV: 'Four' };
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORD = { 1: 'first', 2: 'second', 3: 'third', 5: 'fifth', 8: 'eighth', 9: 'ninth', 12: 'twelfth' };
export const ordinalWords = (n) => {
  if (ORD[n]) return ORD[n];
  if (n > 20 && n % 10 && n < 100) return `${TENS[Math.floor(n / 10)]}-${ordinalWords(n % 10)}`;
  const w = numberWords(n);
  return w.endsWith('y') ? `${w.slice(0, -1)}ieth` : `${w}th`;
};
export const yearWords = (y) => YEARS[y] || (y % 100 === 0 ? `${numberWords(y / 100)} hundred` : `${numberWords(Math.floor(y / 100))} ${y % 100 < 10 ? `oh ${ONES[y % 100]}` : numberWords(y % 100)}`);
// h:mm: a leading 0 is read "oh" (05:40, "oh five forty"); on the hour, "hundred" after an "oh", else "o'clock"
const clockWords = (h, mm) => `${h.length === 2 && h[0] === '0' ? `oh ${ONES[+h]}` : numberWords(+h)} ${+mm === 0 ? (h[0] === '0' ? 'hundred' : "o'clock") : +mm < 10 ? `oh ${ONES[+mm]}` : numberWords(+mm)}`;
export const LEXICON = [
  [/\bV\.\s?(\d+)\b/gi, (m, n) => `Version ${numberWords(+n)}`],
  [/\b(\d{1,2}):(\d{2})\b/g, (m, h, mm) => clockWords(h, mm)],
  [/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g, (m, d, mo, y) => `the ${ordinalWords(+d)} of ${MONTHS[+mo] || numberWords(+mo)}, ${yearWords(+y)}`],
  [/\bact (iv|iii|ii|i)\b/gi, (m, r) => `Act ${ROMAN[r.toUpperCase()]}`],
  [/\bjun\b/gi, 'Joon'],
  [/\bdr\b\.?/gi, 'Doctor'],
  [/\bm\.q\./gi, 'M. Q.'],
  [/\b(\d+)-([a-z])\b/gi, (m, n, l) => `${numberWords(+n)} ${l.toUpperCase()}`],
  [/\b(\d+)(?:th|st|nd|rd)\b/gi, (m, n) => ordinalWords(+n)],
  [/\b(\d+)\s?(?:KM|km)\b/g, (m, n) => `${numberWords(+n)} kilometres`],
  [/\bKM\b/g, 'kilometres'],
  [/\b(\d+)\s?%/g, (m, n) => `${numberWords(+n)} percent`],
  [/(^|[\s(])-(\d+)\b/g, (m, a, n) => `${a}minus ${numberWords(+n)}`],
  [/\bBC\b/g, 'B.C.'],
  [/\s\+\s/g, ' and '],
  [/\s·\s/g, ', '],
  [/\b(1\d\d\d|20\d\d|21\d\d)\b/g, (m, y) => yearWords(+y)],
  [/\b(\d{1,3}(?:,\d{3})+|\d+)\b/g, (m, n) => numberWords(+n.replace(/,/g, ''))],
];
// the text a recording says (the subtitle keeps what is written): no digits are left for the voice to guess, and
// a word in capitals inside a sentence (a sign, a name on a drawing: KAI + MIRA) is read as a word, not spelled
export function lexicon(text) {
  let s = String(text);
  for (const [re, to] of LEXICON) s = s.replace(re, to);
  if (/[a-z]/.test(s)) s = s.replace(/\b([A-Z])([A-Z']+)\b/g, (m, a, b) => a + b.toLowerCase());
  return s;
}

// --- the walk --------------------------------------------------------------------------------------------
const vidOf = (id) => NPCS[id]?.vid ?? null;
const castVid = (i) => (i != null && CAST[i] ? CAST[i].vid : null);

// every level, built the way the runtime builds it (Runtime.buildLevel, with a stand-in game)
export function buildLevels() {
  const out = [];
  for (const ch of Object.keys(MISSIONS)) {
    const game = { engine: new RealityEngine({ slots: 0, unlocked: 0, laws: [], states: ['PRESENT', 'PAST', 'FUTURE'], baseline: 'PRESENT', residue: 'PAST', stateEffects: { PAST: { echoVisible: true, echoSolid: true } } }), facts: new FactStore(), story: null };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: { states: ['PRESENT', 'PAST', 'FUTURE'], labels: { PRESENT: '2049', PAST: '2026', FUTURE: '2196' } } });
    game.story = rt.makeStory(ch);
    game.story.decks.forEach((deck, d) => {
      for (let s = 0; s < deck.sectors; s++) out.push({ ch, deck, s, level: rt.buildLevel({ lv: true, chapter: ch, deck: d, sector: s, flags: {} }) });
    });
  }
  return out;
}

export function spokenLines({ levels = true } = {}) {
  const out = [];
  const seen = new Set(); // the line objects already walked (the safety net below skips them)
  const add = (group, path, who, text, extra = {}) => {
    if (!who || typeof text !== 'string' || !text.trim()) return;
    const x = {};
    for (const k of ['id', 'fx', 'cue']) if (extra?.[k]) x[k] = extra[k];
    out.push({ who, text, extra: x, group, path });
  };
  // a line object: { who, text, voice? }; a CREW line takes the voice of the person saying it (vid)
  const line = (group, path, l, vid = null) => {
    if (!l || typeof l !== 'object' || typeof l.text !== 'string') return;
    seen.add(l);
    const extra = { ...(l.voice || {}) };
    if (l.who === 'CREW' && !extra.id && vid) extra.id = vid;
    add(group, path, l.who, l.text, extra);
  };
  const lines = (group, path, ls, vid) => (Array.isArray(ls) ? ls : []).forEach((l, i) => line(group, `${path}[${i}]`, l, vid));
  // what goes in the case log, Kai reads aloud from the case board (▶)
  const log = (group, path, o) => typeof o?.log === 'string' && !/[<>]/.test(o.log) && add(group, `${path}.log`, 'KAI', o.log);
  const choice = (group, path, c, vid) => {
    const said = choiceLine(c);
    if (said) add(group, `${path}.label`, said.who, said.text);
    lines(group, `${path}.lines`, c.lines, vid);
    lines(group, `${path}.after`, c.after, vid);
    log(group, path, c);
  };
  const node = (group, path, n, vid) => {
    if (!n || typeof n !== 'object') return;
    lines(group, `${path}.lines`, n.lines, vid);
    lines(group, `${path}.after`, n.after, vid);
    (n.choices || []).forEach((c, i) => choice(group, `${path}.choice${i}`, c, vid));
    log(group, path, n);
  };
  // anything else in a mission that looks like a line (a new field a later unit adds): the safety net
  const net = (group, path, o, depth = 0, stack = new Set()) => {
    if (!o || typeof o !== 'object' || stack.has(o) || depth > 12) return;
    stack.add(o);
    if (Array.isArray(o)) o.forEach((x, i) => net(group, `${path}[${i}]`, x, depth + 1, stack));
    else {
      if (typeof o.text === 'string' && typeof o.who === 'string' && !seen.has(o)) line(group, path, o);
      for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && !['model', 'parts', 'props', 'bolts'].includes(k)) net(group, `${path}.${k}`, v, depth + 1, stack);
    }
    stack.delete(o);
  };

  // --- the missions -------------------------------------------------------------------------------------
  for (const ch of Object.keys(MISSIONS)) {
    for (const m of MISSIONS[ch]) {
      const P = m.key;
      const mvid = castVid(m.crew);
      lines(ch, `${P}.intro`, m.intro);
      lines(ch, `${P}.outro`, m.outro);
      if (m.coldOpen) lines(ch, `${P}.coldOpen`, m.coldOpen.lines);
      if (m.hook) lines(ch, `${P}.hook`, m.hook.lines);
      for (const [k, ls] of Object.entries(m.spoken || {})) lines(ch, `${P}.spoken.${k}`, ls);
      (m.rules || []).forEach((r) => lines(ch, `${P}.rule:${r.id}`, r.say));
      // (a scene, a task, a beat's closing lines and a rule are said as written: a CREW line there names its own voice)
      for (const [k, sc] of Object.entries(m.scenes || {})) node(ch, `${P}.scene:${k}`, sc, null);
      (m.hints || []).forEach((h, i) => (h.tiers || []).forEach((t, j) => add(ch, `${P}.hint${i}.${j}`, 'KAI', t)));
      (m.fragments || []).flat().forEach((t, i) => add(ch, `${P}.fragment${i}`, 'NONE', t));
      (m.beats || []).forEach((b, i) => {
        const bp = `${P}.beat${i}(${b.kind})`;
        const vid = b.crew != null ? castVid(b.crew) : b.npc ? vidOf(b.npc) : mvid;
        lines(ch, `${bp}.lines`, b.lines, vid);
        lines(ch, `${bp}.after`, b.after, null);
        (b.choices || []).forEach((c, j) => choice(ch, `${bp}.choice${j}`, c, vid));
        if (b.log && typeof b.log === 'object') add(ch, `${bp}.log`, b.log.who || 'NONE', b.log.text, { fx: 'recording' });
        if (b.kind === 'contradiction') {
          add(ch, `${bp}.official`, 'NONE', b.official);
          add(ch, `${bp}.echo`, 'NONE', b.echo);
          if (typeof b.log === 'string') add(ch, `${bp}.log`, 'KAI', b.log);
        } else if (typeof b.log === 'string') add(ch, `${bp}.log`, 'KAI', b.log);
        (b.tasks || []).forEach((t, j) => {
          lines(ch, `${bp}.task${j}.lines`, t.lines, null);
          if (t.state) add(ch, `${bp}.task${j}.no`, 'KAI', t.no || LINES['task_' + t.state]);
        });
      });
      for (const p of m.processes || []) {
        (p.hints || []).forEach((t, j) => add(ch, `${P}.process:${p.id}.hint${j}`, 'KAI', t));
        if (p.line) add(ch, `${P}.process:${p.id}.line`, 'KAI', p.line);
        if (p.clip?.text) add(ch, `${P}.process:${p.id}.clip`, p.clip.who || 'NONE', p.clip.text, { fx: 'recording' });
      }
      // threads, sides, talks and deductions (U6 on): the shape §3.3 gives them
      for (const q of m.quarters || []) {
        for (const t of q.threads || []) (t.hints || []).forEach((h, j) => add(ch, `${P}.thread:${t.id}.hint${j}`, 'KAI', h));
        for (const sd of q.sides || []) lines(ch, `${P}.side:${sd.id}.hook`, sd.hook, vidOf(sd.giver));
        lines(ch, `${P}.quarter:${q.name}.barks`, q.barks);
      }
      for (const [id, nodes] of Object.entries(m.talks || {})) (nodes || []).forEach((d, j) => node(ch, `${P}.talk:${id}${j}`, d, vidOf(id)));
      for (const [id, d] of Object.entries(m.deductions || {})) (d.answers || []).forEach((a, j) => lines(ch, `${P}.deduce:${id}${j}`, a.lines));
      if (ch === 'finale') {
        for (const k of Object.keys(ENDINGS)) lines(ch, `ending:${k}`, endingLines(k));
        lines(ch, 'postcredit', POSTCREDIT);
      }
      net(ch, P, m);
    }
  }

  // --- every built level: the people, the records, the fragments, the challenges ------------------------
  if (levels) {
    const once = new Set();
    for (const { ch, deck, s, level } of buildLevels()) {
      const P = `${deck.mkey}#${s}`;
      for (const n of level.npcs) {
        const def = NPCS[n.crew];
        const k = `${deck.mkey}:${n.id}:${n.crew}`;
        if (once.has(k)) continue;
        once.add(k);
        const vid = def?.vid ?? n.voiceExtra?.id ?? null;
        lines(ch, `${P}.npc:${n.id}.lines`, n.lines, vid);
        lines(ch, `${P}.npc:${n.id}.after`, n.after, vid);
        (n.choices || []).forEach((c, j) => choice(ch, `${P}.npc:${n.id}.choice${j}`, c, vid));
        (n.dialogue || []).forEach((d, j) => node(ch, `${P}.npc:${n.id}.dialogue${j}`, d, vid));
        const who = n.voice || def?.voice || 'CREW';
        (n.barks || []).forEach((t, j) => add(ch, `${P}.npc:${n.id}.bark${j}`, who, t, n.voiceExtra || (vid ? { id: vid } : {})));
        lines(ch, `${P}.npc:${n.id}.echoLines`, n.echoLines, vid);
      }
      for (const it of level.interactables) {
        if (it.kind === 'fragment') add(ch, `${P}.fragment:${it.id}`, 'NONE', it.text);
        if (it.kind === 'terminal' && it.log) add(ch, `${P}.record:${it.id}`, it.log.who || 'NONE', it.log.text, { fx: 'recording' });
        if (it.kind === 'socket' && it.only) add(ch, `${P}.socket:${it.id}`, 'KAI', it.no || LINES.socket_year);
      }
      for (const r of level.order) for (const c of level.rooms[r].challenges || []) (c.hints || []).forEach((t, j) => add(ch, `${P}.challenge:${c.key}.${j}`, 'KAI', t));
    }
  }

  // --- the edition's tables (every chapter): common ------------------------------------------------------
  for (const [id, nodes] of Object.entries(DIALOGUE)) nodes.forEach((d, j) => node('common', `DIALOGUE.${id}${j}`, d, vidOf(id)));
  for (const n of Object.values(NPCS)) {
    (n.barks || []).forEach((t, j) => add('common', `NPCS.${n.id}.bark${j}`, n.voice, t, n.voice === 'CREW' ? { id: n.vid } : {}));
    lines('common', `NPCS.${n.id}.echo`, n.echo, n.vid);
  }
  // (a crowd's barks are its region's AMBIENT barks, said in the crowd voice crowds.js gave each person from the
  // region's pool: the level walk above records exactly those pairs; the casting does not depend on facts)
  // without the levels, every voice of each pool
  if (!levels) {
    for (const [k, a] of Object.entries(AMBIENT)) {
      const ids = [...new Set(Object.values(a.voices || {}).flat())];
      for (const id of ids) a.barks.forEach((t, j) => add('common', `AMBIENT.${k}.bark${j}(${id})`, 'CREW', t, { id }));
    }
  }
  for (const [k, tiers] of Object.entries(HINTS)) tiers.forEach((t, j) => add('common', `HINTS.${k}.${j}`, 'KAI', t));
  for (const [k, tiers] of Object.entries(HINTS_REVERSE)) tiers.forEach((t, j) => add('common', `HINTS_REVERSE.${k}.${j}`, 'KAI', t));
  for (const [k, t] of Object.entries(LINES)) add('common', `LINES.${k}`, LINE_SPEAKERS[k] || 'KAI', t);
  for (const [k, t] of Object.entries(INV_LINES)) add('common', `INV_LINES.${k}`, INV_SPEAKERS[k] || 'KAI', t, k === 'intercom' ? { fx: 'pa' } : {});
  for (const [k, t] of RULES) add('common', `RULES.${k}`, 'NONE', t);
  // the cards: every chapter's, every mission's
  for (const ch of [...ORDER, 'cases']) lines('common', `card:${ch}`, chapterCardLines(ch));
  for (const ch of Object.keys(MISSIONS)) for (const m of MISSIONS[ch]) lines('common', `card:${m.key}`, missionCardLines(m));
  return out;
}

// the speech budget (§8.10): spoken words per group
export function wordsPerGroup(list = spokenLines()) {
  const out = {};
  const seen = new Set();
  for (const e of list) {
    const k = `${voiceOf(e.who, e.extra)}|${e.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out[e.group] = (out[e.group] || 0) + e.text.split(/\s+/).length;
  }
  return out;
}
