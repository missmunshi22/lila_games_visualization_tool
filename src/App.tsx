import { useState, useEffect, useMemo, useRef } from 'react';
import MapRenderer, { EventData } from './MapRenderer';
import './index.css';

function App() {
  const [data, setData] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMap, setSelectedMap] = useState('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState('February_10');
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<'none' | 'kills' | 'deaths' | 'traffic'>('none');

  const animationRef = useRef<number>();

  useEffect(() => {
    fetch('/processed_data.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  const maps = useMemo(() => Array.from(new Set(data.map(d => d.map))), [data]);
  const dates = useMemo(() => Array.from(new Set(data.filter(d => d.map === selectedMap).map(d => d.d))), [selectedMap, data]);
  const matches = useMemo(() => Array.from(new Set(data.filter(d => d.map === selectedMap && d.d === selectedDate).map(d => d.m))), [selectedMap, selectedDate, data]);

  useEffect(() => { if (!dates.includes(selectedDate) && dates.length > 0) setSelectedDate(dates[0]); }, [dates, selectedDate]);
  useEffect(() => { if (!matches.includes(selectedMatch) && matches.length > 0) setSelectedMatch(matches[0]); }, [matches, selectedMatch]);

  const currentMatchData = useMemo(() => {
    return data.filter(d => d.m === selectedMatch && d.map === selectedMap && d.d === selectedDate).sort((a, b) => a.ts - b.ts);
  }, [data, selectedMatch, selectedMap, selectedDate]);

  const playersInMatch = useMemo(() => {
    const players = new Map<string, { isBot: boolean, events: number }>();
    currentMatchData.forEach(d => {
      const p = players.get(d.u) || { isBot: d.b === 1, events: 0 };
      p.events++;
      players.set(d.u, p);
    });
    return Array.from(players.entries()).sort((a, b) => b[1].events - a[1].events);
  }, [currentMatchData]);

  const [minTs, maxTs] = useMemo(() => {
    if (currentMatchData.length === 0) return [0, 100000];
    return [currentMatchData[0].ts, currentMatchData[currentMatchData.length - 1].ts];
  }, [currentMatchData]);

  useEffect(() => {
    setCurrentTime(minTs);
    setIsPlaying(false);
    setSelectedPlayer(null); // reset focused player on match change
  }, [selectedMatch, minTs]);

  useEffect(() => {
    if (isPlaying) {
      let lastFrame = performance.now();
      const loop = (time: number) => {
        const dt = time - lastFrame;
        lastFrame = time;
        // 10x speed multiplier for smooth playback
        setCurrentTime(prev => {
          const next = prev + dt * 10;
          if (next >= maxTs) {
            setIsPlaying(false);
            return maxTs;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(loop);
      };
      animationRef.current = requestAnimationFrame(loop);
    }
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, maxTs]);

  const formatTs = (ts: number) => {
    const s = Math.floor((ts - minTs) / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const mapImageSrc = `/minimaps/${selectedMap}_Minimap.${selectedMap === 'Lockdown' ? 'jpg' : 'png'}`;

  const togglePlay = () => {
    if (currentTime >= maxTs) setCurrentTime(minTs);
    setIsPlaying(!isPlaying);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <div>Loading Telemetry Data...</div>
    </div>
  );

  return (
    <div className="app-container">

      <aside className="sidebar">
        <div className="navbar-brand">LILA BLACK</div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{playersInMatch.filter(p => !p[1].isBot).length}</div>
            <div className="stat-label">Humans</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{playersInMatch.filter(p => p[1].isBot).length}</div>
            <div className="stat-label">Bots</div>
          </div>
        </div>

        <div>
          <div className="section-title">Match Selection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="nav-select">
              <label>Map</label>
              <select value={selectedMap} onChange={e => setSelectedMap(e.target.value)} style={{ flex: 1 }}>
                {maps.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="nav-select">
              <label>Match</label>
              <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} style={{ flex: 1 }}>
                {matches.map((m, i) => <option key={m} value={m}>Match {i + 1} ({m.substring(0, 8)})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="section-title">Inspection Mode</div>
          <div className="mode-toggles">
            <button className={`mode-btn ${heatmapMode === 'none' ? 'active' : ''}`} onClick={() => setHeatmapMode('none')}>
              Timeline Replay
            </button>
            <button className={`mode-btn ${heatmapMode === 'traffic' ? 'active' : ''}`} onClick={() => setHeatmapMode('traffic')}>
              Heatmap: Traffic Flow
            </button>
            <button className={`mode-btn ${heatmapMode === 'kills' ? 'active' : ''}`} onClick={() => setHeatmapMode('kills')}>
              Heatmap: Kill Zones
            </button>
            <button className={`mode-btn ${heatmapMode === 'deaths' ? 'active' : ''}`} onClick={() => setHeatmapMode('deaths')}>
              Heatmap: Death Zones
            </button>
          </div>
        </div>

        {heatmapMode === 'none' && (
          <div className="player-filter">
            <div className="section-title">Focus Player</div>
            <select value={selectedPlayer || ''} onChange={e => setSelectedPlayer(e.target.value || null)}>
              <option value="">-- All Players --</option>
              <optgroup label="Humans">
                {playersInMatch.filter(p => !p[1].isBot).map(p => (
                  <option key={p[0]} value={p[0]}>{p[0].substring(0, 8)}... ({p[1].events} pos)</option>
                ))}
              </optgroup>
              <optgroup label="Bots">
                {playersInMatch.filter(p => p[1].isBot).map(p => (
                  <option key={p[0]} value={p[0]}>Bot {p[0]}</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}

        <div className="legend" style={{ marginTop: 'auto' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Legend</div>
          <div className="legend-item"><div className="marker-human"></div> Human Player</div>
          <div className="legend-item"><div className="marker-bot"></div> AI Bot</div>
          <div className="legend-item"><div className="marker-kill"></div> Kill Event</div>
          <div className="legend-item"><div className="marker-storm"></div> Storm Sector Death</div>
          <div className="legend-item"><div className="marker-loot"></div> Looting</div>
        </div>
      </aside>

      <main className="map-viewport">
        <div className="map-wrapper">
          <img src={mapImageSrc} alt="Minimap" className="map-image" />
          <MapRenderer
            events={currentMatchData}
            currentTime={heatmapMode !== 'none' ? maxTs : currentTime}
            highlightHeatmap={heatmapMode}
            selectedPlayer={selectedPlayer}
          />
        </div>

        {heatmapMode === 'none' && (
          <div className="timeline-overlay">
            <div className="timeline-content">
              <button className="play-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className="time-display">{formatTs(currentTime)}</div>

              <div className="scrubber-container">
                <input
                  className="scrubber"
                  type="range"
                  min={minTs}
                  max={maxTs}
                  value={currentTime}
                  onChange={e => {
                    setCurrentTime(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                />
              </div>
              <div className="time-display" style={{ color: 'var(--text-muted)' }}>{formatTs(maxTs)}</div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
