import { MapId } from '../types/telemetry';

export interface MapConfig {
  id: MapId;
  name: string;
  scale: number;
  originX: number;
  originZ: number;
  image: string;
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  AmbroseValley: {
    id: 'AmbroseValley',
    name: 'Ambrose Valley',
    scale: 900,
    originX: -370,
    originZ: -473,
    image: '/minimaps/AmbroseValley_Minimap.png'
  },
  GrandRift: {
    id: 'GrandRift',
    name: 'Grand Rift',
    scale: 581,
    originX: -290,
    originZ: -290,
    image: '/minimaps/GrandRift_Minimap.png'
  },
  Lockdown: {
    id: 'Lockdown',
    name: 'Lockdown',
    scale: 1000,
    originX: -500,
    originZ: -500,
    image: '/minimaps/Lockdown_Minimap.jpg'
  }
};

/**
 * Converts in-game 3D world coordinates (x, z) to 2D 1024x1024 minimap pixels
 */
export function worldToPixel(x: number, z: number, mapId: MapId): { px: number; py: number } {
  const cfg = MAP_CONFIGS[mapId];
  if (!cfg) return { px: 0, py: 0 };
  
  // UV space: [0, 1]
  const u = (x - cfg.originX) / cfg.scale;
  const v = (z - cfg.originZ) / cfg.scale;

  // Invert Y axis because 2D image origin (0,0) is top-left
  const px = u * 1024;
  const py = (1.0 - v) * 1024;

  return { px, py };
}

/**
 * Converts 1024x1024 minimap pixels back to world (x, z) coordinates (for tooltips / inspection)
 */
export function pixelToWorld(px: number, py: number, mapId: MapId): { x: number; z: number } {
  const cfg = MAP_CONFIGS[mapId];
  if (!cfg) return { x: 0, z: 0 };

  const u = px / 1024;
  const v = 1.0 - (py / 1024);

  const x = u * cfg.scale + cfg.originX;
  const z = v * cfg.scale + cfg.originZ;

  return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
}
