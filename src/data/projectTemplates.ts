import { PodcastProject, Character } from '../types';

export interface ProjectTemplate {
  id: string;
  name: string;
  category: 'Interview' | 'Storytelling' | 'Daily News' | 'Comedy & Banter' | 'Radio Drama & Broadcast';
  tagline: string;
  description: string;
  genre: 'Tech & AI' | 'True Crime' | 'Comedy & Banter' | 'Sci-Fi & Cyberpunk' | 'Business & Finance' | 'Educational / Science' | 'Storytelling & Drama';
  iconName: string;
  targetDurationMinutes: number;
  characters: Character[];
  scriptSkeleton: Array<{
    characterName: string;
    text: string;
    emotionNote?: string;
    sfxCue?: string;
    isSceneHeader?: boolean;
    sceneTitle?: string;
  }>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-interview',
    name: 'In-Depth Expert Interview',
    category: 'Interview',
    tagline: 'Host and Guest deep-dive conversation format',
    description: 'A structured interview structure with opening host intro, guest background setup, probing deep-dive questions, and audience wrap-up.',
    genre: 'Tech & AI',
    iconName: 'Users',
    targetDurationMinutes: 10,
    characters: [
      {
        id: 'char-host',
        name: 'Alex Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Lead Host',
        personality: 'Curious, articulate, engaging interviewer.',
        quirks: 'Asks insightful follow-up questions and summarizes points warmly.',
        background: 'Veteran podcast journalist with 10 years of media experience.',
        voiceConfig: {
          voiceName: 'Puck',
          gender: 'Female',
          pitch: 1.0,
          rate: 1.0,
          tone: 'Conversational',
          emotionStyle: 'Enthusiastic'
        },
        relationships: []
      },
      {
        id: 'char-guest',
        name: 'Dr. Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Expert Guest',
        personality: 'Visionary, precise, passionate researcher.',
        quirks: 'Uses vivid analogies to explain complex frontier concepts.',
        background: 'Leading researcher in autonomous systems and AI alignment.',
        voiceConfig: {
          voiceName: 'Kore',
          gender: 'Female',
          pitch: 1.0,
          rate: 1.0,
          tone: 'Crisp & Analytical',
          emotionStyle: 'Professional'
        },
        relationships: [
          {
            id: 'rel-1',
            targetCharacterId: 'char-host',
            targetCharacterName: 'Alex Vance',
            relationshipType: 'Co-Host',
            notes: 'Friendly guest expert dynamic'
          }
        ]
      }
    ],
    scriptSkeleton: [
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 1: Introduction & Guest Welcome'
      },
      {
        characterName: 'Alex Vance',
        text: 'Welcome back to the studio, everyone! Today we have an extraordinary guest joining us—Dr. Elena Rostova, a pioneer in frontier research.',
        emotionNote: '[Enthusiastic]',
        sfxCue: 'chime'
      },
      {
        characterName: 'Dr. Elena Rostova',
        text: 'Thanks for having me, Alex! I\'m thrilled to be here and unpack what\'s happening on the bleeding edge.',
        emotionNote: '[Warm smile]'
      },
      {
        characterName: 'Alex Vance',
        text: 'Let\'s dive right into the core topic. What was the exact moment you realized this technology was about to shift everything?',
        emotionNote: '[Curious]'
      },
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 2: The Core Deep Dive'
      },
      {
        characterName: 'Dr. Elena Rostova',
        text: 'It happened about six months ago when our benchmark models unexpectedly achieved cross-domain reasoning overnight.',
        emotionNote: '[Thoughtful]'
      },
      {
        characterName: 'Alex Vance',
        text: 'That sounds monumental! How do you address skeptics who worry about safety and rapid deployment?',
        emotionNote: '[Engaged]'
      },
      {
        characterName: 'Dr. Elena Rostova',
        text: 'Skepticism is crucial! Safety frameworks must evolve in lockstep with raw capability.',
        emotionNote: '[Confident]'
      },
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 3: Key Takeaways & Wrap-up'
      },
      {
        characterName: 'Alex Vance',
        text: 'Dr. Rostova, thank you for sharing your incredible journey with us today! Where can our listeners follow your latest work?',
        emotionNote: '[Smiling]'
      },
      {
        characterName: 'Dr. Elena Rostova',
        text: 'Thank you Alex! Readers can find our open-access research papers and project updates at our laboratory website.',
        emotionNote: '[Upbeat]',
        sfxCue: 'applause'
      }
    ]
  },
  {
    id: 'template-storytelling',
    name: 'Narrative Storytelling & Mystery',
    category: 'Storytelling',
    tagline: 'Immersive narrative audio drama with suspense and music cues',
    description: 'A multi-character dramatic audio format with cold opens, atmospheric ambient cues, and cliffhangers.',
    genre: 'True Crime',
    iconName: 'BookOpen',
    targetDurationMinutes: 12,
    characters: [
      {
        id: 'char-narrator',
        name: 'Marcus Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Lead Narrator',
        personality: 'Deep, dramatic, atmospheric storyteller.',
        quirks: 'Uses subtle pauses for dramatic suspense.',
        background: 'Voice actor specializing in mystery audiobooks.',
        voiceConfig: {
          voiceName: 'Charon',
          gender: 'Male',
          pitch: 0.9,
          rate: 0.95,
          tone: 'Deep & Gravelly',
          emotionStyle: 'Dramatic'
        },
        relationships: []
      },
      {
        id: 'char-investigator',
        name: 'Detective Clara Ruiz',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Lead Investigator',
        personality: 'Relentless, sharp, pragmatic observer.',
        quirks: 'Notices tiny discrepancies in testimonies.',
        background: 'Former homicide detective turned cold case investigative podcast host.',
        voiceConfig: {
          voiceName: 'Puck',
          gender: 'Female',
          pitch: 1.0,
          rate: 1.0,
          tone: 'Conversational',
          emotionStyle: 'Calm'
        },
        relationships: []
      }
    ],
    scriptSkeleton: [
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 1: The Midnight Call'
      },
      {
        characterName: 'Marcus Vance',
        text: 'The rain beat relentlessly against the window panes of Sector 7. Nobody expected the phone to ring past midnight...',
        emotionNote: '[Suspenseful]',
        sfxCue: 'dramatic_boom'
      },
      {
        characterName: 'Detective Clara Ruiz',
        text: 'When I answered, there was only static at first—and then a whisper that sent chills down my spine.',
        emotionNote: '[Intense]'
      },
      {
        characterName: 'Marcus Vance',
        text: 'A single clue left at the scene would challenge everything Clara thought she knew about the case.',
        emotionNote: '[Ominous]'
      },
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 2: Uncovering Hidden Clues'
      },
      {
        characterName: 'Detective Clara Ruiz',
        text: 'I examined the cipher on the desk. The timestamp didn\'t align with the suspect\'s alibi at all.',
        emotionNote: '[Focused]'
      },
      {
        characterName: 'Marcus Vance',
        text: 'As the pieces began fitting together, the true danger began to reveal itself in the shadows.',
        emotionNote: '[Whispering]',
        sfxCue: 'gasp'
      }
    ]
  },
  {
    id: 'template-daily-news',
    name: 'Daily Tech & News Digest',
    category: 'Daily News',
    tagline: 'Crisp two-host morning briefing with market & headline updates',
    description: 'Fast-paced, high-energy headline briefing with quick transitions, sound bites, and key market analysis.',
    genre: 'Business & Finance',
    iconName: 'Newspaper',
    targetDurationMinutes: 5,
    characters: [
      {
        id: 'char-anchor',
        name: 'Samantha Miller',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        mainRole: 'News Anchor',
        personality: 'Fast-paced, punchy, authoritative broadcaster.',
        quirks: 'Smooth news transitions and upbeat pacing.',
        background: 'Broadcast journalist with morning radio background.',
        voiceConfig: {
          voiceName: 'Puck',
          gender: 'Female',
          pitch: 1.05,
          rate: 1.1,
          tone: 'Upbeat & Energetic',
          emotionStyle: 'Enthusiastic'
        },
        relationships: []
      },
      {
        id: 'char-[#C85A32]',
        name: 'David Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Market Analyst',
        personality: 'Analytical, witty, sharp market commentary.',
        quirks: 'Breaks down numbers into actionable insights.',
        background: 'Financial analyst and tech trend forecaster.',
        voiceConfig: {
          voiceName: 'Zephyr',
          gender: 'Male',
          pitch: 1.0,
          rate: 1.05,
          tone: 'Warm & Authoritative',
          emotionStyle: 'Professional'
        },
        relationships: []
      }
    ],
    scriptSkeleton: [
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 1: Headline Briefing'
      },
      {
        characterName: 'Samantha Miller',
        text: 'Good morning! It\'s 8:00 AM, and here are the top tech and market stories you need to know today.',
        emotionNote: '[Upbeat]',
        sfxCue: 'chime'
      },
      {
        characterName: 'David Chen',
        text: 'Thanks Samantha! Markets opened strong this morning following major quarterly earnings reports from leading tech firms.',
        emotionNote: '[Energetic]'
      },
      {
        characterName: 'Samantha Miller',
        text: 'Our top story: new regulations proposed today could reshape global AI deployment standards.',
        emotionNote: '[Focused]'
      },
      {
        characterName: 'David Chen',
        text: 'Investors are watching closely as tech indices rose 2.4% in early morning trading.',
        emotionNote: '[Analytical]'
      }
    ]
  },
  {
    id: 'template-comedy',
    name: 'Co-Host Banter & Hot Takes',
    category: 'Comedy & Banter',
    tagline: 'Hilarious two-host discussion on pop culture and bizarre news',
    description: 'High chemistry, witty banter template with laugh cues, quick interruptions, and comedic sound effects.',
    genre: 'Comedy & Banter',
    iconName: 'Smile',
    targetDurationMinutes: 8,
    characters: [
      {
        id: 'char-hosta',
        name: 'Leo Sparks',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Co-Host & Instigator',
        personality: 'High energy, comedic, loves wild hypotheses.',
        quirks: 'Bursts out laughing mid-sentence.',
        background: 'Stand-up comedian and viral podcast creator.',
        voiceConfig: {
          voiceName: 'Fenrir',
          gender: 'Male',
          pitch: 1.1,
          rate: 1.1,
          tone: 'Upbeat & Energetic',
          emotionStyle: 'Enthusiastic'
        },
        relationships: []
      },
      {
        id: 'char-hostb',
        name: 'Maya Lin',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Co-Host & Straight-Shooter',
        personality: 'Sarcastic, quick-witted, dry humor.',
        quirks: 'Calls out Leo\'s crazy theories with sharp retorts.',
        background: 'Writer and pop-culture commentator.',
        voiceConfig: {
          voiceName: 'Puck',
          gender: 'Female',
          pitch: 1.0,
          rate: 1.0,
          tone: 'Conversational',
          emotionStyle: 'Sarcastic'
        },
        relationships: [
          {
            id: 'rel-banter',
            targetCharacterId: 'char-hosta',
            targetCharacterName: 'Leo Sparks',
            relationshipType: 'Co-Host',
            notes: 'Friendly comedic rivalry'
          }
        ]
      }
    ],
    scriptSkeleton: [
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Scene 1: Bizarre Weekly News'
      },
      {
        characterName: 'Leo Sparks',
        text: 'Maya, I need you to brace yourself for the wildest news headline I have ever read in my entire life.',
        emotionNote: '[Laughing]',
        sfxCue: 'applause'
      },
      {
        characterName: 'Maya Lin',
        text: 'Leo, every week you say that, and every week it\'s just a story about someone trying to train a raccoon.',
        emotionNote: '[Deadpan]'
      },
      {
        characterName: 'Leo Sparks',
        text: 'Hey! That raccoon learned how to open a safe! But no, today\'s story is even better.',
        emotionNote: '[Excited]',
        sfxCue: 'chime'
      }
    ]
  },
  {
    id: 'template-radio-drama',
    name: 'Golden Age Sci-Fi Radio Play',
    category: 'Radio Drama & Broadcast',
    tagline: 'Retro radio theater with announcer intro, voice actors, and foley sound effects',
    description: 'Designed specifically for voice acting radio plays. Features studio DJ station IDs, distinct voice talent profiles, radio static transitions, phone call filters, and live foley SFX cues.',
    genre: 'Sci-Fi & Cyberpunk',
    iconName: 'Radio',
    targetDurationMinutes: 15,
    characters: [
      {
        id: 'char-radio-dj',
        name: 'DJ Johnny Flash',
        avatarUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Station DJ & Announcer',
        personality: 'Booming, theatrical 1950s radio host voice.',
        quirks: 'Uses vintage radio jargon and dramatic station call-sign intros.',
        background: 'Senior broadcast operator at W-LUNA Lunar Radio 98.5 FM.',
        voiceConfig: {
          voiceName: 'Charon',
          gender: 'Male',
          pitch: 0.9,
          rate: 1.05,
          tone: 'Deep & Gravelly',
          emotionStyle: 'Enthusiastic'
        },
        relationships: []
      },
      {
        id: 'char-hero-actor',
        name: 'Captain Jack Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Hero / Lead Voice Actor',
        personality: 'Brave, resolute, heroic space patrol commander.',
        quirks: 'Delivers tense cliffhanger lines with dramatic pauses.',
        background: 'Veteran radio actor trained in classic theatrical audio plays.',
        voiceConfig: {
          voiceName: 'Fenrir',
          gender: 'Male',
          pitch: 1.0,
          rate: 1.0,
          tone: 'Warm & Authoritative',
          emotionStyle: 'Dramatic'
        },
        relationships: []
      },
      {
        id: 'char-villain-actor',
        name: 'Baroness Von Static',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Antagonist Voice Actor',
        personality: 'Calculated, ominous, sinister alien empress.',
        quirks: 'Evil chuckle before delivering threats over radio static.',
        background: 'Voice actress specializing in dramatic radio audio dramas.',
        voiceConfig: {
          voiceName: 'Puck',
          gender: 'Female',
          pitch: 0.85,
          rate: 0.95,
          tone: 'Crisp & Analytical',
          emotionStyle: 'Dramatic'
        },
        relationships: [
          {
            id: 'rel-[#C85A32]',
            targetCharacterId: 'char-hero-actor',
            targetCharacterName: 'Captain Jack Vance',
            relationshipType: 'Enemy',
            notes: 'Arch-nemesis across radio episodes'
          }
        ]
      },
      {
        id: 'char-radio-caller',
        name: 'Mrs. Gable (Caller)',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        mainRole: 'Listener Call-In (Telephone Filter)',
        personality: 'Panicked, breathless listener calling from Sector 4.',
        quirks: 'Voice filtered through telephone audio distortion.',
        background: 'Regular listener calling the radio station hotline.',
        voiceConfig: {
          voiceName: 'Kore',
          gender: 'Female',
          pitch: 1.15,
          rate: 1.1,
          tone: 'Upbeat & Energetic',
          emotionStyle: 'Dramatic'
        },
        relationships: []
      }
    ],
    scriptSkeleton: [
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Station Intro & Call-Sign Jingle'
      },
      {
        characterName: 'DJ Johnny Flash',
        text: 'You are listening to W-LUNA, 98.5 on your radio dial! Live from the broadcast booth, we present tonight\'s main theatrical radio presentation: Invasion of the Frequency Waves!',
        emotionNote: '[Booming Radio Mic Filter]',
        sfxCue: 'chime'
      },
      {
        characterName: 'SCENE',
        text: '',
        isSceneHeader: true,
        sceneTitle: 'Act 1: The Midnight Signal'
      },
      {
        characterName: 'Captain Jack Vance',
        text: 'Control room, this is Captain Vance. The radar sweep is pickin\' up an unidentified signal approaching the outer atmosphere...',
        emotionNote: '[Over Radio Comm]',
        sfxCue: 'radio_static'
      },
      {
        characterName: 'Mrs. Gable (Caller)',
        text: 'Johnny! Johnny, is the radio station still on the air? My television set just turned into complete static!',
        emotionNote: '[Telephone Line Filter - Panicked]',
        sfxCue: 'keyboard_clicks'
      },
      {
        characterName: 'Baroness Von Static',
        text: 'Ha-ha-ha! Foolish earthly listeners... do not adjust your radio dials. Your frequency now belongs to me!',
        emotionNote: '[Sinister Laugh - Over Echo Effect]',
        sfxCue: 'dramatic_boom'
      },
      {
        characterName: 'Captain Jack Vance',
        text: 'Not while I\'m on duty, Baroness! Re-routing power to the emergency transmitter now!',
        emotionNote: '[Determined - Foley: Switch Flip]',
        sfxCue: 'applause'
      }
    ]
  }
];
