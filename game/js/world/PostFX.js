// Post-processing by quality level: soft ambient occlusion (HIGH), a gentle
// bloom on light strips and holograms (MEDIUM+), then tone mapping and colour
// output. LOW renders straight to the screen.
import * as THREE from '../../vendor/three.module.min.js';
import { EffectComposer } from '../../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from '../../vendor/addons/postprocessing/GTAOPass.js';
import { OutputPass } from '../../vendor/addons/postprocessing/OutputPass.js';
import { ShaderPass } from '../../vendor/addons/postprocessing/ShaderPass.js';

// A film grade after tone mapping: contrast, split toning (cool shadows, warm
// highlights by default), a touch of saturation, vignette and fine grain.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    contrast: { value: 1.08 },
    saturation: { value: 1.06 },
    shadowTint: { value: new THREE.Color(0x2a4a66) },
    highlightTint: { value: new THREE.Color(0xffd8a8) },
    toning: { value: 0.12 },
    vignette: { value: 0.32 },
    grain: { value: 0.035 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, contrast, saturation, toning, vignette, grain;
    uniform vec3 shadowTint, highlightTint; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, saturation);
      col = (col - 0.5) * contrast + 0.5;
      col = mix(col, col * shadowTint * 2.0, toning * (1.0 - smoothstep(0.0, 0.5, l)));
      col = mix(col, col * highlightTint * 1.25, toning * smoothstep(0.5, 1.0, l));
      vec2 d = vUv - 0.5;
      col *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      col += (hash(vUv * 1000.0 + time) - 0.5) * grain;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
    }`,
};
import { RoomEnvironment } from '../../vendor/addons/environments/RoomEnvironment.js';

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.envTex = null;
  }

  apply(q) {
    const { renderer, scene, camera } = this;
    this.q = q;
    // soft image-based light for the PBR materials (armour, glass, metal)
    if (q.env && !this.envTex) {
      const pm = new THREE.PMREMGenerator(renderer);
      this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    scene.environment = q.env ? this.envTex : null;
    scene.environmentIntensity = 0.35;
    if (q.env && this.envName) this.setEnvironment(this.envName, this.envIntensity);
    renderer.shadowMap.enabled = q.shadows;
    this.composer?.dispose();
    this.composer = null;
    if (!q.bloom && !q.ao) return;
    const size = renderer.getSize(new THREE.Vector2());
    // multisampled target: clean edges on geometry even with post-processing on
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: q.msaa || 0 });
    const c = new EffectComposer(renderer, rt);
    c.addPass(new RenderPass(scene, camera));
    if (q.ao) {
      const ao = new GTAOPass(scene, camera, size.x, size.y);
      ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
      ao.blendIntensity = 0.75;
      c.addPass(ao);
      this.ao = ao;
    }
    if (q.bloom) {
      // threshold high: only the brightest strips and holograms glow
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.28, 0.45, 1.0);
      c.addPass(this.bloom);
    }
    c.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    c.addPass(this.grade);
    if (this.gradeLook) this.setGrade(this.gradeLook);
    this.composer = c;
    this.resize();
  }

  resize() {
    if (!this.composer) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(size.x, size.y);
  }

  // Real-world light for a place: an equirect sky photo (assets/textures/sky_*.jpg)
  // turned into image-based lighting and reflections. null: the default room light.
  setEnvironment(name, intensity = 0.6) {
    this.envName = name;
    this.envIntensity = intensity;
    if (!this.q?.env) return;
    if (!name) {
      this.scene.environment = this.envTex;
      this.scene.environmentIntensity = 0.35;
      return;
    }
    this.skies = this.skies || {};
    const use = (t) => {
      if (this.envName !== name) return;
      this.scene.environment = t;
      this.scene.environmentIntensity = intensity;
    };
    if (this.skies[name]) return use(this.skies[name]);
    new THREE.TextureLoader().load(`assets/textures/sky_${name}.jpg`, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const pm = new THREE.PMREMGenerator(this.renderer);
      this.skies[name] = pm.fromEquirectangular(tex).texture;
      pm.dispose();
      tex.dispose();
      use(this.skies[name]);
    });
  }

  // per place: { shadowTint, highlightTint, toning, contrast, saturation, vignette }
  setGrade(look) {
    this.gradeLook = look;
    if (!this.grade) return;
    const u = this.grade.uniforms;
    for (const [k, v] of Object.entries(look)) {
      if (!u[k]) continue;
      if (u[k].value.isColor) u[k].value.setHex(v);
      else u[k].value = v;
    }
  }

  render() {
    if (this.grade) this.grade.uniforms.time.value = (this.grade.uniforms.time.value + 0.017) % 100;
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
