export const state = {
  assumptions:null,
  interventions:null,
  zipTable:null,
  subregionTable:null,
  inputs:{
    beds:20, occupancy:0.85, zip:'', country:'USA',
    icuType:'Med/Surg', climateMult:1.0
  },
  baselinePractices:{},
  derived:{
    patientDays:0,
    gridFactor_kg_per_kwh:0.3755,
    baseline: { intensity_pd: 0, annual_t: 0, categories_t: {} },
    current: { annual_t: 0, categories_t: {} },
    perIntervention: []
  }
};
