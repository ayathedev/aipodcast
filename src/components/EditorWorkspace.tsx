import React, { useState, useEffect, useRef } from 'react';
import { PodcastProject, Character, ScriptLine } from '../types';
import { CastingTool } from './casting/CastingTool';
import { ShowNotesExporter } from './showNotes/ShowNotesExporter';
import { GenerativeModeStudio } from './generative/GenerativeModeStudio';
import { ScriptChatDrawer } from './script/ScriptChatDrawer';
import { audioEngine } from '../lib/audioEngine';
import { getCharacterColorTheme } from '../lib/characterColors';
import { 
  Play, 
  Pause, 
  Plus, 
  Volume2, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  Users, 
  Download, 
  Sliders, 
  Zap, 
  Music, 
  Check, 
  X,
  VolumeX,
  Loader2,
  Clapperboard,
  MessageSquare,
  Undo,
  Redo,
  Radio,
  Clock,
  Megaphone,
  GripVertical
} from 'lucide-react';

interface EditorWorkspaceProps {
  project: PodcastProject;
  onUpdateProject: (updated: PodcastProject) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoiceStudio?: (char?: Character) => void;
}

const PRESET_VOICES = [
  { id: 'Zephyr', name: 'Zephyr (Warm & Professional)', gender: 'Male' },
  { id: 'Puck', name: 'Puck (Energetic & Dynamic)', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Crisp & Analytical)', gender: 'Female' },
  { id: 'Aoede', name: 'Aoede (Expressive & Engaging)', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir (Deep Baritone)', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Calm & Reflective)', gender: 'Male' },
];

const COMMON_SFX_PRESETS = [
  'intro_chime',
  'dramatic_boom',
  'applause',
  'keyboard_clicks',
  'laughter',
  'page_turn',
];

// Custom Slider component matching Soft Retro palette
const CustomSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-[#786B62] font-medium">{label}</span>
        <span className="text-[#2E2623] font-mono font-medium">{value.toFixed(2)}x</span>
      </div>
      <div className="relative flex items-center group cursor-pointer h-4">
        {/* Soft Parchment Track Background (#E0D4C3) */}
        <div className="w-full h-1.5 bg-[#E0D4C3] rounded-full overflow-hidden relative">
          {/* Warm Dark Espresso Fill Bar (#2E2623) */}
          <div
            className="h-full bg-[#2E2623] transition-colors rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Native Range Input overlay for accessibility & drag */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Crisp Handle Thumb */}
        <div
          className="absolute w-3.5 h-3.5 bg-[#FAF6EE] border border-[#D8CAB8] rounded-full shadow-xs pointer-events-none transition-transform transform -translate-x-1/2 group-hover:scale-110"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};


