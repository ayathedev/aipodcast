// Web Audio & Speech Engine for Podcast Playback & Voice Testing

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isPlayingBgm = false;
  private activeBgmOscillators: OscillatorNode[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private currentSourceNode: AudioBufferSourceNode | null = null;

  // Speak line using Gemini Flash TTS API with fallback to browser SpeechSynthesis
  public async speakLine(
    text: string, 
    voiceConfig: { 
      voiceName: string; 
      pitch: number; 
      rate: number; 
      gender: string; 
      audioEffect?: string;
      emotionStyle?: string;
    },
    onEnd?: () => void
  ) {
    this.stopAllSpeech();

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: voiceConfig.voiceName || 'Zephyr',
          promptStyle: voiceConfig.emotionStyle ? `spoken with ${voiceConfig.emotionStyle} expression` : '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const ctx = this.getContext();
          const binaryStr = atob(data.audioBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          let decodedBuf: AudioBuffer | null = null;
          try {
            const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            decodedBuf = await ctx.decodeAudioData(copy);
          } catch (e) {
            const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
            decodedBuf = ctx.createBuffer(1, pcm16.length, 24000);
            const ch0 = decodedBuf.getChannelData(0);
            for (let i = 0; i < pcm16.length; i++) {
              ch0[i] = pcm16[i] / 32768.0;
            }
          }

          if (decodedBuf) {
            const srcNode = ctx.createBufferSource();
            srcNode.buffer = decodedBuf;
            srcNode.connect(ctx.destination);
            this.currentSourceNode = srcNode;

            srcNode.onended = () => {
              this.currentSourceNode = null;
              if (onEnd) onEnd();
            };

            srcNode.start();
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Gemini TTS playback fallback:', e);
    }

    // Web Speech Fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any active speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      let calcRate = voiceConfig.rate || 1.0;
      let calcPitch = voiceConfig.pitch || 1.0;

      if (voiceConfig.audioEffect === 'studio_warmth') {
        calcPitch *= 0.96;
      } else if (voiceConfig.audioEffect === 'fm_radio') {
        calcRate *= 1.04;
      } else if (voiceConfig.audioEffect === 'deep_baritone') {
        calcPitch *= 0.82;
      } else if (voiceConfig.audioEffect === 'robotic_synth') {
        calcPitch *= 1.25;
        calcRate *= 1.10;
      }

      utterance.rate = Math.max(0.6, Math.min(1.5, calcRate));
      utterance.pitch = Math.max(0.6, Math.min(1.5, calcPitch));

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const isEnglish = (v: SpeechSynthesisVoice) => v.lang.startsWith('en');

        let selectedVoice = voices.find(
          (v) => v.name.toLowerCase().includes(voiceConfig.voiceName.toLowerCase())
        );

        if (!selectedVoice) {
          const naturalVoices = voices.filter(
            (v) => isEnglish(v) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Online'))
          );

          if (voiceConfig.gender === 'Female') {
            selectedVoice = naturalVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('jenny') || v.name.toLowerCase().includes('aria')) ||
              voices.find((v) => isEnglish(v) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('karen')));
          } else if (voiceConfig.gender === 'Male') {
            selectedVoice = naturalVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('george')) ||
              voices.find((v) => isEnglish(v) && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('alex')));
          }
        }

        if (!selectedVoice) {
          selectedVoice = voices.find((v) => isEnglish(v) && (v.name.includes('Google') || v.name.includes('Natural') || v.default)) || voices.find((v) => isEnglish(v));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) setTimeout(onEnd, 2000);
    }
  }

  public stopAllSpeech() {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.currentSourceNode = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public stop() {
    this.stopAllSpeech();
    this.stopAmbientBGM();
  }

  // Play Sound Board Effects using Web Audio API synthesized notes/chimes
  public playSFX(sfxType: string) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      if (sfxType === 'intro_chime' || sfxType === 'bell_ding' || sfxType === 'chime') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3); // E6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } else if (sfxType === 'dramatic_boom') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
      } else if (sfxType === 'keyboard_clicks' || sfxType === 'page_turn') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } else if (sfxType === 'applause' || sfxType === 'laughter') {
        // Multi-frequency applause burst
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = i * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300 + Math.random() * 400, now + delay);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.2);
        }
      } else if (sfxType === 'coffee_sip' || sfxType === 'radio_static' || sfxType === 'radio_tuning') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      } else if (sfxType === 'station_jingle') {
        // Multi-note arpeggiated broadcast jingle
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const delay = idx * 0.12;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.25, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.4);
        });
      } else if (sfxType === 'phone_ring') {
        // Classic dual-tone phone ring
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (sfxType === 'door_slam') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Web Audio SFX failed:', e);
    }
  }

  // Play synthetic ambient BGM loops
  public startAmbientBGM(trackName: string) {
    if (this.isPlayingBgm) return;
    try {
      const ctx = this.getContext();
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.06, ctx.currentTime);
      this.bgmGain.connect(ctx.destination);

      let freqs = [130.81, 164.81, 196.00]; // C major chord synth
      if (trackName === 'lofi_chill') freqs = [146.83, 174.61, 220.00]; // D minor
      if (trackName === 'dramatic_suspense') freqs = [110.00, 130.81, 155.56]; // A minor / diminished

      this.activeBgmOscillators = freqs.map((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.connect(this.bgmGain!);
        osc.start();
        return osc;
      });

      this.isPlayingBgm = true;
    } catch (e) {
      console.warn('BGM start error:', e);
    }
  }

  public stopAmbientBGM() {
    if (!this.isPlayingBgm) return;
    this.activeBgmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.activeBgmOscillators = [];
    this.isPlayingBgm = false;
  }
}

export const audioEngine = new AudioEngine();
