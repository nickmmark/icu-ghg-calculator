import { state } from './state.js';

export function updateURLState(){
  const p = new URLSearchParams();
  const i = state.inputs;
  p.set('beds', i.beds); p.set('occ', Math.round(i.occupancy*100));
  if(i.zip) p.set('zip', i.zip);
  p.set('country', i.country); p.set('clim', i.climateMult);
  history.replaceState(null,'','?'+p.toString());
}

export function applyURLState(){
  const p = new URLSearchParams(location.search);
  if(p.has('beds')) document.getElementById('beds').value = (+p.get('beds')||20);
  if(p.has('occ')) document.getElementById('occupancy').value = (+p.get('occ')||85);
  if(p.has('zip')) document.getElementById('zip').value = p.get('zip');
  if(p.has('country')) document.getElementById('country').value = p.get('country');
  if(p.has('clim')) document.getElementById('climateMult').value = (+p.get('clim')||1);

  state.inputs.beds = +document.getElementById('beds').value;
  state.inputs.occupancy = +document.getElementById('occupancy').value/100;
  state.inputs.zip = document.getElementById('zip').value;
  state.inputs.country = document.getElementById('country').value;
  state.inputs.climateMult = +document.getElementById('climateMult').value;
}
