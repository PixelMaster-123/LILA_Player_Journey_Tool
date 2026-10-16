import React from 'react';
import { X, AlertTriangle, Crosshair, Map, TrendingUp, CheckCircle2 } from 'lucide-react';
import { MapId } from '../types/telemetry';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToMap: (mapId: MapId) => void;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({ isOpen, onClose, onJumpToMap }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#0E1422] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0E17]">
          <div>
            <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span>Level Design Insights // LILA BLACK Telemetry</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Three critical observations discovered through spatial telemetry across 89,104 gameplay events
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1A2338] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Insight 1: Lockdown Chokepoint */}
          <div className="bg-[#0A0E17] border border-purple-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                INSIGHT 1: SPATIAL BOTTLENECK
              </span>
              <button
                onClick={() => {
                  onJumpToMap('Lockdown');
                  onClose();
                }}
                className="text-xs font-mono text-purple-400 hover:underline flex items-center space-x-1"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Jump to Lockdown</span>
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-100 font-display">
              The Lockdown Chokepoint Trap: 3x Higher Storm Fatality Rate
            </h3>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-purple-300">Observation:</strong> Players dying to the shrinking storm
                is nearly <strong>3 times more frequent on Lockdown</strong> than on Ambrose Valley, primarily due to
                tight doorway bottlenecks and dead ends.
              </p>
              <div className="bg-[#121824] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                <div>Ambrose Valley: <strong>17 storm deaths</strong> / 837 files (<strong>2.03%</strong>)</div>
                <div>Lockdown: <strong>17 storm deaths</strong> / 295 files (<strong>5.76%</strong> — <span className="text-purple-400">+183%</span>)</div>
                <div className="col-span-2 text-slate-400">
                  Primary Death Clusters: (X: 48.8, Z: 44.1) & Western Corridor (X: -307.8, Z: -285.1)
                </div>
              </div>
              <p>
                <strong className="text-slate-100">Why Level Designers Care:</strong> Non-combat deaths to game boundaries
                feel punitive and frustrating when caused by impassable geometry rather than player negligence.
              </p>
              <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-purple-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Actionable Fix & Metric Impact:</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Widen doorways along the central X=40~50 axis by 20% and add a mantleable escape ledge in the west.
                  <br />
                  2. <em>Metric impact:</em> Expected 45-50% drop in non-combat storm deaths and improved match completion.
                </p>
              </div>
            </div>
          </div>

          {/* Insight 2: PvE Dominance */}
          <div className="bg-[#0A0E17] border border-cyan-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                INSIGHT 2: GAMEPLAY PACING
              </span>
              <button
                onClick={() => {
                  onJumpToMap('GrandRift');
                  onClose();
                }}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Jump to Grand Rift</span>
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-100 font-display">
              The PvE Dominance Paradox & Grand Rift Desertion
            </h3>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-cyan-300">Observation:</strong> PvP combat is virtually absent in live telemetry;
                combat is 99.87% PvE against bots. Additionally, <strong>Grand Rift is severely underplayed</strong>,
                accounting for only 7.6% of all recorded events.
              </p>
              <div className="bg-[#121824] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                <div>Human-vs-Human Kills: <strong>3 kills</strong> (entire 5-day dataset)</div>
                <div>Bot Kills by Humans: <strong>2,415 kills</strong> | Bot Deaths: <strong>700</strong></div>
                <div className="col-span-2 text-slate-400">
                  Map Engagement: Ambrose Valley (68.5%), Lockdown (23.7%), Grand Rift (7.6%)
                </div>
              </div>
              <p>
                <strong className="text-slate-100">Why Level Designers Care:</strong> In an extraction shooter, the tension
                relies on human encounters. Grand Rift's perimeter extraction points disperse players too broadly.
              </p>
              <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Actionable Fix & Metric Impact:</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Pull Grand Rift extraction beacons inward toward the central canyon (X:0, Z:0) and add high-tier loot beacons.
                  <br />
                  2. <em>Metric impact:</em> Elevates player encounter rate by 300% and balances map play rates.
                </p>
              </div>
            </div>
          </div>

          {/* Insight 3: Ambrose Valley Loot Clumping */}
          <div className="bg-[#0A0E17] border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                INSIGHT 3: RESOURCE DISTRIBUTION
              </span>
              <button
                onClick={() => {
                  onJumpToMap('AmbroseValley');
                  onClose();
                }}
                className="text-xs font-mono text-amber-400 hover:underline flex items-center space-x-1"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Jump to Ambrose Valley</span>
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-100 font-display">
              Ambrose Valley Loot Clumping & The Southern "Dead Zone" Wasteland
            </h3>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-amber-300">Observation:</strong> Loot pickups are heavily clustered in the
                central-northeastern quadrant, leaving the southern sector (Z &lt; -250) completely neglected.
              </p>
              <div className="bg-[#121824] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                <div>Total Loot Events: <strong>9,955</strong> on Ambrose Valley</div>
                <div>Central Sector (Z &gt; -100): <strong>81.4%</strong> of all pickups</div>
                <div className="col-span-2 text-slate-400">
                  Southern Sector (Z &lt; -250): &lt;4% player traversal despite 25% map surface area
                </div>
              </div>
              <p>
                <strong className="text-slate-100">Why Level Designers Care:</strong> Substantial environmental design budget
                is currently invisible to players; southern spawns feel empty and slow down player gearing.
              </p>
              <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Actionable Fix & Metric Impact:</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Seed two military compound POIs with guaranteed weapon crates at (X: -200, Z: -350) and (X: 100, Z: -380).
                  <br />
                  2. <em>Metric impact:</em> Southern map utilization rises from 4% to 22%, normalizing early-game pacing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
