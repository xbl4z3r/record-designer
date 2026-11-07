import React, { useRef } from 'react';
import { ProjectData, ActiveWorkspaceView } from '../../types';
import {
  Disc3,
  Layers,
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  Disc,
} from 'lucide-react';

interface StudioNavbarProps {
  project: ProjectData;
  activeView: ActiveWorkspaceView;
  onSelectView: (view: ActiveWorkspaceView) => void;
  onOpenExportModal: () => void;
  onLoadProject: (data: ProjectData) => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  project,
  activeView,
  onSelectView,
  onOpenExportModal,
  onLoadProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.vinyl && parsed.jacket) {
          onLoadProject(parsed);
        }
      } catch {
        alert('Invalid project JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none z-40">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
          <Disc3 className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-sm font-sans">GROOVESTUDIO</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              PRO
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px] md:max-w-[320px]">
            {project.jacket.artistName || 'Artist'} — {project.jacket.albumTitle || 'Album'}
          </p>
        </div>
      </div>

      {/* Main Mode Segmented Control */}
      <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg">
        <button
          onClick={() => onSelectView('studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            activeView === 'studio'
              ? 'bg-zinc-800 text-white font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Disc className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">3D STUDIO</span>
        </button>

        <button
          onClick={() => onSelectView('diecut')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            activeView === 'diecut'
              ? 'bg-zinc-800 text-white font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">2D DIECUT</span>
        </button>

        <button
          onClick={() => onSelectView('specs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            activeView === 'specs'
              ? 'bg-zinc-800 text-white font-semibold shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">SPEC SHEET</span>
        </button>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors"
          title="Open Project JSON"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Export Production Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-sans font-semibold rounded-md text-xs transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>
      </div>
    </header>
  );
};
