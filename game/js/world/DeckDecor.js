// Set dressing for the vessel's decks: what makes the Garden Deck a garden and
// the Bridge a bridge. Everything here is decoration: it never collides, never
// touches the level data and draws from its own random stream, so the generator
// (gen/LevelGen.js) stays exactly as deterministic as before. Pieces are placed
// against the side walls, between the wall ribs, only where nothing of the
// puzzle is (pits, ledges, stairs, props, doors, terminals) and are merged per
// material, so a whole sector of decor costs a handful of draw calls.
//
// Generic furniture from the generator (planters, consoles, pods, crates,
// benches, lamps) is re-dressed per deck: its collision box stays where it is
// and a deck-specific model is drawn in the same footprint.
import * as THREE from '../../vendor/three.module.min.js';
import { boxGeometry, mergeGeometries, canvasTex, pbr, relief, lookTextures } from './materials.js';
import { Rng } from '../gen/rng.js';

// prop kind -> 'full' (draw a new model, hide the box) or 'part' (keep the box, replace the decor on it)
export const RESKIN = {
  hydro: { planter: 'part' },
  cryo: { pod: 'full' },
  obs: { lamp: 'full' },
  eng: { lamp: 'full' },
  med: { bench: 'full', console: 'full', pod: 'full' },
  crew: { bench: 'full', planter: 'part', lamp: 'full' },
  arch: { lamp: 'full', console: 'full' },
  bridge: { console: 'full', lamp: 'full' },
};

const T = 0.4; // wall thickness (as in LevelGen)
const IGNORE = new Set(['wall', 'ceil', 'trim', 'trimDark', 'panelGlow', 'glow', 'gate']);

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

// --- geometry templates (shared, cloned per use) ---------------------------------
const TPL = {};
const tpl = (k, f) => TPL[k] || (TPL[k] = f());
const G = {
  cyl: () => tpl('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 14, 1)),
  pipe: () => tpl('pipe', () => new THREE.CylinderGeometry(1, 1, 1, 10, 1, true)),
  tube: () => tpl('tube', () => new THREE.CylinderGeometry(1, 1, 1, 16, 1, true)),
  halfCyl: () => tpl('halfCyl', () => new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, -Math.PI / 2, Math.PI)),
  sph: () => tpl('sph', () => new THREE.SphereGeometry(1, 10, 7)),
  shade: () => tpl('shade', () => new THREE.CylinderGeometry(0.55, 1, 1, 16, 1, true)),
  torus: () => tpl('torus', () => new THREE.TorusGeometry(1, 0.08, 4, 18)),
  ring: () => tpl('ring', () => new THREE.RingGeometry(0.93, 1, 72)),
  disc: () => tpl('disc', () => new THREE.CircleGeometry(1, 40)),
  plane: () => tpl('plane', () => new THREE.PlaneGeometry(1, 1)),
  box: () => tpl('box', () => new THREE.BoxGeometry(1, 1, 1)),
  body: () => tpl('body', () => new THREE.CapsuleGeometry(0.17, 0.95, 3, 8)),
};
// the same plane, showing one cell of an atlas (cols x rows)
function atlasPlane(col, row, cols, rows) {
  return tpl(`atlas${col}_${row}_${cols}_${rows}`, () => {
    const g = new THREE.PlaneGeometry(1, 1);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (col + uv.getX(i)) / cols, 1 - (row + 1 - uv.getY(i)) / rows);
    return g;
  });
}
// a plane whose texture repeats u x v times (shelves of books)
function repeatPlane(u, v) {
  const g = new THREE.PlaneGeometry(1, 1);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  return g;
}
function gearGeometry(teeth, r) {
  return tpl(`gear${teeth}`, () => {
    const s = new THREE.Shape();
    const depth = 0.13;
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const rr = i % 4 < 2 ? r : r - depth;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, r * 0.18, 0, Math.PI * 2, true);
    s.holes.push(hole);
    // spokes: four windows in the web
    for (let k = 0; k < 4; k++) {
      const w = new THREE.Path();
      const a0 = (k / 4) * Math.PI * 2 + 0.25, a1 = a0 + Math.PI / 2 - 0.5;
      w.absarc(0, 0, r * 0.68, a0, a1, false);
      w.absarc(0, 0, r * 0.32, a1, a0, true);
      s.holes.push(w);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 6 });
    g.translate(0, 0, -0.06);
    return g;
  });
}

