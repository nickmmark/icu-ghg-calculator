import { state } from './state.js';
import { fmt } from './utils.js';
import { recalcBaseline } from './baseline.js';
import { updateTopBar } from './ui.js';
import { drawCompare } from './charts.js';
import { updateURLState } from './router.js';

/* --------------------------
   Baseline Practices builder
--------------------------- */
export function renderBaselinePractices(resetOnly=false){
  const container = document.getElementById('baselinePractices');
  if(!container) return;
  if(!resetOnly){ container.innerHTML = ''; state.baselinePractices = {}; }

  const groups = state.interventions.groups || [];
  const byGroup = {};
  (state.interventions.interventions||[]).forEach(it=>{
    if(it.baseline_control){
      const g = it.group || 'other';
      (byGroup[g] ||= []).push(it);
    }
  });

  let any = false;
  groups.forEach(g=>{
    const list = byGroup[g.id] || [];
    if(!list.length) return;
    any = true;

    // Group box
    const box = document.createElement('div');
    box.className = 'group-box';
    const title = document.createElement('div');
    title.className = 'group-title';
    const caret = document.createElement('span'); caret.className='caret open'; caret.textContent='▼';
    const label = document.createElement('span'); label.textContent = `${g.icon||'📦'}  ${g.label}`;
    title.append(caret, label);
    const content = document.createElement('div'); content.className='group-content';

    title.addEventListener('click', ()=>{
      const isOpen = caret.classList.toggle('open');
      box.classList.toggle('collapsed', !isOpen);
    });

    box.appendChild(title);
    box.appendChild(content);
    container.appendChild(box);

    list.forEach(it=>{
      const bc = it.baseline_control;
      const row = document.createElement('div'); row.className='row mt8';
      const left = document.createElement('div');
      const right = document.createElement('div');

      const chkId = `bp-${it.id}-chk`;
      const valId = `bp-${it.id}-val`;

      const lbl = document.createElement('label');
      lbl.innerHTML = `${it.ui?.icon||'✨'} ${bc.label || it.title}`;
      const chk = document.createElement('input'); chk.type='checkbox'; chk.id=chkId;

      chk.checked = !!bc.default_enabled;
      left.appendChild(lbl);
      left.appendChild(chk);

      if(it.type==='slider' || bc.type==='number'){
        const wrap = document.createElement('div'); wrap.className='flex'; wrap.style.gap='8px'; wrap.style.alignItems='center';
        const input = document.createElement('input'); input.type='number'; input.id=valId;
        input.step = bc.step ?? it.range?.step ?? 1;
        input.min  = bc.min  ?? it.range?.min  ?? 0;
        input.max  = bc.max  ?? it.range?.max  ?? 9999;
        input.value= bc.default_value ?? it.default_value ?? 0;
        input.disabled = !chk.checked;
        const unit = document.createElement('span'); unit.className='i'; unit.textContent = bc.unit || (it.range?.unit || '');

        wrap.appendChild(input); wrap.appendChild(unit);
        right.appendChild(wrap);

        input.addEventListener('input', ()=>{
          state.baselinePractices[it.id] = { enabled: chk.checked, value: +input.value };
          recalcBaseline(); applyInterventions(); applyInterventionEnableStates(); updateURLState();
        });
      } else {
        state.baselinePractices[it.id] = { enabled: chk.checked, value: 0 };
      }

      chk.addEventListener('change', ()=>{
        const inp = document.getElementById(valId);
        if(inp) inp.disabled = !chk.checked;
        if(!inp) state.baselinePractices[it.id] = { enabled: chk.checked, value: 0 };
        else state.baselinePractices[it.id] = { enabled: chk.checked, value: +inp.value };
        recalcBaseline(); applyInterventions(); applyInterventionEnableStates(); updateURLState();
      });

      const initVal = document.getElementById(valId)?.value ?? 0;
      state.baselinePractices[it.id] = { enabled: chk.checked, value: +initVal };

      row.appendChild(left); row.appendChild(right);
      content.appendChild(row);
    });
  });

  if(!any){
    const none = document.createElement('div');
    none.className='small';
    none.textContent = 'No baseline practice controls found in the interventions list.';
    container.appendChild(none);
  }
}

