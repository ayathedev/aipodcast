import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PodcastProject, ScriptLine } from '../../types';
import { audioEngine } from '../../lib/audioEngine';
import { getCharacterColorTheme } from '../../lib/characterColors';
import { 
  Play, 
  Square, 
  Sparkles, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Volume2, 
  ArrowUp, 
  ArrowDown, 
  Loader2, 
  Smile, 
  Music,
  ChevronDown,
  FileText,
  Undo,
  Redo,
  Clapperboard,
  MessageSquare,
  GripVertical
} from 'lucide-react';

interface ScriptingToolProps {
  project: PodcastProject;
  onUpdateScript: (script: ScriptLine[]) => void;
}

const SFX_OPTIONS = [
  { value: '', label: 'No SFX' },
  { value: 'intro_chime', label: 'Intro Chime' },
  { value: 'dramatic_boom', label: 'Dramatic Boom' },
  { value: 'keyboard_clicks', label: 'Keyboard Typing' },
  { value: 'applause', label: 'Applause' },
  { value: 'laughter', label: 'Laughter' },
  { value: 'coffee_sip', label: 'Coffee Sip' },
  { value: 'radio_static', label: 'Radio Static' },
];

export const ScriptingTool: React.FC<ScriptingToolProps> = ({
  project,
  onUpdateScript,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeLinePlayingId, setActiveLinePlayingId] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ScriptLine[][]>([]);
  const [future, setFuture] = useState<ScriptLine[][]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playAllCancelRef = useRef(false);

  // Helper to commit script changes to history
  const updateScriptWithHistory = useCallback((newScript: ScriptLine[]) => {
    setHistory((prevHistory) => [...prevHistory, project.script]);
    setFuture([]);
    onUpdateScript(newScript);
  }, [project.script, onUpdateScript]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousScript = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [project.script, ...prev]);
    onUpdateScript(previousScript);
  }, [history, project.script, onUpdateScript]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextScript = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, project.script]);
    onUpdateScript(nextScript);
  }, [future, project.script, onUpdateScript]);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea except for explicit undo
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
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
  }, [handleUndo, handleRedo]);

  // Add new line turn (at optional index or end)
  const handleAddLine = (atIndex?: number) => {
    const defaultChar = project.characters[0] || { id: 'char-1', name: 'Host' };
    const newLine: ScriptLine = {
      id: 'line-' + Date.now(),
      characterId: defaultChar.id,
      characterName: defaultChar.name,
      text: '',
      emotionNote: '[Speaks naturally]',
      sfxCue: '',
    };

    if (atIndex !== undefined && atIndex >= 0 && atIndex <= project.script.length) {
      const updated = [...project.script];
      updated.splice(atIndex, 0, newLine);
      updateScriptWithHistory(updated);
    } else {
      updateScriptWithHistory([...project.script, newLine]);
    }
  };

  // Add new scene heading (at optional index or end)
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

    if (atIndex !== undefined && atIndex >= 0 && atIndex <= project.script.length) {
      const updated = [...project.script];
      updated.splice(atIndex, 0, newSceneHeading);
      updateScriptWithHistory(updated);
    } else {
      updateScriptWithHistory([...project.script, newSceneHeading]);
    }
  };

  const handleUpdateLine = (id: string, updatedFields: Partial<ScriptLine>) => {
    const updated = project.script.map((line) => {
      if (line.id === id) {
        const charObj = updatedFields.characterId
          ? project.characters.find((c) => c.id === updatedFields.characterId)
          : null;

        return {
          ...line,
          ...updatedFields,
          characterName: charObj ? charObj.name : (updatedFields.characterName || line.characterName),
        };
      }
      return line;
    });

    updateScriptWithHistory(updated);
  };

  const handleDeleteLine = (id: string) => {
    updateScriptWithHistory(project.script.filter((l) => l.id !== id));
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.script.length) return;

    const newScript = [...project.script];
    const temp = newScript[index];
    newScript[index] = newScript[targetIndex];
    newScript[targetIndex] = temp;

    updateScriptWithHistory(newScript);
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

    const newScript = [...project.script];
    const [moved] = newScript.splice(fromIndex, 1);
    newScript.splice(toIndex, 0, moved);

    updateScriptWithHistory(newScript);
  };

  // Preview audio for single line
  const handlePreviewLineAudio = (line: ScriptLine) => {
    if (line.isSceneHeader) return;
    setActiveLinePlayingId(line.id);

    if (line.sfxCue) {
      audioEngine.playSFX(line.sfxCue);
    }

    const speakerChar = project.characters.find((c) => c.id === line.characterId || c.name === line.characterName);
    const voiceConfig = speakerChar
      ? speakerChar.voiceConfig
      : { voiceName: 'Zephyr', pitch: 1.0, rate: 1.0, gender: 'Male' as const, tone: 'Warm', emotionStyle: 'Enthusiastic' as const };

    audioEngine.speakLine(line.text || 'No dialogue written yet.', voiceConfig, () => {
      setActiveLinePlayingId(null);
    });
  };

  // Play full audio sequentially
  const handleTogglePlayAll = async () => {
    if (isPlayingAll) {
      playAllCancelRef.current = true;
      audioEngine.stop();
      setIsPlayingAll(false);
      setActiveLinePlayingId(null);
      return;
    }

    if (project.script.length === 0) return;

    setIsPlayingAll(true);
    playAllCancelRef.current = false;

    for (let i = 0; i < project.script.length; i++) {
      if (playAllCancelRef.current) break;
      const line = project.script[i];
      if (line.isSceneHeader) {
        // Pause briefly for scene transition
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      if (!line.text.trim()) continue;

      setActiveLinePlayingId(line.id);

      if (line.sfxCue) {
        audioEngine.playSFX(line.sfxCue);
      }

      const speakerChar = project.characters.find(
        (c) => c.id === line.characterId || c.name === line.characterName
      );
      const voiceConfig = speakerChar
        ? speakerChar.voiceConfig
        : { voiceName: 'Zephyr', pitch: 1.0, rate: 1.0, gender: 'Male' as const, tone: 'Warm', emotionStyle: 'Enthusiastic' as const };

      await new Promise<void>((resolve) => {
        audioEngine.speakLine(line.text, voiceConfig, () => {
          resolve();
        });
      });
    }

    setIsPlayingAll(false);
    setActiveLinePlayingId(null);
  };

  // AI Script Assistant
  const handleAiScriptAssist = async (actionType = 'custom', customPrompt = '') => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characters: project.characters,
          existingScript: project.script,
          prompt: promptToUse,
          actionType,
        }),
      });

      const data = await res.json();
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
          };
        });

        updateScriptWithHistory(newScriptLines);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('AI script error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Export script to text file
  const handleExportScript = () => {
    const plainText = project.script
      .map((l) => `${l.characterName.toUpperCase()}: ${l.text}`)
      .join('\n\n');

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_script.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const uploadedLines: ScriptLine[] = parsed.map((item: any, idx: number) => ({
              id: 'uploaded-' + Date.now() + '-' + idx,
              characterId: project.characters[0]?.id || 'char-1',
              characterName: item.characterName || item.speaker || 'Host',
              text: item.text || item.dialogue || '',
              emotionNote: item.emotionNote || '[Uploaded]',
              sfxCue: item.sfxCue || '',
            }));
            updateScriptWithHistory([...project.script, ...uploadedLines]);
            return;
          }
        }
      } catch (err) {
        // Fallback
      }

      const linesRaw = content.split('\n').filter((l) => l.trim().length > 0);
      const parsedLines: ScriptLine[] = linesRaw.map((rawLine, idx) => {
        const colonIdx = rawLine.indexOf(':');
        let speaker = 'Host';
        let text = rawLine.trim();

        if (colonIdx > 0 && colonIdx < 30) {
          speaker = rawLine.substring(0, colonIdx).trim();
          text = rawLine.substring(colonIdx + 1).trim();
        }

        const matchedChar = project.characters.find(
          (c) => c.name.toLowerCase().includes(speaker.toLowerCase())
        ) || project.characters[idx % project.characters.length] || { id: 'char-1', name: speaker };

        return {
          id: 'uploaded-txt-' + Date.now() + '-' + idx,
          characterId: matchedChar.id,
          characterName: matchedChar.name,
          text: text,
          emotionNote: '[Uploaded]',
          sfxCue: '',
        };
      });

      if (parsedLines.length > 0) {
        updateScriptWithHistory([...project.script, ...parsedLines]);
      }
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div id="scripting-workstation" className="flex flex-col h-full bg-[#0f0f11] font-sans text-xs text-zinc-100">
      {/* 1. TOP TOOLBAR REFACTOR: Compact 40px-tall bar */}
      <div className="h-10 min-h-[40px] max-h-[40px] bg-[#18181b] border-b border-zinc-800/80 px-4 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Play Audio Button + Undo & Redo */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="toolbar-play-audio-btn"
            onClick={handleTogglePlayAll}
            className="h-7 px-3 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            {isPlayingAll ? (
              <>
                <Square className="w-3 h-3 fill-current text-zinc-950" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-zinc-950" />
                <span>Play Audio</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-1 border-l border-zinc-800 pl-2">
            <button
              id="toolbar-undo-btn"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              className="h-7 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:text-zinc-600 disabled:hover:bg-zinc-900 disabled:bg-zinc-900/50 border border-zinc-700/60 disabled:border-zinc-800 text-xs font-medium transition flex items-center space-x-1.5 shadow-xs"
            >
              <Undo className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Undo</span>
            </button>

            <button
              id="toolbar-redo-btn"
              onClick={handleRedo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y)"
              className="h-7 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:text-zinc-600 disabled:hover:bg-zinc-900 disabled:bg-zinc-900/50 border border-zinc-700/60 disabled:border-zinc-800 text-xs font-medium transition flex items-center space-x-1.5 shadow-xs"
            >
              <Redo className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Redo</span>
            </button>
          </div>
        </div>

        {/* Inline Natural Language AI Input */}
        <div className="flex-1 max-w-xl flex items-center relative">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiScriptAssist('custom')}
            placeholder="Ask AI to write, expand, or tweak script..."
            className="w-full bg-[#0f0f11] text-zinc-100 text-xs pl-8 pr-16 py-1 rounded border border-zinc-800 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
          />
          <button
            id="ai-generate-script-btn"
            onClick={() => handleAiScriptAssist('custom')}
            disabled={isAiGenerating || !aiPrompt.trim()}
            className="absolute right-1 text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition disabled:opacity-30"
          >
            {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin text-zinc-400" /> : 'Generate'}
          </button>
        </div>

        {/* Upload Script & Export */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.json,.csv,.md"
            className="hidden"
          />
          <button
            id="toolbar-upload-script-btn"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Upload className="w-3 h-3 text-zinc-400 stroke-[1.5]" />
            <span>Upload Script</span>
          </button>

          <button
            id="toolbar-export-script-btn"
            onClick={handleExportScript}
            className="h-7 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Download className="w-3 h-3 text-zinc-400 stroke-[1.5]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. CONTINUOUS SCRIPT CANVAS (#0f0f11 background, screenplay style) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 selection:bg-zinc-800 selection:text-zinc-100">
        <div className="max-w-3xl mx-auto space-y-6 font-sans">
          {project.script.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto stroke-[1.5]" />
              <p className="text-zinc-400 text-xs font-light">Script is currently empty. Begin by adding a scene or dialogue entry.</p>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => handleAddScene()}
                  className="px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium text-xs transition inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Clapperboard className="w-4 h-4 text-amber-400 stroke-[1.5]" />
                  <span>+ New Scene</span>
                </button>
                <button
                  onClick={() => handleAddLine()}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-medium text-xs transition inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                  <span>+ New Entry</span>
                </button>
              </div>
            </div>
          ) : (
            project.script.map((line, index) => {
              const isPlayingThisLine = activeLinePlayingId === line.id;
              let innerLineElement = null;

              // SCENE HEADER RENDER
              if (line.isSceneHeader) {
                let currentSceneNum = 0;
                for (let i = 0; i <= index; i++) {
                  if (project.script[i].isSceneHeader) currentSceneNum++;
                }

                innerLineElement = (
                  <div
                    id={`scene-header-${line.id}`}
                    className="group relative my-8 pt-3.5 pb-3 px-4 rounded-xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 border border-zinc-800 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Scene Icon Badge & Editable Scene Title */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 shrink-0 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] font-bold tracking-widest uppercase">
                          <Clapperboard className="w-3.5 h-3.5 stroke-[2] text-amber-400" />
                          <span>SCENE {currentSceneNum}</span>
                        </div>

                        <input
                          type="text"
                          value={line.sceneTitle || line.text || ''}
                          onChange={(e) => {
                            handleUpdateLine(line.id, {
                              sceneTitle: e.target.value,
                              text: e.target.value,
                            });
                          }}
                          placeholder="Scene Title (e.g., Opening Discussion & Host Banter)..."
                          className="bg-transparent text-zinc-100 font-bold text-sm leading-tight focus:outline-none focus:border-b border-amber-500/60 w-full truncate placeholder:text-zinc-600 tracking-wide"
                        />
                      </div>

                      {/* Right: Scene Actions */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                        <div
                          title="Drag to reorder scene"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-3.5 h-3.5 stroke-[1.5]" />
                        </div>

                        <button
                          onClick={() => handleAddLine(index + 1)}
                          title="Add Dialogue Entry to this Scene"
                          className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition flex items-center space-x-1 border border-zinc-700/60"
                        >
                          <Plus className="w-3 h-3 text-emerald-400 stroke-[2]" />
                          <span className="hidden sm:inline">Add Entry</span>
                        </button>

                        <button
                          onClick={() => handleMoveLine(index, 'up')}
                          disabled={index === 0}
                          title="Move Scene Up"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>

                        <button
                          onClick={() => handleMoveLine(index, 'down')}
                          disabled={index === project.script.length - 1}
                          title="Move Scene Down"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>

                        <button
                          onClick={() => handleDeleteLine(line.id)}
                          title="Delete Scene Header"
                          className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // REGULAR DIALOGUE LINE RENDER
                const charTheme = getCharacterColorTheme(
                  line.characterId || line.characterName,
                  undefined,
                  project.characters
                );

                innerLineElement = (
                  <div
                    id={`script-line-${line.id}`}
                    className={`group relative py-3 px-4 pl-6 rounded-md transition duration-150 ${
                      isPlayingThisLine
                        ? 'bg-zinc-800/40 ring-1 ring-zinc-700'
                        : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Color-Coded Side Stripe */}
                    <div
                      className={`absolute left-1.5 top-2.5 bottom-2.5 w-1.5 rounded-full transition-all duration-200 ${charTheme.stripeBg}`}
                      title={`Character: ${line.characterName} (${charTheme.name})`}
                    />

                    {/* Line Header: Speaker Name (#a1a1aa) + Faint Inline Cues + Hover Controls */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center space-x-3 flex-wrap">
                        {/* Speaker Name + Color Tag */}
                        <div className="relative flex items-center space-x-1.5">
                          <select
                            value={line.characterId}
                            onChange={(e) => handleUpdateLine(line.id, { characterId: e.target.value })}
                            className={`bg-transparent font-bold text-xs uppercase tracking-wider cursor-pointer focus:outline-none transition appearance-none pr-4 ${charTheme.badgeText}`}
                          >
                            {project.characters.map((c) => (
                              <option key={c.id} value={c.id} className="bg-[#18181b] text-zinc-200 normal-case font-normal">
                                {c.name} ({c.mainRole})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-zinc-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${charTheme.badgeBg} ${charTheme.badgeText} ${charTheme.badgeBorder} border shrink-0`}>
                            {charTheme.name}
                          </span>
                        </div>

                        {/* Faint Inline Cues: Emotion Note & SFX Cue */}
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Emotion Pill */}
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                            <Smile className="w-2.5 h-2.5 text-zinc-500" />
                            <input
                              type="text"
                              value={line.emotionNote || ''}
                              onChange={(e) => handleUpdateLine(line.id, { emotionNote: e.target.value })}
                              placeholder="[Direction]"
                              className="bg-transparent text-zinc-400 focus:text-zinc-200 focus:outline-none w-20 text-[10px]"
                            />
                          </div>

                          {/* SFX Cue Pill */}
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                            <Music className="w-2.5 h-2.5 text-zinc-500" />
                            <select
                              value={line.sfxCue || ''}
                              onChange={(e) => handleUpdateLine(line.id, { sfxCue: e.target.value })}
                              className="bg-transparent text-zinc-400 focus:text-zinc-200 focus:outline-none text-[10px] cursor-pointer"
                            >
                              {SFX_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value} className="bg-[#18181b] text-zinc-200">
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Hover Line Controls: Only appear on hover over specific line */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div
                          title="Drag to reorder dialogue turn"
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-3.5 h-3.5 stroke-[1.5]" />
                        </div>

                        <button
                          onClick={() => handlePreviewLineAudio(line)}
                          disabled={isPlayingThisLine}
                          title="Preview Audio"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                        >
                          {isPlayingThisLine ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          )}
                        </button>

                        <button
                          onClick={() => handleMoveLine(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>

                        <button
                          onClick={() => handleMoveLine(index, 'down')}
                          disabled={index === project.script.length - 1}
                          title="Move Down"
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>

                        <button
                          onClick={() => handleDeleteLine(line.id)}
                          title="Delete Line"
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Spoken Text: Clean typography with direct inline text editing */}
                    <textarea
                      rows={Math.max(1, Math.ceil((line.text || '').length / 75))}
                      value={line.text}
                      onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                      placeholder="Type dialogue..."
                      className="w-full bg-transparent text-[#f4f4f5] text-sm leading-relaxed font-sans font-light resize-none focus:outline-none border-b border-transparent focus:border-zinc-700/60 transition p-0 placeholder:text-zinc-700"
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
                    draggedIndex === index ? 'opacity-30 border-2 border-dashed border-amber-500/60 rounded-lg' : ''
                  } ${
                    dragOverIndex === index && draggedIndex !== index ? 'border-t-4 border-t-amber-500 pt-1' : ''
                  }`}
                >
                  {innerLineElement}
                </div>
              );
            })
          )}

          {/* Bottom Control Section: Prominent + Button Menu after last entry in script */}
          {project.script.length > 0 && (
            <div className="pt-8 pb-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <button
                  id="script-add-menu-btn"
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className="px-5 py-2.5 rounded-full bg-[#18181b] hover:bg-[#27272a] text-zinc-100 font-semibold text-xs border border-zinc-700/80 shadow-md transition flex items-center space-x-2 group cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition">
                    <Plus className="w-3.5 h-3.5 text-zinc-200 stroke-[2.5]" />
                  </div>
                  <span>Add to Script</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${isPlusMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPlusMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsPlusMenuOpen(false)} 
                    />

                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#18181b] border border-zinc-700 rounded-xl shadow-xl p-1.5 z-20 font-sans text-xs">
                      <button
                        id="add-new-entry-btn"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          handleAddLine();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center space-x-2.5 transition font-medium cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                        <span>New Entry</span>
                      </button>

                      <button
                        id="add-new-scene-btn"
                        onClick={() => {
                          setIsPlusMenuOpen(false);
                          handleAddScene();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center space-x-2.5 transition font-medium cursor-pointer"
                      >
                        <Clapperboard className="w-4 h-4 text-amber-400 stroke-[1.5]" />
                        <span>New Scene</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Action Pills (New Entry, New Scene, Undo, Redo) */}
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => handleAddLine()}
                  className="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>New Entry</span>
                </button>

                <button
                  onClick={() => handleAddScene()}
                  className="px-3 py-1.5 rounded-full border border-amber-900/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-200 text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                >
                  <Clapperboard className="w-3 h-3 text-amber-400" />
                  <span>New Scene</span>
                </button>

                <div className="h-4 w-px bg-zinc-800 mx-1" />

                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="px-2.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 text-xs font-medium transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Undo className="w-3 h-3" />
                  <span>Undo</span>
                </button>

                <button
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  title="Redo (Ctrl+Y)"
                  className="px-2.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 text-xs font-medium transition flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Redo className="w-3 h-3" />
                  <span>Redo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
