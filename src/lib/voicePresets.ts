import { Character, VoiceConfig, PodcastProject } from '../types';

export interface VoicePreset {
  id: string;
  name: string;
  category: 'Broadcaster & Host' | 'Co-Host & Banter' | 'Journalist & News' | 'Drama & Storytelling' | 'Tech & Expert' | 'Cyber & AI';
  gender: 'Male' | 'Female' | 'Non-binary' | 'AI / Synth';
  voiceName: string;
  pitch: number;
  rate: number;
  tone: string;
  emotionStyle: 'Enthusiastic' | 'Sarcastic' | 'Calm' | 'Dramatic' | 'Whispering' | 'Professional';
  audioEffect: 'studio_warmth' | 'fm_radio' | 'crisp_clear' | 'deep_baritone' | 'telephone' | 'robotic_synth' | 'none';
  description: string;
  samplePhrase: string;
  badgeColor: string;
}

export const STUDIO_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'warm-studio-host',
    name: 'Warm Studio Broadcaster',
    category: 'Broadcaster & Host',
    gender: 'Male',
    voiceName: 'Zephyr',
    pitch: 0.95,
    rate: 1.0,
    tone: 'Warm, Resonant & Authoritative',
    emotionStyle: 'Professional',
    audioEffect: 'studio_warmth',
    description: 'Deep broadcast presence with low-end resonance. Excellent for main anchors & longform podcasters.',
    samplePhrase: "Welcome back to the studio. Today we're exploring deep stories, big ideas, and fresh perspectives.",
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    id: 'natural-co-host',
    name: 'Natural Conversational Host',
    category: 'Co-Host & Banter',
    gender: 'Female',
    voiceName: 'Puck',
    pitch: 1.05,
    rate: 1.02,
    tone: 'Articulate, Smooth & Engaging',
    emotionStyle: 'Enthusiastic',
    audioEffect: 'crisp_clear',
    description: 'Bright, balanced, highly intelligible voice perfect for co-hosting, lively interviews, and daily chatter.',
    samplePhrase: "Hey everyone! I'm super excited about today's episode. We have so much ground to cover!",
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  {
    id: 'fm-radio-dj',
    name: 'FM Radio Morning DJ',
    category: 'Broadcaster & Host',
    gender: 'Male',
    voiceName: 'Fenrir',
    pitch: 0.88,
    rate: 1.08,
    tone: 'Punchy FM Broadcast Presence',
    emotionStyle: 'Enthusiastic',
    audioEffect: 'fm_radio',
    description: 'High-energy FM radio compression with crisp presence. Ideal for morning radio, comedy spots, and promos.',
    samplePhrase: "You're locked into W-LUNA 98.5! Coming up next, the top tech headlines and live studio banter!",
    badgeColor: 'bg-red-100 text-red-900 border-red-300'
  },
  {
    id: 'investigative-reporter',
    name: 'Investigative Journalist',
    category: 'Journalist & News',
    gender: 'Female',
    voiceName: 'Kore',
    pitch: 0.98,
    rate: 0.95,
    tone: 'Precise, Inquisitive & Sharp',
    emotionStyle: 'Professional',
    audioEffect: 'crisp_clear',
    description: 'Measured, serious, analytical cadence designed for true crime, investigative news, and deep dives.',
    samplePhrase: "The official records told one story. But when we examined the internal logs, a completely different picture emerged.",
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    id: 'tech-innovator',
    name: 'Energetic Tech Specialist',
    category: 'Tech & Expert',
    gender: 'Male',
    voiceName: 'Zephyr',
    pitch: 1.12,
    rate: 1.10,
    tone: 'Upbeat, Fast-Paced & Tech Savvy',
    emotionStyle: 'Enthusiastic',
    audioEffect: 'crisp_clear',
    description: 'Dynamic, fast-moving tone tuned for gadget reviews, software news, startup pitches, and developer banter.',
    samplePhrase: "This new neural architecture changes everything. Benchmark speeds are up forty percent across the board!",
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  {
    id: 'calm-narrator',
    name: 'Soothing Documentarian',
    category: 'Drama & Storytelling',
    gender: 'Female',
    voiceName: 'Puck',
    pitch: 0.90,
    rate: 0.86,
    tone: 'Soothing, Relaxed & Reflective',
    emotionStyle: 'Calm',
    audioEffect: 'studio_warmth',
    description: 'Gentle, meditative cadence for audiobooks, nature documentaries, ambient philosophy, and calm storytelling.',
    samplePhrase: "In the quiet hours before dawn, the city breathes differently. Every alleyway holds a forgotten history.",
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
  },
  {
    id: 'dramatic-baritone',
    name: 'Gravelly Mystery Narrator',
    category: 'Drama & Storytelling',
    gender: 'Male',
    voiceName: 'Charon',
    pitch: 0.72,
    rate: 0.88,
    tone: 'Deep, Cinematic Baritone',
    emotionStyle: 'Dramatic',
    audioEffect: 'deep_baritone',
    description: 'Ultra-low, brooding voice with heavy acoustic presence for sci-fi, horror, noir thrillers, and cinematic intros.',
    samplePhrase: "Some doors should remain closed. Once you step into the shadows, there is no turning back.",
    badgeColor: 'bg-slate-200 text-slate-900 border-slate-400'
  },
  {
    id: 'executive-expert',
    name: 'Thought Leader / Strategist',
    category: 'Tech & Expert',
    gender: 'Female',
    voiceName: 'Kore',
    pitch: 1.02,
    rate: 0.98,
    tone: 'Authoritative Business & Keynote',
    emotionStyle: 'Professional',
    audioEffect: 'studio_warmth',
    description: 'Polished executive voice designed for finance, venture capital, leadership keynotes, and industry analysis.',
    samplePhrase: "If you look at market fundamentals over a ten year horizon, sustainable growth requires core technical leverage.",
    badgeColor: 'bg-amber-100 text-stone-900 border-stone-300'
  },
  {
    id: 'comedic-sidekick',
    name: 'Witty Comedic Co-Host',
    category: 'Co-Host & Banter',
    gender: 'Male',
    voiceName: 'Fenrir',
    pitch: 1.20,
    rate: 1.15,
    tone: 'Playful, Fast & Humorous',
    emotionStyle: 'Sarcastic',
    audioEffect: 'fm_radio',
    description: 'Quick-witted, comedic voice with elastic pitch jumps and high energy for humorous side-commentary.',
    samplePhrase: "Wait, hold on! Are you seriously telling me you tried to fix a neural net with a physical screwdriver?!",
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
  },
  {
    id: 'cyber-assistant',
    name: 'Cyberpunk Synth Companion',
    category: 'Cyber & AI',
    gender: 'AI / Synth',
    voiceName: 'Zephyr',
    pitch: 1.38,
    rate: 1.22,
    tone: 'Futuristic Modulated Synth',
    emotionStyle: 'Professional',
    audioEffect: 'robotic_synth',
    description: 'Distinct electronic AI voice profile for futuristic podcasts, virtual co-hosts, system updates, and sci-fi pods.',
    samplePhrase: "Subsystem initialized. Real-time audio stream buffer calibrated. Ready for voice synthesis.",
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300'
  }
];

