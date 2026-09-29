import React from 'react';
import { PodcastProject } from '../types';
import { 
  Download, 
  Sliders, 
  Zap, 
  User, 
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Pause,
  Sparkles,
  Mic,
  Image as ImageIcon
} from 'lucide-react';

interface HeaderProps {
  project: PodcastProject | null;
  currentView: string;
  onBackToDashboard: () => void;
  onExportProject: () => void;
  onToggleMode: (mode: 'creator' | 'generative') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onTogglePlayScript?: () => void;
  isPlayingScript?: boolean;
  onToggleAiBox?: () => void;
  isAiBoxOpen?: boolean;
  onOpenVoiceStudio?: () => void;
  onOpenCoverArt?: () => void;
  isSaving?: boolean;
  isAutoSaving?: boolean;
  saveSuccess?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  currentView,
  onBackToDashboard,
  onExportProject,
  onToggleMode,
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  onToggleSidebar,
  onTogglePlayScript,
  isPlayingScript,
  onToggleAiBox,
  isAiBoxOpen,
  onOpenVoiceStudio,
  onOpenCoverArt,
  isSaving,
  isAutoSaving,
  saveSuccess,
}) => {
  return (
    <header className="h-[44px] bg-[#EDE5D8] border-b border-[#E0D4C3] px-3.5 flex items-center justify-between shrink-0 select-none text-xs font-sans">
      {/* Left: Sidebar Toggle + Breadcrumb + Compact Mode Control */}
      <div className="flex items-center space-x-2.5 text-[#786B62]">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-1 rounded hover:bg-[#E0D4C3] text-[#786B62] hover:text-[#2E2623] transition"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 stroke-[1.5]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 stroke-[1.5]" />
            )}
          </button>
        )}

        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={onBackToDashboard}
            className="text-[#786B62] hover:text-[#2E2623] font-medium transition"
          >
            Podcast Studio
          </button>

          <ChevronRight className="w-3 h-3 text-[#A39587] stroke-[1.5]" />

          {project ? (
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#2E2623] max-w-[180px] truncate">
                {project.title}
              </span>
              {(isSaving || isAutoSaving) && (
                <div className="flex items-center space-x-1.5 transition-opacity duration-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C85A32] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C85A32]"></span>
                  </span>
                  <span className="text-[10px] text-[#A39587] font-medium">Saving</span>
                </div>
              )}
            </div>
          ) : (
            <span className="font-medium text-[#2E2623] capitalize">
              {currentView === 'dashboard' ? 'Projects' : currentView}
            </span>
          )}
        </div>

        {/* Segmented [Manual | Generative] Mode Switcher */}
        {project && (
          <div className="flex items-center space-x-0.5 bg-[#E0D4C3] p-0.5 rounded-md border border-[#D8CAB8] ml-1.5">
            <button
              id="toggle-creator-mode-btn"
              onClick={() => onToggleMode('creator')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium transition ${
                project.mode === 'creator'
                  ? 'bg-[#FAF6EE] text-[#2E2623] shadow-xs font-semibold'
                  : 'text-[#786B62] hover:text-[#2E2623]'
              }`}
            >
              <Sliders className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Manual</span>
            </button>

            <button
              id="toggle-generative-mode-btn"
              onClick={() => onToggleMode('generative')}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium transition ${
                project.mode === 'generative'
                  ? 'bg-[#FAF6EE] text-[#2E2623] shadow-xs font-semibold'
                  : 'text-[#786B62] hover:text-[#2E2623]'
              }`}
            >
              <Zap className="w-2.5 h-2.5 stroke-[1.5]" />
              <span>Generative</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: [Play Script] Primary, [AI Assist] Ghost, [Export] Button */}
      <div className="flex items-center space-x-2">
        {project && (
          <>
            {/* [Play Script] Primary Warm Rust Button */}
            {onTogglePlayScript && (
              <button
                onClick={onTogglePlayScript}
                className="px-3 py-1 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white font-medium text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                {isPlayingScript ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Play Script</span>
                  </>
                )}
              </button>
            )}

            {/* [Voice Studio] Button */}
            {onOpenVoiceStudio && (
              <button
                onClick={onOpenVoiceStudio}
                title="Open Studio Voice Presets & Audition Sandbox"
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF6EE] hover:bg-[#E0D4C3]/70 text-[#2E2623] border border-[#E0D4C3] transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Mic className="w-3 h-3 text-[#C85A32] stroke-[2]" />
                <span>Voice Studio</span>
              </button>
            )}

            {/* [Cover Art] Button */}
            {onOpenCoverArt && (
              <button
                onClick={onOpenCoverArt}
                title="Design Podcast Cover Art & Title Graphics"
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF6EE] hover:bg-[#E0D4C3]/70 text-[#2E2623] border border-[#E0D4C3] transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <ImageIcon className="w-3 h-3 text-[#C85A32] stroke-[2]" />
                <span>Cover Art</span>
              </button>
            )}

            {/* [AI Assist] Button */}
            {onToggleAiBox && (
              <button
                onClick={onToggleAiBox}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 border ${
                  isAiBoxOpen
                    ? 'bg-[#E0D4C3] text-[#2E2623] border-[#D8CAB8]'
                    : 'bg-[#FAF6EE] hover:bg-[#E0D4C3]/60 text-[#2E2623] border-[#E0D4C3]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#C85A32] stroke-[1.5]" />
                <span>AI Assist</span>
              </button>
            )}

            {/* [Export] Button */}
            <button
              id="header-export-btn"
              onClick={onExportProject}
              className="px-3 py-1 rounded-md bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] font-medium transition flex items-center space-x-1.5 text-xs shadow-xs"
            >
              <Download className="w-3 h-3 stroke-[1.5] text-[#786B62]" />
              <span>Export</span>
            </button>
          </>
        )}

        <div className="w-6 h-6 rounded-full bg-[#E0D4C3] border border-[#D8CAB8] flex items-center justify-center text-[#2E2623] font-medium text-[10px] ml-1">
          <User className="w-3.5 h-3.5 text-[#786B62] stroke-[1.5]" />
        </div>
      </div>
    </header>
  );
};


