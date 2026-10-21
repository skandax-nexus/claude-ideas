// THE LAST VERSION OF EARTH: the far horizon of a place (OVERHAUL.md §4.2, §4.3). A band at r 380 that
// follows the camera, painted per year from the atlas (atlas.js horizonFor): the Ring Hill and what
// crowns it in that era, the Ridge and the observatory's glint, the Notch, the city's skylines with
// lit windows (dark in 2196), the harbour cranes, the sea, cooking smoke; each at its true bearing
// from the place, hazed toward the year's horizon. A ground skirt runs from the place's edges out to
// the band, in the year's ground colour under the scene's fog. Two draw calls; fog off on the band.
import * as THREE from '../../../../vendor/three.module.min.js';
import { horizonFor } from './atlas.js';
import { SKIES } from './years.js';

const R = 380, LO = -4, HI = 18; // the band's radius and its elevation range (degrees)
const W = 2048, H = 256;
const yOf = (e) => R * Math.tan((e * Math.PI) / 180);

// a colour mixed toward another by k
const mix = (a, b, k) => {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return `#${ca.lerp(cb, k).getHexString()}`;
};

function paint(key, era, y, backdrop = {}) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const sky = SKIES[y.sky] || SKIES.clearMidday;
  const haze = sky.horizon;
  const base = y.hemi?.ground ?? sky.ground;
  const px = (b) => ((((180 - b) % 360) + 360) % 360) / 360 * W; // bearing -> x (the band's theta is 180° - bearing)
  const py = (e) => H - ((e - LO) / (HI - LO)) * H; // elevation -> y
  const lit = (y.lit ?? 0) > 0.05 && era !== '2196';
  let seed = [...key + era].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
  // draw a silhouette across bearings b-w .. b+w, wrapping round the seam
  const span = (b, w, fn) => {
    for (const off of [-360, 0, 360]) {
      const x0 = px(b + w + off), x1 = px(b - w + off);
      if (Math.max(x0, x1) < 0 || Math.min(x0, x1) > W) continue;
      fn(Math.min(x0, x1), Math.max(x0, x1));
    }
  };
  // the land under the horizon line (a band of ground down to the bottom edge): cloud tops above the cloud
  // sea, white where the place dissolves into its own haze
  const kind = backdrop.kind || 'valley';
  g.fillStyle = kind === 'clouds' ? mix(0xf4f6fa, haze, 0.25) : kind === 'void' || kind === 'memory' ? mix(haze, 0xffffff, 0.3) : mix(base, haze, 0.55);
  g.fillRect(0, py(0) - 1, W, H - py(0) + 1);
  const feats = horizonFor(key, era, backdrop).sort((a, b) => b.haze - a.haze);
  for (const f of feats) {
    const col = mix(f.kind === 'sea' ? 0x5a7a8a : f.kind === 'skyline' || f.kind === 'cranes' ? 0x3a4048 : f.kind === 'crown' ? 0xd8dce0 : base, haze, Math.min(0.92, f.haze + (y.density > 1.5 ? 0.15 : 0)));
    g.fillStyle = col;
    if (f.kind === 'hill' || f.kind === 'ridge') {
      span(f.b, f.w, (x0, x1) => {
        g.beginPath();
        g.moveTo(x0, py(0));
        const n = 12;
        for (let i = 0; i <= n; i++) {
          const t = i / n, e = f.h * Math.sin(Math.PI * t) ** 0.7 * (0.85 + 0.15 * Math.sin(i * 2.1 + f.b));
          g.lineTo(x0 + (x1 - x0) * t, py(e));
        }
        g.lineTo(x1, py(0));
        g.fill();
      });
    } else if (f.kind === 'notch') {
      span(f.b, f.w * 1.8, (x0, x1) => {
        const xm = (x0 + x1) / 2, top = py(f.h), base0 = py(0);
        g.beginPath();
        g.moveTo(x0, base0);
        g.lineTo(xm - (x1 - x0) * 0.16, top);
        g.lineTo(xm - (x1 - x0) * 0.05, py(f.h * 0.72));
        g.lineTo(xm + (x1 - x0) * 0.05, py(f.h * 0.72));
        g.lineTo(xm + (x1 - x0) * 0.14, py(f.h * 0.96));
        g.lineTo(x1, base0);
        g.fill();
        if (f.snow) {
          g.fillStyle = mix(0xf4f8ff, haze, f.haze * 0.7);
          for (const [a, b2] of [[-0.16, -0.05], [0.05, 0.14]]) {
            g.beginPath();
            g.moveTo(xm + (x1 - x0) * a, py(a < 0 ? f.h : f.h * 0.96));
            g.lineTo(xm + (x1 - x0) * (a - 0.06), py(f.h * 0.78));
            g.lineTo(xm + (x1 - x0) * (b2 + 0.04), py(f.h * 0.74));
            g.fill();
          }
        }
      });
    } else if (f.kind === 'skyline') {
      span(f.b, f.w, (x0, x1) => {
        let x = x0;
        while (x < x1) {
          const w = 6 + rnd() * 18, hh = f.h * (0.35 + rnd() * 0.65) * (f.broken && rnd() < 0.4 ? 0.5 : 1);
          g.fillStyle = col;
          g.fillRect(x, py(hh), w - 1, py(0) - py(hh));
          if (f.broken && rnd() < 0.5) { g.fillStyle = mix(0x4a6a3a, haze, f.haze); g.fillRect(x, py(hh), w - 1, 3); }
          if (lit) {
            g.fillStyle = `rgba(255,${200 + rnd() * 40 | 0},150,${0.35 + rnd() * 0.45})`;
            for (let k = 0; k < (hh * 3) | 0; k++) if (rnd() < 0.5) g.fillRect(x + 1 + rnd() * (w - 3), py(rnd() * hh), 1.2, 1.2);
          }
          x += w;
        }
      });
    } else if (f.kind === 'cranes') {
      span(f.b, f.w, (x0, x1) => {
        g.strokeStyle = col;
        g.lineWidth = 1.5;
        for (let x = x0; x < x1; x += 10 + rnd() * 16) {
          const top = py(f.h * (0.7 + rnd() * 0.3));
          g.beginPath();
          g.moveTo(x, py(0));
          g.lineTo(x, top);
          g.lineTo(x + 10, top);
          g.stroke();
        }
      });
    } else if (f.kind === 'crown') {
      span(f.b, f.w, (x0, x1) => {
        const xm = (x0 + x1) / 2, w = x1 - x0, top = py(f.h), b0 = py(f.base);
        if (f.crown === 'crescent' || f.crown === 'ring') {
          g.fillStyle = col;
          g.fillRect(x0, top, w, b0 - top);
          g.fillStyle = mix(0xffc06a, haze, f.haze * 0.6);
          g.fillRect(x0 + w * 0.1, top + (b0 - top) * 0.45, w * 0.8, 2); // lit glass
          g.fillStyle = mix(0x4f9fe8, haze, 0.3);
          g.beginPath();
          g.arc(xm, top - 1, Math.max(2, w * 0.08), 0, Math.PI, true); // the oculus's glow
          g.fill();
        } else if (f.crown === 'frame') {
          g.strokeStyle = col;
          g.lineWidth = 1;
          for (let x = x0; x <= x1; x += w / 6) { g.beginPath(); g.moveTo(x, b0); g.lineTo(x, top); g.stroke(); }
          g.beginPath(); g.moveTo(xm, b0); g.lineTo(xm, top - 12); g.lineTo(xm + w * 0.5, top - 12); g.stroke();
        } else if (f.crown === 'ruin') {
          g.fillStyle = col;
          for (let x = x0; x < x1; x += w / 5) g.fillRect(x, top + rnd() * (b0 - top) * 0.6, w / 6, b0);
        } else if (f.crown === 'stones') {
          g.fillStyle = col;
          for (let x = x0; x < x1; x += w / 7) g.fillRect(x, top + (b0 - top) * 0.5, 2, (b0 - top) * 0.5);
        }
      });
    } else if (f.kind === 'sea') {
      span(f.b, f.w, (x0, x1) => {
        const grd = g.createLinearGradient(0, py(f.h), 0, py(0));
        grd.addColorStop(0, mix(0xc8dce8, haze, 0.4));
        grd.addColorStop(1, col);
        g.fillStyle = grd;
        g.fillRect(x0, py(f.h), x1 - x0, py(0) - py(f.h) + 1);
      });
    } else if (f.kind === 'glint') {
      span(f.b, 0.3, (x0) => {
        g.fillStyle = f.era === 'ancient' ? '#ffd890' : mix(0xb8905a, haze, 0.4);
        g.fillRect(x0, py(f.h) - 2, 2, 3);
      });
    } else if (f.kind === 'mesa') {
      // a flat-topped butte with steep sides
      span(f.b, f.w, (x0, x1) => {
        const w = x1 - x0;
        g.beginPath();
        g.moveTo(x0, py(0));
        g.lineTo(x0 + w * 0.16, py(f.h * 0.92));
        g.lineTo(x0 + w * 0.22, py(f.h));
        g.lineTo(x1 - w * 0.2, py(f.h));
        g.lineTo(x1 - w * 0.12, py(f.h * 0.86));
        g.lineTo(x1, py(0));
        g.fill();
        g.fillStyle = mix(0x6a3a28, haze, f.haze * 0.8);
        g.fillRect(x0 + w * 0.22, py(f.h), w * 0.58, 2);
      });
    } else if (f.kind === 'haze') {
      span(f.b, f.w, (x0, x1) => {
        const grd = g.createLinearGradient(0, py(f.h), 0, py(0));
        grd.addColorStop(0, 'rgba(255,255,255,0)');
        grd.addColorStop(1, mix(haze, 0xffffff, 0.4));
        g.fillStyle = grd;
        g.fillRect(x0, py(f.h), x1 - x0, py(0) - py(f.h) + 2);
      });
    } else if (f.kind === 'cloudtop') {
      // billows of cloud tops to the horizon
      for (let x = 0; x < W; x += 6 + rnd() * 10) {
        g.fillStyle = mix(0xffffff, haze, 0.15 + rnd() * 0.25);
        g.beginPath();
        g.ellipse(x, py(-0.4), 8 + rnd() * 22, 3 + rnd() * 6, 0, Math.PI, 0);
        g.fill();
      }
    } else if (f.kind === 'smoke') {
      span(f.b, f.w, (x0, x1) => {
        for (let k = 0; k < 3; k++) {
          const grd = g.createLinearGradient(0, py(f.h), 0, py(0));
          grd.addColorStop(0, 'rgba(200,200,200,0)');
          grd.addColorStop(1, mix(0xbab4aa, haze, 0.5));
          g.fillStyle = grd;
          g.fillRect(x0 + (x1 - x0) * (k / 3), py(f.h * (0.7 + k * 0.1)), 2, py(0) - py(f.h));
        }
      });
    }
  }
  // the haze where land meets sky
  const fade = g.createLinearGradient(0, py(3), 0, py(-0.5));
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  const hz = new THREE.Color(haze);
  fade.addColorStop(1, `rgba(${(hz.r * 255) | 0},${(hz.g * 255) | 0},${(hz.b * 255) | 0},0.45)`);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = fade;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export class Horizon {
  constructor(root, level) {
    this.level = level;
    this.cache = {};
    const y0 = yOf(LO), y1 = yOf(HI);
    const geo = new THREE.CylinderGeometry(R, R, y1 - y0, 128, 1, true).translate(0, (y0 + y1) / 2, 0);
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.BackSide, alphaTest: 0.02 });
    this.mat.userData.keep = true;
    this.band = new THREE.Mesh(geo, this.mat);
    this.band.name = 'lvHorizon';
    this.band.renderOrder = -9;
    this.band.frustumCulled = false;
    root.add(this.band);
    // the skirt: from just beyond the place's dressed edges out under the band
    const [bx0, bz0, bx1, bz1] = level.bounds;
    this.cx = (bx0 + bx1) / 2;
    this.cz = (bz0 + bz1) / 2;
    const rin = Math.hypot(bx1 - bx0, bz1 - bz0) / 2 + 30;
    this.skirtMat = new THREE.MeshBasicMaterial({ color: 0x5a6050, fog: true });
    this.skirt = new THREE.Mesh(new THREE.RingGeometry(rin, 900, 64, 1).rotateX(-Math.PI / 2), this.skirtMat);
    this.skirt.position.set(this.cx, level.backdrop?.skirtY ?? -1.2, this.cz);
    this.skirt.renderOrder = -8;
    this.skirt.visible = level.backdrop?.skirt !== false; // (above the cloud sea there is no ground to the horizon)
    root.add(this.skirt);
  }

  setYear(state, y) {
    const era = y.era || '2049';
    const k = `${state}`;
    this.cache[k] ||= paint(this.level.place, era, y, this.level.backdrop || {});
    this.mat.map = this.cache[k];
    this.mat.needsUpdate = true;
    const sky = SKIES[y.sky] || SKIES.clearMidday;
    this.skirtMat.color.set(new THREE.Color(y.hemi?.ground ?? sky.ground).lerp(new THREE.Color(sky.horizon), 0.35));
  }

  update(camera) {
    this.band.position.set(camera.position.x, camera.position.y - 1.6, camera.position.z);
  }

  dispose() {
    for (const t of Object.values(this.cache)) t.dispose();
    this.band.parent?.remove(this.band);
    this.skirt.parent?.remove(this.skirt);
    this.band.geometry.dispose();
    this.skirt.geometry.dispose();
    this.mat.dispose(); // each place makes its own band and skirt materials (DeckWorld frees only textures)
    this.skirtMat.dispose();
  }
}