// --- painted decor textures (built once) -------------------------------------
const TEX = {};
function tex(k, f) {
  return TEX[k] || (TEX[k] = f());
}
function leafTex() {
  return tex('leaf', () => {
    const rnd = lcg(11);
    const t = canvasTex(512, (g) => {
      g.clearRect(0, 0, 512, 256);
      const leaf = (x, y, a, len, w, light) => {
        g.save();
        g.translate(x, y);
        g.rotate(a);
        const gr = g.createLinearGradient(0, 0, len, 0);
        const h = 92 + rnd() * 40, s = 42 + rnd() * 22, l = (light ? 34 : 24) + rnd() * 12;
        gr.addColorStop(0, `hsl(${h},${s}%,${l - 6}%)`);
        gr.addColorStop(1, `hsl(${h},${s}%,${l + 8}%)`);
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(len / 2, 0, len / 2, w / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = `hsla(${h},40%,70%,0.35)`;
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(2, 0); g.lineTo(len - 3, 0); g.stroke();
        g.restore();
      };
      // a bush (left half), denser at the bottom
      for (let i = 0; i < 95; i++) {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6;
        const r = 30 + rnd() * 160;
        const x = 128 + Math.cos(a) * r * 0.62, y = 250 + Math.sin(a) * r;
        if (y < 14 || x < 10 || x > 246) continue;
        leaf(x, y, a + (rnd() - 0.5) * 0.9, 26 + rnd() * 34, 9 + rnd() * 9, i > 50);
      }
      // a hanging vine (right half)
      g.strokeStyle = '#3b5a2a';
      g.lineWidth = 3;
      g.beginPath();
      for (let y = 0; y <= 256; y += 4) g.lineTo(384 + Math.sin(y * 0.045) * 22, y);
      g.stroke();
      for (let y = 6; y < 252; y += 9) {
        const x = 384 + Math.sin(y * 0.045) * 22;
        const side = (y / 9) % 2 < 1 ? 1 : -1;
        leaf(x, y, side > 0 ? 0.5 + rnd() * 0.6 : Math.PI - 0.5 - rnd() * 0.6, 14 + rnd() * 14, 7 + rnd() * 5, rnd() < 0.5);
      }
    }, false, 256);
    return t;
  });
}
function ecgTex() {
  return tex('ecg', () => {
    const t = canvasTex(256, (g, w, h) => {
      g.fillStyle = '#031a10';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(60,200,120,0.18)';
      for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.strokeStyle = '#6dffab';
      g.lineWidth = 2.5;
      g.shadowColor = '#6dffab';
      g.shadowBlur = 6;
      g.beginPath();
      const base = 40;
      for (let k = 0; k < 2; k++) {
        const o = k * 128;
        g.lineTo(o, base);
        g.lineTo(o + 30, base);
        g.quadraticCurveTo(o + 36, base - 7, o + 42, base);
        g.lineTo(o + 52, base);
        g.lineTo(o + 56, base + 6);
        g.lineTo(o + 61, base - 30);
        g.lineTo(o + 66, base + 12);
        g.lineTo(o + 70, base);
        g.lineTo(o + 84, base);
        g.quadraticCurveTo(o + 94, base - 10, o + 104, base);
        g.lineTo(o + 128, base);
      }
      g.stroke();
    }, true, 64);
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}
function posterTex() {
  return tex('poster', () => canvasTex(512, (g) => {
    const rnd = lcg(5);
    const frame = (x, y) => {
      g.strokeStyle = '#f2e8d6';
      g.lineWidth = 14;
      g.strokeRect(x + 7, y + 7, 242, 242);
    };
    // 1: a ringed planet
    let gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#1d2350'); gr.addColorStop(1, '#5a2f6a');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    g.fillStyle = '#f0a050'; g.beginPath(); g.arc(128, 140, 52, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(180,80,40,0.5)'; g.fillRect(76, 130, 104, 10); g.fillRect(80, 156, 96, 8);
    g.strokeStyle = '#ffe0b0'; g.lineWidth = 5; g.beginPath(); g.ellipse(128, 140, 92, 22, -0.25, 0, Math.PI * 2); g.stroke();
    frame(0, 0);
    // 2: mountains at sunset
    gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(0.6, '#ffcf8a'); gr.addColorStop(1, '#ffe8c0');
    g.fillStyle = gr; g.fillRect(256, 0, 256, 256);
    g.fillStyle = '#fff2c8'; g.beginPath(); g.arc(384, 120, 34, 0, Math.PI * 2); g.fill();
    for (const [c, y0] of [['#7a4a7a', 150], ['#4a3a6a', 175], ['#2a2a4a', 205]]) {
      g.fillStyle = c; g.beginPath(); g.moveTo(256, 256);
      for (let x = 256; x <= 512; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.05 + y0) * 18 + (rnd() - 0.5) * 14);
      g.lineTo(512, 256); g.fill();
    }
    frame(256, 0);
    // 3: a botanical print
    g.fillStyle = '#efe6d2'; g.fillRect(0, 256, 256, 256);
    g.strokeStyle = '#3f6a3a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(128, 470); g.quadraticCurveTo(120, 380, 132, 290); g.stroke();
    for (let i = 0; i < 9; i++) {
      const y = 460 - i * 19;
      for (const sd of [-1, 1]) {
        g.fillStyle = `hsl(${105 + i * 3},40%,${30 + i * 2}%)`;
        g.beginPath(); g.ellipse(128 + sd * (30 - i * 2), y - 8, 30 - i * 2, 8, sd * -0.5, 0, Math.PI * 2); g.fill();
      }
    }
    frame(0, 256);
    // 4: circles
    g.fillStyle = '#2f6f74'; g.fillRect(256, 256, 256, 256);
    for (const [r, c] of [[90, '#e8b04a'], [64, '#f08a6a'], [40, '#f2e8d6'], [18, '#2f6f74']]) {
      g.fillStyle = c; g.beginPath(); g.arc(384, 384, r, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#f2e8d6'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(276, 470); g.lineTo(492, 300); g.stroke();
    frame(256, 256);
  }, false));
}
function rugTex() {
  return tex('rug', () => canvasTex(512, (g) => {
    const rnd = lcg(9);
    // 1: terracotta with a diamond lattice
    g.fillStyle = '#9c4e34'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#e8d8b8'; g.fillRect(10, 10, 236, 236);
    g.fillStyle = '#9c4e34'; g.fillRect(22, 22, 212, 212);
    g.strokeStyle = '#d8a24a'; g.lineWidth = 3;
    for (let k = -256; k < 512; k += 32) {
      g.beginPath(); g.moveTo(22 + k, 22); g.lineTo(234 + k, 234); g.stroke();
      g.beginPath(); g.moveTo(234 - k, 22); g.lineTo(22 - k, 234); g.stroke();
    }
    g.fillStyle = '#9c4e34'; g.fillRect(0, 0, 22, 256); g.fillRect(234, 0, 22, 256); g.fillRect(0, 0, 256, 22); g.fillRect(0, 234, 256, 22);
    g.fillStyle = '#e8d8b8'; g.fillRect(10, 10, 236, 4); g.fillRect(10, 242, 236, 4); g.fillRect(10, 10, 4, 236); g.fillRect(242, 10, 4, 236);
    g.fillStyle = '#2f3f5a';
    g.beginPath(); g.moveTo(128, 70); g.lineTo(186, 128); g.lineTo(128, 186); g.lineTo(70, 128); g.fill();
    // 2: a striped kilim
    const cols = ['#2f5f6f', '#e8d8b8', '#c8783a', '#2f5f6f', '#4a8a8a', '#e8d8b8'];
    for (let y = 0; y < 256; y += 16) { g.fillStyle = cols[(y / 16) % cols.length]; g.fillRect(256, y, 256, 16); }
    g.fillStyle = '#e8d8b8';
    for (let y = 40; y < 256; y += 64) for (let x = 256; x < 512; x += 24) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y - 10); g.lineTo(x + 24, y); g.lineTo(x + 12, y + 10); g.fill();
    }
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * 512, rnd() * 256, 2, 2); }
  }, false, 256));
}
function bookTex() {
  return tex('books', () => {
    const rnd = lcg(21);
    const glow = document.createElement('canvas');
    glow.width = 512;
    glow.height = 256;
    const gg = glow.getContext('2d');
    gg.fillStyle = '#000';
    gg.fillRect(0, 0, 512, 256);
    const map = canvasTex(512, (g) => {
      g.fillStyle = '#16100b';
      g.fillRect(0, 0, 512, 256);
      const leather = ['#5a2a22', '#3a4a2a', '#2a3550', '#6a4a2a', '#4a2a3a', '#7a6040', '#2f2a26', '#6a3a2a'];
      let x = 4;
      while (x < 508) {
        if (rnd() < 0.22) {
          // a rack of data drums, glowing
          const w = Math.min(508 - x, 90 + rnd() * 70);
          g.fillStyle = '#0d0a08';
          g.fillRect(x, 40, w, 210);
          const hue = rnd() < 0.7 ? [255, 176, 80] : [95, 224, 192];
          for (let cy = 82; cy < 240; cy += 58) for (let cx = x + 22; cx < x + w - 18; cx += 40) {
            const b = 0.45 + rnd() * 0.55;
            const draw = (ctx, lit) => {
              const gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
              gr.addColorStop(0, `rgba(${hue[0]},${hue[1]},${hue[2]},${lit ? b : 0.9})`);
              gr.addColorStop(0.7, `rgba(${hue[0] * 0.6},${hue[1] * 0.6},${hue[2] * 0.6},${lit ? b * 0.6 : 0.8})`);
              gr.addColorStop(1, lit ? 'rgba(0,0,0,0)' : 'rgba(30,22,16,1)');
              ctx.fillStyle = gr;
              ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
            };
            draw(g, false);
            draw(gg, true);
          }
          x += w + 4;
          continue;
        }
        const w = 9 + rnd() * 16, h = 150 + rnd() * 80;
        g.fillStyle = leather[(rnd() * leather.length) | 0];
        g.fillRect(x, 250 - h, w, h);
        g.fillStyle = 'rgba(230,200,140,0.5)';
        g.fillRect(x + 1, 250 - h + 14, w - 2, 3);
        g.fillRect(x + 1, 250 - h * 0.35, w - 2, 2);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(x + w - 2, 250 - h, 2, h);
        x += w + (rnd() < 0.15 ? 6 : 1);
      }
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.fillRect(0, 0, 512, 30);
    }, true, 256);
    const e = new THREE.CanvasTexture(glow);
    e.colorSpace = THREE.SRGBColorSpace;
    e.wrapS = e.wrapT = THREE.RepeatWrapping;
    return { map, glow: e };
  });
}
function uiTex() {
  return tex('ui', () => canvasTex(512, (g) => {
    const rnd = lcg(31);
    const bg = (x, y) => {
      g.fillStyle = '#040e1c'; g.fillRect(x, y, 256, 256);
      g.strokeStyle = 'rgba(90,170,255,0.6)'; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, 248, 248);
    };
    // radar
    bg(0, 0);
    g.strokeStyle = 'rgba(110,210,255,0.8)'; g.lineWidth = 2;
    for (const r of [30, 60, 90, 116]) { g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(12, 128); g.lineTo(244, 128); g.moveTo(128, 12); g.lineTo(128, 244); g.stroke();
    const gr = g.createLinearGradient(128, 128, 230, 60);
    gr.addColorStop(0, 'rgba(110,230,255,0.6)'); gr.addColorStop(1, 'rgba(110,230,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 116, -0.9, -0.3); g.fill();
    g.fillStyle = '#ffc44a';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(40 + rnd() * 176, 40 + rnd() * 176, 4, 0, Math.PI * 2); g.fill(); }
    // graphs
    bg(256, 0);
    for (let i = 0; i < 9; i++) {
      const h = 30 + rnd() * 120;
      g.fillStyle = i % 3 ? 'rgba(90,200,255,0.85)' : 'rgba(255,196,74,0.9)';
      g.fillRect(280 + i * 24, 230 - h, 16, h);
    }
    g.strokeStyle = '#7fffd0'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= 210; x += 10) g.lineTo(280 + x, 70 + Math.sin(x * 0.06) * 26 + rnd() * 8);
    g.stroke();
    // star chart with a course
    bg(0, 256);
    const pts = [];
    for (let i = 0; i < 40; i++) {
      const p = [20 + rnd() * 216, 276 + rnd() * 216];
      pts.push(p);
      g.fillStyle = `rgba(220,235,255,${0.5 + rnd() * 0.5})`; g.fillRect(p[0], p[1], 3, 3);
    }
    g.strokeStyle = 'rgba(120,180,255,0.5)'; g.lineWidth = 1;
    g.beginPath(); for (let i = 0; i < 8; i++) g.lineTo(...pts[i]); g.stroke();
    g.strokeStyle = '#ffc44a'; g.setLineDash([8, 6]); g.lineWidth = 3;
    g.beginPath(); g.moveTo(30, 480); g.quadraticCurveTo(110, 300, 226, 300); g.stroke(); g.setLineDash([]);
    // status rows
    bg(256, 256);
    for (let r = 0; r < 9; r++) {
      const w = 40 + rnd() * 150;
      g.fillStyle = r % 4 === 3 ? 'rgba(255,196,74,0.9)' : 'rgba(90,200,255,0.8)';
      g.fillRect(300, 284 + r * 24, w, 12);
      g.fillStyle = rnd() < 0.8 ? '#5fe0a0' : '#ff8a6a';
      g.fillRect(276, 284 + r * 24, 12, 12);
    }
  }, false));
}

