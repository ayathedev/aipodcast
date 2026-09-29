import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper function to sanitize JSON text from markdown code fences
function cleanJsonResponseText(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Resilient Gemini generator with automatic retries and model fallbacks for 503/429/high demand
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const isImageRequest =
    params.preferredModel?.includes('image') ||
    params.config?.imageConfig !== undefined;

  const defaultTextModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
  ];

  const defaultImageModels = [
    'gemini-3.1-flash-lite-image',
    'gemini-3.1-flash-image',
    'gemini-3-pro-image',
  ];

  const baseList = isImageRequest ? defaultImageModels : defaultTextModels;
  const initialModel = params.preferredModel || baseList[0];

  const modelsToTry = [initialModel, ...baseList].filter(
    (model, idx, self) => self.indexOf(model) === idx
  );

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Invoking model '${modelName}' (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);

        const isQuotaExceeded =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('limit:');

        if (isQuotaExceeded) {
          console.log(`[Gemini API Note] Model '${modelName}' reached quota/rate limit. Switching to next candidate model...`);
          break;
        }

        console.warn(`[Gemini API Warning] Model '${modelName}' attempt ${attempt} failed: ${errMsg.slice(0, 200)}`);

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('500') ||
          errMsg.includes('INTERNAL');

        if (!isTransient && attempt === 1) {
          // Skip to next model immediately for non-transient error
          break;
        }

        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('All Gemini API models are currently unavailable due to quota or network limits. Please try again shortly.');
}

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Casting Tool: Generate character sheets & relationship links
app.post('/api/gemini/generate-casting', async (req, res) => {
  try {
    const { concept, numCharacters = 2, genre = 'Tech & AI' } = req.body;
    const ai = getGeminiAI();

    const prompt = `Create ${numCharacters} distinct, vibrant podcast character sheets for a podcast with genre "${genre}".
Concept/Premise: "${concept}"

Ensure characters have:
- Clear names and main story roles (e.g. Lead Host, Co-Host, Expert Guest, Skeptical Journalist, Rival)
- Unique personalities, funny or interesting quirks, and detailed backgrounds
- Distinct voice profiles (voiceName chosen from Puck, Charon, Kore, Fenrir, Zephyr; gender, pitch, rate, tone, emotionStyle)
- Clickable relationship connections linking characters to each other (e.g. Rival, Ally, Co-Host, Mentor, Skeptic).`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              mainRole: { type: Type.STRING },
              personality: { type: Type.STRING },
              quirks: { type: Type.STRING },
              background: { type: Type.STRING },
              voiceConfig: {
                type: Type.OBJECT,
                properties: {
                  voiceName: { type: Type.STRING },
                  gender: { type: Type.STRING },
                  pitch: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                  tone: { type: Type.STRING },
                  emotionStyle: { type: Type.STRING },
                },
                required: ['voiceName', 'gender', 'pitch', 'rate', 'tone', 'emotionStyle'],
              },
              relationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    targetCharacterName: { type: Type.STRING },
                    relationshipType: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['targetCharacterName', 'relationshipType', 'notes'],
                },
              },
            },
            required: ['name', 'mainRole', 'personality', 'quirks', 'background', 'voiceConfig', 'relationships'],
          },
        },
      },
    });

    const charactersData = JSON.parse(cleanJsonResponseText(response.text || '[]'));
    res.json({ characters: charactersData });
  } catch (error: any) {
    console.error('Casting generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate casting' });
  }
});

