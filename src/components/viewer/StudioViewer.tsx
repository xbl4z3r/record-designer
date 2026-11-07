import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProjectData, StudioBackground, StudioDisplayMode, SlipmatStyle } from '../../types';
import { drawVinylRecord } from '../../utils/vinylCanvas';
import { drawInnerSleeve } from '../../utils/innerSleeveCanvas';
import { drawJacketCover } from '../../utils/jacketCanvas';
import { vinylAudio } from '../../utils/audio';
import { TurntableDeck } from './TurntableDeck';
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
  // Canvases
  const vinylCanvasRef = useRef<HTMLCanvasElement>(null);
  const innerSleeveCanvasRef = useRef<HTMLCanvasElement>(null);
  const jacketFrontCanvasRef = useRef<HTMLCanvasElement>(null);
  const jacketBackCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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

  // 3D Orbit Camera Controls (Tilt X, Rotation Y, Zoom)
  const [rotX, setRotX] = useState<number>(14);
  const [rotY, setRotY] = useState<number>(-16);
  const [zoom, setZoom] = useState<number>(0.92);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 14,
    startRotY: -16,
  });

  // Continuous motor rotation angle for vinyl spinning
  const [rotation, setRotation] = useState<number>(0);

  // Animation frame loop for turntable rotation
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        const effectiveRpm = rpm * (1 + pitch / 100);
        const radPerSec = (effectiveRpm / 60) * 2 * Math.PI;
        setRotation((prev) => (prev + radPerSec * delta) % (Math.PI * 2));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, rpm, pitch]);

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

  // Redraw Vinyl Canvas
  useEffect(() => {
    if (!vinylCanvasRef.current) return;
    drawVinylRecord({
      canvas: vinylCanvasRef.current,
      vinyl: project.vinyl,
      side,
      rotationRad: rotation,
      lightAngleRad: Math.PI / 4,
      showSheen,
    });
  }, [project.vinyl, side, rotation, showSheen]);

  // Redraw Inner Sleeve Canvas
  useEffect(() => {
    if (!innerSleeveCanvasRef.current) return;
    drawInnerSleeve({
      canvas: innerSleeveCanvasRef.current,
      innerSleeve: project.innerSleeve,
      side: side === 'A' ? 'front' : 'back',
    });
  }, [project.innerSleeve, side]);

  // Redraw Jacket Front & Back Canvases
  useEffect(() => {
    if (jacketFrontCanvasRef.current) {
      drawJacketCover({
        canvas: jacketFrontCanvasRef.current,
        jacket: project.jacket,
        vinyl: project.vinyl,
        obi: project.obi,
        side: 'front',
      });
    }
    if (jacketBackCanvasRef.current) {
      drawJacketCover({
        canvas: jacketBackCanvasRef.current,
        jacket: project.jacket,
        vinyl: project.vinyl,
        obi: project.obi,
        side: 'back',
      });
    }
  }, [project.jacket, project.vinyl, project.obi]);

  // 3D Mouse & Touch Orbit Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setRotY(dragStartRef.current.startRotY + dx * 0.4);
      setRotX(Math.max(-45, Math.min(80, dragStartRef.current.startRotX - dy * 0.4)));
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.55, Math.min(1.85, prev + delta)));
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

  // Camera presets
  const setCameraPreset = (preset: 'hero' | 'front' | 'top' | 'side') => {
    if (preset === 'hero') {
      setRotX(15);
      setRotY(-18);
      setZoom(displayMode === 'vinyl_solo' ? 1.05 : 0.92);
    } else if (preset === 'front') {
      setRotX(0);
      setRotY(0);
      setZoom(displayMode === 'vinyl_solo' ? 1.1 : 0.95);
    } else if (preset === 'top') {
      setRotX(65);
      setRotY(0);
      setZoom(0.95);
    } else if (preset === 'side') {
      setRotX(8);
      setRotY(-55);
      setZoom(0.95);
    }
  };

  // Background styling mapping
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

  // High-Res Snapshot Export
  const handleExportSnapshot = () => {
    setIsExporting(true);
    setTimeout(() => {
      const offscreen = document.createElement('canvas');
      offscreen.width = 1920;
      offscreen.height = 1080;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      // Studio backdrop
      if (background === 'walnut_credenza') {
        const bg = ctx.createLinearGradient(0, 0, 0, 1080);
        bg.addColorStop(0, '#26170e');
        bg.addColorStop(1, '#0a0503');
        ctx.fillStyle = bg;
      } else if (background === 'tokyo_neon') {
        const bg = ctx.createLinearGradient(0, 0, 1920, 1080);
        bg.addColorStop(0, '#050515');
        bg.addColorStop(0.5, '#090b20');
        bg.addColorStop(1, '#120824');
        ctx.fillStyle = bg;
      } else {
        const bg = ctx.createRadialGradient(960, 540, 150, 960, 540, 900);
        bg.addColorStop(0, '#1c1d22');
        bg.addColorStop(1, '#090a0d');
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, 1920, 1080);

      // Draw components
      if (jacketFrontCanvasRef.current) {
        ctx.drawImage(jacketFrontCanvasRef.current, 240, 240, 600, 600);
      }
      if (vinylCanvasRef.current) {
        ctx.drawImage(vinylCanvasRef.current, 900, 240, 600, 600);
      }

      ctx.font = '500 14px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(`${project.jacket.artistName} — ${project.jacket.albumTitle}`, 60, 1030);

      const link = document.createElement('a');
      link.download = `${project.jacket.albumTitle || 'vinyl'}-3d-studio-capture.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
      setIsExporting(false);
    }, 100);
  };

  // Physical Unboxing Offsets
  const isSpread = extraction >= 0.85;
  const spreadT = Math.max(0, (extraction - 0.85) / 0.15); // 0 to 1

  // Jacket X
  const jacketX = displayMode === 'jacket_solo' ? 0 : isSpread ? -320 - spreadT * 120 : -140;
  // Inner Sleeve X
  const innerSleeveX =
    displayMode === 'inner_and_disc'
      ? -80
      : isSpread
      ? 0
      : -140 + extraction * 180;
  // Vinyl Disc X
  const vinylX =
    displayMode === 'vinyl_solo'
      ? 0
      : displayMode === 'inner_and_disc'
      ? -80 + extraction * 260
      : isSpread
      ? 330 + spreadT * 120
      : -140 + extraction * 360;

  return (
    <div
      ref={stageRef}
      onMouseDown={handleMouseDown}
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

      {/* Main 3D Stage with Hardware-Accelerated Perspective */}
      {displayMode !== 'turntable' ? (
        <div
          className="relative flex items-center justify-center w-full max-w-6xl h-[560px] transition-transform duration-75 ease-out"
          style={{
            perspective: '1500px',
          }}
        >
          <div
            className="relative flex items-center justify-center transition-transform duration-75 ease-out"
            style={{
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom}) translateZ(0)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 1. OUTER JACKET SLEEVE */}
            {(displayMode === 'sleeve_and_disc' || displayMode === 'jacket_solo') && (
              <div
                className="absolute transition-all duration-300 ease-out flex items-center justify-center"
                style={{
                  transform: `translateX(${jacketX}px) translateZ(${isSpread ? -30 : -8}px) rotateY(${isSpread ? 14 : 0}deg)`,
                  transformStyle: 'preserve-3d',
                  zIndex: 10,
                }}
              >
                {/* Hollow Jacket Front Panel */}
                <div
                  className="relative w-[360px] h-[360px] rounded-[3px] shadow-[0_30px_70px_rgba(0,0,0,0.85)] border border-zinc-800/80 overflow-hidden"
                  style={{
                    transform: 'translateZ(9px)',
                    boxShadow: '0 30px 70px -15px rgba(0,0,0,0.9), 0 0 25px rgba(0,0,0,0.6)',
                  }}
                >
                  <canvas
                    ref={jacketFrontCanvasRef}
                    width={720}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                  {/* Left Spine Shadow Edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                </div>

                {/* Jacket Back Panel */}
                <div
                  className="absolute w-[360px] h-[360px] rounded-[3px] overflow-hidden"
                  style={{
                    transform: 'translateZ(-9px) rotateY(180deg)',
                  }}
                >
                  <canvas
                    ref={jacketBackCanvasRef}
                    width={720}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* 2. ANTI-STATIC INNER SLEEVE */}
            {(displayMode === 'sleeve_and_disc' || displayMode === 'inner_and_disc') && (
              <div
                className="absolute transition-all duration-300 ease-out flex items-center justify-center"
                style={{
                  transform: `translateX(${innerSleeveX}px) translateZ(0px)`,
                  transformStyle: 'preserve-3d',
                  zIndex: 20,
                  opacity: project.innerSleeve.translucency ? Math.max(0.7, project.innerSleeve.translucency) : 0.95,
                  filter: 'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.65))',
                }}
              >
                <div className="relative w-[345px] h-[345px] rounded-[2px] overflow-hidden border border-slate-300/30">
                  <canvas
                    ref={innerSleeveCanvasRef}
                    width={720}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* 3. PHYSICAL VINYL RECORD (High Resolution Canvas with Anisotropic Phono Sheen) */}
            {displayMode !== 'jacket_solo' && (
              <div
                className="absolute transition-all duration-300 ease-out flex items-center justify-center"
                style={{
                  transform: `translateX(${vinylX}px) translateZ(${isSpread ? 20 : 0}px)`,
                  transformStyle: 'preserve-3d',
                  zIndex: 30,
                  filter: 'drop-shadow(0 25px 45px rgba(0, 0, 0, 0.85))',
                }}
              >
                <canvas
                  ref={vinylCanvasRef}
                  width={800}
                  height={800}
                  className="w-[340px] h-[340px] rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODE 5: HI-FI TURNTABLE DECK */
        <TurntableDeck
          project={project}
          side={side}
          isPlaying={isPlaying}
          rpm={rpm}
          pitch={pitch}
          rotation={rotation}
          showSheen={showSheen}
          slipmat={slipmat}
          onTogglePlay={togglePlay}
          onSelectRpm={(newRpm) => {
            setRpm(newRpm);
            onUpdateProject((p) => ({ ...p, vinyl: { ...p.vinyl, rpm: newRpm === 33.33 ? '33rpm' : '45rpm' } }));
          }}
          onChangePitch={setPitch}
          onChangeSlipmat={setSlipmat}
        />
      )}

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
          title="Vinyl Anisotropic Phono Sheen"
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
        Click & drag to rotate 3D view • Scroll to zoom
      </div>
    </div>
  );
};