// --- decor materials (built once per session) ----------------------------------
const S = (o) => new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0, ...o });
const BM = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const DMAT = {
  leaf: () => S({ map: leafTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8, emissive: 0x1c3a12, emissiveIntensity: 0.35 }),
  trough: () => S({ color: 0x5a4632, ...relief('bark', 1, 0.4), roughness: 0.85 }),
  soil: () => pbr('moss', 0.6, { color: 0x9aa880 }),
  housing: () => S({ color: 0x2a2f2c, metalness: 0.5, roughness: 0.4 }),
  growLight: () => BM(new THREE.Color(0xff7ae0).multiplyScalar(1.5)),
  podMetal: () => S({ color: 0xc8d4de, metalness: 0.6, roughness: 0.3 }),
  podDark: () => S({ color: 0x3a4858, metalness: 0.5, roughness: 0.4 }),
  podGlass: () => new THREE.MeshStandardMaterial({ color: 0xdff2ff, emissive: 0x4f9ad0, emissiveIntensity: 0.35, transparent: true, opacity: 0.38, roughness: 0.15, depthWrite: false, side: THREE.DoubleSide }),
  podGlow: () => BM(new THREE.Color(0x7fe0ff).multiplyScalar(1.4)),
  sleeper: () => S({ color: 0x1c2c44, emissive: 0x0e2a4a, emissiveIntensity: 0.6, roughness: 0.8 }),
  statusBlue: () => BM(0x5fd0ff),
  statusAmber: () => BM(0xffb04a),
  frostPipe: () => S({ color: 0xe8f2fa, roughness: 0.5, metalness: 0.2 }),
  brass: () => S({ color: 0xb48a4c, metalness: 0.85, roughness: 0.35 }),
  navy: () => S({ color: 0x2a3150, metalness: 0.3, roughness: 0.45 }),
  sun: () => BM(new THREE.Color(0xffd480).multiplyScalar(1.6)),
  globe: () => BM(new THREE.Color(0xc8b8ff).multiplyScalar(1.3)),
  pipeRust: () => pbr('rust', 1, { color: 0x9a7a62, metalness: 0.55 }),
  pipeCopper: () => S({ color: 0xb8693a, metalness: 0.85, roughness: 0.35 }),
  pipeGreen: () => S({ color: 0x3f6a5a, metalness: 0.4, roughness: 0.5 }),
  bracket: () => S({ color: 0x2a2826, metalness: 0.6, roughness: 0.5 }),
  valve: () => S({ color: 0xb8322a, metalness: 0.3, roughness: 0.5 }),
  gearIron: () => S({ color: 0x77716a, metalness: 0.75, roughness: 0.4 }),
  gearBrass: () => S({ color: 0xb89048, metalness: 0.8, roughness: 0.35 }),
  hazard: () => S({ map: lookTextures('eng').hazard, roughness: 0.7 }),
  tank: () => S({ color: 0x55665e, ...relief('metal', 1, 0.6), metalness: 0.5, roughness: 0.45 }),
  gauge: () => BM(new THREE.Color(0xffc060).multiplyScalar(1.3)),
  steel: () => S({ color: 0xc5d1d4, metalness: 0.7, roughness: 0.3 }),
  linen: () => S({ color: 0xeef2f2, roughness: 0.9 }),
  linen2: () => S({ color: 0xffffff, roughness: 0.9 }),
  blanketTeal: () => S({ color: 0x3f8f96, roughness: 0.95 }),
  monitor: () => S({ color: 0x2a3236, roughness: 0.4, metalness: 0.3 }),
  ecg: () => BM(0xffffff, { map: ecgTex() }),
  medGlass: () => new THREE.MeshStandardMaterial({ color: 0xcff4f2, transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  cabinet: () => S({ color: 0xf2f6f6, roughness: 0.4 }),
  cabinetGlass: () => S({ color: 0x9fc8cc, roughness: 0.15, metalness: 0.3 }),
  lineTeal: () => S({ color: 0x23a89e, roughness: 0.5 }),
  lineBlue: () => S({ color: 0x3f7fc8, roughness: 0.5 }),
  wood: () => S({ color: 0x8a6244, ...relief('bark', 1, 0.12), roughness: 0.6 }),
  woodDark: () => S({ color: 0x5a3c28, roughness: 0.6 }),
  blanket0: () => S({ color: 0xb8583a, roughness: 0.95 }),
  blanket1: () => S({ color: 0xd4a03a, roughness: 0.95 }),
  blanket2: () => S({ color: 0x3a7f86, roughness: 0.95 }),
  blanket3: () => S({ color: 0x7a4a7a, roughness: 0.95 }),
  poster: () => S({ map: posterTex(), roughness: 0.8 }),
  rug: () => S({ map: rugTex(), roughness: 1 }),
  lampShade: () => BM(new THREE.Color(0xffd8a0).multiplyScalar(1.3), { side: THREE.DoubleSide }),
  fabric0: () => S({ color: 0x8a4a3a, roughness: 0.95 }),
  fabric1: () => S({ color: 0x4a6a7a, roughness: 0.95 }),
  fabric2: () => S({ color: 0x6a7a4a, roughness: 0.95 }),
  shelfWood: () => S({ color: 0x4a3626, ...relief('bark', 1, 0.15), roughness: 0.6 }),
  books: () => { const t = bookTex(); return S({ map: t.map, emissive: 0xffffff, emissiveMap: t.glow, emissiveIntensity: 1.5, roughness: 0.85 }); },
  sconce: () => BM(new THREE.Color(0xffc070).multiplyScalar(1.5)),
  deskLamp: () => BM(new THREE.Color(0x8fe8a8).multiplyScalar(1.2)),
  paper: () => S({ color: 0xe8dcc0, roughness: 0.9 }),
  consoleBody: () => S({ color: 0x24304a, metalness: 0.5, roughness: 0.4 }),
  screen: () => BM(new THREE.Color(0xffffff).multiplyScalar(1.15), { map: uiTex() }),
  consoleLights: () => BM(new THREE.Color(0x6fd0ff).multiplyScalar(1.3)),
  runner: () => S({ color: 0x4a1a26, roughness: 1 }),
  runnerEdge: () => S({ color: 0x3a3440, roughness: 0.8, metalness: 0.2 }),
  gold: () => S({ color: 0xc89a3e, metalness: 0.8, roughness: 0.35 }),
  goldGlow: () => BM(new THREE.Color(0xffc44a).multiplyScalar(1.3)),
  dais: () => S({ color: 0x1a2236, metalness: 0.4, roughness: 0.4 }),
  holo: () => BM(0x6fe0ff, { transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  drumGlow: () => BM(new THREE.Color(0xffb050).multiplyScalar(1.4)),
  darkMetal: () => S({ color: 0x2a2a2e, metalness: 0.6, roughness: 0.4 }),
  space: () => spaceMaterial(),
};
// the deck archive's books, for Station Zero's archive shelves
export function bookMaterial() {
  return dmat('books');
}

const _dm = new Map();
function dmat(key) {
  if (_dm.has(key)) return _dm.get(key);
  const m = DMAT[key]();
  m.userData.keep = true; // shared across sectors: DeckWorld.dispose leaves it alone
  _dm.set(key, m);
  return m;
}
// thin, glowing or see-through pieces don't cast shadows
const NO_SHADOW = new Set(['leaf', 'growLight', 'podGlass', 'podGlow', 'statusBlue', 'statusAmber', 'sun', 'globe', 'gauge', 'ecg', 'medGlass', 'lineTeal', 'lineBlue',
  'poster', 'rug', 'lampShade', 'books', 'sconce', 'deskLamp', 'screen', 'consoleLights', 'runner', 'goldGlow', 'holo', 'drumGlow', 'space', 'hazard', 'soil', 'dais']);

// A window onto space: stars, a faint nebula and a slowly turning gas giant,
// looked up by view direction so they sit at infinity behind the glass.
function skyTex() {
  return tex('sky', () => {
    const rnd = lcg(77);
    const t = canvasTex(1024, (g, w, h) => {
      g.fillStyle = '#010208';
      g.fillRect(0, 0, w, h);
      // a faint nebula band
      for (let i = 0; i < 26; i++) {
        const x = rnd() * w, y = h * (0.35 + rnd() * 0.3), r = 40 + rnd() * 120;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        const c = rnd() < 0.5 ? '90,58,154' : '58,70,150';
        gr.addColorStop(0, `rgba(${c},0.22)`);
        gr.addColorStop(1, `rgba(${c},0)`);
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 2600; i++) {
        const b = rnd(), warm = rnd() < 0.25;
        g.fillStyle = warm ? `rgba(255,${210 + b * 40},${170 + b * 50},${0.35 + b * 0.65})` : `rgba(${200 + b * 55},${215 + b * 40},255,${0.35 + b * 0.65})`;
        const s = b > 0.93 ? 2 : 1;
        g.fillRect(rnd() * w, rnd() * h, s, s);
      }
    }, false, 512);
    t.wrapS = THREE.RepeatWrapping;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return t;
  });
}
function spaceMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      sky: { value: skyTex() },
      time: { value: 0 },
      pDir: { value: new THREE.Vector3(0.82, 0.1, 0.56).normalize() },
      mDir: { value: new THREE.Vector3(-0.62, 0.4, -0.67).normalize() },
      pA: { value: new THREE.Color(0xd08a5a) },
      pB: { value: new THREE.Color(0x6a5ac8) },
      neb: { value: new THREE.Color(0x5a3a9a) },
    },
    vertexShader: `varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `varying vec3 vW;
uniform float time; uniform vec3 pDir, mDir, pA, pB, neb; uniform sampler2D sky;
vec3 body(vec3 d, vec3 dir, float cr, vec3 a, vec3 b, float bands, vec3 col) {
  float c = dot(d, dir);
  float sr = sqrt(1.0 - cr * cr);
  vec3 t1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
  vec3 t2 = cross(t1, dir);
  vec2 q = vec2(dot(d, t1), dot(d, t2)) / sr;
  float r2 = dot(q, q);
  if (c > 0.0 && r2 < 1.0) {
    vec3 n = vec3(q, -sqrt(1.0 - r2));
    float lon = atan(n.x, n.z) + time * 0.025;
    float band = sin(n.y * bands + sin(lon * 3.0 + n.y * 4.0) * 1.3 + sin(lon * 7.0 - n.y * 9.0) * 0.5);
    vec3 surf = mix(a, b, band * 0.5 + 0.5);
    float lit = clamp(dot(n, normalize(vec3(-0.7, 0.45, -0.55))), 0.0, 1.0);
    col = surf * (lit * 1.1 + 0.03) + b * pow(1.0 - clamp(-n.z, 0.0, 1.0), 3.0) * 0.5 * (0.3 + lit);
  } else if (c > 0.0 && r2 < 1.25) {
    col += b * (1.0 - (r2 - 1.0) / 0.25) * 0.25;
  }
  return col;
}
void main() {
  vec3 d = normalize(vW - cameraPosition);
  vec2 uv = vec2(atan(d.z, d.x) * 0.15915 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31831 + 0.5);
  vec3 col = texture2D(sky, uv).rgb * 1.6;
  col = body(d, pDir, 0.94, pA, pB, 16.0, col);
  col = body(d, mDir, 0.995, vec3(0.62, 0.62, 0.66), vec3(0.4, 0.42, 0.5), 3.0, col);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

// --- the frame and free space of one room ---------------------------------------
class Room {
  constructor(level, rid, els) {
    const r = level.rooms[rid];
    Object.assign(this, { id: rid, W: r.W, H: r.H, L: r.L, kind: r.kind, beat: r.beat, exitSide: r.exitSide });
    const [sx, , sz, th] = r.spawn;
    const s = Math.round(Math.sin(th)), c = Math.round(Math.cos(th));
    const ox = sx + 1.6 * s, oz = sz + 1.6 * c;
    this.m = new THREE.Matrix4().set(c, 0, s, ox, 0, 1, 0, 0, -s, 0, c, oz, 0, 0, 0, 1);
    this.toLocal = ([x0, y0, z0, x1, y1, z1]) => {
      const ax = (x0 - ox) * c - (z0 - oz) * s, az = (x0 - ox) * s + (z0 - oz) * c;
      const bx = (x1 - ox) * c - (z1 - oz) * s, bz = (x1 - ox) * s + (z1 - oz) * c;
      return [Math.min(ax, bx), y0, Math.min(az, bz), Math.max(ax, bx), y1, Math.max(az, bz)];
    };
    this.toWorld = (x, z) => [x * c + z * s + ox, -x * s + z * c + oz];
    const { W, L, H } = this;
    this.block = [];
    this.floors = [];
    this.walls = { W: [], E: [], N: [], S: [] };
    this.ribs = [];
    this.pits = [];
    this.props = [];
    for (const el of els) {
      const b = this.toLocal(el.box);
      const [x0, y0, z0, x1, y1, z1] = b;
      if (el.prop) this.props.push({ kind: el.prop, b });
      if (el.echo || el.light || el.when) { this.block.push(b); continue; }
      const mat = el.mat;
      if (mat === 'floor') {
        if (Math.abs(y1) < 0.02) this.floors.push(b);
        else if (y1 > 0.02) this.block.push(b);
        continue;
      }
      if (mat === 'pit') { this.pits.push(b); continue; }
      if (mat === 'wall') {
        if (x1 <= -W / 2 + 0.01 && x0 >= -W / 2 - T - 0.01) this.walls.W.push([z0, z1, y0, y1]);
        else if (x0 >= W / 2 - 0.01 && x1 <= W / 2 + T + 0.01) this.walls.E.push([z0, z1, y0, y1]);
        else if (z0 >= -0.01 && z1 <= T + 0.01) this.walls.S.push([x0, x1, y0, y1]);
        else if (z1 <= -L + 0.01 && z0 >= -L - T - 0.01) this.walls.N.push([x0, x1, y0, y1]);
        continue;
      }
      if (mat === 'trim') {
        if (y1 - y0 > H * 0.8 && (x0 < -W / 2 + 0.5 || x1 > W / 2 - 0.5)) this.ribs.push(Math.round(((z0 + z1) / 2) * 100) / 100);
        continue;
      }
      if (IGNORE.has(mat)) continue;
      this.block.push(b);
    }
    this.ribs = [...new Set(this.ribs)].sort((a, b) => a - b);
  }

  // nothing of the puzzle inside this box (and the box is inside the room)
  free([x0, y0, z0, x1, y1, z1]) {
    const { W, L } = this, e = 0.03;
    if (x0 < -W / 2 - 0.01 || x1 > W / 2 + 0.01 || z0 < -L - 0.01 || z1 > 0.01) return false;
    for (const b of this.block) if (x0 < b[3] - e && x1 > b[0] + e && y0 < b[4] - e && y1 > b[1] + e && z0 < b[5] - e && z1 > b[2] + e) return false;
    return true;
  }

  floorAt(x, z) {
    for (const f of this.floors) if (x >= f[0] - 0.01 && x <= f[3] + 0.01 && z >= f[2] - 0.01 && z <= f[5] + 0.01) return true;
    return false;
  }

  onFloor(x0, z0, x1, z1) {
    const nx = Math.max(2, Math.ceil((x1 - x0) / 0.5)), nz = Math.max(2, Math.ceil((z1 - z0) / 0.5));
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) if (!this.floorAt(x0 + ((x1 - x0) * i) / nx, z0 + ((z1 - z0) * j) / nz)) return false;
    return true;
  }

  // the wall on this side covers [a0, a1] x [y0, y1] (along z for W/E, x for N/S)
  wallAt(side, a0, a1, y0, y1) {
    const pieces = this.walls[side];
    const n = Math.max(2, Math.ceil((a1 - a0) / 0.25));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      for (const y of [y0 + 0.02, (y0 + y1) / 2, y1 - 0.02]) {
        if (!pieces.some((p) => a >= p[0] - 0.01 && a <= p[1] + 0.01 && y >= p[2] - 0.01 && y <= p[3] + 0.01)) return false;
      }
    }
    return true;
  }

  // the stretches between the wall ribs on a side wall
  bays() {
    const cuts = [-this.L, ...this.ribs.filter((z) => z > -this.L + 0.5 && z < -0.5), 0];
    const out = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const lo = cuts[i] + (i === 0 ? 0.25 : 0.42), hi = cuts[i + 1] - (i === cuts.length - 2 ? 0.25 : 0.42);
      if (hi - lo > 0.8) out.push([lo, hi]);
    }
    return out;
  }

  // free runs along a side wall: [lo, hi] pieces of z where a box `depth` deep
  // from the wall, from y0 to y1, touches nothing (and stands on floor if asked)
  runs(side, lo, hi, depth, y0, y1, floor = false, step = 0.5) {
    const s = side === 'W' ? -1 : 1;
    const xa = Math.min(s * this.W / 2, s * (this.W / 2 - depth)), xb = Math.max(s * this.W / 2, s * (this.W / 2 - depth));
    const out = [];
    let start = null;
    for (let z = lo; z < hi - 0.01; z += step) {
      const z1 = Math.min(hi, z + step);
      const ok = this.wallAt(side, z, z1, y0, y1) && this.free([xa, y0, z, xb, y1, z1]) && (!floor || this.onFloor(xa, z, xb, z1));
      if (ok && start === null) start = z;
      if (!ok && start !== null) { out.push([start, z]); start = null; }
      if (ok && z1 >= hi - 0.01) out.push([start, z1]);
    }
    return out;
  }

  // free runs along z of a strip across the room (x0..x1), on the floor
  floorRuns(x0, x1, y1 = 0.05, step = 0.25) {
    const out = [];
    let start = null;
    for (let z = -this.L; z < -0.01; z += step) {
      const z1 = Math.min(0, z + step);
      const ok = this.onFloor(x0, z, x1, z1) && this.free([x0, 0, z, x1, y1, z1]);
      if (ok && start === null) start = z;
      if (!ok && start !== null) { out.push([start, z]); start = null; }
      if (ok && z1 >= -0.01) out.push([start, z1]);
    }
    return out;
  }
}

// --- collecting geometry, merged per material -----------------------------------
class Batch {
  constructor() {
    this.parts = new Map();
    this.m = null; // the current room's local -> world matrix
  }

  push(key, g) {
    let a = this.parts.get(key);
    if (!a) this.parts.set(key, (a = []));
    a.push(g);
  }

  box(key, x0, y0, z0, x1, y1, z1) {
    const g = boxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.applyMatrix4(this.m);
    this.push(key, g);
  }

  // a template shape at a room-local position, scale and rotation
  shape(key, geo, px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0, order = 'XYZ') {
    _e.set(rx, ry, rz, order);
    _q.setFromEuler(_e);
    this.shapeQ(key, geo, px, py, pz, sx, sy, sz, _q);
  }

  shapeQ(key, geo, px, py, pz, sx, sy, sz, q) {
    _m.compose(_p.set(px, py, pz), q, _s.set(sx, sy, sz)).premultiply(this.m);
    const g = geo.clone();
    g.applyMatrix4(_m);
    this.push(key, g);
  }

  build(root) {
    for (const [key, geos] of this.parts) {
      const mat = dmat(key);
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.castShadow = !NO_SHADOW.has(key);
      mesh.receiveShadow = !mat.isMeshBasicMaterial && !mat.isShaderMaterial;
      if (mat.transparent) mesh.renderOrder = 2;
      root.add(mesh);
      geos.forEach((g) => g.dispose());
    }
  }
}

// small helpers shared by the decks -------------------------------------------------
const sideSign = (side) => (side === 'W' ? -1 : 1);
const xr = (s, W, d0, d1) => [Math.min(s * (W / 2 - d0), s * (W / 2 - d1)), Math.max(s * (W / 2 - d0), s * (W / 2 - d1))];
// a box against a side wall: d0..d1 metres out from the wall, y0..y1, z0..z1
const wbox = (s, W, d0, d1, y0, y1, z0, z1) => {
  const [x0, x1] = xr(s, W, d0, d1);
  return [x0, y0, z0, x1, y1, z1];
};

function bush(B, x, y, z, h, w, turn) {
  for (let k = 0; k < 3; k++) B.shape('leaf', atlasPlane(0, 0, 2, 1), x, y + h / 2, z, w, h, 1, 0, turn + (k * Math.PI) / 3, 0);
}
function vine(B, s, W, z, len, H) {
  B.shape('leaf', atlasPlane(1, 0, 2, 1), s * (W / 2 - 0.2), H - len / 2, z, len * 0.32, len, 1, 0, -s * Math.PI / 2, 0);
}
function pipeZ(B, key, x, y, z0, z1, r) {
  B.shape(key, G.pipe(), x, y, (z0 + z1) / 2, r, z1 - z0, r, Math.PI / 2, 0, 0);
}
// a window to space on a side wall (or the north wall when s = 0)
function spaceWindow(B, s, W, a, b, y0, y1, L, frameKey, mullion = 1.4) {
  const len = b - a;
  if (s) {
    B.shape('space', G.plane(), s * (W / 2 - 0.03), (y0 + y1) / 2, (a + b) / 2, len, y1 - y0, 1, 0, -s * Math.PI / 2, 0);
    const [fx0, fx1] = xr(s, W, 0, 0.16);
    B.box(frameKey, fx0, y0 - 0.14, a, fx1, y0, b);
    B.box(frameKey, fx0, y1, a, fx1, y1 + 0.12, b);
    B.box(frameKey, fx0, y0, a, fx1, y1, a + 0.08);
    B.box(frameKey, fx0, y0, b - 0.08, fx1, y1, b);
    const n = Math.round(len / mullion);
    for (let i = 1; i < n; i++) {
      const z = a + (len * i) / n;
      B.box(frameKey, ...wbox(s, W, 0, 0.1, y0, y1, z - 0.04, z + 0.04));
    }
  } else {
    B.shape('space', G.plane(), (a + b) / 2, (y0 + y1) / 2, -L + 0.03, len, y1 - y0, 1);
    B.box(frameKey, a, y0 - 0.14, -L, b, y0, -L + 0.16);
    B.box(frameKey, a, y1, -L, b, y1 + 0.12, -L + 0.16);
    B.box(frameKey, a, y0, -L, a + 0.08, y1, -L + 0.16);
    B.box(frameKey, b - 0.08, y0, -L, b, y1, -L + 0.16);
    const n = Math.round(len / mullion);
    for (let i = 1; i < n; i++) {
      const x = a + (len * i) / n;
      B.box(frameKey, x - 0.04, y0, -L, x + 0.04, y1, -L + 0.1);
    }
  }
}
// windows on the north wall wherever it is solid (around and above the exit door)
function northWindows(R, B, frameKey, yTop) {
  const { W, H, L } = R;
  const cells = [];
  for (let x = -W / 2 + 0.6; x < W / 2 - 0.6 - 0.01; x += 0.5) {
    const x1 = Math.min(W / 2 - 0.6, x + 0.5);
    // the lowest window sill the wall (and anything standing against it) allows
    let y0 = 1.1;
    for (const p of R.walls.N) if (x1 > p[0] && x < p[1] && p[2] > 0.5 && p[2] < yTop) y0 = Math.max(y0, p[2] + 0.35);
    for (const b of R.block) if (x1 > b[0] && x < b[3] && b[5] > -L - 0.01 && b[2] < -L + 0.6) y0 = Math.max(y0, b[4] + 0.35);
    const ok = y0 < yTop - 1.0 && R.wallAt('N', x, x1, y0, yTop);
    cells.push(ok ? [x, x1, y0] : null);
  }
  let cur = null;
  const flush = () => { if (cur && cur[1] - cur[0] >= 1.0) spaceWindow(B, 0, W, cur[0], cur[1], cur[2], yTop, L, frameKey, 1.6); cur = null; };
  for (const c of cells) {
    if (c && cur && Math.abs(c[2] - cur[2]) < 0.01) cur[1] = c[1];
    else { flush(); if (c) cur = [...c]; }
  }
  flush();
}

// --- the decks ------------------------------------------------------------------------
const DECKS = {
  hydro(R, B, rng) {
    const { W, H } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      for (const [lo, hi] of R.bays()) {
        // planter troughs along the wall, full of leaves
        for (const [a, b] of R.runs(side, lo, hi, 0.95, 0, 1.6, true)) {
          if (b - a < 0.9) continue;
          const [x0, x1] = xr(s, W, 0.05, 0.9);
          B.box('trough', x0, 0, a + 0.05, x1, 0.55, b - 0.05);
          B.box('soil', x0 + 0.06, 0.55, a + 0.11, x1 - 0.06, 0.585, b - 0.11);
          for (let z = a + 0.32; z < b - 0.25; z += 0.4 + rng.float(0, 0.12)) {
            const h = rng.float(0.55, 1.15);
            bush(B, s * (W / 2 - 0.47) + rng.float(-0.1, 0.1), 0.56, z, h, h * rng.float(0.8, 1.15), rng.float(0, 3));
          }
        }
        // grow lights hanging over the beds
        for (const [a, b] of R.runs(side, lo, hi, 0.8, H - 0.45, H)) {
          if (b - a < 0.8) continue;
          const [x0, x1] = xr(s, W, 0.35, 0.72);
          B.box('housing', x0, H - 0.16, a + 0.1, x1, H - 0.05, b - 0.1);
          B.box('growLight', x0 + 0.04, H - 0.19, a + 0.14, x1 - 0.04, H - 0.16, b - 0.14);
          B.box('housing', (x0 + x1) / 2 - 0.01, H - 0.05, a + 0.3, (x0 + x1) / 2 + 0.01, H, a + 0.32);
        }
        // vines spilling down the wall
        const nv = rng.int(1, 3);
        for (let i = 0; i < nv; i++) {
          const z = rng.float(lo + 0.3, hi - 0.3), len = rng.float(1.4, 3.2);
          if (R.wallAt(side, z - 0.3, z + 0.3, H - len, H) && R.free(wbox(s, W, 0, 0.35, H - len, H, z - 0.3, z + 0.3))) vine(B, s, W, z, len, H);
        }
      }
    }
  },

  cryo(R, B, rng) {
    const { W, H, L } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      for (const [lo, hi] of R.bays()) {
        for (const [a, b] of R.runs(side, lo, hi, 1.15, 0, 2.6, true)) {
          const n = Math.floor((b - a) / 1.25);
          const off = (b - a - n * 1.25) / 2;
          for (let i = 0; i < n; i++) cryoPod(B, s, W, a + off + 1.25 * (i + 0.5), rng);
        }
      }
      // coolant lines under the ceiling, rimed with frost
      for (const [a, b] of R.runs(side, -L, 0, 0.7, H - 0.62, H)) {
        pipeZ(B, 'frostPipe', s * (W / 2 - 0.22), H - 0.3, a, b, 0.13);
        pipeZ(B, 'frostPipe', s * (W / 2 - 0.52), H - 0.26, a, b, 0.08);
        for (let z = a + 0.6; z < b; z += 2.2) B.box('podDark', ...wbox(s, W, 0, 0.62, H - 0.48, H - 0.42, z - 0.05, z + 0.05));
      }
    }
  },

  obs(R, B, rng) {
    const { W, H } = R;
    const bays = R.bays();
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      for (const [lo, hi] of bays) {
        for (const [a, b] of R.runs(side, lo, hi, 0.3, 2.95, H - 0.45)) if (b - a >= 1.2) spaceWindow(B, s, W, a + 0.05, b - 0.05, 3.1, H - 0.6, R.L, 'brass');
      }
    }
    // one orrery and one telescope per room, by the walls
    const spots = [];
    for (const side of rng.shuffle(['W', 'E'])) for (const [lo, hi] of rng.shuffle(bays)) spots.push([side, (lo + hi) / 2]);
    let orrery = false, scope = false;
    for (const [side, zc] of spots) {
      const s = sideSign(side);
      if (!orrery) {
        const [x0, x1] = xr(s, W, 0.25, 1.95);
        if (R.free([x0, 0, zc - 0.9, x1, 2.6, zc + 0.9]) && R.onFloor(x0, zc - 0.9, x1, zc + 0.9)) {
          orreryAt(B, R, s * (W / 2 - 1.1), zc, rng);
          orrery = true;
          continue;
        }
      }
      if (!scope) {
        const [x0, x1] = xr(s, W, 0.2, 1.7);
        if (R.free([x0, 0, zc - 1.0, x1, 3.2, zc + 1.0]) && R.onFloor(x0, zc - 1.0, x1, zc + 1.0)) {
          telescopeAt(B, s, s * (W / 2 - 1.05), zc);
          scope = true;
        }
      }
    }
  },

  eng(R, B, rng) {
    const { W, H, L } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      // three lines of pipe along the wall, with brackets and valves
      const py = 2.95; // just above the guide light
      for (const [a, b] of R.runs(side, -L, 0, 0.75, py - 0.15, py + 1.3)) {
        pipeZ(B, 'pipeRust', s * (W / 2 - 0.3), py + 1.0, a, b, 0.18);
        pipeZ(B, 'pipeCopper', s * (W / 2 - 0.2), py + 0.52, a, b, 0.1);
        pipeZ(B, 'pipeGreen', s * (W / 2 - 0.18), py + 0.12, a, b, 0.075);
        const [bx0, bx1] = xr(s, W, 0, 0.52);
        for (let z = a + 0.4; z < b; z += 1.6) B.box('bracket', bx0, py - 0.02, z - 0.04, bx1, py + 1.22, z + 0.04);
        for (let z = a + 2 + rng.float(0, 2); z < b - 0.4; z += rng.float(4, 7)) {
          B.shape('valve', G.torus(), s * (W / 2 - 0.44), py + 0.52, z, 0.17, 0.17, 0.17, 0, Math.PI / 2, 0);
          B.box('valve', ...wbox(s, W, 0.3, 0.44, py + 0.49, py + 0.55, z - 0.03, z + 0.03));
          B.box('valve', ...wbox(s, W, 0.43, 0.45, py + 0.36, py + 0.68, z - 0.015, z + 0.015));
        }
      }
      // drop pipes beside some ribs
      for (const rz of R.ribs) {
        if (!rng.chance(0.6)) continue;
        const z = rz + (rng.chance(0.5) ? 0.55 : -0.55);
        const [x0, x1] = xr(s, W, 0, 0.32);
        if (!R.wallAt(side, z - 0.15, z + 0.15, 0, 3.95) || !R.free([x0, 0, z - 0.15, x1, 3.9, z + 0.15]) || !R.onFloor(x0, z - 0.15, x1, z + 0.15)) continue;
        B.shape('pipeRust', G.pipe(), s * (W / 2 - 0.17), 3.95 / 2, z, 0.09, 3.95, 0.09);
        B.shape('bracket', G.cyl(), s * (W / 2 - 0.17), 0.04, z, 0.15, 0.08, 0.15);
      }
      // a fat main along the ceiling
      for (const [a, b] of R.runs(side, -L, 0, 1.45, H - 0.6, H)) {
        pipeZ(B, 'pipeRust', s * (W / 2 - 1.1), H - 0.33, a, b, 0.21);
        for (let z = a + 0.8; z < b; z += 2.4) B.box('bracket', s * (W / 2 - 1.1) - 0.03, H - 0.33, z - 0.03, s * (W / 2 - 1.1) + 0.03, H, z + 0.03);
      }
    }
    // hazard stripes on both lips of every pit, and painted rings where the time sweepers turn
    for (const p of R.pits) {
      for (const [z0, z1] of [[p[5], p[5] + 0.5], [p[2] - 0.5, p[2]]]) {
        if (R.onFloor(-W / 2 + 0.05, z0 + 0.05, W / 2 - 0.05, z1 - 0.05)) B.box('hazard', -W / 2, 0, z0, W / 2, 0.008, z1);
      }
    }
    for (const hz of R.hazards) B.shape('hazard', G.ring(), hz.x, 0.01, hz.z, hz.r, hz.r, 1, -Math.PI / 2, 0, 0);
    // one boiler tank per room, where there is room for it
    for (const side of rng.shuffle(['W', 'E'])) {
      const s = sideSign(side);
      const fits = ([lo, hi]) => {
        const zc = (lo + hi) / 2, b = wbox(s, W, 0.05, 1.35, 0, 2.8, zc - 0.7, zc + 0.7);
        return hi - lo > 1.6 && R.free(b) && R.onFloor(b[0], b[2], b[3], b[5]);
      };
      const bay = rng.shuffle(R.bays()).find(fits);
      if (!bay) continue;
      const zc = (bay[0] + bay[1]) / 2, x = s * (W / 2 - 0.7);
      B.shape('tank', G.cyl(), x, 1.25, zc, 0.6, 2.3, 0.6);
      B.shape('tank', G.sph(), x, 2.4, zc, 0.6, 0.35, 0.6);
      for (const y of [0.4, 1.25, 2.1]) B.shape('bracket', G.cyl(), x, y, zc, 0.62, 0.08, 0.62);
      B.shape('gauge', G.disc(), x - s * 0.61, 1.6, zc, 0.13, 0.13, 1, 0, -s * Math.PI / 2, 0);
      break;
    }
  },

  med(R, B, rng) {
    const { W, H, L } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      // a steel rail where the tiles change colour
      for (const [a, b] of R.runs(side, -L, 0, 0.06, 1.18, 1.32)) B.box('steel', ...wbox(s, W, 0, 0.045, 1.21, 1.29, a, b));
      for (const [lo, hi] of R.bays()) {
        // beds along the wall, a monitor at each head, glass between them
        for (const [a, b] of R.runs(side, lo, hi, 1.3, 0, 1.9, true)) {
          const n = Math.floor((b - a) / 2.45);
          const off = (b - a - n * 2.45) / 2;
          for (let i = 0; i < n; i++) {
            const z0 = a + off + i * 2.45;
            bedAt(B, s, W, z0 + 0.15, z0 + 2.3, rng.chance(0.5), true);
            if (i > 0) B.box('medGlass', ...wbox(s, W, 0, 1.4, 0.05, 2.25, z0 - 0.015, z0 + 0.015));
          }
        }
        // wall cabinets up above
        for (const [a, b] of R.runs(side, lo, hi, 0.4, 2.85, 3.8)) {
          if (b - a < 1.0) continue;
          const len = Math.min(1.8, b - a - 0.2), zc = (a + b) / 2;
          const [x0, x1] = xr(s, W, 0, 0.36);
          B.box('cabinet', x0, 2.9, zc - len / 2, x1, 3.7, zc + len / 2);
          const [g0, g1] = xr(s, W, 0.36, 0.37);
          B.box('cabinetGlass', g0, 2.98, zc - len / 2 + 0.06, g1, 3.62, zc - 0.03);
          B.box('cabinetGlass', g0, 2.98, zc + 0.03, g1, 3.62, zc + len / 2 - 0.06);
        }
      }
    }
    // guide lines painted along the floor
    for (const [x, key] of [[-(W / 2 - 1.75), 'lineTeal'], [W / 2 - 1.75, 'lineBlue']]) {
      for (const [a, b] of R.floorRuns(x - 0.06, x + 0.06)) if (b - a > 0.6) B.box(key, x - 0.06, 0, a + 0.05, x + 0.06, 0.005, b - 0.05);
    }
  },

  crew(R, B, rng) {
    const { W, H, L } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      for (const [a, b] of R.runs(side, -L, 0, 0.06, 0.95, 1.08)) B.box('woodDark', ...wbox(s, W, 0, 0.05, 0.97, 1.06, a, b));
      for (const [lo, hi] of R.bays()) {
        // bunks with a lamp on a little table between them
        for (const [a, b] of R.runs(side, lo, hi, 1.05, 0, 2.5, true)) {
          const n = Math.floor((b - a + 0.6) / 2.75);
          if (!n) {
            if (b - a > 0.8) tableLamp(B, R, s, W, (a + b) / 2);
            continue;
          }
          const off = (b - a - (n * 2.75 - 0.65)) / 2;
          for (let i = 0; i < n; i++) {
            const z0 = a + off + i * 2.75;
            bunkAt(B, s, W, z0, z0 + 2.1, rng);
            if (i < n - 1 || z0 + 2.75 <= b) tableLamp(B, R, s, W, z0 + 2.42);
          }
        }
        // a poster in every bay
        for (const [a, b] of R.runs(side, lo, hi, 0.06, 2.8, 4.1)) {
          if (b - a < 1.0) continue;
          const k = rng.int(0, 3);
          B.shape('poster', atlasPlane(k % 2, (k / 2) | 0, 2, 2), s * (W / 2 - 0.015), 3.42, (a + b) / 2 + rng.float(-0.2, 0.2), 0.85, 1.05, 1, 0, -s * Math.PI / 2, 0);
          break;
        }
      }
    }
    // a rug in the middle of the room
    const zs = [];
    for (let z = -L / 2; z > -L + 2; z -= 1) zs.push(z);
    for (let z = -L / 2 + 1; z < -2; z += 1) zs.push(z);
    for (const zc of zs) {
      if (R.onFloor(-1.3, zc - 1.8, 1.3, zc + 1.8) && R.free([-1.3, 0, zc - 1.8, 1.3, 0.05, zc + 1.8])) {
        B.shape('rug', atlasPlane(rng.int(0, 1), 0, 2, 1), 0, 0.006, zc, 2.6, 3.6, 1, -Math.PI / 2, 0, 0);
        break;
      }
    }
  },

  arch(R, B, rng) {
    const { W, H } = R;
    const Hs = H - 0.2;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      for (const [lo, hi] of R.bays()) {
        // shelves to the ceiling: books, and racks of glowing data drums
        for (const [a, b] of R.runs(side, lo, hi, 0.65, 0, Hs, true)) {
          if (b - a < 0.8) continue;
          const [x0, x1] = xr(s, W, 0, 0.62);
          B.box('shelfWood', x0, 0, a, x1, Hs, a + 0.06);
          B.box('shelfWood', x0, 0, b - 0.06, x1, Hs, b);
          B.box('shelfWood', x0, Hs - 0.08, a, x1, Hs, b);
          for (let y = 0.1; y < Hs - 0.3; y += 0.55) B.box('shelfWood', x0, y - 0.04, a + 0.06, x1, y, b - 0.06);
          const len = b - a - 0.12, rows = (Hs - 0.18) / 0.55;
          B.shape('books', repeatPlane(len / 1.1, rows), s * (W / 2 - 0.05), 0.06 + (Hs - 0.18) / 2 + 0.0, (a + b) / 2, len, Hs - 0.18, 1, 0, -s * Math.PI / 2, 0);
          if (rng.chance(0.3) && b - a > 1.6) {
            // a library ladder leaning on the shelf
            const z = rng.float(a + 0.5, b - 0.5), lean = 0.2, top = Hs * 0.9;
            const foot = s * (W / 2 - 0.62 - top * Math.tan(lean)), head = s * (W / 2 - 0.62);
            for (const dz of [-0.22, 0.22]) B.shape('woodDark', G.box(), (foot + head) / 2, top / 2, z + dz, 0.05, top / Math.cos(lean), 0.05, 0, 0, s * lean);
            for (let y = 0.4; y < top - 0.1; y += 0.4) {
              const x = foot + (head - foot) * (y / top);
              B.box('woodDark', x - 0.025, y, z - 0.22, x + 0.025, y + 0.04, z + 0.22);
            }
          }
        }
      }
      // warm sconces on the ribs, pooling light on the floor
      for (const rz of R.ribs) {
        const [x0, x1] = xr(s, W, 0.28, 0.4);
        if (!R.free([x0, 3.1, rz - 0.15, x1, 3.6, rz + 0.15]) || !R.wallAt(side, rz - 0.1, rz + 0.1, 3.1, 3.6)) continue;
        B.box('sconce', x0, 3.2, rz - 0.1, x1, 3.48, rz + 0.1);
        B.box('shelfWood', x0, 3.14, rz - 0.13, x1, 3.2, rz + 0.13);
        if (R.floorAt(s * (W / 2 - 1.4), rz)) R.glow(s * (W / 2 - 1.4), rz, 3, 0xffb870);
      }
    }
  },

  bridge(R, B, rng) {
    const { W, H } = R;
    for (const side of ['W', 'E']) {
      const s = sideSign(side);
      R.bays().forEach(([lo, hi], i) => {
        // consoles along the wall
        for (const [a, b] of R.runs(side, lo, hi, 1.0, 0, 1.5, true)) if (b - a >= 1.2) consoleRun(B, s, W, a + 0.05, b - 0.05, rng);
        // above: alternate big displays and windows
        for (const [a, b] of R.runs(side, lo, hi, 0.3, 2.9, H - 0.4)) {
          if (b - a < 1.2) continue;
          if ((i + (s > 0 ? 1 : 0)) % 2 === 0) spaceWindow(B, s, W, a + 0.05, b - 0.05, 3.0, H - 0.6, R.L, 'consoleBody', 1.5);
          else {
            const len = Math.min(2.6, b - a - 0.2), zc = (a + b) / 2;
            B.box('consoleBody', ...wbox(s, W, 0, 0.08, 2.95, 4.45, zc - len / 2 - 0.08, zc + len / 2 + 0.08));
            const k = rng.int(0, 3);
            B.shape('screen', atlasPlane(k % 2, (k / 2) | 0, 2, 2), s * (W / 2 - 0.09), 3.7, zc, len, 1.35, 1, 0, -s * Math.PI / 2, 0);
          }
        }
      });
    }
    // the great forward window (not behind the plaque of a story room)
    if (R.kind === 'puzzle') northWindows(R, B, 'consoleBody', H - 0.5);
    // a runner down the middle
    for (const [a, b] of R.floorRuns(-0.95, 0.95)) {
      if (b - a < 1.0) continue;
      B.box('runner', -0.8, 0, a, 0.8, 0.006, b);
      B.box('runnerEdge', -0.9, 0, a, -0.8, 0.009, b);
      B.box('runnerEdge', 0.8, 0, a, 0.9, 0.009, b);
    }
    // the captain's chair stands on a dais
    if (R.beat === 'verdict') {
      B.shape('dais', G.cyl(), 0, 0.012, -6.6, 2.5, 0.024, 2.5);
      for (const r of [1.6, 2.35]) B.shape('goldGlow', G.ring(), 0, 0.03, -6.6, r, r, 1, -Math.PI / 2, 0, 0);
    }
  },
};

