import { useEffect, useRef } from 'react';

export type EventData = {
    m: string;
    d: string;
    map: string;
    u: string;
    b: number; // 1 = bot
    x: number;
    y: number;
    ts: number;
    e: string;
};

interface MapRendererProps {
    events: EventData[];
    currentTime: number;
    highlightHeatmap: 'none' | 'kills' | 'deaths' | 'traffic';
    selectedPlayer: string | null;
}



export default function MapRenderer({ events, currentTime, highlightHeatmap, selectedPlayer }: MapRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';

        if (highlightHeatmap !== 'none') {
            ctx.globalCompositeOperation = 'screen';
            ctx.filter = 'blur(15px)';
            let filtered = events;
            if (highlightHeatmap === 'kills') {
                filtered = events.filter(e => e.e === 'K' || e.e === 'BK');
            } else if (highlightHeatmap === 'deaths') {
                filtered = events.filter(e => e.e === 'Kd' || e.e === 'BKd' || e.e === 'KS');
            } else if (highlightHeatmap === 'traffic') {
                filtered = events.filter(e => e.e === 'P' || e.e === 'BP');
            }

            ctx.globalAlpha = 0.5;
            for (const e of filtered) {
                ctx.beginPath();
                const radius = highlightHeatmap === 'traffic' ? 20 : 35;
                const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius);
                const color = highlightHeatmap === 'traffic' ? '59, 130, 246' : '239, 68, 68';
                grad.addColorStop(0, `rgba(${color}, 0.8)`);
                grad.addColorStop(1, `rgba(${color}, 0)`);

                ctx.fillStyle = grad;
                ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'source-over';
            return;
        }

        // NORMAL MODE (Timeline Player Trails)
        const TAIL_DURATION = selectedPlayer ? 1000000 : 30000; // If selecting player, show full history up to currentTime. Else 30s tail.

        // Only process events that have happened at or before currentTime
        const pastEvents = events.filter(e => e.ts <= currentTime);

        // Group by user
        const byUser: Record<string, EventData[]> = {};
        for (const e of pastEvents) {
            if (!byUser[e.u]) byUser[e.u] = [];
            byUser[e.u].push(e);
        }

        for (const [userId, userEvents] of Object.entries(byUser)) {
            if (selectedPlayer && userId !== selectedPlayer) continue;

            const isBot = userEvents[0].b === 1;

            // Filter to only events within the tail duration
            const recentEvents = userEvents.filter(e => e.ts >= currentTime - TAIL_DURATION);
            if (recentEvents.length === 0) continue;

            ctx.beginPath();
            ctx.lineWidth = selectedPlayer ? 4 : (isBot ? 2 : 3);

            // Determine base color based on bot/human and selection status
            let baseRgb = isBot ? '148, 163, 184' : '59, 130, 246'; // slate-400 or blue-500
            if (selectedPlayer) baseRgb = '245, 158, 11'; // highlight selected player in amber

            let hasStarted = false;

            // Draw path with a fading trail effect
            for (let i = 0; i < recentEvents.length; i++) {
                const e = recentEvents[i];
                if (e.e === 'P' || e.e === 'BP') {
                    // Calculate opacity based on age of the event
                    const age = currentTime - e.ts;
                    const pct = Math.max(0, 1 - (age / TAIL_DURATION)); // 1.0 = brand new, 0.0 = old

                    if (!hasStarted) {
                        ctx.moveTo(e.x, e.y);
                        hasStarted = true;
                    } else {
                        // Because standard Canvas paths don't support varying opacity within a single path,
                        // we have to stroke segment by segment for the tail effect.
                        ctx.lineTo(e.x, e.y);
                        ctx.strokeStyle = `rgba(${baseRgb}, ${selectedPlayer ? Math.max(0.1, pct) : pct})`;
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(e.x, e.y); // start new sub-path from here
                    }
                }
            }

            // Draw the "Player Head" (current position)
            if (hasStarted) {
                const lastPos = recentEvents.slice().reverse().find(e => e.e === 'P' || e.e === 'BP');
                if (lastPos && currentTime - lastPos.ts < 5000) {
                    // Draw head dot prominently
                    ctx.beginPath();
                    ctx.arc(lastPos.x, lastPos.y, selectedPlayer ? 6 : (isBot ? 3 : 5), 0, Math.PI * 2);
                    ctx.fillStyle = `rgb(${baseRgb})`;
                    ctx.fill();

                    // Glow effect for humans
                    if (!isBot || selectedPlayer) {
                        ctx.beginPath();
                        ctx.arc(lastPos.x, lastPos.y, selectedPlayer ? 12 : 8, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${baseRgb}, 0.3)`;
                        ctx.fill();
                    }
                }
            }

            // Draw events (kills, deaths) for this user that happened VERY recently (e.g. last 10 seconds)
            for (const e of recentEvents) {
                if (['K', 'Kd', 'BK', 'BKd', 'KS', 'L'].includes(e.e)) {
                    const age = currentTime - e.ts;
                    if (age > 15000 && !selectedPlayer) continue; // let events fade away fast unless inspecting a player

                    const alpha = Math.max(0, 1 - (age / 15000));

                    ctx.beginPath();
                    if (e.e === 'L') {
                        ctx.rect(e.x - 4, e.y - 4, 8, 8);
                        ctx.fillStyle = `rgba(245, 158, 11, ${selectedPlayer ? 1 : alpha})`; // warning yellow
                    } else if (e.e === 'KS') {
                        ctx.rect(e.x - 5, e.y - 5, 10, 10);
                        ctx.fillStyle = `rgba(139, 92, 246, ${selectedPlayer ? 1 : alpha})`; // purple
                    } else {
                        // crosshair shape for kills
                        ctx.arc(e.x, e.y, 6, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(239, 68, 68, ${selectedPlayer ? 1 : alpha})`; // red
                    }
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = `rgba(0,0,0,${selectedPlayer ? 1 : alpha})`;
                    ctx.stroke();
                }
            }
        }

    }, [events, currentTime, highlightHeatmap, selectedPlayer]);

    return (
        <canvas
            className="map-canvas"
            ref={canvasRef}
            width={1024}
            height={1024}
        />
    );
}
