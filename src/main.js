import * as THREE from 'three';
import Renderer from './engine/Renderer.js';
import SceneSetup from './engine/SceneSetup.js';
import PostFX from './engine/PostFX.js';
import PhysicsWorld from './physics/PhysicsWorld.js';
import AtomFactory from './game/AtomFactory.js';
import BondSystem from './game/BondSystem.js';
import MoleculeSystem from './game/MoleculeSystem.js';
import QuestSystem from './game/QuestSystem.js';
import InputController from './input/InputController.js';
import UIController from './ui/UIController.js';
import AudioSystem from './game/AudioSystem.js';
import { clamp } from './utils/math.js';

const QUALITY_PRESETS = {
  Low: {
    pixelRatio: 1,
    bloomStrength: 0.35,
    ssaoRadius: 6,
    ssaoMin: 0.01,
    ssaoMax: 0.05,
    shadowSize: 1024,
  },
  Medium: {
    pixelRatio: 1.25,
    bloomStrength: 0.5,
    ssaoRadius: 8,
    ssaoMin: 0.005,
    ssaoMax: 0.08,
    shadowSize: 1536,
  },
  High: {
    pixelRatio: 1.5,
    bloomStrength: 0.7,
    ssaoRadius: 10,
    ssaoMin: 0.005,
    ssaoMax: 0.1,
    shadowSize: 2048,
  },
};

const canvas = document.getElementById('game-canvas');
const rendererWrapper = new Renderer(canvas);
const sceneSetup = new SceneSetup();
const physicsWorld = new PhysicsWorld();
const uiController = new UIController();
const audioSystem = new AudioSystem();

await physicsWorld.init();

const atomFactory = new AtomFactory(sceneSetup.scene, physicsWorld);
const moleculeSystem = new MoleculeSystem(sceneSetup.scene, uiController);
const bondSystem = new BondSystem(sceneSetup.scene, physicsWorld, atomFactory, moleculeSystem, uiController, audioSystem);
const questSystem = new QuestSystem(uiController);
const inputController = new InputController(sceneSetup.camera, rendererWrapper.renderer, physicsWorld, atomFactory, uiController);
const postFX = new PostFX(rendererWrapper.renderer, sceneSetup.scene, sceneSetup.camera);

const floorBody = physicsWorld.world.createRigidBody(
  physicsWorld.world.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
);
const floorCollider = physicsWorld.world.ColliderDesc.cuboid(25, 0.1, 25).setTranslation(0, -0.1, 0);
physicsWorld.world.createCollider(floorCollider, floorBody);

const spawnLimit = 20;
let spawnTimer = 0;
let moleculeCount = 0;

const clock = new THREE.Clock();

const qualitySelect = document.getElementById('quality-select');
const resetBtn = document.getElementById('reset');
const spawnHBtn = document.getElementById('spawn-h');
const spawnOBtn = document.getElementById('spawn-o');

function applyQuality(label) {
  const preset = QUALITY_PRESETS[label];
  if (!preset) return;
  rendererWrapper.renderer.shadowMap.enabled = true;
  rendererWrapper.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sceneSetup.scene.traverse((object) => {
    if (object.isDirectionalLight) {
      object.shadow.mapSize.set(preset.shadowSize, preset.shadowSize);
    }
  });
  rendererWrapper.renderer.toneMappingExposure = label === 'Low' ? 1.0 : 1.1;
  postFX.setQuality(preset);
  uiController.updateQuality(label);
  resize();
}

function autoQuality() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const label = isMobile ? 'Low' : 'High';
  applyQuality(label);
  uiController.updateQuality('Auto');
}

qualitySelect.addEventListener('change', (event) => {
  const value = event.target.value;
  if (value === 'Auto') {
    autoQuality();
  } else {
    applyQuality(value);
  }
});

resetBtn.addEventListener('click', () => {
  atomFactory.removeAll();
  moleculeCount = 0;
  uiController.reset();
  questSystem.onMoleculeCreated(0);
});

spawnHBtn.addEventListener('click', () => atomFactory.spawnRandom('H'));
spawnOBtn.addEventListener('click', () => atomFactory.spawnRandom('O'));

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = qualitySelect.value === 'Auto'
    ? clamp(window.devicePixelRatio, 1, 1.5)
    : clamp(window.devicePixelRatio, 1, QUALITY_PRESETS[qualitySelect.value].pixelRatio);
  rendererWrapper.resize(width, height, ratio);
  postFX.resize(width, height);
  sceneSetup.camera.aspect = width / height;
  sceneSetup.camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);

function spawnLoop(delta) {
  spawnTimer += delta;
  if (spawnTimer > 2.5 && atomFactory.atoms.length < spawnLimit) {
    spawnTimer = 0;
    const type = Math.random() > 0.6 ? 'O' : 'H';
    atomFactory.spawnRandom(type);
  }
}

function updatePhysics() {
  physicsWorld.step();
  atomFactory.atoms.forEach((atom) => {
    const pos = atom.rigidBody.translation();
    atom.mesh.position.set(pos.x, pos.y, pos.z);
    const rot = atom.rigidBody.rotation();
    atom.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  });
}

function update() {
  const delta = clock.getDelta();
  spawnLoop(delta);
  updatePhysics();
  inputController.update(delta);
  bondSystem.update(delta);
  moleculeSystem.update(delta);

  const newMoleculeCount = moleculeSystem.molecules.length;
  if (newMoleculeCount !== moleculeCount) {
    moleculeCount = newMoleculeCount;
    questSystem.onMoleculeCreated(moleculeCount);
  }

  postFX.render(delta);
  requestAnimationFrame(update);
}

function boot() {
  autoQuality();
  resize();
  atomFactory.spawnRandom('O');
  atomFactory.spawnRandom('H');
  atomFactory.spawnRandom('H');
  update();
}

boot();
