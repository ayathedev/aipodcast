import React from 'react';
import { PodcastProject } from '../../types';
import { 
  Play, 
  Square, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Sparkles, 
  Download, 
  Save, 
  Loader2, 
  Check, 
  Radio, 
  Sliders, 
  Zap,
  Volume2
} from 'lucide-react';

interface AdobeTopBarProps {
  project: PodcastProject;
  currentTimeSec: number;
  totalTimeSec: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onScrub: (timeSec: number) => void;
  onRenderAudio: () => void;
  onExport: () => void;
  onSave: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  onAiGenerate: () => void;
  isAiGenerating: boolean;
  activeWorkspacePreset: string;
  setActiveWorkspacePreset: (preset: string) => void;
  onToggleMode: (mode: 'creator' | 'generative') => void;
}

export function formatAdobeTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30); // 30 fps frame count
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

export const AdobeTopBar: React.FC<AdobeTopBarProps> = ({
  project,
  currentTimeSec,
  totalTimeSec,
  isPlaying,
  onTogglePlay,
  onScrub,
  onRenderAudio,
  onExport,
  onSave,
  isSaving,
  saveSuccess,
  aiPrompt,
  setAiPrompt,
  onAiGenerate,
  isAiGenerating,
  activeWorkspacePreset,
  setActiveWorkspacePreset,
  onToggleMode,
}) => {
  const formattedTime = formatAdobeTimecode(currentTimeSec);
  const formattedTotal = formatAdobeTimecode(totalTimeSec);

  return (
    <div className="flex flex-col bg-[#1E1E1E] border-b border-[#3B3B3B] text-[#CCCCCC] font-sans text-[11px] select-none shrink-0">
      {/* 1. Desktop Application Menu Bar */}
      <div className="h-7 bg-[#252525] border-b border-[#3B3B3B] px-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 font-semibold text-[#00A8C6] tracking-wider text-[11px] uppercase">
            <Radio className="w-3.5 h-3.5" />
            <span>Adobe Audition / Premiere Pro Studio</span>
          </div>

          <div className="h-3 w-[1px] bg-[#3B3B3B]" />

          {/* Standard Adobe Menus */}
          <div className="flex items-center space-x-3 text-[#B0B0B0]">
            <button className="hover:text-white transition py-0.5">File</button>
            <button className="hover:text-white transition py-0.5">Edit</button>
            <button className="hover:text-white transition py-0.5">Script</button>
            <button className="hover:text-white transition py-0.5">Clip</button>
            <button className="hover:text-white transition py-0.5">Audio</button>
            <button className="hover:text-white transition py-0.5">Window</button>
            <button className="hover:text-white transition py-0.5">Help</button>
          </div>
        </div>

        {/* Right Presets & Status */}
        <div className="flex items-center space-x-3 text-[10px]">
          {/* Workspace Presets */}
          <div className="flex items-center space-x-1 bg-[#1E1E1E] p-0.5 border border-[#3B3B3B] rounded-[2px]">
            <span className="text-[#888888] px-1 font-mono uppercase text-[9px]">Workspace:</span>
            {['Podcasting DAW', 'Multi-track', 'Screenplay'].map((preset) => (
              <button
                key={preset}
                onClick={() => setActiveWorkspacePreset(preset)}
                className={`px-2 py-0.5 rounded-[2px] transition ${
                  activeWorkspacePreset === preset
                    ? 'bg-[#264F78] text-white font-medium'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-[#2D2D2D]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 bg-[#1E1E1E] p-0.5 border border-[#3B3B3B] rounded-[2px]">
            <button
              onClick={() => onToggleMode('creator')}
              className={`px-2 py-0.5 rounded-[2px] flex items-center space-x-1 transition ${
                project.mode === 'creator'
                  ? 'bg-[#264F78] text-white font-medium'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>Manual</span>
            </button>
            <button
              onClick={() => onToggleMode('generative')}
              className={`px-2 py-0.5 rounded-[2px] flex items-center space-x-1 transition ${
                project.mode === 'generative'
                  ? 'bg-[#264F78] text-white font-medium'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Generative</span>
            </button>
          </div>

          {/* Quick Save */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-2 py-0.5 bg-[#2A2A2A] hover:bg-[#333333] border border-[#3B3B3B] text-[#E0E0E0] rounded-[2px] flex items-center space-x-1 transition"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#00A8C6]" />
            ) : saveSuccess ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Save className="w-3 h-3 text-[#A0A0A0]" />
            )}
            <span>{saveSuccess ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* 2. Master Transport Control Bar */}
      <div className="h-11 bg-[#222222] px-3 flex items-center justify-between gap-4 border-b border-[#3B3B3B]">
        {/* Left: Digital LCD Timecode Display */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-[#0D0D0D] border border-[#3B3B3B] px-3 py-1 rounded-[2px] flex items-baseline space-x-2 font-mono shadow-inner">
            <div className="text-[9px] uppercase tracking-wider text-[#666666] font-bold">TC</div>
            <div className="text-sm font-bold text-[#00A8C6] tracking-widest leading-none drop-shadow-[0_0_2px_rgba(0,168,198,0.5)]">
              {formattedTime}
            </div>
            <div className="text-[10px] text-[#555555]">/ {formattedTotal}</div>
          </div>

          {/* Transport Buttons */}
          <div className="flex items-center space-x-1 bg-[#1A1A1A] p-1 border border-[#3B3B3B] rounded-[2px]">
            <button
              onClick={() => onScrub(0)}
              title="Jump to Start (Home)"
              className="p-1 hover:bg-[#323232] text-[#AAAAAA] hover:text-white rounded-[2px] transition"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`px-3 py-1 rounded-[2px] font-medium flex items-center space-x-1.5 transition ${
                isPlaying
                  ? 'bg-[#A82B2B] text-white hover:bg-[#C03232]'
                  : 'bg-[#264F78] text-white hover:bg-[#2F5D8E]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            <button
              onClick={() => onScrub(totalTimeSec)}
              title="Jump to End (End)"
              className="p-1 hover:bg-[#323232] text-[#AAAAAA] hover:text-white rounded-[2px] transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onScrub(0)}
              title="Loop Mode"
              className="p-1 hover:bg-[#323232] text-[#00A8C6] rounded-[2px] transition ml-1"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center: Master Scrub Bar & Playhead Position Slider */}
        <div className="flex-1 max-w-md flex flex-col justify-center space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-[#888888]">
            <span>Master Scrub</span>
            <span>{Math.round((currentTimeSec / Math.max(1, totalTimeSec)) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, totalTimeSec)}
            step={0.1}
            value={currentTimeSec}
            onChange={(e) => onScrub(parseFloat(e.target.value))}
            className="w-full accent-[#00A8C6] bg-[#141414] h-1.5 rounded-[2px] cursor-pointer"
          />
        </div>

        {/* Master Stereo Decibel VU Meter */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#121212] p-1.5 border border-[#3B3B3B] rounded-[2px] shrink-0">
          <Volume2 className="w-3 h-3 text-[#777777]" />
          <div className="flex flex-col space-y-1">
            {/* L Channel */}
            <div className="flex items-center space-x-1">
              <span className="text-[8px] font-mono text-[#555555]">L</span>
              <div className="w-24 h-1.5 bg-[#1A1A1A] rounded-[1px] flex overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transition-all duration-75"
                  style={{ width: isPlaying ? '72%' : '10%' }}
                />
              </div>
            </div>
            {/* R Channel */}
            <div className="flex items-center space-x-1">
              <span className="text-[8px] font-mono text-[#555555]">R</span>
              <div className="w-24 h-1.5 bg-[#1A1A1A] rounded-[1px] flex overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transition-all duration-75"
                  style={{ width: isPlaying ? '68%' : '10%' }}
                />
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#777777]">-12dB</span>
        </div>

        {/* Right: AI Assistant Input & Render Mixdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative flex items-center w-56">
            <Sparkles className="w-3 h-3 text-[#00A8C6] absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAiGenerate()}
              placeholder="AI Script Assist..."
              className="w-full bg-[#121212] text-[#E0E0E0] text-[11px] pl-7 pr-12 py-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6] placeholder:text-[#555555]"
            />
            <button
              onClick={onAiGenerate}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="absolute right-0.5 px-1.5 py-0.5 bg-[#264F78] hover:bg-[#2F5D8E] text-white font-medium text-[9px] rounded-[2px] transition disabled:opacity-30"
            >
              {isAiGenerating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Run'}
            </button>
          </div>

          <button
            onClick={onRenderAudio}
            className="px-2.5 py-1 bg-[#264F78] hover:bg-[#2F5D8E] text-white font-medium text-[11px] rounded-[2px] border border-[#3B3B3B] transition flex items-center space-x-1"
          >
            <span>Render Audio</span>
          </button>

          <button
            onClick={onExport}
            className="px-2.5 py-1 bg-[#2A2A2A] hover:bg-[#333333] text-[#E0E0E0] border border-[#3B3B3B] rounded-[2px] transition flex items-center space-x-1"
          >
            <Download className="w-3 h-3 text-[#AAAAAA]" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
