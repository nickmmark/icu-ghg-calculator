export const fmt = {
  tons: n => (isFinite(n)? `${n.toLocaleString(undefined,{maximumFractionDigits:1})} tons/year` : '—'),
  tnum: n => (isFinite(n)? n.toLocaleString(undefined,{maximumFractionDigits:1}) : '—'),
  pct: n => (isFinite(n)? n.toLocaleString(undefined,{maximumFractionDigits:1})+'%' : '—')
};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const zfill = s => (s||'').toString().padStart(5,'0');

export function parseCSV(text){
  const rows = [];
  const lines = text.replace(/\r/g,'').split('\n');
  const header = lines.shift().split(',').map(s=>s.trim());
  for(const line of lines){
    if(!line.trim()) continue;
    const cells=[]; let cur='', q=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c === '"'){ q = !q; continue; }
      if(c === ',' && !q){ cells.push(cur); cur=''; continue; }
      cur += c;
    }
    cells.push(cur);
    const obj={};
    header.forEach((h,i)=>obj[h]= (cells[i]??'').trim());
    rows.push(obj);
  }
  return rows;
}

export function svgEl(tag, attrs={}, children=[]){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
  children.forEach(ch=>el.appendChild(ch));
  return el;
}

export function showTip(text, x, y){
  const t = document.getElementById('tooltip');
  if(!t) return;
  t.textContent = text;
  t.style.display = 'block';
  const pad = 12;
  t.style.left = (x+pad) + 'px';
  t.style.top =  (y+pad) + 'px';
}
export function hideTip(){ const t = document.getElementById('tooltip'); if(t) t.style.display='none'; }