// 3. Scripting Tool: AI Assistant to modify, edit, rewrite, or expand podcast dialogue lines
app.post('/api/gemini/generate-script', async (req, res) => {
  try {
    const { characters = [], existingScript = [], prompt = '', actionType = 'custom', aiTarget } = req.body;
    const ai = getGeminiAI();

    const charactersSummary = characters
      .map((c: any) => `- ${c.name} (${c.mainRole}): ${c.personality}. Voice style: ${c.voiceConfig?.emotionStyle || 'Natural'}`)
      .join('\n');

    const formattedExistingScript = existingScript.length > 0
      ? existingScript.map((l: any, i: number) => `Line ${i + 1} (ID: ${l.id}) [${l.isSceneHeader ? 'SCENE HEADER' : l.characterName}] ${l.sceneTitle ? l.sceneTitle : ''} (Emotion: ${l.emotionNote || 'Natural'}): "${l.text}"`).join('\n')
      : 'Script is currently empty.';
      
    let targetInstruction = '';
    if (aiTarget) {
      if (aiTarget.type === 'line') {
        targetInstruction = `CRITICAL FOCUS: You must ONLY modify, rewrite, or adjust the line with ID "${aiTarget.id}". Do not alter the rest of the script, just return the full script with that one line changed according to: "${prompt}".`;
      } else if (aiTarget.type === 'scene') {
        targetInstruction = `CRITICAL FOCUS: You must ONLY modify or expand the scene containing the scene header ID "${aiTarget.id}" and the lines underneath it (until the next scene header). Keep the rest of the script intact. Instructions for this scene: "${prompt}".`;
      } else if (aiTarget.type === 'after') {
        targetInstruction = `CRITICAL FOCUS: You must generate new lines and insert them immediately AFTER the line with ID "${aiTarget.id}". Keep the existing script intact. Instructions for the new insertion: "${prompt}".`;
      }
    }

    const fullPrompt = `You are an expert podcast scriptwriter and dialogue editor.
Characters in podcast:
${charactersSummary}

Current Full Script (${existingScript.length} lines):
${formattedExistingScript}

User Instruction: "${prompt}"

${targetInstruction ? targetInstruction + '\n\n' : ''}Task: Apply the user's requested change to the podcast script.
Instructions:
- If the instruction asks to edit, rewrite, polish, translate, shorten, expand, or adjust tone of existing lines, modify the relevant lines accordingly while preserving context.
- If the instruction asks to add new lines or continue the conversation, append or insert the new dialogue turns naturally.
- If the instruction asks to replace or start fresh, create a brand new script.
- Ensure all line characterNames strictly match one of the available character names: ${characters.map((c: any) => c.name).join(', ')}.
- Include emotion notes (emotionNote) like "[Chuckles]", "[Skeptical]", "[Enthusiastic]" and optional sfxCues ("intro_chime", "dramatic_boom", "keyboard_clicks", "applause", "laughter", "coffee_sip").
- Preserve the 'id', 'isSceneHeader', and 'sceneTitle' fields for lines that you do not change. For new lines, you can omit the 'id' (the frontend will generate one).

Return a JSON array containing the complete modified list of script lines after applying the changes.`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              characterName: { type: Type.STRING },
              text: { type: Type.STRING },
              emotionNote: { type: Type.STRING },
              sfxCue: { type: Type.STRING },
              isSceneHeader: { type: Type.BOOLEAN },
              sceneTitle: { type: Type.STRING }
            },
            required: ['characterName', 'text'],
          },
        },
      },
    });

    const generatedLines = JSON.parse(cleanJsonResponseText(response.text || '[]'));
    res.json({ lines: generatedLines });
  } catch (error: any) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
});

// 4. Generative Mode: Full Prompt-to-Podcast Automation
app.post('/api/gemini/generative-podcast', async (req, res) => {
  try {
    const { topic, genre = 'Tech & AI', podcastStyle = 'Debate & Banter', targetDurationMinutes = 3, musicMood = 'tech_ambient' } = req.body;
    const ai = getGeminiAI();

    const systemPrompt = `You are a world-class AI Podcast Producer.
Automate a complete, production-ready podcast episode based on the following user prompt:
Topic / Premise: "${topic}"
Genre: "${genre}"
Style: "${podcastStyle}"
Target Duration: ${targetDurationMinutes} minutes
Music Mood: "${musicMood}"

You must create:
1. Title, catchy tagline, and descriptive summary
2. 2 to 3 rich cast members (characters) with distinct voices (Puck, Charon, Kore, Fenrir, Zephyr), traits, quirks, background, and reciprocal relationship links
3. A complete 8-12 turn script with lively banter, emotion notes, and sound effect cues (sfxCue)
4. Show notes with key takeaways and timestamps.`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            description: { type: Type.STRING },
            genre: { type: Type.STRING },
            coverDescription: { type: Type.STRING },
            showNotes: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  mainRole: { type: Type.STRING },
                  personality: { type: Type.STRING },
                  quirks: { type: Type.STRING },
                  background: { type: Type.STRING },
                  voiceConfig: {
                    type: Type.OBJECT,
                    properties: {
                      voiceName: { type: Type.STRING },
                      gender: { type: Type.STRING },
                      pitch: { type: Type.NUMBER },
                      rate: { type: Type.NUMBER },
                      tone: { type: Type.STRING },
                      emotionStyle: { type: Type.STRING },
                    },
                    required: ['voiceName', 'gender', 'pitch', 'rate', 'tone', 'emotionStyle'],
                  },
                  relationships: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        targetCharacterName: { type: Type.STRING },
                        relationshipType: { type: Type.STRING },
                        notes: { type: Type.STRING },
                      },
                      required: ['targetCharacterName', 'relationshipType', 'notes'],
                    },
                  },
                },
                required: ['name', 'mainRole', 'personality', 'quirks', 'background', 'voiceConfig', 'relationships'],
              },
            },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterName: { type: Type.STRING },
                  text: { type: Type.STRING },
                  emotionNote: { type: Type.STRING },
                  sfxCue: { type: Type.STRING },
                },
                required: ['characterName', 'text'],
              },
            },
          },
          required: ['title', 'tagline', 'description', 'genre', 'characters', 'script', 'showNotes'],
        },
      },
    });

    const podcastData = JSON.parse(cleanJsonResponseText(response.text || '{}'));
    res.json({ projectData: podcastData });
  } catch (error: any) {
    console.error('Generative podcast creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create generative podcast' });
  }
});

