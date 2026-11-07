import React, { useState } from 'react';
import { ProjectData } from '../../types';
import { generatePrintReadySvg } from '../../utils/diecutGenerator';
import {
  X,
  Download,
  FileCode,
  FileText,
  Package,
} from 'lucide-react';

interface ExportModalProps {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = (component: 'jacket_front' | 'jacket_back' | 'jacket_spread' | 'label_a' | 'label_b' | 'inner_sleeve' | 'obi_strip') => {
    setDownloading(component);
    const svg = generatePrintReadySvg(project, component);
    const cleanAlbum = (project.jacket.albumTitle || 'record').toLowerCase().replace(/\s+/g, '-');
    downloadFile(`${cleanAlbum}-${component}-diecut.svg`, svg, 'image/svg+xml;charset=utf-8');
    setTimeout(() => setDownloading(null), 600);
  };

  const handleExportSpecsJson = () => {
    setDownloading('specs_json');
    const cleanAlbum = (project.jacket.albumTitle || 'record').toLowerCase().replace(/\s+/g, '-');
    downloadFile(`${cleanAlbum}-pressing-specs.json`, JSON.stringify(project, null, 2), 'application/json');
    setTimeout(() => setDownloading(null), 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-white font-sans">EXPORT PRODUCTION ASSETS</h3>
              <p className="text-xs font-mono text-zinc-400">Print-ready templates and project specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Vector Die-Cut Templates */}
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-rose-400" />
              <span>1. Press-Ready Vector Die-Cut Templates (SVG)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleExportSvg('jacket_spread')}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Full Jacket Spread</div>
                  <div className="text-[10px] font-mono text-zinc-500">Includes front, back, spine, bleed & crop marks</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>

              <button
                onClick={() => handleExportSvg('jacket_front')}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Front Cover Die-Cut</div>
                  <div className="text-[10px] font-mono text-zinc-500">313 × 313 mm + 3mm bleed standard</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>

              <button
                onClick={() => handleExportSvg('label_a')}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Center Label Side A</div>
                  <div className="text-[10px] font-mono text-zinc-500">100mm circular die-cut + 7.2mm spindle hole</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>

              <button
                onClick={() => handleExportSvg('label_b')}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Center Label Side B</div>
                  <div className="text-[10px] font-mono text-zinc-500">100mm circular die-cut + 7.2mm spindle hole</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>

              <button
                onClick={() => handleExportSvg('inner_sleeve')}
                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Anti-Static Inner Sleeve</div>
                  <div className="text-[10px] font-mono text-zinc-500">309 × 309 mm with die-cut window and corner guides</div>
                </div>
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
              </button>

              {project.obi.enabled && (
                <button
                  onClick={() => handleExportSvg('obi_strip')}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors group md:col-span-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">Japanese Obi Strip Template</div>
                    <div className="text-[10px] font-mono text-zinc-500">{project.obi.widthMm}mm wrap bellyband with fold lines</div>
                  </div>
                <Download className={`w-4 h-4 transition-colors ${downloading === 'jacket_spread' ? 'text-emerald-400 animate-bounce' : 'text-zinc-500 group-hover:text-rose-400'}`} />
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Manufacturing Spec Sheet */}
          <div>
            <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>2. Manufacturing Documentation & Data</span>
            </h4>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200">Pressing Order Specification (JSON)</div>
                <div className="text-[10px] font-mono text-zinc-500">
                  Full machine-readable configuration: vinyl weight, RPM, matrix numbers, track cue sheet
                </div>
              </div>
              <button
                onClick={handleExportSpecsJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-mono transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SAVE JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Standards: DIN EN ISO 216 / GZ Media / Record Industry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-sans text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
