import { svgEl, showTip, hideTip, fmt } from './utils.js';
import { state } from './state.js';
import { CATEGORY_ORDER } from './config.js';

export function drawStack(containerId, categories_t, titleText){
  const box = document.getElementById(containerId);
  if(!box || box.clientWidth < 20 || box.clientHeight < 20) return; // guard
  box.innerHTML = '';
  const w = box.clientWidth-12, h = box.clientHeight-12, pad=36;
  const svg = svgEl('svg',{viewBox:`0 0 ${w} ${h}`});
  const cats = categories_t;
  const order = CATEGORY_ORDER.filter(([k])=> (cats[k]||0)>0.0001);
  const total = order.reduce((a,[k])=>a+(cats[k]||0),0);
  const barW = Math.min(90, Math.max(60, w*0.12));
  const x = w/2 - barW/2;
  let y = h - pad;
  order.forEach(([k,color,label])=>{
    const t = cats[k]||0;
    const hh = (total>0? (t/total)*(h-2*pad):0);
    const rect = svgEl('rect',{x, y:y-hh, width:barW, height:hh, rx:7, fill:`${color}`, stroke:'#cfe8f7', 'stroke-width':1});
    rect.addEventListener('mousemove', (ev)=> showTip(`${label}: ${fmt.tnum(t)} tons/year`, ev.clientX, ev.clientY));
    rect.addEventListener('mouseleave', hideTip);
    svg.appendChild(rect);
    y -= hh;
  });
  const txt = svgEl('text',{x:w/2, y: h-8, 'text-anchor':'middle', fill:'#33556f','font-size':'12','font-weight':'700'});
  txt.textContent = titleText || `Total ${fmt.tnum(total)} tons CO2/year`;
  svg.appendChild(txt);
  box.appendChild(svg);
}

/* Compare chart that SHRINKS with savings.
   We scale BOTH bars to the SAME baseline total and add an invisible
   'CO2 reduction' segment above the post-intervention bar so the
   visible stack is shorter as savings increase.
*/
export function drawCompare(){
  const box = document.getElementById('chartCompare');
  if(!box || box.clientWidth < 20 || box.clientHeight < 20) return; // guard
  box.innerHTML = '';
  const w = box.clientWidth-12, h = box.clientHeight-12, pad=24;
  const svg = svgEl('svg',{viewBox:`0 0 ${w} ${h}`});
  const baseCats = state.derived.baseline.categories_t;
  const postCats = state.derived.current.categories_t;

  const order = CATEGORY_ORDER;
  const totalBase = order.reduce((a,[k])=>a+(baseCats[k]||0),0);
  const totalPost = order.reduce((a,[k])=>a+(postCats[k]||0),0);

  // Use baseline total for scaling both stacks
  const scaleTotal = Math.max(totalBase, 0.0001);

  const barW = Math.min(100, Math.max(70, w*0.18));
  const gap = 70;
  const x1 = w/2 - barW - gap/2;
  const x2 = w/2 + gap/2;

  function drawStackAt(x, cats, total, labelText, withInvisibleReduction=false){
    let y = h - pad;
    // visible categories proportional to BASELINE total
    order.forEach(([k,color,label])=>{
      const t = cats[k]||0;
      const hh = (scaleTotal>0? (t/scaleTotal)*(h-2*pad):0);
      const rect = svgEl('rect',{x, y:y-hh, width:barW, height:hh, rx:7, fill:`${color}`, stroke:'#cfe8f7','stroke-width':1});
      rect.addEventListener('mousemove', (ev)=> showTip(`${label}: ${fmt.tnum(t)} tons/year`, ev.clientX, ev.clientY));
      rect.addEventListener('mouseleave', hideTip);
      svg.appendChild(rect);
      y -= hh;
    });
    // add invisible "CO2 reduction" block to fill up to baseline height (no tooltip)
    if(withInvisibleReduction){
      const reduction = Math.max(0, scaleTotal - total);
      const hhR = (reduction/scaleTotal)*(h-2*pad);
      const rectR = svgEl('rect',{x, y:y-hhR, width:barW, height:hhR, rx:7, fill:'transparent', 'pointer-events':'none'});
      svg.appendChild(rectR);
      y -= hhR;
    }
    const label = svgEl('text',{x: x+barW/2, y: h-6, 'text-anchor':'middle', fill:'#33556f', 'font-size':'12', 'font-weight':'700'});
    label.textContent = labelText;
    svg.appendChild(label);
  }

  drawStackAt(x1, baseCats, totalBase, `Baseline ${fmt.tnum(totalBase)} tons CO2/year`, false);
  drawStackAt(x2, postCats, totalPost, `Post interventions ${fmt.tnum(totalPost)} tons CO2/year`, true);

  box.appendChild(svg);
}
