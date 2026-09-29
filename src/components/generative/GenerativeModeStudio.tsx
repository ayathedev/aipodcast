import React, { useState } from 'react';
import { PodcastProject, PodcastGenre } from '../../types';
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Radio, 
  Sliders, 
  Users, 
  FileText, 
  Play,
  ArrowRight
} from 'lucide-react';

interface GenerativeModeStudioProps {
  project: PodcastProject;
  onUpdateProject: (updated: PodcastProject) => void;
  onSwitchToTab: (tab: string) => void;
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

export const GenerativeModeStudio: React.FC<GenerativeModeStudioProps> = ({
  project,
  onUpdateProject,
  onSwitchToTab,
}) => {
  const [topicPrompt, setTopicPrompt] = useState(project.description || '');
  const [genre, setGenre] = useState<PodcastGenre>(project.genre || 'Tech & AI');
  const [podcastStyle, setPodcastStyle] = useState('Debate & Banter');
  const [musicMood, setMusicMood] = useState('tech_ambient');
  const [targetDuration, setTargetDuration] = useState(project.targetDurationMinutes || 5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const handleRunGenerativeAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationStep(1);

    try {
      // Step 1: Request Gemini server
      const stepInterval = setInterval(() => {
        setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1200);

      const res = await fetch('/api/gemini/generative-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicPrompt.trim(),
          genre,
          podcastStyle,
          targetDurationMinutes: targetDuration,
          musicMood,
        }),
      });

      clearInterval(stepInterval);
      setGenerationStep(5);

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate podcast episode');
      }

