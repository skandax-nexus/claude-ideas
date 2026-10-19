// Which edition of AFTERZERO this page is: the Station Zero game (default) or
// AFTERZERO: THE LAST VERSION OF EARTH (window.AZ_EDITION = 'lastversion', set by
// the edition's build, or ?edition=lastversion on the URL). Each edition keeps
// its own saves, settings and look under its own localStorage prefix, so one
// edition's games never show in the other.

export const EDITIONS = ['lastversion'];

function detect() {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search).get('edition');
    if (q && EDITIONS.includes(q)) return q;
  } catch {
    /* no location */
  }
  const w = window.AZ_EDITION;
  return EDITIONS.includes(w) ? w : null;
}

export const EDITION = detect();

// storage prefix: 'afterzero.' for Station Zero, 'afterzero.lv.' for THE LAST VERSION
export const NS = EDITION ? `afterzero.${{ lastversion: 'lv' }[EDITION]}.` : 'afterzero.';
