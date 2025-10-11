import { loadAllData } from './data.js';
import { initUI } from './ui.js';
import { recalcBaseline } from './baseline.js';
import { renderInterventions, applyInterventions, applyInterventionEnableStates } from './interventions.js';
import { drawCompare } from './charts.js'; // ✅ added import

(async function boot(){
  try{
    await loadAllData();
    initUI();
    recalcBaseline();
    drawCompare(); // ✅ added — ensures chart renders immediately on load
    renderInterventions();
    applyInterventions();
    applyInterventionEnableStates();
  }catch(err){
    console.error(err);
    alert('Failed to load one or more data files. Make sure JSON and CSV files are in /data and served over HTTP.');
    const notice = document.getElementById('interventionsNotice');
    if(notice){ notice.style.display='block'; notice.textContent='Data failed to load; see console for details.'; }
  }
})();
