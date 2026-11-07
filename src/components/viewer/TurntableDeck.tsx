import React, { useEffect, useRef } from 'react';
import { ProjectData, SlipmatStyle } from '../../types';
import { drawVinylRecord } from '../../utils/vinylCanvas';

interface TurntableDeckProps {
  project: ProjectData;
  side: 'A' | 'B';
  isPlaying: boolean;
  rpm: 33.33 | 45;
  pitch: number; // -8 to +8 percent
  rotation: number;
  showSheen: boolean;
  slipmat: SlipmatStyle;
  onTogglePlay: () => void;
  onSelectRpm: (rpm: 33.33 | 45) => void;
  onChangePitch: (val: number) => void;
  onChangeSlipmat: (mat: SlipmatStyle) => void;
}

export const TurntableDeck: React.FC<TurntableDeckProps> = ({
  project,
  side,
  isPlaying,
  rpm,
  pitch,
  rotation,
  showSheen,
  slipmat,
  onTogglePlay,
  onSelectRpm,
  onChangePitch,
  onChangeSlipmat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw vinyl record
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

  // Tonearm rotation angle:
  // Rest position = 18 degrees; Lead-in groove = -7 degrees; Inner groove = -24 degrees
  const tonearmAngle = isPlaying ? -8.5 : 20;

  return (
    <div className="relative select-none flex flex-col items-center">
      {/* Heavy Turntable Chassis */}
      <div className="relative w-[480px] h-[390px] rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] border border-zinc-700/60 overflow-hidden">
        {/* Brushed Metal Platter Well Rim */}
        <div className="absolute left-6 top-6 w-[340px] h-[340px] rounded-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-inner border border-zinc-700/80 flex items-center justify-center">
          {/* Strobe Rim Ring with Machined Dots */}
          <div
            className="absolute inset-0 rounded-full border-4 border-dashed border-zinc-500/40 opacity-70 transition-transform duration-75"
            style={{
              transform: `rotate(${rotation * (180 / Math.PI)}deg)`,
            }}
          />

          {/* Slipmat Layer */}
          <div
            className="relative w-[326px] h-[326px] rounded-full overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor:
                slipmat === 'cork'
                  ? '#b45309'
                  : slipmat === 'felt_black'
                  ? '#18181b'
                  : slipmat === 'geometric'
                  ? '#09090b'
                  : '#27272a',
              backgroundImage:
                slipmat === 'cork'
                  ? 'radial-gradient(circle at 50% 50%, #d97706 0%, #92400e 100%)'
                  : slipmat === 'geometric'
                  ? 'repeating-conic-gradient(from 0deg, #18181b 0deg 15deg, #09090b 15deg 30deg)'
                  : undefined,
            }}
          >
            {/* Platter Center Spindle */}
            <div className="absolute z-20 w-3 h-3 rounded-full bg-gradient-to-tr from-zinc-400 via-zinc-200 to-white shadow-md border border-zinc-600" />

            {/* Vinyl Record Canvas */}
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              className="relative z-10 w-[320px] h-[320px] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
            />
          </div>
        </div>

        {/* Strobe Light Tower (Top-Left) */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 z-20">
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 border border-zinc-700 ${
              isPlaying
                ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                : 'bg-zinc-800'
            }`}
          />
          <span className="text-[8px] font-mono tracking-widest text-zinc-500 font-semibold uppercase">
            33/45 STROBE
          </span>
        </div>

        {/* Tonearm Assembly (Right Side) */}
        <div className="absolute right-7 top-7 w-[90px] h-[330px] pointer-events-none z-30">
          {/* Gimbal Base & Pivot Ring */}
          <div className="absolute right-4 top-6 w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 border border-zinc-600 shadow-xl flex items-center justify-center">
            {/* Counterweight */}
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-600 shadow-inner flex items-center justify-center">
              <span className="text-[7px] font-mono text-zinc-400">1.8g</span>
            </div>
          </div>

          {/* S-Shaped Arm Tube that pivots onto the vinyl */}
          <div
            className="absolute right-11 top-12 origin-top-right transition-transform duration-700 ease-out"
            style={{
              transform: `rotate(${tonearmAngle}deg)`,
            }}
          >
            {/* Chrome Arm Tube */}
            <div className="w-1.5 h-48 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 rounded-full shadow-lg" />

            {/* Headshell & Cartridge at the tip */}
            <div className="relative -left-2 top-0 w-5 h-8 bg-zinc-900 border border-zinc-700 rounded-t-sm shadow-md flex flex-col justify-end p-0.5">
              {/* Stylus needle body */}
              <div
                className={`w-full h-2 rounded-sm transition-colors ${
                  isPlaying ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-zinc-600'
                }`}
              />
            </div>
          </div>

          {/* Cueing Lever and Arm Rest */}
          <div className="absolute right-16 top-32 w-2 h-6 bg-zinc-700 rounded-sm shadow border border-zinc-600" />
        </div>

        {/* Pitch Fader Slider (Far Right) */}
        <div className="absolute right-5 bottom-8 z-20 flex flex-col items-center">
          <div className="text-[8px] font-mono text-zinc-500 mb-1 flex items-center gap-1">
            <span>PITCH</span>
            <span className={pitch === 0 ? 'text-emerald-400' : 'text-zinc-400'}>
              {pitch > 0 ? `+${pitch}%` : `${pitch}%`}
            </span>
          </div>
          <div className="relative flex items-center justify-center h-28">
            <input
              type="range"
              min="-8"
              max="8"
              step="0.5"
              value={pitch}
              onChange={(e) => onChangePitch(parseFloat(e.target.value))}
              className="w-24 h-1 bg-zinc-700 rounded-lg -rotate-90 cursor-pointer accent-rose-500"
              title="Pitch adjustment (+/- 8%)"
            />
          </div>
          <button
            onClick={() => onChangePitch(0)}
            className="mt-1 text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
            title="Reset Pitch to 0%"
          >
            RESET
          </button>
        </div>

        {/* Bottom Left Controls: START/STOP and RPM Buttons */}
        <div className="absolute left-6 bottom-6 z-20 flex items-center gap-3">
          {/* Tactile Big Start/Stop Button */}
          <button
            onClick={onTogglePlay}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border font-mono transition-all active:scale-95 shadow-lg ${
              isPlaying
                ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-200'
            }`}
          >
            <span className="text-[10px] font-bold tracking-wider leading-none">
              {isPlaying ? 'STOP' : 'START'}
            </span>
            <span className="text-[7px] text-zinc-300 opacity-80 mt-0.5">MOTOR</span>
          </button>

          {/* RPM Buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onSelectRpm(33.33)}
              className={`px-3 py-1 rounded text-[10px] font-mono border transition-all ${
                rpm === 33.33
                  ? 'bg-zinc-950 text-white font-bold border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              33 ⅓
            </button>
            <button
              onClick={() => onSelectRpm(45)}
              className={`px-3 py-1 rounded text-[10px] font-mono border transition-all ${
                rpm === 45
                  ? 'bg-zinc-950 text-white font-bold border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              45
            </button>
          </div>

          {/* Slipmat Selector Pill */}
          <div className="ml-2 flex items-center bg-zinc-950/80 p-1 rounded-lg border border-zinc-800 text-[9px] font-mono">
            <span className="text-zinc-500 px-1.5">MAT:</span>
            {(['felt_black', 'cork', 'geometric'] as SlipmatStyle[]).map((mat) => (
              <button
                key={mat}
                onClick={() => onChangeSlipmat(mat)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  slipmat === mat ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
