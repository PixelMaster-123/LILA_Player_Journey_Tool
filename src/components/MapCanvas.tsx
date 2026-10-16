import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapId, MatchDetail, LayerFilters, ViewMode, HeatmapCategory, MapAggregateData, TimelineEvent } from '../types/telemetry';
import { MAP_CONFIGS, pixelToWorld } from '../utils/coordinates';
import { drawHeatmap } from '../utils/heatmap';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

interface MapCanvasProps {
  mapId: MapId;
  viewMode: ViewMode;
  matchDetail: MatchDetail | null;
  currentSec: number;
  filters: LayerFilters;
  highlightedUser: string | null;
  heatmapCategory: HeatmapCategory;
  heatmapRadius: number;
  heatmapOpacity: number;
  mapAggregates: Record<MapId, MapAggregateData> | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  mapId,
  viewMode,
  matchDetail,
  currentSec,
  filters,
  highlightedUser,
  heatmapCategory,
  heatmapRadius,
  heatmapOpacity,
  mapAggregates
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom & Pan State
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover Tooltip State
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: TimelineEvent;
    screenX: number;
    screenY: number;
    isHuman: boolean;
  } | null>(null);

  const [mouseCoord, setMouseCoord] = useState<{ px: number; py: number; worldX: number; worldZ: number } | null>(null);

  const mapConfig = MAP_CONFIGS[mapId];

  // Reset zoom & pan when map changes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [mapId]);

  // Handle Zooming via wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.6), 5.0));
  };

  // Handle Mouse Drag for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Inspect hovered coordinates on 1024x1024 canvas
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / scale;
      const rawY = (e.clientY - rect.top) / scale;

      if (rawX >= 0 && rawX <= 1024 && rawY >= 0 && rawY <= 1024) {
        const px = Math.round(rawX);
        const py = Math.round(rawY);
        const { x: worldX, z: worldZ } = pixelToWorld(px, py, mapId);
        setMouseCoord({ px, py, worldX, worldZ });

        // Hover detection on events in match mode
        if (viewMode === 'match' && matchDetail) {
          const visibleEvents = matchDetail.timeline.filter((ev) => ev.t <= currentSec);
          let found: TimelineEvent | null = null;
          let minDist = 14;

          for (let i = visibleEvents.length - 1; i >= 0; i--) {
            const ev = visibleEvents[i];
            const dist = Math.hypot(ev.px - rawX, ev.py - rawY);
            if (dist < minDist && ev.ev !== 'Position' && ev.ev !== 'BotPosition') {
              found = ev;
              minDist = dist;
              break;
            }
          }

          if (found) {
            const isHuman = matchDetail.players[found.u] ? !matchDetail.players[found.u].is_bot : true;
            setHoveredEvent({
              event: found,
              screenX: e.clientX,
              screenY: e.clientY,
              isHuman
            });
          } else {
            setHoveredEvent(null);
          }
        }
      } else {
        setMouseCoord(null);
        setHoveredEvent(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Main Render Canvas Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 1024, 1024);

    // 1. Draw Minimap Background
    const img = new Image();
    img.src = mapConfig.image;
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, 1024, 1024);
    } else {
      img.onload = () => {
        render();
      };
    }

    // Semi-transparent dark vignette over map for better telemetry contrast
    ctx.fillStyle = 'rgba(10, 14, 23, 0.25)';
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Heatmap Mode
    if (viewMode === 'heatmap') {
      if (mapAggregates && mapAggregates[mapId]) {
        const agg = mapAggregates[mapId];
        let points: [number, number][] = [];
        let scheme: 'traffic' | 'combat' | 'storm' | 'loot' = 'traffic';

        if (heatmapCategory === 'traffic') {
          points = agg.traffic;
          scheme = 'traffic';
        } else if (heatmapCategory === 'kills') {
          points = agg.kills;
          scheme = 'combat';
        } else if (heatmapCategory === 'deaths') {
          points = agg.deaths;
          scheme = 'combat';
        } else if (heatmapCategory === 'storm') {
          points = agg.storm_deaths;
          scheme = 'storm';
        } else if (heatmapCategory === 'loot') {
          points = agg.loot;
          scheme = 'loot';
        }

        drawHeatmap(ctx, points, 1024, 1024, {
          radius: heatmapRadius,
          opacity: heatmapOpacity,
          colorScheme: scheme
        });
      }
      return;
    }

    // 3. Match Replay Mode
    if (viewMode === 'match' && matchDetail) {
      const activeTimeline = matchDetail.timeline.filter((ev) => ev.t <= currentSec);

      // Group positions by user
      const userPaths: Record<string, TimelineEvent[]> = {};
      const activeEvents: TimelineEvent[] = [];

      for (const ev of activeTimeline) {
        const pMeta = matchDetail.players[ev.u];
        if (!pMeta) continue;

        // Human vs Bot Filter
        if (pMeta.is_bot && !filters.showBots) continue;
        if (!pMeta.is_bot && !filters.showHumans) continue;

        // Highlight single player filter
        if (highlightedUser && ev.u !== highlightedUser) continue;

        if (!userPaths[ev.u]) {
          userPaths[ev.u] = [];
        }
        userPaths[ev.u].push(ev);

        if (ev.ev !== 'Position' && ev.ev !== 'BotPosition') {
          activeEvents.push(ev);
        }
      }

      // Draw Trajectories
      if (filters.showTrajectories) {
        for (const [userId, path] of Object.entries(userPaths)) {
          if (path.length < 2) continue;
          const pMeta = matchDetail.players[userId];
          const isHuman = !pMeta.is_bot;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(path[0].px, path[0].py);

          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].px, path[i].py);
          }

          if (isHuman) {
            ctx.strokeStyle = pMeta.color;
            ctx.lineWidth = highlightedUser === userId ? 4 : 2.5;
            ctx.setLineDash([]);
            ctx.shadowColor = pMeta.color;
            ctx.shadowBlur = highlightedUser === userId ? 8 : 4;
            ctx.globalAlpha = 0.85;
          } else {
            // Bots: Dashed muted line
            ctx.strokeStyle = '#8892B0';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.5;
          }

          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Player Head Avatars (current position)
      for (const [userId, path] of Object.entries(userPaths)) {
        if (path.length === 0) continue;
        const lastPos = path[path.length - 1];
        const pMeta = matchDetail.players[userId];
        const isHuman = !pMeta.is_bot;

        ctx.save();
        ctx.beginPath();
        const radius = isHuman ? (highlightedUser === userId ? 7 : 5) : 3.5;
        ctx.arc(lastPos.px, lastPos.py, radius, 0, Math.PI * 2);

        if (isHuman) {
          ctx.fillStyle = pMeta.color;
          ctx.shadowColor = pMeta.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw small user tag for human players if highlighted or few players
          if (highlightedUser === userId || Object.keys(userPaths).length < 8) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText(userId.substring(0, 6), lastPos.px + 8, lastPos.py + 3);
          }
        } else {
          ctx.fillStyle = '#8892B0';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Discrete Event Markers
      for (const ev of activeEvents) {
        const isHuman = matchDetail.players[ev.u] ? !matchDetail.players[ev.u].is_bot : true;

        if (ev.ev === 'Kill' || ev.ev === 'BotKill') {
          if (!filters.showKills) continue;
          ctx.save();
          // Red Kill Crosshair
          ctx.beginPath();
          ctx.arc(ev.px, ev.py, 6, 0, Math.PI * 2);
          ctx.fillStyle = ev.ev === 'Kill' ? '#FF0055' : '#FF5500';
          ctx.shadowColor = '#FF0055';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Crosshair lines
          ctx.beginPath();
          ctx.moveTo(ev.px - 9, ev.py);
          ctx.lineTo(ev.px + 9, ev.py);
          ctx.moveTo(ev.px, ev.py - 9);
          ctx.lineTo(ev.px, ev.py + 9);
          ctx.strokeStyle = '#FF0055';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        } else if (ev.ev === 'Killed' || ev.ev === 'BotKilled') {
          if (!filters.showDeaths) continue;
          ctx.save();
          // Skull / Death Marker (Red X)
          ctx.beginPath();
          ctx.arc(ev.px, ev.py, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#DC2626';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ev.px - 4, ev.py - 4);
          ctx.lineTo(ev.px + 4, ev.py + 4);
          ctx.moveTo(ev.px + 4, ev.py - 4);
          ctx.lineTo(ev.px - 4, ev.py + 4);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (ev.ev === 'KilledByStorm') {
          if (!filters.showStormDeaths) continue;
          ctx.save();
          // Purple Storm Casualty Hexagon / Diamond
          ctx.beginPath();
          ctx.arc(ev.px, ev.py, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#A855F7';
          ctx.shadowColor = '#C084FC';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Inner storm bolt
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px sans-serif';
          ctx.fillText('⚡', ev.px - 4, ev.py + 4);
          ctx.restore();
        } else if (ev.ev === 'Loot') {
          if (!filters.showLoot) continue;
          ctx.save();
          // Gold Diamond Loot Marker
          ctx.fillStyle = '#FACC15';
          ctx.shadowColor = '#FACC15';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(ev.px, ev.py - 4.5);
          ctx.lineTo(ev.px + 4.5, ev.py);
          ctx.lineTo(ev.px, ev.py + 4.5);
          ctx.lineTo(ev.px - 4.5, ev.py);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#78350F';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }, [
    mapConfig,
    viewMode,
    matchDetail,
    currentSec,
    filters,
    highlightedUser,
    heatmapCategory,
    heatmapRadius,
    heatmapOpacity,
    mapAggregates,
    mapId
  ]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative flex-1 h-full bg-[#080B12] overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      {/* HUD Overlay - Top Left: Map & Minimap Calibration Info */}
      <div className="absolute top-4 left-4 z-20 bg-[#0E1422]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#1E293B] shadow-xl text-xs space-y-1">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold font-display">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>{mapConfig.name} Minimap</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono space-x-3">
          <span>Scale: <strong className="text-slate-200">{mapConfig.scale}</strong></span>
          <span>Origin: <strong className="text-slate-200">({mapConfig.originX}, {mapConfig.originZ})</strong></span>
          <span>Zoom: <strong className="text-cyan-300">{Math.round(scale * 100)}%</strong></span>
        </div>
      </div>

      {/* HUD Overlay - Top Right: Real-time Cursor Coordinates */}
      {mouseCoord && (
        <div className="absolute top-4 right-4 z-20 bg-[#0E1422]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#1E293B] shadow-xl text-xs font-mono space-y-0.5">
          <div className="text-slate-400 text-[10px]">COORDINATE INSPECTOR</div>
          <div className="text-slate-200">
            Minimap: <span className="text-cyan-400">({mouseCoord.px}, {mouseCoord.py})px</span>
          </div>
          <div className="text-slate-300">
            World: <span className="text-emerald-400">X: {mouseCoord.worldX}, Z: {mouseCoord.worldZ}</span>
          </div>
        </div>
      )}

      {/* Floating Zoom & Pan Controls */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col space-y-2 bg-[#0E1422]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#1E293B] shadow-xl">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.2, 5.0))}
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.6))}
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-[#1A2338] rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main 1024x1024 Canvas with Zoom & Pan Transforms */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
          width: 1024,
          height: 1024
        }}
        className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800"
      >
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          className="block w-[1024px] h-[1024px] bg-[#0A0E17]"
        />
      </div>

      {/* Event Marker Tooltip */}
      {hoveredEvent && (
        <div
          style={{
            left: hoveredEvent.screenX + 14,
            top: hoveredEvent.screenY - 14
          }}
          className="fixed z-50 pointer-events-none bg-[#0F172A]/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl rounded-xl p-3 text-xs font-sans text-slate-200 max-w-xs space-y-1"
        >
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1">
            <span className="font-bold text-cyan-400 font-display uppercase tracking-wide">
              {hoveredEvent.event.ev}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {hoveredEvent.isHuman ? 'HUMAN' : 'BOT'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            User: <span className="text-white font-medium">{hoveredEvent.event.u.substring(0, 12)}...</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            Time: <span className="text-amber-300">{Math.floor(hoveredEvent.event.t / 60)}m {Math.floor(hoveredEvent.event.t % 60)}s</span> ({hoveredEvent.event.t}s)
          </div>
          <div className="font-mono text-[10px] text-slate-400 pt-0.5">
            World: X: {hoveredEvent.event.x}, Z: {hoveredEvent.event.z}, Y(Elev): {hoveredEvent.event.y}
          </div>
        </div>
      )}
    </div>
  );
};
