import { PodcastProject, ScriptLine } from '../types';
// @ts-ignore
import * as lameModule from 'lamejs';

export interface RenderedStem {
  id: string;
  name: string;
  description: string;
  filename: string;
  blob: Blob;
  durationSec: number;
}

/**
 * Convert an AudioBuffer to a 16-bit PCM WAV Blob
 */
export function bufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteLength = numSamples * blockAlign;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  // Write RIFF Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalByteLength - 8, true);
  writeString(view, 8, 'WAVE');

  // Write Format Chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // Write Data Chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave channels & write PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert an AudioBuffer to an MP3 Blob using lamejs MP3 encoder
 */
export function audioBufferToMp3Blob(buffer: AudioBuffer, bitrateKbps = 192): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;

  let mp3encoder: any = null;
  try {
    const LameObj = (lameModule as any).default || lameModule;
    if (LameObj && LameObj.Mp3Encoder) {
      mp3encoder = new LameObj.Mp3Encoder(numChannels, sampleRate, bitrateKbps);
    } else if ((window as any).lamejs && (window as any).lamejs.Mp3Encoder) {
      mp3encoder = new (window as any).lamejs.Mp3Encoder(numChannels, sampleRate, bitrateKbps);
    }
  } catch (e) {
    console.warn('Lamejs encoder instantiation error:', e);
  }

  if (!mp3encoder) {
    console.warn('MP3 encoder unavailable, falling back to WAV Blob');
    return bufferToWav(buffer);
  }

  const mp3Data: Uint8Array[] = [];
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;

  const samplesCount = buffer.length;
  const leftInt16 = new Int16Array(samplesCount);
  const rightInt16 = new Int16Array(samplesCount);

  for (let i = 0; i < samplesCount; i++) {
    const l = Math.max(-1, Math.min(1, leftChannel[i]));
    const r = Math.max(-1, Math.min(1, rightChannel[i]));
    leftInt16[i] = l < 0 ? l * 32768 : l * 32767;
    rightInt16[i] = r < 0 ? r * 32768 : r * 32767;
  }

  const sampleBlockSize = 1152;
  for (let i = 0; i < samplesCount; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);

    let mp3buf: Int8Array | Uint8Array;
    if (numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf && mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Calculate timeline timestamps for script items
 */
export function getScriptTimelineTiming(script: ScriptLine[]): Array<{ line: ScriptLine; startTime: number; duration: number }> {
  let currentTime = 1.0; // 1s intro buffer
  return script.map((line) => {
    let duration = 3.0;
    if (line.isSceneHeader) {
      duration = 1.0;
    } else if (line.isAdBreak) {
      duration = line.adDurationSec || 15;
    } else {
      const wordCount = (line.text || '').split(/\s+/).filter(Boolean).length;
      duration = Math.max(2.5, wordCount * 0.35);
    }
    const startTime = currentTime;
    currentTime += duration + 0.4; // 400ms gap between lines
    return { line, startTime, duration };
  });
}

/**
 * Fetch Gemini AI speech audio buffer for a single dialogue line
 */
export async function fetchGeminiSpeechAudioBuffer(
  text: string,
  voiceName: string,
  emotionNote: string,
  audioCtx: BaseAudioContext
): Promise<AudioBuffer | null> {
  if (!text || !text.trim()) return null;

  try {
    const response = await fetch('/api/gemini/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName: voiceName || 'Zephyr',
        promptStyle: emotionNote ? `spoken with ${emotionNote} expression` : '',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.audioBase64) return null;

    const binaryStr = atob(data.audioBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    try {
      const bufferCopy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return await audioCtx.decodeAudioData(bufferCopy);
    } catch (e) {
      // Direct raw 16-bit PCM 24kHz decode
      const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
      const buffer = audioCtx.createBuffer(1, pcm16.length, 24000);
      const ch0 = buffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        ch0[i] = pcm16[i] / 32768.0;
      }
      return buffer;
    }
  } catch (err) {
    console.warn('Gemini speech fetch error:', err);
    return null;
  }
}

/**
 * Synthesize offline multi-track stems and full episode MP3 for a PodcastProject
 */
export async function generateMultiTrackStems(
  project: PodcastProject,
  onProgress?: (status: string) => void
): Promise<RenderedStem[]> {
  const sampleRate = 44100;
  if (onProgress) onProgress('Analyzing script and voice casting profiles...');

  const timingItems = getScriptTimelineTiming(project.script);
  
  // Create temporary audio context for voice decoding
  const tempAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  // 1. Synthesize real AI voice speech audio buffers for all dialogue lines concurrently
  if (onProgress) onProgress('Synthesizing natural AI character voices with Gemini Flash TTS...');

  const lineVoiceBuffers: Map<string, AudioBuffer | null> = new Map();

  const dialogueLines = timingItems.filter(item => !item.line.isSceneHeader && !item.line.isAdBreak);

  await Promise.all(
    dialogueLines.map(async ({ line }) => {
      const char = project.characters.find(c => c.id === line.characterId || c.name === line.characterName);
      const voiceName = char?.voiceConfig?.voiceName || 'Zephyr';
      const audioBuffer = await fetchGeminiSpeechAudioBuffer(
        line.text,
        voiceName,
        line.emotionNote || '',
        tempAudioCtx
      );
      if (line.id) {
        lineVoiceBuffers.set(line.id, audioBuffer);
      }
    })
  );

  // Recalculate timeline timestamps using exact Gemini voice durations
  let currentTime = 1.0;
  const adjustedTiming = timingItems.map((item) => {
    const lineId = item.line.id;
    const speechBuf = lineId ? lineVoiceBuffers.get(lineId) : null;
    let actualDuration = item.duration;

    if (speechBuf) {
      actualDuration = speechBuf.duration;
    }

    const startTime = currentTime;
    currentTime += actualDuration + 0.4;
    return { line: item.line, startTime, duration: actualDuration, speechBuf };
  });

  const totalDurationSec = Math.max(10, currentTime + 2.0);
  const totalLength = Math.ceil(totalDurationSec * sampleRate);
  const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (onProgress) onProgress('Rendering multi-track audio mix & acoustic stems...');

  // Offline Audio Contexts
  const dialogueContext = new OfflineAudioContext(2, totalLength, sampleRate);
  const bgmContext = new OfflineAudioContext(2, totalLength, sampleRate);
  const sfxContext = new OfflineAudioContext(2, totalLength, sampleRate);
  const adContext = new OfflineAudioContext(2, totalLength, sampleRate);
  const masterContext = new OfflineAudioContext(2, totalLength, sampleRate);

  // Helper to schedule buffer into offline context
  const scheduleBuffer = (buf: AudioBuffer, ctx: OfflineAudioContext, startTime: number) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(startTime);
  };

  // --- Render Dialogue Stem & Master Voice Tracks ---
  adjustedTiming.forEach(({ line, startTime, duration, speechBuf }) => {
    if (line.isSceneHeader || line.isAdBreak) return;

    if (speechBuf) {
      // Genuine high-quality Gemini AI Voice Buffer
      scheduleBuffer(speechBuf, dialogueContext, startTime);
      scheduleBuffer(speechBuf, masterContext, startTime);
    } else {
      // Fallback formant synthesizer for offline or quota fallback
      const char = project.characters.find(c => c.id === line.characterId || c.name === line.characterName);
      const baseFreq = char?.voiceConfig?.gender === 'Female' ? 220 : 130;
      const pitchMod = char?.voiceConfig?.pitch || 1.0;
      const freq = baseFreq * pitchMod;

      [dialogueContext, masterContext].forEach((ctx) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(freq, startTime);
        osc1.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + duration);
        osc2.frequency.setValueAtTime(freq * 1.5, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
        gain.gain.setValueAtTime(0.2, startTime + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      });
    }
  });

  // --- Render BGM Background Music Stem ---
  let chordFreqs = [130.81, 164.81, 196.00]; // C Major
  if (project.bgmTrack === 'lofi_chill') chordFreqs = [146.83, 174.61, 220.00]; // D Minor
  if (project.bgmTrack === 'dramatic_suspense') chordFreqs = [110.00, 130.81, 155.56]; // A Diminished

  [bgmContext, masterContext].forEach((ctx) => {
    chordFreqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, 0);

      const bgmVol = ctx === bgmContext ? 0.08 : 0.035; // Soft ducking on master
      gain.gain.setValueAtTime(bgmVol, 0);
      gain.gain.setValueAtTime(bgmVol, totalDurationSec - 1.0);
      gain.gain.linearRampToValueAtTime(0.001, totalDurationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(0);
      osc.stop(totalDurationSec);
    });
  });

  // --- Render SFX & Foley Cues ---
  adjustedTiming.forEach(({ line, startTime }) => {
    const sfxType = line.sfxCue;
    if (!sfxType) return;

    [sfxContext, masterContext].forEach((ctx) => {
      if (sfxType === 'station_jingle') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = idx * 0.12;
          const t = startTime + delay;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.4);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, startTime);
        osc.frequency.exponentialRampToValueAtTime(90, startTime + 0.5);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      }
    });
  });

  // --- Render Commercial Spots & Ad Breaks Stem ---
  adjustedTiming.forEach(({ line, startTime, duration }) => {
    if (!line.isAdBreak) return;

    [adContext, masterContext].forEach((ctx) => {
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.15;
        const t = startTime + delay;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
      });
    });
  });

  if (onProgress) onProgress('Mixing audio stems and compiling MP3 master track...');

  // Render all contexts concurrently
  const [dialogueBuffer, bgmBuffer, sfxBuffer, adBuffer, masterBuffer] = await Promise.all([
    dialogueContext.startRendering(),
    bgmContext.startRendering(),
    sfxContext.startRendering(),
    adContext.startRendering(),
    masterContext.startRendering(),
  ]);

  if (tempAudioCtx.state !== 'closed') {
    tempAudioCtx.close();
  }

  if (onProgress) onProgress('Encoding broadcast-quality MP3 audio file (192kbps)...');

  // Convert Master Buffer to real MP3 Blob
  const masterMp3Blob = audioBufferToMp3Blob(masterBuffer, 192);
  const masterWavBlob = bufferToWav(masterBuffer);

  return [
    {
      id: 'master_mp3',
      name: 'Full Episode Master (MP3)',
      description: 'Broadcast-ready high quality MP3 audio file with natural AI voices, music & SFX',
      filename: `${sanitizedTitle}_episode_master.mp3`,
      blob: masterMp3Blob,
      durationSec: totalDurationSec,
    },
    {
      id: 'master_wav',
      name: 'Full Episode Master (WAV)',
      description: 'Lossless 16-bit uncompressed master WAV audio file',
      filename: `${sanitizedTitle}_master_mix.wav`,
      blob: masterWavBlob,
      durationSec: totalDurationSec,
    },
    {
      id: 'dialogue',
      name: 'Dialogue & AI Voice Stem (WAV)',
      description: 'Isolated high-fidelity character dialogue tracks',
      filename: `${sanitizedTitle}_dialogue_stem.wav`,
      blob: bufferToWav(dialogueBuffer),
      durationSec: totalDurationSec,
    },
    {
      id: 'bgm',
      name: 'Background Music (BGM) Stem (WAV)',
      description: 'Isolated ambient musical score and chord pads',
      filename: `${sanitizedTitle}_bgm_music_stem.wav`,
      blob: bufferToWav(bgmBuffer),
      durationSec: totalDurationSec,
    },
    {
      id: 'sfx',
      name: 'Foley & Sound Effects Stem (WAV)',
      description: 'Isolated station jingles, phone rings, and sound effects',
      filename: `${sanitizedTitle}_foley_sfx_stem.wav`,
      blob: bufferToWav(sfxBuffer),
      durationSec: totalDurationSec,
    },
    {
      id: 'ad_breaks',
      name: 'Commercial Spots Stem (WAV)',
      description: 'Isolated sponsor announcements and ad breaks',
      filename: `${sanitizedTitle}_ad_breaks_stem.wav`,
      blob: bufferToWav(adBuffer),
      durationSec: totalDurationSec,
    },
  ];
}