      if (data.projectData) {
        const pd = data.projectData;

        // Build characters with IDs
        const generatedCharacters = (pd.characters || []).map((c: any, idx: number) => ({
          id: 'gen-char-' + Date.now() + '-' + idx,
          name: c.name || `Host ${idx + 1}`,
          avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?w=400&auto=format&fit=crop&q=80`,
          mainRole: c.mainRole || 'Co-Host',
          personality: c.personality || 'Vibrant persona',
          quirks: c.quirks || 'Unique habit',
          background: c.background || 'Interesting backstory',
          voiceConfig: {
            voiceName: c.voiceConfig?.voiceName || (idx === 0 ? 'Zephyr' : 'Kore'),
            gender: c.voiceConfig?.gender || 'Male',
            pitch: c.voiceConfig?.pitch || 1.0,
            rate: c.voiceConfig?.rate || 1.0,
            tone: c.voiceConfig?.tone || 'Warm',
            emotionStyle: c.voiceConfig?.emotionStyle || 'Enthusiastic',
          },
          relationships: (c.relationships || []).map((r: any, rIdx: number) => ({
            id: 'rel-' + Date.now() + '-' + rIdx,
            targetCharacterId: '',
            targetCharacterName: r.targetCharacterName || 'Co-Host',
            relationshipType: r.relationshipType || 'Co-Host',
            notes: r.notes || 'Colleague relationship',
          })),
        }));

        // Build script lines with IDs
        const generatedScript = (pd.script || []).map((l: any, sIdx: number) => {
          const matchedChar = generatedCharacters.find(
            (c: any) => c.name.toLowerCase() === (l.characterName || '').toLowerCase()
          ) || generatedCharacters[sIdx % generatedCharacters.length] || { id: 'gen-char-0', name: 'Host' };

          return {
            id: 'gen-line-' + Date.now() + '-' + sIdx,
            characterId: matchedChar.id,
            characterName: matchedChar.name,
            text: l.text || '',
            emotionNote: l.emotionNote || '[Natural]',
            sfxCue: l.sfxCue || '',
          };
        });

        const updatedProject: PodcastProject = {
          ...project,
          title: pd.title || project.title,
          tagline: pd.tagline || project.tagline,
          description: pd.description || project.description,
          genre: (pd.genre as PodcastGenre) || genre,
          mode: 'generative',
          targetDurationMinutes: targetDuration,
          bgmTrack: musicMood,
          characters: generatedCharacters,
          script: generatedScript,
          showNotes: pd.showNotes || `Show notes for ${pd.title}`,
          updatedAt: new Date().toISOString(),
        };

        onUpdateProject(updatedProject);
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationStep(0);
          onSwitchToTab('studio');
        }, 800);
      }
    } catch (err) {
      console.error('Generative automation error:', err);
      alert('Generation failed. Please try again.');
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  return (
    <div id="generative-mode-studio-container" className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-xs text-[#2E2623]">
      {/* Banner */}
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3] text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 fill-[#C85A32] text-[#C85A32]" />
              <span>Generative Mode (Prompt-to-Podcast Automation)</span>
            </div>
            <h2 className="text-xl font-semibold text-[#2E2623]">Automate Entire Episode Production</h2>
            <p className="text-xs text-[#786B62] max-w-xl leading-relaxed font-normal">
              Enter a single premise or prompt. Gemini Flash will generate character sheets, establish relationship networks, draft multi-turn dialogue scripts with SFX cues, configure voice actor presets, and prepare the Podcast Studio!
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSwitchToTab('studio')}
              className="px-4 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] text-xs font-semibold border border-[#E0D4C3] transition flex items-center space-x-2 shadow-xs"
            >
              <Radio className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
              <span>Go to Audio Studio</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Form or Progress Visualizer */}
      {isGenerating ? (
        <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-8 text-center space-y-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE5D8] border border-[#E0D4C3] flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-7 h-7 text-[#C85A32]" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#2E2623]">Generating Podcast Episode with Gemini...</h3>
            <p className="text-xs text-[#786B62] mt-1 font-normal">Please wait while AI builds your characters, script, and voice presets.</p>
          </div>

          {/* Step Progress Checklist */}
          <div className="max-w-md mx-auto space-y-2.5 text-left pt-2">
            {[
              '1. Casting Character Ensemble & Traits',
              '2. Building Clickable Relationship Links',
              '3. Writing Multi-Speaker Screenplay & SFX Cues',
              '4. Configuring Voice Actors & Audio Profiles',
              '5. Preparing Audio Studio & Show Notes',
            ].map((stepText, idx) => {
              const stepNum = idx + 1;
              const isDone = generationStep > stepNum;
              const isCurrent = generationStep === stepNum;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-md border transition ${
                    isDone
                      ? 'bg-amber-100/60 border-amber-300 text-[#2E2623]'
                      : isCurrent
                      ? 'bg-[#EDE5D8] border-[#C85A32] text-[#2E2623] animate-pulse font-semibold'
                      : 'bg-[#FAF6EE] border-[#E0D4C3] text-[#A39587]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#C85A32] shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[#C85A32] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#E0D4C3] text-[10px] flex items-center justify-center font-semibold text-[#A39587] shrink-0">
                      {stepNum}
                    </div>
                  )}
                  <span className="text-xs font-medium">{stepText}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleRunGenerativeAutomation} className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-base font-semibold text-[#2E2623] flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#C85A32] stroke-[1.5]" />
            <span>Podcast Prompt & Setup Controls</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-[#2E2623] mb-1.5">
              Podcast Topic / Premise Prompt *
            </label>
            <textarea
              required
              rows={4}
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="e.g., A funny debate on whether coffee or tea powers tech startups better, featuring an energetic founder and a calm scientist."
              className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs p-4 rounded-lg border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] leading-relaxed font-sans placeholder:text-[#A39587] shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as PodcastGenre)}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3.5 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                Podcast Style
              </label>
              <select
                value={podcastStyle}
                onChange={(e) => setPodcastStyle(e.target.value)}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3.5 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
              >
                <option value="Debate & Banter">Debate & Banter</option>
                <option value="In-depth Interview">In-depth Interview</option>
                <option value="Audio Drama / Storytelling">Audio Drama / Storytelling</option>
                <option value="Co-hosted Casual Talk">Co-hosted Casual Talk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                Target Length
              </label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3.5 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
              >
                <option value={2}>2 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                Music Mood
              </label>
              <select
                value={musicMood}
                onChange={(e) => setMusicMood(e.target.value)}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3.5 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
              >
                <option value="tech_ambient">Tech Ambient</option>
                <option value="lofi_chill">Lo-Fi Chill</option>
                <option value="dramatic_suspense">Dramatic Suspense</option>
                <option value="acoustic_warm">Acoustic Warm</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="generative-run-automation-btn"
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 text-amber-200 fill-amber-200 stroke-[1.5]" />
              <span>Generate Full Podcast with AI</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
