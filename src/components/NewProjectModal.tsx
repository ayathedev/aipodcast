import React, { useState } from 'react';
import { PodcastProject, PodcastGenre } from '../types';
import { X, Sliders, Zap, Loader2 } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCreatorProject: (data: {
    title: string;
    tagline: string;
    description: string;
    genre: PodcastGenre;
    targetDurationMinutes: number;
  }) => void;
  onCreateGenerativeProject: (data: {
    topic: string;
    genre: PodcastGenre;
    podcastStyle: string;
    targetDurationMinutes: number;
    musicMood: string;
  }) => Promise<void>;
}

const GENRES: PodcastGenre[] = [
  'Tech & AI',
  'True Crime',
  'Comedy & Banter',
  'Sci-Fi & Cyberpunk',
  'Business & Finance',
  'Educational / Science',
  'Storytelling & Drama',
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateCreatorProject,
  onCreateGenerativeProject,
}) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'generative'>('creator');
  const [isGenerating, setIsGenerating] = useState(false);

  // Creator form state
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<PodcastGenre>('Tech & AI');
  const [targetDuration, setTargetDuration] = useState(5);

  // Generative form state
  const [topicPrompt, setTopicPrompt] = useState('');
  const [podcastStyle, setPodcastStyle] = useState('Debate & Banter');
  const [musicMood, setMusicMood] = useState('tech_ambient');

  if (!isOpen) return null;

  const handleCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateCreatorProject({
      title: title.trim(),
      tagline: tagline.trim() || 'A new AI podcast project',
      description: description.trim() || 'Custom created podcast project.',
      genre,
      targetDurationMinutes: targetDuration,
    });
    onClose();
  };

  const handleGenerativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) return;

    setIsGenerating(true);
    try {
      await onCreateGenerativeProject({
        topic: topicPrompt.trim(),
        genre,
        podcastStyle,
        targetDurationMinutes: targetDuration,
        musicMood,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="new-project-modal-backdrop" className="fixed inset-0 z-50 bg-[#2E2623]/30 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
      <div id="new-project-modal-box" className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E0D4C3] flex items-center justify-between bg-[#F5EFE6]">
          <div>
            <h2 className="text-sm font-semibold text-[#2E2623]">Create New Project</h2>
            <p className="text-[11px] text-[#786B62] mt-0.5">Select configuration mode</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#EDE5D8] border-b border-[#E0D4C3] gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('creator')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-medium transition ${
              activeTab === 'creator'
                ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Manual Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generative')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-medium transition ${
              activeTab === 'generative'
                ? 'bg-[#FAF6EE] text-[#2E2623] border border-[#E0D4C3] shadow-xs font-semibold'
                : 'text-[#786B62] hover:text-[#2E2623]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 stroke-[1.5] text-[#C85A32]" />
            <span>Generative AI Mode</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'creator' ? (
            <form onSubmit={handleCreatorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#2E2623] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Chronicles"
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E2623] mb-1">
                  Tagline / Premise
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Uncovering hidden signals in high-tech cities"
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2E2623] mb-1">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as PodcastGenre)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2E2623] mb-1">
                    Target Duration
                  </label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                  >
                    <option value={2}>2 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2E2623] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of this podcast series..."
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs p-3 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#786B62] hover:text-[#2E2623] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGenerativeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#2E2623] mb-1">
                  Topic Prompt *
                </label>
                <textarea
                  required
                  rows={3}
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="Describe your podcast concept in detail..."
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs p-3 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2E2623] mb-1">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as PodcastGenre)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2E2623] mb-1">
                    Style
                  </label>
                  <select
                    value={podcastStyle}
                    onChange={(e) => setPodcastStyle(e.target.value)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                  >
                    <option value="Debate & Banter">Debate & Banter</option>
                    <option value="In-depth Interview">In-depth Interview</option>
                    <option value="Audio Drama / Storytelling">Audio Drama / Storytelling</option>
                    <option value="Radio Drama & Live Broadcast">Radio Drama & Live Broadcast</option>
                    <option value="Co-hosted Casual Talk">Co-hosted Casual Talk</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="px-3.5 py-1.5 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#786B62] hover:text-[#2E2623] text-xs font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-1.5 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold flex items-center space-x-2 disabled:opacity-50 shadow-xs"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Project</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
