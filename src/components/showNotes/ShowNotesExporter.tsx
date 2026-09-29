import React, { useState } from 'react';
import { PodcastProject } from '../../types';
import { exportProject, ExportFormat } from '../../lib/exportUtils';
import { 
  FileText, 
  Copy, 
  Download, 
  Check, 
  Sparkles, 
  Share2, 
  Radio, 
  Calendar, 
  Users, 
  Clock, 
  BookOpen,
  ChevronDown
} from 'lucide-react';

interface ShowNotesExporterProps {
  project: PodcastProject;
  onUpdateProject: (project: PodcastProject) => void;
}

export const ShowNotesExporter: React.FC<ShowNotesExporterProps> = ({
  project,
  onUpdateProject,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('mp3');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleCopyTranscript = () => {
    const fullTranscript = project.script
      .map((l) => `${l.characterName}: ${l.text}`)
      .join('\n\n');

    navigator.clipboard.writeText(fullTranscript);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportProject(project, selectedFormat);
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 500);
  };

  return (
    <div id="shownotes-exporter-container" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans text-xs text-[#2E2623]">
      {/* Header Banner */}
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#2E2623] flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#786B62] stroke-[1.5]" />
            <span>Show Notes & Episode Export</span>
          </h2>
          <p className="text-xs text-[#786B62] mt-0.5 font-normal">
            Export your podcast episode in MP3, WAV, Podcast RSS feed structure, JSON, or TXT screenplay format.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyTranscript}
            className="px-3 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] text-xs font-semibold border border-[#E0D4C3] transition flex items-center space-x-1.5 shadow-xs"
          >
            {copiedText ? <Check className="w-4 h-4 text-[#C85A32]" /> : <Copy className="w-4 h-4 text-[#786B62] stroke-[1.5]" />}
            <span>{copiedText ? 'Copied Transcript!' : 'Copy Transcript'}</span>
          </button>

          {/* Export Format Dropdown & Export Button */}
          <div className="flex items-center bg-[#EDE5D8] border border-[#E0D4C3] rounded-md overflow-hidden shadow-xs">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              className="bg-transparent text-[#2E2623] text-xs font-semibold px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="mp3">MP3 Audio Package (.mp3)</option>
              <option value="wav">WAV Audio Master (.wav)</option>
              <option value="rss">Podcast RSS Feed (.xml)</option>
              <option value="json">JSON Project (.json)</option>
              <option value="txt">Screenplay TXT (.txt)</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold transition flex items-center space-x-1.5 border-l border-[#C85A32]"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Exported!</span>
                </>
              ) : isExporting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[1.5]" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cover Art & Meta Info */}
        <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-6 space-y-4 shadow-xs">
          <img
            src={project.coverUrl}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="w-full h-56 object-cover rounded-lg border border-[#E0D4C3]"
          />

          <div>
            <h3 className="text-base font-semibold text-[#2E2623]">{project.title}</h3>
            <p className="text-xs text-[#786B62] italic mt-0.5">{project.tagline}</p>
          </div>

          <div className="space-y-2 text-xs text-[#2E2623] pt-2 border-t border-[#E0D4C3]">
            <div className="flex items-center justify-between">
              <span className="text-[#786B62]">Genre:</span>
              <span className="font-semibold">{project.genre}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#786B62]">Duration:</span>
              <span className="font-semibold">~{project.targetDurationMinutes} mins</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#786B62]">Cast Count:</span>
              <span className="font-semibold">{project.characters.length} actors</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#786B62]">Dialogue Turns:</span>
              <span className="font-semibold">{project.script.length} lines</span>
            </div>
          </div>
        </div>

        {/* Show Notes Content Editor */}
        <div className="md:col-span-2 bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E0D4C3] pb-3">
            <h3 className="text-sm font-semibold text-[#2E2623]">Episode Show Notes & Key Takeaways</h3>
          </div>

          <textarea
            rows={12}
            value={project.showNotes || ''}
            onChange={(e) => onUpdateProject({ ...project, showNotes: e.target.value })}
            placeholder="Write or edit episode show notes here..."
            className="w-full bg-[#F5EFE6] text-[#2E2623] text-xs p-4 rounded-lg border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] leading-relaxed font-mono shadow-xs"
          />
        </div>
      </div>
    </div>
  );
};
