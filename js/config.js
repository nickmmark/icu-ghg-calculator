export const PATHS = {
  assumptions: 'data/assumptions.json',
  interventions: 'data/interventions.json',
  zip: 'data/zip_CO2_annotated.csv',
  subregion: 'data/subregion_emissions_annotated.csv'
};

export const CATEGORY_ORDER = [
  ['energy_hvac','var(--energy)','Energy/HVAC'],
  ['procurement','var(--procure)','Procurement'],
  ['pharma','var(--pharma)','Pharma'],
  ['medical_gases','var(--gases)','Gases'],
  ['waste','var(--waste)','Waste'],
  ['water_other','var(--water)','Water/Other'],
  ['lighting','var(--lighting)','Lighting'],
  ['crrt','var(--crrt)','CRRT']
];
