# icu-ghg-calculator
a webapp to estimate intensive care unit greenhouse gas emissions and motivate change


### Files
/ (project root)
├─ index.html                     # Minimal HTML shell. Loads styles & JS modules in order.
├─ styles.css                     # All CSS you currently have (moved out of index.html)
├─ /data
│  ├─ assumptions.json
│  ├─ interventions.json
│  ├─ zip_CO2_annotated.csv
│  └─ subregion_emissions_annotated.csv
├─ /js
│  ├─ config.js                   # App constants (paths, color tokens, category ordering)
│  ├─ utils.js                    # Helpers (fmt, clamp, parseCSV, zfill, svgEl, tooltip)
│  ├─ state.js                    # Central state container; default inputs; safe mutators
│  ├─ data.js                     # Fetch & validate data files; JSON schema checks; fallbacks
│  ├─ ui.js                       # Init controls, tabs, drawer, buttons; updateTopBar()
│  ├─ baseline.js                 # Grid lookup + baseline math; recalcBaseline()
│  ├─ interventions.js            # Build baseline practices + interventions UI; applyInterventions()
│  ├─ charts.js                   # drawStack() + drawCompare() with safe guards & tooltips
│  ├─ exports.js                  # Export CSV/JSON
│  ├─ router.js                   # URL encode/decode of state; updateURLState(), applyURLState()
│  └─ main.js                     # Boot sequence (load data → init UI → baseline → render → apply)
└─ /schemas
   └─ interventions.schema.json   # Lightweight runtime validator for interventions.json (optional)
