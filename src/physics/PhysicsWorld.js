import RAPIER from '@dimforge/rapier3d-compat';

export default class PhysicsWorld {
  constructor() {
    this.ready = false;
    this.world = null;
    this.eventQueue = null;
  }

  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.eventQueue = new RAPIER.EventQueue(true);
    this.ready = true;
  }

  step() {
    if (!this.world) return;
    this.world.step(this.eventQueue);
  }
}
