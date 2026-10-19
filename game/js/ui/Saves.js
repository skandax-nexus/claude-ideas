// Save slots. A new game picks one of three slots and autosaves into it as you
// play (each slot remembers which chapter it belongs to: the prologue,
// HALCYON, the Cradle, the vessel, a Story Studio tale or a WORLD FORGE game). The old single
// autosave is still readable. Each entry stores the game state plus a little
// metadata. The last prologue ending reached is kept apart from the slots.

import { NS, EDITION } from '../core/Edition.js';

// each edition keeps its own slots (afterzero.slot.N / afterzero.lv.slot.N)
const SLOT_KEY = (i) => `${NS}slot.${i}`;
const AUTO_KEY = EDITION ? `${NS}save.v1` : 'afterzero.save.v1'; // the v0.1/v0.2 single save doubles as the autosave
export const SLOTS = 10;

function store(fn, fallback = null) {
  try {
    return fn(window.localStorage);
  } catch {
    return fallback;
  }
}

export function writeSave(slot, data, meta) {
  const key = slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot);
  const entry = { ...data, meta: { ...meta, savedAt: Date.now() } };
  return store((s) => {
    s.setItem(key, JSON.stringify(entry));
    return true;
  }, false);
}

export function readSave(slot) {
  const key = slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot);
  const raw = store((s) => s.getItem(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteSave(slot) {
  store((s) => s.removeItem(slot === 'auto' ? AUTO_KEY : SLOT_KEY(slot)));
}

export function listSaves() {
  const out = [{ slot: 'auto', data: readSave('auto') }];
  for (let i = 0; i < SLOTS; i++) out.push({ slot: i, data: readSave(i) });
  return out;
}

export function latestSave() {
  let best = null;
  for (const s of listSaves()) {
    if (!s.data) continue;
    const t = s.data.meta?.savedAt || 0;
    if (!best || t > (best.data.meta?.savedAt || 0)) best = s;
  }
  return best;
}

// an edition replaces the chapter list (setChapters) before any save is described
export let CHAPTERS = {
  prologue: { name: 'PROLOGUE', sub: 'Station Zero, HALCYON, the machine' },
  halcyon: { name: 'HALCYON', sub: 'Four open districts above Station Zero' },
  vessel: { name: 'THE VESSEL', sub: 'Eight generated decks, a crew, a culprit' },
  cradle: { name: 'THE CRADLE', sub: 'Beneath Station Zero, where Halcyon sleeps' },
  studio: { name: 'STORY STUDIO', sub: 'A vessel story made from your wishes' },
  forge: { name: 'WORLD FORGE', sub: 'Build your own game: your genre, your locations, their rules, your cast and kit' },
};

export function setChapters(c) {
  CHAPTERS = c;
}

// The last prologue ending reached on this device, so chapters started from the menu (after the
// page reload every new start goes through) still play in the world that choice made.
export const ENDING_TITLES = { SEVER: 'SEVERED', SUSTAIN: 'SUSTAINED', MIRROR: 'OBSERVED' };
const ENDING_KEY = `${NS}lastEnding`;
export function rememberEnding(key, lessons = []) {
  store((s) => s.setItem(ENDING_KEY, JSON.stringify({ key, lessons })));
}
export function lastEnding() {
  const raw = store((s) => s.getItem(ENDING_KEY));
  try {
    const v = raw && JSON.parse(raw);
    return v && ENDING_TITLES[v.key] ? v : null;
  } catch {
    return null;
  }
}

// the most recent save of one chapter
export function latestFor(chapter) {
  let best = null;
  for (const s of listSaves()) {
    if (!s.data || (s.data.meta?.run || 'prologue') !== chapter) continue;
    if (!best || (s.data.meta?.savedAt || 0) > (best.data.meta?.savedAt || 0)) best = s;
  }
  return best;
}

export function describeSave(d) {
  if (!d) return { title: 'EMPTY', sub: '' };
  const m = d.meta || {};
  const mins = Math.round((d.playTime || 0) / 60);
  const h = Math.floor(mins / 60);
  const time = h ? `${h} h ${mins % 60} min` : `${mins} min`;
  const when = m.savedAt ? new Date(m.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return { title: m.where || 'STATION ZERO', run: CHAPTERS[m.run || 'prologue']?.name || 'PROLOGUE', sub: `${m.chapter || ''}${m.chapter ? ' · ' : ''}${time}${when ? ' · ' + when : ''}` };
}
