import React from 'react';
import { MapId, ViewMode } from '../types/telemetry';
import { MAP_CONFIGS } from '../utils/coordinates';
import { Compass, Flame, PlayCircle, Calendar, Layers, MapPin } from 'lucide-react';

interface HeaderProps {
  selectedMap: MapId;
  onSelectMap: (map: MapId) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  matchCountsByMap: Record<MapId, number>;
  onOpenInsights: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMap,
  onSelectMap,
  selectedDate,
  onSelectDate,
  availableDates,
  viewMode,
  onToggleViewMode,
  matchCountsByMap,
  onOpenInsights
}) => {
  return (
    <header className="h-16 bg-[#0E1422] border-b border-[#1E293B] px-5 flex items-center justify-between z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-lg text-white tracking-wider">LILA BLACK</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              TELEMETRY v2.4
            </span>
          </div>
          <p className="text-xs text-slate-400">Level Designer Player Journey & Spatial Analytics</p>
        </div>
      </div>

      {/* Map Selector Tabs */}
      <div className="flex items-center bg-[#090D16] p-1 rounded-xl border border-[#1E293B]">
        {(Object.keys(MAP_CONFIGS) as MapId[]).map((mapId) => {
          const isSelected = selectedMap === mapId;
          const count = matchCountsByMap[mapId] || 0;
          return (
            <button
              key={mapId}
              onClick={() => onSelectMap(mapId)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{MAP_CONFIGS[mapId].name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode & Date Filters & Actions */}
      <div className="flex items-center space-x-3">
        {/* Date Filter */}
        <div className="flex items-center space-x-1.5 bg-[#090D16] px-3 py-1.5 rounded-lg border border-[#1E293B] text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-mono"
          >
            <option value="all" className="bg-[#0E1422] text-slate-200">All Dates (Feb 10-14)</option>
            {availableDates.map((d) => (
              <option key={d} value={d} className="bg-[#0E1422] text-slate-200">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Toggle (Match Replay vs Heatmap) */}
        <div className="flex bg-[#090D16] p-1 rounded-lg border border-[#1E293B]">
          <button
            onClick={() => onToggleViewMode('match')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'match'
                ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Match Replay</span>
          </button>
          <button
            onClick={() => onToggleViewMode('heatmap')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Map Heatmaps</span>
          </button>
        </div>

        {/* Insights Button */}
        <button
          onClick={onOpenInsights}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Level Insights (3)</span>
        </button>
      </div>
    </header>
  );
};
