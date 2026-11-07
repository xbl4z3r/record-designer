import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ProjectData, StudioBackground, StudioDisplayMode, SlipmatStyle } from '../../types';
import { vinylAudio } from '../../utils/audio';
import { buildStudioSceneMeshes, BuiltStudioMeshes } from '../../utils/threeModels';
import { createStudioEnvironment } from '../../utils/studioEnvironment';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  Sparkles,
  Disc,
  Compass,
  Palette,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface StudioViewerProps {
  project: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const StudioViewer: React.FC<StudioViewerProps> = ({ project, onUpdateProject }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Display & Environment
  const [displayMode, setDisplayMode] = useState<StudioDisplayMode>('sleeve_and_disc');
  const [background, setBackground] = useState<StudioBackground>('dark_studio');
  const [slipmat, setSlipmat] = useState<SlipmatStyle>('felt_black');

  // Playback & Audio
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rpm, setRpm] = useState<33.33 | 45>(33.33);
  const [pitch, setPitch] = useState<number>(0);
  const [audioCrackle, setAudioCrackle] = useState<boolean>(false);
  const [side, setSide] = useState<'A' | 'B'>('A');
  const [extraction, setExtraction] = useState<number>(0.55); // 0 to 1
  const [showSheen, setShowSheen] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Mutable refs for animation loop
  const isPlayingRef = useRef(isPlaying);
  const rpmRef = useRef(rpm);
  const pitchRef = useRef(pitch);
  const sideRef = useRef(side);
  const extractionRef = useRef(extraction);
  const displayModeRef = useRef(displayMode);
  const showSheenRef = useRef(showSheen);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    rpmRef.current = rpm;
    pitchRef.current = pitch;
    sideRef.current = side;
    extractionRef.current = extraction;
    displayModeRef.current = displayMode;
    showSheenRef.current = showSheen;
  }, [isPlaying, rpm, pitch, side, extraction, displayMode, showSheen]);

  // Three.js internal scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<BuiltStudioMeshes | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Camera Orbit state (Default comfortable framing)
  const cameraOrbit = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: -0.32,
    phi: 1.18,
    radius: 13.5,
    target: new THREE.Vector3(0, 0, 0),
  });
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius, target } = cameraOrbit.current;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    cameraRef.current.position.set(
      target.x + radius * sinPhi * sinTheta,
      target.y + radius * cosPhi,
      target.z + radius * sinPhi * cosTheta
    );
    cameraRef.current.lookAt(target);
  }, []);

  // 1. Single Unified Three.js WebGL Setup with 16x Anisotropic Hardware Filtering & Studio HDR
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create Camera with generous perspective
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Create WebGL Renderer with full native pixel density
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Clear old children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Softbox Reflection Environment (gives lacquer vinyl deep reflections without bleaching)
    const studioEnv = createStudioEnvironment(renderer);
    scene.environment = studioEnv;

    // Balanced Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.65);
    fillLight.position.set(-8, 5, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.65);
    rimLight.position.set(2, -2, -6);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Soft Shadow Receiving Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.55;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Build 3D Meshes with 16x Anisotropic Hardware Textures
    const meshes = buildStudioSceneMeshes(project, slipmat);
    meshesRef.current = meshes;

    scene.add(meshes.jacketGroup);
    scene.add(meshes.innerSleeveGroup);
    scene.add(meshes.vinylGroup);
    scene.add(meshes.turntableGroup);

    // ResizeObserver to always keep aspect ratio accurate
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    // Main 60 FPS Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentMode = displayModeRef.current;
      const currentExtraction = extractionRef.current;
      const currentSide = sideRef.current;
      const spinning = isPlayingRef.current;
      const currentRpm = rpmRef.current;
      const currentPitch = pitchRef.current;

      // Update Rim Light Sheen
      if (rimLightRef.current) {
        rimLightRef.current.intensity = showSheenRef.current ? 0.75 : 0.05;
      }

      // 1. Vinyl disc spinning around its center spindle
      if (spinning && meshes.discMesh) {
        const effectiveRpm = currentRpm * (1 + currentPitch / 100);
        const radPerSec = (effectiveRpm / 60) * 2 * Math.PI;
        meshes.discMesh.rotation.y += radPerSec * delta;
      }

      // 2. Stage Mode layouts & Unboxing mechanics
      if (currentMode === 'sleeve_and_disc') {
        // Full Package with 3-Stage Unboxing (Packed -> Slid Out -> Collector Gallery Spread)
        meshes.turntableGroup.visible = false;
        meshes.jacketGroup.visible = true;
        meshes.innerSleeveGroup.visible = true;
        meshes.vinylGroup.visible = true;

        if (currentExtraction > 0.82) {
          // Collector Gallery Spread: Jacket on left, Inner Sleeve in center, Vinyl on right
          const t = (currentExtraction - 0.82) / 0.18;
          meshes.jacketGroup.position.set(-1.6 - t * 2.5, 0, -t * 0.4);
          meshes.jacketGroup.rotation.set(0, t * 0.2, 0);

          meshes.innerSleeveGroup.position.set(0, 0, 0);
          meshes.innerSleeveGroup.rotation.set(0, 0, 0);

          meshes.vinylGroup.position.set(1.6 + t * 2.6, 0, t * 0.25);
          meshes.vinylGroup.rotation.set(currentSide === 'A' ? Math.PI / 2 : -Math.PI / 2, 0, 0);
        } else {
          // Sequential Unboxing Slide: Inner sleeve emerges, record slides out of inner sleeve
          meshes.jacketGroup.position.set(-1.5, 0, 0);
          meshes.jacketGroup.rotation.set(0, 0, 0);

          const innerX = -1.5 + currentExtraction * 1.8;
          meshes.innerSleeveGroup.position.set(innerX, 0, 0);
          meshes.innerSleeveGroup.rotation.set(0, 0, 0);

          const discX = -1.5 + currentExtraction * 3.5;
          meshes.vinylGroup.position.set(discX, 0, 0);

          meshes.vinylGroup.rotation.set(currentSide === 'A' ? Math.PI / 2 : -Math.PI / 2, 0, 0);
        }
      } else if (currentMode === 'inner_and_disc') {
        // Anti-Static Inner Sleeve Focus: Jacket hidden, inner sleeve centered
        meshes.turntableGroup.visible = false;
        meshes.jacketGroup.visible = false;
        meshes.innerSleeveGroup.visible = true;
        meshes.vinylGroup.visible = true;

        meshes.innerSleeveGroup.position.set(-0.9, 0, 0);
        meshes.innerSleeveGroup.rotation.set(0, 0, 0);

        // Disc slides in and out of the anti-static inner sleeve
        const discX = -0.9 + currentExtraction * 3.0;
        meshes.vinylGroup.position.set(discX, 0, 0);

        meshes.vinylGroup.rotation.set(currentSide === 'A' ? Math.PI / 2 : -Math.PI / 2, 0, 0);
      } else if (currentMode === 'jacket_solo') {
        // Outer Jacket Box Solo 3D inspection
        meshes.turntableGroup.visible = false;
        meshes.innerSleeveGroup.visible = false;
        meshes.vinylGroup.visible = false;
        meshes.jacketGroup.visible = true;

        meshes.jacketGroup.position.set(0, 0, 0);
        meshes.jacketGroup.rotation.set(0, 0, 0);
      } else if (currentMode === 'vinyl_solo') {
        // Vinyl Disc Solo 3D inspection
        meshes.turntableGroup.visible = false;
        meshes.jacketGroup.visible = false;
        meshes.innerSleeveGroup.visible = false;
        meshes.vinylGroup.visible = true;

        meshes.vinylGroup.position.set(0, 0, 0);
        meshes.vinylGroup.rotation.set(currentSide === 'A' ? Math.PI / 2 : -Math.PI / 2, 0, 0);
      } else {
        // Turntable Mode: Deck is visible in center
        meshes.turntableGroup.visible = true;
        meshes.innerSleeveGroup.visible = false;
        meshes.vinylGroup.visible = true;

        // Prop album jacket behind the deck like "NOW PLAYING" stand
        meshes.jacketGroup.visible = true;
        meshes.jacketGroup.position.set(0, 1.85, -3.2);
        meshes.jacketGroup.rotation.set(-0.16, 0, 0);

        // Vinyl disc sits on the rotating platter
        meshes.vinylGroup.position.set(-0.8, 0.25, 0);
        meshes.vinylGroup.rotation.set(currentSide === 'A' ? 0 : Math.PI, 0, 0);
      }

      // 3. Tonearm pivot animation
      if (meshes.tonearmGroup) {
        const targetArmAngle = spinning ? -0.22 : 0.45;
        meshes.tonearmGroup.rotation.y = THREE.MathUtils.lerp(
          meshes.tonearmGroup.rotation.y,
          targetArmAngle,
          0.08
        );
      }

      // 4. Render 3D Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      studioEnv.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 2. Instant Material / Texture Updates when project or slipmat changes
  useEffect(() => {
    if (meshesRef.current) {
      meshesRef.current.updateMaterials(project, slipmat);
    }
  }, [project, slipmat]);

  // 3. Camera adjustments on mode switch
  useEffect(() => {
    if (displayMode === 'sleeve_and_disc') {
      cameraOrbit.current.radius = 13.5;
      cameraOrbit.current.target.set(0, 0, 0);
    } else if (displayMode === 'inner_and_disc') {
      cameraOrbit.current.radius = 11.0;
      cameraOrbit.current.target.set(0, 0, 0);
    } else if (displayMode === 'jacket_solo') {
      cameraOrbit.current.radius = 10.5;
      cameraOrbit.current.target.set(0, 0, 0);
    } else if (displayMode === 'vinyl_solo') {
      cameraOrbit.current.radius = 9.8;
      cameraOrbit.current.target.set(0, 0, 0);
    } else {
      cameraOrbit.current.radius = 14.5;
      cameraOrbit.current.target.set(0, 0, 0);
    }
    updateCameraPosition();
  }, [displayMode, updateCameraPosition]);

  // Audio crackle handling
  useEffect(() => {
    if (isPlaying && audioCrackle) {
      vinylAudio.play();
    } else {
      vinylAudio.stop();
    }
    return () => {
      vinylAudio.stop();
    };
  }, [isPlaying, audioCrackle]);

  // Orbit Mouse & Touch Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMousePos.current.x;
    const dy = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    cameraOrbit.current.theta -= dx * 0.007;
    cameraOrbit.current.phi = Math.max(
      0.15,
      Math.min(Math.PI / 2 - 0.05, cameraOrbit.current.phi - dy * 0.007)
    );
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraOrbit.current.radius = Math.max(
      5.5,
      Math.min(26.0, cameraOrbit.current.radius + e.deltaY * 0.008)
    );
    updateCameraPosition();
  };

  // Camera Presets
  const setCameraPreset = (preset: 'hero' | 'front' | 'top' | 'side') => {
    const baseRadius =
      displayMode === 'turntable'
        ? 14.5
        : displayMode === 'vinyl_solo'
        ? 9.8
        : displayMode === 'jacket_solo'
        ? 10.5
        : displayMode === 'inner_and_disc'
        ? 11.0
        : 13.5;

    if (preset === 'hero') {
      cameraOrbit.current.theta = -0.32;
      cameraOrbit.current.phi = 1.18;
      cameraOrbit.current.radius = baseRadius;
    } else if (preset === 'front') {
      cameraOrbit.current.theta = 0;
      cameraOrbit.current.phi = Math.PI / 2 - 0.02;
      cameraOrbit.current.radius = baseRadius * 0.92;
    } else if (preset === 'top') {
      cameraOrbit.current.theta = 0;
      cameraOrbit.current.phi = 0.22;
      cameraOrbit.current.radius = baseRadius * 1.05;
    } else if (preset === 'side') {
      cameraOrbit.current.theta = -Math.PI / 2;
      cameraOrbit.current.phi = 1.25;
      cameraOrbit.current.radius = baseRadius * 0.95;
    }
    updateCameraPosition();
  };

  const togglePlay = () => {
    const next = !isPlaying;
    if (next && audioCrackle) {
      vinylAudio.triggerNeedleDrop();
    }
    setIsPlaying(next);
  };

  const handleFlipSide = () => {
    setSide(side === 'A' ? 'B' : 'A');
  };

  // Background environment styles
  const getBackgroundStyles = () => {
    switch (background) {
      case 'walnut_credenza':
        return 'bg-gradient-to-b from-[#26170e] via-[#1a0f08] to-[#0a0503]';
      case 'tokyo_neon':
        return 'bg-gradient-to-tr from-[#050515] via-[#090b20] to-[#120824]';
      case 'bauhaus_concrete':
        return 'bg-gradient-to-br from-[#27272a] via-[#18181b] to-[#0f0f11]';
      case 'sunset_haze':
        return 'bg-gradient-to-b from-[#2e1065] via-[#1e1b4b] to-[#09090b]';
      case 'transparent_grid':
        return 'bg-zinc-950';
      case 'dark_studio':
      default:
        return 'bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(39,39,42,0.6),rgba(9,9,11,0.98))]';
    }
  };

  // Snapshot capture
  const handleExportSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
      const dataUrl = rendererRef.current?.domElement.toDataURL('image/png');
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${project?.jacket?.albumTitle || 'vinyl'}-3d-view.png`;
        link.href = dataUrl;
        link.click();
      }
      setIsExporting(false);
    }, 100);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 h-full w-full ${getBackgroundStyles()} flex flex-col items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-500`}
    >
      {/* Background Lighting Pattern / Studio Grid */}
      {background === 'transparent_grid' && (
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* Real Three.js WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* Top Quick Bar: Mode Switcher & Camera Angles */}
      <div className="absolute top-4 left-4 z-40 flex flex-wrap items-center gap-2 text-xs font-mono">
        {/* Stage Mode Switcher */}
        <div className="flex items-center bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-0.5 shadow-lg">
          <button
            onClick={() => setDisplayMode('sleeve_and_disc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              displayMode === 'sleeve_and_disc'
                ? 'bg-zinc-800 text-white font-semibold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>FULL PACKAGE</span>
          </button>
          <button
            onClick={() => setDisplayMode('inner_and_disc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              displayMode === 'inner_and_disc'
                ? 'bg-zinc-800 text-white font-semibold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>INNER SLEEVE</span>
          </button>
          <button
            onClick={() => setDisplayMode('jacket_solo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              displayMode === 'jacket_solo'
                ? 'bg-zinc-800 text-white font-semibold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>JACKET SOLO</span>
          </button>
          <button
            onClick={() => setDisplayMode('vinyl_solo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              displayMode === 'vinyl_solo'
                ? 'bg-zinc-800 text-white font-semibold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5 text-amber-400" />
            <span>VINYL SOLO</span>
          </button>
          <button
            onClick={() => setDisplayMode('turntable')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              displayMode === 'turntable'
                ? 'bg-zinc-800 text-white font-semibold shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5 text-cyan-400" />
            <span>TURNTABLE</span>
          </button>
        </div>

        {/* Camera Angle Presets */}
        <div className="hidden sm:flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg p-0.5 shadow">
          <span className="text-[10px] text-zinc-500 px-2 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            VIEW:
          </span>
          <button
            onClick={() => setCameraPreset('hero')}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 text-[11px]"
          >
            HERO
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 text-[11px]"
          >
            FRONT
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 text-[11px]"
          >
            TOP
          </button>
          <button
            onClick={() => setCameraPreset('side')}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-300 text-[11px]"
          >
            SIDE
          </button>
        </div>

        {/* Background Environment Selector */}
        <div className="flex items-center bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg p-0.5 shadow">
          <span className="text-[10px] text-zinc-500 px-2 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            ENV:
          </span>
          <select
            value={background}
            onChange={(e) => setBackground(e.target.value as StudioBackground)}
            className="bg-transparent text-zinc-300 text-[11px] font-mono outline-none pr-2 py-1 cursor-pointer"
          >
            <option value="dark_studio" className="bg-zinc-900 text-zinc-200">Dark Studio</option>
            <option value="walnut_credenza" className="bg-zinc-900 text-zinc-200">Walnut Credenza</option>
            <option value="tokyo_neon" className="bg-zinc-900 text-zinc-200">Tokyo Neon</option>
            <option value="bauhaus_concrete" className="bg-zinc-900 text-zinc-200">Bauhaus Gallery</option>
            <option value="sunset_haze" className="bg-zinc-900 text-zinc-200">Sunset Twilight</option>
            <option value="transparent_grid" className="bg-zinc-900 text-zinc-200">Technical Grid</option>
          </select>
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-4 md:bottom-6 z-40 max-w-[94vw] overflow-x-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-full px-4 md:px-5 py-2 md:py-2.5 shadow-2xl flex items-center gap-3 md:gap-4 text-xs font-mono">
        {/* Play / Spin Toggle */}
        <button
          onClick={togglePlay}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-sans font-medium transition-all ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
          }`}
          title={isPlaying ? 'Stop Turntable' : 'Spin Turntable'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          <span>{isPlaying ? 'PAUSE' : 'SPIN'}</span>
        </button>

        <div className="h-4 w-px bg-zinc-800" />

        {/* RPM Toggle */}
        <div className="flex items-center bg-zinc-950 p-0.5 rounded-full border border-zinc-800">
          <button
            onClick={() => {
              setRpm(33.33);
              onUpdateProject((p) => ({ ...p, vinyl: { ...p.vinyl, rpm: '33rpm' } }));
            }}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              rpm === 33.33 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            33 ⅓
          </button>
          <button
            onClick={() => {
              setRpm(45);
              onUpdateProject((p) => ({ ...p, vinyl: { ...p.vinyl, rpm: '45rpm' } }));
            }}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              rpm === 45 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            45
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Flip Side A / B */}
        <button
          onClick={handleFlipSide}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors"
          title="Flip Vinyl to Side B / Side A"
        >
          <RotateCcw className="w-3 h-3" />
          <span>SIDE {side}</span>
        </button>

        {/* Audio Crackle Toggle */}
        <button
          onClick={() => setAudioCrackle(!audioCrackle)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
            audioCrackle
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400'
          }`}
          title="Surface needle hiss & dust crackle"
        >
          {audioCrackle ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">CRACKLE</span>
        </button>

        {/* Sheen Toggle */}
        <button
          onClick={() => setShowSheen(!showSheen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
            showSheen
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400'
          }`}
          title="Vinyl Light Reflection Sheen"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SHEEN</span>
        </button>

        {/* Mode-specific Controls */}
        {displayMode === 'sleeve_and_disc' ? (
          <>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span className="text-zinc-500 font-mono">UNBOX:</span>
              <button
                type="button"
                onClick={() => setExtraction(0)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  extraction === 0 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Packed: record inside inner sleeve inside jacket"
              >
                Packed
              </button>
              <button
                type="button"
                onClick={() => setExtraction(0.55)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  extraction > 0.2 && extraction < 0.8 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Slid out: inner sleeve emerging, record peeking out"
              >
                Slid Out
              </button>
              <button
                type="button"
                onClick={() => setExtraction(1.0)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  extraction >= 0.8 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Spread: Collector gallery spread"
              >
                Spread
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={extraction}
                onChange={(e) => setExtraction(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                title="Interactive extraction slider"
              />
            </div>
          </>
        ) : displayMode === 'inner_and_disc' ? (
          <>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-[10px]">SLIDE:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={extraction}
                onChange={(e) => setExtraction(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                title="Slide record in/out of inner sleeve"
              />
            </div>
          </>
        ) : displayMode === 'turntable' ? (
          <>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span>PITCH:</span>
              <input
                type="range"
                min="-8"
                max="8"
                step="0.5"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-14 h-1 bg-zinc-800 rounded cursor-pointer"
                title="Pitch adjustment (+/- 8%)"
              />
              <span className={pitch === 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                {pitch > 0 ? `+${pitch}%` : `${pitch}%`}
              </span>
            </div>

            {/* Slipmat Selector */}
            <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
              {(['felt_black', 'cork', 'geometric'] as SlipmatStyle[]).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSlipmat(mat)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    slipmat === mat ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {mat === 'felt_black' ? 'Felt' : mat}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className="h-4 w-px bg-zinc-800" />

        {/* Export 3D Snapshot Button */}
        <button
          onClick={handleExportSnapshot}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-sans font-semibold rounded-full shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 text-zinc-800" />
          <span>{isExporting ? '...' : '3D SNAP'}</span>
        </button>
      </div>

      {/* Subtle Hint Overlay */}
      <div className="absolute bottom-16 md:bottom-20 text-[10px] font-mono text-zinc-500/80 pointer-events-none">
        Click & drag to orbit in 3D WebGL • Scroll to zoom
      </div>
    </div>
  );
};
