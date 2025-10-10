import { state } from './state.js';
import { zfill, clamp } from './utils.js';
import { updateTopBar } from './ui.js';
import { drawStack, drawCompare } from './charts.js';

const zCache = new Map();

export function lookupGridFactor(){
  const kgPerKwh_nat = state.assumptions.national_grid_anchor.us_mean_kg_per_kwh;
  const zip = zfill((state.inputs.zip||'').trim());
  let rate_lb_mwh = null;

  if(zip && state.zipTable){
    if(zCache.has(zip)) rate_lb_mwh = zCache.get(zip);
    else {
      const row = state.zipTable.find(r=>zfill(r['ZIP5'])===zip);
      rate_lb_mwh = row ? +row['rate_lb_per_mwh'] : null;
      zCache.set(zip, rate_lb_mwh);
    }
  }
  if(!rate_lb_mwh && state.subregionTable && state.inputs.country==='USA'){
    const vals = state.subregionTable.map(r=>+r['rate_lb_per_mwh']).filter(x=>isFinite(x));
    vals.sort((a,b)=>a-b);
    rate_lb_mwh = vals[Math.floor(vals.length/2)];
  }
  if(rate_lb_mwh){
    return rate_lb_mwh * 0.453592 / 1000; // kg/kWh
  }
  const cf = state.assumptions.country_grid_defaults_kg_per_kwh[state.inputs.country] ?? kgPerKwh_nat;
  return cf;
}

export function recalcBaseline(){
  const PD = 365 * state.inputs.beds * state.inputs.occupancy;
  state.derived.patientDays = PD;

  const grid = lookupGridFactor();
  state.derived.gridFactor_kg_per_kwh = grid;

  const A = state.assumptions;
  const baseI = A.baseline_intensity.kg_co2e_per_patient_day;
  const shares = A.category_shares;

  // Energy share -> kWh/pd using reference grid
  const sE = shares.energy_hvac;
  const refGrid = A.energy_module.reference_grid_factor_kg_per_kwh || A.national_grid_anchor.us_mean_kg_per_kwh;
  const kWh_pd_ref = (sE * baseI) / refGrid;

  // Climate multiplier
  const Mcl = clamp(+state.inputs.climateMult || 1, A.energy_module.climate_adjustment.cap_multiplier_min, A.energy_module.climate_adjustment.cap_multiplier_max);

  // Energy emissions per pd (kg)
  const E_pd = kWh_pd_ref * grid * Mcl;

  // Other categories proportional to base intensity
  const other_pd = {
    procurement: baseI * shares.procurement,
    pharma: baseI * shares.pharma,
    medical_gases: baseI * shares.medical_gases,
    waste: baseI * shares.waste,
    water_other: baseI * shares.water_other
  };

  // Extras from baseline practices
  let extras = { gases:0, lighting:0, crrt:0, pharma:0, procurement:0, energy:0, waste:0, water_other:0 };
  const bp = state.baselinePractices;

  const AEL = A.energy_module.lighting.kwh_per_bed_hour || 0.02;
  if(bp['lights_night_dimming']?.enabled){
    const hours = +bp['lights_night_dimming'].value || 0;
    const kwh_year = hours * state.inputs.beds * 365 * AEL;
    extras.lighting += (kwh_year * grid)/PD; // kg/pd
  }

  if(bp['crrt_stewardship']?.enabled){
    const hrs = +bp['crrt_stewardship'].value || 0;
    extras.crrt += hrs * (A.crrt.kg_co2e_per_hour || 2.0); // kg/pd
  }

  if(bp['eliminate_n2o']?.enabled){
    const kgYear = +bp['eliminate_n2o'].value || 0;
    extras.gases += ((kgYear * A.medical_gases.gwps_100.N2O)/1000 *1000 / PD);
  }

  if(bp['eliminate_desflurane']?.enabled){
    const minutes = +bp['eliminate_desflurane'].value || 0;
    const kg = (minutes * 0.2 * 1.46)/1000;
    extras.gases += (kg * A.medical_gases.gwps_100.Desflurane)/1000 * 1000 / PD;
  }

  if(bp['mdi_to_nebulizer']?.enabled){
    const puffsPd = +bp['mdi_to_nebulizer'].value || 0;
    extras.pharma += puffsPd * (0.05); // placeholder coefficient
  }

  if(bp['reusable_bronchoscopy']?.enabled){
    const pctReusable = +bp['reusable_bronchoscopy'].value || 0;
    const pctSingleUse = Math.max(0, Math.min(100, 100 - pctReusable));
    const kgPd = (pctSingleUse/100) * (A.procurement_pharma.bronch_kg_pd || 0.5);
    extras.procurement += kgPd;
  }

  if(bp['reusable_gowns']?.enabled){
    const pctSingle = Math.max(0, Math.min(100, (+bp['reusable_gowns'].value||0)));
    const kgPd = (pctSingle/100) * (A.procurement_pharma.gown_kg_pd || 0.4);
    extras.procurement += kgPd;
  }

  const intensity_pd =
      E_pd
    + other_pd.procurement + other_pd.pharma + other_pd.medical_gases + other_pd.waste + other_pd.water_other
    + extras.gases + extras.lighting + extras.crrt + extras.pharma + extras.procurement;

  const annual_t = intensity_pd * PD / 1000;

  const categories_t = {
    energy_hvac: (E_pd * PD)/1000,
    procurement: (other_pd.procurement * PD)/1000 + (extras.procurement * PD)/1000,
    pharma:      (other_pd.pharma * PD)/1000 + (extras.pharma * PD)/1000,
    medical_gases: (other_pd.medical_gases * PD)/1000 + (extras.gases * PD)/1000,
    waste: (other_pd.waste * PD)/1000,
    water_other: (other_pd.water_other * PD)/1000,
    lighting: (extras.lighting * PD)/1000,
    crrt: (extras.crrt * PD)/1000
  };

  state.derived.baseline = { intensity_pd, annual_t, categories_t };
  state.derived.current.annual_t = annual_t;
  state.derived.current.categories_t = Object.assign({}, categories_t);

  updateTopBar();
  drawStack('chartStackBaseline', state.derived.baseline.categories_t, `Baseline ${intToStr(annual_t)} tons CO2/year`);
  drawCompare();
}

function intToStr(n){ return isFinite(n)? n.toLocaleString(undefined,{maximumFractionDigits:1}) : '—'; }