export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  project,
  onUpdateProject,
  activeTab,
  setActiveTab,
  onOpenVoiceStudio,
}) => {
  // Active states for minimalist workspace
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    project.characters[0]?.id || ''
  );
  const [activeLinePlayingId, setActiveLinePlayingId] = useState<string | null>(null);
  const [isPlayingScript, setIsPlayingScript] = useState<boolean>(false);

  // Line focus state for continuous canvas writing
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);

  // Editing inline cue state
  const [editingCueLineId, setEditingCueLineId] = useState<string | null>(null);
  const [editingCueValue, setEditingCueValue] = useState<string>('');

  // AI assist state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [showAiBox, setShowAiBox] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Selection/Target for AI Assist
  const [aiTarget, setAiTarget] = useState<{ type: 'line' | 'scene' | 'after', id: string } | null>(null);

  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ScriptLine[][]>([]);
  const [future, setFuture] = useState<ScriptLine[][]>([]);
  
  // Plus menu toggle
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const playCancelRef = useRef<boolean>(false);

  // Sync active character
  useEffect(() => {
    if (!selectedCharacterId && project.characters.length > 0) {
      setSelectedCharacterId(project.characters[0].id);
    }
  }, [project.characters, selectedCharacterId]);

  // Focus line when focusedLineId changes
  useEffect(() => {
    if (focusedLineId) {
      const el = document.getElementById(`line-textarea-${focusedLineId}`);
      if (el) {
        el.focus();
      }
      setFocusedLineId(null);
    }
  }, [focusedLineId]);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea except for explicit undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, future, project.script]);

  const activeCharacter = project.characters.find((c) => c.id === selectedCharacterId) || project.characters[0];

  // Master Playback of Script
  const handleTogglePlayScript = async () => {
    if (isPlayingScript) {
      playCancelRef.current = true;
      audioEngine.stop();
      setIsPlayingScript(false);
      setActiveLinePlayingId(null);
      return;
    }

    if (project.script.length === 0) return;

    setIsPlayingScript(true);
    playCancelRef.current = false;

    for (let i = 0; i < project.script.length; i++) {
      if (playCancelRef.current) break;
      const line = project.script[i];
      
      if (line.isSceneHeader) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      
      if (!line.text?.trim()) continue;
      
      setActiveLinePlayingId(line.id);

      // Play SFX if defined
      if (line.sfxCue) {
        audioEngine.playSFX(line.sfxCue);
      }

      const speakerChar = project.characters.find(
        (c) => c.id === line.characterId || c.name.toLowerCase() === line.characterName.toLowerCase()
      );
      const voiceConfig = speakerChar
        ? speakerChar.voiceConfig
        : { voiceName: 'Zephyr', pitch: 1.0, rate: 1.0, gender: 'Male' as const, tone: 'Warm', emotionStyle: 'Enthusiastic' as const };

      await new Promise<void>((resolve) => {
        audioEngine.speakLine(line.text || 'Dialogue text', voiceConfig, () => {
          resolve();
        });
      });
    }

    setIsPlayingScript(false);
    setActiveLinePlayingId(null);
  };

  // Single line preview
  const handlePreviewLine = (line: ScriptLine) => {
    if (line.isSceneHeader) return;
    
    if (activeLinePlayingId === line.id) {
      audioEngine.stop();
      setActiveLinePlayingId(null);
      return;
    }

    setActiveLinePlayingId(line.id);

    if (line.sfxCue) {
      audioEngine.playSFX(line.sfxCue);
    }

    const speakerChar = project.characters.find(
      (c) => c.id === line.characterId || c.name.toLowerCase() === line.characterName.toLowerCase()
    );
    const voiceConfig = speakerChar
      ? speakerChar.voiceConfig
      : { voiceName: 'Zephyr', pitch: 1.0, rate: 1.0, gender: 'Male' as const, tone: 'Warm', emotionStyle: 'Enthusiastic' as const };

    audioEngine.speakLine(line.text || 'Dialogue text', voiceConfig, () => {
      setActiveLinePlayingId(null);
    });
  };

  // Preview character voice
  const handlePreviewCharacterVoice = (char: Character) => {
    const sampleText = `Hello, I'm ${char.name}. I'm ready to record this podcast episode.`;
    audioEngine.speakLine(sampleText, char.voiceConfig);
  };

  // Update script lines
  const handleUpdateScript = (updatedScript: ScriptLine[]) => {
    setHistory((prevHistory) => [...prevHistory, project.script]);
    setFuture([]);
    onUpdateProject({
      ...project,
      script: updatedScript,
      updatedAt: new Date().toISOString(),
    });
  };

  // Undo action
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousScript = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [project.script, ...prev]);
    onUpdateProject({
      ...project,
      script: previousScript,
      updatedAt: new Date().toISOString(),
    });
  };

  // Redo action
  const handleRedo = () => {
    if (future.length === 0) return;
    const nextScript = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, project.script]);
    onUpdateProject({
      ...project,
      script: nextScript,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLineTextChange = (lineId: string, text: string) => {
    const updated = project.script.map((line) =>
      line.id === lineId ? { ...line, text, sceneTitle: line.isSceneHeader ? text : undefined } : line
    );
    
    // For fast typing, just update the project without saving history every keystroke
    onUpdateProject({
      ...project,
      script: updated,
      updatedAt: new Date().toISOString(),
    });
  };
  
  const handleLineTextBlur = () => {
    // Save history on blur (if the text changed significantly)
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(project.script)) return prev;
      return [...prev, project.script];
    });
  };

  const handleSpeakerChange = (lineId: string, charId: string) => {
    const targetChar = project.characters.find((c) => c.id === charId);
    if (!targetChar) return;
    const updated = project.script.map((line) =>
      line.id === lineId
        ? { ...line, characterId: targetChar.id, characterName: targetChar.name }
        : line
    );
    handleUpdateScript(updated);
    setSelectedCharacterId(targetChar.id);
  };

  const handleAddLine = (atIndex?: number) => {
    const defaultSpeaker = activeCharacter || project.characters[0] || { id: 'char-1', name: 'Host' };
    const newLine: ScriptLine = {
      id: 'line-' + Date.now(),
      characterId: defaultSpeaker.id,
      characterName: defaultSpeaker.name,
      text: '',
      emotionNote: '',
      sfxCue: '',
    };
    
    let copy = [...project.script];
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= copy.length) {
      copy.splice(atIndex, 0, newLine);
    } else {
      copy.push(newLine);
    }
    
    handleUpdateScript(copy);
    setFocusedLineId(newLine.id);
  };

  const handleAddScene = (atIndex?: number) => {
    const existingScenesCount = project.script.filter((l) => l.isSceneHeader).length + 1;
    const newSceneHeading: ScriptLine = {
      id: 'scene-' + Date.now(),
      characterId: 'SCENE',
      characterName: 'SCENE',
      text: `Scene ${existingScenesCount}: New Scene`,
      isSceneHeader: true,
      sceneTitle: `Scene ${existingScenesCount}: New Scene`,
    };

    let copy = [...project.script];
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= copy.length) {
      copy.splice(atIndex, 0, newSceneHeading);
    } else {
      copy.push(newSceneHeading);
    }
    handleUpdateScript(copy);
  };

  const handleAddAdBreak = (atIndex?: number) => {
    const defaultSpeaker = activeCharacter || project.characters[0] || { id: 'char-1', name: 'Host' };
    const newAdBreak: ScriptLine = {
      id: 'ad-' + Date.now(),
      characterId: defaultSpeaker.id,
      characterName: defaultSpeaker.name,
      text: 'Radio Commercial Spot: Enter advertisement script copy or station sponsor announcement...',
      isAdBreak: true,
      adSponsorName: 'Station Sponsor Spot',
      adDurationSec: 30,
      adCategory: 'Sponsor Spot',
      sfxCue: 'station_jingle'
    };

    let copy = [...project.script];
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= copy.length) {
      copy.splice(atIndex, 0, newAdBreak);
    } else {
      copy.push(newAdBreak);
    }
    handleUpdateScript(copy);
  };

  const handleAddLineAfter = (index: number) => {
    handleAddLine(index + 1);
  };

  const handleDeleteLine = (lineId: string) => {
    handleUpdateScript(project.script.filter((l) => l.id !== lineId));
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.script.length) return;

    const copy = [...project.script];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    handleUpdateScript(copy);
  };

  const handleReorderLines = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= project.script.length ||
      toIndex >= project.script.length
    ) {
      return;
    }

    const copy = [...project.script];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    handleUpdateScript(copy);
  };

  // Inline cue editing
  const handleStartEditCue = (line: ScriptLine) => {
    setEditingCueLineId(line.id);
    setEditingCueValue(line.emotionNote || line.sfxCue || '');
  };

  const handleSaveCue = (lineId: string) => {
    const val = editingCueValue.trim();
    const isSfx = COMMON_SFX_PRESETS.includes(val.toLowerCase());

    const updated = project.script.map((line) => {
      if (line.id === lineId) {
        return {
          ...line,
          emotionNote: val ? (val.startsWith('[') ? val : `[${val}]`) : '',
          sfxCue: isSfx ? val.toLowerCase() : line.sfxCue,
        };
      }
      return line;
    });

    handleUpdateScript(updated);
    setEditingCueLineId(null);
  };

  // Character updates
  const handleUpdateCharacter = (updatedChar: Character) => {
    const updatedList = project.characters.map((c) => (c.id === updatedChar.id ? updatedChar : c));
    onUpdateProject({
      ...project,
      characters: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddCharacter = () => {
    const newChar: Character = {
      id: 'char-' + Date.now(),
      name: `Voice Talent ${project.characters.length + 1}`,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
      mainRole: 'Speaker',
      personality: 'Warm & Natural',
      quirks: 'Clear pauses',
      background: 'Voice performer',
      voiceConfig: {
        voiceName: 'Zephyr',
        gender: 'Male',
        pitch: 1.0,
        rate: 1.0,
        tone: 'Warm',
        emotionStyle: 'Enthusiastic',
      },
      relationships: [],
    };

    onUpdateProject({
      ...project,
      characters: [...project.characters, newChar],
      updatedAt: new Date().toISOString(),
    });
    setSelectedCharacterId(newChar.id);
  };

  // AI Script assist
  const handleAiScriptAssist = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiError(null);

    try {
      let targetPayload = null;
      if (aiTarget) {
        targetPayload = aiTarget;
      }

      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: project.characters,
          existingScript: project.script,
          prompt: aiPrompt,
          actionType: 'custom',
          aiTarget: targetPayload
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate script');
      }

      if (data.lines && Array.isArray(data.lines)) {
        const newScriptLines: ScriptLine[] = data.lines.map((l: any, i: number) => {
          const matchedChar = project.characters.find(
            (c) => c.name.toLowerCase() === (l.characterName || '').toLowerCase()
          ) || project.characters[i % project.characters.length] || { id: 'char-1', name: 'Host' };

          return {
            id: 'line-' + Date.now() + '-' + i,
            characterId: matchedChar.id,
            characterName: matchedChar.name,
            text: l.text || '',
            emotionNote: l.emotionNote || '[Natural]',
            sfxCue: l.sfxCue || '',
            isSceneHeader: l.isSceneHeader || false,
            sceneTitle: l.sceneTitle || undefined,
          };
        });

        // The API returns the ENTIRE script if no target, or only the MODIFIED script if targeted.
        // Actually, if we want the server to return the ENTIRE script every time, we just replace it.
        // Let's assume the server will just return the full script patched with the AI changes.
        handleUpdateScript(newScriptLines);
        setAiPrompt('');
        setShowAiBox(false);
        setAiTarget(null);
      }
    } catch (err) {
      console.error('AI script error:', err);
      setAiError(err instanceof Error ? err.message : 'AI Script generation failed. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Export script
  const handleExportText = () => {
    const text = project.script
      .map((l) => `${l.characterName.toUpperCase()}${l.emotionNote ? ` ${l.emotionNote}` : ''}\n${l.text}\n`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.75rem)] bg-[#F5EFE6] text-[#2E2623] font-sans overflow-hidden select-none">
      {/* 1. SLEEK, MINIMALIST SUB-BAR */}
      <div className="h-11 bg-[#EDE5D8] border-b border-[#E0D4C3] px-6 flex items-center justify-between shrink-0 text-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('scripting')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'scripting' || activeTab === 'studio'
                ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Script</span>
          </button>

          <button
            onClick={() => setActiveTab('casting')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'casting'
                ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Users className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Voice Cast ({project.characters.length})</span>
          </button>

          {project.mode === 'generative' && (
            <button
              onClick={() => setActiveTab('generative')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'generative'
                  ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                  : 'text-[#786B62] hover:text-[#2E2623]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 stroke-[1.5] text-[#C85A32]" />
              <span>Generative AI</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('shownotes')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'shownotes'
                ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Show Notes</span>
          </button>
        </div>

        {/* Middle: Audio Playback */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTogglePlayScript}
            className={`px-3.5 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 ${
              isPlayingScript
                ? 'bg-[#EAD8C3] text-[#8C4328] border border-[#D8CAB8] font-semibold'
                : 'bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] shadow-xs'
            }`}
          >
            {isPlayingScript ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-[#C85A32]" />
                <span>Listen to Script</span>
              </>
            )}
          </button>
        </div>

        {/* Right: AI Assist & Co-Create Chat */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 border ${
              isChatDrawerOpen
                ? 'bg-[#E0D4C3] text-[#2E2623] border-[#D8CAB8]'
                : 'bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border-[#E0D4C3] shadow-xs'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C85A32] stroke-[1.5]" />
            <span>Co-Create Chat</span>
          </button>
          <button
            onClick={() => setShowAiBox(!showAiBox)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center space-x-1.5 border ${
              showAiBox
                ? 'bg-[#E0D4C3] text-[#2E2623] border-[#D8CAB8]'
                : 'bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border-[#E0D4C3] shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C85A32] stroke-[1.5]" />
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Banner */}
      {showAiBox && (
        <div className="bg-[#EDE5D8] border-b border-[#E0D4C3] p-4 transition-all">
          <div className="max-w-3xl mx-auto flex flex-col space-y-3">
            {aiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs flex items-center justify-between">
                <span>⚠️ {aiError}</span>
                <button onClick={() => setAiError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
              </div>
            )}
            {aiTarget && (
              <div className="flex items-center justify-between bg-[#FAF6EE] border border-[#E0D4C3] px-3 py-1.5 rounded-md shadow-xs">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-semibold text-[#C85A32]">Target:</span>
                  <span className="text-[#2E2623] truncate max-w-lg">
                    {aiTarget.type === 'scene' ? 'Entire Scene' : aiTarget.type === 'after' ? 'Insert After Entry' : 'Single Entry'} 
                    {' '}
                    ({project.script.find(s => s.id === aiTarget.id)?.text?.substring(0, 40) || 'Selected target'}...)
                  </span>
                </div>
                <button 
                  onClick={() => setAiTarget(null)}
                  className="text-[#786B62] hover:text-red-600 transition"
                  title="Clear Target"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-[#C85A32] shrink-0 stroke-[1.5]" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiScriptAssist()}
                placeholder={aiTarget ? "Describe how to modify the selected target..." : "Describe next scene or topic (e.g. 'Add a lively discussion on AI ethics...')"}
                className="flex-1 bg-[#FAF6EE] border border-[#E0D4C3] rounded-lg px-3.5 py-2 text-xs text-[#2E2623] placeholder:text-[#A39587] focus:outline-none focus:border-[#C85A32]"
              />
              <button
                onClick={handleAiScriptAssist}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-[#C85A32] hover:bg-[#B24D28] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center space-x-1.5 shrink-0 shadow-xs"
              >
                {isAiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Generate</span>
                )}
              </button>
              <button
                onClick={() => setShowAiBox(false)}
                className="p-1 text-[#786B62] hover:text-[#2E2623] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN SUB-VIEW RENDERER */}
      {activeTab === 'casting' ? (
        <div className="flex-1 overflow-y-auto bg-[#F5EFE6]">
          <CastingTool
            project={project}
            onUpdateCharacters={(chars) => onUpdateProject({ ...project, characters: chars })}
            onOpenVoiceStudio={onOpenVoiceStudio}
          />
        </div>
      ) : activeTab === 'shownotes' ? (
        <div className="flex-1 overflow-y-auto bg-[#F5EFE6]">
          <ShowNotesExporter
            project={project}
            onUpdateProject={onUpdateProject}
          />
        </div>
      ) : activeTab === 'generative' && project.mode === 'generative' ? (
        <div className="flex-1 overflow-y-auto bg-[#F5EFE6]">
          <GenerativeModeStudio
            project={project}
            onUpdateProject={onUpdateProject}
            onSwitchToTab={setActiveTab}
          />
        </div>
      ) : (
        /* 3. COZY & SPACIOUS SCRIPT EDITOR WORKSPACE */
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* CENTER COLUMN: Spacious Script Canvas */}
          <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 md:py-14 bg-[#F5EFE6]">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Script Title Header */}
              <div className="mb-8 border-b border-[#E0D4C3] pb-6">
                <h1 className="text-2xl font-semibold text-[#2E2623] tracking-tight mb-1">
                  {project.title}
                </h1>
                <p className="text-xs text-[#786B62] font-normal">
                  {project.genre} • {project.script.length} Dialogue Turns
                </p>
              </div>

              {/* Dialogue Turns */}
              {project.script.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#D8CAB8] rounded-xl p-8 text-[#786B62] text-xs bg-[#FAF6EE]">
                  <p className="mb-3">Your script is empty. Begin writing your podcast dialogue.</p>
                  <button
                    onClick={() => handleAddLine()}
                    className="px-4 py-2 bg-[#C85A32] hover:bg-[#B24D28] text-white rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Dialogue Turn</span>
                  </button>
                  <button
                    onClick={() => handleAddScene()}
                    className="px-4 py-2 bg-[#FAF6EE] hover:bg-[#EDE5D8] border border-[#E0D4C3] text-[#2E2623] rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1.5 shadow-xs ml-3"
                  >
                    <Clapperboard className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Add Scene</span>
                  </button>
                </div>
              ) : (
                project.script.map((line, index) => {
                  const isPlayingThisLine = activeLinePlayingId === line.id;
                  
                  // SCENE HEADER RENDER
                  let innerContent = null;
                  
                  if (line.isSceneHeader) {
                    let currentSceneNum = 0;
                    for (let i = 0; i <= index; i++) {
                      if (project.script[i].isSceneHeader) currentSceneNum++;
                    }

                    innerContent = (
                      <div
                        id={`scene-header-${line.id}`}
                        className="group relative my-8 pt-4 pb-3 px-6 rounded-xl bg-[#EDE5D8]/80 border border-[#E0D4C3] shadow-sm -mx-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5 shrink-0 px-2.5 py-1 rounded-md bg-[#FAF6EE] border border-[#E0D4C3] text-[#2E2623] font-mono text-[11px] font-bold tracking-widest uppercase shadow-xs">
                              <Clapperboard className="w-3.5 h-3.5 stroke-[2] text-[#C85A32]" />
                              <span>SCENE {currentSceneNum}</span>
                            </div>

                            <input
                              type="text"
                              value={line.sceneTitle || line.text || ''}
                              onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                              onBlur={handleLineTextBlur}
                              placeholder="Scene Title (e.g., Opening Discussion)..."
                              className="bg-transparent text-[#2E2623] font-bold text-sm leading-tight focus:outline-none focus:border-b border-[#C85A32]/60 w-full truncate placeholder:text-[#A39587] tracking-wide"
                            />
                          </div>

                          <div className="flex items-center space-x-1 shrink-0 opacity-60 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                setAiTarget({ type: 'scene', id: line.id });
                                setShowAiBox(true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              title="Target AI on this Scene"
                              className="p-1 rounded text-[#786B62] hover:text-[#C85A32] hover:bg-[#E0D4C3]/50 transition mr-2"
                            >
                              <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>

                            <button
                              onClick={() => handleAddLine(index + 1)}
                              title="Add Dialogue Entry to this Scene"
                              className="px-2.5 py-1 rounded-md bg-[#FAF6EE] hover:bg-white text-[#2E2623] text-[11px] font-medium transition flex items-center space-x-1 border border-[#E0D4C3] shadow-xs mr-2"
                            >
                              <Plus className="w-3 h-3 text-[#C85A32] stroke-[2]" />
                              <span className="hidden sm:inline">Add Entry</span>
                            </button>

                            <div
                              title="Drag to reorder scene"
                              className="p-1 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-3.5 h-3.5 stroke-[1.5]" />
                            </div>

                            <button
                              onClick={() => handleMoveLine(index, 'up')}
                              disabled={index === 0}
                              title="Move Scene Up"
                              className="p-1 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition disabled:opacity-20"
                            >
                              <ChevronUp className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>

                            <button
                              onClick={() => handleMoveLine(index, 'down')}
                              disabled={index === project.script.length - 1}
                              title="Move Scene Down"
                              className="p-1 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition disabled:opacity-20"
                            >
                              <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>

                            <button
                              onClick={() => handleDeleteLine(line.id)}
                              title="Delete Scene Header"
                              className="p-1 rounded text-[#786B62] hover:text-red-600 hover:bg-[#E0D4C3]/50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (line.isAdBreak) {
                    innerContent = (
                      <div
                        id={`ad-break-${line.id}`}
                        onClick={() => {
                          if (aiTarget?.id !== line.id) {
                            setAiTarget({ type: 'line', id: line.id });
                          }
                        }}
                        className={`group relative my-4 rounded-xl transition-all p-4 pl-6 -mx-4 border ${
                          aiTarget?.id === line.id 
                            ? 'bg-[#FEF9EE] border-amber-600 shadow-sm ring-1 ring-amber-500'
                            : isPlayingThisLine
                              ? 'bg-[#FEF9EE] border-amber-500 shadow-md ring-2 ring-amber-500/30'
                              : 'bg-[#FAF6EE] border-amber-300/80 hover:bg-[#FEF9EE] hover:border-amber-400'
                        }`}
                      >
                        {/* Gold Commercial Side Stripe */}
                        <div
                          className="absolute left-1.5 top-3 bottom-3 w-1.5 rounded-full bg-amber-500"
                          title="Radio Commercial Spot / Station ID"
                        />

                        {/* Commercial Header Toolbar */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/80 gap-2 flex-wrap">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[10px] tracking-wider uppercase shadow-2xs shrink-0">
                              <Radio className="w-3 h-3" />
                              <span>COMMERCIAL SPOT</span>
                            </div>

                            {/* Category Selector */}
                            <select
                              value={line.adCategory || 'Sponsor Spot'}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                const updated = project.script.map(l => l.id === line.id ? { ...l, adCategory: val } : l);
                                handleUpdateScript(updated);
                              }}
                              className="bg-amber-100/80 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase tracking-wider rounded px-2 py-0.5 focus:outline-none cursor-pointer hover:bg-amber-200/60"
                            >
                              <option value="Sponsor Spot">Sponsor Spot</option>
                              <option value="Station ID">Station ID</option>
                              <option value="PSA">PSA Announcement</option>
                              <option value="Promo Bump">Promo Bump</option>
                            </select>

                            {/* Countdown Timer Selector */}
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-100/80 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold">
                              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                              <select
                                value={line.adDurationSec || 30}
                                onChange={(e) => {
                                  const sec = parseInt(e.target.value, 10);
                                  const updated = project.script.map(l => l.id === line.id ? { ...l, adDurationSec: sec } : l);
                                  handleUpdateScript(updated);
                                }}
                                className="bg-transparent text-amber-900 font-bold focus:outline-none cursor-pointer"
                              >
                                <option value={15}>15s Countdown</option>
                                <option value={30}>30s Countdown</option>
                                <option value={60}>60s Countdown</option>
                              </select>
                            </div>

                            {/* SFX Jingle Cue Selector */}
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-100/80 border border-amber-300 text-amber-900 text-[10px] font-semibold">
                              <Music className="w-3 h-3 text-amber-700 shrink-0" />
                              <select
                                value={line.sfxCue || 'station_jingle'}
                                onChange={(e) => {
                                  const cue = e.target.value;
                                  const updated = project.script.map(l => l.id === line.id ? { ...l, sfxCue: cue } : l);
                                  handleUpdateScript(updated);
                                }}
                                className="bg-transparent text-amber-900 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="station_jingle">Station Jingle</option>
                                <option value="intro_chime">Studio Chime</option>
                                <option value="dramatic_boom">Dramatic Boom</option>
                                <option value="applause">Applause</option>
                                <option value="radio_tuning">Radio Static</option>
                              </select>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <div
                              title="Drag to reorder commercial spot"
                              className="p-1.5 rounded-md text-amber-800 hover:bg-amber-200/60 transition cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            <button
                              onClick={() => handlePreviewLine(line)}
                              title="Preview Radio Ad Spot Audio"
                              className="p-1.5 rounded-md bg-amber-100 text-amber-900 hover:bg-amber-200 transition"
                            >
                              {isPlayingThisLine ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleMoveLine(index, 'up')}
                              disabled={index === 0}
                              title="Move Up"
                              className="p-1.5 rounded-md text-amber-800 hover:bg-amber-200/60 transition disabled:opacity-30"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveLine(index, 'down')}
                              disabled={index === project.script.length - 1}
                              title="Move Down"
                              className="p-1.5 rounded-md text-amber-800 hover:bg-amber-200/60 transition disabled:opacity-30"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLine(line.id)}
                              title="Delete Commercial Spot"
                              className="p-1.5 rounded-md text-amber-800 hover:text-red-700 hover:bg-amber-200/60 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sponsor Name & Script Copy */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={line.adSponsorName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = project.script.map(l => l.id === line.id ? { ...l, adSponsorName: val } : l);
                              onUpdateProject({ ...project, script: updated });
                            }}
                            placeholder="Sponsor / Station Spot Title (e.g. Apex Cybernetics 30s Radio Spot)..."
                            className="w-full font-bold text-xs text-amber-950 bg-amber-100/60 border border-amber-300 rounded px-2.5 py-1 focus:outline-none focus:bg-amber-50"
                          />

                          <textarea
                            value={line.text || ''}
                            onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                            onBlur={handleLineTextBlur}
                            placeholder="Enter commercial script pitch copy or broadcast announcement text..."
                            rows={2}
                            className="w-full text-xs text-[#2E2623] bg-transparent border-none focus:outline-none focus:ring-0 resize-y font-sans leading-relaxed placeholder:text-amber-800/50"
                          />
                        </div>

                        {/* Live Countdown Timer Indicator during playback */}
                        {isPlayingThisLine && (
                          <div className="mt-2.5 pt-2 border-t border-amber-300 flex items-center justify-between text-[11px] text-amber-900 font-mono font-bold animate-pulse">
                            <div className="flex items-center space-x-1.5">
                              <Radio className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                              <span>LIVE BROADCAST: Playing Commercial Spot...</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                              Countdown: {line.adDurationSec || 30}s
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const charTheme = getCharacterColorTheme(
                      line.characterId || line.characterName,
                      undefined,
                      project.characters
                    );

                    innerContent = (
                      <div
                        onClick={() => {
                          if (aiTarget?.id !== line.id) {
                            setAiTarget({ type: 'line', id: line.id });
                          }
                        }}
                        className={`group relative rounded-xl transition-all p-4 pl-6 -mx-4 border ${
                          aiTarget?.id === line.id 
                            ? 'bg-[#FAF6EE] border-[#C85A32] shadow-sm ring-1 ring-[#C85A32]'
                            : isPlayingThisLine
                              ? 'bg-[#FAF6EE] border-[#E0D4C3] shadow-xs'
                              : 'border-transparent hover:bg-[#FAF6EE]/90 hover:border-[#E0D4C3] hover:shadow-xs'
                        }`}
                      >
                        {/* Character Color-Coded Side-Stripe */}
                        <div
                          className={`absolute left-1.5 top-3 bottom-3 w-1.5 rounded-full transition-all duration-200 ${charTheme.stripeBg}`}
                          title={`Character: ${line.characterName} (${charTheme.name})`}
                        />

                        {/* Speaker Header & Inline Audio Cue */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {/* Speaker Selector & Character Color Tag */}
                            <div className="flex items-center space-x-1.5">
                              <select
                                value={line.characterId}
                                onChange={(e) => handleSpeakerChange(line.id, e.target.value)}
                                className={`bg-transparent font-bold text-xs tracking-wider uppercase focus:outline-none cursor-pointer ${charTheme.badgeText}`}
                              >
                                {project.characters.map((c) => (
                                  <option key={c.id} value={c.id} className="bg-[#FAF6EE] text-[#2E2623] font-normal">
                                    {c.name.toUpperCase()} ({c.mainRole})
                                  </option>
                                ))}
                              </select>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${charTheme.badgeBg} ${charTheme.badgeText} ${charTheme.badgeBorder} border shrink-0`}
                              >
                                {charTheme.name}
                              </span>
                            </div>

                            {/* Stage Directions & SFX Pill Badges */}
                            {editingCueLineId === line.id ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editingCueValue}
                                  onChange={(e) => setEditingCueValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCue(line.id)}
                                  autoFocus
                                  placeholder="e.g. [Warm smile]"
                                  className="bg-[#FAF6EE] border border-[#E0D4C3] rounded px-2 py-0.5 text-xs text-[#2E2623] focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSaveCue(line.id)}
                                  className="text-[#786B62] hover:text-[#2E2623] p-0.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                {line.emotionNote ? (
                                  <span
                                    onClick={(e) => { e.stopPropagation(); handleStartEditCue(line); }}
                                    className="inline-flex items-center bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] text-[11px] px-[6px] py-[2px] rounded-[4px] font-sans font-medium cursor-pointer hover:bg-[#E0D4C3] transition select-none"
                                    title="Click to edit stage direction"
                                  >
                                    {line.emotionNote}
                                  </span>
                                ) : null}

                                {line.sfxCue ? (
                                  <span
                                    onClick={(e) => { e.stopPropagation(); handleStartEditCue(line); }}
                                    className="inline-flex items-center bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] text-[11px] px-[6px] py-[2px] rounded-[4px] font-sans font-medium cursor-pointer hover:bg-[#E0D4C3] transition select-none"
                                    title="Click to edit SFX cue"
                                  >
                                    SFX: {line.sfxCue}
                                  </span>
                                ) : null}

                                {!line.emotionNote && !line.sfxCue && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleStartEditCue(line); }}
                                    className="text-[#A39587] hover:text-[#786B62] text-[11px] transition font-sans"
                                  >
                                    + Add cue
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Line Controls (Hover action) */}
                          <div className={`transition-opacity flex items-center space-x-1 text-[#786B62] ${aiTarget?.id === line.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div
                              title="Drag to reorder dialogue turn"
                              className="p-1 hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition rounded cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (aiTarget?.id === line.id) {
                                  setAiTarget(null);
                                  setShowAiBox(false);
                                } else {
                                  setAiTarget({ type: 'line', id: line.id });
                                  setShowAiBox(true);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              title={aiTarget?.id === line.id ? "Deselect AI Target" : "Target AI on this Entry"}
                              className={`p-1 transition rounded mr-2 ${aiTarget?.id === line.id ? 'text-[#C85A32] bg-[#E0D4C3]/50' : 'hover:text-[#C85A32] hover:bg-[#E0D4C3]/50'}`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handlePreviewLine(line); }}
                              title="Preview Dialogue Audio"
                              className="p-1 hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition rounded ml-1"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${isPlayingThisLine ? 'text-[#C85A32] animate-pulse' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveLine(index, 'up'); }}
                              disabled={index === 0}
                              title="Move Up"
                              className="p-1 hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition rounded disabled:opacity-20"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveLine(index, 'down'); }}
                              disabled={index === project.script.length - 1}
                              title="Move Down"
                              className="p-1 hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition rounded disabled:opacity-20"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteLine(line.id); }}
                              title="Delete Line"
                              className="p-1 hover:text-red-700 hover:bg-red-100/50 transition rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cozy Writing Textarea with Enter-key continuous flow */}
                        <textarea
                          id={`line-textarea-${line.id}`}
                          value={line.text}
                          onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                          onBlur={handleLineTextBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddLineAfter(index);
                            }
                          }}
                          placeholder="Type dialogue... (Press Enter for next turn)"
                          rows={Math.max(1, Math.ceil((line.text || '').length / 65))}
                          className="w-full bg-transparent text-[#2E2623] text-base md:text-lg font-normal leading-[1.6] focus:outline-none resize-none placeholder:text-[#A39587] transition-colors"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={line.id}
                      draggable={true}
                      onDragStart={(e) => {
                        if (
                          e.target instanceof HTMLInputElement ||
                          e.target instanceof HTMLTextAreaElement ||
                          e.target instanceof HTMLSelectElement
                        ) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData('text/plain', index.toString());
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (dragOverIndex === index) {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndexStr = e.dataTransfer.getData('text/plain');
                        const fromIndex = parseInt(fromIndexStr, 10);
                        if (!isNaN(fromIndex) && fromIndex !== index) {
                          handleReorderLines(fromIndex, index);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`transition-all duration-150 ${
                        draggedIndex === index ? 'opacity-30 border-2 border-dashed border-[#C85A32] rounded-xl' : ''
                      } ${
                        dragOverIndex === index && draggedIndex !== index ? 'border-t-4 border-t-[#C85A32] pt-1' : ''
                      }`}
                    >
                      {index === 0 && (
                        <div className="flex justify-center -my-3 relative z-10 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleAddLine(0)}
                            className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-full px-3 py-1 text-[#786B62] hover:text-[#C85A32] hover:border-[#C85A32] shadow-sm flex items-center space-x-1 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Before</span>
                          </button>
                        </div>
                      )}
                      
                      {innerContent}
                      
                      <div className="flex justify-center -my-3 relative z-10 opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAddLine(index + 1)}
                          className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-full px-3 py-1 text-[#786B62] hover:text-[#C85A32] hover:border-[#C85A32] shadow-sm flex items-center space-x-1 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>After</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bottom Control Section: Prominent + Button Menu after last entry in script */}
              {project.script.length > 0 && (
                <div className="pt-8 pb-16 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <button
                      id="workspace-add-menu-btn"
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className="px-5 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-white text-[#2E2623] font-semibold text-xs border border-[#E0D4C3] shadow-sm transition flex items-center space-x-2 group cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#E0D4C3] group-hover:bg-[#D8CAB8] flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5 text-[#2E2623] stroke-[2.5]" />
                      </div>
                      <span>Add to Script</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#786B62] transition-transform duration-150 ${isPlusMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPlusMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsPlusMenuOpen(false)} 
                        />

                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl shadow-lg p-1.5 z-20 font-sans text-xs">
                          <button
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              handleAddLine();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-[#2E2623] hover:bg-[#EDE5D8] flex items-center space-x-2.5 transition font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-[#C85A32] stroke-[1.5]" />
                            <span>New Entry</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              handleAddScene();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-[#2E2623] hover:bg-[#EDE5D8] flex items-center space-x-2.5 transition font-medium cursor-pointer"
                          >
                            <Clapperboard className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
                            <span>New Scene</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              handleAddAdBreak();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-amber-900 hover:bg-amber-100 flex items-center space-x-2.5 transition font-medium cursor-pointer"
                          >
                            <Radio className="w-4 h-4 text-amber-600 stroke-[1.5]" />
                            <span>Commercial / Ad Spot</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick Action Pills (New Entry, New Scene, Commercial Spot, Undo, Redo) */}
                  <div className="flex items-center space-x-2 text-xs flex-wrap justify-center gap-y-2">
                    <button
                      onClick={() => handleAddLine()}
                      className="px-3 py-1.5 rounded-full border border-[#E0D4C3] bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#786B62] hover:text-[#2E2623] text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#C85A32]" />
                      <span>New Entry</span>
                    </button>

                    <button
                      onClick={() => handleAddScene()}
                      className="px-3 py-1.5 rounded-full border border-[#E0D4C3] bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#786B62] hover:text-[#2E2623] text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Clapperboard className="w-3 h-3 text-[#786B62]" />
                      <span>New Scene</span>
                    </button>

                    <button
                      onClick={() => handleAddAdBreak()}
                      className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Radio className="w-3 h-3 text-amber-600" />
                      <span>Ad / Commercial Spot</span>
                    </button>

                    <div className="h-4 w-px bg-[#E0D4C3] mx-1" />

                    <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      title="Undo (Ctrl+Z)"
                      className="px-2.5 py-1.5 rounded-full border border-[#E0D4C3] bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#786B62] hover:text-[#2E2623] disabled:opacity-40 text-xs font-medium transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Undo className="w-3 h-3" />
                      <span>Undo</span>
                    </button>

                    <button
                      onClick={handleRedo}
                      disabled={future.length === 0}
                      title="Redo (Ctrl+Y)"
                      className="px-2.5 py-1.5 rounded-full border border-[#E0D4C3] bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#786B62] hover:text-[#2E2623] disabled:opacity-40 text-xs font-medium transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Redo className="w-3 h-3" />
                      <span>Redo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: Soft Retro Voice & Character Inspector */}
          <div className="w-80 shrink-0 bg-[#EDE5D8] border-l border-[#E0D4C3] flex flex-col p-5 space-y-6 overflow-y-auto">
            {/* Active Character Profile */}
            {activeCharacter ? (
              <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-4 shadow-xs space-y-4">
                <div className="text-[10px] font-mono tracking-widest text-[#786B62] uppercase font-semibold">
                  Active Speaker
                </div>

                <div className="flex items-start space-x-3">
                  <img
                    src={activeCharacter.avatarUrl}
                    alt={activeCharacter.name}
                    className="w-13 h-13 rounded-xl object-cover border border-[#E0D4C3] shadow-xs shrink-0"
                  />
                  <div>
                    <h3 className="font-semibold text-[#2E2623] text-base">
                      {activeCharacter.name}
                    </h3>
                    <p className="text-xs text-[#786B62] font-normal">
                      {activeCharacter.mainRole}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-[10px] bg-[#EDE5D8] border border-[#E0D4C3] text-[#786B62] px-2 py-0.5 rounded-md">
                        {activeCharacter.personality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Voice Controls */}
                <div className="space-y-3.5 pt-1 border-t border-[#E0D4C3]/60">
                  <div>
                    <label className="text-[11px] text-[#786B62] mb-1 block font-medium">
                      Voice Model
                    </label>
                    <select
                      value={activeCharacter.voiceConfig.voiceName}
                      onChange={(e) => {
                        const updatedConfig = { ...activeCharacter.voiceConfig, voiceName: e.target.value };
                        handleUpdateCharacter({ ...activeCharacter, voiceConfig: updatedConfig });
                      }}
                      className="w-full bg-[#FAF6EE] border border-[#E0D4C3] text-[#2E2623] text-xs rounded-lg p-2 focus:outline-none focus:border-[#C85A32]"
                    >
                      {PRESET_VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pitch Custom Slider */}
                  <CustomSlider
                    label="Pitch"
                    value={activeCharacter.voiceConfig.pitch}
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    onChange={(pitch) => {
                      const updatedConfig = { ...activeCharacter.voiceConfig, pitch };
                      handleUpdateCharacter({ ...activeCharacter, voiceConfig: updatedConfig });
                    }}
                  />

                  {/* Speed Rate Custom Slider */}
                  <CustomSlider
                    label="Speed Rate"
                    value={activeCharacter.voiceConfig.rate}
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    onChange={(rate) => {
                      const updatedConfig = { ...activeCharacter.voiceConfig, rate };
                      handleUpdateCharacter({ ...activeCharacter, voiceConfig: updatedConfig });
                    }}
                  />

                  {/* Test Voice Button */}
                  <button
                    onClick={() => handlePreviewCharacterVoice(activeCharacter)}
                    className="w-full py-2 px-3 bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border border-[#2E2623] rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Test Voice Delivery</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Voice Cast List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#786B62] uppercase font-semibold">
                <span>Voice Cast</span>
                <span>{project.characters.length}</span>
              </div>

              <div className="space-y-1.5">
                {project.characters.map((c) => {
                  const isSelected = c.id === selectedCharacterId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCharacterId(c.id)}
                      className={`p-2.5 rounded-lg transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FAF6EE] border border-[#E0D4C3] text-[#2E2623] shadow-xs'
                          : 'hover:bg-[#FAF6EE]/80 border border-transparent text-[#786B62] hover:text-[#2E2623]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-7 h-7 rounded-md object-cover border border-[#E0D4C3] shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">{c.name}</p>
                          <p className="text-[10px] text-[#786B62] truncate">{c.voiceConfig.voiceName}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewCharacterVoice(c);
                        }}
                        className="p-1 text-[#786B62] hover:text-[#2E2623] transition"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleAddCharacter}
                className="w-full py-2 bg-[#FAF6EE] border border-dashed border-[#D8CAB8] hover:border-[#2E2623] text-[#786B62] hover:text-[#2E2623] rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Voice Talent</span>
              </button>
            </div>
          </div>
          <ScriptChatDrawer
            project={project}
            onUpdateProject={onUpdateProject}
            isOpen={isChatDrawerOpen}
            onClose={() => setIsChatDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