/* --------------------------
   Interventions UI (grouped, collapsible, with caret)
--------------------------- */
export function renderInterventions(){
  const box = document.getElementById('interventionsList');
  const notice = document.getElementById('interventionsNotice');
  if(!box) return;
  box.innerHTML = '';
  if(notice){ notice.style.display='none'; notice.textContent=''; }

  const groups = state.interventions.groups || [];
  const byGroup = {};
  let skipped = 0;

  (state.interventions.interventions||[]).forEach(it=>{
    if(!it.id || !it.title || !it.type){ skipped++; return; }
    const g = it.group || 'other';
    (byGroup[g] ||= []).push(it);
  });

  if(skipped>0 && notice){
    notice.style.display='block';
    notice.textContent = `Some interventions were skipped due to invalid fields. Check console for details. Skipped: ${skipped}`;
  }

  let renderedAny=false;
  groups.forEach(g=>{
    const list = byGroup[g.id] || [];
    if(!list.length) return;
    renderedAny = true;

    // Collapsible category box
    const gbox = document.createElement('div');
    gbox.className = 'group-box';
    const gtitle = document.createElement('div'); gtitle.className='group-title';
    const caret = document.createElement('span'); caret.className='caret open'; caret.textContent='▼';
    const glabel = document.createElement('span'); glabel.textContent = `${g.icon||'📦'}  ${g.label}`;
    gtitle.append(caret, glabel);
    const gcontent = document.createElement('div'); gcontent.className='group-content';

    gtitle.addEventListener('click', ()=>{
      const isOpen = caret.classList.toggle('open');
      gbox.classList.toggle('collapsed', !isOpen);
    });

    gbox.appendChild(gtitle);
    gbox.appendChild(gcontent);
    box.appendChild(gbox);

    list.forEach((it)=>{
      const id = `int-${it.id}`;

      const acc = document.createElement('div'); acc.className='acc-item';
      const head = document.createElement('div'); head.className='acc-head';

      const title = document.createElement('div'); title.className='acc-title';
      // ▼ affordance before icon+text
      const caret = document.createElement('span'); caret.className='caret'; caret.textContent='▼';
      const icon = document.createElement('span'); icon.textContent = (it.ui?.icon || '✨');
      const tt = document.createElement('span'); tt.textContent = it.title;
      title.append(caret, icon, tt);

      const chip = document.createElement('div'); chip.className='chip green'; chip.id = `${id}-chip`; chip.textContent = 'Δ 0.0 tons/year';
      head.append(title, chip);

      const content = document.createElement('div'); content.className='accordion'; content.style.display='none';
      const inner = document.createElement('div');
      inner.innerHTML = `
        <div class="small">${it.ui?.summary || ''}</div>
        <div class="mt8 small">${(it.ui?.details_markdown||'').replace(/\n/g,'<br>')}</div>
        <div class="mt8 small"><b>Formula:</b> ${it.calculation?.formula_note||''}</div>
        <div class="mt8 small"><b>References:</b> ${(it.ui?.references||[]).map(r=>`<a href="${r.url}" target="_blank">${r.label}</a>`).join(' · ')}</div>
      `;
      content.appendChild(inner);

      // Control (start all OFF/zero)
      let controlWrap = document.createElement('div');
      controlWrap.style.minWidth = '220px';
      let control;
      if(it.type==='binary'){
        control = document.createElement('input'); control.type='checkbox';
        control.id = `${id}-chk`;
        control.checked = false;
        control.addEventListener('input', ()=>{ applyInterventions(); });
        controlWrap.appendChild(control);
      }else if(it.type==='slider'){
        control = document.createElement('div');
        control.innerHTML = `
          <input type="range" min="${it.range.min}" max="${it.range.max}" step="${it.range.step}" value="0" id="${id}-range" />
          <div class="small">Value: <span id="${id}-val">0</span> ${it.range.unit||''}</div>
        `;
        const slider = control.querySelector('input');
        slider.addEventListener('input', (e)=>{
          control.querySelector(`#${id}-val`).textContent = e.target.value;
          applyInterventions();
        });
        controlWrap.appendChild(control);
      }

      const headWrap = document.createElement('div'); headWrap.className='flex space'; headWrap.append(head, controlWrap);
      acc.appendChild(headWrap);
      acc.appendChild(content);

      // expand/collapse affordance
      head.addEventListener('click', (e)=>{
        // avoid toggling when clicking the control itself
        if(e.target.tagName === 'INPUT' || e.target.closest('input')) return;
        const isHidden = (content.style.display==='none');
        content.style.display = isHidden ? 'block' : 'none';
        caret.classList.toggle('open', isHidden);
      });

      gcontent.appendChild(acc);
    });
  });

  if(!renderedAny){
    const empty = document.createElement('div');
    empty.className='small';
    empty.textContent = 'No interventions found. Ensure data/interventions.json is present.';
    box.appendChild(empty);
  }

  // initial enable/disable states
  applyInterventionEnableStates();
}

