import React from 'react';
import { 
  FolderKanban, 
  Settings, 
  ChevronRight,
  Plus
} from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'projects' | 'settings' | 'editor';
  setCurrentView: (view: 'dashboard' | 'projects' | 'settings' | 'editor') => void;
  activeProjectTitle?: string | null;
  onNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  activeProjectTitle,
  onNewProject,
}) => {
  return (
    <aside id="app-left-sidebar" className="w-52 bg-[#EDE5D8] border-r border-[#E0D4C3] flex flex-col justify-between shrink-0 select-none text-xs font-sans">
      <div>
        {/* Brand Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-[#E0D4C3]">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 text-[#2E2623] hover:text-[#C85A32] transition font-semibold tracking-tight text-sm"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#C85A32]" />
            <span>Studio</span>
          </button>

          <button
            onClick={onNewProject}
            title="New Project"
            className="p-1 rounded hover:bg-[#E0D4C3] text-[#786B62] hover:text-[#2E2623] transition"
          >
            <Plus className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Workspace Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#786B62]">
            Workspace
          </div>

          <button
            id="nav-projects-btn"
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentView === 'dashboard' || currentView === 'projects'
                ? 'bg-[#E0D4C3] text-[#2E2623] font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 stroke-[1.5] text-[#786B62]" />
            <span>Projects</span>
          </button>
        </div>

        {/* Active Project Quick Link */}
        {activeProjectTitle && (
          <div className="px-3 py-2 mx-3 my-2 rounded-md bg-[#FAF6EE] border border-[#E0D4C3] shadow-xs space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#786B62] block">
              Active Project
            </span>
            <button
              onClick={() => setCurrentView('editor')}
              className="text-xs text-[#2E2623] font-medium hover:text-[#C85A32] truncate w-full text-left flex items-center justify-between"
            >
              <span className="truncate">{activeProjectTitle}</span>
              <ChevronRight className="w-3 h-3 text-[#786B62] shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-[#E0D4C3] space-y-1">
        <button
          id="nav-settings-btn"
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === 'settings'
              ? 'bg-[#E0D4C3] text-[#2E2623] font-semibold'
              : 'text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5 stroke-[1.5] text-[#786B62]" />
          <span>Settings</span>
        </button>

        <div className="pt-2 px-3 flex items-center justify-between text-[#786B62] text-[11px] font-mono">
          <span>Studio v2.4</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
        </div>
      </div>
    </aside>
  );
};

