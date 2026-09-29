import React, { useState } from 'react';
import { Character, CharacterRelationship, RelationshipType, PodcastProject } from '../../types';
import { audioEngine } from '../../lib/audioEngine';
import { getCharacterColorTheme } from '../../lib/characterColors';
import { STUDIO_VOICE_PRESETS, autoTuneProjectVoices } from '../../lib/voicePresets';
import { 
  Users, 
  Plus, 
  Sparkles, 
  Volume2, 
  Trash2, 
  Edit3, 
  Link2, 
  Sliders, 
  Bot, 
  Image as ImageIcon, 
  Check, 
  Loader2,
  X,
  Play,
  Zap,
  Mic
} from 'lucide-react';

interface CastingToolProps {
  project: PodcastProject;
  onUpdateCharacters: (characters: Character[]) => void;
  onOpenVoiceStudio?: (char?: Character) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
];

const VOICE_ACTORS = [
  { name: 'Zephyr', gender: 'Male', tone: 'Warm & Authoritative', desc: 'Deep, confident, engaging tone for main hosts' },
  { name: 'Puck', gender: 'Female', tone: 'Smooth & Natural', desc: 'Versatile, articulate, conversational voice' },
  { name: 'Kore', gender: 'Female', tone: 'Crisp & Analytical', desc: 'Clear, inquisitive voice perfect for journalists/experts' },
  { name: 'Charon', gender: 'Male', tone: 'Deep & Gravelly', desc: 'Resonant, dramatic voice ideal for mysteries and thrillers' },
  { name: 'Fenrir', gender: 'Male', tone: 'Upbeat & Energetic', desc: 'Lively, fast-paced voice for comedy and dynamic banter' },
];

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'Co-Host',
  'Rival',
  'Ally',
  'Mentor',
  'Skeptic',
  'Friend',
  'Enemy',
  'Family',
  'Colleague',
  'Mystery',
];

