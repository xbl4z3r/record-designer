import React, { useEffect, useRef, useState } from 'react';
import { ProjectData } from '../../types';
import { drawVinylRecord } from '../../utils/vinylCanvas';
import { vinylAudio } from '../../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface StudioViewerProps {
  project: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const StudioViewer: React.FC<StudioViewerProps> = ({ project, onUpdateProject }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewer interactive state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rpm, setRpm] = useState<33.33 | 45>(33.33);
  const [audioCrackle, setAudioCrackle] = useState<boolean>(false);
  const [side, setSide] = useState<'A' | 'B'>('A');
  const [extraction, setExtraction] = useState<number>(0.55); // 0 = inside jacket, 1 = fully out
  const [tilt, setTilt] = useState<number>(12); // degrees
  const [rotation, setRotation] = useState<number>(0);
  const [showSheen, setShowSheen] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Animation frame loop for turntable rotation
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        // RPM in revolutions per second = rpm / 60; radians per second = (rpm / 60) * 2 * PI
        const radPerSec = (rpm / 60) * 2 * Math.PI;
        setRotation((prev) => (prev + radPerSec * delta) % (Math.PI * 2));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, rpm]);

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

  // Redraw canvas whenever vinyl config, rotation, side, or sheen changes
  useEffect(() => {
    if (!canvasRef.current) return;
    drawVinylRecord({
      canvas: canvasRef.current,
      vinyl: project.vinyl,
      side,
      rotationRad: rotation,
      lightAngleRad: Math.PI / 4,
      showSheen,
    });
  }, [project.vinyl, side, rotation, showSheen]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFlipSide = () => {
    setSide(side === 'A' ? 'B' : 'A');
  };

  const handleResetCamera = () => {
    setTilt(12);
    setExtraction(0.55);
    setRotation(0);
  };

  const handleExportMockup = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (!canvasRef.current) {
        setIsExporting(false);
        return;
      }
      // Create high-res composite mockup export
      const offscreen = document.createElement('canvas');
      offscreen.width = 1600;
      offscreen.height = 1200;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      // Clean studio gradient backdrop
      const bgGrad = ctx.createRadialGradient(800, 600, 200, 800, 600, 900);
      bgGrad.addColorStop(0, '#1c1d22');
      bgGrad.addColorStop(1, '#090a0d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1600, 1200);

      // Draw drop shadow for jacket
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 45;
      ctx.shadowOffsetY = 25;

      // Draw jacket cover
      const jacketX = 260;
      const jacketY = 280;
      const jacketSize = 640;

      ctx.fillStyle = project.jacket.bgColor || '#18181b';
      ctx.fillRect(jacketX, jacketY, jacketSize, jacketSize);

      ctx.shadowColor = 'transparent';

      // Jacket artwork & typography placeholder
      ctx.fillStyle = project.jacket.accentColor || '#f43f5e';
      ctx.fillRect(jacketX + 35, jacketY + 35, 8, 50);

      ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText((project.jacket.artistName || 'ARTIST').toUpperCase(), jacketX + 55, jacketY + 55);

      ctx.font = '300 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText((project.jacket.albumTitle || 'ALBUM').toUpperCase(), jacketX + 55, jacketY + 95);

      // Obi strip on mockup if enabled
      if (project.obi.enabled) {
        const obiW = 90;
        const obiX = project.obi.position === 'left' ? jacketX + 40 : jacketX + jacketSize - obiW - 40;
        ctx.fillStyle = project.obi.backgroundColor || '#f43f5e';
        ctx.fillRect(obiX, jacketY, obiW, jacketSize);

        ctx.font = '700 18px sans-serif';
        ctx.fillStyle = project.obi.textColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(project.obi.japaneseTitle || '邦題タイトル', obiX + obiW / 2, jacketY + 80);
      }

      // Draw Vinyl disc sliding out
      const vinylDiscSize = 620;
      const vinylX = jacketX + jacketSize * (0.25 + extraction * 0.55);
      const vinylY = jacketY + 10;

      // Draw vinyl canvas directly onto composite
      ctx.drawImage(canvasRef.current, vinylX - vinylDiscSize / 2, vinylY, vinylDiscSize, vinylDiscSize);

      // Studio watermark text
      ctx.font = '500 14px "Geist Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(`PROMO SPEC: ${project.vinyl.size.toUpperCase()} • ${project.vinyl.weight.toUpperCase()} • ${project.vinyl.colorStyle.toUpperCase()}`, 60, 1140);
      ctx.textAlign = 'right';
      ctx.fillText(`${project.jacket.artistName} — ${project.jacket.albumTitle}`, 1540, 1140);

      const link = document.createElement('a');
      link.download = `${project.jacket.albumTitle || 'vinyl-design'}-studio-mockup.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();
      setIsExporting(false);
    }, 150);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Studio Lighting Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(39,39,42,0.5),rgba(9,9,11,0.95))] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main 3D Presentation Stage */}
      <div
        className="relative flex items-center justify-center w-full max-w-5xl h-[520px] transition-transform duration-300 ease-out"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="relative flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt}deg) rotateY(${tilt * 0.3}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Jacket Sleeve */}
          <div
            className="relative z-10 w-[360px] h-[360px] rounded-[3px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-zinc-800/80 overflow-hidden flex flex-col justify-between p-6 transition-all duration-300"
            style={{
              backgroundColor: project.jacket.bgColor || '#18181b',
              backgroundImage: project.jacket.frontArtwork ? `url(${project.jacket.frontArtwork})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.85), 0 0 20px rgba(0,0,0,0.5)',
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

          {/* Vinyl Record Canvas (Positioned with dynamic extraction slider) */}
          <div
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${180 + extraction * 220}px`,
              zIndex: 5,
              filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.75))',
            }}
          >
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              className="w-[340px] h-[340px] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Floating Precision Studio Control Bar */}
      <div className="absolute bottom-4 md:bottom-6 z-40 max-w-[94vw] overflow-x-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-4 md:px-5 py-2 md:py-2.5 shadow-2xl flex items-center gap-3 md:gap-4 text-xs font-mono">
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
          <span>CRACKLE</span>
        </button>

        {/* Lighting Sheen Toggle */}
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
          <span>SHEEN</span>
        </button>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Extraction Slider */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={extraction}
            onChange={(e) => setExtraction(parseFloat(e.target.value))}
            className="w-20 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            title="Disc Extraction"
          />
        </div>

        {/* Tilt Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">TILT</span>
          <input
            type="range"
            min="0"
            max="35"
            step="1"
            value={tilt}
            onChange={(e) => setTilt(parseInt(e.target.value))}
            className="w-16 h-1 bg-zinc-800 rounded-lg cursor-pointer"
            title="3D Tilt Angle"
          />
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        {/* Export High-Res Mockup Button */}
        <button
          onClick={handleExportMockup}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-sans font-semibold rounded-full shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 text-zinc-800" />
          <span>{isExporting ? 'RENDERING...' : 'MOCKUP'}</span>
        </button>
      </div>
    </div>
  );
};
