import { state } from './state.js';
import { fmt, clamp } from './utils.js';
import { renderAssumptionsHTML } from './exports.js';
import { recalcBaseline } from './baseline.js';
import { renderBaselinePractices, renderInterventions, applyInterventionEnableStates, applyInterventions } from './interventions.js';
import { updateURLState, applyURLState } from './router.js';

export function initUI(){
  // Country select
  const countrySel = document.getElementById('country');
  countrySel.innerHTML='';
  Object.entries(state.assumptions.country_grid_defaults_kg_per_kwh).forEach(([k,_])=>{
    const o=document.createElement('option'); o.value=k; o.textContent=k; countrySel.appendChild(o);
  });
  countrySel.value = state.inputs.country;

  // ICU type select
  const icuSel = document.getElementById('icuType');
  icuSel.innerHTML='';
  state.assumptions.ui_defaults.icu_types.forEach(k=>{
    const o=document.createElement('option'); o.value=k; o.textContent=k; icuSel.appendChild(o);
  });
  icuSel.value = state.inputs.icuType;

  // Inputs
  const map = { beds:'beds', occupancy:'occupancy', zip:'zip', country:'country', icuType:'icuType', climateMult:'climateMult' };
  Object.entries(map).forEach(([id,key])=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>{
      if(key==='occupancy') state.inputs[key]= clamp(+el.value/100,0.1,1);
      else if(key==='climateMult' || key==='beds') state.inputs[key] = +el.value;
      else state.inputs[key] = el.value;
      recalcBaseline(); applyInterventions(); updateURLState();
    });
  });

  // Build Baseline practices from Interventions JSON
  renderBaselinePractices();

  // Tabs
  document.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tabbtn').forEach(b=>b.setAttribute('aria-selected', b===btn ? 'true':'false'));
      const show = btn.dataset.tab;
      document.getElementById('tab-baseline').style.display = (show==='baseline')?'grid':'none';
      document.getElementById('tab-interventions').style.display = (show==='interventions')?'grid':'none';
      // keep enable/disable states in sync whenever switching
      applyInterventionEnableStates();
    });
  });

  // Header tools
  document.getElementById('btnReset').addEventListener('click', ()=>{
    state.inputs = { beds:20, occupancy:0.85, zip:'', country:'USA', icuType:'Med/Surg', climateMult:1.0 };
    document.getElementById('beds').value=20;
    document.getElementById('occupancy').value=85;
    document.getElementById('zip').value='';
    document.getElementById('country').value='USA';
    document.getElementById('icuType').value='Med/Surg';
    document.getElementById('climateMult').value='1.00';
    // Reset baseline practices and interventions UI
    renderBaselinePractices(true);
    renderInterventions();
    recalcBaseline(); applyInterventions(); updateURLState();
  });

  document.getElementById('btnShare').addEventListener('click', ()=>{
    const url = location.href;
    navigator.clipboard.writeText(url).then(()=>{ alert('Shareable link copied to clipboard.'); });
  });
  document.getElementById('btnExport').addEventListener('click', ()=>{
    const ev=new Event('export_csv'); window.dispatchEvent(ev);
  });
  document.getElementById('btnExportJSON').addEventListener('click', ()=>{
    const ev=new Event('export_json'); window.dispatchEvent(ev);
  });
  document.getElementById('btnAssumptions').addEventListener('click', ()=>{
    document.getElementById('assumptionsView').innerHTML = renderAssumptionsHTML();
    document.getElementById('drawer').classList.add('open');
  });
  document.getElementById('btnCloseDrawer').addEventListener('click', ()=>{
    document.getElementById('drawer').classList.remove('open');
  });

  // Apply URL state once UI exists
  applyURLState();
}

export function updateTopBar(){
  const base = state.derived.baseline.annual_t;
  const curr = state.derived.current.annual_t ?? base;
  const sav = Math.max(0, base - curr);

  document.getElementById('baselineAnnual').textContent = fmt.tons(base);
  document.getElementById('currentAnnual').textContent = fmt.tons(curr);

  document.getElementById('currentDelta').textContent = (base>0)
    ? `${fmt.pct(100 - (curr/base*100))} below baseline` : '—';
  document.getElementById('progressFill').style.width = (base>0)
    ? `${Math.max(0, Math.min(100, (sav/base)*100))}%` : '0%';

  document.getElementById('savingsAnnual').textContent = fmt.tons(sav);

  const eq = state.interventions.equivalency_coeffs || {};
  const cars = sav * (eq.cars_per_tCO2e||0);
  const acres = sav * (eq.acres_forest_per_tCO2e||0);
  const seedlings = sav * (eq.tree_seedlings_10yr_per_tCO2e||0);

  document.getElementById('savingsEquiv').textContent =
    `Equivalent to taking ${fmt.tnum(cars)} cars off the road
or Saving ${fmt.tnum(acres)} acres from deforestation
or planting ${fmt.tnum(seedlings)} seedlings`;
}
