// THE LAST VERSION OF EARTH: every mission can be played on foot (U3 review). A flood fill from each mission's spawn
// over its colliders, in every year it has (tests/lastversion-reach.mjs), must reach every interaction, every person
// who speaks, every crowd, every trigger a thread waits on and every REVERSE process; for an unstable mission, with no
// stretch outside its home year longer than DRAIN_BUDGET. Nobody stands on nothing. The browser bot places Kai where a
// straight walk does not get there, so this is what proves the places can be walked. (Run in parallel workers: the
// fill takes about a minute and a half on one core.)
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { allMissions, DRAIN_BUDGET } from './lastversion-reach.mjs';

test('every mission can be walked: from its spawn Kai reaches everything its threads ask for, and nobody stands on nothing', async () => {
  const jobs = await allMissions();
  assert.ok(jobs.length >= 25, `${jobs.length} missions and case files`);
  const n = Math.max(1, Math.min(4, (os.availableParallelism?.() || os.cpus().length) - 1));
  // (the biggest places first, dealt round the workers)
  const parts = Array.from({ length: n }, () => []);
  jobs.forEach((j, i) => parts[i % n].push(j));
  const results = (await Promise.all(parts.map((reach) => new Promise((resolve, reject) => {
    const w = new Worker(new URL('./lastversion-reach.mjs', import.meta.url), { workerData: { reach } });
    w.once('message', resolve);
    w.once('error', reject);
    w.once('exit', (code) => code && reject(new Error(`worker exit ${code}`)));
  })))).flat();
  assert.equal(results.length, jobs.length);
  for (const r of results) {
    const missing = r.missing.filter((m) => m.what !== 'silent person');
    const say = (m) => `${m.what} ${m.id}${m.crew ? ` (${m.crew})` : ''} at ${m.at.map((v) => +(+v).toFixed(1))}`;
    assert.ok(r.nodes > 1000, `${r.mkey}: the fill got going (${r.nodes} places to stand)`);
    assert.deepEqual(missing.map(say), [], `${r.mkey}: out of reach${r.unstable ? ` (at most ${DRAIN_BUDGET} m at a stretch outside its home year)` : ''}`);
    assert.deepEqual(r.floating.map((f) => `${f.id} (${f.crew}) at ${f.at}`), [], `${r.mkey}: people standing on nothing`);
  }
});
