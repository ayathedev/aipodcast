import React, { useState } from 'react';
import { PodcastProject, ScriptLine, Character } from '../../types';
import { 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Volume2, 
  Loader2, 
  ChevronDown, 
  FileText, 
  Music, 
  Smile, 
  Clock,
  Sparkles,
  GripVertical
} from 'lucide-react';
import { audioEngine } from '../../lib/audioEngine';
import { formatAdobeTimecode } from './AdobeTopBar';

interface ScriptCanvasPanelProps {
  project: PodcastProject;
  onUpdateScript: (script: ScriptLine[]) => void;
  activeLinePlayingId: string | null;
  onPreviewLine: (line: ScriptLine) => void;
  currentTimeSec: number;
  onSelectLine: (lineId: string) => void;
  selectedLineId: string | null;
}

const SFX_OPTIONS = [
  { value: '', label: 'No SFX' },
  { value: 'intro_chime', label: 'Intro Chime' },
  { value: 'dramatic_boom', label: 'Dramatic Boom' },
  { value: 'keyboard_clicks', label: 'Keyboard Typing' },
  { value: 'applause', label: 'Applause' },
  { value: 'laughter', label: 'Laughter' },
];

export const ScriptCanvasPanel: React.FC<ScriptCanvasPanelProps> = ({
  project,
  onUpdateScript,
  activeLinePlayingId,
  onPreviewLine,
  currentTimeSec,
  onSelectLine,
  selectedLineId,
}) => {
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add new line turn
  const handleAddLine = () => {
    const defaultChar = project.characters[0] || { id: 'char-1', name: 'Host' };
    const newLine: ScriptLine = {
      id: 'line-' + Date.now(),
      characterId: defaultChar.id,
      characterName: defaultChar.name,
      text: '',
      emotionNote: '[Speaks naturally]',
      sfxCue: '',
    };

    onUpdateScript([...project.script, newLine]);
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

    onUpdateScript(updated);
  };

  const handleDeleteLine = (id: string) => {
    onUpdateScript(project.script.filter((l) => l.id !== id));
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.script.length) return;

    const newScript = [...project.script];
    const temp = newScript[index];
    newScript[index] = newScript[targetIndex];
    newScript[targetIndex] = temp;

    onUpdateScript(newScript);
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

    onUpdateScript(newScript);
  };

  // Compute estimated line start timecode
  let currentAccumulatedSec = 0;

  return (
    <main className="flex-1 bg-[#1E1E1E] flex flex-col h-full overflow-hidden select-text text-[#CCCCCC] font-sans text-[11px]">
      {/* Panel Top Header Bar */}
      <div className="h-7 bg-[#2D2D2D] border-b border-[#3B3B3B] px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <FileText className="w-3.5 h-3.5 text-[#00A8C6]" />
          <span className="font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px]">
            Script & Screenplay Sequence Canvas
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[10px] text-[#888888]">
          <span>Format: Screenplay Standard</span>
          <span className="text-[#3B3B3B]">|</span>
          <span className="text-[#00A8C6]">{project.script.length} Dialogue Blocks</span>
        </div>
      </div>

      {/* Script Canvas Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 bg-[#1B1B1B]">
        {project.script.length === 0 ? (
          <div className="py-24 text-center space-y-3 font-mono">
            <FileText className="w-8 h-8 text-[#555555] mx-auto" />
            <p className="text-[#777777] text-xs">No screenplay lines in project.</p>
            <button
              onClick={handleAddLine}
              className="px-3 py-1 bg-[#264F78] hover:bg-[#2F5D8E] text-white font-sans text-xs rounded-[2px] transition inline-flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Dialogue Line</span>
            </button>
          </div>
        ) : (
          project.script.map((line, index) => {
            const isPlayingThisLine = activeLinePlayingId === line.id;
            const isSelected = selectedLineId === line.id;

            // Approximate line duration based on word count
            const lineWordCount = (line.text || '').split(/\s+/).filter(Boolean).length;
            const estimatedDuration = Math.max(2.5, lineWordCount * 0.45);
            const lineStartSec = currentAccumulatedSec;
            currentAccumulatedSec += estimatedDuration;

            const timecodeStr = formatAdobeTimecode(lineStartSec);

            return (
              <div
                key={line.id}
                onClick={() => onSelectLine(line.id)}
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
                className={`group relative p-2.5 rounded-[2px] border transition-all duration-100 ${
                  draggedIndex === index
                    ? 'opacity-30 border-dashed border-[#00A8C6]'
                    : dragOverIndex === index
                    ? 'border-t-2 border-t-[#00A8C6] bg-[#2A2A2A]'
                    : isPlayingThisLine
                    ? 'bg-[#264F78]/40 border-[#00A8C6] shadow-sm'
                    : isSelected
                    ? 'bg-[#252525] border-[#264F78]'
                    : 'bg-[#222222] border-[#333333] hover:border-[#444444]'
                }`}
              >
                {/* Line Header: Line Number | Timecode | Speaker Name | Inline Technical Marker | Actions */}
                <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[10px] select-none">
                  <div className="flex items-center space-x-3 flex-wrap">
                    {/* Line Index & Timecode Trigger Marker */}
                    <div className="flex items-center space-x-1.5 text-[#777777] shrink-0">
                      <span className="text-[9px] text-[#555555]">{(index + 1).toString().padStart(3, '0')}</span>
                      <span className="text-[#333333]">|</span>
                      <span className="text-[#00A8C6] flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5 inline" />
                        <span>{timecodeStr}</span>
                      </span>
                    </div>

                    {/* Speaker Selector: Bold Uppercase Silver */}
                    <div className="relative flex items-center font-sans">
                      <select
                        value={line.characterId}
                        onChange={(e) => handleUpdateLine(line.id, { characterId: e.target.value })}
                        className="bg-transparent text-[#E0E0E0] font-bold text-xs uppercase tracking-wider cursor-pointer focus:outline-none hover:text-white transition appearance-none pr-4"
                      >
                        {project.characters.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#222222] text-[#CCCCCC] normal-case font-normal">
                            {c.name} ({c.mainRole})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#777777] absolute right-0 pointer-events-none" />
                    </div>

                    {/* Inline Technical Markers (TC / Emotion / SFX) */}
                    <div className="inline-flex items-center space-x-1.5 text-[9px] font-mono">
                      {/* Direction Tag */}
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-[#181818] border border-[#3B3B3B] text-[#9E9E9E] rounded-[2px]">
                        <Smile className="w-2.5 h-2.5 text-[#00A8C6]" />
                        <input
                          type="text"
                          value={line.emotionNote || ''}
                          onChange={(e) => handleUpdateLine(line.id, { emotionNote: e.target.value })}
                          placeholder="[Direction]"
                          className="bg-transparent text-[#CCCCCC] focus:outline-none w-24 text-[9px]"
                        />
                      </span>

                      {/* SFX Marker */}
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-[#181818] border border-[#3B3B3B] text-[#9E9E9E] rounded-[2px]">
                        <Music className="w-2.5 h-2.5 text-[#00A8C6]" />
                        <select
                          value={line.sfxCue || ''}
                          onChange={(e) => handleUpdateLine(line.id, { sfxCue: e.target.value })}
                          className="bg-transparent text-[#CCCCCC] focus:outline-none text-[9px] cursor-pointer"
                        >
                          {SFX_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value} className="bg-[#222222] text-[#CCCCCC]">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                  </div>

                  {/* Line Actions: Preview, Move, Delete */}
                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                    <div
                      title="Drag to reorder line"
                      className="p-1 rounded-[2px] bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#888888] hover:text-white transition cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-3 h-3 text-[#888888]" />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewLine(line);
                      }}
                      disabled={isPlayingThisLine}
                      title="Preview Dialogue Audio"
                      className="p-1 rounded-[2px] bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#CCCCCC] hover:text-white transition"
                    >
                      {isPlayingThisLine ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#00A8C6]" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-[#00A8C6]" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLine(index, 'up');
                      }}
                      disabled={index === 0}
                      title="Move Up"
                      className="p-1 rounded-[2px] bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#888888] hover:text-white transition disabled:opacity-20"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLine(index, 'down');
                      }}
                      disabled={index === project.script.length - 1}
                      title="Move Down"
                      className="p-1 rounded-[2px] bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#888888] hover:text-white transition disabled:opacity-20"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLine(line.id);
                      }}
                      title="Delete Line"
                      className="p-1 rounded-[2px] bg-[#2D2D2D] hover:bg-[#A82B2B] text-[#888888] hover:text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Spoken Dialogue Textarea (Screenplay Style) */}
                <textarea
                  rows={Math.max(1, Math.ceil((line.text || '').length / 85))}
                  value={line.text}
                  onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                  placeholder="Type dialogue script text..."
                  className="w-full bg-transparent text-[#F0F0F0] text-xs leading-relaxed font-sans font-normal resize-none focus:outline-none border-b border-transparent focus:border-[#00A8C6] transition p-0 placeholder:text-[#555555]"
                />
              </div>
            );
          })
        )}

        {/* Continuous Insert Dialogue Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleAddLine}
            className="px-4 py-1.5 bg-[#252525] hover:bg-[#2F2F2F] text-[#CCCCCC] hover:text-white border border-[#3B3B3B] text-xs font-medium rounded-[2px] transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#00A8C6]" />
            <span>+ Add Dialogue Line (At Playhead)</span>
          </button>
        </div>
      </div>
    </main>
  );
};
