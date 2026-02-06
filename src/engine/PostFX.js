import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import * as THREE from 'three';

export default class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    this.ssaoPass.kernelRadius = 10;
    this.ssaoPass.minDistance = 0.005;
    this.ssaoPass.maxDistance = 0.1;
    this.composer.addPass(this.ssaoPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = 0.9;
    this.vignettePass.uniforms.darkness.value = 1.1;
    this.composer.addPass(this.vignettePass);
  }

  setQuality(settings) {
    this.bloomPass.strength = settings.bloomStrength;
    this.ssaoPass.kernelRadius = settings.ssaoRadius;
    this.ssaoPass.minDistance = settings.ssaoMin;
    this.ssaoPass.maxDistance = settings.ssaoMax;
  }

  resize(width, height) {
    this.composer.setSize(width, height);
  }

  render(delta) {
    this.composer.render(delta);
  }
}