function findInterventionControl(it){
  const id = `int-${it.id}`;
  if(it.type==='binary'){
    return document.getElementById(`${id}-chk`);
  }else if(it.type==='slider'){
    return document.getElementById(`${id}-range`);
  }
  return null;
}

/* --------------------------
   Grey-out/disable by baseline practice
--------------------------- */
export function applyInterventionEnableStates(){
  (state.interventions.interventions||[]).forEach(it=>{
    // If there is a matching baseline control AND it's unchecked → disable intervention
    const bp = state.baselinePractices[it.id];
    const shouldDisable = (bp && bp.enabled===false);
    const container = document.getElementById(`int-${it.id}-chk`)?.closest('.acc-item')
                  || document.getElementById(`int-${it.id}-range`)?.closest('.acc-item');
    if(container){
      container.classList.toggle('disabled', !!shouldDisable);
      const input = findInterventionControl(it);
      if(input){
        if(shouldDisable){
          if(input.type==='checkbox') input.checked=false;
          if(input.type==='range') input.value=0;
        }
        input.disabled = !!shouldDisable;
      }
    }
  });
}

/* --------------------------
   Apply Interventions
--------------------------- */
export function applyInterventions(){
  const A = state.assumptions;
  const base = state.derived.baseline;
  const PD = state.derived.patientDays;
  const grid = state.derived.gridFactor_kg_per_kwh;

  let savings_t = 0;
  const per = [];
  const catSave = { energy_hvac:0, procurement:0, pharma:0, medical_gases:0, waste:0, water_other:0, lighting:0, crrt:0 };

  for(const it of (state.interventions.interventions||[])){
    // Skip if baseline marked not in use (disabled)
    const bp = state.baselinePractices[it.id];
    if(bp && bp.enabled===false){ continue; }

    const ctrl = findInterventionControl(it);
    let val = 0, enabled=false;

    if(it.type==='binary'){
      enabled = !!(ctrl && ctrl.checked);
      val = enabled ? 1 : 0;
    }
    else if(it.type==='slider'){
      if(ctrl){ val = +ctrl.value; enabled = (val !== 0); }
      else { val = 0; enabled = false; }
    }

    let delta_t = 0;
    if(enabled){
      const m = it.calculation?.method;
      const p = it.calculation?.params || {};
      if(m==='direct_savings'){
        if(p.annual_usage_kg){
          const usage = resolveSource(p.annual_usage_kg, 0);
          const gwp = resolveSource(p.gwp100, 273);
          const leakage = p.leakage_factor ?? 1;
          delta_t = (usage * gwp * leakage)/1000;
        }else if(p.annual_agent_minutes){
          const minutes = resolveSource(p.annual_agent_minutes, 0);
          const mlmin = p.agent_consumption_ml_per_min ?? 0.2;
          const density = p.density_g_per_ml ?? 1.0;
          const gwp = resolveSource(p.gwp100, 130);
          const kg = (minutes * mlmin * density)/1000;
          delta_t = (kg * gwp)/1000;
        }
      }else if(m==='kwh_reduction'){
        const kwhPerHrBed = resolveSource(p.kwh_per_hour_per_bed, 0.02);
        const hours = val;
        const beds = state.inputs.beds;
        const kwh = hours * beds * 365 * kwhPerHrBed;
        const gf = (p.grid_factor_source==='baseline.location.grid_factor_kg_per_kwh')? grid : A.energy_module.reference_grid_factor_kg_per_kwh;
        delta_t = (kwh * gf)/1000;

      // =========================
      // FIX: percent_of_category
      // =========================
      }else if(m==='percent_of_category'){
        // Pull the base category tons
        const cat = p.category || 'energy_hvac';
        const base_t = base.categories_t[cat] || 0;

        // 1) Resolve the nominal percent
        let nominal = 0;
        if (typeof p.percent_reduction === 'object' && p.percent_reduction && p.percent_reduction.source_value) {
          // slider gives percent directly (0–100)
          nominal = +val;
        } else {
          // constant, e.g. 5 (%)
          nominal = resolveSource(p.percent_reduction, 0);
        }

        // 2) If scale_with_value_pct, scale by slider *as a fraction* of the base percent
        //    e.g. base=5%, slider=60 -> 60% * 5% = 3% (NOT 300%)
        if (p.scale_with_value_pct === true) {
          nominal = (+val) * (nominal / 100);
        }

        // 3) Clamp and apply once as a percent
        const percent = Math.max(0, Math.min(100, isFinite(nominal) ? nominal : 0));
        delta_t = base_t * (percent / 100);

      }else if(m==='intensity_per_hour'){
        const kgph = resolveSource(p.kg_per_hour, 2.0);
        delta_t = (val * kgph * PD)/1000;
      }else if(m==='per_patient_day_delta'){
        const kg_per = p.kg_co2e_per_puff ?? 0;
        delta_t = (val * kg_per * PD)/1000;
      }
    }
    per.push({ id: it.id, title: it.title, enabled, value: val, delta_t });
    savings_t += delta_t;

    // Update chip deterministically
    const chip = document.getElementById(`int-${it.id}-chip`);
    if(chip){
      chip.textContent = `Δ ${fmt.tnum(delta_t)} tons/year`;
      chip.className = 'chip ' + (delta_t>0? 'green':'red');
    }

    // Attribute savings to category for post-chart
    const cat = it.impact_category || null;
    if(cat && catSave.hasOwnProperty(cat)) catSave[cat] += delta_t;
  }

  state.derived.perIntervention = per;
  const current = Math.max(0, base.annual_t - savings_t);
  state.derived.current.annual_t = current;

  // Post categories = baseline categories minus savings by category
  const postCats = {};
  Object.entries(base.categories_t).forEach(([k,v])=> postCats[k] = Math.max(0, v - (catSave[k]||0)));
  state.derived.current.categories_t = postCats;

  updateTopBar();
  drawCompare();
}

function resolveSource(ref, fallback){
  if(ref==null) return fallback;
  if(typeof ref === 'number') return ref;
  if(typeof ref === 'object' && ref.source){
    if(ref.source === 'assumptions.medical_gases.gwps_100.N2O') return state.assumptions.medical_gases.gwps_100.N2O;
    if(ref.source === 'assumptions.medical_gases.gwps_100.Desflurane') return state.assumptions.medical_gases.gwps_100.Desflurane;
    if(ref.source === 'assumptions.energy_module.lighting.kwh_per_bed_hour') return state.assumptions.energy_module.lighting.kwh_per_bed_hour;
  }
  return fallback;
}

