import React from 'react';
import { ProjectData } from '../../types';
import { Printer, Download, Disc, Package, FileText, CheckCircle2 } from 'lucide-react';

interface SpecsSheetProps {
  project: ProjectData;
}

export const SpecsSheet: React.FC<SpecsSheetProps> = ({ project }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.jacket.catalogNumber || 'project'}-specs.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 h-full w-full bg-zinc-950 overflow-y-auto p-6 md:p-12 text-zinc-100">
      {/* Top action bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">MANUFACTURING SPEC SHEET</h2>
          <p className="text-xs font-mono text-zinc-400">
            Official vinyl pressing plant and packaging production order
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-sans font-semibold rounded text-xs transition-colors shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / SAVE PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl space-y-8 font-sans">
        {/* Document Header */}
        <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-semibold mb-2">
              <CheckCircle2 className="w-3 h-3" />
              PRESS-READY SPECIFICATION
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              {project.jacket.albumTitle || 'UNTITLED PROJECT'}
            </h1>
            <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              {project.jacket.artistName || 'ARTIST NAME'}
            </p>
          </div>

          <div className="text-left md:text-right font-mono text-xs space-y-1 text-zinc-400">
            <div><span className="text-zinc-500">CATALOG NO:</span> <strong className="text-zinc-200">{project.jacket.catalogNumber || 'N/A'}</strong></div>
            <div><span className="text-zinc-500">BARCODE (EAN/UPC):</span> <span className="text-zinc-200">{project.jacket.barcode || 'N/A'}</span></div>
            <div><span className="text-zinc-500">DATE GENERATED:</span> <span className="text-zinc-200">{new Date().toISOString().split('T')[0]}</span></div>
          </div>
        </div>

        {/* Section 1: Vinyl Audio Disc Specifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
            <Disc className="w-4 h-4 text-rose-500" />
            <span>1. Vinyl Disc Specifications</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-md bg-zinc-950 border border-zinc-800/80 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block">DISC FORMAT</span>
              <strong className="text-zinc-200 text-sm">{project.vinyl.size.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">ROTATION SPEED</span>
              <strong className="text-zinc-200 text-sm">{project.vinyl.rpm.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">WEIGHT PROFILE</span>
              <strong className="text-zinc-200 text-sm">{project.vinyl.weight.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">SPINDLE HOLE</span>
              <strong className="text-zinc-200 text-sm">
                {project.vinyl.holeType === 'dinked_large' ? '38.1mm DINKED (45)' : '7.24mm STANDARD'}
              </strong>
            </div>
          </div>

          {/* Color Formulation Details */}
          <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">COLOR FORMULATION STYLE:</span>
              <span className="text-zinc-200 font-semibold uppercase">{project.vinyl.colorStyle.replace(/_/g, ' ')}</span>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-zinc-700"
                  style={{ backgroundColor: project.vinyl.primaryColor }}
                />
                <span className="text-zinc-400">Primary: {project.vinyl.primaryColor}</span>
              </div>

              {project.vinyl.colorStyle !== 'standard_black' && project.vinyl.colorStyle !== 'solid' && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-zinc-700"
                    style={{ backgroundColor: project.vinyl.secondaryColor }}
                  />
                  <span className="text-zinc-400">Secondary: {project.vinyl.secondaryColor}</span>
                </div>
              )}

              {project.vinyl.colorStyle === 'splatter' && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-zinc-700"
                    style={{ backgroundColor: project.vinyl.splatterColor }}
                  />
                  <span className="text-zinc-400">Splatter: {project.vinyl.splatterColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dead Wax Matrix Engraving */}
          <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs font-mono">
            <span className="text-zinc-500 block uppercase">DEAD WAX MATRIX ETCHINGS (RUNOUT GROOVE)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">SIDE A MATRIX</span>
                <code className="text-zinc-200 text-xs">{project.vinyl.matrixTextSideA || 'N/A'}</code>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 text-[10px] block">SIDE B MATRIX</span>
                <code className="text-zinc-200 text-xs">{project.vinyl.matrixTextSideB || 'N/A'}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Packaging & Printed Parts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
            <Package className="w-4 h-4 text-cyan-400" />
            <span>2. Packaging & Print Finishing</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-md bg-zinc-950 border border-zinc-800/80 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block">JACKET STYLE</span>
              <strong className="text-zinc-200 text-sm">{project.jacket.type.toUpperCase().replace(/_/g, ' ')}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">CARDSTOCK</span>
              <strong className="text-zinc-200 text-sm">{project.jacket.cardstock.toUpperCase().replace(/_/g, ' ')}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">SURFACE FINISH</span>
              <strong className="text-zinc-200 text-sm">{project.jacket.finish.toUpperCase()}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">SPECIAL FINISH FX</span>
              <strong className="text-zinc-200 text-sm">{project.jacket.specialFX.toUpperCase().replace(/_/g, ' ')}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-zinc-500 block">SPINE WIDTH</span>
              <span className="text-zinc-200 font-semibold">{project.jacket.spineWidthMm} mm</span>
              <p className="text-[10px] text-zinc-500 pt-1">
                Text: {project.jacket.spineText || `${project.jacket.artistName} - ${project.jacket.albumTitle}`}
              </p>
            </div>

            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-zinc-500 block">INNER SLEEVE</span>
              <span className="text-zinc-200 font-semibold">
                {project.innerSleeve.type.toUpperCase().replace(/_/g, ' ')}
              </span>
              <p className="text-[10px] text-zinc-500 pt-1">
                Die-cut hole: {project.innerSleeve.hasDieCutHole ? 'YES (100mm)' : 'NO'}
              </p>
            </div>

            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-zinc-500 block">OBI STRIP</span>
              <span className="text-zinc-200 font-semibold">
                {project.obi.enabled ? `YES (${project.obi.widthMm}mm / ${project.obi.position.toUpperCase()})` : 'DISABLED'}
              </span>
              {project.obi.enabled && (
                <p className="text-[10px] text-zinc-500 pt-1">
                  Code: {project.obi.releaseCode} • Price: {project.obi.priceJpy}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Tracklist Master Cue Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-300">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>3. Audio Cue Sheet & Track Allocations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Side A */}
            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-200">SIDE A TRACKLIST</span>
                <span className="text-[10px] font-mono text-zinc-500">MAX 22 MIN</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {project.vinyl.sideALabel.tracks.map((t, i) => (
                  <div key={t.id || i} className="flex justify-between text-zinc-400">
                    <span>
                      <strong className="text-zinc-300">{t.number}.</strong> {t.title}
                    </span>
                    <span className="text-zinc-500">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side B */}
            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-xs font-mono font-bold text-zinc-200">SIDE B TRACKLIST</span>
                <span className="text-[10px] font-mono text-zinc-500">MAX 22 MIN</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {project.vinyl.sideBLabel.tracks.map((t, i) => (
                  <div key={t.id || i} className="flex justify-between text-zinc-400">
                    <span>
                      <strong className="text-zinc-300">{t.number}.</strong> {t.title}
                    </span>
                    <span className="text-zinc-500">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
