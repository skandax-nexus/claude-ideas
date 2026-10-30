// Seeded randomness. Every generated deck, room and line of story comes from
// a campaign seed, so a save only needs the seed and progress to rebuild the
// exact same vessel.

export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A small toolbox around one stream.
export class Rng {
  constructor(seed) {
    this.next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  }

  static from(...parts) {
    return new Rng(hashString(parts.join('|')));
  }

  float(a = 0, b = 1) {
    return a + (b - a) * this.next();
  }

  int(a, b) {
    return Math.floor(this.float(a, b + 1));
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // weighted pick: [[item, weight], ...]
  weighted(pairs) {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [item, w] of pairs) {
      r -= w;
      if (r <= 0) return item;
    }
    return pairs[pairs.length - 1][0];
  }

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
