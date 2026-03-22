import os
import glob
import pandas as pd
import pyarrow.parquet as pq
import json

def process_data():
    base_dir = "player_data/player_data"
    output_file = "processed_data.json"
    
    # Map Configs
    map_configs = {
        "AmbroseValley": {"scale": 900, "ox": -370, "oz": -473},
        "GrandRift": {"scale": 581, "ox": -290, "oz": -290},
        "Lockdown": {"scale": 1000, "ox": -500, "oz": -500}
    }
    
    event_map = {
        b'Position': 'P', b'BotPosition': 'BP',
        b'Kill': 'K', b'Killed': 'Kd',
        b'BotKill': 'BK', b'BotKilled': 'BKd',
        b'KilledByStorm': 'KS', b'Loot': 'L'
    }
    
    files = glob.glob(f"{base_dir}/**/*.nakama-0", recursive=True)
    
    data = []
    
    for f in files: # f should look like player_data/player_data\February_10\...
        date_folder = os.path.basename(os.path.dirname(f))
        
        try:
            table = pq.read_table(f)
            df = table.to_pandas()
        except Exception as e:
            print(f"Error reading {f}: {e}")
            continue
            
        # Optimization: use vectorized operations instead of iterrows which is slow
        try:
            cfg = df['map_id'].map(map_configs)
            df = df.dropna(subset=['map_id']) # Ensure map_configs mapping doesn't fail on missing maps
            
            for map_id, group in df.groupby('map_id'):
                if map_id not in map_configs: continue
                cfg = map_configs[map_id]
                u = (group['x'] - cfg['ox']) / cfg['scale']
                v = (group['z'] - cfg['oz']) / cfg['scale']
                
                px = (u * 1024).round(2)
                py = ((1 - v) * 1024).round(2)
                
                is_bot = group['user_id'].astype(str).str.contains('-') == False
                
                # event encoding mapping safely
                def map_event(val):
                    if isinstance(val, str): val = val.encode('utf-8')
                    return event_map.get(val, val.decode('utf-8') if isinstance(val, bytes) else str(val))
                    
                e_short = group['event'].apply(map_event)
                
                # handling timestamps
                if pd.core.dtypes.common.is_datetime64_any_dtype(group['ts']):
                    ts = group['ts'].astype('int64') // 10**6 # into ms
                else:
                    ts = group['ts'].astype(int)
                    
                for idx in group.index:
                    data.append({
                        "m": str(group.loc[idx, 'match_id']),
                        "d": str(date_folder),
                        "map": str(map_id),
                        "u": str(group.loc[idx, 'user_id']),
                        "b": 1 if is_bot.loc[idx] else 0,
                        "x": float(px.loc[idx]),
                        "y": float(py.loc[idx]),
                        "ts": int(ts.loc[idx]),
                        "e": str(e_short.loc[idx])
                    })
        except Exception as e:
            # Fallback iterrows if optimization fails
            print(f"Optimized path failed, using iterrows: {e}")
            for _, row in df.iterrows():
                map_id = row['map_id']
                if map_id not in map_configs: continue
                
                cfg = map_configs[map_id]
                u = (row['x'] - cfg['ox']) / cfg['scale']
                v = (row['z'] - cfg['oz']) / cfg['scale']
                px = round(u * 1024, 2)
                py = round((1 - v) * 1024, 2)
                
                user_id = str(row['user_id'])
                is_bot = '-' not in user_id
                
                e_bytes = row['event']
                if isinstance(e_bytes, str):
                    e_bytes = e_bytes.encode('utf-8')
                e_short = event_map.get(e_bytes, e_bytes.decode('utf-8') if isinstance(e_bytes, bytes) else str(e_bytes))
                
                ts = int(row['ts'].timestamp() * 1000) if hasattr(row['ts'], 'timestamp') else int(row['ts'])
                
                data.append({
                    "m": str(row['match_id']),
                    "d": date_folder,
                    "map": str(map_id),
                    "u": user_id,
                    "b": 1 if is_bot else 0,
                    "x": px,
                    "y": py,
                    "ts": ts,
                    "e": e_short
                })
            
    with open(output_file, 'w') as out:
        json.dump(data, out)
        
    print(f"Processed {len(data)} events to {output_file}")

if __name__ == "__main__":
    process_data()
