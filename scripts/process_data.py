import os
import glob
import json
import pyarrow.parquet as pq
import pandas as pd
import numpy as np
from collections import defaultdict

MAP_CONFIGS = {
    'AmbroseValley': {'scale': 900.0, 'origin_x': -370.0, 'origin_z': -473.0, 'image': 'AmbroseValley_Minimap.png'},
    'GrandRift': {'scale': 581.0, 'origin_x': -290.0, 'origin_z': -290.0, 'image': 'GrandRift_Minimap.png'},
    'Lockdown': {'scale': 1000.0, 'origin_x': -500.0, 'origin_z': -500.0, 'image': 'Lockdown_Minimap.jpg'}
}

DAY_FOLDERS = {
    'February_10': '2026-02-10',
    'February_11': '2026-02-11',
    'February_12': '2026-02-12',
    'February_13': '2026-02-13',
    'February_14': '2026-02-14'
}

OUTPUT_DIR = os.path.join('public', 'data')
MATCHES_DIR = os.path.join(OUTPUT_DIR, 'matches')
os.makedirs(MATCHES_DIR, exist_ok=True)

def is_human_user(user_id: str) -> bool:
    # Humans have UUID strings (length > 10, typically 36 with hyphens)
    # Bots have numeric IDs (e.g. 1440, 382)
    return len(str(user_id)) > 10

def world_to_pixel(x: float, z: float, map_id: str):
    cfg = MAP_CONFIGS.get(map_id, MAP_CONFIGS['AmbroseValley'])
    u = (x - cfg['origin_x']) / cfg['scale']
    v = (z - cfg['origin_z']) / cfg['scale']
    px = round(u * 1024.0, 1)
    py = round((1.0 - v) * 1024.0, 1)
    return px, py

