import * as THREE from 'three';
import { StudioBackground } from '../types';

export interface BuiltEnvironment {
  group: THREE.Group;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  backLight?: THREE.DirectionalLight;
  practicalLight?: THREE.PointLight;
}

/**
 * Creates procedural textures for environment props
 */
function createWoodTexture(isDark = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isDark ? '#1c130d' : '#3d2516';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle natural wood grain streaks
    ctx.fillStyle = isDark ? '#140c07' : '#2b190e';
    for (let i = 0; i < 40; i++) {
      const y = (i * 13) % 512;
      const h = 2 + (i % 5);
      ctx.fillRect(0, y, 512, h);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates texture for shelf full of record spines
 */
function createRecordSpinesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, 1024, 256);

    const colors = [
      '#e2e8f0', '#f43f5e', '#0284c7', '#eab308', '#22c55e',
      '#a855f7', '#f97316', '#64748b', '#ec4899', '#14b8a6',
      '#18181b', '#3b82f6', '#d97706', '#f43f5e', '#e2e8f0',
    ];

    let x = 0;
    while (x < 1024) {
      const spineW = 10 + (Math.sin(x) * 6 + 8);
      const col = colors[Math.floor((x * 7) % colors.length)];
      ctx.fillStyle = col;
      ctx.fillRect(x, 0, spineW - 2, 256);

      // Spine text line
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x + 2, 40, spineW - 6, 170);

      x += spineW;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Builds modular 3D architectural environment according to spec §14
 */
export function buildEnvironmentSet(
  preset: StudioBackground
): BuiltEnvironment {
  const group = new THREE.Group();
  group.name = 'EnvironmentSet';

  // ─── 1. Sideboard / Credenza Table Top (Near-Mid Layer) ────────────────────
  const woodTex = createWoodTexture(preset === 'listening_room_night' || preset === 'dark_studio');
  const tableMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.35,
    metalness: 0.05,
  });

  const tableGeo = new THREE.BoxGeometry(22, 0.45, 9);
  const tableTop = new THREE.Mesh(tableGeo, tableMat);
  tableTop.position.set(0, -2.75, 0);
  tableTop.receiveShadow = true;
  group.add(tableTop);

  // Mid-century brass / black legs
  const legMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.3, metalness: 0.8 });
  const legGeo = new THREE.CylinderGeometry(0.12, 0.06, 3.5, 16);
  [
    [-9.5, -4.5, 3.8],
    [9.5, -4.5, 3.8],
    [-9.5, -4.5, -3.8],
    [9.5, -4.5, -3.8],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  // ─── 2. Shelf with Rows of Records (Mid Layer — Parallaxes through disc!) ──
  if (preset !== 'dark_minimal' && preset !== 'transparent_grid') {
    const shelfGeo = new THREE.BoxGeometry(16, 0.25, 2.8);
    const shelfMat = new THREE.MeshStandardMaterial({ color: '#261b14', roughness: 0.6 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 1.8, -4.6);
    shelf.receiveShadow = true;
    group.add(shelf);

    // Row of colorful record spines standing on the shelf
    const spinesTex = createRecordSpinesTexture();
    const spinesMat = new THREE.MeshStandardMaterial({
      map: spinesTex,
      roughness: 0.6,
    });
    const spinesGeo = new THREE.BoxGeometry(15.6, 2.6, 2.4);
    const spinesMesh = new THREE.Mesh(spinesGeo, spinesMat);
    spinesMesh.position.set(0, 3.2, -4.6);
    spinesMesh.castShadow = true;
    spinesMesh.receiveShadow = true;
    group.add(spinesMesh);
  }

  // ─── 3. Audiophile Bookshelf Speakers (Left & Right) ───────────────────────
  if (preset !== 'dark_minimal' && preset !== 'transparent_grid') {
    const speakerCabGeo = new THREE.BoxGeometry(2.2, 4.4, 2.6);
    const speakerCabMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4, metalness: 0.1 });
    const coneMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.3, metalness: 0.8 }); // Woven copper driver cone
    const tweeterMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.2, metalness: 0.9 });

    [-6.8, 6.8].forEach((x) => {
      const speakerGroup = new THREE.Group();
      speakerGroup.position.set(x, -0.6, -1.8);
      speakerGroup.rotation.y = x < 0 ? 0.25 : -0.25; // Angled in toward listener

      const cab = new THREE.Mesh(speakerCabGeo, speakerCabMat);
      cab.castShadow = true;
      cab.receiveShadow = true;
      speakerGroup.add(cab);

      // Woofer cone
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.5, 0.15, 24), coneMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(0, -0.6, 1.32);
      speakerGroup.add(cone);

      // Tweeter
      const tweeter = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), tweeterMat);
      tweeter.position.set(0, 1.1, 1.32);
      speakerGroup.add(tweeter);

      group.add(speakerGroup);
    });
  }

  // ─── 4. Potted Plant / Monstera (Mid Layer) ────────────────────────────────
  if (preset === 'sunlit_living_room' || preset === 'window_backlight') {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-4.5, -1.7, -1.8);

    // Ceramic pot
    const potGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.6, 20);
    const potMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.3 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.castShadow = true;
    plantGroup.add(pot);

    // Green leaves catching the light
    const leafGeo = new THREE.PlaneGeometry(1.2, 1.8);
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    for (let l = 0; l < 5; l++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(l * 1.3) * 0.5, 1.1 + l * 0.25, Math.sin(l * 1.3) * 0.5);
      leaf.rotation.set(-0.6, l * 1.2, 0.4);
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }
    group.add(plantGroup);
  }

  // ─── 5. Room Architecture & Windows (Far Layer — Spec §14.2) ───────────────
  let backLight: THREE.DirectionalLight | undefined;
  let practicalLight: THREE.PointLight | undefined;

  if (preset === 'sunlit_living_room' || preset === 'window_backlight') {
    // Large Multi-Pane Daylight Window (Far Layer, Z = -5.4)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(2.5, 2.5, -5.4);

    // Bright daylight sky backing plane (causes transparent vinyl to glow!)
    const skyGeo = new THREE.PlaneGeometry(12, 10);
    const skyMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' }); // Pure bright sky
    const skyPlane = new THREE.Mesh(skyGeo, skyMat);
    skyPlane.position.z = -0.1;
    windowGroup.add(skyPlane);

    // Black metal window frame with 6 glass panes
    const frameMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 });
    // Outer frame
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 0.15), frameMat);
    windowGroup.add(outerFrame);
    // Vertical mullion
    const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, 8, 0.2), frameMat);
    windowGroup.add(vMullion);
    // Horizontal mullions
    [-2.2, 0, 2.2].forEach((my) => {
      const hMullion = new THREE.Mesh(new THREE.BoxGeometry(10, 0.18, 0.2), frameMat);
      hMullion.position.y = my;
      windowGroup.add(hMullion);
    });

    group.add(windowGroup);

    // Backlight streaming through the window toward the record
    backLight = new THREE.DirectionalLight(0xf1f5f9, 2.2);
    backLight.position.set(3, 4, -7);
    backLight.target.position.set(0, 0, 0);
  } else if (preset === 'listening_room_night') {
    // Warm Edison / Linen Table Lamp (Practical light source)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(4.8, -1.2, -1.8);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.2, 16), legMat);
    lampGroup.add(lampBase);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16), legMat);
    lampStem.position.y = 1.1;
    lampGroup.add(lampStem);

    // Glowing warm linen shade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#d97706',
      emissiveIntensity: 0.85,
      roughness: 0.6,
    });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.9, 1.1, 20), shadeMat);
    shade.position.y = 2.0;
    lampGroup.add(shade);

    group.add(lampGroup);

    // PointLight inside lamp shade
    practicalLight = new THREE.PointLight(0xffedd5, 1.8, 12, 1.2);
    practicalLight.position.set(4.8, 0.8, -1.8);
    practicalLight.castShadow = true;
  }

  // ─── Lighting Rig Configured by Preset ─────────────────────────────────────
  let keyColor = 0xffffff;
  let keyIntensity = 1.4;
  let fillColor = 0xa5b4fc;
  let fillIntensity = 0.65;

  if (preset === 'sunlit_living_room') {
    keyColor = 0xfffaed; // Warm daylight sun
    keyIntensity = 1.6;
    fillColor = 0xbfdbfe; // Sky bounce
    fillIntensity = 0.8;
  } else if (preset === 'listening_room_night') {
    keyColor = 0xfde68a; // Warm tungsten
    keyIntensity = 0.9;
    fillColor = 0x38bdf8; // Deep blue window accent
    fillIntensity = 0.4;
  } else if (preset === 'window_backlight') {
    keyColor = 0xffffff;
    keyIntensity = 0.7;
    fillColor = 0xe2e8f0;
    fillIntensity = 0.6;
  } else if (preset === 'studio_gels') {
    keyColor = 0xec4899; // Magenta gel key
    keyIntensity = 1.5;
    fillColor = 0x06b6d4; // Cyan gel fill
    fillIntensity = 1.2;
  }

  const keyLight = new THREE.DirectionalLight(keyColor, keyIntensity);
  keyLight.position.set(6, 10, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.bias = -0.0003;

  const fillLight = new THREE.DirectionalLight(fillColor, fillIntensity);
  fillLight.position.set(-8, 5, 5);

  return {
    group,
    keyLight,
    fillLight,
    backLight,
    practicalLight,
  };
}
