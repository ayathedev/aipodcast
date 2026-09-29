import React, { useState } from 'react';
import { PodcastProject, Character } from '../../types';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Mic, 
  Music, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Volume2, 
  UserPlus, 
  Upload,
  Radio
} from 'lucide-react';
import { audioEngine } from '../../lib/audioEngine';

interface ProjectBinPanelProps {
  project: PodcastProject;
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onAddCharacter: () => void;
  onImportScript: (file: File) => void;
}

export const ProjectBinPanel: React.FC<ProjectBinPanelProps> = ({
  project,
  selectedCharacterId,
  onSelectCharacter,
  onAddCharacter,
  onImportScript,
}) => {
  const [activeTab, setActiveTab] = useState<'bin' | 'cast' | 'markers'>('bin');
  const [searchTerm, setSearchTerm] = useState('');

  // Folder collapse states
  const [isScriptFolderOpen, setIsScriptFolderOpen] = useState(true);
  const [isCastFolderOpen, setIsCastFolderOpen] = useState(true);
  const [isSfxFolderOpen, setIsSfxFolderOpen] = useState(true);
  const [isBgmFolderOpen, setIsBgmFolderOpen] = useState(true);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportScript(file);
      if (e.target) e.target.value = '';
    }
  };

  const handleTestSFX = (sfxName: string) => {
    audioEngine.playSFX(sfxName);
  };

  return (
    <aside className="w-64 bg-[#252525] border-r border-[#3B3B3B] flex flex-col h-full select-none text-[#CCCCCC] font-sans text-[11px] shrink-0">
      {/* Panel Title Bar */}
      <div className="h-7 bg-[#2D2D2D] border-b border-[#3B3B3B] px-3 flex items-center justify-between shrink-0">
        <div className="font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
          <Folder className="w-3.5 h-3.5 text-[#00A8C6]" />
          <span>Project Bin & Assets</span>
        </div>
        <span className="text-[9px] font-mono text-[#777777]">{project.script.length} Items</span>
      </div>

      {/* Tabs Bar */}
      <div className="h-6 bg-[#202020] border-b border-[#3B3B3B] flex items-center px-1 space-x-1 shrink-0">
        <button
          onClick={() => setActiveTab('bin')}
          className={`flex-1 py-0.5 text-center rounded-[2px] transition ${
            activeTab === 'bin'
              ? 'bg-[#264F78] text-white font-medium'
              : 'text-[#999999] hover:text-white'
          }`}
        >
          Assets Bin
        </button>
        <button
          onClick={() => setActiveTab('cast')}
          className={`flex-1 py-0.5 text-center rounded-[2px] transition ${
            activeTab === 'cast'
              ? 'bg-[#264F78] text-white font-medium'
              : 'text-[#999999] hover:text-white'
          }`}
        >
          Cast ({project.characters.length})
        </button>
        <button
          onClick={() => setActiveTab('markers')}
          className={`flex-1 py-0.5 text-center rounded-[2px] transition ${
            activeTab === 'markers'
              ? 'bg-[#264F78] text-white font-medium'
              : 'text-[#999999] hover:text-white'
          }`}
        >
          SFX Cues
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="p-1.5 bg-[#222222] border-b border-[#3B3B3B] shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-[#666666] absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search project assets..."
            className="w-full bg-[#1A1A1A] text-[#CCCCCC] text-[10px] pl-6 pr-2 py-0.5 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6] placeholder:text-[#555555]"
          />
        </div>
      </div>

      {/* Asset Tree View Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px]">
        {activeTab === 'bin' || activeTab === 'cast' ? (
          <>
            {/* 1. SCRIPT FILES FOLDER */}
            <div className="space-y-0.5">
              <button
                onClick={() => setIsScriptFolderOpen(!isScriptFolderOpen)}
                className="w-full flex items-center space-x-1 px-1 py-0.5 hover:bg-[#333333] rounded-[2px] text-[#DDDDDD] font-medium transition"
              >
                {isScriptFolderOpen ? (
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#888888]" />
                )}
                {isScriptFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#00A8C6]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#00A8C6]" />
                )}
                <span className="truncate">Script Sequences</span>
              </button>

              {isScriptFolderOpen && (
                <div className="ml-4 pl-2 border-l border-[#3D3D3D] space-y-0.5">
                  <div className="flex items-center justify-between px-1.5 py-1 bg-[#1E1E1E] border border-[#333333] rounded-[2px] hover:border-[#00A8C6] cursor-pointer transition">
                    <div className="flex items-center space-x-1.5 truncate">
                      <FileText className="w-3 h-3 text-[#00A8C6] shrink-0" />
                      <span className="text-[#E0E0E0] truncate font-sans text-[11px]">
                        {project.title.toLowerCase().replace(/\s+/g, '_')}_script.fountain
                      </span>
                    </div>
                    <span className="text-[9px] text-[#777777] font-mono shrink-0">
                      {project.script.length} lines
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CAST CHANNELS FOLDER */}
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => setIsCastFolderOpen(!isCastFolderOpen)}
                className="w-full flex items-center space-x-1 px-1 py-0.5 hover:bg-[#333333] rounded-[2px] text-[#DDDDDD] font-medium transition"
              >
                {isCastFolderOpen ? (
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#888888]" />
                )}
                {isCastFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#00A8C6]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#00A8C6]" />
                )}
                <span className="truncate">Voice Cast Channels</span>
              </button>

              {isCastFolderOpen && (
                <div className="ml-4 pl-2 border-l border-[#3D3D3D] space-y-0.5">
                  {project.characters.map((c, index) => {
                    const isSelected = selectedCharacterId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => onSelectCharacter(c.id)}
                        className={`flex items-center justify-between px-1.5 py-1 rounded-[2px] border cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#264F78] border-[#00A8C6] text-white font-medium'
                            : 'bg-[#1E1E1E] border-[#333333] text-[#CCCCCC] hover:border-[#555555]'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate min-w-0">
                          <Mic className="w-3 h-3 text-[#00A8C6] shrink-0" />
                          <div className="truncate font-sans text-[11px]">
                            <span className="font-semibold">{c.name}</span>
                            <span className="text-[9px] text-[#999999] block font-mono">
                              Track {index + 1} • {c.voiceConfig.voiceName}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono px-1 py-0.2 bg-[#121212] border border-[#333333] text-[#00A8C6] rounded-[2px] shrink-0 ml-1">
                          Trk {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. SOUND EFFECTS & CUES FOLDER */}
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => setIsSfxFolderOpen(!isSfxFolderOpen)}
                className="w-full flex items-center space-x-1 px-1 py-0.5 hover:bg-[#333333] rounded-[2px] text-[#DDDDDD] font-medium transition"
              >
                {isSfxFolderOpen ? (
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#888888]" />
                )}
                {isSfxFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#00A8C6]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#00A8C6]" />
                )}
                <span className="truncate">Sound FX Cues</span>
              </button>

              {isSfxFolderOpen && (
                <div className="ml-4 pl-2 border-l border-[#3D3D3D] space-y-0.5">
                  {['intro_chime', 'dramatic_boom', 'applause', 'keyboard_clicks', 'laughter'].map((sfx) => (
                    <div
                      key={sfx}
                      onClick={() => handleTestSFX(sfx)}
                      className="flex items-center justify-between px-1.5 py-0.5 bg-[#1E1E1E] border border-[#333333] hover:border-[#00A8C6] rounded-[2px] cursor-pointer transition text-[10px]"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <Volume2 className="w-3 h-3 text-[#00A8C6] shrink-0" />
                        <span className="text-[#CCCCCC] font-mono truncate">{sfx}.wav</span>
                      </div>
                      <span className="text-[8px] text-[#666666]">Preview ▶</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. AMBIENT BGM LANES FOLDER */}
            <div className="space-y-0.5 pt-1">
              <button
                onClick={() => setIsBgmFolderOpen(!isBgmFolderOpen)}
                className="w-full flex items-center space-x-1 px-1 py-0.5 hover:bg-[#333333] rounded-[2px] text-[#DDDDDD] font-medium transition"
              >
                {isBgmFolderOpen ? (
                  <ChevronDown className="w-3 h-3 text-[#888888]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#888888]" />
                )}
                {isBgmFolderOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#00A8C6]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#00A8C6]" />
                )}
                <span className="truncate">Ambient BGM Track</span>
              </button>

              {isBgmFolderOpen && (
                <div className="ml-4 pl-2 border-l border-[#3D3D3D] space-y-0.5">
                  <div className="flex items-center justify-between px-1.5 py-1 bg-[#1E1E1E] border border-[#333333] rounded-[2px]">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Music className="w-3 h-3 text-[#00A8C6] shrink-0" />
                      <span className="text-[#E0E0E0] truncate font-sans text-[11px]">
                        {project.bgmTrack || 'tech_ambient'}.mp3
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-[#00A8C6] bg-[#121212] px-1 border border-[#333333] rounded-[2px]">
                      Loop
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* MARKERS TAB CONTENT */
          <div className="space-y-1 font-mono text-[10px]">
            <div className="px-1 py-1 font-semibold text-[#888888] uppercase">Inline Technical Cues</div>
            {project.script
              .filter((l) => l.sfxCue || l.emotionNote)
              .map((l, i) => (
                <div key={l.id} className="p-1.5 bg-[#1E1E1E] border border-[#333333] rounded-[2px] space-y-0.5">
                  <div className="flex justify-between text-[#00A8C6]">
                    <span>TC 00:00:0{i * 5}:00</span>
                    <span className="text-[#888888]">{l.characterName}</span>
                  </div>
                  {l.sfxCue && <div className="text-[#CCCCCC]">SFX: [{l.sfxCue}]</div>}
                  {l.emotionNote && <div className="text-[#A0A0A0]">DIR: {l.emotionNote}</div>}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Panel Bottom Toolbar */}
      <div className="h-8 bg-[#202020] border-t border-[#3B3B3B] p-1 flex items-center justify-between shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.json,.csv,.fountain"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 bg-[#2A2A2A] hover:bg-[#333333] text-[#E0E0E0] border border-[#3B3B3B] rounded-[2px] transition flex items-center space-x-1 text-[10px]"
        >
          <Upload className="w-3 h-3 text-[#00A8C6]" />
          <span>Import Asset</span>
        </button>

        <button
          onClick={onAddCharacter}
          className="px-2 py-1 bg-[#264F78] hover:bg-[#2F5D8E] text-white rounded-[2px] border border-[#3B3B3B] transition flex items-center space-x-1 text-[10px]"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ Add Voice</span>
        </button>
      </div>
    </aside>
  );
};
