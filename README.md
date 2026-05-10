# Local Economic Stress Radar

A two-week prototype for ranking US metros and counties by emerging local economic stress.

The current build is intentionally narrow:

- Transparent stress score across labor, income, business, housing, and concentration risk
- CBSA-first dashboard with county drilldown
- Radar diagnostics for risk mix, driver mix, deterioration, and screening tables
- Area detail pages with peer comparisons, source trace, and analyst checks
- Validation cockpit with lift chart, confusion matrix, leakage timeline, readiness gates, and audit matrix
- Source provenance and roadmap pages with production-readiness detail
- Decision-first cards and score dials that make each page's purpose obvious
- Source and release metadata built into the data model
- Deterministic demo data generated in-browser from the same seeded scoring logic
- Static frontend served by any local HTTP server

## Run

```bash
cd /Users/rohanvasireddy/Documents/Playground/econ-stress-radar
python3 scripts/build_demo_data.py
python3 -m http.server 8061 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8061/`. The app reads `data/stress_data.js`,
which generates a deterministic demo panel in the browser. The Python script is
kept as a reproducible offline generator if you want an expanded static JSON
artifact instead.

## Project Layout

```text
data/stress_data.js          Compact deterministic demo data generator
docs/data_dictionary.md      Data model and scoring notes
scripts/build_demo_data.py   Reproducible demo data + scoring pipeline
src/app.js                   Dashboard behavior
src/styles.css               Dashboard styling
index.html                   National radar page
area.html                    Area detail page
validation.html              Backtest and validation page
sources.html                 Source provenance page
roadmap.html                 Build roadmap page
```

## Next Real-Data Milestone

Replace the demo generator with ingestion jobs for:

1. BLS LAUS monthly county labor data
2. QCEW county industry employment and wages
3. ACS 5-year static controls
4. BEA CAINC annual income controls
5. FRED national and state macro indicators

Keep the output contract in `data/stress_data.js` stable so the dashboard does not need to change.
