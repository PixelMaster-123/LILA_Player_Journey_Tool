# Level Design Insights & Telemetry Analysis
**Game:** LILA BLACK (Extraction Shooter)  
**Dataset:** 5 Days of Production Gameplay (Feb 10–14, 2026 | 1,243 Files | 89,104 Events | 796 Matches)  
**Audience:** Level Design Team, Systems Designers, Balancing Team  

---

## Insight 1: The Lockdown Chokepoint Trap (3× Higher Storm Fatality Rate)

### 1. What Caught Our Eye
When analyzing environmental fatalities across all maps, **Lockdown** exhibited an abnormally high proportion of players being eliminated by the encroaching storm boundary (`KilledByStorm`), despite being the smallest, most compact map in the game.

### 2. Concrete Telemetry Evidence
* **Ambrose Valley**: 17 storm deaths across 837 player journey files (**$2.03\%$** fatality rate).
* **Lockdown**: 17 storm deaths across only 295 player journey files (**$5.76\%$** fatality rate — a **$183\%$ increase** over Ambrose Valley).
* **Spatial Clustering**:
  * Filtering storm death events on Lockdown reveals two acute coordinate clusters:
    1. **Central Interior Threshold**: $(X: 48.87, Z: 44.18)$ — accounts for $53\%$ of Lockdown storm deaths.
    2. **Western Perimeter Corridor**: $(X: -307.88, Z: -285.10)$ — accounts for $29\%$ of Lockdown storm deaths.
* **Trajectory Scrubbing**: Match playback demonstrates that players navigating toward extraction get funneled into single-doorway interior rooms. When the storm wall advances from the east, players heading west encounter dead-end geometry or bottlenecked doors and cannot vault or escape in time.

### 3. Why the Level Designer Should Care
In an extraction shooter, dying to another player or a challenging AI bot feels earned; dying to a storm wall because of misleading interior architecture or single-file doorframes creates intense player frustration. It discourages aggressive scavenging and causes players to abandon gunfights early.

### 4. Actionable Design Items & Metric Impact
* **Actionable Items**:
  1. **Doorway Widening**: Expand the interior door thresholds along the $X \in [40, 55]$ central corridor from standard single-door width ($1.2\text{m}$) to double-door clearance ($2.4\text{m}$) to prevent body-blocking and snagging.
  2. **Emergency Escape Mantles**: Place climbable crates and a broken window escape route along the western dead-end corridor $(X: -307, Z: -285)$ to provide an alternative vertical egress when the primary hall is engulfed by the storm.
  3. **Storm Pacing Cue**: Add directional emergency red klaxon lights and siren audio cues inside Lockdown's industrial sectors 20 seconds before the storm wall breaches the perimeter.
* **Impacted Metrics**:
  * **Storm Fatality Rate**: Expected to normalize from $5.76\%$ down to $\sim 2.5\%$.
  * **Extraction Success Rate**: Expected increase of $+8\text{--}12\%$ on Lockdown.
  * **Late-Match Session Completion**: Reduces rage-quits caused by non-combat deaths.

---

## Insight 2: The PvE Dominance Paradox & Grand Rift Map Desertion

### 1. What Caught Our Eye
In a battle-royale extraction shooter where tense human-versus-human standoffs are meant to be the core emotional hook, **PvP kills are almost completely absent** from the telemetry. Concurrently, **Grand Rift** is severely under-utilized compared to other maps.

### 2. Concrete Telemetry Evidence
* **PvP vs. PvE Combat**:
  * **Human-on-Human Kills (`Kill` / `Killed`)**: Only **3 events** across the entire 5-day dataset ($0.003\%$ of all events).
  * **Human-on-Bot Kills (`BotKill`)**: **2,415 events**.
  * **Bot-on-Human Deaths (`BotKilled`)**: **700 events**.
  * Over **$99.87\%$ of all combat engagements** are against AI bots.
* **Map Popularity Breakdown**:
  * **Ambrose Valley**: 837 files ($67.3\%$) | 61,013 events.
  * **Lockdown**: 295 files ($23.7\%$) | 21,238 events.
  * **Grand Rift**: 111 files ($8.9\%$) | 6,853 events.
