import React, { useState } from 'react';
import { PodcastProject } from '../../types';
import { exportProject, ExportFormat } from '../../lib/exportUtils';
import { generateMultiTrackStems, RenderedStem } from '../../lib/stemAudioExporter';
import { 
  X, 
  Download, 
  FileAudio, 
  Rss, 
  FileText, 
  FileCode, 
  Check, 
  Sparkles,
  Layers,
  Radio,
  Sliders,
  Volume2
} from 'lucide-react';

interface ExportModalProps {
  project: PodcastProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stems' | 'standard'>('stems');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('mp3');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isRenderingStems, setIsRenderingStems] = useState(false);
  const [renderedStems, setRenderedStems] = useState<RenderedStem[] | null>(null);
  const [downloadedStemId, setDownloadedStemId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen || !project) return null;

  const handleGenerateStems = async () => {
    setIsRenderingStems(true);
    setExportStatus('Synthesizing AI voices with Gemini Flash TTS...');
    try {
      const stems = await generateMultiTrackStems(project, (msg) => setExportStatus(msg));
      setRenderedStems(stems);
    } catch (e) {
      console.error('Failed to generate audio stems:', e);
    } finally {
      setIsRenderingStems(false);
      setExportStatus('');
    }
  };

  const downloadStem = (stem: RenderedStem) => {
    const url = URL.createObjectURL(stem.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = stem.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setDownloadedStemId(stem.id);
    setTimeout(() => setDownloadedStemId(null), 2000);
  };

  const handleDownloadAllStems = () => {
    if (!renderedStems) return;
    renderedStems.forEach((stem, idx) => {
      setTimeout(() => {
        downloadStem(stem);
      }, idx * 400);
    });
  };

  const handleStandardExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing audio export...');
    try {
      await exportProject(project, selectedFormat, (msg) => setExportStatus(msg));
      setIsExporting(false);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    } finally {
      setExportStatus('');
    }
  };