def main():
    print("Step 1: Discovering all parquet files...")
    files_by_match = defaultdict(list)
    file_day_map = {}

    total_files = 0
    for folder, date_str in DAY_FOLDERS.items():
        if not os.path.isdir(folder):
            continue
        day_files = glob.glob(os.path.join(folder, '*'))
        for f in day_files:
            fname = os.path.basename(f)
            # filename format: {user_id}_{match_id}.nakama-0
            parts = fname.split('_')
            if len(parts) >= 2:
                # The match_id might have hyphens or other parts
                match_id = '_'.join(parts[1:])
                files_by_match[match_id].append(f)
                file_day_map[f] = date_str
                total_files += 1

    print(f"Found {total_files} files across {len(files_by_match)} unique matches.")

    # Distinct color palette for player journeys
    HUMAN_COLORS = [
        '#00F0FF', '#39FF14', '#FFE600', '#FF007F', '#B026FF',
        '#00FFA3', '#FF7700', '#0099FF', '#FF1493', '#7928CA',
        '#00E5FF', '#A6FF00', '#FF3366', '#00FFCC', '#E0AAFF'
    ]
    BOT_COLOR = '#8892B0'

    manifest_matches = []
    map_aggregates = {
        m: {
            'total_matches': 0,
            'total_events': 0,
            'traffic': [],
            'kills': [],
            'deaths': [],
            'storm_deaths': [],
            'loot': [],
            'stats': {
                'human_count': 0,
                'bot_count': 0,
                'bot_kills': 0,
                'bot_deaths': 0,
                'pvp_kills': 0,
                'storm_deaths': 0,
                'loot_events': 0
            }
        } for m in MAP_CONFIGS
    }

    print("Step 2: Processing matches and generating timelines...")
    for match_idx, (match_id, match_file_list) in enumerate(files_by_match.items()):
        dfs = []
        for f in match_file_list:
            try:
                t = pq.read_table(f)
                sub_df = t.to_pandas()
                sub_df['file_date'] = file_day_map.get(f, '2026-02-10')
                dfs.append(sub_df)
            except Exception as e:
                print(f"Warning: could not read {f}: {e}")

        if not dfs:
            continue

        df = pd.concat(dfs, ignore_index=True)
        # Decode event bytes
        df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else str(x))
        df['user_id'] = df['user_id'].astype(str)

        map_id = df['map_id'].iloc[0]
        date_str = df['file_date'].iloc[0]

        # Convert timestamps:
        # As discovered, raw ts in datetime64[ms] contains numeric values whose delta represents seconds!
        # Convert to raw integer
        raw_ts = df['ts'].astype('int64')
        min_ts = raw_ts.min()
        max_ts = raw_ts.max()
        duration_sec = int(max_ts - min_ts)
        df['t_sec'] = (raw_ts - min_ts).astype(float)

        # Sort chronologically
        df = df.sort_values(by=['t_sec', 'user_id']).reset_index(drop=True)

        # Build player metadata
        unique_users = df['user_id'].unique()
        players_meta = {}
        human_idx = 0
        for u in unique_users:
            is_human = is_human_user(u)
            color = HUMAN_COLORS[human_idx % len(HUMAN_COLORS)] if is_human else BOT_COLOR
            if is_human:
                human_idx += 1
            
            u_df = df[df['user_id'] == u]
            kills = len(u_df[u_df['event'].isin(['Kill', 'BotKill'])])
            deaths = len(u_df[u_df['event'].isin(['Killed', 'BotKilled', 'KilledByStorm'])])
            loots = len(u_df[u_df['event'] == 'Loot'])
            survival_sec = round(float(u_df['t_sec'].max() - u_df['t_sec'].min()), 1)

            players_meta[u] = {
                'id': u,
                'is_bot': not is_human,
                'color': color,
                'kills': kills,
                'deaths': deaths,
                'loots': loots,
                'survival_sec': survival_sec
            }

        # Event counts
        event_counts = df['event'].value_counts().to_dict()

        # Build timeline entries
        timeline = []
        for _, row in df.iterrows():
            px, py = world_to_pixel(row['x'], row['z'], map_id)
            ev = row['event']
            u = row['user_id']
            t = round(float(row['t_sec']), 2)

            timeline.append({
                't': t,
                'u': u,
                'ev': ev,
                'px': px,
                'py': py,
                'x': round(float(row['x']), 2),
                'z': round(float(row['z']), 2),
                'y': round(float(row['y']), 2)
            })

            # Update map-wide aggregate heatmap points
            if map_id in map_aggregates:
                agg = map_aggregates[map_id]
                if ev in ('Position', 'BotPosition'):
                    # Subsample traffic points (every 5th) to keep size fast and lightweight
                    if hash(f"{u}_{t}") % 5 == 0:
                        agg['traffic'].append([px, py])
                elif ev in ('Kill', 'BotKill'):
                    agg['kills'].append([px, py])
                elif ev in ('Killed', 'BotKilled'):
                    agg['deaths'].append([px, py])
                elif ev == 'KilledByStorm':
                    agg['storm_deaths'].append([px, py])
                elif ev == 'Loot':
                    if hash(f"{u}_{t}") % 2 == 0:
                        agg['loot'].append([px, py])

        # Write match JSON
        clean_match_id = match_id.replace('.nakama-0', '')
        match_data = {
            'match_id': match_id,
            'clean_id': clean_match_id,
            'map_id': map_id,
            'date': date_str,
            'duration_sec': duration_sec,
            'total_events': len(df),
            'event_counts': event_counts,
            'players': players_meta,
            'timeline': timeline
        }

        match_filepath = os.path.join(MATCHES_DIR, f"{clean_match_id}.json")
        with open(match_filepath, 'w', encoding='utf-8') as mf:
            json.dump(match_data, mf, separators=(',', ':'))

        # Add to manifest
        human_count = sum(1 for p in players_meta.values() if not p['is_bot'])
        bot_count = sum(1 for p in players_meta.values() if p['is_bot'])
        manifest_matches.append({
            'match_id': match_id,
            'clean_id': clean_match_id,
            'map_id': map_id,
            'date': date_str,
            'duration_sec': duration_sec,
            'total_events': len(df),
            'human_count': human_count,
            'bot_count': bot_count,
            'event_counts': event_counts,
            'file_count': len(match_file_list)
        })

        if map_id in map_aggregates:
            m_agg = map_aggregates[map_id]
            m_agg['total_matches'] += 1
            m_agg['total_events'] += len(df)
            m_agg['stats']['human_count'] += human_count
            m_agg['stats']['bot_count'] += bot_count
            m_agg['stats']['bot_kills'] += event_counts.get('BotKill', 0)
            m_agg['stats']['bot_deaths'] += event_counts.get('BotKilled', 0)
            m_agg['stats']['pvp_kills'] += event_counts.get('Kill', 0)
            m_agg['stats']['storm_deaths'] += event_counts.get('KilledByStorm', 0)
            m_agg['stats']['loot_events'] += event_counts.get('Loot', 0)

        if (match_idx + 1) % 100 == 0 or (match_idx + 1) == len(files_by_match):
            print(f"Processed {match_idx + 1}/{len(files_by_match)} matches...")

    # Sort manifest by date descending and human_count descending
    manifest_matches.sort(key=lambda m: (m['date'], m['human_count'], m['total_events']), reverse=True)

    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as mf:
        json.dump({
            'total_matches': len(manifest_matches),
            'total_files': total_files,
            'generated_at': '2026-10-16',
            'maps': list(MAP_CONFIGS.keys()),
            'dates': sorted(list(set(DAY_FOLDERS.values()))),
            'matches': manifest_matches
        }, mf, indent=2)

    aggregates_path = os.path.join(OUTPUT_DIR, 'map_aggregates.json')
    with open(aggregates_path, 'w', encoding='utf-8') as af:
        json.dump(map_aggregates, af, separators=(',', ':'))

    print("Success! Data pipeline complete.")
    print(f"- Manifest written to: {manifest_path}")
    print(f"- Match files written to: {MATCHES_DIR}")
    print(f"- Map aggregates written to: {aggregates_path}")

if __name__ == '__main__':
    main()
