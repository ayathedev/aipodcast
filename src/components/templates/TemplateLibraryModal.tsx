import React, { useState } from 'react';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../../data/projectTemplates';
import { PodcastProject, ScriptLine } from '../../types';
import { getCharacterColorTheme } from '../../lib/characterColors';
import { 
  X, 
  Sparkles, 
  Users, 
  BookOpen, 
  Newspaper, 
  Smile, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Volume2,
  Radio
} from 'lucide-react';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (project: PodcastProject) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>(PROJECT_TEMPLATES[0]);
  const [customTitle, setCustomTitle] = useState('');

  if (!isOpen) return null;

  const handleCreateFromTemplate = () => {
    const titleToUse = customTitle.trim() || selectedTemplate.name;

    // Convert scriptSkeleton to ScriptLine array
    const scriptLines: ScriptLine[] = selectedTemplate.scriptSkeleton.map((item, idx) => {
      if (item.isSceneHeader) {
        return {
          id: 'line-' + Date.now() + '-' + idx,
          characterId: 'SCENE',
          characterName: 'SCENE',
          text: item.text || '',
          isSceneHeader: true,
          sceneTitle: item.sceneTitle || `Scene ${idx + 1}`
        };
      }

      const matchedChar = selectedTemplate.characters.find(
        (c) => c.name.toLowerCase() === item.characterName.toLowerCase()
      ) || selectedTemplate.characters[idx % selectedTemplate.characters.length];

      return {
        id: 'line-' + Date.now() + '-' + idx,
        characterId: matchedChar ? matchedChar.id : 'char-1',
        characterName: matchedChar ? matchedChar.name : item.characterName,
        text: item.text,
        emotionNote: item.emotionNote,
        sfxCue: item.sfxCue,
      };
    });

    const newProject: PodcastProject = {
      id: 'proj-' + Date.now(),
      title: titleToUse,
      tagline: selectedTemplate.tagline,
      description: selectedTemplate.description,
      genre: selectedTemplate.genre,
      coverUrl: selectedTemplate.characters[0]?.avatarUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      mode: 'creator',
      targetDurationMinutes: selectedTemplate.targetDurationMinutes,
      characters: selectedTemplate.characters,
      script: scriptLines,
      bgmTrack: 'ambient_synth',
      soundBoard: ['applause', 'chime', 'dramatic_boom', 'gasp'],
      showNotes: `Episode summary created from template: ${selectedTemplate.name}.\n\nFeatured Cast:\n` +
        selectedTemplate.characters.map((c) => `- ${c.name} (${c.mainRole})`).join('\n'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSelectTemplate(newProject);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Interview':
        return <Users className="w-4 h-4 text-[#C85A32]" />;
      case 'Storytelling':
        return <BookOpen className="w-4 h-4 text-[#C85A32]" />;
      case 'Daily News':
        return <Newspaper className="w-4 h-4 text-[#C85A32]" />;
      case 'Comedy & Banter':
        return <Smile className="w-4 h-4 text-[#C85A32]" />;
      case 'Radio Drama & Broadcast':
        return <Radio className="w-4 h-4 text-[#C85A32]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#C85A32]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans text-xs text-[#2E2623] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0D4C3] flex items-center justify-between bg-[#EDE5D8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
              <Sparkles className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#2E2623]">Podcast Templates Library</h2>
              <p className="text-[11px] text-[#786B62]">Select a structure to prepopulate character roles & script skeleton</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two Column Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E0D4C3]">
          {/* Left Column: Template Cards List (5 Cols) */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2.5 bg-[#F5EFE6]">
            <div className="text-[10px] font-semibold text-[#786B62] uppercase tracking-wider mb-2">
              Available Templates ({PROJECT_TEMPLATES.length})
            </div>

            {PROJECT_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setCustomTitle('');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-2 ${
                    isSelected
                      ? 'bg-[#FAF6EE] border-[#C85A32] ring-1 ring-[#C85A32]/30 shadow-xs'
                      : 'bg-[#EDE5D8]/60 border-[#E0D4C3] hover:bg-[#EDE5D8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-[#FAF6EE] border border-[#E0D4C3]">
                        {getCategoryIcon(tmpl.category)}
                      </div>
                      <span className="font-semibold text-sm text-[#2E2623]">{tmpl.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C85A32]" />}
                  </div>

                  <p className="text-[11px] text-[#786B62] leading-relaxed line-clamp-2">
                    {tmpl.tagline}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-[#786B62]">
                    <span className="px-2 py-0.5 rounded bg-[#FAF6EE] border border-[#E0D4C3] font-medium text-[#2E2623]">
                      {tmpl.genre}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#A39587]" />
                      <span>~{tmpl.targetDurationMinutes}m</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-[#A39587]" />
                      <span>{tmpl.characters.length} Roles</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Template Preview & Skeleton (7 Cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-[#FAF6EE]">
            {/* Template Header Info */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] font-semibold text-[10px] uppercase tracking-wider">
                  {selectedTemplate.category}
                </span>
                <span className="text-[#786B62]">•</span>
                <span className="text-xs text-[#786B62] font-medium">{selectedTemplate.genre}</span>
              </div>

              <h3 className="text-lg font-semibold text-[#2E2623]">{selectedTemplate.name}</h3>
              <p className="text-xs text-[#786B62] leading-relaxed">{selectedTemplate.description}</p>
            </div>

            {/* Character Roles Prepopulated Preview */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#786B62] uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Prepopulated Character Roles ({selectedTemplate.characters.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedTemplate.characters.map((char, index) => {
                  const theme = getCharacterColorTheme(char.id, index, selectedTemplate.characters);
                  return (
                    <div
                      key={char.id}
                      className="p-3 rounded-xl bg-[#EDE5D8] border border-[#E0D4C3] flex items-start space-x-3 relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.stripeBg}`} />
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#E0D4C3] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-[#2E2623] truncate">{char.name}</div>
                        <div className="text-[10px] text-[#C85A32] font-medium">{char.mainRole}</div>
                        <div className="text-[10px] text-[#786B62] truncate mt-0.5">{char.personality}</div>
                        <div className="mt-1 flex items-center space-x-1 text-[9px] text-[#786B62]">
                          <Volume2 className="w-3 h-3 text-[#A39587]" />
                          <span>Voice: {char.voiceConfig.voiceName} ({char.voiceConfig.tone})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Script Skeleton Structure Preview */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#786B62] uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Script Skeleton Preview ({selectedTemplate.scriptSkeleton.length} entries)</span>
              </h4>

              <div className="bg-[#F5EFE6] border border-[#E0D4C3] rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {selectedTemplate.scriptSkeleton.map((item, idx) => {
                  if (item.isSceneHeader) {
                    return (
                      <div key={idx} className="py-1 px-2.5 bg-[#EDE5D8] border border-[#E0D4C3] rounded-md text-[11px] font-semibold text-[#2E2623] flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
                        <span>{item.sceneTitle}</span>
                      </div>
                    );
                  }

                  const theme = getCharacterColorTheme(item.characterName, undefined, selectedTemplate.characters);

                  return (
                    <div key={idx} className="p-2.5 bg-[#FAF6EE] border border-[#E0D4C3] rounded-lg text-xs space-y-1 relative pl-3.5 overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.stripeBg}`} />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${theme.badgeText}`}>{item.characterName}</span>
                        {item.emotionNote && (
                          <span className="text-[10px] text-[#786B62] italic font-mono">{item.emotionNote}</span>
                        )}
                      </div>
                      <p className="text-[#2E2623] text-[11px] leading-relaxed">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Title Input */}
            <div className="space-y-1.5 pt-2 border-t border-[#E0D4C3]">
              <label className="block text-[11px] font-semibold text-[#786B62] uppercase tracking-wider">
                Project Name (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`Default: "${selectedTemplate.name}"`}
                className="w-full bg-[#EDE5D8] border border-[#E0D4C3] rounded-lg px-3 py-2 text-xs text-[#2E2623] focus:outline-none focus:ring-1 focus:ring-[#C85A32] placeholder:text-[#A39587]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E0D4C3] bg-[#EDE5D8] flex items-center justify-between">
          <div className="text-[11px] text-[#786B62]">
            Selected: <span className="font-semibold text-[#2E2623]">{selectedTemplate.name}</span> (~{selectedTemplate.targetDurationMinutes} min)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#FAF6EE] hover:bg-[#E0D4C3]/60 text-[#2E2623] border border-[#E0D4C3] font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFromTemplate}
              className="px-5 py-2 rounded-lg bg-[#C85A32] hover:bg-[#B04C28] text-white font-semibold transition flex items-center space-x-2 shadow-sm"
            >
              <span>Use This Template</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
