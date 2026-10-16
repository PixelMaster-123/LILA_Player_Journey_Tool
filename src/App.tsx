import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapId,
  MatchSummary,
  MatchDetail,
  Manifest,
  MapAggregateData,
  ViewMode,
  HeatmapCategory,
  LayerFilters
} from './types/telemetry';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { InsightsModal } from './components/InsightsModal';

export const App: React.FC = () => {
  // Global Manifest & Aggregates Data
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [mapAggregates, setMapAggregates] = useState<Record<MapId, MapAggregateData> | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);

  // Selection & Navigation
  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('match');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);

  // Playback State
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2);

  // Filters & Highlights
  const [filters, setFilters] = useState<LayerFilters>({
    showHumans: true,
    showBots: true,
    showTrajectories: true,
    showKills: true,
    showDeaths: true,
    showStormDeaths: true,
    showLoot: true
  });
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);

  // Heatmap Controls
  const [heatmapCategory, setHeatmapCategory] = useState<HeatmapCategory>('traffic');
  const [heatmapRadius, setHeatmapRadius] = useState<number>(28);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.75);

  // Modal State
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Ref for animation frame playback
  const lastTimeRef = useRef<number | null>(null);

  // 1. Load Manifest & Aggregates on Mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [manifestRes, aggregatesRes] = await Promise.all([
          fetch('/data/manifest.json'),
          fetch('/data/map_aggregates.json')
        ]);
        const manifestData: Manifest = await manifestRes.json();
        const aggregatesData = await aggregatesRes.json();

        setManifest(manifestData);
        setMapAggregates(aggregatesData);

        // Auto-select the first AmbroseValley match with highest human count
        const firstMatch = manifestData.matches.find((m) => m.map_id === 'AmbroseValley');
        if (firstMatch) {
          setSelectedMatchId(firstMatch.clean_id);
        }
      } catch (err) {
        console.error('Failed to load initial telemetry manifest:', err);
      } finally {
        setIsLoadingManifest(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Load Selected Match Detail when ID changes
  useEffect(() => {
    if (!selectedMatchId) return;

    async function loadMatch(cleanId: string) {
      setIsLoadingMatch(true);
      try {
        const res = await fetch(`/data/matches/${cleanId}.json`);
        const data: MatchDetail = await res.json();
        setMatchDetail(data);
        setCurrentSec(0);
        setHighlightedUser(null);
        // Start playback with 2x speed for a smooth preview
        setIsPlaying(true);
      } catch (err) {
        console.error(`Failed to load match detail for ${cleanId}:`, err);
      } finally {
        setIsLoadingMatch(false);
      }
    }

    loadMatch(selectedMatchId);
  }, [selectedMatchId]);

  // 3. Playback Animation Frame Loop
  useEffect(() => {
    if (!isPlaying || !matchDetail) {
      lastTimeRef.current = null;
      return;
    }

    let animId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaMs = now - lastTimeRef.current;
        const deltaSec = (deltaMs / 1000) * playbackSpeed;
        setCurrentSec((prev) => {
          const next = prev + deltaSec;
          if (next >= matchDetail.duration_sec) {
            setIsPlaying(false);
            return matchDetail.duration_sec;
          }
          return next;
        });
      }
      lastTimeRef.current = now;
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, matchDetail]);

  // Handle map change: filter matches for the map and pick top match
  const handleSelectMap = (mapId: MapId) => {
    setSelectedMap(mapId);
    if (manifest) {
      const matchForMap = manifest.matches.find(
        (m) => m.map_id === mapId && (selectedDate === 'all' || m.date === selectedDate)
      );
      if (matchForMap) {
        setSelectedMatchId(matchForMap.clean_id);
      }
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    if (manifest) {
      const matchForDate = manifest.matches.find(
        (m) => m.map_id === selectedMap && (date === 'all' || m.date === date)
      );
      if (matchForDate) {
        setSelectedMatchId(matchForDate.clean_id);
      }
    }
  };

  const handleToggleFilter = <K extends keyof LayerFilters>(key: K) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter matches for sidebar
  const visibleMatches = useMemo(() => {
    if (!manifest) return [];
    return manifest.matches.filter((m) => {
      const matchMap = m.map_id === selectedMap;
      const matchDate = selectedDate === 'all' || m.date === selectedDate;
      return matchMap && matchDate;
    });
  }, [manifest, selectedMap, selectedDate]);

  // Match counts by map
  const matchCountsByMap = useMemo(() => {
    const counts: Record<MapId, number> = {
      AmbroseValley: 0,
      GrandRift: 0,
      Lockdown: 0
    };
    if (manifest) {
      for (const m of manifest.matches) {
        if (selectedDate === 'all' || m.date === selectedDate) {
          counts[m.map_id] = (counts[m.map_id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [manifest, selectedDate]);

  if (isLoadingManifest) {
    return (
      <div className="w-screen h-screen bg-[#0A0E17] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <div className="font-display font-bold text-cyan-400 tracking-wider text-base">
          LOADING LILA BLACK TELEMETRY...
        </div>
        <div className="text-xs text-slate-500 font-mono">Parsing 89,104 events across 5 days</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0A0E17] text-slate-100 overflow-hidden">
      {/* 1. Top Navigation & Map Header */}
      <Header
        selectedMap={selectedMap}
        onSelectMap={handleSelectMap}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        availableDates={manifest?.dates || []}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        matchCountsByMap={matchCountsByMap}
        onOpenInsights={() => setIsInsightsOpen(true)}
      />

      {/* 2. Main Workspace (Sidebar + Canvas) */}
      <div className="flex-1 flex min-h-0 relative">
        <Sidebar
          viewMode={viewMode}
          matches={visibleMatches}
          selectedMatchId={selectedMatchId}
          onSelectMatch={setSelectedMatchId}
          matchDetail={matchDetail}
          filters={filters}
          onToggleFilter={handleToggleFilter}
          highlightedUser={highlightedUser}
          onSelectUser={setHighlightedUser}
          heatmapCategory={heatmapCategory}
          onSelectHeatmapCategory={setHeatmapCategory}
          heatmapRadius={heatmapRadius}
          onSetHeatmapRadius={setHeatmapRadius}
          heatmapOpacity={heatmapOpacity}
          onSetHeatmapOpacity={setHeatmapOpacity}
          currentMapStats={mapAggregates ? mapAggregates[selectedMap]?.stats : undefined}
          selectedMap={selectedMap}
        />

        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <MapCanvas
            mapId={selectedMap}
            viewMode={viewMode}
            matchDetail={matchDetail}
            currentSec={currentSec}
            filters={filters}
            highlightedUser={highlightedUser}
            heatmapCategory={heatmapCategory}
            heatmapRadius={heatmapRadius}
            heatmapOpacity={heatmapOpacity}
            mapAggregates={mapAggregates}
          />

          {/* 3. Bottom Playback Controls (shown in Match Replay mode) */}
          {viewMode === 'match' && (
            <PlaybackControls
              matchDetail={matchDetail}
              currentSec={currentSec}
              onSeek={setCurrentSec}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              playbackSpeed={playbackSpeed}
              onSetSpeed={setPlaybackSpeed}
            />
          )}
        </div>
      </div>

      {/* Level Design Insights Modal */}
      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        onJumpToMap={handleSelectMap}
      />
    </div>
  );
};
