// Save slots: three manual slots plus an autosave. Each entry stores the
// game state plus a little metadata for the load screen.

const SLOT_KEY = (i) => `afterzero.slot.${i}`;
const AUTO_KEY = 'afterzero.save.v1'; // the v0.1/v0.2 single save doubles as the autosave
export const SLOTS = 3;

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

export function describeSave(d) {
  if (!d) return { title: 'EMPTY', sub: '' };
  const m = d.meta || {};
  const mins = Math.round((d.playTime || 0) / 60);
  const h = Math.floor(mins / 60);
  const time = h ? `${h} h ${mins % 60} min` : `${mins} min`;
  const when = m.savedAt ? new Date(m.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return { title: m.where || 'STATION ZERO', sub: `${m.chapter || ''}${m.chapter ? ' · ' : ''}${time}${when ? ' · ' + when : ''}` };
}