// --- pieces ---------------------------------------------------------------------------
function cryoPod(B, s, W, z, rng) {
  const x = s * (W / 2 - 0.62);
  B.shape('podMetal', G.cyl(), x, 0.11, z, 0.5, 0.22, 0.5);
  B.shape('podGlow', G.torus(), x, 0.25, z, 0.44, 0.44, 0.44, Math.PI / 2, 0, 0);
  B.shape('podGlass', G.tube(), x, 1.19, z, 0.44, 1.9, 0.44);
  B.shape('podMetal', G.cyl(), x, 2.29, z, 0.5, 0.3, 0.5);
  B.shape('podGlow', G.torus(), x, 2.13, z, 0.44, 0.44, 0.44, Math.PI / 2, 0, 0);
  B.box('podDark', ...wbox(s, W, 0, 0.32, 0, 2.44, z - 0.17, z + 0.17));
  B.box(rng.chance(0.8) ? 'statusBlue' : 'statusAmber', x - s * 0.5 - 0.02, 2.22, z - 0.06, x - s * 0.5 + 0.02, 2.3, z + 0.06);
  if (rng.chance(0.65)) {
    B.shape('sleeper', G.body(), x + s * 0.06, 1.12, z, 1, 1, 1);
    B.shape('sleeper', G.sph(), x + s * 0.06, 1.84, z, 0.13, 0.15, 0.13);
  }
}
// a cryo capsule lying down (the generator's pods, re-dressed)
function cryoCapsule(B, b, rng) {
  const [x0, , z0, x1, , z1] = b;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, l = z1 - z0;
  const along = l >= w; // the capsule's long axis
  B.box('podMetal', x0, 0, z0, x1, 0.55, z1);
  B.box('podGlow', x0 - 0.01, 0.42, z0 - 0.01, x1 + 0.01, 0.46, z1 + 0.01);
  const rw = (along ? w : l) / 2 - 0.05, len = (along ? l : w) - 0.1;
  if (along) {
    B.shape('podGlass', G.halfCyl(), cx, 0.55, cz, rw, len, 0.62, -Math.PI / 2, 0, 0);
    if (rng.chance(0.7)) B.shape('sleeper', G.body(), cx, 0.78, cz, 1, 1, 1, Math.PI / 2, 0, 0);
  } else {
    B.shape('podGlass', G.halfCyl(), cx, 0.55, cz, rw, len, 0.62, -Math.PI / 2, Math.PI / 2, 0, 'YXZ');
    if (rng.chance(0.7)) B.shape('sleeper', G.body(), cx, 0.78, cz, 1, 1, 1, 0, 0, Math.PI / 2);
  }
}
function orreryAt(B, R, x, z, rng) {
  B.shape('brass', G.cyl(), x, 0.05, z, 0.5, 0.1, 0.5);
  B.shape('navy', G.cyl(), x, 0.18, z, 0.38, 0.16, 0.38);
  B.shape('brass', G.cyl(), x, 0.95, z, 0.06, 1.5, 0.06);
  B.shape('sun', G.sph(), x, 1.85, z, 0.17, 0.17, 0.17);
  R.orrery.push({ x, y: 1.85, z, seed: rng.float(0, 6) });
}
function telescopeAt(B, s, x, z) {
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    B.shape('brass', G.cyl(), x + Math.cos(a) * 0.32, 0.6, z + Math.sin(a) * 0.32, 0.025, 1.3, 0.025, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
  }
  B.shape('navy', G.box(), x, 1.2, z, 0.22, 0.2, 0.22);
  // the tube points up at the windows
  const d = new THREE.Vector3(s * 0.55, 0.83, 0).normalize();
  _q2.setFromUnitVectors(_up, d);
  B.shapeQ('navy', G.cyl(), x + d.x * 0.35, 1.3 + d.y * 0.35, z, 0.17, 2.0, 0.17, _q2);
  B.shapeQ('brass', G.cyl(), x + d.x * 1.32, 1.3 + d.y * 1.32, z, 0.21, 0.12, 0.21, _q2);
  B.shapeQ('brass', G.cyl(), x - d.x * 0.62, 1.3 - d.y * 0.62, z, 0.07, 0.25, 0.07, _q2);
}
function bedAt(B, s, W, za, zb, headLo, monitor, xs = xr(s, W, 0.15, 1.12)) {
  const [x0, x1] = xs;
  for (const zz of [za + 0.06, zb - 0.06]) for (const xx of [x0 + 0.06, x1 - 0.06]) B.box('steel', xx - 0.03, 0, zz - 0.03, xx + 0.03, 0.32, zz + 0.03);
  B.box('steel', x0, 0.3, za, x1, 0.42, zb);
  B.box('linen', x0 + 0.04, 0.42, za + 0.05, x1 - 0.04, 0.6, zb - 0.05);
  const zh = headLo ? za : zb, dir = headLo ? 1 : -1;
  B.box('linen2', x0 + 0.15, 0.6, Math.min(zh + dir * 0.1, zh + dir * 0.5), x1 - 0.15, 0.72, Math.max(zh + dir * 0.1, zh + dir * 0.5));
  const bz0 = zh + dir * 0.75, bz1 = headLo ? zb - 0.03 : za + 0.03;
  B.box('blanketTeal', x0 + 0.02, 0.6, Math.min(bz0, bz1), x1 - 0.02, 0.66, Math.max(bz0, bz1));
  B.box('steel', x0, 0.3, Math.min(zh, zh - dir * 0.05), x1, 1.05, Math.max(zh, zh - dir * 0.05));
  if (monitor) {
    const px = s * (W / 2 - 0.22), pz = zh - dir * 0.18;
    B.box('steel', px - 0.025, 0, pz - 0.025, px + 0.025, 1.55, pz + 0.025);
    B.box('monitor', px - s * 0.02 - 0.06, 1.42, pz - 0.27, px - s * 0.02 + 0.06, 1.86, pz + 0.27);
    B.shape('ecg', G.plane(), px - s * 0.09, 1.64, pz, 0.48, 0.36, 1, 0, -s * Math.PI / 2, 0);
  }
}
function bunkAt(B, s, W, za, zb, rng) {
  const [x0, x1] = xr(s, W, 0.08, 1.0);
  for (const zz of [za + 0.04, zb - 0.04]) for (const xx of [x0 + 0.04, x1 - 0.04]) B.box('wood', xx - 0.04, 0, zz - 0.04, xx + 0.04, 2.3, zz + 0.04);
  const headLo = rng.chance(0.5);
  for (const y of [0.3, 1.5]) {
    B.box('wood', x0, y, za, x1, y + 0.16, zb);
    B.box('linen', x0 + 0.05, y + 0.16, za + 0.06, x1 - 0.05, y + 0.32, zb - 0.06);
    const zh = headLo ? za + 0.06 : zb - 0.06, dir = headLo ? 1 : -1;
    B.box('linen2', x0 + 0.12, y + 0.32, Math.min(zh, zh + dir * 0.42), x1 - 0.12, y + 0.42, Math.max(zh, zh + dir * 0.42));
    const b0 = zh + dir * 0.55, b1 = headLo ? zb - 0.03 : za + 0.03;
    B.box(`blanket${rng.int(0, 3)}`, x0 + 0.03, y + 0.3, Math.min(b0, b1), x1 - 0.03, y + 0.37, Math.max(b0, b1));
  }
  // a guard rail on the top bunk and a ladder at the foot
  const xg = s > 0 ? x0 : x1;
  B.box('wood', xg - 0.03, 1.82, za + 0.5, xg + 0.03, 1.98, zb - 0.1);
  const zl = headLo ? zb - 0.3 : za + 0.3;
  for (const dz of [-0.18, 0.18]) B.box('woodDark', xg - s * 0.06 - 0.025, 0, zl + dz - 0.025, xg - s * 0.06 + 0.025, 1.9, zl + dz + 0.025);
  for (let y = 0.35; y < 1.9; y += 0.38) B.box('woodDark', xg - s * 0.06 - 0.02, y, zl - 0.18, xg - s * 0.06 + 0.02, y + 0.04, zl + 0.18);
}
function tableLamp(B, R, s, W, z) {
  const [x0, x1] = xr(s, W, 0.12, 0.62);
  if (!R.free([x0, 0, z - 0.3, x1, 1.2, z + 0.3]) || !R.onFloor(x0, z - 0.3, x1, z + 0.3)) return;
  B.box('wood', x0, 0, z - 0.26, x1, 0.6, z + 0.26);
  const cx = (x0 + x1) / 2;
  B.shape('woodDark', G.cyl(), cx, 0.66, z, 0.07, 0.12, 0.07);
  B.shape('woodDark', G.cyl(), cx, 0.82, z, 0.015, 0.3, 0.015);
  B.shape('lampShade', G.shade(), cx, 1.05, z, 0.17, 0.22, 0.17);
  R.glow(cx - s * 0.6, z, 3, 0xffc890);
}
function consoleRun(B, s, W, a, b, rng) {
  const [x0, x1] = xr(s, W, 0.04, 0.78);
  B.box('consoleBody', x0, 0, a, x1, 0.82, b);
  const xm = s * (W / 2 - 0.52);
  B.shape('consoleBody', G.box(), xm, 0.92, (a + b) / 2, 0.6, 0.08, b - a, 0, 0, s * 0.42);
  const n = Math.max(1, Math.round((b - a) / 0.9));
  for (let i = 0; i < n; i++) {
    const z = a + ((b - a) * (i + 0.5)) / n, k = rng.int(0, 3);
    B.shape('screen', atlasPlane(k % 2, (k / 2) | 0, 2, 2), xm - s * 0.0205, 0.9657, z, 0.5, 0.42, 1, -Math.PI / 2, 0, s * 0.42, 'ZYX');
  }
  B.box('consoleLights', ...wbox(s, W, 0.78, 0.8, 0.7, 0.74, a + 0.1, b - 0.1));
}

