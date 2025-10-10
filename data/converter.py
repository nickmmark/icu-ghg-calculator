
#!/usr/bin/env python3
import argparse, json, csv, sys, math, pathlib

# ---------- Helpers ----------
def _to_bool(val):
    if isinstance(val, bool): return val
    s = str(val).strip().lower()
    if s in ('1','true','yes','y','on'): return True
    if s in ('0','false','no','n','off',''): return False
    return False

def _to_num(val):
    if val is None: return None
    s = str(val).strip()
    if s == '' or s.lower() == 'null': return None
    try:
        if '.' in s or 'e' in s.lower(): return float(s)
        return int(s)
    except ValueError:
        return None

def _empty(d):
    return d is None or (isinstance(d, (list, dict)) and len(d) == 0)

def _parse_refs(cell):
    # "Label A|http://a;Label B|http://b"
    refs = []
    if not cell: return refs
    for part in str(cell).split(';'):
        part = part.strip()
        if not part: continue
        if '|' in part:
            label, url = part.split('|', 1)
            refs.append({"label": label.strip(), "url": url.strip()})
        else:
            # If only a URL is given
            refs.append({"label": part.strip(), "url": part.strip()})
    return refs

def _join_refs(refs):
    if not refs: return ''
    return ';'.join([f"{r.get('label','')}|{r.get('url','')}" for r in refs])

PARAM_FIELDS = [
    'kwh_per_hour_per_bed',
    'grid_factor_source',
    'annual_usage_kg',
    'gwp100',  # may be "assumptions.medical_gases.gwps_100.N2O" etc.
    'annual_agent_minutes',
    'agent_consumption_ml_per_min',
    'density_g_per_ml',
    'percent_reduction',
    'category',
    'scale_with_value_pct',
    'kg_per_hour',
    'kg_co2e_per_puff'
]

CSV_FIELDS = [
    # identity & grouping
    'id','group','title','type','impact_category',
    # slider range (only used when type=slider)
    'range_min','range_max','range_step','range_unit',
    # baseline control
    'baseline_label','baseline_type','baseline_default_enabled','baseline_default_value',
    'baseline_min','baseline_max','baseline_step','baseline_unit',
    # calculation
    'calc_method','calc_formula_note',
    # params (generic; fill only those you use)
    'param_kwh_per_hour_per_bed','param_grid_factor_source',
    'param_annual_usage_kg','param_gwp100',
    'param_annual_agent_minutes','param_agent_consumption_ml_per_min','param_density_g_per_ml',
    'param_percent_reduction','param_category','param_scale_with_value_pct',
    'param_kg_per_hour','param_kg_co2e_per_puff',
    # UI
    'ui_icon','ui_summary','ui_details_markdown','ui_references'
]

