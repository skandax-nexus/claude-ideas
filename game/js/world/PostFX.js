// Post-processing by quality level: soft ambient occlusion (HIGH), a gentle
// bloom on light strips and holograms (MEDIUM+), then tone mapping, colour
// output and the film grade in one last pass. LOW renders straight to the screen.
import * as THREE from '../../vendor/three.module.min.js';
import { EffectComposer } from '../../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from '../../vendor/addons/postprocessing/GTAOPass.js';
import { OutputPass } from '../../vendor/addons/postprocessing/OutputPass.js';
import { OutputShader } from '../../vendor/addons/shaders/OutputShader.js';
import { RGBELoader } from '../../vendor/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from '../../vendor/addons/environments/RoomEnvironment.js';

// Point lights that add nothing to a pixel skip the lighting maths. three counts every visible
// PointLight into each lit shader whatever its intensity (the room slots a room does not use and
// the street lamp slots sit at 0), and its unrolled loop ran the full GGX + Lambert for each one,
// even where the light is off or the pixel is beyond its range. getPointLightInfo already marks
// those (visible = color != 0): only the shadow lookup used it. Skipping a light that adds exactly
// 0 changes no pixel. Patched once here, at module load (main.js imports this file statically),
// before any shader compiles: programs are cached without the chunk text. Written against three
// r169's lights_fragment_begin; if an upgrade changes the text, nothing is patched.
{
  const C = THREE.ShaderChunk;
  const s = C.lights_fragment_begin;
  const i = s.indexOf('RE_Direct( directLight', s.indexOf('NUM_POINT_LIGHTS > 0'));
  if (i > 0 && i < s.indexOf('NUM_SPOT_LIGHTS')) C.lights_fragment_begin = s.slice(0, i) + 'if ( directLight.visible ) ' + s.slice(i);
  else console.warn('point-light skip patch not applied');
}

// Every image-based light is a 256 cube before prefiltering: the size three's PMREMGenerator
// gives the default room light (fromScene), so swapping skies never changes a shader program.
const SKY_CUBE = 256;

// Ambient light from a sky photo: project the HDR onto 9 spherical-harmonic
// coefficients (THREE.LightProbe), so characters and props are lit by the sky's
// real colours from the right directions. Runs once per sky on the CPU.
function skyProbe(tex) {
  const { data, width: w, height: h } = tex.image;
  const half = data instanceof Uint16Array;
  const f = half ? THREE.DataUtils.fromHalfFloat : (v) => v;
  const sh = new THREE.SphericalHarmonics3();
  const dir = new THREE.Vector3();
  const col = new THREE.Color();
  const basis = Array.from({ length: 9 }, () => 0);
  const step = 2;
  let total = 0;
  for (let y = 0; y < h; y += step) {
    const theta = ((y + 0.5) / h) * Math.PI;
    const weight = Math.sin(theta);
    for (let x = 0; x < w; x += step) {
      const phi = ((x + 0.5) / w) * Math.PI * 2;
      // equirect: same orientation three.js uses for EquirectangularReflectionMapping
      dir.set(-Math.sin(theta) * Math.cos(phi), Math.cos(theta), -Math.sin(theta) * Math.sin(phi));
      const i = (y * w + x) * 4;
      col.setRGB(Math.min(f(data[i]), 16), Math.min(f(data[i + 1]), 16), Math.min(f(data[i + 2]), 16));
      THREE.SphericalHarmonics3.getBasisAt(dir, basis);
      for (let j = 0; j < 9; j++) {
        sh.coefficients[j].x += basis[j] * col.r * weight;
        sh.coefficients[j].y += basis[j] * col.g * weight;
        sh.coefficients[j].z += basis[j] * col.b * weight;
      }
      total += weight;
    }
  }
  const norm = (4 * Math.PI) / total;
  for (const c of sh.coefficients) c.multiplyScalar(norm);
  return sh;
}

