import React, { useState } from 'react';
import { PodcastProject, Character, CharacterRelationship, VoiceConfig } from '../../types';
import { 
  Sliders, 
  User, 
  Share2, 
  ChevronDown, 
  ChevronRight, 
  Mic, 
  Volume2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Activity,
  Layers
} from 'lucide-react';
import { audioEngine } from '../../lib/audioEngine';

interface PropertiesInspectorPanelProps {
  project: PodcastProject;
  selectedCharacterId: string;
  onUpdateCharacter: (updatedChar: Character) => void;
  onSelectCharacter: (id: string) => void;
}

export const PropertiesInspectorPanel: React.FC<PropertiesInspectorPanelProps> = ({
  project,
  selectedCharacterId,
  onUpdateCharacter,
  onSelectCharacter,
}) => {
  // Accordion Panel Toggle States
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(true);
  const [isLorePanelOpen, setIsLorePanelOpen] = useState(true);
  const [isGraphPanelOpen, setIsGraphPanelOpen] = useState(true);

  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Relationship Form State
  const [newRelTargetId, setNewRelTargetId] = useState('');
  const [newRelType, setNewRelType] = useState('Co-Host');
  const [newRelNotes, setNewRelNotes] = useState('');

  const character = project.characters.find((c) => c.id === selectedCharacterId) || project.characters[0];

  if (!character) {
    return (
      <aside className="w-72 bg-[#252525] border-l border-[#3B3B3B] p-4 text-[#888888] font-sans text-xs">
        No character selected.
      </aside>
    );
  }

  const voiceConfig = character.voiceConfig || {
    voiceName: 'Zephyr',
    gender: 'Male',
    pitch: 1.0,
    rate: 1.0,
    tone: 'Warm & Authoritative',
    emotionStyle: 'Enthusiastic',
  };

  const handleVoiceChange = (field: keyof VoiceConfig, val: any) => {
    const updated: Character = {
      ...character,
      voiceConfig: {
        ...voiceConfig,
        [field]: val,
      },
    };
    onUpdateCharacter(updated);
  };

  const handleTestVoiceOutput = () => {
    setIsTestingVoice(true);
    const sampleText = `Hello! I'm ${character.name}. Testing neural voice synthesis parameters for pitch, rate, and formant.`;
    audioEngine.speakLine(sampleText, voiceConfig, () => {
      setIsTestingVoice(false);
    });
  };

  const handleAddRelationship = () => {
    if (!newRelTargetId) return;
    const targetChar = project.characters.find((c) => c.id === newRelTargetId);
    if (!targetChar) return;

    const newRel: CharacterRelationship = {
      id: 'rel-' + Date.now(),
      targetCharacterId: targetChar.id,
      targetCharacterName: targetChar.name,
      relationshipType: newRelType as any,
      notes: newRelNotes || 'Character link',
    };

    const updatedRels = [...(character.relationships || []), newRel];
    onUpdateCharacter({
      ...character,
      relationships: updatedRels,
    });

    setNewRelTargetId('');
    setNewRelNotes('');
  };

  const handleDeleteRelationship = (relId: string) => {
    const updatedRels = (character.relationships || []).filter((r) => r.id !== relId);
    onUpdateCharacter({
      ...character,
      relationships: updatedRels,
    });
  };

  return (
    <aside className="w-80 bg-[#252525] border-l border-[#3B3B3B] flex flex-col h-full select-none text-[#CCCCCC] font-sans text-[11px] shrink-0">
      {/* Inspector Title Bar */}
      <div className="h-7 bg-[#2D2D2D] border-b border-[#3B3B3B] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5 font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px]">
          <Sliders className="w-3.5 h-3.5 text-[#00A8C6]" />
          <span>Properties Inspector</span>
        </div>
        <span className="text-[10px] font-mono text-[#00A8C6] font-bold">{character.name}</span>
      </div>

      {/* Accordion Panels Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#3B3B3B]">
        {/* PANEL 1: VOICE MODULATION DSP & NEURAL MODEL */}
        <div className="bg-[#222222]">
          <button
            onClick={() => setIsVoicePanelOpen(!isVoicePanelOpen)}
            className="w-full h-7 px-3 bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-between font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px] transition"
          >
            <div className="flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-[#00A8C6]" />
              <span>Voice Modulation & Neural DSP</span>
            </div>
            {isVoicePanelOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
            )}
          </button>

          {isVoicePanelOpen && (
            <div className="p-3 space-y-3 font-mono text-[10px]">
              {/* Voice Model Selector */}
              <div className="space-y-1">
                <label className="text-[#888888] uppercase block">Neural Voice Model:</label>
                <select
                  value={voiceConfig.voiceName}
                  onChange={(e) => handleVoiceChange('voiceName', e.target.value)}
                  className="w-full bg-[#1A1A1A] text-[#E0E0E0] text-[11px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                >
                  <option value="Zephyr">Zephyr (Male • Deep & Resonant)</option>
                  <option value="Puck">Puck (Male • Energetic & Fast)</option>
                  <option value="Kore">Kore (Female • Crisp & Analytical)</option>
                  <option value="Fenrir">Fenrir (Male • Authoritative Lead)</option>
                  <option value="Charon">Charon (Male • Gravelly & Intense)</option>
                </select>
              </div>

              {/* Delivery Emotion Style */}
              <div className="space-y-1">
                <label className="text-[#888888] uppercase block">Delivery Emotion:</label>
                <select
                  value={voiceConfig.emotionStyle}
                  onChange={(e) => handleVoiceChange('emotionStyle', e.target.value as any)}
                  className="w-full bg-[#1A1A1A] text-[#E0E0E0] text-[11px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                >
                  <option value="Enthusiastic">Enthusiastic</option>
                  <option value="Sarcastic">Sarcastic</option>
                  <option value="Calm">Calm & Grounded</option>
                  <option value="Dramatic">Dramatic</option>
                  <option value="Whispering">Whispering</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              {/* Pitch Slider (-12st to +12st) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#888888] uppercase">Pitch Shift:</span>
                  <span className="text-[#00A8C6]">{voiceConfig.pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={voiceConfig.pitch}
                  onChange={(e) => handleVoiceChange('pitch', parseFloat(e.target.value))}
                  className="w-full accent-[#00A8C6] bg-[#141414] h-1.5 rounded cursor-pointer"
                />
              </div>

              {/* Speed Rate Slider (0.5x to 2.0x) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#888888] uppercase">Speaking Speed:</span>
                  <span className="text-[#00A8C6]">{voiceConfig.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.5}
                  step={0.05}
                  value={voiceConfig.rate}
                  onChange={(e) => handleVoiceChange('rate', parseFloat(e.target.value))}
                  className="w-full accent-[#00A8C6] bg-[#141414] h-1.5 rounded cursor-pointer"
                />
              </div>

              {/* Test Voice Button */}
              <button
                onClick={handleTestVoiceOutput}
                disabled={isTestingVoice}
                className="w-full py-1.5 bg-[#264F78] hover:bg-[#2F5D8E] text-white font-sans text-xs rounded-[2px] transition flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 text-white" />
                <span>{isTestingVoice ? 'Synthesizing Audio...' : 'Test Voice Output'}</span>
              </button>
            </div>
          )}
        </div>

        {/* PANEL 2: CHARACTER LORE & METADATA */}
        <div className="bg-[#222222]">
          <button
            onClick={() => setIsLorePanelOpen(!isLorePanelOpen)}
            className="w-full h-7 px-3 bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-between font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px] transition"
          >
            <div className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#00A8C6]" />
              <span>Character Lore & Role Profile</span>
            </div>
            {isLorePanelOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
            )}
          </button>

          {isLorePanelOpen && (
            <div className="p-3 space-y-2.5 font-sans text-[11px]">
              {/* Character Name */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-[#888888] uppercase block">Name:</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                  className="w-full bg-[#1A1A1A] text-[#E0E0E0] text-[11px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                />
              </div>

              {/* Main Role */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-[#888888] uppercase block">Main Role:</label>
                <input
                  type="text"
                  value={character.mainRole}
                  onChange={(e) => onUpdateCharacter({ ...character, mainRole: e.target.value })}
                  className="w-full bg-[#1A1A1A] text-[#E0E0E0] text-[11px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                />
              </div>

              {/* Personality */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-[#888888] uppercase block">Personality:</label>
                <textarea
                  rows={2}
                  value={character.personality}
                  onChange={(e) => onUpdateCharacter({ ...character, personality: e.target.value })}
                  className="w-full bg-[#1A1A1A] text-[#CCCCCC] text-[10px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6] resize-none"
                />
              </div>

              {/* Quirks & Background */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-mono text-[#888888] uppercase block">Background Lore:</label>
                <textarea
                  rows={2}
                  value={character.background}
                  onChange={(e) => onUpdateCharacter({ ...character, background: e.target.value })}
                  className="w-full bg-[#1A1A1A] text-[#CCCCCC] text-[10px] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* PANEL 3: CLICKABLE RELATIONSHIP GRAPH & LINK NODES */}
        <div className="bg-[#222222]">
          <button
            onClick={() => setIsGraphPanelOpen(!isGraphPanelOpen)}
            className="w-full h-7 px-3 bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-between font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px] transition"
          >
            <div className="flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#00A8C6]" />
              <span>Clickable Relationship Nodes</span>
            </div>
            {isGraphPanelOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
            )}
          </button>

          {isGraphPanelOpen && (
            <div className="p-3 space-y-3">
              {/* Linked Nodes List */}
              <div className="space-y-1">
                {(character.relationships || []).length === 0 ? (
                  <p className="text-[10px] font-mono text-[#666666]">No relationship links defined.</p>
                ) : (
                  (character.relationships || []).map((rel) => {
                    const targetChar = project.characters.find(
                      (c) => c.id === rel.targetCharacterId || c.name === rel.targetCharacterName
                    );

                    return (
                      <div
                        key={rel.id}
                        onClick={() => targetChar && onSelectCharacter(targetChar.id)}
                        className="p-1.5 bg-[#1A1A1A] border border-[#3B3B3B] hover:border-[#00A8C6] rounded-[2px] flex items-center justify-between cursor-pointer transition group"
                      >
                        <div className="flex items-center space-x-1.5">
                          <Share2 className="w-3 h-3 text-[#00A8C6]" />
                          <div>
                            <span className="font-semibold text-[#E0E0E0] group-hover:text-white text-[11px] block">
                              {rel.targetCharacterName}
                            </span>
                            <span className="text-[9px] font-mono text-[#888888]">
                              [{rel.relationshipType}] {rel.notes}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRelationship(rel.id);
                          }}
                          className="p-1 text-[#666666] hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Relationship Link Form */}
              <div className="pt-2 border-t border-[#333333] space-y-2 font-mono text-[10px]">
                <div className="text-[#888888] uppercase">Add Link Node:</div>
                <select
                  value={newRelTargetId}
                  onChange={(e) => setNewRelTargetId(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-[#CCCCCC] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                >
                  <option value="">-- Select Target Character --</option>
                  {project.characters
                    .filter((c) => c.id !== character.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mainRole})
                      </option>
                    ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={newRelType}
                    onChange={(e) => setNewRelType(e.target.value)}
                    className="flex-1 bg-[#1A1A1A] text-[#CCCCCC] p-1 rounded-[2px] border border-[#3B3B3B] focus:outline-none focus:border-[#00A8C6]"
                  >
                    <option value="Co-Host">Co-Host</option>
                    <option value="Rival">Rival</option>
                    <option value="Ally">Ally</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Skeptic">Skeptic</option>
                  </select>

                  <button
                    onClick={handleAddRelationship}
                    disabled={!newRelTargetId}
                    className="px-2 py-1 bg-[#264F78] hover:bg-[#2F5D8E] text-white font-sans text-xs rounded-[2px] transition disabled:opacity-30"
                  >
                    + Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
