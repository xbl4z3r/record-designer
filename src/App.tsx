import React, { useState, useEffect } from 'react';
import { ProjectData, ActiveWorkspaceView, ActiveDiecutComponent } from './types';
import { DEFAULT_PROJECT, PRESET_PROJECTS } from './presets';
import { StudioNavbar } from './components/ui/StudioNavbar';
import { StudioViewer } from './components/viewer/StudioViewer';
import { DiecutEditor } from './components/editor/DiecutEditor';
import { SpecsSheet } from './components/export/SpecsSheet';
import { PropertyInspector } from './components/editor/PropertyInspector';
import { ExportModal } from './components/export/ExportModal';
import { Sliders, PanelRightClose, PanelRightOpen } from 'lucide-react';

const STORAGE_KEY = 'groovestudio_project_data_v1';

export function App() {
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PROJECT;
  });

  const [activeView, setActiveView] = useState<ActiveWorkspaceView>('studio');
  const [activeComponent, setActiveComponent] = useState<ActiveDiecutComponent>('jacket_front');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // Auto-persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Storage quota or private mode catch
    }
  }, [project]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === '1') {
        setActiveView('studio');
      } else if (e.key === '2') {
        setActiveView('diecut');
      } else if (e.key === '3') {
        setActiveView('specs');
      } else if (e.key === 'e' || e.key === 'E') {
        setIsExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadPreset = (key: string) => {
    if (PRESET_PROJECTS[key]) {
      setProject(PRESET_PROJECTS[key]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Top Navbar */}
      <StudioNavbar
        project={project}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenExportModal={() => setIsExportOpen(true)}
        onLoadProject={(data) => setProject(data)}
      />

      {/* Main Workspace Area */}
      <div className="relative flex-1 flex flex-row overflow-hidden">
        {/* Central Viewport depending on active mode */}
        <main className="relative flex-1 h-full flex flex-col overflow-hidden">
          {activeView === 'studio' && (
            <StudioViewer
              project={project}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'diecut' && (
            <DiecutEditor
              project={project}
              activeComponent={activeComponent}
              onSelectComponent={setActiveComponent}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'specs' && (
            <SpecsSheet project={project} />
          )}

          {/* Floating Inspector Toggle Button (on smaller screens or collapsed) */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 shadow-lg transition-colors"
            title={showInspector ? 'Hide Inspector' : 'Show Inspector'}
          >
            {showInspector ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </main>

        {/* Right Property Inspector Panel */}
        {showInspector && (
          <PropertyInspector
            project={project}
            onUpdateProject={setProject}
            onLoadPreset={handleLoadPreset}
          />
        )}
      </div>

      {/* Export Production Assets Modal */}
      <ExportModal
        project={project}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

export default App;
