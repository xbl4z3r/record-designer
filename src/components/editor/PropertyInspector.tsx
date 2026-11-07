import React from 'react';
import { ProjectData, VinylSize, VinylWeight, VinylColorStyle, JacketType, CardstockType, FinishType, SpecialFX } from '../../types';
import { PRESET_PROJECTS } from '../../presets';
import {
  Sliders,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface PropertyInspectorProps {
  project: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
  onLoadPreset: (presetKey: string) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  project,
  onUpdateProject,
  onLoadPreset,
}) => {
  const [activeTab, setActiveTab] = React.useState<'release' | 'vinyl' | 'jacket' | 'inner' | 'label' | 'obi'>('release');

  const updateVinyl = (partial: Partial<ProjectData['vinyl']>) => {
    onUpdateProject((prev) => ({
      ...prev,
      vinyl: { ...prev.vinyl, ...partial },
    }));
  };

  const updateJacket = (partial: Partial<ProjectData['jacket']>) => {
    onUpdateProject((prev) => ({
      ...prev,
      jacket: { ...prev.jacket, ...partial },
    }));
  };

  const updateInner = (partial: Partial<ProjectData['innerSleeve']>) => {
    onUpdateProject((prev) => ({
      ...prev,
      innerSleeve: { ...prev.innerSleeve, ...partial },
    }));
  };

  const updateObi = (partial: Partial<ProjectData['obi']>) => {
    onUpdateProject((prev) => ({
      ...prev,
      obi: { ...prev.obi, ...partial },
    }));
  };

  const handleAddTrack = (side: 'A' | 'B') => {
    onUpdateProject((prev) => {
      const targetLabel = side === 'A' ? prev.vinyl.sideALabel : prev.vinyl.sideBLabel;
      const count = targetLabel.tracks.length + 1;
      const newTrack = {
        id: String(Date.now()),
        number: count < 10 ? `0${count}` : `${count}`,
        title: `Track ${count}`,
        duration: '3:30',
      };
      return {
        ...prev,
        vinyl: {
          ...prev.vinyl,
          [side === 'A' ? 'sideALabel' : 'sideBLabel']: {
            ...targetLabel,
            tracks: [...targetLabel.tracks, newTrack],
          },
        },
      };
    });
  };

  const handleRemoveTrack = (side: 'A' | 'B', index: number) => {
    onUpdateProject((prev) => {
      const targetLabel = side === 'A' ? prev.vinyl.sideALabel : prev.vinyl.sideBLabel;
      return {
        ...prev,
        vinyl: {
          ...prev.vinyl,
          [side === 'A' ? 'sideALabel' : 'sideBLabel']: {
            ...targetLabel,
            tracks: targetLabel.tracks.filter((_, i) => i !== index),
          },
        },
      };
    });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone: (dataUrl: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onDone(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside className="w-full sm:w-80 absolute sm:relative right-0 top-0 bottom-0 z-30 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col select-none overflow-hidden shadow-2xl sm:shadow-none">
      {/* Top Inspector Header */}
      <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-200">INSPECTOR</span>
        </div>

        {/* Preset Selector */}
        <select
          onChange={(e) => onLoadPreset(e.target.value)}
          defaultValue=""
          className="bg-zinc-950 text-zinc-300 text-[11px] font-mono border border-zinc-800 rounded px-2 py-1 outline-none focus:border-rose-500"
        >
          <option value="" disabled>Load Preset...</option>
          {Object.entries(PRESET_PROJECTS).map(([key, p]) => (
            <option key={key} value={key}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950/60 p-1 gap-1 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('release')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'release' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Release
        </button>
        <button
          onClick={() => setActiveTab('vinyl')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'vinyl' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Disc
        </button>
        <button
          onClick={() => setActiveTab('jacket')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'jacket' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Sleeve
        </button>
        <button
          onClick={() => setActiveTab('inner')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'inner' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Inner
        </button>
        <button
          onClick={() => setActiveTab('label')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'label' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Labels
        </button>
        <button
          onClick={() => setActiveTab('obi')}
          className={`flex-1 py-1 rounded transition-colors text-center ${
            activeTab === 'obi' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Obi
        </button>
      </div>

      {/* Scrollable Properties Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* TAB 1: RELEASE INFO */}
        {activeTab === 'release' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Album / Release Title</label>
              <input
                type="text"
                value={project.jacket.albumTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  updateJacket({ albumTitle: val });
                  onUpdateProject((p) => ({
                    ...p,
                    vinyl: {
                      ...p.vinyl,
                      sideALabel: { ...p.vinyl.sideALabel, title: val },
                      sideBLabel: { ...p.vinyl.sideBLabel, title: val },
                    },
                  }));
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-rose-500 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Artist / Band Name</label>
              <input
                type="text"
                value={project.jacket.artistName}
                onChange={(e) => {
                  const val = e.target.value;
                  updateJacket({ artistName: val });
                  onUpdateProject((p) => ({
                    ...p,
                    vinyl: {
                      ...p.vinyl,
                      sideALabel: { ...p.vinyl.sideALabel, artist: val },
                      sideBLabel: { ...p.vinyl.sideBLabel, artist: val },
                    },
                  }));
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-rose-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Catalog Number</label>
                <input
                  type="text"
                  value={project.jacket.catalogNumber}
                  onChange={(e) => updateJacket({ catalogNumber: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 font-mono text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Barcode (UPC/EAN)</label>
                <input
                  type="text"
                  value={project.jacket.barcode}
                  onChange={(e) => updateJacket({ barcode: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 font-mono text-xs outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Spine Title Text</label>
              <input
                type="text"
                value={project.jacket.spineText}
                onChange={(e) => updateJacket({ spineText: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono text-xs outline-none focus:border-rose-500"
              />
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={project.jacket.parentalAdvisory}
                onChange={(e) => updateJacket({ parentalAdvisory: e.target.checked })}
                className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
              />
              <span className="text-zinc-300 font-mono text-[11px]">Include Parental Advisory Badge</span>
            </label>
          </div>
        )}

        {/* TAB 2: VINYL DISC SPECS */}
        {activeTab === 'vinyl' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 text-center font-mono text-[11px]">
              {(['12inch', '10inch', '7inch'] as VinylSize[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => updateVinyl({ size: sz })}
                  className={`py-1 rounded ${
                    project.vinyl.size === sz ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {sz.replace('inch', '″')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Weight Profile</label>
                <select
                  value={project.vinyl.weight}
                  onChange={(e) => updateVinyl({ weight: e.target.value as VinylWeight })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value="140g">140g Standard</option>
                  <option value="180g">180g Audiophile</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Center Spindle Hole</label>
                <select
                  value={project.vinyl.holeType}
                  onChange={(e) => updateVinyl({ holeType: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value="standard_small">7.2mm Small</option>
                  <option value="dinked_large">38mm Dinked (45)</option>
                </select>
              </div>
            </div>

            {/* Quick Colorway Presets */}
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block mb-1.5 uppercase">Quick Colorways</span>
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'standard_black', primaryColor: '#121214' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Black
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'transparent', primaryColor: '#ffffff', transparency: 0.9 })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'solid', primaryColor: '#b91c1c' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Cherry
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'splatter', primaryColor: '#f8fafc', splatterColor: '#ec4899', splatterColor2: '#6366f1', splatterDensity: 56 })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Nebula
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'glow_in_the_dark', primaryColor: '#16a34a', glowColor: '#22c55e' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Glow
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'tri_color_split', primaryColor: '#ef4444', secondaryColor: '#ffffff', splatterColor: '#3b82f6' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Tri-Color
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'color_in_color', primaryColor: '#0284c7', secondaryColor: '#f43f5e' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Rim Blob
                </button>
                <button
                  type="button"
                  onClick={() => updateVinyl({ colorStyle: 'liquid_glitter', primaryColor: '#18181b' })}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                >
                  Glitter
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Color Effect / Material</label>
              <select
                value={project.vinyl.colorStyle}
                onChange={(e) => updateVinyl({ colorStyle: e.target.value as VinylColorStyle })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
              >
                <option value="standard_black">Standard Black Audiophile</option>
                <option value="solid">Solid Custom Color</option>
                <option value="transparent">Translucent / Clear Crystal Vinyl</option>
                <option value="splatter">Multi-Color Splatter Droplets</option>
                <option value="color_in_color">Color-in-Color Rim Effect</option>
                <option value="half_and_half">Half & Half Split (2-tone)</option>
                <option value="tri_color_split">Tri-Color Split (3-pie slice)</option>
                <option value="marble">Marble / Smoke Swirl Effect</option>
                <option value="glow_in_the_dark">Phosphorescent Glow in the Dark</option>
                <option value="liquid_glitter">Liquid Metallic Mica Glitter</option>
                <option value="picture_disc">Full Picture Disc (Double-Sided)</option>
              </select>
            </div>

            {/* Color Pickers */}
            <div className="space-y-2 pt-1 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Primary Vinyl Tone</span>
                <input
                  type="color"
                  value={project.vinyl.primaryColor}
                  onChange={(e) => updateVinyl({ primaryColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>

              {project.vinyl.colorStyle !== 'standard_black' && project.vinyl.colorStyle !== 'solid' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Secondary Accent Tone</span>
                  <input
                    type="color"
                    value={project.vinyl.secondaryColor}
                    onChange={(e) => updateVinyl({ secondaryColor: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                </div>
              )}

              {(project.vinyl.colorStyle === 'splatter' || project.vinyl.finishEffect === 'splatter') && (
                <>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Splatter Tones</span>
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-zinc-950 rounded border border-zinc-800 text-center text-[10px] font-mono">
                      {([1, 2, 3] as const).map((count) => {
                        const activeCount = project.vinyl.splatterToneCount || (project.vinyl.splatterColor3 ? 3 : project.vinyl.splatterColor2 ? 2 : 1);
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              updateVinyl({
                                splatterToneCount: count,
                                splatterColor1: project.vinyl.splatterColor1 || project.vinyl.splatterColor || '#ec4899',
                                splatterColor2: project.vinyl.splatterColor2 || '#6366f1',
                                splatterColor3: project.vinyl.splatterColor3 || '#38bdf8',
                              });
                            }}
                            className={`py-1 rounded transition-colors ${
                              activeCount === count ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {count}-Tone
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400">Splatter Color 1</span>
                    <input
                      type="color"
                      value={project.vinyl.splatterColor1 || project.vinyl.splatterColor || '#ec4899'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateVinyl({ splatterColor: val, splatterColor1: val });
                      }}
                      className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                    />
                  </div>

                  {((project.vinyl.splatterToneCount || 1) >= 2 || project.vinyl.splatterColor2) && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">Splatter Color 2</span>
                      <input
                        type="color"
                        value={project.vinyl.splatterColor2 || '#6366f1'}
                        onChange={(e) => updateVinyl({ splatterColor2: e.target.value, splatterToneCount: Math.max(2, project.vinyl.splatterToneCount || 2) as any })}
                        className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  )}

                  {(project.vinyl.splatterToneCount === 3 || project.vinyl.splatterColor3) && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">Splatter Color 3</span>
                      <input
                        type="color"
                        value={project.vinyl.splatterColor3 || '#38bdf8'}
                        onChange={(e) => updateVinyl({ splatterColor3: e.target.value, splatterToneCount: 3 })}
                        className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>SPLATTER DENSITY</span>
                      <span>{project.vinyl.splatterDensity || 44} bursts</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="96"
                      step="4"
                      value={project.vinyl.splatterDensity || 44}
                      onChange={(e) => updateVinyl({ splatterDensity: parseInt(e.target.value) })}
                      className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span>RADIAL BURST SPREAD</span>
                      <span>{Math.round((project.vinyl.splatterSpread || 1.15) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={project.vinyl.splatterSpread || 1.15}
                      onChange={(e) => updateVinyl({ splatterSpread: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </>
              )}

              {project.vinyl.colorStyle === 'glow_in_the_dark' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Glow Hue</span>
                  <input
                    type="color"
                    value={project.vinyl.glowColor || '#22c55e'}
                    onChange={(e) => updateVinyl({ glowColor: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                </div>
              )}

              {project.vinyl.colorStyle === 'transparent' && (
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span>TRANSPARENCY</span>
                    <span>{Math.round((project.vinyl.transparency || 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={project.vinyl.transparency || 0.8}
                    onChange={(e) => updateVinyl({ transparency: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              {project.vinyl.colorStyle === 'picture_disc' && (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Picture Disc Side A Graphic</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>{project.vinyl.pictureDiscImage ? 'Replace Side A Art' : 'Upload Side A Art'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (data) => updateVinyl({ pictureDiscImage: data }))}
                          className="hidden"
                        />
                      </label>
                      {project.vinyl.pictureDiscImage && (
                        <button
                          onClick={() => updateVinyl({ pictureDiscImage: null })}
                          className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                          title="Remove graphic"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Picture Disc Side B Graphic</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>{project.vinyl.pictureDiscBackImage ? 'Replace Side B Art' : 'Upload Side B Art'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (data) => updateVinyl({ pictureDiscBackImage: data }))}
                          className="hidden"
                        />
                      </label>
                      {project.vinyl.pictureDiscBackImage && (
                        <button
                          onClick={() => updateVinyl({ pictureDiscBackImage: null })}
                          className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                          title="Remove graphic"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Concentric visual audio tracks */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>CONCENTRIC AUDIO BANDS</span>
                <span>{project.vinyl.trackBandsCount} tracks</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={project.vinyl.trackBandsCount}
                onChange={(e) => updateVinyl({ trackBandsCount: parseInt(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Runout Dead-Wax Matrix Etchings */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Dead Wax Matrix Etching</span>
              <div>
                <label className="text-[10px] font-mono text-zinc-600 block">Side A Matrix Text</label>
                <input
                  type="text"
                  value={project.vinyl.matrixTextSideA}
                  onChange={(e) => updateVinyl({ matrixTextSideA: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-[11px] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-600 block">Side B Matrix Text</label>
                <input
                  type="text"
                  value={project.vinyl.matrixTextSideB}
                  onChange={(e) => updateVinyl({ matrixTextSideB: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-[11px] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SLEEVE & PACKAGING */}
        {activeTab === 'jacket' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Jacket Packaging Type</label>
              <select
                value={project.jacket.type}
                onChange={(e) => updateJacket({ type: e.target.value as JacketType })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
              >
                <option value="single_pocket">Single Pocket LP Jacket (3mm spine)</option>
                <option value="gatefold">Deluxe Gatefold 2-Panel Spread (5.5mm spine)</option>
                <option value="disco_bag">Disco Bag / Cutout Aperture Sleeve</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Cardstock</label>
                <select
                  value={project.jacket.cardstock}
                  onChange={(e) => updateJacket({ cardstock: e.target.value as CardstockType })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value="standard_white">350gsm Standard</option>
                  <option value="reverse_board_matte">Reverse Board Matte</option>
                  <option value="heavyweight_kraft">Heavyweight Kraft</option>
                  <option value="metallic_silver">Metallic Silver Mirri</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Surface Finish</label>
                <select
                  value={project.jacket.finish}
                  onChange={(e) => updateJacket({ finish: e.target.value as FinishType })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value="matte">Matte Varnish</option>
                  <option value="gloss">High Gloss Lamination</option>
                  <option value="uncoated_matte">Uncoated Natural</option>
                  <option value="soft_touch">Velvet Soft-Touch</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Special Finishing FX</label>
              <select
                value={project.jacket.specialFX}
                onChange={(e) => updateJacket({ specialFX: e.target.value as SpecialFX })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
              >
                <option value="none">None (Standard CMYK)</option>
                <option value="gold_foil">Gold Foil Stamping</option>
                <option value="silver_foil">Silver Foil Stamping</option>
                <option value="spot_uv">Gloss Spot UV Varnish</option>
              </select>
            </div>

            {/* Colors */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Jacket Primary Background</span>
                <input
                  type="color"
                  value={project.jacket.bgColor}
                  onChange={(e) => updateJacket({ bgColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Jacket Accent Highlight</span>
                <input
                  type="color"
                  value={project.jacket.accentColor}
                  onChange={(e) => updateJacket({ accentColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* Custom Artwork Uploads */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Custom Artwork Files</span>

              {/* Front Artwork */}
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Front Cover Image</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                    <Upload className="w-3 h-3 text-rose-500" />
                    <span>{project.jacket.frontArtwork ? 'Replace Front Art' : 'Upload Front Art'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (data) => updateJacket({ frontArtwork: data }))}
                      className="hidden"
                    />
                  </label>
                  {project.jacket.frontArtwork && (
                    <button
                      onClick={() => updateJacket({ frontArtwork: null })}
                      className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                      title="Remove artwork"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Back Artwork */}
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Back Cover Image</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>{project.jacket.backArtwork ? 'Replace Back Art' : 'Upload Back Art'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (data) => updateJacket({ backArtwork: data }))}
                      className="hidden"
                    />
                  </label>
                  {project.jacket.backArtwork && (
                    <button
                      onClick={() => updateJacket({ backArtwork: null })}
                      className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                      title="Remove artwork"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Center cutout hole toggle */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={project.jacket.centerCutoutHole}
                onChange={(e) => updateJacket({ centerCutoutHole: e.target.checked })}
                className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
              />
              <span className="text-zinc-300 font-mono text-[11px]">Center Aperture Window (100mm)</span>
            </label>
          </div>
        )}

        {/* TAB: ANTI-STATIC INNER SLEEVE */}
        {activeTab === 'inner' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Anti-Static Sleeve Style</label>
              <select
                value={project.innerSleeve.type}
                onChange={(e) => updateInner({ type: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
              >
                <option value="anti_static_rice_paper">MoFi Archival Rice Paper (Frosted HDPE)</option>
                <option value="poly_lined_paper">Poly-Lined White Paper Sleeve</option>
                <option value="poly_lined_black">Poly-Lined Audiophile Black Paper</option>
                <option value="japanese_u_bottom">Nagaoka Japanese U-Bottom Clear HDPE</option>
                <option value="printed_heavyweight">Custom Printed 250gsm Heavyweight Bag</option>
                <option value="heavyweight_kraft">Unbleached Heavyweight Kraft Paper</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Corner Style</label>
                <select
                  value={project.innerSleeve.cornerStyle || 'square'}
                  onChange={(e) => updateInner({ cornerStyle: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value="square">Square Corners</option>
                  <option value="rounded">U-Bottom Rounded</option>
                  <option value="clipped">Clipped Slipcut Lip</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Center Window</label>
                <select
                  value={project.innerSleeve.dieCutDiameterMm || 100}
                  onChange={(e) => updateInner({ dieCutDiameterMm: parseInt(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 font-mono text-xs outline-none"
                >
                  <option value={100}>100mm Standard</option>
                  <option value={85}>85mm Compact</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={project.innerSleeve.hasDieCutHole !== false}
                onChange={(e) => updateInner({ hasDieCutHole: e.target.checked })}
                className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
              />
              <span className="text-zinc-300 font-mono text-[11px]">Die-Cut Center Aperture Hole</span>
            </label>

            {(project.innerSleeve.type === 'anti_static_rice_paper' || project.innerSleeve.type === 'japanese_u_bottom') && (
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>HDPE TRANSLUCENCY</span>
                  <span>{Math.round((project.innerSleeve.translucency ?? 0.85) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={project.innerSleeve.translucency ?? 0.85}
                  onChange={(e) => updateInner({ translucency: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Archival Imprint Text</label>
              <input
                type="text"
                value={project.innerSleeve.archivalPrintText || ''}
                onChange={(e) => updateInner({ archivalPrintText: e.target.value })}
                placeholder="ARCHIVAL MASTER SLEEVE • ANTI-STATIC"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span className="text-[11px] font-mono text-zinc-400">Paper / Base Tone</span>
              <input
                type="color"
                value={project.innerSleeve.backgroundColor || '#ffffff'}
                onChange={(e) => updateInner({ backgroundColor: e.target.value })}
                className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
              />
            </div>

            {/* Custom Artwork Uploads for Inner Bag */}
            <div className="space-y-3 pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Printed Inner Sleeve Art</span>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Front Artwork</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>{project.innerSleeve.frontArtwork ? 'Replace Front Art' : 'Upload Front Art'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (data) => updateInner({ frontArtwork: data }))}
                      className="hidden"
                    />
                  </label>
                  {project.innerSleeve.frontArtwork && (
                    <button
                      onClick={() => updateInner({ frontArtwork: null })}
                      className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                      title="Remove artwork"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Back Artwork</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>{project.innerSleeve.backArtwork ? 'Replace Back Art' : 'Upload Back Art'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (data) => updateInner({ backArtwork: data }))}
                      className="hidden"
                    />
                  </label>
                  {project.innerSleeve.backArtwork && (
                    <button
                      onClick={() => updateInner({ backArtwork: null })}
                      className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                      title="Remove artwork"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CENTER LABELS & TRACKS */}
        {activeTab === 'label' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Label Appearance</span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Label Background</span>
                <input
                  type="color"
                  value={project.vinyl.sideALabel.backgroundColor}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdateProject((p) => ({
                      ...p,
                      vinyl: {
                        ...p.vinyl,
                        sideALabel: { ...p.vinyl.sideALabel, backgroundColor: col },
                        sideBLabel: { ...p.vinyl.sideBLabel, backgroundColor: col },
                      },
                    }));
                  }}
                  className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Label Text Color</span>
                <input
                  type="color"
                  value={project.vinyl.sideALabel.textColor}
                  onChange={(e) => {
                    const col = e.target.value;
                    onUpdateProject((p) => ({
                      ...p,
                      vinyl: {
                        ...p.vinyl,
                        sideALabel: { ...p.vinyl.sideALabel, textColor: col },
                        sideBLabel: { ...p.vinyl.sideBLabel, textColor: col },
                      },
                    }));
                  }}
                  className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>

              {/* Custom Label Artwork */}
              <div className="pt-2">
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Center Label Artwork Image</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer text-[11px] font-mono transition-colors">
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>{project.vinyl.sideALabel.artworkImage ? 'Replace Label Art' : 'Upload Label Art'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, (data) =>
                          onUpdateProject((p) => ({
                            ...p,
                            vinyl: {
                              ...p.vinyl,
                              sideALabel: { ...p.vinyl.sideALabel, artworkImage: data },
                              sideBLabel: { ...p.vinyl.sideBLabel, artworkImage: data },
                            },
                          }))
                        )
                      }
                      className="hidden"
                    />
                  </label>
                  {project.vinyl.sideALabel.artworkImage && (
                    <button
                      onClick={() =>
                        onUpdateProject((p) => ({
                          ...p,
                          vinyl: {
                            ...p.vinyl,
                            sideALabel: { ...p.vinyl.sideALabel, artworkImage: null },
                            sideBLabel: { ...p.vinyl.sideBLabel, artworkImage: null },
                          },
                        }))
                      }
                      className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400"
                      title="Remove label artwork"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Side A Tracks */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Side A Tracklist</span>
                <button
                  onClick={() => handleAddTrack('A')}
                  className="flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {project.vinyl.sideALabel.tracks.map((track, i) => (
                  <div key={track.id} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={track.number}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideALabel.tracks];
                          tracks[i] = { ...tracks[i], number: val };
                          return { ...p, vinyl: { ...p.vinyl, sideALabel: { ...p.vinyl.sideALabel, tracks } } };
                        });
                      }}
                      className="w-8 bg-zinc-950 border border-zinc-800 rounded px-1 py-1 font-mono text-zinc-300 text-[10px]"
                    />
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideALabel.tracks];
                          tracks[i] = { ...tracks[i], title: val };
                          return { ...p, vinyl: { ...p.vinyl, sideALabel: { ...p.vinyl.sideALabel, tracks } } };
                        });
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-sans text-zinc-200 text-xs"
                    />
                    <input
                      type="text"
                      value={track.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideALabel.tracks];
                          tracks[i] = { ...tracks[i], duration: val };
                          return { ...p, vinyl: { ...p.vinyl, sideALabel: { ...p.vinyl.sideALabel, tracks } } };
                        });
                      }}
                      className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1 py-1 font-mono text-zinc-400 text-[10px]"
                    />
                    <button
                      onClick={() => handleRemoveTrack('A', i)}
                      className="p-1 text-zinc-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Side B Tracks */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Side B Tracklist</span>
                <button
                  onClick={() => handleAddTrack('B')}
                  className="flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {project.vinyl.sideBLabel.tracks.map((track, i) => (
                  <div key={track.id} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={track.number}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideBLabel.tracks];
                          tracks[i] = { ...tracks[i], number: val };
                          return { ...p, vinyl: { ...p.vinyl, sideBLabel: { ...p.vinyl.sideBLabel, tracks } } };
                        });
                      }}
                      className="w-8 bg-zinc-950 border border-zinc-800 rounded px-1 py-1 font-mono text-zinc-300 text-[10px]"
                    />
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideBLabel.tracks];
                          tracks[i] = { ...tracks[i], title: val };
                          return { ...p, vinyl: { ...p.vinyl, sideBLabel: { ...p.vinyl.sideBLabel, tracks } } };
                        });
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-sans text-zinc-200 text-xs"
                    />
                    <input
                      type="text"
                      value={track.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateProject((p) => {
                          const tracks = [...p.vinyl.sideBLabel.tracks];
                          tracks[i] = { ...tracks[i], duration: val };
                          return { ...p, vinyl: { ...p.vinyl, sideBLabel: { ...p.vinyl.sideBLabel, tracks } } };
                        });
                      }}
                      className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1 py-1 font-mono text-zinc-400 text-[10px]"
                    />
                    <button
                      onClick={() => handleRemoveTrack('B', i)}
                      className="p-1 text-zinc-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OBI STRIP */}
        {activeTab === 'obi' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-zinc-800">
              <input
                type="checkbox"
                checked={project.obi.enabled}
                onChange={(e) => updateObi({ enabled: e.target.checked })}
                className="rounded bg-zinc-950 border-zinc-700 text-rose-500 focus:ring-0"
              />
              <span className="text-zinc-200 font-mono text-xs font-semibold">Enable Japanese Obi Strip</span>
            </label>

            {project.obi.enabled && (
              <>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Japanese Title (邦題)</label>
                  <input
                    type="text"
                    value={project.obi.japaneseTitle}
                    onChange={(e) => updateObi({ japaneseTitle: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Katakana Artist (アーティスト名)</label>
                  <input
                    type="text"
                    value={project.obi.katakanaArtist}
                    onChange={(e) => updateObi({ katakanaArtist: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Price (JPY)</label>
                    <input
                      type="text"
                      value={project.obi.priceJpy}
                      onChange={(e) => updateObi({ priceJpy: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 font-mono text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Release Code</label>
                    <input
                      type="text"
                      value={project.obi.releaseCode}
                      onChange={(e) => updateObi({ releaseCode: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase">Obi Catchphrase</label>
                  <input
                    type="text"
                    value={project.obi.catchphrase}
                    onChange={(e) => updateObi({ catchphrase: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-400">Obi Color</span>
                  <input
                    type="color"
                    value={project.obi.backgroundColor}
                    onChange={(e) => updateObi({ backgroundColor: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
