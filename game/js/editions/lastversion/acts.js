// THE LAST VERSION OF EARTH: the campaign spine after the Prologue.
//
// Every mission is one map with soft quarters, threads and side stories, a cold open and a hook (Threads.js), in
// its own open place (places/specs/*.js). Acts I-IV and the Finale live in act1.js ... act4.js and finale.js; the
// CASE FILES (the side stories replayed, and the quest chains B and C kept as replay entries) in cases.js. This
// module gathers them for the runtime. The bible's combat is readable stealth, evasion and REVERSE here: the game
// has no combat, so soldiers, scavengers and security systems are watchers to slip past (docs/lastversion/DESIGN.md).
import { ACT1 } from './act1.js';
import { ACT2 } from './act2.js';
import { ACT3 } from './act3.js';
import { ACT4 } from './act4.js';
import { FINALE } from './finale.js';
import { CASES } from './cases.js';

export { ACT1 } from './act1.js';
export { ACT2, LOCK_ORDER } from './act2.js';
export { ACT3 } from './act3.js';
export { ACT4 } from './act4.js';
export { FINALE, ENDINGS, POSTCREDIT } from './finale.js';
export { CASES, CASE_FILES, CASE_STATES, caseState } from './cases.js';
// the epilogue's lines (one per fact the player set) are the story's ledger: ledger.js EPILOGUE
export { EPILOGUE } from './ledger.js';

export const ACTS = { act1: ACT1, act2: ACT2, act3: ACT3, act4: ACT4, finale: FINALE, cases: CASES };
