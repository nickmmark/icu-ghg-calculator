import { PATHS } from './config.js';
import { parseCSV } from './utils.js';
import { state } from './state.js';

function normalizeInterventionsJson(json){
  const out = { groups: [], interventions: [], equivalency_coeffs: json.equivalency_coeffs || {
    cars_per_tCO2e: 0,
    acres_forest_per_tCO2e: 0,
    tree_seedlings_10yr_per_tCO2e: 0
  }};
  const groups = Array.isArray(json.groups)? json.groups : [];
  const grpById = new Map(groups.map(g=>[g.id, g]));
  out.groups = groups;

  const list = Array.isArray(json.interventions)? json.interventions : [];
  const valid = [];
  for(const it of list){
    if(!it || !it.id || !it.title || !it.type){ console.error('Invalid intervention skipped:', it); continue; }
    const safe = JSON.parse(JSON.stringify(it));
    if(safe.type==='binary'){ safe.default_enabled = false; }
    if(safe.type==='slider'){ safe.default_value = 0; if(!safe.range) safe.range={min:0,max:100,step:1,unit:''}; }
    if(!safe.group || !grpById.has(safe.group)){
      if(!grpById.has('other')){
        const other = { id:'other', label:'Other', icon:'📦' };
        out.groups.push(other);
        grpById.set('other', other);
      }
      safe.group = 'other';
    }
    valid.push(safe);
  }
  out.interventions = valid;
  if(out.groups.length===0){
    out.groups = [{id:'other', label:'Other', icon:'📦'}];
  }
  return out;
}

export async function loadAllData(){
  const [ass, inter, zipCSV, subCSV] = await Promise.all([
    fetch(PATHS.assumptions).then(r=>r.json()),
    fetch(PATHS.interventions).then(r=>r.json()),
    fetch(PATHS.zip).then(r=>r.text()),
    fetch(PATHS.subregion).then(r=>r.text())
  ]);

  state.assumptions = ass;
  state.interventions = normalizeInterventionsJson(inter);
  state.zipTable = parseCSV(zipCSV);
  state.subregionTable = parseCSV(subCSV);

  return true;
}