export const CastingTool: React.FC<CastingToolProps> = ({
  project,
  onUpdateCharacters,
  onOpenVoiceStudio,
}) => {
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Auto-tune show voices
  const handleAutoTuneShowVoices = () => {
    const tuned = autoTuneProjectVoices(project);
    onUpdateCharacters(tuned);
  };

  // New relationship builder state inside editor modal
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('Co-Host');
  const [relNotes, setRelNotes] = useState('');

  // Handle Voice Preview
  const handleTestVoice = (char: Character) => {
    setPreviewingVoiceId(char.id);
    const sampleText = `Hello, I'm ${char.name}, the ${char.mainRole}. Welcome to ${project.title}!`;
    audioEngine.speakLine(sampleText, char.voiceConfig, () => {
      setPreviewingVoiceId(null);
    });
  };

  // Create empty new character sheet
  const handleAddNewCharacter = () => {
    const newChar: Character = {
      id: 'char-' + Date.now(),
      name: 'New Actor / Character',
      avatarUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      mainRole: 'Guest Speaker',
      personality: 'Enthusiastic, inquisitive, insightful.',
      quirks: 'Uses vivid analogies; speaks passionately.',
      background: 'Experienced professional with a rich background in the field.',
      voiceConfig: {
        voiceName: 'Puck',
        gender: 'Female',
        pitch: 1.0,
        rate: 1.0,
        tone: 'Conversational',
        emotionStyle: 'Enthusiastic',
      },
      relationships: [],
    };

    onUpdateCharacters([...project.characters, newChar]);
    setEditingCharacter(newChar);
  };

  // AI Auto-Casting Assistant
  const handleAiAutoCast = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/gemini/generate-casting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: aiPrompt.trim(),
          numCharacters: 2,
          genre: project.genre,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate casting');
      }

      if (data.characters && Array.isArray(data.characters)) {
        const newChars: Character[] = data.characters.map((c: any, index: number) => ({
          id: 'char-' + Date.now() + '-' + index,
          name: c.name || 'AI Character',
          avatarUrl: PRESET_AVATARS[(project.characters.length + index) % PRESET_AVATARS.length],
          mainRole: c.mainRole || 'Co-Host',
          personality: c.personality || 'Vibrant personality',
          quirks: c.quirks || 'Unique habit',
          background: c.background || 'Interesting story background',
          voiceConfig: {
            voiceName: c.voiceConfig?.voiceName || 'Zephyr',
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
            notes: r.notes || 'Collaborates on show',
          })),
        }));

        // Link reciprocal relationship target IDs if names match
        newChars.forEach((nc) => {
          nc.relationships.forEach((rel) => {
            const matched = [...project.characters, ...newChars].find(
              (other) => other.name.toLowerCase() === rel.targetCharacterName.toLowerCase()
            );
            if (matched) {
              rel.targetCharacterId = matched.id;
            }
          });
        });

        onUpdateCharacters([...project.characters, ...newChars]);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('Auto cast error:', err);
      alert('Failed to generate characters. Check server connection.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('Delete this character sheet?')) {
      const updated = project.characters.filter((c) => c.id !== id);
      onUpdateCharacters(updated);
      if (editingCharacter?.id === id) {
        setEditingCharacter(null);
      }
    }
  };

  const handleSaveEditedCharacter = () => {
    if (!editingCharacter) return;
    const updated = project.characters.map((c) =>
      c.id === editingCharacter.id ? editingCharacter : c
    );
    onUpdateCharacters(updated);
    setEditingCharacter(null);
  };

  // Add Relationship Link to active editing character
  const handleAddRelationshipLink = () => {
    if (!editingCharacter || !relTargetId) return;
    const targetChar = project.characters.find((c) => c.id === relTargetId);
    if (!targetChar) return;

    const newRel: CharacterRelationship = {
      id: 'rel-' + Date.now(),
      targetCharacterId: targetChar.id,
      targetCharacterName: targetChar.name,
      relationshipType: relType,
      notes: relNotes || `${relType} relationship with ${targetChar.name}`,
    };

    setEditingCharacter({
      ...editingCharacter,
      relationships: [...editingCharacter.relationships, newRel],
    });

    setRelTargetId('');
    setRelNotes('');
  };

  const handleRemoveRelationshipLink = (relId: string) => {
    if (!editingCharacter) return;
    setEditingCharacter({
      ...editingCharacter,
      relationships: editingCharacter.relationships.filter((r) => r.id !== relId),
    });
  };

  return (
    <div id="casting-tool-container" className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-xs text-[#2E2623]">
      {/* Top Banner & AI Generator Bar */}
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3]">
              <Users className="w-5 h-5 stroke-[1.5]" />
            </span>
            <h2 className="text-lg font-semibold text-[#2E2623]">Character Casting Sheets & Voicing Tool</h2>
          </div>
          <p className="text-xs text-[#786B62] max-w-xl font-normal">
            Input character sheets, customize actor personality, quirks, and background. Connect clickable <strong>relationship links</strong> between characters and fine-tune voice actor audio.
          </p>
        </div>

        {/* AI Casting Assistant Prompt */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[320px]">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Generate a cynical sci-fi detective..."
            className="bg-[#FAF6EE] text-[#2E2623] text-xs px-3.5 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs flex-1"
          />
          <button
            id="ai-auto-cast-btn"
            onClick={handleAiAutoCast}
            disabled={isAiGenerating || !aiPrompt.trim()}
            className="px-4 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isAiGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            )}
            <span>AI Cast</span>
          </button>
          <button
            id="manual-add-character-btn"
            onClick={handleAddNewCharacter}
            className="px-3.5 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] border border-[#E0D4C3] text-xs font-semibold transition flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Manual Sheet</span>
          </button>

          <button
            onClick={handleAutoTuneShowVoices}
            title="Automatically assign distinct, high-quality broadcast voice presets to all cast members"
            className="px-3.5 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>⚡ Auto-Tune Voices</span>
          </button>

          {onOpenVoiceStudio && (
            <button
              onClick={() => onOpenVoiceStudio()}
              title="Open Voice Studio & Audition Sandbox"
              className="px-3.5 py-2 rounded-md bg-[#2E2623] hover:bg-[#1F1816] text-white text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Voice Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Character Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {project.characters.map((char, index) => {
          const isHighlighted = selectedHighlightId === char.id;
          const charTheme = getCharacterColorTheme(char.id, index, project.characters);

          return (
            <div
              key={char.id}
              id={`character-sheet-card-${char.id}`}
              className={`bg-[#FAF6EE] rounded-xl border transition-all duration-300 overflow-hidden shadow-xs flex flex-col justify-between relative pl-2 ${
                isHighlighted
                  ? 'border-[#C85A32] ring-2 ring-[#C85A32]/20'
                  : 'border-[#E0D4C3] hover:border-[#D8CAB8]'
              }`}
            >
              {/* Character Color Accent Side Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-2.5 ${charTheme.stripeBg}`}
                title={`Character Color: ${charTheme.name}`}
              />

              {/* Card Header */}
              <div className="p-5 border-b border-[#E0D4C3] bg-[#F5EFE6] flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={char.avatarUrl}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-[#E0D4C3]"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-[#2E2623] flex items-center space-x-2">
                      <span>{char.name}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${charTheme.badgeBg} ${charTheme.badgeText} ${charTheme.badgeBorder} border`}>
                        {charTheme.name}
                      </span>
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDE5D8] text-[#2E2623] border border-[#E0D4C3]">
                      {char.mainRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleTestVoice(char)}
                    disabled={previewingVoiceId === char.id}
                    title="Test Voice Actor Sound"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] border border-[#E0D4C3] text-xs font-semibold transition"
                  >
                    {previewingVoiceId === char.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 stroke-[1.5] text-[#C85A32]" />
                    )}
                    <span>Voice Preview</span>
                  </button>

                  <button
                    onClick={() => setEditingCharacter(char)}
                    title="Edit character sheet"
                    className="p-1.5 rounded-md text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>

                  <button
                    onClick={() => handleDeleteCharacter(char.id)}
                    title="Delete character sheet"
                    className="p-1.5 rounded-md text-[#786B62] hover:text-red-700 hover:bg-red-100/50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* Character Details Body */}
              <div className="p-5 space-y-4 flex-1">
                {/* Personality & Quirks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#EDE5D8] p-3 rounded-lg border border-[#E0D4C3]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#786B62] block mb-1">
                      Personality
                    </span>
                    <p className="text-xs text-[#2E2623] font-normal leading-relaxed">
                      {char.personality}
                    </p>
                  </div>

                  <div className="bg-[#EDE5D8] p-3 rounded-lg border border-[#E0D4C3]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#786B62] block mb-1">
                      Quirks & Habits
                    </span>
                    <p className="text-xs text-[#2E2623] font-normal leading-relaxed">
                      {char.quirks}
                    </p>
                  </div>
                </div>

                {/* Background Story */}
                <div className="bg-[#EDE5D8] p-3 rounded-lg border border-[#E0D4C3]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#786B62] block mb-1">
                    Story Background
                  </span>
                  <p className="text-xs text-[#2E2623] font-normal leading-relaxed line-clamp-3">
                    {char.background}
                  </p>
                </div>

                {/* Clickable Relationship Links */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#786B62] block mb-1.5 flex items-center space-x-1">
                    <Link2 className="w-3 h-3 stroke-[1.5]" />
                    <span>Clickable Relationship Links</span>
                  </span>

                  {char.relationships.length === 0 ? (
                    <p className="text-[11px] text-[#A39587] italic font-normal">No linked relationships yet. Click edit to add links.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {char.relationships.map((rel) => {
                        const targetObj = project.characters.find(
                          (c) => c.id === rel.targetCharacterId || c.name === rel.targetCharacterName
                        );
                        return (
                          <button
                            key={rel.id}
                            onClick={() => {
                              if (targetObj) {
                                setSelectedHighlightId(targetObj.id);
                                setTimeout(() => setSelectedHighlightId(null), 2500);
                              }
                            }}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] border border-[#E0D4C3] text-xs transition font-normal"
                            title={rel.notes}
                          >
                            <span className="font-semibold text-[#786B62]">{rel.relationshipType}:</span>
                            <span className="underline font-medium">{rel.targetCharacterName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Voicing Tool Preset Banner */}
              <div className="p-3 bg-[#F5EFE6] border-t border-[#E0D4C3] px-5 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-[#C85A32] stroke-[1.5]" />
                  <span className="font-normal text-[#2E2623]">
                    Voice: <strong className="font-semibold">{char.voiceConfig.voiceName}</strong>
                  </span>
                  <span className="text-[#786B62]">({char.voiceConfig.gender}, {char.voiceConfig.emotionStyle})</span>
                  {char.voiceConfig.audioEffect && (
                    <span className="text-[10px] font-bold text-[#C85A32] bg-[#C85A32]/10 border border-[#C85A32]/20 px-2 py-0.5 rounded capitalize">
                      EQ: {char.voiceConfig.audioEffect.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#786B62] bg-[#EDE5D8] px-2 py-0.5 rounded border border-[#E0D4C3] font-semibold">
                    {char.voiceConfig.tone}
                  </span>
                  {onOpenVoiceStudio && (
                    <button
                      onClick={() => onOpenVoiceStudio(char)}
                      className="px-2 py-0.5 rounded bg-[#2E2623] hover:bg-[#C85A32] text-white text-[10px] font-semibold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Mic className="w-2.5 h-2.5" />
                      <span>Studio Presets</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Character Edit Sheet Modal */}
      {editingCharacter && (
        <div id="edit-character-modal" className="fixed inset-0 z-50 bg-[#2E2623]/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6EE] border border-[#E0D4C3] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl text-[#2E2623]">
            <div className="p-5 border-b border-[#E0D4C3] bg-[#F5EFE6] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2E2623] flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
                <span>Edit Character Sheet: {editingCharacter.name}</span>
              </h3>
              <button
                onClick={() => setEditingCharacter(null)}
                className="p-1 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.name}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                    Main Story Role
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.mainRole}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, mainRole: e.target.value })}
                    placeholder="e.g. Lead Host, Expert Guest"
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#2E2623] mb-1 flex items-center space-x-1">
                  <ImageIcon className="w-3.5 h-3.5 text-[#786B62] stroke-[1.5]" />
                  <span>Character Avatar Image</span>
                </label>

                <div className="flex items-center space-x-3 mb-2">
                  <img
                    src={editingCharacter.avatarUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-md object-cover border border-[#E0D4C3]"
                  />
                  <input
                    type="text"
                    value={editingCharacter.avatarUrl}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, avatarUrl: e.target.value })}
                    placeholder="Custom image URL..."
                    className="flex-1 bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] placeholder:text-[#A39587] shadow-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-2 no-scrollbar">
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Preset"
                      referrerPolicy="no-referrer"
                      onClick={() => setEditingCharacter({ ...editingCharacter, avatarUrl: url })}
                      className={`w-9 h-9 rounded-md object-cover cursor-pointer border-2 transition ${
                        editingCharacter.avatarUrl === url ? 'border-[#C85A32] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Personality, Quirks, Background */}
              <div>
                <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                  Personality
                </label>
                <input
                  type="text"
                  value={editingCharacter.personality}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, personality: e.target.value })}
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                  Quirks & Habits
                </label>
                <input
                  type="text"
                  value={editingCharacter.quirks}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, quirks: e.target.value })}
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2E2623] mb-1">
                  Background
                </label>
                <textarea
                  rows={2}
                  value={editingCharacter.background}
                  onChange={(e) => setEditingCharacter({ ...editingCharacter, background: e.target.value })}
                  className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs"
                />
              </div>

              {/* Voicing Tool Settings */}
              <div className="bg-[#EDE5D8] p-4 rounded-xl border border-[#E0D4C3] space-y-3">
                <h4 className="text-xs font-semibold text-[#2E2623] uppercase tracking-wider flex items-center space-x-1">
                  <Sliders className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Voicing Tool Setup</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#786B62] mb-1">
                      Voice Actor
                    </label>
                    <select
                      value={editingCharacter.voiceConfig.voiceName}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        voiceConfig: { ...editingCharacter.voiceConfig, voiceName: e.target.value },
                      })}
                      className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-2.5 py-1.5 rounded-md border border-[#E0D4C3] shadow-xs"
                    >
                      {VOICE_ACTORS.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.gender} - {v.tone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#786B62] mb-1">
                      Emotion Delivery Style
                    </label>
                    <select
                      value={editingCharacter.voiceConfig.emotionStyle}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        voiceConfig: { ...editingCharacter.voiceConfig, emotionStyle: e.target.value as any },
                      })}
                      className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-2.5 py-1.5 rounded-md border border-[#E0D4C3] shadow-xs"
                    >
                      <option value="Enthusiastic">Enthusiastic</option>
                      <option value="Sarcastic">Sarcastic</option>
                      <option value="Calm">Calm</option>
                      <option value="Dramatic">Dramatic</option>
                      <option value="Whispering">Whispering</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-[#786B62] mb-1">
                      Voice Pitch: {editingCharacter.voiceConfig.pitch.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.6"
                      max="1.4"
                      step="0.05"
                      value={editingCharacter.voiceConfig.pitch}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        voiceConfig: { ...editingCharacter.voiceConfig, pitch: parseFloat(e.target.value) },
                      })}
                      className="w-full accent-[#2E2623]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#786B62] mb-1">
                      Speech Speed Rate: {editingCharacter.voiceConfig.rate.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.05"
                      value={editingCharacter.voiceConfig.rate}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        voiceConfig: { ...editingCharacter.voiceConfig, rate: parseFloat(e.target.value) },
                      })}
                      className="w-full accent-[#2E2623]"
                    />
                  </div>
                </div>
              </div>

              {/* Relationship Links Editor */}
              <div className="space-y-3 pt-2 border-t border-[#E0D4C3]">
                <h4 className="text-xs font-semibold text-[#2E2623] flex items-center space-x-1">
                  <Link2 className="w-3.5 h-3.5 text-[#786B62] stroke-[1.5]" />
                  <span>Relationship Links with Other Cast</span>
                </h4>

                <div className="flex flex-wrap gap-2">
                  {editingCharacter.relationships.map((rel) => (
                    <span
                      key={rel.id}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#EDE5D8] border border-[#E0D4C3] text-xs text-[#2E2623]"
                    >
                      <span className="font-semibold text-[#786B62]">{rel.relationshipType}:</span>
                      <span>{rel.targetCharacterName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRelationshipLink(rel.id)}
                        className="text-[#786B62] hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new link row */}
                <div className="flex items-center gap-2 bg-[#EDE5D8] p-3 rounded-lg border border-[#E0D4C3]">
                  <select
                    value={relTargetId}
                    onChange={(e) => setRelTargetId(e.target.value)}
                    className="bg-[#FAF6EE] text-[#2E2623] text-xs px-2.5 py-1.5 rounded-md border border-[#E0D4C3] flex-1 shadow-xs"
                  >
                    <option value="">Select target character...</option>
                    {project.characters
                      .filter((c) => c.id !== editingCharacter.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <select
                    value={relType}
                    onChange={(e) => setRelType(e.target.value as RelationshipType)}
                    className="bg-[#FAF6EE] text-[#2E2623] text-xs px-2 py-1.5 rounded-md border border-[#E0D4C3] shadow-xs"
                  >
                    {RELATIONSHIP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddRelationshipLink}
                    disabled={!relTargetId}
                    className="px-3 py-1.5 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold disabled:opacity-50 shadow-xs"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E0D4C3] bg-[#F5EFE6] flex justify-end space-x-2">
              <button
                onClick={() => setEditingCharacter(null)}
                className="px-4 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#786B62] hover:text-[#2E2623] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedCharacter}
                className="px-5 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-semibold shadow-xs"
              >
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
