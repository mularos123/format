import * as THREE from 'three';
import { radians, degrees } from '../utils/math.js';

const BOND_DISTANCE = 0.8;
const BOND_DISTANCE_MIN = 0.55;
const BOND_DISTANCE_MAX = 0.9;
const BOND_ANGLE = 104.5;
const BOND_ANGLE_TOLERANCE = 12;
const STABLE_TIME = 800;

export default class BondSystem {
  constructor(scene, physicsWorld, atomFactory, moleculeSystem, uiController, audioSystem) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.atomFactory = atomFactory;
    this.moleculeSystem = moleculeSystem;
    this.uiController = uiController;
    this.audioSystem = audioSystem;

    this.bonds = [];
    this.ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.2,
    });
    this.ghostGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    this.ghosts = new Map();
    this.stabilityTimers = new Map();
  }

  update(delta) {
    this._updateBondDistances();
    this._updateGhosts();
    this._checkBonding();
    this._checkStability(delta);
  }

  _updateBondDistances() {
    this.bonds.forEach((bond) => {
      bond.distance = bond.partner.mesh.position.distanceTo(bond.oxygen.mesh.position);
    });
  }

  _updateGhosts() {
    this.atomFactory.atoms.forEach((atom) => {
      if (atom.type !== 'O') return;
      const slots = this._getBondSlots(atom);
      let ghostGroup = this.ghosts.get(atom);
      if (!ghostGroup) {
        ghostGroup = slots.map(() => {
          const ghost = new THREE.Mesh(this.ghostGeometry, this.ghostMaterial);
          ghost.visible = false;
          this.scene.add(ghost);
          return ghost;
        });
        this.ghosts.set(atom, ghostGroup);
      }
      ghostGroup.forEach((ghost, index) => {
        const slot = slots[index];
        ghost.position.copy(slot.position);
      });
    });
  }

  _checkBonding() {
    const hydrogens = this.atomFactory.atoms.filter((atom) => atom.type === 'H' && atom.bonds.length === 0);
    const oxygens = this.atomFactory.atoms.filter((atom) => atom.type === 'O' && atom.bonds.length < 2);

    hydrogens.forEach((hydrogen) => {
      hydrogen.mesh.material.emissiveIntensity = 0.05;
    });

    oxygens.forEach((oxygen) => {
      const slots = this._getBondSlots(oxygen);
      const ghostGroup = this.ghosts.get(oxygen) || [];
      slots.forEach((slot, index) => {
        const candidate = this._findCandidateHydrogen(oxygen, slot, hydrogens);
        if (candidate) {
          ghostGroup[index].visible = true;
          ghostGroup[index].material.opacity = 0.35;
          candidate.mesh.material.emissiveIntensity = 0.18;
          if (!this._hasBond(oxygen, candidate)) {
            this._createBond(oxygen, candidate, slot);
            this.uiController.showEducation(
              `Bond formed: H (valence 1) + O (valence 2). Angle target: ${BOND_ANGLE}°.`
            );
            this.audioSystem.playBond();
          }
        } else {
          ghostGroup[index].visible = false;
        }
      });
    });
  }

  _checkStability(delta) {
    this.atomFactory.atoms
      .filter((atom) => atom.type === 'O' && atom.bonds.length === 2)
      .forEach((oxygen) => {
        const [h1, h2] = oxygen.bonds.map((bond) => bond.partner);
        const angle = this._calculateAngle(oxygen, h1, h2);
        const distanceValid = oxygen.bonds.every(
          (bond) => bond.distance >= BOND_DISTANCE_MIN && bond.distance <= BOND_DISTANCE_MAX
        );

        if (distanceValid && Math.abs(angle - BOND_ANGLE) <= BOND_ANGLE_TOLERANCE) {
          const current = this.stabilityTimers.get(oxygen) || 0;
          const next = current + delta * 1000;
          this.stabilityTimers.set(oxygen, next);
          if (next >= STABLE_TIME && !oxygen.isMolecule) {
            this.moleculeSystem.finalizeMolecule(oxygen);
            this.uiController.showEducation(
              `Water formed! H–O–H angle ~${angle.toFixed(1)}°. Oxygen valence satisfied with two bonds.`
            );
          }
        } else {
          this.stabilityTimers.set(oxygen, 0);
        }
      });
  }

  _getBondSlots(oxygen) {
    const angle = radians(BOND_ANGLE);
    const dirA = new THREE.Vector3(1, 0.05, 0).normalize();
    const dirB = new THREE.Vector3(Math.cos(angle), 0.05, Math.sin(angle)).normalize();
    const base = oxygen.mesh.position.clone();
    return [
      { position: base.clone().add(dirA.clone().multiplyScalar(BOND_DISTANCE)), direction: dirA },
      { position: base.clone().add(dirB.clone().multiplyScalar(BOND_DISTANCE)), direction: dirB },
    ];
  }

  _findCandidateHydrogen(oxygen, slot, hydrogens) {
    for (const hydrogen of hydrogens) {
      const dir = hydrogen.mesh.position.clone().sub(oxygen.mesh.position).normalize();
      const distance = hydrogen.mesh.position.distanceTo(oxygen.mesh.position);
      const angle = degrees(Math.acos(THREE.MathUtils.clamp(dir.dot(slot.direction), -1, 1)));
      if (distance < BOND_DISTANCE && angle < BOND_ANGLE_TOLERANCE) {
        return hydrogen;
      }
    }
    return null;
  }

  _createBond(oxygen, hydrogen, slot) {
    const jointData = this.physicsWorld.world.JointData.ball(
      { x: slot.position.x - oxygen.mesh.position.x, y: slot.position.y - oxygen.mesh.position.y, z: slot.position.z - oxygen.mesh.position.z },
      { x: 0, y: 0, z: 0 }
    );
    const joint = this.physicsWorld.world.createImpulseJoint(jointData, oxygen.rigidBody, hydrogen.rigidBody, true);
    const distance = hydrogen.mesh.position.distanceTo(oxygen.mesh.position);
    const bond = { oxygen, partner: hydrogen, joint, distance };
    oxygen.bonds.push(bond);
    hydrogen.bonds.push({ partner: oxygen, joint, distance });
    this.bonds.push(bond);
  }

  _hasBond(oxygen, hydrogen) {
    return oxygen.bonds.some((bond) => bond.partner === hydrogen);
  }

  _calculateAngle(oxygen, h1, h2) {
    const v1 = h1.mesh.position.clone().sub(oxygen.mesh.position).normalize();
    const v2 = h2.mesh.position.clone().sub(oxygen.mesh.position).normalize();
    return degrees(Math.acos(THREE.MathUtils.clamp(v1.dot(v2), -1, 1)));
  }
}
