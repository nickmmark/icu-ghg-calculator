import { state } from './state.js';

export function renderAssumptionsHTML(){
  const A = state.assumptions;
  const gf = state.derived.gridFactor_kg_per_kwh;
  return `
    <div><b>Baseline intensity:</b> ${A.baseline_intensity.kg_co2e_per_patient_day} kg CO₂e/patient-day (range ${A.baseline_intensity.range_lit_min}–${A.baseline_intensity.range_lit_max})</div>
    <div class="mt8"><b>Category shares:</b> Energy ${(A.category_shares.energy_hvac*100).toFixed(0)}%, Procurement ${(A.category_shares.procurement*100).toFixed(0)}%, Pharma ${(A.category_shares.pharma*100).toFixed(0)}%, Gases ${(A.category_shares.medical_gases*100).toFixed(0)}%, Waste ${(A.category_shares.waste*100).toFixed(0)}%, Water/Other ${(A.category_shares.water_other*100).toFixed(0)}%</div>
    <div class="mt8"><b>Grid factor (local):</b> ${gf.toFixed(3)} kg/kWh · <span class="small">ZIP/country derived</span></div>
    <div class="mt8"><b>Lighting coeff:</b> ${A.energy_module.lighting.kwh_per_bed_hour} kWh per bed·hour</div>
    <div class="mt8"><b>CRRT coeff:</b> ${A.crrt.kg_co2e_per_hour} kg CO₂e per hour</div>
    <div class="mt8"><b>GWP100s:</b> N₂O ${A.medical_gases.gwps_100.N2O}, Desflurane ${A.medical_gases.gwps_100.Desflurane}, Sevo ${A.medical_gases.gwps_100.Sevoflurane}, Iso ${A.medical_gases.gwps_100.Isoflurane}</div>
    <hr class="slim" />
    <div class="notice">Edit these in <code>data/assumptions.json</code> and refresh to update globally.</div>
  `;
}

export function exportCSV(){
  const base = state.derived.baseline;
  const per = state.derived.perIntervention;
  const rows = [
    ['Metric','Value'],
    ['Beds', state.inputs.beds],
    ['Occupancy', state.inputs.occupancy],
    ['Patient-days/year', state.derived.patientDays],
    ['Grid (kg/kWh)', state.derived.gridFactor_kg_per_kwh.toFixed(4)],
    ['Baseline annual tons', (base.annual_t).toFixed(2)],
    ['Current annual tons', (state.derived.current.annual_t||base.annual_t).toFixed(2)],
    ['Savings tons', (Math.max(0, base.annual_t-(state.derived.current.annual_t||base.annual_t))).toFixed(2)]
  ];
  rows.push(['----','----']);
  rows.push(['Category','tons/year (baseline)']);
  Object.entries(base.categories_t).forEach(([k,v])=> rows.push([k, v.toFixed(2)]));
  rows.push(['----','----']);
  rows.push(['Intervention','Enabled','Value','Delta_tons_per_year']);
  per.forEach(p=> rows.push([p.title, p.enabled, p.value, p.delta_t.toFixed(2)]));
  const csv = rows.map(r=>r.join(',')).join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'icu_ghg_results.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

export function exportJSON(){
  const out = {
    inputs: state.inputs,
    baselinePractices: state.baselinePractices,
    patientDays: state.derived.patientDays,
    gridFactor_kg_per_kwh: state.derived.gridFactor_kg_per_kwh,
    baseline: state.derived.baseline,
    current: state.derived.current,
    interventions: state.derived.perIntervention
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], {type:'application/json'}));
  a.download = 'icu_ghg_results.json'; a.click();
  URL.revokeObjectURL(a.href);
}

// Wire global events from ui
window.addEventListener('export_csv', exportCSV);
window.addEventListener('export_json', exportJSON);
