# LILA APM Tech Test: Player Journey Visualizer

This repository contains my submission for the LILA BLACK Player Journey Visualization Tool.

## Structure
- `process_data.py`: Data pipeline constructed in Python utilizing Pandas/PyArrow to flatten 89,000 parquet events down to a unified, optimized JSON format containing localized 2D coordinate projections (`processed_data.json`).
- `lila-visualizer/`: Vite + React UI rendering application
- `ARCHITECTURE.md`: Outline of stack choices, design decisions, edge cases, and 2D mapping math methodology.
- `INSIGHTS.md`: Contains 3 analytical gameplay insights distilled uniquely from using this custom tool.

## Running Locally

### Step 1: Frontend App
The app is entirely encapsulated within the `lila-visualizer` project folder, consuming the pre-processed dataset via public assets.

```bash
cd lila-visualizer
npm install
npm run dev
```

Navigate to `http://localhost:5173`. 

### (Optional) Step 2: Reproducing Data Processing
If you wish to reprocess the `player_data/` parquet outputs:
```bash
python process_data.py
# This overrides exactly to lila-visualizer/public/processed_data.json
```

## Deployment
Since the data ingestion condenses accurately into a lightweight JSON payload and maps scale accurately over 2D pixels, this React App executes optimally as a static frontend. 
Simply push `lila-visualizer` to GitHub and import it via Vercel for immediate global accessibility.
