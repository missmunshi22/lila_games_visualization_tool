# LILA APM Tech Assignment: Architecture Doc

## Tech Stack Choices
- **Data Pipeline:** Python (Pandas/PyArrow) to parse the raw parquet files and flatten the structured schema into a unified JSON format. Python handles the geospatial mapping arithmetic accurately and produces an extremely lightweight output payload.
- **Frontend Framework:** React + Vite (TypeScript). React allows for rapid component-based UI organization. Vite provides extremely fast bootstrapping and local dev iteration.
- **Visualization:** HTML5 `<canvas>` handles the heavy lifting. Rendering ~90k points as standard DOM elements introduces significant lag. The Canvas 2D API offers a high-performance, frame-friendly alternative where paths are stroked and animated independently of typical React render cycles.
- **Hosting Strategy:** Entire project compiles to static HTML/JS/CSS (`npm run build`). This enables friction-free serverless hosting on Vercel, Netlify, or Github Pages. 

## Data Flow
1. **Raw Parquet -> JSON Pipeline:** The `process_data.py` script traverses `player_data/`. It iterates through `.nakama-0` parquet frames, identifies mapping coordinates, flags matches/human metrics, and constructs one robust JSON dataset. World coords are converted to standard 2D Cartesian pixels here to spare frontend calculations.
2. **Global Frontend State:** React pulls JSON into internal state on load. 
3. **Derived Interactions:** State gets pared down by user `<select>` elements mapping dynamically to filtered match bounds.
4. **Playback Loop:** During timeline play mode, an active `requestAnimationFrame` loop increments the global `currentTime` value. Filtering occurs within the component to subset standard vectors.

## Map Coordinate Mapping
Conversion relies on UV projection equations mapping normalized points to the custom bounds of each 1024x1024 minimap image. 

- `u = (x - x_origin) / scale`
- `v = (z - z_origin) / scale`

Pixel space treats top-left as native origin `[0,0]`. The UVs are extrapolated proportionally via `(u * 1024)` and bounding the Y-axis using `(1 - v) * 1024` for coordinate inversion as depicted in the original `README.md`. These transformed pixel outputs are stowed efficiently in the JSON output, liberating the browser to plot arrays rather than execute recursive math on 89,000 indices.

## Assumptions & Handled Edge Cases
- Ambiguous Bot Identifiers: The documentation highlighted human user_ids format as standard UUIDs whereas bots are numeric short-codes. A string pattern scan targeting the hyphen (`-`) explicitly sorts real players from AIs safely.
- Data Volume Mitigation: 5 days of multi-server analytics scales drastically. By transforming timestamps into simple local milliseconds relative to match-start offsets, the event JSON remains light enough for robust client-side visualization (~5MB text footprint uncompressed).

## Major Tradeoffs

| Alternative | Decision | Why? |
|-------------|----------|------|
| Streaming backend | Unified JSON Fetch | Simplicity. A custom backend requires database provisioning and maintenance. A static JSON file enables entirely free hosting and immediate evaluation for Level Design teams, prioritizing usability. |
| React Map Libraries (Leaflet) | Vanilla Canvas | Rendering 50,000+ simultaneous datapoints frequently crashes standard wrapper libraries meant for geographic layers. A custom 2D canvas draws the points instantly without virtual DOM overhead. |