def json_to_csv(json_path, out_groups_csv, out_interventions_csv):
    data = json.loads(pathlib.Path(json_path).read_text(encoding='utf-8'))
    groups = data.get('groups', [])
    inters = data.get('interventions', [])
    equiv = data.get('equivalency_coeffs', None)

    # Write groups
    with open(out_groups_csv, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['id','label','icon'])
        for g in groups:
            w.writerow([g.get('id',''), g.get('label',''), g.get('icon','')])

    # Write interventions
    with open(out_interventions_csv, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        w.writeheader()
        for it in inters:
            row = {k:'' for k in CSV_FIELDS}
            row['id'] = it.get('id','')
            row['group'] = it.get('group','')
            row['title'] = it.get('title','')
            row['type'] = it.get('type','')
            row['impact_category'] = it.get('impact_category','')

            rng = it.get('range') or {}
            row['range_min']  = rng.get('min','') if it.get('type') == 'slider' else ''
            row['range_max']  = rng.get('max','') if it.get('type') == 'slider' else ''
            row['range_step'] = rng.get('step','') if it.get('type') == 'slider' else ''
            row['range_unit'] = rng.get('unit','') if it.get('type') == 'slider' else ''

            bc = it.get('baseline_control') or {}
            row['baseline_label'] = bc.get('label','')
            row['baseline_type']  = bc.get('type','')
            row['baseline_default_enabled'] = str(_to_bool(bc.get('default_enabled', True)))
            row['baseline_default_value']   = '' if bc.get('type') == 'boolean' else bc.get('default_value','')
            row['baseline_min']    = '' if bc.get('type') == 'boolean' else bc.get('min','')
            row['baseline_max']    = '' if bc.get('type') == 'boolean' else bc.get('max','')
            row['baseline_step']   = '' if bc.get('type') == 'boolean' else bc.get('step','')
            row['baseline_unit']   = '' if bc.get('type') == 'boolean' else bc.get('unit','')

            calc = it.get('calculation') or {}
            row['calc_method'] = calc.get('method','')
            row['calc_formula_note'] = calc.get('formula_note','')
            params = calc.get('params') or {}

            # Resolve params: handle {"source": "..."} or {"source_value": true}
            def pval(key):
                v = params.get(key, '')
                if isinstance(v, dict):
                    if 'source' in v: return v['source']
                    if v.get('source_value'): return 'source_value'
                    return ''
                return v

            row['param_kwh_per_hour_per_bed'] = pval('kwh_per_hour_per_bed')
            row['param_grid_factor_source']   = pval('grid_factor_source')
            row['param_annual_usage_kg']      = pval('annual_usage_kg')
            row['param_gwp100']               = pval('gwp100')
            row['param_annual_agent_minutes'] = pval('annual_agent_minutes')
            row['param_agent_consumption_ml_per_min'] = pval('agent_consumption_ml_per_min')
            row['param_density_g_per_ml']     = pval('density_g_per_ml')
            row['param_percent_reduction']    = pval('percent_reduction')
            row['param_category']             = pval('category')
            row['param_scale_with_value_pct'] = pval('scale_with_value_pct')
            row['param_kg_per_hour']          = pval('kg_per_hour')
            row['param_kg_co2e_per_puff']     = pval('kg_co2e_per_puff')

            ui = it.get('ui') or {}
            row['ui_icon'] = ui.get('icon','')
            row['ui_summary'] = ui.get('summary','')
            row['ui_details_markdown'] = ui.get('details_markdown','')
            row['ui_references'] = _join_refs(ui.get('references', []))

            w.writerow(row)

    if equiv:
        # Also write a small JSON file with the equivalencies alongside the CSVs
        pathlib.Path(out_interventions_csv).with_suffix('.equiv.json').write_text(
            json.dumps(equiv, indent=2), encoding='utf-8'
        )

def csv_to_json(groups_csv, interventions_csv, out_json):
    # Read groups
    groups = []
    with open(groups_csv, newline='', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            groups.append({
                "id": row.get('id','').strip(),
                "label": row.get('label','').strip(),
                "icon": row.get('icon','').strip()
            })

    # Read interventions
    inters = []
    with open(interventions_csv, newline='', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            it = {
                "id": row.get('id','').strip(),
                "group": row.get('group','').strip(),
                "title": row.get('title','').strip(),
                "type": row.get('type','').strip(),
                "impact_category": row.get('impact_category','').strip()
            }

            # Range
            if it["type"] == "slider":
                rng = {}
                rng_min = _to_num(row.get('range_min'))
                rng_max = _to_num(row.get('range_max'))
                rng_step = _to_num(row.get('range_step'))
                rng_unit = row.get('range_unit','').strip()
                if rng_min is not None: rng["min"] = rng_min
                if rng_max is not None: rng["max"] = rng_max
                if rng_step is not None: rng["step"] = rng_step
                if rng_unit: rng["unit"] = rng_unit
                if not _empty(rng): it["range"] = rng

            # Baseline control
            bc = {}
            bc["label"] = row.get('baseline_label','').strip()
            bc["type"]  = row.get('baseline_type','').strip()
            bc["default_enabled"] = _to_bool(row.get('baseline_default_enabled'))
            if bc["type"] != 'boolean':
                v = _to_num(row.get('baseline_default_value'))
                if v is not None: bc["default_value"] = v
                mn = _to_num(row.get('baseline_min'))
                mx = _to_num(row.get('baseline_max'))
                st = _to_num(row.get('baseline_step'))
                un = (row.get('baseline_unit') or '').strip()
                if mn is not None: bc["min"] = mn
                if mx is not None: bc["max"] = mx
                if st is not None: bc["step"] = st
                if un: bc["unit"] = un
            it["baseline_control"] = bc

            # Calculation
            calc = {
                "method": row.get('calc_method','').strip(),
                "formula_note": row.get('calc_formula_note','').strip()
            }
            params = {}

            def add_param(name, csv_key, convert='auto'):
                raw = row.get(csv_key, '')
                if raw is None: return
                raw = str(raw).strip()
                if raw == '': return
                if convert == 'auto':
                    # "source_value" special marker
                    if raw == 'source_value':
                        params[name] = {"source_value": True}
                        return
                    # Detect dotted source (assumptions.*)
                    if '.' in raw and not raw.replace('.','').replace('_','').isdigit():
                        params[name] = {"source": raw}
                        return
                    # else numeric/bool
                    num = _to_num(raw)
                    if num is not None:
                        params[name] = num
                        return
                    if raw.lower() in ('true','false'):
                        params[name] = _to_bool(raw)
                        return
                    # fallback: string
                    params[name] = raw
                elif convert == 'number':
                    num = _to_num(raw)
                    if num is not None:
                        params[name] = num
                elif convert == 'bool':
                    params[name] = _to_bool(raw)
                else:
                    params[name] = raw

            add_param('kwh_per_hour_per_bed', 'param_kwh_per_hour_per_bed')
            add_param('grid_factor_source',   'param_grid_factor_source')
            add_param('annual_usage_kg',      'param_annual_usage_kg')
            add_param('gwp100',               'param_gwp100')
            add_param('annual_agent_minutes', 'param_annual_agent_minutes')
            add_param('agent_consumption_ml_per_min', 'param_agent_consumption_ml_per_min')
            add_param('density_g_per_ml',     'param_density_g_per_ml')
            add_param('percent_reduction',    'param_percent_reduction')
            add_param('category',             'param_category')
            add_param('scale_with_value_pct', 'param_scale_with_value_pct')
            add_param('kg_per_hour',          'param_kg_per_hour')
            add_param('kg_co2e_per_puff',     'param_kg_co2e_per_puff')

            calc["params"] = params
            it["calculation"] = calc

            # UI
            ui = {
                "icon": row.get('ui_icon','').strip(),
                "summary": row.get('ui_summary','').strip(),
                "details_markdown": row.get('ui_details_markdown','').strip(),
                "references": _parse_refs(row.get('ui_references',''))
            }
            it["ui"] = ui

            inters.append(it)

    out = {
        "equivalency_coeffs": {
            "cars_per_tCO2e": 0.45,
            "acres_forest_per_tCO2e": 0.06,
            "tree_seedlings_10yr_per_tCO2e": 7.0
        },
        "groups": groups,
        "interventions": inters
    }

    pathlib.Path(out_json).write_text(json.dumps(out, indent=2), encoding='utf-8')

def main():
    ap = argparse.ArgumentParser(description="Convert ICU interventions JSON ↔ CSV.")
    sub = ap.add_subparsers(dest='cmd', required=True)

    j2c = sub.add_parser('json-to-csv', help='Convert interventions.json to groups.csv + interventions.csv')
    j2c.add_argument('--json', required=True, help='Path to interventions.json')
    j2c.add_argument('--groups-out', default='groups.csv', help='Output groups CSV path')
    j2c.add_argument('--interventions-out', default='interventions.csv', help='Output interventions CSV path')

    c2j = sub.add_parser('csv-to-json', help='Convert groups.csv + interventions.csv to interventions.json')
    c2j.add_argument('--groups', required=True, help='Path to groups.csv')
    c2j.add_argument('--interventions', required=True, help='Path to interventions.csv')
    c2j.add_argument('--json-out', default='interventions.json', help='Output interventions.json path')

    args = ap.parse_args()

    if args.cmd == 'json-to-csv':
        json_to_csv(args.json, args.groups_out, args.interventions_out)
    elif args.cmd == 'csv-to-json':
        csv_to_json(args.groups, args.interventions, args.json_out)
    else:
        ap.print_help()

if __name__ == '__main__':
    main()
