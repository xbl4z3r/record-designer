import * as THREE from 'three';
import { ProjectData } from '../types';
import {
  createVinylFaceTexture,
  createVinylBumpTexture,
  createJacketFrontTexture,
  createJacketBackTexture,
  createJacketSpineTexture,
  createSlipmatTexture,
} from './threeTextures';

/**
 * Builds high-fidelity 3D Vinyl Disc Cylinder with realistic bevels, bump mapping and dual-sided materials
 */
export function buildVinylMesh(project: ProjectData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VinylGroup';

  const radius = 2.4; // 12-inch scale units
  const thickness = project.vinyl.weight === '180g' ? 0.05 : 0.038;

  // Textures for Side A, Side B, and microgrooves
  const textureSideA = createVinylFaceTexture(project, 'A');
  const textureSideB = createVinylFaceTexture(project, 'B');
  const bumpMap = createVinylBumpTexture();

  // Side A material (Top Cap)
  const matA = new THREE.MeshStandardMaterial({
    map: textureSideA,
    bumpMap: bumpMap,
    bumpScale: 0.015,
    roughness: project.vinyl.colorStyle === 'standard_black' ? 0.28 : 0.35,
    metalness: 0.25,
    transparent: project.vinyl.colorStyle === 'transparent',
    opacity: project.vinyl.colorStyle === 'transparent' ? 0.75 : 1.0,
  });

  // Side B material (Bottom Cap)
  const matB = new THREE.MeshStandardMaterial({
    map: textureSideB,
    bumpMap: bumpMap,
    bumpScale: 0.015,
    roughness: project.vinyl.colorStyle === 'standard_black' ? 0.28 : 0.35,
    metalness: 0.25,
    transparent: project.vinyl.colorStyle === 'transparent',
    opacity: project.vinyl.colorStyle === 'transparent' ? 0.75 : 1.0,
  });

  // Rim edge material (dark vinyl edge)
  const matRim = new THREE.MeshStandardMaterial({
    color: project.vinyl.primaryColor || '#121214',
    roughness: 0.4,
    metalness: 0.1,
  });

  // Cylinder geometry with 64 segments for ultra-smooth disc circumference
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 64, 1);

  // Mesh with multi-material array: [rim, top, bottom]
  const discMesh = new THREE.Mesh(geometry, [matRim, matA, matB]);
  discMesh.castShadow = true;
  discMesh.receiveShadow = true;
  discMesh.name = 'VinylDisc';

  group.add(discMesh);
  return group;
}

/**
 * Builds 3D LP Jacket Box with textured front, back, and spine
 */
export function buildJacketMesh(project: ProjectData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'JacketGroup';

  const size = 5.0; // Jacket width & height
  const spineWidth = 0.09; // Real-world cardboard thickness

  const frontTex = createJacketFrontTexture(project);
  const backTex = createJacketBackTexture(project);
  const spineTex = createJacketSpineTexture(project);

  const cardstockRoughness =
    project.jacket.finish === 'gloss'
      ? 0.15
      : project.jacket.finish === 'soft_touch'
      ? 0.75
      : 0.55;

  const matFront = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
  });

  const matBack = new THREE.MeshStandardMaterial({
    map: backTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
  });

  const matSpine = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
  });

  const matEdge = new THREE.MeshStandardMaterial({
    color: project.jacket.bgColor || '#18181b',
    roughness: 0.6,
  });

  // Box geometry: [right(opening), left(spine), top, bottom, front, back]
  const geometry = new THREE.BoxGeometry(size, size, spineWidth);
  const materials = [
    matEdge, // Right opening mouth
    matSpine, // Left spine
    matEdge, // Top
    matEdge, // Bottom
    matFront, // Front cover
    matBack, // Back cover
  ];

  const jacketMesh = new THREE.Mesh(geometry, materials);
  jacketMesh.castShadow = true;
  jacketMesh.receiveShadow = true;
  jacketMesh.name = 'JacketMesh';

  group.add(jacketMesh);
  return group;
}

/**
 * Builds 3D Turntable Player Plinth, Platter, Strobe, and Tonearm
 */