// A film grade after tone mapping: contrast, split toning (cool shadows, warm
// highlights by default), a touch of saturation, vignette and fine grain.
const GradeShader = {
  uniforms: {
    time: { value: 0 },
    contrast: { value: 1.08 },
    saturation: { value: 1.06 },
    shadowTint: { value: new THREE.Color(0x2a4a66) },
    highlightTint: { value: new THREE.Color(0xffd8a8) },
    toning: { value: 0.12 },
    vignette: { value: 0.32 },
    grain: { value: 0.035 },
  },
  pars: `
    uniform float time, contrast, saturation, toning, vignette, grain;
    uniform vec3 shadowTint, highlightTint;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 grade(vec3 col) {
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, saturation);
      col = (col - 0.5) * contrast + 0.5;
      col = mix(col, col * shadowTint * 2.0, toning * (1.0 - smoothstep(0.0, 0.5, l)));
      col = mix(col, col * highlightTint * 1.25, toning * smoothstep(0.5, 1.0, l));
      vec2 d = vUv - 0.5;
      col *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      col += (hash(vUv * 1000.0 + time) - 0.5) * grain;
      return clamp(col, 0.0, 1.0);
    }`,
};

// The last pass, straight to the screen: the bloom added over the scene, tone mapping and
// sRGB output (three's OutputPass, whose render() still rebuilds the defines and reads
// renderer.toneMappingExposure every frame), then the grade, in one full-screen draw. It used to
// be two passes (output into a second half-float target, then the grade) and the bloom was
// blended back into the multisampled scene target, which reloaded, stored and resolved it.
class GradeOutputPass extends OutputPass {
  constructor() {
    super();
    this.material.dispose(); // OutputPass's own material: never compiled, replaced here
    this.uniforms = {
      ...THREE.UniformsUtils.clone(OutputShader.uniforms), // tDiffuse, toneMappingExposure
      ...THREE.UniformsUtils.clone(GradeShader.uniforms),
      tBloom: { value: null },
      bloomOn: { value: 0 },
    };
    this.material = new THREE.RawShaderMaterial({
      name: 'GradeOutputShader',
      uniforms: this.uniforms,
      vertexShader: OutputShader.vertexShader,
      fragmentShader: `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform sampler2D tBloom;
        uniform float bloomOn;
        varying vec2 vUv;
        #include <tonemapping_pars_fragment>
        #include <colorspace_pars_fragment>
        ${GradeShader.pars}
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          // the bloom, as UnrealBloomPass blended it (additive: SRC_ALPHA, ONE)
          vec4 b = texture2D(tBloom, vUv);
          c.rgb += bloomOn * b.rgb * b.a;
          c.a += bloomOn * b.a * b.a;
          // tone mapping and colour space: OutputShader
          #ifdef LINEAR_TONE_MAPPING
            c.rgb = LinearToneMapping(c.rgb);
          #elif defined(REINHARD_TONE_MAPPING)
            c.rgb = ReinhardToneMapping(c.rgb);
          #elif defined(CINEON_TONE_MAPPING)
            c.rgb = CineonToneMapping(c.rgb);
          #elif defined(ACES_FILMIC_TONE_MAPPING)
            c.rgb = ACESFilmicToneMapping(c.rgb);
          #elif defined(AGX_TONE_MAPPING)
            c.rgb = AgXToneMapping(c.rgb);
          #elif defined(NEUTRAL_TONE_MAPPING)
            c.rgb = NeutralToneMapping(c.rgb);
          #endif
          #ifdef SRGB_TRANSFER
            c = sRGBTransferOETF(c);
          #endif
          gl_FragColor = vec4(grade(c.rgb), c.a);
        }`,
    });
    this.fsQuad.material = this.material;
    this.needsSwap = false; // the last pass: it draws to the screen
  }
}

// UnrealBloomPass that leaves its result in renderTargetsHorizontal[0] for GradeOutputPass to
// add, instead of blending it back over the scene target (with MSAA a reload, store and resolve
// of the whole screen every frame). render() is a copy of three r169's UnrealBloomPass.render
// (vendor/addons/postprocessing/UnrealBloomPass.js) that stops after the mip composite, and is
// never the last pass: keep it in step if three is upgraded.
class BloomPass extends UnrealBloomPass {
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    renderer.getClearColor(this._oldClearColor);
    this.oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    if (maskActive) renderer.state.buffers.stencil.setTest(false);

