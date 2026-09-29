import React, { useState, useEffect } from 'react';
import { 
  STUDIO_VOICE_PRESETS, 
  VoicePreset, 
  autoTuneProjectVoices 
} from '../../lib/voicePresets';
import { Character, PodcastProject, VoiceConfig } from '../../types';
import { audioEngine } from '../../lib/audioEngine';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  Square, 
  Check, 
  Zap, 
  Sliders, 
  X, 
  Radio, 
  Mic, 
  User, 
  Music, 
  Flame,
  ChevronRight
} from 'lucide-react';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PodcastProject | null;
  onUpdateCharacters?: (characters: Character[]) => void;
  initialCharacter?: Character | null;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateCharacters,
  initialCharacter = null,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(STUDIO_VOICE_PRESETS[0]);
  const [playingPresetId, setPlayingPresetId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("Welcome back to the podcast! Today we're diving into story design, AI voice synthesis, and broadcast audio.");
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Custom Fine-Tuning State
  const [customPitch, setCustomPitch] = useState<number>(1.0);
  const [customRate, setCustomRate] = useState<number>(1.0);
  const [customAudioEffect, setCustomAudioEffect] = useState<string>('studio_warmth');
  
  // Selected Target Character to Assign To
  const [targetCharId, setTargetCharId] = useState<string>(
    initialCharacter ? initialCharacter.id : (project?.characters[0]?.id || '')
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCharacter) {
      setTargetCharId(initialCharacter.id);
      // Find matching preset if any
      const match = STUDIO_VOICE_PRESETS.find(p => p.voiceName === initialCharacter.voiceConfig.voiceName);
      if (match) {
        setSelectedPreset(match);
        setCustomPitch(initialCharacter.voiceConfig.pitch);
        setCustomRate(initialCharacter.voiceConfig.rate);
        if (initialCharacter.voiceConfig.audioEffect) {
          setCustomAudioEffect(initialCharacter.voiceConfig.audioEffect);
        }
      }
    }
  }, [initialCharacter]);

  if (!isOpen) return null;

  const categories = ['All', 'Broadcaster & Host', 'Co-Host & Banter', 'Journalist & News', 'Drama & Storytelling', 'Tech & Expert', 'Cyber & AI'];

  const filteredPresets = activeCategory === 'All' 
    ? STUDIO_VOICE_PRESETS 
    : STUDIO_VOICE_PRESETS.filter(p => p.category === activeCategory);

  const handleAuditionPreset = (preset: VoicePreset, textToSay?: string) => {
    if (playingPresetId === preset.id) {
      audioEngine.stopAllSpeech();
      setPlayingPresetId(null);
      return;
    }

    setPlayingPresetId(preset.id);
    const phrase = textToSay || preset.samplePhrase;
    
    audioEngine.speakLine(
      phrase,
      {
        voiceName: preset.voiceName,
        gender: preset.gender,
        pitch: preset.id === selectedPreset.id ? customPitch : preset.pitch,
        rate: preset.id === selectedPreset.id ? customRate : preset.rate,
        audioEffect: preset.id === selectedPreset.id ? customAudioEffect : preset.audioEffect,
        emotionStyle: preset.emotionStyle,
      },
      () => {
        setPlayingPresetId(null);
      }
    );
  };

  const handleSelectPreset = (preset: VoicePreset) => {
    setSelectedPreset(preset);
    setCustomPitch(preset.pitch);
    setCustomRate(preset.rate);
    setCustomAudioEffect(preset.audioEffect);
    handleAuditionPreset(preset);
  };

  const handleAssignToCharacter = (charId: string) => {
    if (!project || !onUpdateCharacters) return;
    const targetChar = project.characters.find(c => c.id === charId);
    if (!targetChar) return;

    const updatedCharacters = project.characters.map((c) => {
      if (c.id === charId) {
        return {
          ...c,
          voiceConfig: {
            ...c.voiceConfig,
            voiceName: selectedPreset.voiceName,
            gender: selectedPreset.gender,
            pitch: customPitch,
            rate: customRate,
            tone: selectedPreset.tone,
            emotionStyle: selectedPreset.emotionStyle,
            audioEffect: customAudioEffect as any,
          }
        };
      }
      return c;
    });

    onUpdateCharacters(updatedCharacters);
    setToastMessage(`Assigned '${selectedPreset.name}' to ${targetChar.name}!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAutoTuneAll = () => {
    if (!project || !onUpdateCharacters) return;
    const tuned = autoTuneProjectVoices(project);
    onUpdateCharacters(tuned);
    setToastMessage("⚡ Auto-tuned all character voices with distinct studio presets!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#EDE5D8] px-5 py-3.5 border-b border-[#E0D4C3] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C85A32] text-white flex items-center justify-center shadow-xs">
              <Mic className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2E2623] flex items-center space-x-2">
                <span>Studio Voice Presets & Audition Sandbox</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/20">
                  Instant Preview
                </span>
              </h2>
              <p className="text-xs text-[#786B62]">
                Select pre-tuned broadcast voice profiles or auto-tune all project voice actors with 1-click.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {project && onUpdateCharacters && (
              <button
                onClick={handleAutoTuneAll}
                className="px-3 py-1.5 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>1-Click Auto-Tune All Voices</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="bg-[#C85A32] text-white px-4 py-2 text-xs font-medium flex items-center space-x-2 justify-center shadow-xs animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Column: Preset Gallery (7 cols) */}
          <div className="md:col-span-7 border-r border-[#E0D4C3] p-4 flex flex-col overflow-hidden bg-[#FAF6EE]">
            
            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#2E2623] text-white shadow-xs'
                      : 'bg-[#EDE5D8] text-[#786B62] hover:bg-[#E0D4C3] hover:text-[#2E2623]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                const isPlaying = playingPresetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex flex-col space-y-2 relative ${
                      isSelected
                        ? 'bg-[#EDE5D8] border-[#C85A32] shadow-xs'
                        : 'bg-[#FAF6EE] border-[#E0D4C3] hover:border-[#C85A32]/50 hover:bg-[#EDE5D8]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAuditionPreset(preset);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-xs ${
                            isPlaying
                              ? 'bg-[#C85A32] text-white animate-pulse'
                              : 'bg-[#2E2623] text-white hover:bg-[#C85A32]'
                          }`}
                          title="Audition Sample"
                        >
                          {isPlaying ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>

                        <div>
                          <h4 className="text-xs font-bold text-[#2E2623] flex items-center space-x-1.5">
                            <span>{preset.name}</span>
                            {isPlaying && (
                              <span className="flex items-center space-x-0.5 text-[9px] text-[#C85A32] font-semibold">
                                <span className="w-1 h-2 bg-[#C85A32] animate-bounce"></span>
                                <span className="w-1 h-3 bg-[#C85A32] animate-bounce delay-75"></span>
                                <span className="w-1 h-2.5 bg-[#C85A32] animate-bounce delay-150"></span>
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-[#786B62] font-medium">
                            Actor: {preset.voiceName} ({preset.gender}) • {preset.tone}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#524641] line-clamp-2 italic bg-[#FAF6EE]/80 p-2 rounded border border-[#E0D4C3]/60">
                      "{preset.samplePhrase}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#786B62] pt-1 border-t border-[#E0D4C3]/40">
                      <div className="flex items-center space-x-2">
                        <span>Pitch: {preset.pitch.toFixed(2)}x</span>
                        <span>•</span>
                        <span>Rate: {preset.rate.toFixed(2)}x</span>
                        <span>•</span>
                        <span className="capitalize font-semibold text-[#C85A32]">
                          EQ: {preset.audioEffect.replace('_', ' ')}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="text-[#C85A32] font-bold flex items-center space-x-0.5">
                          <span>Selected</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Custom Fine-Tuning Sandbox & Character Assignment (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col justify-between bg-[#EDE5D8]/50 overflow-y-auto">
            <div className="space-y-4">
              
              {/* Selected Preset Details Card */}
              <div className="bg-[#FAF6EE] p-3.5 rounded-lg border border-[#E0D4C3] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#786B62] uppercase tracking-wider">
                    Active Preset
                  </span>
                  <span className="text-[10px] font-semibold text-[#C85A32] bg-[#C85A32]/10 px-2 py-0.5 rounded">
                    {selectedPreset.gender}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#2E2623]">{selectedPreset.name}</h3>
                <p className="text-xs text-[#786B62]">{selectedPreset.description}</p>
              </div>

              {/* Custom Audition Phrase Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2E2623] flex items-center justify-between">
                  <span>Custom Audition Phrase</span>
                  <button
                    onClick={() => handleAuditionPreset(selectedPreset, customText)}
                    className="text-[11px] font-semibold text-[#C85A32] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Custom Text</span>
                  </button>
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs p-2.5 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs resize-none"
                  placeholder="Type any test line..."
                />
              </div>

              {/* Sliders: Pitch, Rate & EQ Profile */}
              <div className="bg-[#FAF6EE] p-3 rounded-lg border border-[#E0D4C3] space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E0D4C3] pb-1.5">
                  <span className="text-xs font-bold text-[#2E2623] flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Fine-Tune Audio EQ Controls</span>
                  </span>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#786B62] font-medium">Pitch Modulation</span>
                    <span className="font-semibold text-[#2E2623]">{customPitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.02"
                    value={customPitch}
                    onChange={(e) => setCustomPitch(parseFloat(e.target.value))}
                    className="w-full accent-[#C85A32] cursor-pointer"
                  />
                </div>

                {/* Speed Rate Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#786B62] font-medium">Speaking Speed / Tempo</span>
                    <span className="font-semibold text-[#2E2623]">{customRate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.02"
                    value={customRate}
                    onChange={(e) => setCustomRate(parseFloat(e.target.value))}
                    className="w-full accent-[#C85A32] cursor-pointer"
                  />
                </div>

                {/* EQ Effect Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] text-[#786B62] font-medium block">
                    Studio Audio Processing EQ
                  </label>
                  <select
                    value={customAudioEffect}
                    onChange={(e) => setCustomAudioEffect(e.target.value)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-2.5 py-1.5 rounded border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                  >
                    <option value="studio_warmth">Studio Warmth (Low-End Bass Boost)</option>
                    <option value="fm_radio">FM Radio Punch (Compressed Broadcast)</option>
                    <option value="crisp_clear">Crisp & Clear (High Treble Clarity)</option>
                    <option value="deep_baritone">Deep Baritone (Gravelly Resonance)</option>
                    <option value="robotic_synth">Cyber Synth (Modulated Electronic)</option>
                    <option value="none">Standard Flat EQ</option>
                  </select>
                </div>
              </div>

              {/* Character Assignment Box */}
              {project && project.characters.length > 0 && onUpdateCharacters && (
                <div className="bg-[#FAF6EE] p-3.5 rounded-lg border border-[#E0D4C3] space-y-2.5 shadow-xs">
                  <label className="text-xs font-bold text-[#2E2623] block">
                    Assign Preset to Project Character
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={targetCharId}
                      onChange={(e) => setTargetCharId(e.target.value)}
                      className="flex-1 bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] font-semibold cursor-pointer"
                    >
                      {project.characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.mainRole})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssignToCharacter(targetCharId)}
                      className="px-3 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Voice</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#E0D4C3] flex items-center justify-between mt-4">
              <button
                onClick={() => handleAuditionPreset(selectedPreset, customText)}
                className="px-3 py-2 rounded-md bg-[#2E2623] hover:bg-[#1F1816] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Test Audio</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-[#E0D4C3] hover:bg-[#D8CAB8] text-[#2E2623] text-xs font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
