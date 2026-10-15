// The law language run by the reality device.
//
// A law is three tokens:  SUBJECT  VERB  TARGET
//   GRAVITY      INVERTS IN        INVERTED
//   HELD MATTER  PERSISTS THROUGH  ALL STATES
//
// The player finds tokens in the world and composes laws in the device's
// slots. The engine compiles installed laws into a set of effects that the
// rest of the game queries (gravity, item persistence, Observer, echoes).
// Adding a new law = adding a token and a GRAMMAR entry, then querying the
// effect wherever it matters.

export const STATES = ['PHYSICAL', 'INVERTED', 'ECHO'];

export const TOKENS = {
  GRAVITY: { kind: 'subject', label: 'GRAVITY' },
  HELD: { kind: 'subject', label: 'HELD MATTER' },
  OBSERVER: { kind: 'subject', label: 'OBSERVER' },
  ECHOES: { kind: 'subject', label: 'ECHOES' },

  INVERTS: { kind: 'verb', label: 'INVERTS IN' },
  FREEZES: { kind: 'verb', label: 'FREEZES IN' },
  PERSISTS: { kind: 'verb', label: 'PERSISTS THROUGH' },
  SOLIDIFIES: { kind: 'verb', label: 'SOLIDIFY IN' },

  PHYSICAL: { kind: 'target', label: 'PHYSICAL', states: ['PHYSICAL'] },
  INVERTED: { kind: 'target', label: 'INVERTED', states: ['INVERTED'] },
  ECHO: { kind: 'target', label: 'ECHO', states: ['ECHO'] },
  ALL: { kind: 'target', label: 'ALL STATES', states: STATES },
};

// SUBJECT + VERB -> effect. Anything not listed is a syntax fault.
export const GRAMMAR = {
  'GRAVITY INVERTS': { effect: 'gravityFlip', text: 'Gravity reverses in rooms set to {T}.' },
  'GRAVITY FREEZES': { effect: 'zeroG', text: 'Gravity stops in rooms set to {T}.' },
  'HELD PERSISTS': { effect: 'heldPersists', text: 'Anything you carry survives a shift into {T}.' },
  'OBSERVER FREEZES': { effect: 'observerFrozen', text: 'The Observer cannot move in rooms set to {T}.' },
  'ECHOES SOLIDIFIES': { effect: 'echoSolid', text: 'Echoes become solid in rooms set to {T}.' },
  'ECHOES PERSISTS': { effect: 'echoVisible', text: 'Echoes stay visible in rooms set to {T}.' },
};

export const EFFECTS = ['gravityFlip', 'zeroG', 'heldPersists', 'observerFrozen', 'echoSolid', 'echoVisible'];

export const DEFAULT_LAWS = [{ subject: 'GRAVITY', verb: 'INVERTS', target: 'INVERTED' }, null, null];

export function describeLaw(law) {
  if (!law) return '';
  return [law.subject, law.verb, law.target].map((t) => (t && TOKENS[t] ? TOKENS[t].label : '___')).join('  ');
}

export function parseLaw(law) {
  if (!law) return { ok: true, empty: true };
  const { subject, verb, target } = law;
  if (!subject || !verb || !target) return { ok: false, error: 'INCOMPLETE LAW' };
  if (TOKENS[subject]?.kind !== 'subject') return { ok: false, error: `${subject} IS NOT A SUBJECT` };
  if (TOKENS[verb]?.kind !== 'verb') return { ok: false, error: `${verb} IS NOT A VERB` };
  if (TOKENS[target]?.kind !== 'target') return { ok: false, error: `${target} IS NOT A STATE` };
  const g = GRAMMAR[`${subject} ${verb}`];
  if (!g) return { ok: false, error: `SYNTAX FAULT: "${TOKENS[subject].label} ${TOKENS[verb].label}" MEANS NOTHING` };
  const states = TOKENS[target].states;
  return { ok: true, effect: g.effect, states, text: g.text.replace('{T}', TOKENS[target].label) };
}

export function compileLaws(laws) {
  const effects = Object.fromEntries(EFFECTS.map((e) => [e, new Set()]));
  const results = laws.map((law) => {
    const r = parseLaw(law);
    if (r.ok && !r.empty) for (const s of r.states) effects[r.effect].add(s);
    return r;
  });
  // Paradox resolution: a room cannot both lose gravity and invert it.
  const paradoxes = [];
  for (const s of effects.zeroG) {
    if (effects.gravityFlip.has(s)) {
      effects.gravityFlip.delete(s);
      paradoxes.push(`PARADOX IN ${s}: ZERO GRAVITY OVERRIDES INVERSION`);
    }
  }
  return { effects, results, paradoxes };
}
