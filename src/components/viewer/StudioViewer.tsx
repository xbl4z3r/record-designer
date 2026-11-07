import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ProjectData, StudioBackground, StudioDisplayMode, SlipmatStyle } from '../../types';
import { drawVinylRecord } from '../../utils/vinylCanvas';
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
  Maximize2,
  RotateCw,
  Sliders,
} from 'lucide-react';

interface StudioViewerProps {
  project: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const StudioViewer: React.FC<StudioViewerProps> = ({ project, onUpdateProject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [extraction, setExtraction] = useState<number>(0.55); // 0 = inside jacket, 1 = fully out
  const [showSheen, setShowSheen] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 3D Camera Orbit & Zoom
  const [rotX, setRotX] = useState<number>(14);
  const [rotY, setRotY] = useState<number>(-16);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 14,
    startRotY: -16,
  });

  // Continuous rotation angle for vinyl spinning
  const [rotation, setRotation] = useState<number>(0);

  // Turntable rotation physics loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        // Adjust speed based on pitch (-8% to +8%)
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

  // Redraw canvas in sleeve mode
  useEffect(() => {
    if (displayMode !== 'sleeve_and_disc') return;
    if (!canvasRef.current) return;
    drawVinylRecord({
      canvas: canvasRef.current,
      vinyl: project.vinyl,
      side,
      rotationRad: rotation,
      lightAngleRad: Math.PI / 4,
      showSheen,
    });
  }, [project.vinyl, side, rotation, showSheen, displayMode]);

