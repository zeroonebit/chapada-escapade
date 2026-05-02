#!/usr/bin/env python3
"""
bake_indexes.py — Gera arquivos JSON estaticos pra GitHub Pages servir.

Permite que PixaPro (deployed em Pages) leia maps + asset audit do projeto
sem precisar de project_server.py rodando local.

Outputs:
  data/maps/_index.json     -> lista de map presets (consumido por tab-map)
  data/_assets_index.json   -> classificacao completa dos PNGs (consumido por tab-naming)

Uso:
  python tools/bake_indexes.py

Idealmente roda como pre-commit hook ou GitHub Action ao push pra main.
"""
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ── 1. data/maps/_index.json ──────────────────────────────────────
def bake_maps_index():
    maps_dir = ROOT / "data" / "maps"
    if not maps_dir.exists():
        print(f"[maps] no {maps_dir} -- skip")
        return
    items = []
    for f in sorted(maps_dir.glob("*.json")):
        if f.name.startswith("_"):
            continue
        try:
            m = json.loads(f.read_text(encoding="utf-8"))
            items.append({
                "name": m.get("name") or f.stem,
                "bias": m.get("bias", "ca-3"),
                "seed": m.get("seed", 42),
                "tileStyle": m.get("tileStyle", ""),
                "_saved_at": m.get("_saved_at", ""),
            })
        except Exception as e:
            print(f"[maps] error parsing {f}: {e}")
    out = {
        "project": "chapada-escapade",
        "maps": items,
        "_baked_at": datetime.now().isoformat(),
    }
    idx = maps_dir / "_index.json"
    idx.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[maps] baked {len(items)} maps -> {idx.relative_to(ROOT)}")