  const formats: Array<{ id: ExportFormat; title: string; subtitle: string; icon: React.ReactNode; ext: string }> = [
    {
      id: 'mp3',
      title: 'Full Episode Master (MP3)',
      subtitle: 'Broadcast-quality 192kbps MP3 audio with Gemini AI voices (.mp3)',
      icon: <FileAudio className="w-5 h-5 text-[#C85A32]" />,
      ext: '.mp3',
    },
    {
      id: 'wav',
      title: 'Lossless Master Audio (WAV)',
      subtitle: 'High-fidelity 16-bit PCM uncompressed broadcast audio (.wav)',
      icon: <FileAudio className="w-5 h-5 text-[#C85A32]" />,
      ext: '.wav',
    },
    {
      id: 'rss',
      title: 'Podcast RSS Feed Structure',
      subtitle: 'Valid RSS 2.0 XML with iTunes tags (.xml)',
      icon: <Rss className="w-5 h-5 text-[#C85A32]" />,
      ext: '.xml',
    },
    {
      id: 'json',
      title: 'JSON Project Workspace Backup',
      subtitle: 'Complete data structure with characters & audio cues (.json)',
      icon: <FileCode className="w-5 h-5 text-[#C85A32]" />,
      ext: '.json',
    },
    {
      id: 'txt',
      title: 'Screenplay Transcript',
      subtitle: 'Formatted readable script & show notes (.txt)',
      icon: <FileText className="w-5 h-5 text-[#C85A32]" />,
      ext: '.txt',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans text-xs animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0D4C3] flex items-center justify-between bg-[#EDE5D8] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#2E2623]">Audio & Project Export Studio</h3>
              <p className="text-[11px] text-[#786B62]">Export multi-track audio stems or project packages for "{project.title}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3]/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Mode Tabs */}
        <div className="flex border-b border-[#E0D4C3] bg-[#F5EFE6] px-6 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('stems')}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'stems'
                ? 'border-[#C85A32] text-[#C85A32]'
                : 'border-transparent text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Multi-Track Audio Stems (WAV)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#C85A32]/10 text-[#C85A32] font-mono">
              5 Tracks
            </span>
          </button>

          <button
            onClick={() => setActiveTab('standard')}
            className={`pb-2.5 px-3 font-semibold text-xs border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'standard'
                ? 'border-[#C85A32] text-[#C85A32]'
                : 'border-transparent text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Standard Bundles & Transcripts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'stems' ? (
            <div className="space-y-4">
              <div className="bg-[#F5EFE6] border border-[#E0D4C3] rounded-xl p-4 flex items-start space-x-3">
                <Radio className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#2E2623] text-xs">Radio Broadcast Stems Rendering</h4>
                  <p className="text-[11px] text-[#786B62] mt-0.5">
                    Separates your radio drama or episode into isolated, high-fidelity uncompressed WAV audio stems for professional DAW editing in Pro Tools, Ableton, or Audacity.
                  </p>
                </div>
              </div>

              {!renderedStems ? (
                <div className="py-8 border border-dashed border-[#D8CAB8] rounded-xl bg-[#FAF6EE] text-center space-y-3">
                  <Sliders className="w-8 h-8 text-[#A39587] mx-auto" />
                  <div>
                    <div className="font-semibold text-[#2E2623] text-sm">Generate Multi-Track Audio Stems</div>
                    <div className="text-[11px] text-[#786B62]">
                      Click below to render isolated Dialogue, Music, SFX, and Commercial stems via Web Audio.
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateStems}
                    disabled={isRenderingStems}
                    className="px-5 py-2.5 rounded-lg bg-[#C85A32] hover:bg-[#B04C28] text-white font-semibold transition inline-flex items-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    {isRenderingStems ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Rendering Stems via Web Audio...</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>Render All 5 Stems Now</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#786B62] text-[11px] uppercase tracking-wider">
                      Rendered Audio Stems (5 Files Ready)
                    </span>
                    <button
                      onClick={handleDownloadAllStems}
                      className="px-3 py-1.5 rounded-md bg-[#C85A32] text-white hover:bg-[#B04C28] font-semibold text-xs inline-flex items-center space-x-1.5 transition shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download All Stems</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {renderedStems.map((stem) => (
                      <div
                        key={stem.id}
                        className="bg-[#F5EFE6] border border-[#E0D4C3] rounded-xl p-3 flex items-center justify-between hover:border-[#C85A32]/40 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E0D4C3] text-[#C85A32] shrink-0">
                            {stem.id === 'master' ? (
                              <Volume2 className="w-4 h-4" />
                            ) : stem.id === 'ad_breaks' ? (
                              <Radio className="w-4 h-4" />
                            ) : (
                              <Sliders className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#2E2623] text-xs flex items-center space-x-2">
                              <span>{stem.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EDE5D8] border border-[#E0D4C3] text-[#786B62]">
                                WAV • ~{Math.round(stem.durationSec)}s
                              </span>
                            </div>
                            <div className="text-[11px] text-[#786B62]">{stem.description}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => downloadStem(stem)}
                          className={`px-3 py-1.5 rounded-lg border font-medium text-xs flex items-center space-x-1.5 transition ${
                            downloadedStemId === stem.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-[#FAF6EE] hover:bg-[#EDE5D8] text-[#2E2623] border-[#E0D4C3]'
                          }`}
                        >
                          {downloadedStemId === stem.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Downloaded</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-[#C85A32]" />
                              <span>Save .WAV</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-[11px] font-semibold text-[#786B62] uppercase tracking-wider mb-2">
                Select Package Format
              </label>

              <div className="space-y-2">
                {formats.map((fmt) => {
                  const isSelected = selectedFormat === fmt.id;
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#EDE5D8] border-[#C85A32] shadow-xs ring-1 ring-[#C85A32]/30'
                          : 'bg-[#F5EFE6] border-[#E0D4C3] hover:bg-[#EDE5D8]/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E0D4C3] shrink-0">
                          {fmt.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2E2623] text-sm">{fmt.title}</div>
                          <div className="text-[11px] text-[#786B62]">{fmt.subtitle}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EE] border border-[#E0D4C3] text-[#786B62]">
                          {fmt.ext}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#C85A32] bg-[#C85A32]' : 'border-[#A39587]'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E0D4C3] bg-[#EDE5D8] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#786B62] flex items-center space-x-2">
            <span>Target: <span className="font-semibold text-[#2E2623]">{project.title}</span></span>
            {exportStatus && (
              <span className="px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/20 font-medium flex items-center space-x-1 animate-pulse">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>{exportStatus}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#FAF6EE] hover:bg-[#E0D4C3]/60 text-[#2E2623] border border-[#E0D4C3] font-medium transition"
            >
              Close
            </button>
            {activeTab === 'standard' && (
              <button
                onClick={handleStandardExport}
                disabled={isExporting || successMessage}
                className="px-5 py-2 rounded-lg bg-[#C85A32] hover:bg-[#B04C28] text-white font-semibold transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {successMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Exported Successfully!</span>
                  </>
                ) : isExporting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{exportStatus || 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export MP3 / File</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

