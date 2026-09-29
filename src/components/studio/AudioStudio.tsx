import React, { useState, useEffect, useRef } from 'react';
import { PodcastProject, ScriptLine } from '../../types';
import { audioEngine } from '../../lib/audioEngine';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Radio, 
  Download, 
  Sparkles,
  Sliders,
  Flame,
  CheckCircle,
  FileDown
} from 'lucide-react';

interface AudioStudioProps {
  project: PodcastProject;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({ project }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [isBgmEnabled, setIsBgmEnabled] = useState(true);
  const [activeBgmTrack, setActiveBgmTrack] = useState(project.bgmTrack || 'tech_ambient');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Playback Loop
  useEffect(() => {
    let isCancelled = false;

    if (isPlaying) {
      if (isBgmEnabled) {
        audioEngine.startAmbientBGM(activeBgmTrack);
      }

      const speakCurrentLine = () => {
        if (isCancelled) return;

        if (currentLineIndex >= project.script.length) {
          setIsPlaying(false);
          audioEngine.stopAmbientBGM();
          setCurrentLineIndex(0);
          return;
        }

        const line = project.script[currentLineIndex];

        // Trigger SFX cue if present
        if (line.sfxCue) {
          audioEngine.playSFX(line.sfxCue);
        }

        const speakerChar = project.characters.find(
          (c) => c.id === line.characterId || c.name === line.characterName
        );

        const voiceConfig = speakerChar
          ? { ...speakerChar.voiceConfig, rate: speakerChar.voiceConfig.rate * speechSpeed }
          : { voiceName: 'Zephyr', pitch: 1.0, rate: speechSpeed, gender: 'Male', tone: 'Warm', emotionStyle: 'Enthusiastic' };

        audioEngine.speakLine(line.text, voiceConfig, () => {
          if (!isCancelled && isPlaying) {
            setTimeout(() => {
              if (!isCancelled) {
                setCurrentLineIndex((prev) => prev + 1);
              }
            }, 600); // 600ms natural pause between lines
          }
        });
      };

      speakCurrentLine();
    } else {
      audioEngine.stopAllSpeech();
      audioEngine.stopAmbientBGM();
    }

    return () => {
      isCancelled = true;
      audioEngine.stopAllSpeech();
      audioEngine.stopAmbientBGM();
    };
  }, [isPlaying, currentLineIndex]);

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const renderWaveform = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;
        if (isPlaying) {
          // Dynamic dancing bars when playing
          barHeight = Math.abs(Math.sin((frame * 0.1) + (i * 0.3))) * (canvas.height - 12) + 8;
        } else {
          barHeight = (Math.sin(i * 0.5) * 4) + 8;
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#6366f1'); // Indigo
          gradient.addColorStop(1, '#a855f7'); // Purple
        } else {
          gradient.addColorStop(0, '#334155'); // Slate
          gradient.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(renderWaveform);
    };

    renderWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (project.script.length === 0) {
        alert('Script is empty. Please add dialogue lines in Script Editor first.');
        return;
      }
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentLineIndex(0);
    audioEngine.stopAllSpeech();
    audioEngine.stopAmbientBGM();
  };

  const currentLine = project.script[currentLineIndex];
  const currentSpeaker = currentLine
    ? project.characters.find((c) => c.id === currentLine.characterId || c.name === currentLine.characterName)
    : null;