# ── 2. data/_assets_index.json ────────────────────────────────────
# Reusa a logica de _classify_asset do project_server.py
def classify_asset(rel_path: str):
    p = rel_path.replace("\\", "/")
    m = re.match(r"^assets/(?:pixel_labs/)?chars/([^/]+)/([NSEW]|north|south|east|west|north-east|north-west|south-east|south-west|NE|NW|SE|SW)\.png$", p, re.IGNORECASE)
    if m:
        return ("char_static", {"char": m.group(1), "dir": m.group(2).upper()}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?chars/([^/]+)/anims/([^/]+)/([NSEW]+)/frame_(\d+)\.png$", p, re.IGNORECASE)
    if m:
        return ("char_anim_frame", {"char": m.group(1), "anim": m.group(2), "dir": m.group(3).upper(), "frame": int(m.group(4))}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?chars/nature/([^/]+)/([^/]+)\.png$", p)
    if m:
        sub, name = m.group(1), m.group(2)
        return (f"env_{sub}", {"category": sub, "name": name}, 0.85, f"assets/env/{sub}/{name}.png")
    m = re.match(r"^assets/(?:pixel_labs/)?items/([^/]+)\.png$", p)
    if m:
        return ("item", {"name": m.group(1)}, 0.95, None)
    m = re.match(r"^assets/(?:pixel_labs/)?items/([^/]+)/([^/]+)\.png$", p)
    if m:
        return ("item", {"category": m.group(1), "name": m.group(2)}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?hud/([^/]+)\.png$", p)
    if m:
        return ("hud", {"name": m.group(1)}, 1.0, None)
    m = re.match(r"^assets/terrain/([^/]+)/wang_(\d+)\.png$", p)
    if m:
        return ("wang_tile", {"style": m.group(1), "bits": int(m.group(2))}, 1.0, None)
    m = re.match(r"^assets/terrain/([^/]+)/_(tileset|montage)\.png$", p)
    if m:
        return ("wang_meta", {"style": m.group(1), "kind": m.group(2)}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?fx/([^/]+)\.png$", p)
    if m:
        return ("fx", {"name": m.group(1)}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?ui/([^/]+)\.png$", p)
    if m:
        return ("ui", {"name": m.group(1)}, 1.0, None)
    m = re.match(r"^assets/(?:pixel_labs/)?(splash|favicon|icon)([^/]*)\.png$", p)
    if m:
        return ("ui", {"name": m.group(1) + m.group(2)}, 0.9, None)
    m = re.match(r"^assets/pixel_labs/([^/]+)\.png$", p)
    if m:
        name = m.group(1)
        if re.search(r"(beam|halo|glow|spark)", name):
            return ("fx", {"name": name}, 0.7, f"assets/fx/{name}.png")
        return ("unclassified", {"name": name}, 0.3, None)
    return ("unclassified", {}, 0.0, None)

# In-game scan: detecta refs literais + templates extraidos dos js
# Resultado: pra cada asset path, retorna se ta wired in-game.
def scan_in_game_refs():
    """Returns: {asset_path: True/False} (True = referenciado em algum js).
    Usa MESMA logica do project_server /scan_in_game_assets:
      - Literais: 'assets/.../X.png' direto na string
      - Templates: 'assets/.../${X}/...' regex-matchable
    """
    js_dir = ROOT / "js"
    if not js_dir.exists():
        return {}
    all_js = ""
    for jf in js_dir.rglob("*.js"):
        try:
            all_js += "\n" + jf.read_text(encoding="utf-8")
        except Exception:
            pass
    pat_literal = re.compile(r"['\"`](assets/[^'\"`]+\.png)['\"`]")
    pat_template = re.compile(r"['\"`](assets/[^'\"`]*\$\{[^}]+\}[^'\"`]*\.png)['\"`]")
    literals = set(m.group(1) for m in pat_literal.finditer(all_js))
    templates = set(m.group(1) for m in pat_template.finditer(all_js))
    template_regexes = []
    for tpl in templates:
        esc = re.escape(tpl)
        rgx = re.sub(r'\\\$\\\{[^}]+\\\}', r'[^/]+', esc)
        try:
            template_regexes.append(re.compile('^' + rgx + '$'))
        except re.error:
            pass
    def is_in_game(rel_path):
        if rel_path in literals:
            return True
        for rgx in template_regexes:
            if rgx.match(rel_path):
                return True
        return False
    return is_in_game

def bake_assets_index():
    assets_dir = ROOT / "assets"
    if not assets_dir.exists():
        print(f"[assets] no {assets_dir} -- skip")
        return
    in_game_check = scan_in_game_refs()
    items, suggestions = [], []
    by_cat = {}
    in_game_count, orphan_count = 0, 0
    for png in assets_dir.rglob("*.png"):
        rel = png.relative_to(ROOT).as_posix()
        cat, tags, conf, suggest = classify_asset(rel)
        in_game = in_game_check(rel) if callable(in_game_check) else False
        if in_game:
            in_game_count += 1
        else:
            orphan_count += 1
        entry = {
            "path": rel,
            "category": cat,
            "tags": tags,
            "confidence": conf,
            "inGame": in_game,
        }
        if suggest:
            entry["suggested_path"] = suggest
            suggestions.append({"from": rel, "to": suggest, "confidence": conf, "inGame": in_game})
        items.append(entry)
        by_cat[cat] = by_cat.get(cat, 0) + 1
    classified = sum(1 for i in items if i["category"] != "unclassified")
    out = {
        "total": len(items),
        "classified": classified,
        "unclassified": len(items) - classified,
        "in_game": in_game_count,
        "orphan": orphan_count,
        "by_category": by_cat,
        "suggestions": suggestions,
        "items": items,
        "_baked_at": datetime.now().isoformat(),
    }
    idx = ROOT / "data" / "_assets_index.json"
    idx.parent.mkdir(parents=True, exist_ok=True)
    idx.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[assets] baked {len(items)} assets ({classified} classified, {in_game_count} in-game, {orphan_count} orphan, {len(suggestions)} suggestions) -> {idx.relative_to(ROOT)}")

if __name__ == "__main__":
    bake_maps_index()
    bake_assets_index()
    print("done.")