    // 1. extract the bright areas
    this.highPassUniforms.tDiffuse.value = readBuffer.texture;
    this.highPassUniforms.luminosityThreshold.value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright);
    renderer.clear();
    this.fsQuad.render(renderer);

    // 2. blur all the mips progressively
    let inputRenderTarget = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      const blur = this.separableBlurMaterials[i];
      this.fsQuad.material = blur;
      blur.uniforms.colorTexture.value = inputRenderTarget.texture;
      blur.uniforms.direction.value = UnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
      renderer.clear();
      this.fsQuad.render(renderer);
      blur.uniforms.colorTexture.value = this.renderTargetsHorizontal[i].texture;
      blur.uniforms.direction.value = UnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]);
      renderer.clear();
      this.fsQuad.render(renderer);
      inputRenderTarget = this.renderTargetsVertical[i];
    }

    // 3. composite all the mips into renderTargetsHorizontal[0] (GradeOutputPass adds it)
    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms.bloomStrength.value = this.strength;
    this.compositeMaterial.uniforms.bloomRadius.value = this.radius;
    this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
    renderer.clear();
    this.fsQuad.render(renderer);

    if (maskActive) renderer.state.buffers.stencil.setTest(true);
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
}

// Frees what a post pass holds on the GPU: its render targets and its own textures
// (the passes are built here without outside textures). Its materials are left alone
// on purpose: disposing them would drop their compiled shaders, and the next chain
// (raising the quality again) would stall recompiling them.
function freeBuffers(pass) {
  for (const v of Object.values(pass)) {
    for (const o of Array.isArray(v) ? v : [v]) if (o?.isRenderTarget || o?.isTexture) o.dispose();
  }
}

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
    // (three's fromScene is fixed at a 256 cube: the skies match it, see skyEnv)
    if (q.env && !this.envTex) this.envTex = this.pmrem().fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = q.env ? this.envTex : null;
    scene.environmentIntensity = 0.35;
    if (q.env && this.envName) this.setEnvironment(this.envName, this.envIntensity);
    renderer.shadowMap.enabled = q.shadows;
    // free the old chain's GPU buffers too (bloom mips, AO targets and noise):
    // EffectComposer.dispose() frees only its own two targets
    if (this.composer) {
      for (const p of this.composer.passes) freeBuffers(p);
      this.composer.dispose();
    }
    this.composer = this.bloom = this.ao = this.grade = null;
    if (!q.bloom && !q.ao) return;
    const size = renderer.getSize(new THREE.Vector2());
    // multisampled target: clean edges on geometry even with post-processing on. Only its colour
    // is read after the scene pass (bloom, output, grade; ambient occlusion renders its own depth),
    // so each multisample resolve copies colour alone, not depth too.
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: q.msaa || 0, resolveDepthBuffer: false });
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
      this.bloom = new BloomPass(new THREE.Vector2(size.x, size.y), 0.3, 0.5, 1.7); // only lamps, neon, screens and holograms; lit walls never haze
      c.addPass(this.bloom);
    }
    // bloom added, tone mapped, sRGB and graded in one pass to the screen: with no swap the scene
    // pass always draws into the same target, so at MEDIUM the composer's other target is never used
    this.grade = new GradeOutputPass();
    c.addPass(this.grade);
    if (this.gradeLook) this.setGrade(this.gradeLook);
    this.composer = c;
    this.resize();
  }

  resize() {
    const c = this.composer;
    if (!c) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    // setPixelRatio already resizes every target and pass to the composer's size, so
    // resize again only when the canvas size itself changed (a smart renderer step
    // used to reallocate everything twice)
    c.setPixelRatio(this.renderer.getPixelRatio());
    if (size.x !== c._width || size.y !== c._height) c.setSize(size.x, size.y);
    // the final pass adds the bloom's result: linked here, which apply() runs too, so a rebuilt
    // chain and every resize point it at the bloom target in use (resized in place, same texture)
    this.grade.uniforms.tBloom.value = this.bloom ? this.bloom.renderTargetsHorizontal[0].texture : null;
    this.grade.uniforms.bloomOn.value = this.bloom ? 1 : 0;
  }

  // One PMREM generator for the page's life: disposing it after each use released its blur and
  // sky shaders, so every new sky compiled them again.
  pmrem() {
    return (this.pm = this.pm || new THREE.PMREMGenerator(this.renderer));
  }

  // An equirect sky photo prefiltered for image-based light, the same size as the default room
  // light (a 256 cube). The PMREM size is part of every lit shader's program: the 512x256 HDR
  // skies, prefiltered straight from the equirect (a cube a quarter of its width, 128), made every
  // PBR material (world, people, the player) compile again on the first frame after the sky
  // arrived, a moment after the fade into a new place. Drawn into a 256 cube map first, every sky
  // matches (the 1024-wide JPG skies were 256 already). Returns the environment texture; the
  // photo is left to the caller.
  skyEnv(tex) {
    if (!this.toCube) {
      // three's WebGLCubeRenderTarget.fromEquirectangularTexture, with its shader kept (three
      // disposes its own after each use)
      this.toCube = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.ShaderMaterial({
        name: 'CubemapFromEquirect',
        uniforms: { tEquirect: { value: null } },
        vertexShader: `
          varying vec3 vWorldDirection;
          void main() {
            vWorldDirection = normalize((modelMatrix * vec4(position, 0.0)).xyz);
            #include <begin_vertex>
            #include <project_vertex>
          }`,
        fragmentShader: `
          uniform sampler2D tEquirect;
          varying vec3 vWorldDirection;
          #include <common>
          void main() {
            gl_FragColor = texture2D(tEquirect, equirectUv(normalize(vWorldDirection)));
          }`,
        side: THREE.BackSide,
        blending: THREE.NoBlending,
      }));
    }
    const cube = new THREE.WebGLCubeRenderTarget(SKY_CUBE, { type: THREE.HalfFloatType });
    tex.minFilter = THREE.LinearFilter; // no mipmaps (not uploaded yet): they would blur the poles
    this.toCube.material.uniforms.tEquirect.value = tex;
    new THREE.CubeCamera(1, 10, cube).update(this.renderer, this.toCube);
    this.toCube.material.uniforms.tEquirect.value = null;
    const env = this.pmrem().fromCubemap(cube.texture).texture;
    cube.dispose();
    return env;
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
    this.probes = this.probes || {};
    if (this.skies[name]) return use(this.skies[name]);
    const done = (tex) => {
      this.skies[name] = this.skyEnv(tex);
      tex.dispose();
      use(this.skies[name]);
      this.onSky?.(name);
    };
    const jpg = () => new THREE.TextureLoader().load(`assets/textures/sky_${name}.jpg`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      done(tex);
    });
    // real HDR skies where the host serves them (the web preview uses the JPG copies)
    if (window.AZ_NO_HDR) return jpg();
    new RGBELoader().setDataType(THREE.HalfFloatType).load(`assets/textures/sky_${name}.hdr`, (tex) => {
      try {
        this.probes[name] = skyProbe(tex);
      } catch {
        /* lit by the hemisphere light instead */
      }
      done(tex);
    }, undefined, jpg);
  }

  // the sky's ambient light for the current environment, or null
  probe() {
    return (this.q?.env && this.envName && this.probes?.[this.envName]) || null;
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

  // Every scene render goes through here (main.js sets shadowMap.autoUpdate = false): the shadow
  // map is redrawn once, by the first scene render of the frame, and reused by the rest.
  render() {
    this.renderer.shadowMap.needsUpdate = true;
    if (this.grade) this.grade.uniforms.time.value = (this.grade.uniforms.time.value + 0.017) % 100;
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