  // 3D Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background, not controls
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setRotY(dragStartRef.current.startRotY + dx * 0.4);
      setRotX(Math.max(-20, Math.min(75, dragStartRef.current.startRotX - dy * 0.4)));
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.65, Math.min(1.65, prev + delta)));
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
      setRotX(16);
      setRotY(-18);
      setZoom(1.0);
    } else if (preset === 'front') {
      setRotX(0);
      setRotY(0);
      setZoom(1.0);
    } else if (preset === 'top') {
      setRotX(58);
      setRotY(0);
      setZoom(1.05);
    } else if (preset === 'side') {
      setRotX(10);
      setRotY(-48);
      setZoom(1.0);
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
      offscreen.width = 1600;
      offscreen.height = 1200;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      // Draw backdrop
      if (background === 'walnut_credenza') {
        const bg = ctx.createLinearGradient(0, 0, 0, 1200);
        bg.addColorStop(0, '#26170e');
        bg.addColorStop(1, '#0a0503');
        ctx.fillStyle = bg;
      } else if (background === 'tokyo_neon') {
        const bg = ctx.createLinearGradient(0, 0, 1600, 1200);
        bg.addColorStop(0, '#050515');
        bg.addColorStop(0.5, '#090b20');
        bg.addColorStop(1, '#120824');
        ctx.fillStyle = bg;
      } else if (background === 'transparent_grid') {
        ctx.clearRect(0, 0, 1600, 1200);
      } else {
        const bg = ctx.createRadialGradient(800, 500, 150, 800, 600, 900);
        bg.addColorStop(0, '#1c1d22');
        bg.addColorStop(1, '#090a0d');
        ctx.fillStyle = bg;
      }
      if (background !== 'transparent_grid') {
        ctx.fillRect(0, 0, 1600, 1200);
      }

      // Render composite mock
      const jacketX = 260;
      const jacketY = 280;
      const jacketSize = 640;

      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 25;

      ctx.fillStyle = project.jacket.bgColor || '#18181b';
      ctx.fillRect(jacketX, jacketY, jacketSize, jacketSize);
      ctx.shadowColor = 'transparent';

      // Artwork if present
      ctx.fillStyle = project.jacket.accentColor || '#f43f5e';
      ctx.fillRect(jacketX + 35, jacketY + 35, 8, 50);

      ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText((project.jacket.artistName || 'ARTIST').toUpperCase(), jacketX + 55, jacketY + 55);

      ctx.font = '300 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText((project.jacket.albumTitle || 'ALBUM').toUpperCase(), jacketX + 55, jacketY + 95);

      if (canvasRef.current) {
        const vinylDiscSize = 620;
        const vinylX = jacketX + jacketSize * (0.25 + extraction * 0.55);
        const vinylY = jacketY + 10;
        ctx.drawImage(canvasRef.current, vinylX - vinylDiscSize / 2, vinylY, vinylDiscSize, vinylDiscSize);
      }

      ctx.font = '500 13px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(`3D STUDIO CAPTURE • ${project.vinyl.size.toUpperCase()} • ${project.vinyl.weight}`, 60, 1140);

      const link = document.createElement('a');
      link.download = `${project.jacket.albumTitle || 'vinyl'}-3d-capture.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
      setIsExporting(false);
    }, 150);
  };

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
            <span>SLEEVE & DISC</span>
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
            <span>TURNTABLE DECK</span>
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

      {/* Main 3D Stage with smooth orbit transform */}
      <div
        className="relative flex items-center justify-center w-full max-w-5xl h-[530px] transition-transform duration-75 ease-out"
        style={{
          perspective: '1400px',
        }}
      >
        <div
          className="relative flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* MODE 1: SLEEVE & DISC 3D VIEW */}
          {displayMode === 'sleeve_and_disc' ? (
            <>
              {/* Outer Jacket */}
              <div
                className="relative z-10 w-[360px] h-[360px] rounded-[3px] shadow-[0_30px_70px_rgba(0,0,0,0.85)] border border-zinc-800/80 overflow-hidden flex flex-col justify-between p-6 transition-all duration-300"
                style={{
                  backgroundColor: project.jacket.bgColor || '#18181b',
                  backgroundImage: project.jacket.frontArtwork ? `url(${project.jacket.frontArtwork})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Spine Highlight Left Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />

                {/* Jacket Details */}
                <div className="space-y-1 relative z-20">
                  <div className="w-1.5 h-6 rounded-full mb-3" style={{ backgroundColor: project.jacket.accentColor || '#f43f5e' }} />
                  <p className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                    {project.jacket.artistName || 'ARTIST NAME'}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100 uppercase leading-snug">
                    {project.jacket.albumTitle || 'ALBUM TITLE'}
                  </h2>
                </div>

                {/* Center Cutout for Disco Bag or Graphic Accent */}
                {project.jacket.centerCutoutHole ? (
                  <div className="self-center w-28 h-28 rounded-full border border-zinc-700 bg-zinc-950/80 shadow-inner flex items-center justify-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Aperture</span>
                  </div>
                ) : (
                  <div className="self-center w-full max-w-[200px] py-4 border-y border-zinc-800/80 flex flex-col items-center justify-center space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 tracking-wider">
                      {project.vinyl.size.toUpperCase()} VINYL PRESSING
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {project.vinyl.weight} • {project.vinyl.rpm.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Bottom metadata */}
                <div className="flex items-center justify-between relative z-20 text-[10px] font-mono text-zinc-500">
                  <span>{project.jacket.catalogNumber || 'CAT-001'}</span>
                  <span>{project.jacket.barcode || '7 93573 19482 0'}</span>
                </div>

                {/* Obi Strip Wrap (if enabled) */}
                {project.obi.enabled && (
                  <div
                    className={`absolute top-0 bottom-0 w-16 z-30 shadow-lg flex flex-col justify-between py-6 px-2 text-center border-x border-black/10 ${
                      project.obi.position === 'left' ? 'left-6' : 'right-6'
                    }`}
                    style={{
                      backgroundColor: project.obi.backgroundColor || '#f43f5e',
                      color: project.obi.textColor || '#ffffff',
                    }}
                  >
                    <div className="text-[11px] font-bold leading-tight [writing-mode:vertical-rl] mx-auto tracking-widest">
                      {project.obi.japaneseTitle || '邦題タイトル'}
                    </div>
                    <div className="space-y-1">
                      <div className="text-[8px] font-mono font-bold">{project.obi.priceJpy || '¥4,180'}</div>
                      <div className="text-[7px] font-mono opacity-80">{project.obi.releaseCode || 'JPC-8021'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vinyl Record Canvas */}
              <div
                className="absolute transition-all duration-300 ease-out"
                style={{
                  left: `${180 + extraction * 220}px`,
                  zIndex: 5,
                  filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.8))',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={720}
                  className="w-[340px] h-[340px] rounded-full"
                />
              </div>
            </>
          ) : (
            /* MODE 2: DEDICATED TURNTABLE DECK */
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

        {/* Sheen Toggle */}
        <button
          onClick={() => setShowSheen(!showSheen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
            showSheen
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400'
          }`}
          title="Phono anisotropic sheen"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SHEEN</span>
        </button>

        {/* Extraction Slider (only in sleeve mode) */}
        {displayMode === 'sleeve_and_disc' && (
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
        )}

        <div className="h-4 w-px bg-zinc-800" />

        {/* Export High-Res Mockup Button */}
        <button
          onClick={handleExportSnapshot}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-sans font-semibold rounded-full shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 text-zinc-800" />
          <span>{isExporting ? '...' : 'CAPTURE'}</span>
        </button>
      </div>

      {/* Subtle Hint Overlay */}
      <div className="absolute bottom-16 md:bottom-20 text-[10px] font-mono text-zinc-500/70 pointer-events-none">
        Click & drag to rotate 3D view • Scroll to zoom
      </div>
    </div>
  );
};