* **Spatial Trajectories on Grand Rift**:
  * Grand Rift's scale is $581$, with high terrain variation (canyons). Players spawn widely on outer ridges and immediately extract via peripheral gates without ever crossing into the central canyon $(X \in [-50, 50], Z \in [-50, 50])$.

### 3. Why the Level Designer Should Care
If players never encounter other human players, LILA BLACK plays like a repetitive PvE horde shooter rather than a high-stakes extraction game. Grand Rift represents hundreds of hours of 3D asset creation and level design that is currently bypassed because the layout fails to create "hotspots" that force player paths to intersect.

### 4. Actionable Design Items & Metric Impact
* **Actionable Items**:
  1. **Centralize Extraction Beacons**: Relocate 2 of Grand Rift's 3 extraction portals from the outer canyon rims into the sunken riverbed basin at $(X: 0, Z: 0)$.
  2. **High-Tier Loot Vaults**: Introduce a time-locked "Orbital Drop Pod" in the center of Grand Rift that announces its coordinates at the 3-minute mark, incentivizing all surviving squads to converge.
  3. **Spawn Algorithm Clustering**: Adjust matchmaking to spawn human players within $250\text{m}$ of each other rather than opposite corners of the map.
* **Impacted Metrics**:
  * **Human-to-Human Engagement Rate**: Expected to increase by $+400\%$.
  * **Grand Rift Match Selection / Retention**: Elevates Grand Rift play share from $8.9\%$ to $>20\%$.
  * **Average Match Tension Score**: Increases average player heart rate and combat interaction frequency.

---

## Insight 3: Ambrose Valley Loot Clumping & The Southern "Dead Zone" Wasteland

### 1. What Caught Our Eye
When overlaying the 5-day Loot Density Heatmap on **Ambrose Valley**, loot collection events exhibit extreme geographical concentration in the northeastern quadrant, leaving over **one-third of the southern map completely barren and unvisited**.

### 2. Concrete Telemetry Evidence
* **Total Loot Events**: 9,955 loot pickups recorded on Ambrose Valley ($77.2\%$ of all loot in the game).
* **Northeastern Concentration**:
  * Over **$81.4\%$ of all loot interactions** $(8,103 / 9,955)$ occur inside the bounding box $X \in [-100, 250], Z \in [-50, 300]$ (pixel coordinates $px \in [300, 700], py \in [150, 500]$).
* **The Southern Wasteland**:
  * The southern region $(Z \in [-473, -250])$ occupies roughly **$28\%$ of the playable surface area**, yet accounts for **fewer than $3.8\%$ of loot pickups** and under $5\%$ of total movement trajectories.
  * Players who spawn in the south immediately sprint northward without stopping, treating the southern third of the map as dead transit space.

### 3. Why the Level Designer Should Care
Uneven resource distribution ruins game pacing:
1. Northern spawns give players an immediate gear advantage.
2. Southern spawns feel punishing, forcing players to run across empty terrain for 2–3 minutes before finding competitive loot.
3. Over-clumping in the northeast causes massive early-game bot swarms while leaving southern POIs completely abandoned.

### 4. Actionable Design Items & Metric Impact
* **Actionable Items**:
  1. **Redistribute POI Density**: Transplant two military outpost POIs with guaranteed Tier-2/Tier-3 loot containers to coordinates $(X: -220, Z: -360)$ and $(X: 80, Z: -390)$.
  2. **Vehicle / Zipline Traversal**: Install an elevated zipline connecting the southern ridge $(Z: -400)$ into the central valley $(Z: -100)$ to make southern exploration and rapid repositioning viable.
  3. **Loot Table Rebalancing**: Cap maximum loot container density in the northeast compound to prevent excessive hoarding.
* **Impacted Metrics**:
  * **Map Area Traversal Utilization**: Increases southern zone occupancy from $3.8\%$ to $>22\%$.
  * **Early-Game Spawn Balance**: Standardizes the time-to-first-weapon metric across all spawn quadrants to within $20$ seconds of each other.
  * **Survival Time Parity**: Eliminates the southern-spawn survival deficit.
