import React, { useEffect, useRef, useState } from 'react';
import { ProjectData, ActiveDiecutComponent } from '../../types';
import { drawEditorCanvas } from '../../utils/editorCanvas';
import { generatePrintReadySvg, getComponentDimensions } from '../../utils/diecutGenerator';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  FileCode,
  Ruler,
} from 'lucide-react';

interface DiecutEditorProps {
  project: ProjectData;
  activeComponent: ActiveDiecutComponent;
  onSelectComponent: (comp: ActiveDiecutComponent) => void;
  onUpdateProject?: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const DiecutEditor: React.FC<DiecutEditorProps> = ({
  project,
  activeComponent,
  onSelectComponent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Guide toggles
  const [showBleed, setShowBleed] = useState<boolean>(true);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);

  // Redraw canvas whenever project, component, or view settings change
  useEffect(() => {
    if (!canvasRef.current) return;
    drawEditorCanvas({
      canvas: canvasRef.current,
      project,
      component: activeComponent,
      showBleed,
      showSafeZone,
      showDimensions,
      zoom,
    });
  }, [project, activeComponent, showBleed, showSafeZone, showDimensions, zoom]);

  const dims = getComponentDimensions(project, activeComponent);

  const handleDownloadSvg = () => {
    const svgContent = generatePrintReadySvg(project, activeComponent);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.jacket.albumTitle || 'record'}-${activeComponent}-diecut.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.jacket.albumTitle || 'record'}-${activeComponent}-diecut.png`;
    link.click();
  };

  return (
    <div className="relative flex-1 h-full w-full bg-zinc-950 flex flex-col overflow-hidden select-none">
      {/* Top Component Sub-Navigation Tab Bar */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-20 overflow-x-auto">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSelectComponent('jacket_front')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'jacket_front'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            JACKET FRONT
          </button>
          <button
            onClick={() => onSelectComponent('jacket_back')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'jacket_back'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            JACKET BACK
          </button>
          <button
            onClick={() => onSelectComponent('jacket_spread')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'jacket_spread'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            FULL SPREAD
          </button>
          <button
            onClick={() => onSelectComponent('label_a')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'label_a'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            LABEL SIDE A
          </button>
          <button
            onClick={() => onSelectComponent('label_b')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'label_b'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            LABEL SIDE B
          </button>
          <button
            onClick={() => onSelectComponent('inner_sleeve')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              activeComponent === 'inner_sleeve'
                ? 'bg-zinc-800 text-zinc-100 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            INNER SLEEVE
          </button>
          {project.obi.enabled && (
            <button
              onClick={() => onSelectComponent('obi_strip')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeComponent === 'obi_strip'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              OBI STRIP
            </button>
          )}
        </div>

        {/* Right Dimension Indicator Badge */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
          <Ruler className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {dims.widthMm} × {dims.heightMm} mm (+{dims.bleedMm}mm bleed)
          </span>
        </div>
      </div>

      {/* Editor Center Viewport */}
      <div className="relative flex-1 overflow-auto flex items-center justify-center p-8 bg-zinc-950/80">
        <div className="relative shadow-2xl border border-zinc-800 rounded bg-zinc-900/40 p-4">
          <canvas
            ref={canvasRef}
            className="block max-w-full max-h-[calc(100vh-210px)] object-contain rounded"
          />
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="h-12 bg-zinc-900/90 backdrop-blur border-t border-zinc-800 px-6 flex items-center justify-between z-20">
        {/* Technical Guide Toggles */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <label className="flex items-center space-x-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={showBleed}
              onChange={(e) => setShowBleed(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Bleed (3mm)
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={showSafeZone}
              onChange={(e) => setShowSafeZone(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Safe Zone
            </span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Trim & Dimensions
            </span>
          </label>
        </div>

        {/* Zoom & Quick Export */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-zinc-950 rounded border border-zinc-800 p-0.5">
            <button
              onClick={() => setZoom(Math.max(0.6, zoom - 0.15))}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.8, zoom + 0.15))}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 ml-0.5"
              title="Reset Zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Export SVG */}
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-mono transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-rose-400" />
            <span>EXPORT SVG</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-sans font-semibold rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-900" />
            <span>EXPORT PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