// Image Generation API for Character Avatars
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const ai = getGeminiAI();

    let base64Image: string | null = null;
    let mimeType = 'image/png';

    try {
      const response = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }
      }
    } catch (modelErr: any) {
      console.log('[Gemini API Note] Primary Gemini image model unavailable, attempting secondary AI generator.');
    }

    if (!base64Image) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(`${prompt}, studio portrait avatar, 8k resolution, detailed lighting`);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${seed}`;
        
        const imgRes = await fetch(pollinationsUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Image = buffer.toString('base64');
          mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        }
      } catch (pollinationsErr) {
        console.warn('Secondary AI avatar generator error:', pollinationsErr);
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:${mimeType};base64,${base64Image}` });
    } else {
      // High-quality curated avatar fallbacks
      const fallbackAvatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      ];
      const randomAvatar = fallbackAvatars[Math.floor(Math.random() * fallbackAvatars.length)];
      res.json({ 
        imageUrl: randomAvatar, 
        note: 'AI image model limit reached. Applied avatar preset.' 
      });
    }
  } catch (error: any) {
    console.error('Image generation endpoint error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Dedicated Cover Art & Title Image Generation API
app.post('/api/gemini/generate-cover-art', async (req, res) => {
  try {
    const { title = 'Podcast Show', tagline = '', genre = 'General', artStyle = 'Cyberpunk Synthwave', customPrompt = '' } = req.body;
    const ai = getGeminiAI();

    // First generate a rich visual prompt description for cover art using Gemini Flash
    const promptRefinementText = `You are an expert graphic designer and album artwork director.
Create a detailed, vivid image generation prompt for a high-impact 1:1 square Podcast Cover Art image.
Podcast Title: "${title}"
Tagline: "${tagline}"
Genre: "${genre}"
Visual Art Style: "${artStyle}"
${customPrompt ? `User's specific preference: "${customPrompt}"` : ''}

Output ONLY a concise 2-sentence visual prompt suitable for an AI image generator (such as Imagen). Describe background elements, lighting, composition, colors, and key symbolic iconography. Do NOT include words like "Here is a prompt:".`;

    let visualPrompt = `${artStyle} style podcast cover art for a show titled "${title}", ${genre} theme, professional album artwork, high detail 1:1 graphic design`;

    try {
      const promptResponse = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.7-flash',
        contents: promptRefinementText,
      });
      if (promptResponse.text) {
        visualPrompt = promptResponse.text.trim();
      }
    } catch (e: any) {
      console.log('Cover art prompt refinement note: using default prompt.');
    }

    // Now attempt image generation using image model
    let base64Image: string | null = null;
    let mimeType = 'image/png';

    try {
      const imageResponse = await generateContentWithFallback(ai, {
        preferredModel: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: visualPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        },
      });

      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }
      }
    } catch (imgErr: any) {
      console.log('[Gemini API Note] Cover art image model quota limit reached, attempting secondary AI generator.');
    }

    if (!base64Image) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const encoded = encodeURIComponent(`${visualPrompt}, 8k resolution, cinematic lighting, masterpiece, podcast cover artwork background, vector graphics, album art, clean typography-ready, no text`);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        const imgRes = await fetch(pollinationsUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Image = buffer.toString('base64');
          mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        }
      } catch (fetchErr) {
        console.warn('Secondary AI cover art image generator error:', fetchErr);
      }
    }

    if (!base64Image) {
      // Guaranteed abstract procedural SVG image fallback encoded as base64 data URI
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#311042"/>
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#c85a32" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)"/>
        <circle cx="512" cy="450" r="380" fill="url(#glow)"/>
        <circle cx="512" cy="450" r="280" fill="none" stroke="#c85a32" stroke-width="4" stroke-dasharray="12 12" opacity="0.6"/>
        <path d="M 112 512 Q 312 350 512 512 T 912 512" fill="none" stroke="#38bdf8" stroke-width="8" opacity="0.7"/>
        <path d="M 112 540 Q 312 680 512 540 T 912 540" fill="none" stroke="#f43f5e" stroke-width="6" opacity="0.6"/>
      </svg>`;
      base64Image = Buffer.from(fallbackSvg).toString('base64');
      mimeType = 'image/svg+xml';
    }

    res.json({
      visualPrompt,
      imageUrl: `data:${mimeType};base64,${base64Image}`,
    });
  } catch (error: any) {
    console.error('Cover art generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate cover art' });
  }
});

