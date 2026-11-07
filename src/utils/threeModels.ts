import * as THREE from 'three';
import { ProjectData, SlipmatStyle } from '../types';
import {
  createVinylFaceTexture,
  createVinylBumpTexture,
  createJacketFrontTexture,
  createJacketBackTexture,
  createJacketSpineTexture,
  createSlipmatTexture,
} from './threeTextures';

export interface BuiltStudioMeshes {
  vinylGroup: THREE.Group;
  discMesh: THREE.Mesh;
  jacketGroup: THREE.Group;
  turntableGroup: THREE.Group;
  tonearmGroup: THREE.Group;
  updateMaterials: (project: ProjectData, slipmat: SlipmatStyle) => void;
}

export function buildStudioSceneMeshes(
  project: ProjectData,
  slipmat: SlipmatStyle,
  onTextureUpdated?: () => void
): BuiltStudioMeshes {
  // 1. VINYL DISC GROUP
  const vinylGroup = new THREE.Group();
  vinylGroup.name = 'VinylGroup';

  const radius = 2.4;
  const thickness = project?.vinyl?.weight === '180g' ? 0.05 : 0.038;

  let texSideA = createVinylFaceTexture(project, 'A', onTextureUpdated);
  let texSideB = createVinylFaceTexture(project, 'B', onTextureUpdated);
  const bumpMap = createVinylBumpTexture();

  const isTransparent = project?.vinyl?.colorStyle === 'transparent';
  const vinylRoughness = project?.vinyl?.colorStyle === 'standard_black' ? 0.28 : 0.35;

  const matA = new THREE.MeshStandardMaterial({
    map: texSideA,
    bumpMap: bumpMap,
    bumpScale: 0.012,
    roughness: vinylRoughness,
    metalness: 0.25,
    transparent: isTransparent,
    opacity: isTransparent ? 0.75 : 1.0,
  });

  const matB = new THREE.MeshStandardMaterial({
    map: texSideB,
    bumpMap: bumpMap,
    bumpScale: 0.012,
    roughness: vinylRoughness,
    metalness: 0.25,
    transparent: isTransparent,
    opacity: isTransparent ? 0.75 : 1.0,
  });

  const matRim = new THREE.MeshStandardMaterial({
    color: project?.vinyl?.primaryColor || '#121214',
    roughness: 0.35,
    metalness: 0.2,
  });

  const discGeometry = new THREE.CylinderGeometry(radius, radius, thickness, 64, 1);
  const discMesh = new THREE.Mesh(discGeometry, [matRim, matA, matB]);
  discMesh.castShadow = true;
  discMesh.receiveShadow = true;
  discMesh.name = 'DiscMesh';
  vinylGroup.add(discMesh);

  // 2. HOLLOW POCKET JACKET SLEEVE GROUP
  const jacketGroup = new THREE.Group();
  jacketGroup.name = 'JacketGroup';

  const size = 5.0;
  const spineWidth = 0.16; // Generous spine depth for hollow cavity
  const cardboardThickness = 0.015;
  const halfSpine = spineWidth / 2;

  let frontTex = createJacketFrontTexture(project, onTextureUpdated);
  let backTex = createJacketBackTexture(project, onTextureUpdated);
  let spineTex = createJacketSpineTexture(project);

  const finish = project?.jacket?.finish;
  const cardstockRoughness = finish === 'gloss' ? 0.15 : finish === 'soft_touch' ? 0.75 : 0.55;
  const hasCutout = !!project?.jacket?.centerCutoutHole;

  const matFront = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
    transparent: hasCutout,
    alphaTest: hasCutout ? 0.5 : 0,
  });

  const matBack = new THREE.MeshStandardMaterial({
    map: backTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
    transparent: hasCutout,
    alphaTest: hasCutout ? 0.5 : 0,
  });

  const matSpine = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: cardstockRoughness,
    metalness: 0.05,
  });

  const matEdge = new THREE.MeshStandardMaterial({
    color: project?.jacket?.bgColor || '#18181b',
    roughness: 0.6,
  });

  const matInside = new THREE.MeshStandardMaterial({
    color: '#1c1917', // Natural kraft cardboard interior pocket
    roughness: 0.9,
    metalness: 0.0,
  });

  // Front Panel (+Z outside, -Z inside cavity)
  const frontGeo = new THREE.BoxGeometry(size, size, cardboardThickness);
  const frontMaterials = [matEdge, matEdge, matEdge, matEdge, matFront, matInside];
  const frontPanel = new THREE.Mesh(frontGeo, frontMaterials);
  frontPanel.position.set(0, 0, halfSpine - cardboardThickness / 2);
  frontPanel.castShadow = true;
  frontPanel.receiveShadow = true;
  jacketGroup.add(frontPanel);

  // Back Panel (+Z inside cavity, -Z outside)
  const backGeo = new THREE.BoxGeometry(size, size, cardboardThickness);
  const backMaterials = [matEdge, matEdge, matEdge, matEdge, matInside, matBack];
  const backPanel = new THREE.Mesh(backGeo, backMaterials);
  backPanel.position.set(0, 0, -halfSpine + cardboardThickness / 2);
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  jacketGroup.add(backPanel);

  // Left Spine seam
  const spineGeo = new THREE.BoxGeometry(cardboardThickness, size, spineWidth);
  const spineMaterials = [matEdge, matSpine, matEdge, matEdge, matEdge, matEdge];
  const spinePanel = new THREE.Mesh(spineGeo, spineMaterials);
  spinePanel.position.set(-size / 2 + cardboardThickness / 2, 0, 0);
  spinePanel.castShadow = true;
  spinePanel.receiveShadow = true;
  jacketGroup.add(spinePanel);

  // Top Seam
  const topGeo = new THREE.BoxGeometry(size, cardboardThickness, spineWidth);
  const topSeam = new THREE.Mesh(topGeo, matEdge);
  topSeam.position.set(0, size / 2 - cardboardThickness / 2, 0);
  topSeam.receiveShadow = true;
  jacketGroup.add(topSeam);

  // Bottom Seam
  const bottomGeo = new THREE.BoxGeometry(size, cardboardThickness, spineWidth);
  const bottomSeam = new THREE.Mesh(bottomGeo, matEdge);
  bottomSeam.position.set(0, -size / 2 + cardboardThickness / 2, 0);
  bottomSeam.receiveShadow = true;
  jacketGroup.add(bottomSeam);
  // (Note: Right edge is left completely open as the pocket mouth!)

  // 3. TURNTABLE DECK GROUP
  const turntableGroup = new THREE.Group();
  turntableGroup.name = 'TurntableGroup';

  // Plinth
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
  turntableGroup.add(plinth);

  // Feet
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
    turntableGroup.add(foot);
  });

  // Platter
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
  turntableGroup.add(platter);

  // Slipmat
  let slipmatTex = createSlipmatTexture(slipmat);
  const slipmatGeo = new THREE.CylinderGeometry(2.45, 2.45, 0.02, 48);
  const slipmatMat = new THREE.MeshStandardMaterial({
    map: slipmatTex,
    roughness: 0.9,
    metalness: 0.0,
  });
  const slipmatMesh = new THREE.Mesh(slipmatGeo, slipmatMat);
  slipmatMesh.position.set(-0.8, 0.23, 0);
  slipmatMesh.receiveShadow = true;
  turntableGroup.add(slipmatMesh);

  // Spindle
  const spindleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 16);
  const spindleMat = new THREE.MeshStandardMaterial({ color: '#e4e4e7', metalness: 0.95, roughness: 0.1 });
  const spindle = new THREE.Mesh(spindleGeo, spindleMat);
  spindle.position.set(-0.8, 0.35, 0);
  turntableGroup.add(spindle);

  // Strobe housing
  const strobeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.25, 20);
  const strobeMat = new THREE.MeshStandardMaterial({
    color: '#f43f5e',
    emissive: '#f43f5e',
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const strobe = new THREE.Mesh(strobeGeo, strobeMat);
  strobe.position.set(-3.1, 0.13, -2.4);
  turntableGroup.add(strobe);

  // Tonearm assembly
  const tonearmGroup = new THREE.Group();
  tonearmGroup.position.set(2.3, 0.25, -1.5);
  tonearmGroup.name = 'TonearmGroup';

  const baseGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.35, 24);
  const baseMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.3, metalness: 0.7 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  tonearmGroup.add(baseMesh);

  const pivotGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const chromeMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', metalness: 0.95, roughness: 0.15 });
  const pivot = new THREE.Mesh(pivotGeo, chromeMat);
  pivot.position.y = 0.25;
  tonearmGroup.add(pivot);

  const cwGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 20);
  const cwMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.4, metalness: 0.6 });
  const cw = new THREE.Mesh(cwGeo, cwMat);
  cw.rotation.x = Math.PI / 2;
  cw.position.set(0, 0.25, -0.6);
  tonearmGroup.add(cw);

  const armTubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 16);
  const armTube = new THREE.Mesh(armTubeGeo, chromeMat);
  armTube.rotation.x = Math.PI / 2;
  armTube.position.set(-0.25, 0.25, 1.4);
  armTube.castShadow = true;
  tonearmGroup.add(armTube);

  const headshellGeo = new THREE.BoxGeometry(0.18, 0.12, 0.45);
  const headshellMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 });
  const headshell = new THREE.Mesh(headshellGeo, headshellMat);
  headshell.position.set(-0.25, 0.21, 3.1);

  const needleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
  const needleMat = new THREE.MeshStandardMaterial({ color: '#f43f5e', emissive: '#f43f5e', emissiveIntensity: 0.4 });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.set(0, -0.06, 0.12);
  headshell.add(needle);

  tonearmGroup.add(headshell);
  turntableGroup.add(tonearmGroup);

  // Materials updater
  const updateMaterials = (newProject: ProjectData, newSlipmat: SlipmatStyle) => {
    texSideA.dispose();
    texSideB.dispose();
    frontTex.dispose();
    backTex.dispose();
    spineTex.dispose();
    slipmatTex.dispose();

    texSideA = createVinylFaceTexture(newProject, 'A', onTextureUpdated);
    texSideB = createVinylFaceTexture(newProject, 'B', onTextureUpdated);
    frontTex = createJacketFrontTexture(newProject, onTextureUpdated);
    backTex = createJacketBackTexture(newProject, onTextureUpdated);
    spineTex = createJacketSpineTexture(newProject);
    slipmatTex = createSlipmatTexture(newSlipmat);

    matA.map = texSideA;
    matA.needsUpdate = true;

    matB.map = texSideB;
    matB.needsUpdate = true;

    const hasCutout = !!newProject?.jacket?.centerCutoutHole;
    matFront.transparent = hasCutout;
    matFront.alphaTest = hasCutout ? 0.5 : 0;
    matBack.transparent = hasCutout;
    matBack.alphaTest = hasCutout ? 0.5 : 0;

    matFront.map = frontTex;
    matFront.needsUpdate = true;

    matBack.map = backTex;
    matBack.needsUpdate = true;

    matSpine.map = spineTex;
    matSpine.needsUpdate = true;

    slipmatMat.map = slipmatTex;
    slipmatMat.needsUpdate = true;

    const newIsTransparent = newProject?.vinyl?.colorStyle === 'transparent';
    matA.transparent = newIsTransparent;
    matA.opacity = newIsTransparent ? 0.75 : 1.0;
    matB.transparent = newIsTransparent;
    matB.opacity = newIsTransparent ? 0.75 : 1.0;

    matRim.color.set(newProject?.vinyl?.primaryColor || '#121214');
  };

  return {
    vinylGroup,
    discMesh,
    jacketGroup,
    turntableGroup,
    tonearmGroup,
    updateMaterials,
  };
}
