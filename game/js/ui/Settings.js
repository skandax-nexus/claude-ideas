// Player settings: camera comfort, controls, graphics quality, audio.
// Stored per device in localStorage (wrapped: private windows may refuse).

const KEY = 'afterzero.settings.v1';

export const CAMERA_PRESETS = {
  close: { label: 'CLOSE', dist: 2.3, shoulder: 0.45, lift: 0.25 },
  standard: { label: 'STANDARD', dist: 3.6, shoulder: 0.5, lift: 0.35 },
  far: { label: 'FAR', dist: 6.0, shoulder: 0.35, lift: 0.9 },
  overview: { label: 'OVERVIEW', dist: 9.0, shoulder: 0.0, lift: 2.8 },
};

export const QUALITY = {
  low: { label: 'LOW', pixelRatio: 1, shadows: false, shadowMap: 512, bloom: false, ao: false, env: false },
  medium: { label: 'MEDIUM', pixelRatio: 1.5, shadows: true, shadowMap: 1024, bloom: true, ao: false, env: true, msaa: 2 },
  high: { label: 'HIGH', pixelRatio: 2, shadows: true, shadowMap: 2048, bloom: true, ao: true, env: true, msaa: 4 },
};

export function defaultSettings(touch) {
  return {
    camera: 'standard',
    zoom: 1, // multiplies the preset distance (wheel / pinch / buttons)
    fov: touch ? 70 : 62,
    sensitivity: 1,
    invertY: false,
    comfort: false, // instant gravity flips, steadier camera, no screen flashes
    quality: touch ? 'medium' : 'high',
    minimap: true,
    volume: 0.8,
    textSize: 1,
  };
}

export function loadSettings(touch, softwareGL = false) {
  const d = defaultSettings(touch);
  if (softwareGL) d.quality = 'low'; // no GPU: keep it smooth
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) Object.assign(d, JSON.parse(raw));
  } catch {
    /* defaults */
  }
  if (!CAMERA_PRESETS[d.camera]) d.camera = 'standard';
  if (!QUALITY[d.quality]) d.quality = 'medium';
  return d;
}

export function saveSettings(s) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* not persisted */
  }
}
