import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, Users, Bot } from 'lucide-react';
import { MatchDetail } from '../types/telemetry';

interface PlaybackControlsProps {
  matchDetail: MatchDetail | null;
  currentSec: number;
  onSeek: (sec: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSetSpeed: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  matchDetail,
  currentSec,
  onSeek,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSetSpeed
}) => {
  const duration = matchDetail ? matchDetail.duration_sec : 100;

  // Spacebar hotkey to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute active players at current timestamp
  let activeHumans = 0;
  let activeBots = 0;
  if (matchDetail) {
    const activeTimeline = matchDetail.timeline.filter((ev) => ev.t <= currentSec);
    const seenUsers = new Set(activeTimeline.map((ev) => ev.u));
    for (const u of seenUsers) {
      const p = matchDetail.players[u];
      if (p) {
        if (p.is_bot) activeBots++;
        else activeHumans++;
      }
    }
  }

  const speedOptions = [0.5, 1, 2, 5, 10];

  return (
    <div className="h-20 bg-[#0E1422] border-t border-[#1E293B] px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Play/Pause & Step Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onSeek(Math.max(0, currentSec - 5))}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Rewind 5s"
        >
          <Rewind className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
          }`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => onSeek(Math.min(duration, currentSec + 5))}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Forward 5s"
        >
          <FastForward className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSeek(0)}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Restart Timeline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Timeline Scrubber */}
      <div className="flex-1 max-w-2xl mx-8 flex items-center space-x-4">
        <span className="font-mono text-xs text-cyan-400 font-bold min-w-[42px] text-right">
          {formatTime(currentSec)}
        </span>

        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.5}
            value={currentSec}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#1A2338] rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        <span className="font-mono text-xs text-slate-400 min-w-[42px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Right: Speed Selector & Active Counts */}
      <div className="flex items-center space-x-5">
        {/* Speed Multiplier Pills */}
        <div className="flex items-center bg-[#090D16] p-1 rounded-lg border border-[#1E293B]">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                playbackSpeed === speed
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Live Active Entity Counter */}
        {matchDetail && (
          <div className="flex items-center space-x-3 text-xs font-mono bg-[#090D16] px-3 py-1.5 rounded-lg border border-[#1E293B]">
            <div className="flex items-center space-x-1.5 text-cyan-400">
              <Users className="w-3.5 h-3.5" />
              <span>{activeHumans}</span>
              <span className="text-[10px] text-slate-500">HUMANS</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Bot className="w-3.5 h-3.5" />
              <span>{activeBots}</span>
              <span className="text-[10px] text-slate-500">BOTS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
