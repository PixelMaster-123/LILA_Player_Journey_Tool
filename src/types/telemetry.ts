export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export type EventType =
  | 'Position'
  | 'BotPosition'
  | 'Kill'
  | 'Killed'
  | 'BotKill'
  | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot';

export interface PlayerMeta {
  id: string;
  is_bot: boolean;
  color: string;
  kills: number;
  deaths: number;
  loots: number;
  survival_sec: number;
}

export interface TimelineEvent {
  t: number;      // Seconds from match start
  u: string;      // User ID
  ev: EventType;  // Event name
  px: number;     // Minimap Pixel X (0-1024)
  py: number;     // Minimap Pixel Y (0-1024)
  x: number;      // World X
  z: number;      // World Z
  y: number;      // World Y (elevation)
}

export interface MatchDetail {
  match_id: string;
  clean_id: string;
  map_id: MapId;
  date: string;
  duration_sec: number;
  total_events: number;
  event_counts: Record<string, number>;
  players: Record<string, PlayerMeta>;
  timeline: TimelineEvent[];
}

export interface MatchSummary {
  match_id: string;
  clean_id: string;
  map_id: MapId;
  date: string;
  duration_sec: number;
  total_events: number;
  human_count: number;
  bot_count: number;
  event_counts: Record<string, number>;
  file_count: number;
}

export interface Manifest {
  total_matches: number;
  total_files: number;
  generated_at: string;
  maps: MapId[];
  dates: string[];
  matches: MatchSummary[];
}

export interface MapAggregateData {
  total_matches: number;
  total_events: number;
  traffic: [number, number][];
  kills: [number, number][];
  deaths: [number, number][];
  storm_deaths: [number, number][];
  loot: [number, number][];
  stats: {
    human_count: number;
    bot_count: number;
    bot_kills: number;
    bot_deaths: number;
    pvp_kills: number;
    storm_deaths: number;
    loot_events: number;
  };
}

export type ViewMode = 'match' | 'heatmap';
export type HeatmapCategory = 'traffic' | 'kills' | 'deaths' | 'storm' | 'loot';

export interface LayerFilters {
  showHumans: boolean;
  showBots: boolean;
  showTrajectories: boolean;
  showKills: boolean;
  showDeaths: boolean;
  showStormDeaths: boolean;
  showLoot: boolean;
}
