import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class InputController {
  constructor(camera, renderer, physicsWorld, atomFactory, uiController) {
    this.camera = camera;
    this.renderer = renderer;
    this.physicsWorld = physicsWorld;
    this.atomFactory = atomFactory;
    this.uiController = uiController;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2);
    this.dragging = null;

    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 16;
    this.controls.target.set(0, 2, 0);
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    this._setupEvents();
  }

  _setupEvents() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => this._onPointerDown(event));
    canvas.addEventListener('pointermove', (event) => this._onPointerMove(event));
    canvas.addEventListener('pointerup', () => this._onPointerUp());
    canvas.addEventListener('pointerleave', () => this._onPointerUp());
  }

  update(delta) {
    this.controls.update();
    if (this.dragging) {
      const intersection = this._getPlaneIntersection();
      if (intersection) {
        this.dragging.targetBody.setNextKinematicTranslation({
          x: intersection.x,
          y: intersection.y,
          z: intersection.z,
        });
      }
    }
  }

  _onPointerDown(event) {
    if (event.button !== 0) return;
    this._setPointer(event);
    const hit = this._raycast();
    if (hit) {
      const atom = hit.object.userData.atom;
      this.uiController.setSelectedAtom(atom);
      this.controls.enabled = false;
      const targetBody = this.physicsWorld.world.createRigidBody(
        this.physicsWorld.world.RigidBodyDesc.kinematicPositionBased().setTranslation(
          hit.point.x,
          hit.point.y,
          hit.point.z
        )
      );
      const jointData = this.physicsWorld.world.JointData.ball(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      );
      const joint = this.physicsWorld.world.createImpulseJoint(jointData, targetBody, atom.rigidBody, true);
      this.dragging = { atom, targetBody, joint };
    }
  }

  _onPointerMove(event) {
    this._setPointer(event);
  }

  _onPointerUp() {
    if (this.dragging) {
      this.physicsWorld.world.removeRigidBody(this.dragging.targetBody);
      this.dragging = null;
    }
    this.controls.enabled = true;
  }

  _setPointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _raycast() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.atomFactory.atoms.map((atom) => atom.mesh);
    const intersections = this.raycaster.intersectObjects(meshes, false);
    if (intersections.length > 0) {
      return intersections[0];
    }
    return null;
  }

  _getPlaneIntersection() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.dragPlane, point);
    return hit ? point : null;
  }
}
