# LILA BLACK — Player Journey & Spatial Telemetry Visualization Tool

> A web-based spatial telemetry and match replay tool built for LILA Games Level Designers to explore player behavior, combat hotspots, storm deaths, and map traversal patterns.

---

## 🚀 Live Hosted Application

- **Live Deployment Link:** **[https://lila-player-journey-tool-five.vercel.app/](https://lila-player-journey-tool-five.vercel.app/)**

---

## 🎮 Key Features & Capabilities

### 1. Interactive Minimap & Coordinate Transformation Engine
- Full high-resolution top-down minimaps for all 3 maps:
  - **Ambrose Valley** (Scale: 900, Origin: -370, -473)
  - **Grand Rift** (Scale: 581, Origin: -290, -290)
  - **Lockdown** (Scale: 1000, Origin: -500, -500)
- Converts in-game 3D world coordinates $(x, z)$ to pixel coordinates $(px, py)$ on a $1024 \times 1024$ canvas, accounting for origin offsets and inverted screen-space $Y$-axes.
- Smooth mouse wheel **Zooming** ($0.6\times$ to $5.0\times$) and click-and-drag **Panning** with a live coordinate inspector HUD.

### 2. Human vs. AI Bot Visual Differentiation
- **Human Players:** Rendered with distinct vibrant neon colorways, solid trajectories, subtle glow, and user ID tags.
- **AI Bots:** Rendered with muted slate-blue dashed paths (`[4, 4]`) and subtle markers to prevent visual clutter while preserving full tactical context.

### 3. Discrete Event Markers
- 🎯 **Kills (`Kill`, `BotKill`):** Glowing crosshair glyphs with red/orange accents.
- 💀 **Deaths (`Killed`, `BotKilled`):** Tombstone/X-markers indicating casualties.
- ⚡ **Storm Deaths (`KilledByStorm`):** Purple storm casualty rings marking fatal zone-shrinkage encounters.
- 💎 **Loot Pickups (`Loot`):** Gold diamond glyphs highlighting resource acquisition.
- Interactive hover tooltips displaying player ID, classification, elapsed match time, and world coordinates.

### 4. Timeline Playback & Match Replay
- Chronological time scrubber tracking match progression from $t = 0\text{s}$ to match conclusion.
- Play, Pause, Step forward ($+5\text{s}$), Step backward ($-5\text{s}$), and speed multipliers ($0.5\times, 1\times, 2\times, 5\times, 10\times$).
- Spacebar keyboard shortcut for instantaneous play/pause toggle.
- Real-time active entity counter showing living Humans vs. Bots at the current playback frame.

### 5. High-Performance Density Heatmaps
- Two-pass radial density heatmap engine running on HTML5 Canvas:
  - **Traffic Density:** Movement highways and player traversal corridors.
  - **Kill Zones:** Combat initiation and successful firefight hotspots.
  - **Death Zones:** Fatal encounter concentrations and ambushes.
  - **Storm Casualties:** Chokepoints and geometry traps.
  - **Loot Distribution:** Resource clumping and dead-zone identification.
- Real-time adjustable **Kernel Radius** and **Opacity** sliders.

### 6. Deep Filtering & Player Solo Inspection
- Filter matches by **Map**, **Date (Feb 10–14)**, and **Match ID**.
- Layer toggles for any combination of event types and player types.
- Match roster with K/D ratios, loot count, and survival duration.
- **Solo Mode:** Click any player in the roster to isolate and inspect their specific path through the match.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Custom Fonts (Chakra Petch & JetBrains Mono)
- **Rendering:** HTML5 2D Canvas API (zero external map-library bloat, 60 FPS performance)
- **Data Pipeline:** Python 3.14 (PyArrow + Pandas)
- **Data Format:** Partitioned JSON bundles + pre-indexed manifest (~8MB total across all 5 days)

Detailed system architecture and trade-offs are documented in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📦 Quick Start & Local Setup

### Prerequisites
- Node.js 18+ and npm
- (Optional) Python 3.10+ with `pyarrow` and `pandas` if re-running the raw Parquet ingestion pipeline

### 1. Clone & Install
```bash
git clone https://github.com/PixelMaster-123/LILA_Player_Journey_Tool.git
cd LILA_Player_Journey_Tool
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```
The optimized production bundle is generated in the `dist/` directory.

---

## 🔄 Re-running the Data Pipeline (Optional)

The repository already comes pre-bundled with processed JSON data in `public/data/` for instant out-of-the-box loading. If you wish to re-parse the raw Parquet files:

```bash
# Using uv (recommended)
uv run --with pyarrow,pandas python scripts/process_data.py

# Or using standard python
pip install pyarrow pandas
python scripts/process_data.py
```
This script will:
1. Scan all 1,243 `.nakama-0` Parquet files across `February_10` to `February_14`.
2. Decode raw UTF-8 event bytes.
3. Compute world-to-pixel coordinate projections.
4. Output `public/data/manifest.json`, `public/data/map_aggregates.json`, and individual match JSONs in `public/data/matches/`.

---

## 🌐 Deployment Guide

### Deploy to Vercel (Recommended)
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build` | Output Directory: `dist`.
6. Click **Deploy**.

### Deploy to Netlify
1. Connect repository on [Netlify](https://netlify.com).
2. Set Build Command: `npm run build` | Publish Directory: `dist`.
3. Click **Deploy Site**.

---

## 📊 Level Design Insights

The tool surfaces 3 key actionable findings backed by data and coordinates across all 89,104 gameplay events:
1. **The Lockdown Chokepoint Trap:** 3× higher storm fatality rate caused by interior door bottlenecks at $(X: 48.8, Z: 44.1)$ and western dead ends $(X: -307.8, Z: -285.1)$.
2. **The PvE Dominance Paradox & Grand Rift Desertion:** Over $99.87\%$ of all combat is against AI bots; Grand Rift represents only $7.6\%$ of player activity due to dispersed perimeter extraction points.
3. **Ambrose Valley Loot Clumping:** Over $81.4\%$ of loot is concentrated in the northeast sector, leaving the southern third of the map ($Z < -250$) as a dead transit wasteland.

Read the full analysis in [INSIGHTS.md](INSIGHTS.md) or open the **"Level Insights"** drawer inside the web app.

---

## ✅ Evaluation Checklist

- [x] **Hosted Tool:** Production-ready Vite build ready for Vercel/Netlify deployment.
- [x] **Parquet Ingestion:** Automated Python pipeline parsing all 1,243 files across 5 days.
- [x] **Minimap Accuracy:** Mathematical coordinate conversion for Ambrose Valley, Grand Rift, and Lockdown.
- [x] **Bot vs. Human:** Distinct visual stylings (neon solid vs. muted dashed line).
- [x] **Event Markers:** Custom vector icons for Kills, Deaths, Storm Deaths, and Loot.
- [x] **Timeline Scrubber:** Smooth match replay playback with $0.5\times\text{--}10\times$ speed multipliers.
- [x] **Heatmaps:** Multi-category density maps for Traffic, Kills, Deaths, Storm, and Loot.
- [x] **Architecture Doc:** Complete 1-page [ARCHITECTURE.md](ARCHITECTURE.md) covering pipeline, math, and trade-offs.
- [x] **Actionable Insights:** Complete [INSIGHTS.md](INSIGHTS.md) with concrete statistics and level design recommendations.
