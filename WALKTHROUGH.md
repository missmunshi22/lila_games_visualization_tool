# LILA BLACK Player Journey Visualization Tool - Walkthrough

## What Was Accomplished
I successfully built and processed the assignment deliverables:
1. **Data Pipeline (`process_data.py`)**: A Python script was created to parse the 89,000 `parquet` rows spanning ~1,243 files, mapping world coordinates uniquely against the `scale` and `origin` values of the 3 maps to produce an efficient custom 2D JSON structure.
2. **Frontend App (`lila-visualizer`)**: A Vite + React application consuming the dataset dynamically. It overlays the custom dataset onto the scaled minimap assets using HTML5 `<canvas>` for extremely performant playback without DOM lag.
3. **Core Interactive Features**:
  - **Player Isolation (Focus Mode)**: Users can filter down to a specific Human or Bot to trace their singular full journey without the visual noise of 80 other players.
  - **Fading Trails**: Instead of rendering spaghetti paths of every player permanently, paths fade out like a real-time tail of the last 30 seconds.
  - **Overhauled Heatmaps**: Heatmaps now render as a glowing radial overlay using screen-compositing for true heatmap generation (not just scattered dots).
  - Modern, slate-themed Dashboard UI containing stats counters for quick reference.
4. **Documentation**:
  - `ARCHITECTURE.md`
  - `INSIGHTS.md`
  - Root `README.md` containing local-run/deployment instructions.

## What Was Tested
- **Component Compile**: `npm run build` executed successfully resolving all typing and import dependencies.
- **Payload Verification**: Pre-processed JSON mapped successfully capturing timeline events (kills, loot, positioning, deaths) into mapped enums without crashing on empty values.
- **Math Sanity**: Coordinate systems accurately flip the `v` axis for true top-left coordinate drawing against the provided textures.

## How to View
The code exists in the active workspace `lila_games/`. To execute, follow instructions in `README.md`:
```bash
cd lila-visualizer
npm install
npm run dev
```
