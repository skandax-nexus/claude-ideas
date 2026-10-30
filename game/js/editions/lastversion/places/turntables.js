// THE LAST VERSION OF EARTH: turning platforms (Mission 7's turntables; the bible's "Traverse rooftops, rotating
// platforms and an exterior ring"). A turntable carries a bronze gangway that sweeps round it. Where the gangway
// points at the next platform it stops for a few seconds and bridges the gap (its stepped colliders, rising to the
// next platform's top); then it turns on, and the gap is a gap again. In a year where the machine is seized the
// gangway stands where it stopped, and in one where it has fallen there is none.
//
// Pure: the angle, whether it bridges and its steps are worked out here (the unit tests run them); places/mount.js
// draws the gangways, turns them and adds and removes the steps' colliders.
//   { id, c: [x, z], top, to, r0, r1, w, period, dwell, phase,
//     years: { PAST: 'turn', PRESENT: <seized angle>, FUTURE: null } }   (the bridged bearing is +x, angle 0)
//   top: the turntable's own top; to: the next one's; r0 .. r1: the gangway's reach from the centre (from this
//   platform's edge to the next one's)

export const TOL = 0.05; // radians either side of the bearing where the gangway still bridges (about 3°)

// the gangway's angle in a year at time t (null: it has fallen); 0 points at the next platform
export function armAngle(tt, state, t) {
  const y = tt.years?.[state];
  if (y === undefined || y === null) return null;
  if (typeof y === 'number') return y;
  const P = tt.period, d = tt.dwell;
  const u = (((t + (tt.phase || 0)) % P) + P) % P;
  return u < d ? 0 : (2 * Math.PI * (u - d)) / (P - d);
}

// does it bridge the gap now
export function bridging(tt, state, t) {
  const a = armAngle(tt, state, t);
  if (a === null) return false;
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < TOL;
}

// its steps while it bridges, in the world: [x0, y0, z0, x1, y1, z1] each, 0.34 m a rise at most
export function armSteps(tt) {
  const n = Math.max(1, Math.ceil(Math.abs(tt.to - tt.top) / 0.34));
  const [cx, cz] = tt.c, hw = (tt.w || 1.6) / 2, tread = (tt.r1 - tt.r0) / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const top = tt.top + ((tt.to - tt.top) * (i + 1)) / n;
    out.push([cx + tt.r0 + i * tread - (i ? 0 : 0.2), top - 0.3, cz - hw, cx + tt.r0 + (i + 1) * tread + (i === n - 1 ? 0.2 : 0), top, cz + hw]);
  }
  return out;
}
