import * as THREE from 'three';

export default class MoleculeSystem {
  constructor(scene, uiController) {
    this.scene = scene;
    this.uiController = uiController;
    this.molecules = [];
    this.particles = [];

    const sprite = new THREE.TextureLoader().load(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABNElEQVQ4T62SMUoDQRBFz9LQhCgrG0Vb0J+guk9AV7ASbyBxDa1sLTIxEmlpYqKwtC/wE3rUazjkdvEhw9nZvZ2doGgHStNszqWc6IQC0Xly+PzqtowNC2n2Vxxu9fgg2G7EC6c3dGPaRGR0oJp/o9uwB9iqGrhUKg4cS3XANXQe5iAnZB1z71Q84xuVxVn9Cyh6SMz1gkT3iUemH6WqAar/0wNX17Q7gxYY+4P8xF4pXRrXG53eW4AHfG+llQYygp1zB0aW1UdzF5aS82BbVy5ADpPxB8BCSvuBXR4nRoWrh5Y6xB8KJm6jd6PcYdfgD6M+On2yXnhq2cKx2ZaiJSnKZw1apU+FfWmTzG4qB3x1d8aJKb+owcJ0d9S8AAMTNQ5Zk2wqAAAAAElFTkSuQmCC'
    );

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      map: sprite,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      color: 0x7df9ff,
    });
  }

  finalizeMolecule(oxygen) {
    oxygen.isMolecule = true;
    oxygen.rigidBody.setLinearDamping(0.9);
    oxygen.rigidBody.setAngularDamping(0.9);
    oxygen.bonds.forEach((bond) => {
      bond.partner.rigidBody.setLinearDamping(0.9);
      bond.partner.rigidBody.setAngularDamping(0.9);
      bond.partner.isMolecule = true;
    });
    this._spawnLabel(oxygen);
    this._spawnParticles(oxygen.mesh.position.clone());
    this.molecules.push(oxygen);
    this.uiController.incrementMolecule();
  }

  update(delta) {
    this.particles = this.particles.filter((particle) => {
      particle.lifetime -= delta;
      particle.points.material.opacity = particle.lifetime / particle.maxLifetime;
      particle.points.position.addScaledVector(particle.velocity, delta);
      if (particle.lifetime <= 0) {
        this.scene.remove(particle.points);
        return false;
      }
      return true;
    });
  }

  _spawnLabel(oxygen) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#7df9ff';
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H₂O', canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
      })
    );
    sprite.position.copy(oxygen.mesh.position).add(new THREE.Vector3(0, 0.8, 0));
    sprite.scale.set(1.2, 0.4, 1);
    sprite.userData.label = 'H₂O';
    this.scene.add(sprite);
  }

  _spawnParticles(position) {
    const count = 24;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, this.particleMaterial.clone());
    points.position.copy(position);
    this.scene.add(points);
    this.particles.push({
      points,
      lifetime: 1.2,
      maxLifetime: 1.2,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6, (Math.random() - 0.5) * 0.4),
    });
  }
}
