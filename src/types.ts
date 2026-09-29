export type RelationshipType = 
  | 'Rival' 
  | 'Ally' 
  | 'Mentor' 
  | 'Skeptic' 
  | 'Co-Host' 
  | 'Friend' 
  | 'Enemy' 
  | 'Family' 
  | 'Colleague' 
  | 'Mystery';

export interface CharacterRelationship {
  id: string;
  targetCharacterId: string;
  targetCharacterName: string;
  relationshipType: RelationshipType;
  notes: string;
}

export interface VoiceConfig {
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'AI / Synth';
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.5 to 1.5
  tone: string; // e.g. "Warm & Authoritative", "Energetic & Fast"
  emotionStyle: 'Enthusiastic' | 'Sarcastic' | 'Calm' | 'Dramatic' | 'Whispering' | 'Professional';
  audioEffect?: 'studio_warmth' | 'fm_radio' | 'crisp_clear' | 'deep_baritone' | 'telephone' | 'robotic_synth' | 'none';
}

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  mainRole: string; // e.g. "Lead Host", "Co-Host", "Expert Guest", "Antagonist"
  personality: string;
  quirks: string;
  background: string;
  voiceConfig: VoiceConfig;
  relationships: CharacterRelationship[];
}

export interface ScriptLine {
  id: string;
  characterId: string;
  characterName: string;
  text: string;
  emotionNote?: string; // e.g., "[Chuckles]", "[Whispering]", "[Interrupts]"
  sfxCue?: string;     // e.g., "applause", "chime", "dramatic_boom"
  bgmCue?: string;     // e.g., "tech_ambient", "lofi_chill"
  audioBase64?: string; // Synthesized or Gemini TTS audio
  durationSec?: number;
  isSceneHeader?: boolean; // If true, represents a scene divider header e.g. "Scene 1: Introduction"
  sceneTitle?: string;
  // Radio Ad Break & Commercial Spot Scheduler
  isAdBreak?: boolean;       // If true, represents a radio commercial spot or station ID
  adSponsorName?: string;    // e.g. "Apex Cybernetics", "W-LUNA 98.5 Station ID", "Corner Diner Radio Ad"
  adDurationSec?: number;    // e.g. 15, 30, 60 seconds
  adCategory?: 'Sponsor Spot' | 'Station ID' | 'PSA' | 'Promo Bump';
}

export type PodcastGenre = 
  | 'Tech & AI'
  | 'True Crime'
  | 'Comedy & Banter'
  | 'Sci-Fi & Cyberpunk'
  | 'Business & Finance'
  | 'Educational / Science'
  | 'Storytelling & Drama';

export interface PodcastProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre: PodcastGenre;
  coverUrl: string;
  mode: 'creator' | 'generative';
  targetDurationMinutes: number;
  characters: Character[];
  script: ScriptLine[];
  bgmTrack: string;
  soundBoard: string[];
  showNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SFXItem {
  id: string;
  name: string;
  category: string;
  iconName: string;
}
