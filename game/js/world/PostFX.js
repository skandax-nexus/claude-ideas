// Post-processing by quality level: soft ambient occlusion (HIGH), a gentle
// bloom on light strips and holograms (MEDIUM+), then tone mapping and colour
// output. LOW renders straight to the screen.
import * as THREE from '../../vendor/three.module.min.js';
import { EffectComposer } from '../../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from '../../vendor/addons/postprocessing/GTAOPass.js';
import { OutputPass } from '../../vendor/addons/postprocessing/OutputPass.js';
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
    renderer.shadowMap.enabled = q.shadows;
    this.composer?.dispose();
    this.composer = null;
    if (!q.bloom && !q.ao) return;
    const size = renderer.getSize(new THREE.Vector2());
    const c = new EffectComposer(renderer);
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
    this.composer = c;
    this.resize();
  }

  resize() {
    if (!this.composer) return;
    const size = this.renderer.getSize(new THREE.Vector2());
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(size.x, size.y);
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
