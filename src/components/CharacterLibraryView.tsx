import React, { useState } from 'react';
import { PodcastProject, Character } from '../types';
import { Users, Search, Volume2, Wand2, Loader2, Mic } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface CharacterLibraryViewProps {
  projects: PodcastProject[];
  onOpenProject: (id: string) => void;
  onUpdateProject?: (project: PodcastProject) => void;
  onOpenVoiceStudio?: (char?: Character) => void;
}

export const CharacterLibraryView: React.FC<CharacterLibraryViewProps> = ({
  projects,
  onOpenProject,
  onUpdateProject,
  onOpenVoiceStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);

  // Collect all unique characters across projects
  const allCharacters: Array<Character & { projectTitle: string; projectId: string }> = [];
  projects.forEach((p) => {
    p.characters.forEach((c) => {
      allCharacters.push({
        ...c,
        projectTitle: p.title,
        projectId: p.id,
      });
    });
  });

  const filteredCharacters = allCharacters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mainRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTestVoice = (char: Character) => {
    setTestingVoiceId(char.id);
    const sampleText = `Hello, I'm ${char.name}, character actor for ${char.mainRole}.`;
    audioEngine.speakLine(sampleText, char.voiceConfig, () => {
      setTestingVoiceId(null);
    });
  };

  const handleGenerateAvatar = async (char: Character & { projectId: string }) => {
    if (!onUpdateProject) return;
    setGeneratingAvatarId(char.id);
    try {
      const prompt = `A portrait avatar of a character named ${char.name}. Role: ${char.mainRole}. Personality: ${char.personality}. Background: ${char.background || 'Unknown'}. Style: digital art, high quality, expressive portrait, centered, single subject.`;
      
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      // Find the project and update the character
      const project = projects.find(p => p.id === char.projectId);
      if (project) {
        const updatedProject = {
          ...project,
          characters: project.characters.map(c => 
            c.id === char.id ? { ...c, avatarUrl: data.imageUrl } : c
          ),
          updatedAt: new Date().toISOString()
        };
        onUpdateProject(updatedProject);
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      alert('Failed to generate avatar. Please try again.');
    } finally {
      setGeneratingAvatarId(null);
    }
  };

  return (
    <div id="character-library-view" className="p-8 md:p-12 space-y-6 max-w-5xl mx-auto font-sans text-xs text-[#2E2623] bg-[#F5EFE6] min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E0D4C3]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#2E2623] flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
            <span>Cast Library</span>
          </h1>
          <p className="text-xs text-[#786B62] mt-0.5 font-normal">
            Voice actors and character profiles across projects
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenVoiceStudio && (
            <button
              onClick={() => onOpenVoiceStudio()}
              className="px-3 py-1.5 rounded-md bg-[#2E2623] hover:bg-[#1F1816] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Voice Studio</span>
            </button>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#786B62] absolute left-2.5 top-2.5 stroke-[1.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs pl-8 pr-3 py-1.5 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Grid of Character Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCharacters.map((char, idx) => (
          <div
            key={`${char.id}-${idx}`}
            className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-4 space-y-3 shadow-xs hover:border-[#D8CAB8] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative group shrink-0">
                  <img
                    src={char.avatarUrl}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-md object-cover border border-[#E0D4C3]"
                  />
                  {onUpdateProject && (
                    <button
                      onClick={() => handleGenerateAvatar(char)}
                      disabled={generatingAvatarId === char.id}
                      className="absolute inset-0 bg-[#2E2623]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                      title="Generate New Avatar"
                    >
                      {generatingAvatarId === char.id ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin stroke-[1.5]" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-white stroke-[1.5]" />
                      )}
                    </button>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-[#2E2623] truncate">{char.name}</div>
                  <div className="text-[11px] text-[#786B62] truncate">{char.mainRole}</div>
                  <button
                    onClick={() => onOpenProject(char.projectId)}
                    className="text-[10px] text-[#786B62] hover:text-[#C85A32] transition truncate block font-medium"
                  >
                    Project: {char.projectTitle}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleTestVoice(char)}
                disabled={testingVoiceId === char.id}
                className="p-1.5 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition shrink-0"
                title="Test Voice Audio"
              >
                <Volume2 className="w-3.5 h-3.5 stroke-[1.5] text-[#C85A32]" />
              </button>
            </div>

            <div className="bg-[#EDE5D8] p-2.5 rounded border border-[#E0D4C3] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#786B62] block font-semibold">Personality</span>
              <p className="text-xs text-[#2E2623] font-normal leading-relaxed line-clamp-2">
                {char.personality}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
