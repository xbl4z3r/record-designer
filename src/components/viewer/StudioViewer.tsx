import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ProjectData, StudioBackground, StudioDisplayMode, SlipmatStyle } from '../../types';
import { vinylAudio } from '../../utils/audio';
import { buildVinylMesh, buildJacketMesh, buildTurntablePlayerMesh } from '../../utils/threeModels';
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
  Maximize2,
  RotateCw,
  Sliders,
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
  const [extraction, setExtraction] = useState<number>(0.55); // 0 = inside sleeve, 1 = fully out
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vinylGroupRef = useRef<THREE.Group | null>(null);
  const jacketGroupRef = useRef<THREE.Group | null>(null);
  const turntableGroupRef = useRef<THREE.Group | null>(null);
  const tonearmRef = useRef<THREE.Group | null>(null);

  // Orbit camera state (Spherical angles)
  const cameraOrbit = useRef<{ theta: number; phi: number; radius: number; target: THREE.Vector3 }>({
    theta: -0.35,
    phi: 1.15,
    radius: 9.8,
    target: new THREE.Vector3(0, 0, 0),
  });
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update Camera position from spherical coords
  const updateCameraFromOrbit = useCallback(() => {
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

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraFromOrbit();

    // 3. Renderer with antialiasing and shadow maps
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig (Key, Fill, Rim, Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-7, 4, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.8);
    rimLight.position.set(2, -3, -6);
    scene.add(rimLight);

    // Floor Contact Shadow Receiver
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.55;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 5. Resize observer
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [updateCameraFromOrbit]);

  // Rebuild 3D Meshes whenever project data changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing meshes
    if (vinylGroupRef.current) scene.remove(vinylGroupRef.current);
    if (jacketGroupRef.current) scene.remove(jacketGroupRef.current);
    if (turntableGroupRef.current) scene.remove(turntableGroupRef.current);

    // Build new meshes
    const vinylMesh = buildVinylMesh(project);
    vinylGroupRef.current = vinylMesh;

    const jacketMesh = buildJacketMesh(project);
    jacketGroupRef.current = jacketMesh;

    const turntableMesh = buildTurntablePlayerMesh(project);
    turntableGroupRef.current = turntableMesh;
    tonearmRef.current = turntableMesh.getObjectByName('TonearmGroup') as THREE.Group;

    if (displayMode === 'sleeve_and_disc') {
      scene.add(jacketMesh);
      scene.add(vinylMesh);
    } else {
      scene.add(turntableMesh);
      scene.add(vinylMesh);
    }
  }, [project, displayMode]);

  // Toggle visible mode
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    if (displayMode === 'sleeve_and_disc') {
      if (turntableGroupRef.current) scene.remove(turntableGroupRef.current);
      if (jacketGroupRef.current) scene.add(jacketGroupRef.current);
      if (vinylGroupRef.current) scene.add(vinylGroupRef.current);
      cameraOrbit.current.radius = 9.8;
      cameraOrbit.current.target.set(0, 0, 0);
    } else {
      if (jacketGroupRef.current) scene.remove(jacketGroupRef.current);
      if (turntableGroupRef.current) scene.add(turntableGroupRef.current);
      if (vinylGroupRef.current) scene.add(vinylGroupRef.current);
      cameraOrbit.current.radius = 11.5;
      cameraOrbit.current.target.set(0, 0, 0);
    }
    updateCameraFromOrbit();
  }, [displayMode, updateCameraFromOrbit]);

  // Animation render loop (Rotation, Extraction, Tonearm kinematics)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // 1. Vinyl continuous spin
      if (isPlaying && vinylGroupRef.current) {
        const effectiveRpm = rpm * (1 + pitch / 100);
        const radPerSec = (effectiveRpm / 60) * 2 * Math.PI;

        if (displayMode === 'sleeve_and_disc') {
          // Disc spins around its face axis (Z axis of jacket)
          vinylGroupRef.current.rotation.y += radPerSec * delta;
        } else {
          // Turntable mode: disc sits flat on platter (spins around Y axis)
          vinylGroupRef.current.rotation.y += radPerSec * delta;
        }
      }

      // 2. Position Vinyl disc depending on mode
      if (vinylGroupRef.current) {
        if (displayMode === 'sleeve_and_disc') {
          // Slide disc out of sleeve along X axis
          const discX = -0.5 + extraction * 2.8;
          vinylGroupRef.current.position.set(discX, 0, 0.05);

          // Disc is upright in sleeve mode
          vinylGroupRef.current.rotation.x = side === 'A' ? Math.PI / 2 : -Math.PI / 2;
          vinylGroupRef.current.rotation.z = 0;
        } else {
          // Disc lies flat on Turntable platter (-0.8, 0.24, 0)
          vinylGroupRef.current.position.set(-0.8, 0.25, 0);
          vinylGroupRef.current.rotation.x = side === 'A' ? 0 : Math.PI;
        }
      }

      // 3. Tonearm smooth pivot animation
      if (tonearmRef.current) {
        const targetRotY = isPlaying ? -0.22 : 0.45;
        tonearmRef.current.rotation.y = THREE.MathUtils.lerp(tonearmRef.current.rotation.y, targetRotY, 0.08);
      }

      // 4. Render 3D Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, rpm, pitch, displayMode, extraction, side]);

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

  // Mouse & Touch 3D Orbit Controls
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

    // Update spherical angles
    cameraOrbit.current.theta -= dx * 0.007;
    cameraOrbit.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cameraOrbit.current.phi - dy * 0.007));
    updateCameraFromOrbit();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraOrbit.current.radius = Math.max(4.5, Math.min(18.0, cameraOrbit.current.radius + e.deltaY * 0.008));
    updateCameraFromOrbit();
  };

  // Camera Presets
  const setCameraPreset = (preset: 'hero' | 'front' | 'top' | 'side') => {
    if (preset === 'hero') {
      cameraOrbit.current.theta = -0.35;
      cameraOrbit.current.phi = 1.15;
      cameraOrbit.current.radius = displayMode === 'turntable' ? 11.5 : 9.8;
    } else if (preset === 'front') {
      cameraOrbit.current.theta = 0;
      cameraOrbit.current.phi = Math.PI / 2;
      cameraOrbit.current.radius = 8.5;
    } else if (preset === 'top') {
      cameraOrbit.current.theta = 0;
      cameraOrbit.current.phi = 0.2;
      cameraOrbit.current.radius = 9.5;
    } else if (preset === 'side') {
      cameraOrbit.current.theta = -Math.PI / 2;
      cameraOrbit.current.phi = 1.25;
      cameraOrbit.current.radius = 9.0;
    }
    updateCameraFromOrbit();
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

  // 3D High-Res Snapshot
  const handleExportSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
      const dataUrl = rendererRef.current?.domElement.toDataURL('image/png');
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${project.jacket.albumTitle || 'vinyl'}-webgl-3d.png`;
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
        {/* Display Mode: Sleeve vs Turntable */}
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
            <span>3D SLEEVE & DISC</span>
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
            <span>3D TURNTABLE</span>
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-sans font-medium transition-all ${
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

        {/* Extraction Slider (only in sleeve mode) */}
        {displayMode === 'sleeve_and_disc' ? (
          <>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={extraction}
                onChange={(e) => setExtraction(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                title="Disc Extraction"
              />
            </div>
          </>
        ) : (
          /* Pitch Slider (in Turntable mode) */
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
                title="Pitch (+/- 8%)"
              />
              <span className={pitch === 0 ? 'text-emerald-400' : 'text-zinc-300'}>
                {pitch > 0 ? `+${pitch}%` : `${pitch}%`}
              </span>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-zinc-800" />

        {/* Export 3D WebGL Snapshot Button */}
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
      <div className="absolute bottom-16 md:bottom-20 text-[10px] font-mono text-zinc-500/70 pointer-events-none">
        Click & drag to orbit in 3D WebGL • Scroll to zoom in/out
      </div>
    </div>
  );
};
