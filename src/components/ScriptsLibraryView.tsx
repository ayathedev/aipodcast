import React, { useState } from 'react';
import { PodcastProject, ScriptLine } from '../types';
import { FileText, Search, Volume2 } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine';

interface ScriptsLibraryViewProps {
  projects: PodcastProject[];
  onOpenProject: (id: string) => void;
}

export const ScriptsLibraryView: React.FC<ScriptsLibraryViewProps> = ({
  projects,
  onOpenProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // Collect all lines across all projects
  const allLines: Array<ScriptLine & { projectTitle: string; projectId: string }> = [];
  projects.forEach((p) => {
    p.script.forEach((l) => {
      allLines.push({
        ...l,
        projectTitle: p.title,
        projectId: p.id,
      });
    });
  });

  const filteredLines = allLines.filter(
    (l) =>
      l.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreviewLineAudio = (line: ScriptLine) => {
    setPlayingLineId(line.id);
    if (line.sfxCue) audioEngine.playSFX(line.sfxCue);

    const voiceConfig = {
      voiceName: 'Zephyr',
      pitch: 1.0,
      rate: 1.0,
      gender: 'Male' as const,
      tone: 'Warm',
      emotionStyle: 'Enthusiastic' as const,
    };

    audioEngine.speakLine(line.text, voiceConfig, () => {
      setPlayingLineId(null);
    });
  };

  return (
    <div id="scripts-library-view" className="p-8 md:p-12 space-y-6 max-w-5xl mx-auto font-sans text-xs text-[#2E2623] bg-[#F5EFE6] min-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E0D4C3]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#2E2623] flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
            <span>Scripts & Logs</span>
          </h1>
          <p className="text-xs text-[#786B62] mt-0.5 font-normal">
            Screenplay dialogue logs across all projects
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#786B62] absolute left-2.5 top-2.5 stroke-[1.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dialogue text..."
            className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs pl-8 pr-3 py-1.5 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
          />
        </div>
      </div>

      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E0D4C3] text-[10px] font-mono uppercase tracking-wider text-[#786B62] bg-[#EDE5D8]">
                <th className="py-2.5 px-4 font-semibold">Speaker & Project</th>
                <th className="py-2.5 px-4 font-semibold">Dialogue Text</th>
                <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0D4C3]">
              {filteredLines.map((line) => (
                <tr key={line.id} className="hover:bg-[#EDE5D8]/50 transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-[#2E2623]">{line.characterName}</div>
                    <button
                      onClick={() => onOpenProject(line.projectId)}
                      className="text-[10px] text-[#786B62] hover:text-[#C85A32] block font-mono font-medium"
                    >
                      {line.projectTitle}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-[#2E2623] max-w-md font-sans font-normal leading-relaxed">
                    "{line.text}"
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handlePreviewLineAudio(line)}
                      disabled={playingLineId === line.id}
                      className="p-1.5 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
                      title="Preview Line Audio"
                    >
                      <Volume2 className="w-3.5 h-3.5 stroke-[1.5] text-[#C85A32]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