// Co-creation Script Chat API
app.post('/api/gemini/script-chat', async (req, res) => {
  try {
    const { characters = [], existingScript = [], messages = [], newMessage = '' } = req.body;
    const ai = getGeminiAI();

    const charactersSummary = characters
      .map((c: any) => `- ${c.name} (${c.mainRole}): ${c.personality}. Voice style: ${c.voiceConfig?.emotionStyle || 'Natural'}`)
      .join('\n');

    const formattedExistingScript = existingScript.length > 0
      ? existingScript.map((l: any, i: number) => `Line ${i + 1} (ID: ${l.id}) [${l.isSceneHeader ? 'SCENE HEADER' : l.characterName}] ${l.sceneTitle ? l.sceneTitle : ''} (Emotion: ${l.emotionNote || 'Natural'}): "${l.text}"`).join('\n')
      : 'Script is currently empty.';

    const conversationHistory = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `You are an expert podcast co-creator and dialogue writer collaborating with the user in real-time.
Characters in podcast:
${charactersSummary}

Current Full Script (${existingScript.length} lines):
${formattedExistingScript}

Conversation History:
${conversationHistory}

User's Latest Message: "${newMessage}"

Task: 
1. Have a helpful, conversational discussion with the user about the podcast script ideas, tone, flow, or edits.
2. If the user's message requests script changes (e.g. adding lines, rewriting, adjusting tone, fixing banter, adding SFX, adding scenes), update the script accordingly. If no script changes are requested or it's just a brainstorming question, return the existing script unchanged in the 'lines' array.
3. Ensure all line characterNames strictly match one of the available character names: ${characters.map((c: any) => c.name).join(', ')}.
4. Include emotion notes (emotionNote) and sfxCues when appropriate.
5. Preserve the 'id', 'isSceneHeader', and 'sceneTitle' fields for lines that you do not change. For new lines, you can omit the 'id'.

Return a JSON object with:
- "reply": Your friendly conversational response to the user.
- "lines": The complete list of script lines (updated if changes were made, or the original lines if no script edits were needed).`;

    const response = await generateContentWithFallback(ai, {
      preferredModel: 'gemini-3.7-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  characterName: { type: Type.STRING },
                  text: { type: Type.STRING },
                  emotionNote: { type: Type.STRING },
                  sfxCue: { type: Type.STRING },
                  isSceneHeader: { type: Type.BOOLEAN },
                  sceneTitle: { type: Type.STRING }
                },
                required: ['characterName', 'text'],
              },
            },
          },
          required: ['reply', 'lines'],
        },
      },
    });

    const data = JSON.parse(cleanJsonResponseText(response.text || '{"reply": "I am ready to help co-create!", "lines": []}'));
    res.json(data);
  } catch (error: any) {
    console.error('Script chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process script chat' });
  }
});

// 5. Speech / TTS API for character voicing
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Zephyr', promptStyle = '' } = req.body;
    const ai = getGeminiAI();

    const ttsPrompt = promptStyle ? `Say ${promptStyle}: ${text}` : text;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      res.json({ audioBase64, sampleRate: 24000 });
    } else {
      res.json({ audioBase64: null, message: 'Audio synthesis unavailable, fallback to Web Speech' });
    }
  } catch (error: any) {
    console.log('[Gemini API Note] Gemini TTS unavailable or quota reached, falling back to browser Web Speech API.');
    res.json({ audioBase64: null, fallback: true });
  }
});

// Express server launch & Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