export function buildTurntablePlayerMesh(project: ProjectData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TurntablePlayer';

  // 1. Heavy Base Chassis Plinth
  const plinthGeo = new THREE.BoxGeometry(7.2, 0.6, 5.8);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: '#1a1b1f',
    roughness: 0.35,
    metalness: 0.5,
  });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = -0.3;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  group.add(plinth);

  // Plinth feet (4 rubber dampeners)
  const footGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.25, 24);
  const footMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.8 });
  [
    [-3.1, -2.4],
    [3.1, -2.4],
    [-3.1, 2.4],
    [3.1, 2.4],
  ].forEach(([x, z]) => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x, -0.7, z);
    group.add(foot);
  });

  // 2. Cast Aluminum Platter with machined strobe rim
  const platterGeo = new THREE.CylinderGeometry(2.55, 2.6, 0.22, 64);
  const platterMat = new THREE.MeshStandardMaterial({
    color: '#71717a',
    roughness: 0.2,
    metalness: 0.85,
  });
  const platter = new THREE.Mesh(platterGeo, platterMat);
  platter.position.set(-0.8, 0.11, 0);
  platter.castShadow = true;
  platter.receiveShadow = true;
  platter.name = 'TurntablePlatter';
  group.add(platter);

  // Slipmat on platter
  const slipmatTex = createSlipmatTexture('felt_black');
  const slipmatGeo = new THREE.CylinderGeometry(2.45, 2.45, 0.02, 48);
  const slipmatMat = new THREE.MeshStandardMaterial({
    map: slipmatTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  const slipmatMesh = new THREE.Mesh(slipmatGeo, slipmatMat);
  slipmatMesh.position.set(-0.8, 0.23, 0);
  slipmatMesh.receiveShadow = true;
  group.add(slipmatMesh);

  // Center Spindle
  const spindleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 16);
  const spindleMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', metalness: 0.95, roughness: 0.1 });
  const spindle = new THREE.Mesh(spindleGeo, spindleMat);
  spindle.position.set(-0.8, 0.35, 0);
  group.add(spindle);

  // 3. Strobe Light Housing (Left)
  const strobeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 20);
  const strobeMat = new THREE.MeshStandardMaterial({
    color: '#f43f5e',
    emissive: '#f43f5e',
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const strobe = new THREE.Mesh(strobeGeo, strobeMat);
  strobe.position.set(-3.1, 0.13, -2.4);
  group.add(strobe);

  // 4. Tonearm Assembly (Gimbal base, arm, counterweight, cartridge)
  const tonearmGroup = new THREE.Group();
  tonearmGroup.position.set(2.3, 0.25, -1.5);
  tonearmGroup.name = 'TonearmGroup';

  // Gimbal Base
  const baseGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.35, 24);
  const baseMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.3, metalness: 0.7 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  tonearmGroup.add(baseMesh);

  // Pivot Assembly
  const pivotGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', metalness: 0.95, roughness: 0.15 });
  const pivot = new THREE.Mesh(pivotGeo, chromeMat);
  pivot.position.y = 0.25;
  tonearmGroup.add(pivot);

  // Counterweight (rear)
  const cwGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 20);
  const cwMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.4, metalness: 0.6 });
  const cw = new THREE.Mesh(cwGeo, cwMat);
  cw.rotation.x = Math.PI / 2;
  cw.position.set(0, 0.25, -0.6);
  tonearmGroup.add(cw);

  // S-Shape Chrome Arm Tube
  const armTubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 16);
  const armTube = new THREE.Mesh(armTubeGeo, chromeMat);
  armTube.rotation.x = Math.PI / 2;
  armTube.position.set(-0.25, 0.25, 1.4);
  armTube.castShadow = true;
  tonearmGroup.add(armTube);

  // Headshell & Stylus Cartridge (Tip)
  const headshellGeo = new THREE.BoxGeometry(0.18, 0.12, 0.45);
  const headshellMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 });
  const headshell = new THREE.Mesh(headshellGeo, headshellMat);
  headshell.position.set(-0.25, 0.21, 3.1);

  // Stylus red tip
  const needleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
  const needleMat = new THREE.MeshStandardMaterial({ color: '#f43f5e', emissive: '#f43f5e', emissiveIntensity: 0.4 });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.set(0, -0.06, 0.12);
  headshell.add(needle);

  tonearmGroup.add(headshell);
  group.add(tonearmGroup);

  return group;
}