// --- generic furniture, re-dressed per deck -------------------------------------
const RESKINS = {
  hydro: {
    planter(B, b, rng) {
      const [x0, , z0, x1, y1, z1] = b;
      B.box('soil', x0 + 0.08, y1, z0 + 0.08, x1 - 0.08, y1 + 0.03, z1 - 0.08);
      for (let i = 0; i < 4; i++) bush(B, rng.float(x0 + 0.35, x1 - 0.35), y1, rng.float(z0 + 0.35, z1 - 0.35), rng.float(0.7, 1.3), rng.float(0.8, 1.2), rng.float(0, 3));
    },
  },
  cryo: { pod: (B, b, rng) => cryoCapsule(B, b, rng) },
  obs: {
    lamp(B, b) {
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      B.shape('brass', G.cyl(), cx, 0.06, cz, 0.34, 0.12, 0.34);
      B.shape('navy', G.cyl(), cx, 0.95, cz, 0.12, 1.7, 0.12);
      B.shape('globe', G.sph(), cx, 2.1, cz, 0.28, 0.28, 0.28);
      B.shape('brass', G.torus(), cx, 2.1, cz, 0.36, 0.36, 0.36, 1.2, 0.3, 0);
    },
  },
  eng: {
    lamp(B, b) {
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      B.shape('tank', G.cyl(), cx, 1.15, cz, 0.34, 2.3, 0.34);
      B.shape('tank', G.sph(), cx, 2.3, cz, 0.34, 0.2, 0.34);
      for (const y of [0.3, 1.2, 2.0]) B.shape('bracket', G.cyl(), cx, y, cz, 0.36, 0.07, 0.36);
      B.shape('gauge', G.sph(), cx, 1.6, cz, 0.36, 0.06, 0.36);
      B.shape('valve', G.torus(), cx, 2.5, cz, 0.14, 0.14, 0.14, Math.PI / 2, 0, 0);
    },
  },
  med: {
    bench(B, b, rng) {
      // a bed in the same footprint
      const [x0, , z0, x1, , z1] = b;
      bedAt(B, (x0 + x1) / 2 < 0 ? -1 : 1, 0, z0 + 0.05, z1 - 0.05, rng.chance(0.5), false, [x0 - 0.08, x1 + 0.08]);
    },
    console(B, b) {
      const [x0, , z0, x1, , z1] = b;
      B.box('cabinet', x0 + 0.05, 0.08, z0 + 0.05, x1 - 0.05, 0.85, z1 - 0.05);
      for (const xx of [x0 + 0.1, x1 - 0.1]) for (const zz of [z0 + 0.1, z1 - 0.1]) B.shape('monitor', G.cyl(), xx, 0.04, zz, 0.05, 0.08, 0.05);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wide = x1 - x0 > z1 - z0;
      B.box('monitor', cx - (wide ? 0.42 : 0.05), 0.9, cz - (wide ? 0.05 : 0.42), cx + (wide ? 0.42 : 0.05), 1.42, cz + (wide ? 0.05 : 0.42));
      for (const d of [-1, 1]) B.shape('ecg', G.plane(), cx + (wide ? 0 : d * 0.06), 1.16, cz + (wide ? d * 0.06 : 0), 0.74, 0.44, 1, 0, wide ? (d > 0 ? 0 : Math.PI) : (d > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
    },
    pod(B, b) {
      const [x0, , z0, x1, , z1] = b;
      B.box('cabinet', x0, 0, z0, x1, 0.8, z1);
      B.box('lineTeal', x0 - 0.01, 0.62, z0 - 0.01, x1 + 0.01, 0.68, z1 + 0.01);
      B.box('linen', x0 + 0.1, 0.8, z0 + 0.1, x1 - 0.1, 0.9, z1 - 0.1);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, along = z1 - z0 > x1 - x0;
      B.shape('steel', G.torus(), cx, 1.0, cz + (along ? (z1 - z0) * 0.2 : 0), 0.62, 0.62, 2.2, 0, along ? 0 : Math.PI / 2, 0);
    },
  },
  crew: {
    bench(B, b, rng) {
      const [x0, , z0, x1, , z1] = b;
      const s = (x0 + x1) / 2 < 0 ? -1 : 1, fab = `fabric${rng.int(0, 2)}`;
      const wall = s > 0 ? x1 : x0;
      B.box('woodDark', x0, 0, z0, x1, 0.14, z1);
      B.box(fab, x0 + 0.03, 0.14, z0 + 0.12, x1 - 0.03, 0.42, z1 - 0.12);
      B.box(fab, Math.min(wall, wall - s * 0.22), 0.42, z0 + 0.12, Math.max(wall, wall - s * 0.22), 0.95, z1 - 0.12);
      B.box(fab, x0, 0.14, z0, x1, 0.62, z0 + 0.13);
      B.box(fab, x0, 0.14, z1 - 0.13, x1, 0.62, z1);
      B.box('linen2', Math.min(wall - s * 0.24, wall - s * 0.42), 0.42, z0 + 0.3, Math.max(wall - s * 0.24, wall - s * 0.42), 0.72, z0 + 0.62);
    },
    planter(B, b, rng) {
      const [x0, , z0, x1, y1, z1] = b;
      B.box('soil', x0 + 0.08, y1, z0 + 0.08, x1 - 0.08, y1 + 0.03, z1 - 0.08);
      for (let i = 0; i < 3; i++) bush(B, rng.float(x0 + 0.4, x1 - 0.4), y1, rng.float(z0 + 0.4, z1 - 0.4), rng.float(0.8, 1.4), rng.float(0.8, 1.1), rng.float(0, 3));
    },
    lamp(B, b, rng, R) {
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      B.shape('woodDark', G.cyl(), cx, 0.03, cz, 0.28, 0.06, 0.28);
      B.shape('woodDark', G.cyl(), cx, 0.95, cz, 0.025, 1.8, 0.025);
      B.shape('lampShade', G.shade(), cx, 1.95, cz, 0.3, 0.38, 0.3);
      R.glow(cx, cz, 3, 0xffc890);
    },
  },
  arch: {
    lamp(B, b) {
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      B.shape('darkMetal', G.cyl(), cx, 1.2, cz, 0.33, 2.4, 0.33);
      for (let y = 0.45; y < 2.3; y += 0.36) B.shape('drumGlow', G.cyl(), cx, y, cz, 0.345, 0.07, 0.345);
    },
    console(B, b) {
      const [x0, , z0, x1, , z1] = b;
      B.box('shelfWood', x0, 0.82, z0, x1, 0.9, z1);
      for (const xx of [x0 + 0.06, x1 - 0.06]) for (const zz of [z0 + 0.06, z1 - 0.06]) B.box('shelfWood', xx - 0.04, 0, zz - 0.04, xx + 0.04, 0.82, zz + 0.04);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      B.box('paper', cx - 0.25, 0.9, cz - 0.17, cx + 0.25, 0.93, cz + 0.17);
      B.box('woodDark', cx + 0.3, 0.9, cz - 0.05, cx + 0.34, 1.25, cz + 0.05);
      B.shape('deskLamp', G.halfCyl(), cx + 0.32, 1.27, cz, 0.12, 0.34, 0.09, -Math.PI / 2, 0, 0);
    },
  },
  bridge: {
    console(B, b, rng) {
      const [x0, , z0, x1, , z1] = b;
      B.box('consoleBody', x0, 0, z0, x1, 0.8, z1);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wide = x1 - x0 > z1 - z0;
      const k = rng.int(0, 3);
      B.shape('screen', atlasPlane(k % 2, (k / 2) | 0, 2, 2), cx, 0.81, cz, (wide ? x1 - x0 : z1 - z0) - 0.12, (wide ? z1 - z0 : x1 - x0) - 0.12, 1, -Math.PI / 2, wide ? 0 : Math.PI / 2, 0, 'YXZ');
      B.box('consoleLights', x0 - 0.01, 0.6, z0 - 0.01, x1 + 0.01, 0.63, z1 + 0.01);
    },
    lamp(B, b) {
      const cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      B.shape('consoleBody', G.cyl(), cx, 0.6, cz, 0.3, 1.2, 0.3);
      B.shape('consoleLights', G.cyl(), cx, 1.22, cz, 0.26, 0.04, 0.26);
      B.shape('holo', G.shade(), cx, 1.75, cz, 0.3, 1.0, 0.3, Math.PI, 0, 0);
    },
  },
};

// --- building it all -------------------------------------------------------------------
// Returns the decor's root objects, light pools (for main.js's lamp lights) and
// an update function for the moving parts (window skies, monitors, orreries, gears).
export function buildDecor(level) {
  const look = level.palette.look;
  const deck = DECKS[look];
  if (!deck) return null;
  const B = new Batch();
  const glows = [];
  const orrery = [];
  const gears = [];
  const byRoom = new Map();
  for (const el of level.elements) {
    if (!byRoom.has(el.room)) byRoom.set(el.room, []);
    byRoom.get(el.room).push(el);
  }
  const reskin = RESKIN[look] || {};
  for (const rid of level.order) {
    const R = new Room(level, rid, byRoom.get(rid) || []);
    const rng = Rng.from('decor', level.seed ?? 0, level.id, rid);
    B.m = R.m;
    R.glow = (x, z, r, c) => {
      const [wx, wz] = R.toWorld(x, z);
      glows.push([wx, 0, wz, r, c]);
    };
    R.orrery = [];
    R.hazards = level.hazards.filter((h) => h.room === rid).map((h) => {
      const b = R.toLocal([h.pivot[0], 0, h.pivot[2], h.pivot[0], 0, h.pivot[2]]);
      return { x: b[0], z: b[2], r: h.radius };
    });
    deck(R, B, rng);
    for (const p of R.props) if (reskin[p.kind] && RESKINS[look]?.[p.kind]) RESKINS[look][p.kind](B, p.b, rng, R);
    for (const o of R.orrery) {
      const [wx, wz] = R.toWorld(o.x, o.z);
      for (let k = 0; k < 3; k++) orrery.push({ x: wx, y: o.y, z: wz, r: 0.42 + k * 0.2, tilt: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25 + k * 0.18, o.seed + k * 1.9, 0.12 * k)), speed: 0.5 - k * 0.14, a: o.seed * (k + 1) });
    }
    if (look === 'eng') placeGears(R, rng, gears);
  }
  const root = new THREE.Group();
  B.build(root);
  if (orrery.length) {
    const geo = tpl('orreryRing', () => {
      const t = new THREE.TorusGeometry(1, 0.025, 6, 48).rotateX(Math.PI / 2);
      const p = new THREE.SphereGeometry(0.09, 10, 8).translate(1, 0, 0);
      return mergeGeometries([t, p]);
    });
    const inst = new THREE.InstancedMesh(geo, dmat('brass'), orrery.length);
    inst.castShadow = true;
    root.add(inst);
    orrery.mesh = inst;
  }
  const gearMeshes = {};
  for (const kind of ['big', 'small']) {
    const list = gears.filter((g) => g.kind === kind);
    if (!list.length) continue;
    const inst = new THREE.InstancedMesh(kind === 'big' ? gearGeometry(18, 1.1) : gearGeometry(10, 0.611), dmat(kind === 'big' ? 'gearIron' : 'gearBrass'), list.length);
    inst.castShadow = inst.receiveShadow = true;
    root.add(inst);
    gearMeshes[kind] = { inst, list };
  }
  const space = _dm.get('space');
  const ecg = TEX.ecg;
  const pod = look === 'cryo' ? dmat('podGlow') : null;
  const frozen = {};
  const update = (dt, t, world) => {
    if (space) space.uniforms.time.value = t;
    if (ecg) ecg.offset.x = (t * 0.22) % 1;
    if (pod) pod.color.setRGB(0.5, 0.88, 1.0).multiplyScalar(1.15 + Math.sin(t * 1.3) * 0.25);
    if (orrery.mesh) {
      for (let i = 0; i < orrery.length; i++) {
        const o = orrery[i];
        o.a += dt * o.speed;
        _q.setFromAxisAngle(_up, o.a).premultiply(o.tilt);
        _m.compose(_p.set(o.x, o.y, o.z), _q, _s.set(o.r, o.r, o.r));
        orrery.mesh.setMatrixAt(i, _m);
      }
      orrery.mesh.instanceMatrix.needsUpdate = true;
    }
    // the clockwork deck's gears stop when time freezes in their room
    for (const k in frozen) delete frozen[k];
    for (const kind in gearMeshes) {
      const { inst, list } = gearMeshes[kind];
      for (let i = 0; i < list.length; i++) {
        const g = list[i];
        if (!(g.room in frozen)) frozen[g.room] = world.engine.hasIn('timeStop', g.room);
        if (!frozen[g.room]) g.a += dt * g.speed;
        _q.setFromAxisAngle(_p.set(0, 0, 1), g.a).premultiply(g.face);
        _m.compose(_p.set(g.x, g.y, g.z), _q, _s.set(1, 1, 1));
        inst.setMatrixAt(i, _m);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
  };
  update(0, 0, { engine: { hasIn: () => true } });
  return { root, glows, update };
}

// two meshing gears on the wall of some bays (Engineering)
function placeGears(R, rng, out) {
  const { W, H } = R;
  if (H < 6.2) return;
  let placed = 0;
  for (const side of rng.shuffle(['W', 'E'])) {
    const s = sideSign(side);
    for (const [lo, hi] of rng.shuffle(R.bays())) {
      if (placed >= 2 || hi - lo < 2.8) continue;
      const yc = H - 1.42; // above the pipe runs
      const ok = R.wallAt(side, lo, hi, yc - 1.25, yc + 1.25) && R.free(wbox(s, W, 0, 0.35, yc - 1.25, yc + 1.25, lo, hi));
      if (!ok) continue;
      const z1 = lo + 1.2;
      const D = 1.1 + 0.611 - 0.1, phi = -0.35;
      const z2 = z1 + D * Math.cos(phi), y2 = yc + D * Math.sin(phi);
      if (z2 + 0.65 > hi) continue;
      const face = new THREE.Quaternion().setFromAxisAngle(_up, -s * Math.PI / 2);
      const [wx, wz] = R.toWorld(s * (W / 2 - 0.14), z1);
      const [wx2, wz2] = R.toWorld(s * (W / 2 - 0.14), z2);
      const rq = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(R.m));
      face.premultiply(rq);
      const sp = rng.float(0.25, 0.4) * (rng.chance(0.5) ? 1 : -1);
      out.push({ kind: 'big', x: wx, y: yc, z: wz, face, a: 0, speed: sp, room: R.id });
      out.push({ kind: 'small', x: wx2, y: y2, z: wz2, face, a: 0.17, speed: (-sp * 1.1) / 0.611, room: R.id });
      placed++;
    }
  }
}
