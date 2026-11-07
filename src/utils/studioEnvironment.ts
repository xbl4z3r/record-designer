import * as THREE from 'three';

/**
 * Procedurally generates a photorealistic studio environment map (softbox lighting rig)
 * for pristine PBR reflections on vinyl lacquer and laminated packaging.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  // Dark studio ambient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#0f1115');
  bgGrad.addColorStop(0.5, '#181a20');
  bgGrad.addColorStop(1, '#08090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Overhead Key Softbox (Bright diffused white bank)
  const softbox1 = ctx.createRadialGradient(512, 120, 10, 512, 120, 220);
  softbox1.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  softbox1.addColorStop(0.4, 'rgba(240, 245, 255, 0.85)');
  softbox1.addColorStop(0.8, 'rgba(180, 200, 230, 0.25)');
  softbox1.addColorStop(1, 'transparent');
  ctx.fillStyle = softbox1;
  ctx.fillRect(256, 0, 512, 280);

  // Left Fill Softbox (Cool blue-white studio bounce)
  const softbox2 = ctx.createRadialGradient(180, 240, 10, 180, 240, 160);
  softbox2.addColorStop(0, 'rgba(220, 235, 255, 0.75)');
  softbox2.addColorStop(0.6, 'rgba(140, 180, 240, 0.2)');
  softbox2.addColorStop(1, 'transparent');
  ctx.fillStyle = softbox2;
  ctx.fillRect(0, 100, 360, 280);

  // Right Accent Strip (Warm tungsten / rose rim light)
  const softbox3 = ctx.createRadialGradient(840, 220, 10, 840, 220, 150);
  softbox3.addColorStop(0, 'rgba(255, 220, 210, 0.8)');
  softbox3.addColorStop(0.6, 'rgba(244, 63, 94, 0.25)');
  softbox3.addColorStop(1, 'transparent');
  ctx.fillStyle = softbox3;
  ctx.fillRect(680, 80, 344, 280);

  // Horizon studio floor bounce
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(0, 256, 1024, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  pmremGenerator.dispose();
  texture.dispose();

  return envMap;
}