// Automatically tune all characters in a project to have distinct, high-quality voice profiles
export function autoTuneProjectVoices(project: PodcastProject): Character[] {
  if (!project.characters || project.characters.length === 0) return [];

  const availablePresets = [...STUDIO_VOICE_PRESETS];

  return project.characters.map((char, index) => {
    // Attempt to match preset by gender / role if possible, or cycle presets
    let matchedPreset = availablePresets.find((p) => {
      if (char.voiceConfig?.gender && p.gender !== char.voiceConfig.gender) return false;
      const roleLower = char.mainRole.toLowerCase();
      if (roleLower.includes('host') && p.category.includes('Broadcaster')) return true;
      if (roleLower.includes('co-host') && p.category.includes('Co-Host')) return true;
      if (roleLower.includes('expert') || roleLower.includes('guest') && p.category.includes('Expert')) return true;
      return false;
    });

    if (!matchedPreset) {
      matchedPreset = availablePresets[index % availablePresets.length];
    }

    return {
      ...char,
      voiceConfig: {
        voiceName: matchedPreset.voiceName,
        gender: matchedPreset.gender,
        pitch: matchedPreset.pitch,
        rate: matchedPreset.rate,
        tone: matchedPreset.tone,
        emotionStyle: matchedPreset.emotionStyle,
        audioEffect: matchedPreset.audioEffect,
      } as VoiceConfig
    };
  });
}
