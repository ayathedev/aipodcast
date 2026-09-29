import React, { useState } from 'react';
import { PodcastProject, Character, ScriptLine } from '../../types';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  Music, 
  Sliders, 
  Layers, 
  Play, 
  Square,
  Activity,
  Radio
} from 'lucide-react';
import { formatAdobeTimecode } from './AdobeTopBar';

interface MultiTrackTimelinePanelProps {
  project: PodcastProject;
  currentTimeSec: number;
  totalTimeSec: number;
  onScrub: (sec: number) => void;
  isPlaying: boolean;
  activeLinePlayingId: string | null;
}

export const MultiTrackTimelinePanel: React.FC<MultiTrackTimelinePanelProps> = ({
  project,
  currentTimeSec,
  totalTimeSec,
  onScrub,
  isPlaying,
  activeLinePlayingId,
}) => {
  // Track states (Mute/Solo/Volume)
  const [trackStates, setTrackStates] = useState<
    Record<string, { mute: boolean; solo: boolean; volume: number }>
  >({});

  const safeTotalSec = Math.max(30, totalTimeSec);

  const toggleMute = (trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        mute: !prev[trackId]?.mute,
        solo: false,
        volume: prev[trackId]?.volume ?? 0,
      },
    }));
  };

  const toggleSolo = (trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        solo: !prev[trackId]?.solo,
        mute: false,
        volume: prev[trackId]?.volume ?? 0,
      },
    }));
  };

  const updateVolume = (trackId: string, vol: number) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        mute: false,
        solo: false,
        volume: vol,
      },
    }));
  };

  // Compute block positions for each character's track
  let accumulatedTime = 0;
  const lineTimelineData = project.script.map((line) => {
    const wordCount = (line.text || '').split(/\s+/).filter(Boolean).length;
    const duration = Math.max(3, wordCount * 0.45);
    const startTime = accumulatedTime;
    accumulatedTime += duration;

    return {
      line,
      startTime,
      duration,
      endTime: startTime + duration,
    };
  });

  // Ruler ticks (0s, 15s, 30s, 45s, 60s, 75s...)
  const rulerTicks = [];
  for (let t = 0; t <= safeTotalSec; t += 15) {
    rulerTicks.push(t);
  }

  const playheadPercent = Math.min(100, Math.max(0, (currentTimeSec / safeTotalSec) * 100));

  return (
    <div className="h-56 bg-[#1A1A1A] border-t border-[#3B3B3B] flex flex-col shrink-0 select-none text-[#CCCCCC] font-sans text-[11px]">
      {/* Panel Top Header Bar */}
      <div className="h-6 bg-[#2B2B2B] border-b border-[#3B3B3B] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 font-semibold text-[#E0E0E0] uppercase tracking-wider text-[10px]">
          <Layers className="w-3.5 h-3.5 text-[#00A8C6]" />
          <span>Multi-Track Audio Timeline & Mixer</span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-[9px] text-[#888888]">
          <span>Sample Rate: 48.0 kHz 24-Bit</span>
          <span>Buffer: 256 Samples</span>
          <span className="text-[#00A8C6]">Tracks: {project.characters.length + 1}</span>
        </div>
      </div>

      {/* Timeline Workspace Frame (Left Controls + Right Tracks) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Headers (Control Panel) */}
        <div className="w-64 bg-[#222222] border-r border-[#3B3B3B] flex flex-col shrink-0">
          {/* Ruler Corner Header */}
          <div className="h-5 bg-[#282828] border-b border-[#3B3B3B] px-2 flex items-center text-[9px] font-mono text-[#777777]">
            <span>TRACK CONTROLS</span>
          </div>

          {/* Track Headers List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#333333]">
            {/* Character Tracks */}
            {project.characters.map((c, idx) => {
              const trkState = trackStates[c.id] || { mute: false, solo: false, volume: 0 };

              return (
                <div key={c.id} className="h-12 p-1.5 flex flex-col justify-between bg-[#222222] hover:bg-[#282828]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Mic className="w-3 h-3 text-[#00A8C6] shrink-0" />
                      <span className="font-semibold text-[#E0E0E0] truncate text-[11px]">
                        Trk {idx + 1}: {c.name}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono text-[#777777]">{c.voiceConfig.voiceName}</span>
                  </div>

                  {/* Track Mute / Solo / Vol Controls */}
                  <div className="flex items-center justify-between space-x-1 text-[9px] font-mono">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleMute(c.id)}
                        className={`px-1.5 py-0.2 rounded-[2px] border transition ${
                          trkState.mute
                            ? 'bg-[#A82B2B] text-white border-red-500 font-bold'
                            : 'bg-[#181818] text-[#888888] border-[#3B3B3B] hover:text-white'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() => toggleSolo(c.id)}
                        className={`px-1.5 py-0.2 rounded-[2px] border transition ${
                          trkState.solo
                            ? 'bg-amber-600 text-white border-amber-400 font-bold'
                            : 'bg-[#181818] text-[#888888] border-[#3B3B3B] hover:text-white'
                        }`}
                      >
                        S
                      </button>
                    </div>

                    {/* Fader slider */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[8px] text-[#666666]">{trkState.volume}dB</span>
                      <input
                        type="range"
                        min={-12}
                        max={6}
                        value={trkState.volume}
                        onChange={(e) => updateVolume(c.id, parseFloat(e.target.value))}
                        className="w-16 accent-[#00A8C6] h-1 bg-[#121212] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Background Music Track Header */}
            <div className="h-12 p-1.5 flex flex-col justify-between bg-[#1E1E1E]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <Music className="w-3 h-3 text-[#00A8C6] shrink-0" />
                  <span className="font-semibold text-[#E0E0E0] truncate text-[11px]">
                    Trk {project.characters.length + 1}: BGM Track
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#00A8C6]">Ambient</span>
              </div>

              <div className="flex items-center justify-between space-x-1 text-[9px] font-mono">
                <div className="flex items-center space-x-1">
                  <span className="text-[8px] text-[#666666]">Loop Track</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[8px] text-[#666666]">-6.0dB</span>
                  <input
                    type="range"
                    min={-24}
                    max={0}
                    defaultValue={-6}
                    className="w-16 accent-[#00A8C6] h-1 bg-[#121212] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tracks Timeline Canvas */}
        <div
          className="flex-1 bg-[#181818] relative overflow-x-auto flex flex-col cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * safeTotalSec;
            onScrub(Math.max(0, Math.min(safeTotalSec, newTime)));
          }}
        >
          {/* Time Ruler */}
          <div className="h-5 bg-[#202020] border-b border-[#3B3B3B] relative flex items-center text-[9px] font-mono text-[#777777] shrink-0 overflow-hidden">
            {rulerTicks.map((tick) => {
              const pct = (tick / safeTotalSec) * 100;
              return (
                <div
                  key={tick}
                  className="absolute top-0 bottom-0 border-l border-[#3B3B3B] pl-1 pt-0.5"
                  style={{ left: `${pct}%` }}
                >
                  {formatAdobeTimecode(tick).substring(3, 8)}
                </div>
              );
            })}
          </div>

          {/* Interactive Playhead Cursor Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#00A8C6] z-30 pointer-events-none shadow-[0_0_8px_rgba(0,168,198,0.8)]"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-2.5 h-2.5 bg-[#00A8C6] rotate-45 -translate-x-[4px] -translate-y-1 shadow" />
          </div>

          {/* Track Canvas Rows */}
          <div className="flex-1 divide-y divide-[#282828] relative">
            {/* Character Track Lanes */}
            {project.characters.map((c) => {
              const charLines = lineTimelineData.filter(
                (item) => item.line.characterId === c.id || item.line.characterName === c.name
              );

              return (
                <div key={c.id} className="h-12 relative bg-[#1A1A1A] hover:bg-[#1E1E1E]">
                  {/* Grid Lines */}
                  {rulerTicks.map((tick) => (
                    <div
                      key={tick}
                      className="absolute top-0 bottom-0 border-l border-[#242424] pointer-events-none"
                      style={{ left: `${(tick / safeTotalSec) * 100}%` }}
                    />
                  ))}

                  {/* Audio Waveform Clips */}
                  {charLines.map((item) => {
                    const leftPct = (item.startTime / safeTotalSec) * 100;
                    const widthPct = Math.max(2, (item.duration / safeTotalSec) * 100);
                    const isPlaying = activeLinePlayingId === item.line.id;

                    return (
                      <div
                        key={item.line.id}
                        className={`absolute top-1 bottom-1 rounded-[2px] border px-1 flex flex-col justify-between overflow-hidden shadow-sm transition ${
                          isPlaying
                            ? 'bg-[#264F78] border-[#00A8C6] text-white ring-1 ring-[#00A8C6]'
                            : 'bg-[#253B4E] border-[#2E506D] text-[#D0D0D0] hover:border-[#00A8C6]'
                        }`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <div className="text-[9px] font-mono font-semibold truncate leading-tight">
                          {c.name}: "{item.line.text.substring(0, 20)}..."
                        </div>

                        {/* Visual Simulated SVG Waveform */}
                        <div className="w-full h-3 flex items-center space-x-[1px] opacity-80">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-[#00A8C6] rounded-[0.5px]"
                              style={{
                                height: `${30 + Math.sin(i * 1.2) * 50 + Math.random() * 20}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Background Ambient BGM Track Lane */}
            <div className="h-12 relative bg-[#181818]">
              {rulerTicks.map((tick) => (
                <div
                  key={tick}
                  className="absolute top-0 bottom-0 border-l border-[#242424] pointer-events-none"
                  style={{ left: `${(tick / safeTotalSec) * 100}%` }}
                />
              ))}

              <div
                className="absolute top-1 bottom-1 left-0 right-0 bg-[#1E3025] border border-[#2E523A] rounded-[2px] px-2 flex items-center justify-between text-[#88CC99] font-mono text-[9px]"
              >
                <div className="flex items-center space-x-2">
                  <Music className="w-3 h-3 text-[#22C55E]" />
                  <span>Ambient Music Lane: {project.bgmTrack || 'tech_ambient.mp3'} (Continuous Loop)</span>
                </div>

                <div className="w-32 h-2 flex items-center space-x-[1px] opacity-60">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#22C55E] rounded-[0.5px]"
                      style={{ height: `${20 + Math.cos(i * 0.8) * 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