  return (
    <div id="audio-studio-container" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Studio Banner & Waveform Player */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{project.title}</h2>
              <p className="text-xs text-indigo-400 font-medium">
                Audio Direct Orchestrator & Live Multi-Speaker Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                alert('Downloading script & episode audio cue bundle...');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <FileDown className="w-4 h-4 text-indigo-400" />
              <span>Export Audio Script</span>
            </button>
          </div>
        </div>

        {/* Currently Playing Line Card */}
        <div className={`border rounded-2xl p-6 relative overflow-hidden shadow-inner transition ${
          currentLine?.isAdBreak 
            ? 'bg-amber-950/90 border-amber-500/80 ring-1 ring-amber-500/40' 
            : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
            <div className="relative shrink-0">
              <img
                src={currentLine?.isAdBreak ? 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80' : (currentSpeaker?.avatarUrl || project.coverUrl)}
                alt="Speaker"
                referrerPolicy="no-referrer"
                className={`w-20 h-20 rounded-2xl object-cover border-2 shadow-xl ${
                  currentLine?.isAdBreak ? 'border-amber-400' : 'border-indigo-500/50'
                }`}
              />
              {currentLine?.isAdBreak && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md">
                  <Radio className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-y-1">
                <span className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>
                    {currentLine?.isAdBreak 
                      ? (currentLine.adSponsorName || 'Radio Commercial Spot') 
                      : (currentSpeaker ? currentSpeaker.name : 'Ready to record')}
                  </span>
                </span>
                
                {currentLine?.isAdBreak ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border border-amber-400 flex items-center space-x-1">
                    <Radio className="w-3 h-3" />
                    <span>{currentLine.adCategory || 'Sponsor Spot'} • {currentLine.adDurationSec || 30}s Countdown</span>
                  </span>
                ) : currentSpeaker ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Voice: {currentSpeaker.voiceConfig.voiceName}
                  </span>
                ) : null}
              </div>

              <p className={`text-base font-medium leading-relaxed italic ${currentLine?.isAdBreak ? 'text-amber-100 font-sans' : 'text-slate-100'}`}>
                {currentLine ? `"${currentLine.text}"` : 'Press play to start listening to your generated multi-speaker podcast!'}
              </p>

              {currentLine?.sfxCue && (
                <span className="inline-block text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-800">
                  ⚡ SFX Cue Triggered: [{currentLine.sfxCue}]
                </span>
              )}

              {currentLine?.isAdBreak && isPlaying && (
                <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center space-x-2 animate-pulse pt-1">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>COMMERCIAL SPOT IN PROGRESS • COUNTDOWN TIMER RUNNING ({currentLine.adDurationSec || 30}s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Waveform */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <canvas ref={canvasRef} width={600} height={50} className="w-full h-12 rounded-xl" />
          </div>
        </div>

        {/* Master Playback Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Timeline Scrubber */}
          <div className="flex-1 w-full space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
              <span>Turn {currentLineIndex + 1} of {project.script.length}</span>
              <span>{Math.round(((currentLineIndex + 1) / (project.script.length || 1)) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, project.script.length - 1)}
              value={currentLineIndex}
              onChange={(e) => setCurrentLineIndex(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Play/Pause Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentLineIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentLineIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              id="studio-master-play-btn"
              onClick={handlePlayToggle}
              className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/30 transition transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white pl-0.5" />}
            </button>

            <button
              onClick={handleStop}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <Square className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentLineIndex((prev) => Math.min(project.script.length - 1, prev + 1))}
              disabled={currentLineIndex >= project.script.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Speed:</span>
            <select
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(Number(e.target.value))}
              className="bg-transparent text-indigo-400 font-bold text-xs focus:outline-none"
            >
              <option value={0.8} className="bg-slate-900 text-slate-200">0.8x</option>
              <option value={1.0} className="bg-slate-900 text-slate-200">1.0x (Normal)</option>
              <option value={1.2} className="bg-slate-900 text-slate-200">1.2x</option>
              <option value={1.5} className="bg-slate-900 text-slate-200">1.5x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Background Music & Sound Board Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BGM Track Selector & Ambient Loop */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Music className="w-4 h-4 text-indigo-400" />
              <span>Background Ambient Music (BGM)</span>
            </h3>

            <button
              onClick={() => setIsBgmEnabled(!isBgmEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                isBgmEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isBgmEnabled ? 'BGM On' : 'BGM Off'}
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Select Ambient Track Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'tech_ambient', name: 'Tech Synth' },
                { id: 'lofi_chill', name: 'Lo-Fi Chill' },
                { id: 'dramatic_suspense', name: 'Dramatic Suspense' },
                { id: 'acoustic_warm', name: 'Acoustic Warm' },
              ].map((tr) => (
                <button
                  key={tr.id}
                  onClick={() => {
                    setActiveBgmTrack(tr.id);
                    if (isPlaying && isBgmEnabled) {
                      audioEngine.stopAmbientBGM();
                      audioEngine.startAmbientBGM(tr.id);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition border ${
                    activeBgmTrack === tr.id
                      ? 'bg-indigo-950 text-indigo-200 border-indigo-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tr.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Sound Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Interactive Sound Board (Live FX)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Click any pad to trigger instant audio effects during playback</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'station_jingle', label: '📻 Station Jingle' },
              { id: 'radio_tuning', label: '📻 Radio Static' },
              { id: 'phone_ring', label: '📞 Telephone Ring' },
              { id: 'dramatic_boom', label: '💥 Dramatic Boom' },
              { id: 'door_slam', label: '🚪 Foley Door Slam' },
              { id: 'intro_chime', label: '🔔 Studio Chime' },
              { id: 'applause', label: '👏 Studio Applause' },
              { id: 'laughter', label: '😂 Live Laughter' },
              { id: 'keyboard_clicks', label: '⌨️ Teletype Typing' },
            ].map((sfx) => (
              <button
                key={sfx.id}
                onClick={() => audioEngine.playSFX(sfx.id)}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-amber-300 transition active:scale-95 shadow-sm text-center"
              >
                {sfx.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
