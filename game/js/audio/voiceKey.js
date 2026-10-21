// Splits a line of dialogue into the pieces the voice pack recorded: fixed
// phrases, plus generated words (crew names, places, deck names) recorded on
// their own, so generated lines can be spoken by splicing recordings together.
// Shared by the game (audio/Voice.js) and the pack builder (tools/voice-pack.mjs).

export function plain(text) {
  const t = String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  // TICK and the records speak in capitals; say them in normal case
  return /[a-z]/.test(t) ? t : t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
}

export const pieceKey = (s) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

let cached = null;
function matcher(vocab) {
  if (cached && cached.vocab === vocab) return cached.re;
  const esc = [...new Set(vocab.map((v) => v.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`\\b(?:${esc.join('|')})(?:'s)?\\b`, 'gi');
  cached = { vocab, re };
  return re;
}

// -> [{ say: 'text to record', key }, { pause: seconds }]
export function voicePieces(text, vocab) {
  const t = plain(text);
  const out = [];
  const lit = (s) => {
    for (const part of s.split(/(\s+-\s+|[.!?]\s+)/)) {
      if (!part) continue;
      if (!/[a-z0-9]/i.test(part)) {
        out.push({ pause: /[.!?]/.test(part) ? 0.28 : /-/.test(part) ? 0.22 : 0.08 });
        continue;
      }
      const say = part.trim();
      out.push({ say, key: pieceKey(say) });
    }
  };
  let last = 0;
  for (const m of t.matchAll(matcher(vocab))) {
    if (m.index > last) lit(t.slice(last, m.index));
    out.push({ say: m[0], key: pieceKey(m[0]), word: true });
    last = m.index + m[0].length;
  }
  if (last < t.length) lit(t.slice(last));
  // a piece that is only punctuation-glued filler ("'s", ",") is dropped
  return out.filter((p) => p.pause || p.key);
}
