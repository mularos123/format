import * as THREE from 'three';
import { randomRange } from '../utils/math.js';

export const ATOM_TYPES = {
  H: {
    radius: 0.25,
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
    mass: 0.5,
    valence: 1,
  },
  O: {
    radius: 0.38,
    color: 0xe53935,
    metalness: 0.2,
    roughness: 0.15,
    mass: 1.2,
    valence: 2,
  },
};

export default class AtomFactory {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.atoms = [];

    this.materials = {
      H: new THREE.MeshStandardMaterial({
        color: ATOM_TYPES.H.color,
        metalness: ATOM_TYPES.H.metalness,
        roughness: ATOM_TYPES.H.roughness,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.05,
      }),
      O: new THREE.MeshStandardMaterial({
        color: ATOM_TYPES.O.color,
        metalness: ATOM_TYPES.O.metalness,
        roughness: ATOM_TYPES.O.roughness,
        emissive: new THREE.Color(0xff5252),
        emissiveIntensity: 0.08,
      }),
    };

    this.geometry = new THREE.SphereGeometry(1, 32, 32);
  }

  createAtom(type, position = { x: 0, y: 3, z: 0 }) {
    const config = ATOM_TYPES[type];
    const mesh = new THREE.Mesh(this.geometry, this.materials[type]);
    mesh.scale.setScalar(config.radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(position.x, position.y, position.z);

    const rigidBody = this.physicsWorld.world.createRigidBody(
      this.physicsWorld.world.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setLinearDamping(0.3)
        .setAngularDamping(0.4)
    );
    const colliderDesc = this.physicsWorld.world.ColliderDesc.ball(config.radius)
      .setDensity(config.mass)
      .setRestitution(0.4);
    this.physicsWorld.world.createCollider(colliderDesc, rigidBody);

    const atom = {
      type,
      mesh,
      rigidBody,
      valence: config.valence,
      bonds: [],
      isMolecule: false,
    };

    mesh.userData.atom = atom;

    this.atoms.push(atom);
    this.scene.add(mesh);

    return atom;
  }

  spawnRandom(type) {
    const position = {
      x: randomRange(-2, 2),
      y: randomRange(2.5, 4.5),
      z: randomRange(-2, 2),
    };
    return this.createAtom(type, position);
  }

  removeAll() {
    this.atoms.forEach((atom) => {
      this.scene.remove(atom.mesh);
      this.physicsWorld.world.removeRigidBody(atom.rigidBody);
    });
    this.atoms.length = 0;
  }
}
