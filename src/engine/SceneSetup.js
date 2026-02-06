import * as THREE from 'three';

export default class SceneSetup {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0b0f15, 8, 30);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 5, 10);

    this.orbitTarget = new THREE.Vector3(0, 2, 0);

    this._createEnvironment();
    this._createLights();
    this._createFloor();
  }

  _createEnvironment() {
    const envScene = new THREE.Scene();
    const gradient = new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 32),
      new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: 0x16202b,
      })
    );
    envScene.add(gradient);

    const renderer = new THREE.WebGLRenderer();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(envScene).texture;
    this.scene.environment = envTexture;
    this.scene.background = new THREE.Color(0x0b0f15);
    pmrem.dispose();
    renderer.dispose();
  }

  _createLights() {
    const hemi = new THREE.HemisphereLight(0x9fb3c8, 0x0b0f15, 0.5);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(6, 12, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0002;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x7df9ff, 0.4);
    fill.position.set(-6, 6, -4);
    this.scene.add(fill);
  }

  _createFloor() {
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111720,
      metalness: 0.1,
      roughness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);
  }
}
