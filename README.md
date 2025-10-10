# icu-ghg-calculator
a webapp to estimate intensive care unit greenhouse gas emissions and motivate change

## Context
* The carbon footprint of intensive care units (ICUs) is massive.
* The US healthcare system produces 8-9% of all greenhouse gas (GHG) emissions in the US - more than the entire economy of Japan.
* ICUs are particularly carbon intensive; one day of ICU treatment for septic shock (~140-170 kg CO2 equivalent) is equivalent to driving an ICE vehicle >400 miles or using electricity for 2 months in a typical home.
* Through relatively small changes in practice and equipment, individual clinicians and hospitals can realize large reductions in the overall carbon footprint. 
* This tool is intended to help clinicians and hospitals identify and realize practice improvements to reduce GHG emissions and make their ICU more sustainable.

Try the calculator out [here](https://nickmmark.github.io/icu-ghg-calculator/)

## 🧮 Calculations

### Adjusting for region/local energy consumption
### Adjusting for baseline ICU practices
### Implementing changes


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

# Versioning
* Current Version: 2.1.x

# Data sources
Uses the [EPA eGRID dataset](https://www.epa.gov/egrid) to estimate regional CO2 production.

# 🪪 License
This is provided "as is" without warranty of any kind with under an [MIT License](https://github.com/nickmmark/icu-ghg-calculator/blob/main/LICENSE).

# 📚️ References

