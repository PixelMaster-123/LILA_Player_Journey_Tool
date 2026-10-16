# Architecture & System Design Document
**Project:** LILA BLACK — Player Journey & Spatial Telemetry Visualization Tool  
**Author:** Candidate (Product Engineer Assignment)  
**Target User:** Level Designers & Gameplay Engineers  

---

## 1. Tech Stack Selection & Justification

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript + Vite** | Provides sub-second HMR, strict type safety for telemetry schemas, and rapid component modularity. |
| **Rendering Engine** | **HTML5 2D Canvas API** | Handles 10,000+ trajectory segments and real-time radial density heatmaps at a steady **60 FPS**. Eliminates DOM overhead associated with SVG. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Delivers an esports/game-dev HUD aesthetic tailored for Level Designers, including zoom/pan controls and time scrubbers. |
| **Data Processing** | **Python (PyArrow + Pandas)** | Offline ingestion engine parsing 1,243 Parquet files (~89k rows) into optimized match and aggregate JSON bundles. |
| **Deployment Target** | **Vercel / Netlify / Cloudflare Pages** | Zero-latency, CDN-cached static architecture with zero backend server maintenance costs or cold starts. |

---

## 2. End-to-End Data Pipeline Flow

```
[ Raw Parquet Files (1,243 files) ]
   │  • Format: {user_id}_{match_id}.nakama-0 (No .parquet extension)
   │  • Event column stored as binary bytes (b'Position', b'Kill')
   ▼
[ Offline Preprocessing Pipeline: scripts/process_data.py ]
   │  1. Ingests daily parquet partitions via PyArrow
   │  2. Decodes UTF-8 event bytes & differentiates Humans (UUID) vs. Bots (Integer)
   │  3. Normalizes timestamps: parses delta seconds from match start
   │  4. Computes 2D minimap pixel coordinates (px, py) with inverted Y-axis
   │  5. Aggregates data into manifest.json, per-match files, and map_aggregates.json
   ▼
[ Client-Side Delivery (Vite + Web Cache) ]
   │  • manifest.json (352 KB): Instant map, date, and match filtering
   │  • match_{id}.json (5–30 KB): On-demand match timeline & player roster
   │  • map_aggregates.json (338 KB): Map-wide density points for traffic, kills, deaths
   ▼
[ Canvas 2D Rendering Loop (60 FPS) ]
   ├── Trajectory Engine: Color-coded neon paths (Humans) vs. muted dashed lines (Bots)
   ├── Event Marker Engine: Custom vector glyphs (Kills, Deaths, Storm Eliminations, Loot)
   └── Dynamic Density Heatmap: Two-pass alpha radial blur + RGBA palette colorization
```

---

## 3. World-to-Minimap Coordinate Mapping Engine

Game engines (e.g., Unity/Unreal) operate in 3D Cartesian space where $+X$ is East and $+Z$ is North (upwards), while 2D canvas/image coordinates place $(0,0)$ at the **top-left**, with $Y$ increasing downwards. The elevation coordinate ($Y$) is intentionally omitted for 2D minimap projection.

### Map Calibration Constants
* **Ambrose Valley**: $\text{Scale} = 900$, $\text{Origin}_X = -370$, $\text{Origin}_Z = -473$
* **Grand Rift**: $\text{Scale} = 581$, $\text{Origin}_X = -290$, $\text{Origin}_Z = -290$
* **Lockdown**: $\text{Scale} = 1000$, $\text{Origin}_X = -500$, $\text{Origin}_Z = -500$

### Transformation Math
For any world position $(x, z)$ on a $1024 \times 1024$ canvas:
$$\begin{aligned}
u &= \frac{x - \text{Origin}_X}{\text{Scale}}, \quad v = \frac{z - \text{Origin}_Z}{\text{Scale}} \quad \in [0, 1] \\
\text{pixel}_x &= u \times 1024 \\
\text{pixel}_y &= (1.0 - v) \times 1024 \quad \text{(Flipped vertical axis)}
\end{aligned}$$

---

## 4. Key Data Ambiguities & Engineering Assumptions

1. **Timestamp Logical Type Ambiguity**:
   * *Problem*: The Parquet schema defines `ts` as `timestamp[ms]`. However, reading the raw delta between player start and death yielded $\sim 350$, which in true milliseconds would mean players sprinted across the map at Mach 6 in 0.35 seconds.
   * *Resolution*: The numeric value written by the Nakama game server is a relative second counter (or epoch seconds stored in a millisecond container). Interpreting `delta` as seconds results in realistic $5\text{--}12$ minute match lengths and $1.5\text{--}5.0\text{ m/s}$ movement speeds.
2. **Binary Byte Strings**:
   * *Problem*: The `event` column contains Python byte literals (`b'Position'`, `b'Kill'`).
   * *Resolution*: Applied `.decode('utf-8')` during ingestion to clean strings before bundling.
3. **Bot Identification**:
   * *Resolution*: Identified bots via regex/length check: Human IDs are 36-character standard UUIDs; bot IDs are short numeric strings ($\le 6$ digits).
4. **Missing Extensions**:
   * *Resolution*: Handled raw `.nakama-0` filenames directly via PyArrow binary stream readers.

---

## 5. Architectural Trade-offs

| Decision | Alternative Considered | Chosen Approach | Rationale |
| :--- | :--- | :--- | :--- |
| **Data Serving** | Real-time Python / DuckDB Server | **Preprocessed Partitioned JSON** | The entire 5-day dataset is ~8 MB. Preprocessing eliminates backend hosting costs, cold starts, and database connection limits while enabling 0ms instant UI responses. |
| **Canvas vs. SVG** | SVG DOM Elements | **HTML5 Canvas 2D** | 89k points in the DOM causes severe browser lag. Canvas draws thousands of points, glow effects, and radial heatmaps smoothly at 60 FPS. |
| **Heatmap Rendering** | Leaflet / Mapbox Plugins | **Custom 2D Canvas Density Engine** | Off-the-shelf map libraries are bloated and assume geographic projection (EPSG:3857). A custom radial gradient alpha stamp runs in <10ms and supports custom palettes without external dependencies. |
| **Match Playback** | Pre-rendered Video / GIF | **Interactive State Interpolation** | Level Designers require variable speed scrubbing ($0.5\times\text{--}10\times$), single-player solo filtering, and zoom/pan inspections during playback. |
