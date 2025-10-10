# icu-ghg-calculator
a webapp to estimate intensive care unit greenhouse gas emissions and motivate change

## 🧮 Calculations

### Adjusting for local energy consumption
### Adjusting for baseline ICU practices


## ⚙️ Implementation
### Files
```
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
```

### Functions
* state.js
   * state (object): { assumptions, interventions, zipTable, subregionTable, inputs, baselinePractices, derived }
* data.js
   * loadAllData() → loads all four files; normalizes interventions (defaults OFF/0); validates shapes
* ui.js
   * initUI(), updateTopBar()
* baseline.js
   * lookupGridFactor(), recalcBaseline()
* interventions.js
   * renderBaselinePractices(), renderInterventions(), applyInterventions()
* charts.js
   * drawStack(containerId, categories, title), drawCompare()
* exports.js
   * exportCSV(), exportJSON(), renderAssumptionsHTML()
* router.js
   * updateURLState(), applyURLState()
* main.js
   * orchestrates boot order

### Creating/updating interventions.json
Use the helper script `converter.py`
1. Convert JSON -> CSV (for editing)
```
python3 converter.py json-to-csv --json interventions.json \
  --groups-out groups.csv \
  --interventions-out interventions.csv
```
2. Edit groups.csv and interventions.csv in Excel/Google Sheets
3. Convert CSVs -> JSON (to feed back into the app)
```
python3 converter.py csv-to-json \
  --groups groups.csv \
  --interventions interventions.csv \
  --json-out interventions.json
```
#### What this does
* Identity & grouping: id, group, title, type, impact_category
* Slider range (if type=slider): range_min, range_max, range_step, range_unit
* Baseline control: baseline_label, baseline_type, baseline_default_enabled, baseline_default_value, baseline_min, baseline_max, baseline_step, baseline_unit
* Calculation: calc_method, calc_formula_note
* Params (fill only what you use):
   * param_kwh_per_hour_per_bed, param_grid_factor_source, param_annual_usage_kg, param_gwp100, param_annual_agent_minutes, param_agent_consumption_ml_per_min, param_density_g_per_ml, param_percent_reduction, param_category,    param_scale_with_value_pct, param_kg_per_hour, param_kg_co2e_per_puff
* UI: ui_icon, ui_summary, ui_details_markdown, ui_references (use Label|URL;Another Label|URL2)


# 📚️ References

