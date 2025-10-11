# icu-ghg-calculator
an app to estimate intensive care unit greenhouse gas emissions and motivate change

## ♻️ ICU Greenhouse Gas Footprint Calculator
* The carbon footprint of intensive care units (ICUs) is massive.
* The US healthcare system produces 8-9% of all greenhouse gas (GHG) emissions in the US - more than the entire economy of Japan.
* ICUs are particularly carbon intensive; one day of ICU treatment for septic shock (~140-170 kg CO2 equivalent) is equivalent to driving an ICE vehicle >400 miles or using electricity for 2 months in a typical home.
* Through relatively small changes in practice and equipment, individual clinicians and hospitals can realize large reductions in the overall carbon footprint.
* This calculator provides a transparent, literature-based estimate of an ICU’s carbon footprint, localized for energy mix and adjustable for clinical practices. 
* This tool is intended to help clinicians and hospitals identify and realize practice improvements to meaningfully reduce GHG emissions and make their ICU more sustainable.

Try the calculator out [here](https://nickmmark.github.io/icu-ghg-calculator/)


## 🌿 Design
* Two-tab interface:
   * Baseline — Estimate current emissions by entering ICU size, occupancy, and location.
   * Interventions — Toggle or adjust sustainability practices and instantly see reductions.
* Dynamic CO₂ bar: Live updates for total, savings %, and “equivalents” (e.g., cars, homes, trees).
* Expandable details: Each intervention shows assumptions, formula, and references.
* Modular JSON architecture: Non-technical users can edit assumptions and interventions without touching code.


## 🧮 Calculations

The app uses `kg CO₂e per ICU patient-day` as a core metric and converts using:
```
Annual_tCO2e = Beds × Occupancy × 365 × (Intensity_kgCO2e_per_patient_day / 1000)
```
| Parameter               | Value                                                                               | Source                            |
| ----------------------- | ----------------------------------------------------------------------------------- | --------------------------------- |
| Reference ICU intensity | **140 kg CO₂e / patient-day**                                                       | McGain et al., 2018; range 88–178 |
| Category shares         | Energy 0.65 • Procurement 0.18 • Pharma 0.10 • Gases 0.03 • Waste 0.02 • Water 0.02 | Literature mean                   |

Interventions fall into several categories:
* `percent_of_category` which refers to `lighting`, `energy_hvac`, `procurement`, `waste`, `crrt`, `pharma`, `medical gasses`, 
* direct_savings
* per_patient_day_delta
* intensity_per_hour
* kwh_reduction

#### Equivalency factors
| Metric                      | Conversion per t CO₂e |
| --------------------------- | --------------------- |
| Cars removed (1 yr)         | 0.217                 |
| Homes’ electricity (1 yr)   | 0.141                 |
| Acres of forest preserved   | 1.19                  |
| Tree seedlings grown 10 yrs | 16.5                  |


#### Energy and HVAC consumption
The app adjusts the baseline based on the ICU size/occupancy and location, to capture variations in local temperatures (HVAC costs) and the carbon footprint of local energy sources:
```
Energy_kgCO2e/pd = kWh_ref/pd × (Grid_factor_local / Grid_factor_ref) × Climate_multiplier
```
Reference grid factor (US mean): 827.520 lb/MWh = 0.3755 kg CO₂e/kWh
ZIP-specific factors: from EPA eGRID (2022–24)
Climate multiplier: derived from HDD/CDD vs. reference site (Kansas City); capped ±30 %.

### Adjusting for baseline ICU practices & Interventions
Each intervention is also used as part of a baseline assessment (e.g. determining if anesthetic gasses like N₂O and Desflurane are used) and as a potential opportunity for improvemnet (e.g. how much GHG would be mitigated by eliminating Desflurane)

Each intervention includes:
* Calculation formula
* Assumption references
* Markdown details and citations

#### CRRT 
Placeholder coefficient (from dialysis LCA):
2.0 kg CO₂e / hour of CRRT runtime.
Users can adjust in assumptions.json when site-specific data are available.

#### Anesthetic gasses
| Gas         | GWP₁₀₀ | Notes                                      |
| ----------- | ------ | ------------------------------------------ |
| N₂O         | 273    | High-impact; easily eliminated outside ORs |
| Desflurane  | 2540   | Avoid entirely if possible                 |
| Sevoflurane | 130    | Lower GWP; minimal ICU use                 |
| Isoflurane  | 510    | Moderate GWP                               |

#### Units and Conventions
* All greenhouse gas (GHG) emissions in this calculator are expressed in metric tons of CO₂ equivalent (`t CO₂e`) per year unless otherwise specified.
  * Metric ton = 1,000 kg (≈ 2,204.6 lb).
* The “CO₂ equivalent” unit converts non-CO₂ gases (e.g., CH₄, N₂O, anesthetic gases) into their equivalent impact based on their 100-year Global Warming Potential (GWP₁₀₀) as defined by the Intergovernmental Panel on Climate Change (IPCC AR6).
* Energy use is normalized to kilowatt-hours (kWh) and multiplied by a location-specific grid emission factor (kg CO₂e per kWh).
* Per-patient or per-bed values are scaled to annual totals using user-provided ICU size and occupancy assumptions.
* All calculations are approximate and intended for educational and quality-improvement purposes, not for regulatory carbon accounting.
  * Users should adapt grid factors and GWP values to their own jurisdiction and reference year when possible.


## ⚙️ Implementation
### Files/Structure
```
/ (project root)
├─ index.html                     # Minimal HTML shell. Loads styles & JS modules in order.
├─ styles.css                     # Defines appearance of website
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
```
                                                                                                     
                               ┌─────────┐                                                           
                               │         │                                                           
                               │ ┌─────────┐                        ┌─────────┐                      
                               │ │         │                        │         │                      
                               │ │         │    build BASELINE      │         │                      
                               │ │         │    tCO2e estimate      │         │  display ΔtCO2       
                               │ │         ├────────────────────►   │charts.js│  opportunities       
                               │ │         │                        │         │                      
                               │ │         │                        │         │                      
                               └─│         │                        │         │                      
                                 │         │                        └─────────┘                      
                                 └─────────┘                             ▲                           
                          subregion_emissions.csv                        │                           
                               & zip_CO2.csv                             │                           
                                                                         │                           
                                                                         │                           
   ┌─────────┐                 ┌─────────┐                               │                           
   │         │                 │         │                               │                           
   │         │                 │         │                               │                           
   │         │ ──────────────► │         │                               │                           
   │         │ ◄────────────── │         ├───────┐                       │                           
   │         │   converter.py  │         │       │                       │                           
   │         │                 │         │       │                                                   
   │         │                 │         │       │                  ┌─────────┐                      
   └─────────┘                 └─────────┘       │  build list of   │         │                      
                                                 │  INTERVENTIONS   │         │                      
 interventions.csv          interventions.json   │                  │         │   calculate ΔtCO2    
                                                 ├───────────────►  │         │  with INTERVENTIONS  
                                                 │                  │         │                      
                               ┌─────────┐       │                  │         │                      
                               │         │       │                  │         │                      
                               │         │       │                  └─────────┘                      
                               │         │       │                                                   
                               │         ├───────┘                interventions.js                   
                               │         │                                                           
                               │         │                                                           
                               │         │                                                           
                               └─────────┘                                                           
                                                                                                     
                               groups.json                                                           
                                                                                                     
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

## Versioning
* Current Version: 2.1.x
* Schema: x.y.z where
  * x is structual changes in file system/architecture or addition of new files
  * y is code changes within existing files
  * z is the version of interventions JSON 

## 💾 Data sources
Uses the [EPA eGRID dataset](https://www.epa.gov/egrid) to estimate regional CO2 production.

## 🪪 License
© 2025 Nick Mark, MD
Please credit ICU GHG Calculator and cite underlying research when reproducing or extending the tool.

This is provided "as is" without warranty of any kind with under an [MIT License](https://github.com/nickmmark/icu-ghg-calculator/blob/main/LICENSE).

## 📚️ References
* McGain F et al. Life cycle assessment of intensive care units in Australia and the USA. Crit Care Med. 2018;46(10):e983–e990.
* Sherman JD et al. Carbon footprint of critical care: a systematic review. BMJ Open 2024.
* NHS England. Delivering a ‘Net Zero’ National Health Service. 2020.
* EPA eGRID (2022–24). Power Profiler ZIP-to-subregion database.
* IPCC AR6 WGIII. Global Warming Potentials (100-year).
* Weppner WG et al, A Longitudinal Assessment of Greenhouse Gas Emissions From Inhaler Devices in a National Health System. JAMA. 2025. doi:10.1001/jama.2025.15638

