// Tiny condition language used by all authored content (map elements,
// dialogue variants, story rules, objective layers).
//
//   machine_activated && !vault_seen
//   @ECHO || (times_caught >= 2 && !observer_tethered)
//
// Identifiers resolve to facts (missing facts are false/0).
// @STATE is true when the room being evaluated is in that reality state.
// Comparisons: == != >= <= > < against numbers, true/false, "strings" or identifiers.

const TOKEN = /\s*(&&|\|\||==|!=|>=|<=|[!()<>]|@[A-Z]+|"[^"]*"|'[^']*'|[A-Za-z_][\w.]*|-?\d+(?:\.\d+)?)/y;

function tokenize(src) {
  const out = [];
  TOKEN.lastIndex = 0;
  let m;
  while (TOKEN.lastIndex < src.length) {
    if (/^\s*$/.test(src.slice(TOKEN.lastIndex))) break;
    m = TOKEN.exec(src);
    if (!m) throw new Error(`Bad condition near "${src.slice(TOKEN.lastIndex)}" in "${src}"`);
    out.push(m[1]);
  }
  return out;
}

function parse(src) {
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i];
  const next = () => t[i++];
  const expect = (v) => {
    if (next() !== v) throw new Error(`Expected "${v}" in "${src}"`);
  };

  function value() {
    const tok = next();
    if (tok === undefined) throw new Error(`Unexpected end of "${src}"`);
    if (tok.startsWith('@')) {
      const s = tok.slice(1);
      return (ctx) => ctx.state === s;
    }
    if (/^-?\d/.test(tok)) {
      const n = Number(tok);
      return () => n;
    }
    if (tok[0] === '"' || tok[0] === "'") {
      const str = tok.slice(1, -1);
      return () => str;
    }
    if (tok === 'true') return () => true;
    if (tok === 'false') return () => false;
    return (ctx) => ctx.fact(tok);
  }
  function cmp() {
    const a = value();
    const op = peek();
    if (['==', '!=', '>=', '<=', '>', '<'].includes(op)) {
      next();
      const b = value();
      switch (op) {
        case '==': return (c) => a(c) == b(c); // eslint-disable-line eqeqeq
        case '!=': return (c) => a(c) != b(c); // eslint-disable-line eqeqeq
        case '>=': return (c) => (a(c) || 0) >= (b(c) || 0);
        case '<=': return (c) => (a(c) || 0) <= (b(c) || 0);
        case '>': return (c) => (a(c) || 0) > (b(c) || 0);
        case '<': return (c) => (a(c) || 0) < (b(c) || 0);
      }
    }
    return (c) => !!a(c);
  }
  function primary() {
    if (peek() === '(') {
      next();
      const e = or();
      expect(')');
      return e;
    }
    return cmp();
  }
  function unary() {
    if (peek() === '!') {
      next();
      const e = unary();
      return (c) => !e(c);
    }
    return primary();
  }
  function and() {
    let e = unary();
    while (peek() === '&&') {
      next();
      const l = e, r = unary();
      e = (c) => l(c) && r(c);
    }
    return e;
  }
  function or() {
    let e = and();
    while (peek() === '||') {
      next();
      const l = e, r = and();
      e = (c) => l(c) || r(c);
    }
    return e;
  }
  const fn = or();
  if (i !== t.length) throw new Error(`Unexpected "${t[i]}" in "${src}"`);
  return fn;
}

const cache = new Map();

export function compileCondition(src) {
  if (src === undefined || src === null || src === '') return () => true;
  if (typeof src === 'function') return src;
  let fn = cache.get(src);
  if (!fn) {
    fn = parse(src);
    cache.set(src, fn);
  }
  return fn;
}

export function evaluate(src, ctx) {
  return !!compileCondition(src)(ctx);
}
