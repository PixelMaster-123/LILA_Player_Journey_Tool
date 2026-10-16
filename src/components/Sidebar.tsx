import React, { useState } from 'react';
import {
  MatchSummary,
  MatchDetail,
  LayerFilters,
  ViewMode,
  HeatmapCategory,
  MapAggregateData,
  MapId
} from '../types/telemetry';
import {
  Filter,
  Users,
  Bot,
  Crosshair,
  Skull,
  Zap,
  Package,
  Layers,
  Flame,
  Search,
  Sliders,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  viewMode: ViewMode;
  matches: MatchSummary[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  matchDetail: MatchDetail | null;
  filters: LayerFilters;
  onToggleFilter: <K extends keyof LayerFilters>(key: K) => void;
  highlightedUser: string | null;
  onSelectUser: (userId: string | null) => void;
  heatmapCategory: HeatmapCategory;
  onSelectHeatmapCategory: (cat: HeatmapCategory) => void;
  heatmapRadius: number;
  onSetHeatmapRadius: (r: number) => void;
  heatmapOpacity: number;
  onSetHeatmapOpacity: (op: number) => void;
  currentMapStats?: MapAggregateData['stats'];
  selectedMap: MapId;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  matches,
  selectedMatchId,
  onSelectMatch,
  matchDetail,
  filters,
  onToggleFilter,
  highlightedUser,
  onSelectUser,
  heatmapCategory,
  onSelectHeatmapCategory,
  heatmapRadius,
  onSetHeatmapRadius,
  heatmapOpacity,
  onSetHeatmapOpacity,
  currentMapStats,
  selectedMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'layers'>('matches');

  const filteredMatches = matches.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.match_id.toLowerCase().includes(q) || m.clean_id.toLowerCase().includes(q);
  });

  return (
    <aside className="w-80 h-full bg-[#0E1422] border-r border-[#1E293B] flex flex-col z-20 select-none">
      {/* Sidebar Tabs */}
      <div className="flex border-b border-[#1E293B] bg-[#0A0E17]">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'matches'
              ? 'border-cyan-400 text-cyan-400 bg-[#0E1422]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{viewMode === 'match' ? 'Matches' : 'Heatmap Settings'}</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'layers'
              ? 'border-cyan-400 text-cyan-400 bg-[#0E1422]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers & Roster</span>
        </button>
      </div>

      {/* Tab 1: Match Selection or Heatmap Controls */}
      {activeTab === 'matches' && viewMode === 'match' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Match Search Input */}
          <div className="p-3 border-b border-[#1E293B]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search match ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0E17] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Showing {filteredMatches.length} matches</span>
              <span>Sorted by humans</span>
            </div>
          </div>

          {/* Match Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredMatches.map((m) => {
              const isSelected = selectedMatchId === m.clean_id || selectedMatchId === m.match_id;
              const mins = Math.floor(m.duration_sec / 60);
              const secs = m.duration_sec % 60;
              return (
                <div
                  key={m.clean_id}
                  onClick={() => onSelectMatch(m.clean_id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950'
                      : 'bg-[#0A0E17] border-[#1E293B] hover:border-slate-700 hover:bg-[#12192A]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className={`font-semibold truncate max-w-[170px] ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {m.clean_id.substring(0, 8)}...{m.clean_id.substring(m.clean_id.length - 6)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">{m.date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 text-cyan-400">
                        <Users className="w-3 h-3" />
                        <span>{m.human_count}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Bot className="w-3 h-3" />
                        <span>{m.bot_count}</span>
                      </span>
                    </div>
                    <span className="text-slate-300">{mins}m {secs}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1 in Heatmap Mode */}
      {activeTab === 'matches' && viewMode === 'heatmap' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-5">
          <div>
            <h4 className="text-xs font-display font-semibold text-slate-200 mb-2 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Heatmap Category</span>
            </h4>
            <div className="space-y-1.5">
              {[
                { id: 'traffic', label: 'Movement Traffic Density', desc: 'Player traversal corridors & highways' },
                { id: 'kills', label: 'Combat Kill Zones', desc: 'Where firefights originate and succeed' },
                { id: 'deaths', label: 'Casualty / Death Zones', desc: 'Fatal engagements and ambushes' },
                { id: 'storm', label: 'Storm Death Hotspots', desc: 'Dead ends and chokepoints' },
                { id: 'loot', label: 'Loot Scavenge Clumping', desc: 'Resource collection hotspots' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectHeatmapCategory(cat.id as HeatmapCategory)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                    heatmapCategory === cat.id
                      ? 'bg-orange-950/40 border-orange-500/60 shadow-md text-orange-200'
                      : 'bg-[#0A0E17] border-[#1E293B] text-slate-300 hover:bg-[#12192A]'
                  }`}
                >
                  <div className="text-xs font-semibold">{cat.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap Slider Controls */}
          <div className="bg-[#0A0E17] p-3 rounded-xl border border-[#1E293B] space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Kernel Radius</span>
                <span className="font-mono text-cyan-400">{heatmapRadius}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={heatmapRadius}
                onChange={(e) => onSetHeatmapRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Density Opacity</span>
                <span className="font-mono text-cyan-400">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={heatmapOpacity}
                onChange={(e) => onSetHeatmapOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
            </div>
          </div>

          {/* Map Aggregate Stats Card */}
          {currentMapStats && (
            <div className="bg-[#0A0E17] p-3 rounded-xl border border-[#1E293B] space-y-2">
              <div className="text-xs font-display font-semibold text-slate-200 border-b border-slate-800 pb-1">
                {selectedMap} 5-Day Totals
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="bg-[#121824] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">HUMANS LOGGED</span>
                  <span className="text-cyan-400 font-bold">{currentMapStats.human_count}</span>
                </div>
                <div className="bg-[#121824] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">BOTS SPAWNED</span>
                  <span className="text-slate-300 font-bold">{currentMapStats.bot_count}</span>
                </div>
                <div className="bg-[#121824] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">STORM CASUALTIES</span>
                  <span className="text-purple-400 font-bold">{currentMapStats.storm_deaths}</span>
                </div>
                <div className="bg-[#121824] p-2 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">LOOT PICKUPS</span>
                  <span className="text-amber-400 font-bold">{currentMapStats.loot_events}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Layers & Player Roster */}
      {activeTab === 'layers' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          {/* Layer Visibility Toggles */}
          <div>
            <h4 className="text-xs font-display font-semibold text-slate-200 mb-2 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Visibility Layers</span>
            </h4>
            <div className="space-y-1 bg-[#0A0E17] p-2 rounded-xl border border-[#1E293B]">
              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-cyan-300">
                  <Users className="w-3.5 h-3.5" />
                  <span>Human Players</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showHumans}
                  onChange={() => onToggleFilter('showHumans')}
                  className="rounded accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-slate-400">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Bots</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showBots}
                  onChange={() => onToggleFilter('showBots')}
                  className="rounded accent-slate-400"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-slate-300">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Trajectory Paths</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showTrajectories}
                  onChange={() => onToggleFilter('showTrajectories')}
                  className="rounded accent-cyan-400"
                />
              </label>

              <div className="border-t border-slate-800 my-1" />

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-red-400">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Kills</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showKills}
                  onChange={() => onToggleFilter('showKills')}
                  className="rounded accent-red-500"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-rose-500">
                  <Skull className="w-3.5 h-3.5" />
                  <span>Deaths</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showDeaths}
                  onChange={() => onToggleFilter('showDeaths')}
                  className="rounded accent-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-purple-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Storm Deaths</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showStormDeaths}
                  onChange={() => onToggleFilter('showStormDeaths')}
                  className="rounded accent-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#12192A] rounded-lg cursor-pointer text-xs">
                <span className="flex items-center space-x-2 text-amber-400">
                  <Package className="w-3.5 h-3.5" />
                  <span>Loot Pickups</span>
                </span>
                <input
                  type="checkbox"
                  checked={filters.showLoot}
                  onChange={() => onToggleFilter('showLoot')}
                  className="rounded accent-amber-400"
                />
              </label>
            </div>
          </div>

          {/* Active Match Player Roster */}
          {matchDetail && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-display font-semibold text-slate-200 flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Match Roster</span>
                </h4>
                {highlightedUser && (
                  <button
                    onClick={() => onSelectUser(null)}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    Clear Solo
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {Object.values(matchDetail.players).map((p) => {
                  const isHighlighted = highlightedUser === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectUser(isHighlighted ? null : p.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md'
                          : 'bg-[#0A0E17] border-[#1E293B] hover:bg-[#12192A]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="font-mono text-[11px] text-slate-200">
                            {p.id.substring(0, 8)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          p.is_bot ? 'bg-slate-800 text-slate-400' : 'bg-cyan-950 text-cyan-400'
                        }`}>
                          {p.is_bot ? 'BOT' : 'HUMAN'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>K/D: {p.kills}/{p.deaths}</span>
                        <span>Loot: {p.loots}</span>
                        <span>Surv: {Math.floor(p.survival_sec)}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
