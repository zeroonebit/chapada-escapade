#!/usr/bin/env python3
"""
project_server.py — Project server do Chapada Escapade.

Servidor estático (porta 8090) que serve:
  - Static files do projeto (assets, html, js, etc)
  - API REST consumida pelo PixaPro standalone (H:/Projects/PixaPro)

Uso:
  python tools/project_server.py [port]    # default 8090

Endpoints:
  POST /save_decisions         → tools/saves/decisions.json
  POST /save_configs           → tools/saves/configs.json
  POST /save_mcp_queue         → tools/saves/mcp_queue.json
  POST /save_wang_corrections  → tools/saves/wang_corrections.json
  POST /save_asset_tags        → tools/saves/asset_tags.json
  GET  /list_assets            → lista PNGs de assets/pixel_labs
  GET  /scan_in_game_assets    → quais PNGs estão wireados in-game
  GET  /mcp_status             → estado dos jobs PixelLab MCP
  POST /mcp_status             → atualiza job
  GET  /pixellab_balance       → saldo (cache)
  POST /pixellab_balance       → bookmarklet posta o saldo aqui
  GET  /maps?project=<slug>    → lista map presets
  GET  /maps/<name>?project=<slug>  → detalhe
  POST /maps/<name>?project=<slug>  → salva map preset

Convenção de portas:
  8080 = projetos jogo (game canvas)
  8089 = PixaPro UI standalone (H:/Projects/PixaPro/server.py)
  8090 = project server (este script) — onde PixaPro fala via API

Renomeado de gallery_server.py em 2026-05-02 (audit cleanup).
"""

import json
import re
import sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAVES_DIR = ROOT / "tools" / "saves"
HISTORY_DIR = SAVES_DIR / "history"
_mcp_jobs = {}  # in-memory: {id: {id, type, description, status, result, ts}}
_balance_cache = {"data": None, "ts": 0}  # populado pelo bookmarklet via POST /pixellab_balance

# Carrega saldo persistido do disk (sobrevive restart)
_balance_path = SAVES_DIR / "pixellab_balance.json"
if _balance_path.exists():
    try:
        _balance_cache["data"] = json.loads(_balance_path.read_text(encoding="utf-8"))
    except Exception:
        pass

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    SAVE_ENDPOINTS = {
        "/save_decisions": "decisions",
        "/save_configs": "configs",
        "/save_mcp_queue": "mcp_queue",
        "/save_wang_corrections": "wang_corrections",
        "/save_asset_tags": "asset_tags",
    }

    def do_GET(self):
        if self.path == "/list_assets":
            self.handle_list_assets()
            return
        if self.path == "/mcp_status":
            self.handle_get_mcp_status()
            return
        if self.path == "/pixellab_balance":
            self.handle_pixellab_balance()
            return
        if self.path == "/scan_in_game_assets":
            self.handle_scan_in_game_assets()
            return
        # Maps API: GET /maps?project=<slug> | GET /maps/<name>?project=<slug>
        if self.path.startswith("/maps"):
            self.handle_maps_get()
            return
        # Asset naming convention API (ver PixaPro/ASSET_NAMING_STANDARD.md)
        if self.path == "/scan_assets":
            self.handle_scan_assets()
            return
        if self.path == "/asset_naming":
            self.handle_asset_naming()
            return
        super().do_GET()

    def handle_scan_assets(self):
        """Scan assets/ + classifica cada PNG segundo ASSET_NAMING_STANDARD.md.
        Returns:
          {total, classified, unclassified, by_category: {...},
           items: [{path, category, tags, suggested_path?, confidence}],
           suggestions: [{from, to, confidence}] (so unclassified)}
        """
        assets_dir = ROOT / "assets"
        if not assets_dir.exists():
            self._send_json({"error": "no_assets_dir", "path": str(assets_dir)}, status=404)
            return
        items, suggestions = [], []
        by_cat = {}
        for png in assets_dir.rglob("*.png"):
            rel = png.relative_to(ROOT).as_posix()
            cat, tags, conf, suggest = self._classify_asset(rel)
            entry = {"path": rel, "category": cat, "tags": tags, "confidence": conf}
            if suggest:
                entry["suggested_path"] = suggest
                suggestions.append({"from": rel, "to": suggest, "confidence": conf})
            items.append(entry)
            by_cat[cat] = by_cat.get(cat, 0) + 1
        classified = sum(1 for i in items if i["category"] != "unclassified")
        self._send_json({
            "total": len(items),
            "classified": classified,
            "unclassified": len(items) - classified,
            "by_category": by_cat,
            "suggestions": suggestions,
            "items": items,
        })

    def _classify_asset(self, rel_path: str):
        """Classifica path segundo ASSET_NAMING_STANDARD.md regex rules.
        Returns: (category, tags_dict, confidence, suggested_new_path_or_None)
        """
        p = rel_path.replace("\\", "/")
        # chars/<X>/<DIR>.png ou chars/<X>/<dir>.png (south.png, S.png, etc)
        m = re.match(r"^assets/(?:pixel_labs/)?chars/([^/]+)/([NSEW]|north|south|east|west|north-east|north-west|south-east|south-west|NE|NW|SE|SW)\.png$", p, re.IGNORECASE)
        if m:
            char, d = m.group(1), m.group(2)
            return ("char_static", {"char": char, "dir": d.upper()}, 1.0, None)
        # chars/<X>/anims/<A>/<DIR>/frame_NNN.png
        m = re.match(r"^assets/(?:pixel_labs/)?chars/([^/]+)/anims/([^/]+)/([NSEW]+)/frame_(\d+)\.png$", p, re.IGNORECASE)
        if m:
            char, anim, d, frame = m.groups()
            return ("char_anim_frame", {"char": char, "anim": anim, "dir": d.upper(), "frame": int(frame)}, 1.0, None)
        # nature reclass -> env
        m = re.match(r"^assets/(?:pixel_labs/)?chars/nature/([^/]+)/([^/]+)\.png$", p)
        if m:
            sub, name = m.group(1), m.group(2)
            new = f"assets/env/{sub}/{name}.png"
            return (f"env_{sub}", {"category": sub, "name": name}, 0.85, new)
        # items/<cat>/<X>.png
        m = re.match(r"^assets/(?:pixel_labs/)?items/([^/]+)\.png$", p)
        if m:
            return ("item", {"name": m.group(1)}, 0.95, None)
        m = re.match(r"^assets/(?:pixel_labs/)?items/([^/]+)/([^/]+)\.png$", p)
        if m:
            cat, name = m.group(1), m.group(2)
            return ("item", {"category": cat, "name": name}, 1.0, None)
        # hud/<X>.png
        m = re.match(r"^assets/(?:pixel_labs/)?hud/([^/]+)\.png$", p)
        if m:
            return ("hud", {"name": m.group(1)}, 1.0, None)
        # terrain/<style>/wang_NN.png
        m = re.match(r"^assets/terrain/([^/]+)/wang_(\d+)\.png$", p)
        if m:
            style, bits = m.group(1), int(m.group(2))
            return ("wang_tile", {"style": style, "bits": bits}, 1.0, None)
        # terrain/<style>/_tileset.png ou _montage.png
        m = re.match(r"^assets/terrain/([^/]+)/_(tileset|montage)\.png$", p)
        if m:
            return ("wang_meta", {"style": m.group(1), "kind": m.group(2)}, 1.0, None)
        # fx/<X>.png
        m = re.match(r"^assets/(?:pixel_labs/)?fx/([^/]+)\.png$", p)
        if m:
            return ("fx", {"name": m.group(1)}, 1.0, None)
        # ui/<X>.png ou splash.png direto na raiz
        m = re.match(r"^assets/(?:pixel_labs/)?ui/([^/]+)\.png$", p)
        if m:
            return ("ui", {"name": m.group(1)}, 1.0, None)
        m = re.match(r"^assets/(?:pixel_labs/)?(splash|favicon|icon)([^/]*)\.png$", p)
        if m:
            return ("ui", {"name": m.group(1) + m.group(2)}, 0.9, None)
        # pixel_labs root level (sem subfolder reconhecido)
        m = re.match(r"^assets/pixel_labs/([^/]+)\.png$", p)
        if m:
            name = m.group(1)
            # Heuristica: nomes que parecem char/item/fx
            if re.search(r"(beam|halo|glow|spark)", name):
                return ("fx", {"name": name}, 0.7, f"assets/fx/{name}.png")
            return ("unclassified", {"name": name}, 0.3, None)
        return ("unclassified", {}, 0.0, None)

    def handle_asset_naming(self):
        """Returns o standard JSON do projeto (extends PixaPro base).
        Lê <project>/asset_naming.json se existe, senão retorna defaults.
        """
        cfg_file = ROOT / "asset_naming.json"
        if cfg_file.exists():
            data = json.loads(cfg_file.read_text(encoding="utf-8"))
        else:
            data = {
                "extends": "PixaPro/ASSET_NAMING_STANDARD.md",
                "categories": ["chars", "items", "hud", "env", "terrain", "fx", "ui"],
                "directions": ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
                "additional_categories": {},
                "biome_tags": [],
                "season_tags": [],
            }
        self._send_json(data)

    def handle_maps_get(self):
        """GET /maps?project=<slug>           -> {maps: [{name, bias, ...}]}
           GET /maps/<name>?project=<slug>    -> {name, seed, threshold, ...}
        """
        from urllib.parse import urlparse, parse_qs
        u = urlparse(self.path)
        qs = parse_qs(u.query)
        project = (qs.get("project") or ["chapada-escapade"])[0]
        # Sanitize: so [a-z0-9-_]
        project = re.sub(r"[^a-zA-Z0-9_\-]", "", project) or "chapada-escapade"
        maps_dir = SAVES_DIR / "projects" / project / "maps"

        # Lista
        if u.path == "/maps":
            maps_dir.mkdir(parents=True, exist_ok=True)
            items = []
            for f in sorted(maps_dir.glob("*.json")):
                try:
                    m = json.loads(f.read_text(encoding="utf-8"))
                    items.append({
                        "name": m.get("name") or f.stem,
                        "bias": m.get("bias", "ca-3"),
                        "seed": m.get("seed", 42),
                        "tileStyle": m.get("tileStyle", ""),
                    })
                except Exception:
                    pass
            self._send_json({"project": project, "maps": items})
            return

        # Detalhe: /maps/<name>
        m = re.match(r"^/maps/([^/]+)$", u.path)
        if m:
            name = re.sub(r"[^a-zA-Z0-9_\-]", "", m.group(1))
            f = maps_dir / f"{name}.json"
            if not f.exists():
                self._send_json({"error": "not_found", "name": name}, status=404)
                return
            data = json.loads(f.read_text(encoding="utf-8"))
            self._send_json(data)
            return

        self._send_json({"error": "bad_path"}, status=400)

    def handle_scan_in_game_assets(self):
        """Verifica COM CONFIANÇA quais PNGs em assets/pixel_labs/ são realmente
        carregados pelo código js/. Lê todos os .js, extrai strings que apontam
        pra assets/pixel_labs/... (literal ou template), e pra cada PNG em disk
        retorna {path: bool} onde true = referenciado.

        Templates como `assets/pixel_labs/chars/${char}/${dir}.png` são tratados
        como prefix matchers — qualquer PNG sob esse prefixo (com qualquer subpath)
        conta como referenciado. Por isso a precisão é melhor que grep simples.
        """
        import re
        js_dir = ROOT / "js"
        if not js_dir.exists():
            self._send_json({"error": "no_js_dir"}, status=500)
            return

        # Concatena todos os .js
        all_js = ""
        js_files = list(js_dir.rglob("*.js"))
        for jf in js_files:
            try:
                all_js += "\n" + jf.read_text(encoding="utf-8")
            except Exception:
                pass

        # Padrões pra extrair paths assets/pixel_labs/...
        # Literais simples ou compostos com ${...}
        # Capture até o primeiro caractere fechador ou interpolação
        # Regex: assets/pixel_labs/<anything not quote/backtick/parens/space>
        # Pra templates, vamos extrair tanto literal quanto prefix-with-vars
        pat_literal  = re.compile(r"['\"`](assets/pixel_labs/[^'\"`]+\.png)['\"`]")
        pat_template = re.compile(r"['\"`](assets/pixel_labs/[^'\"`]*\$\{[^}]+\}[^'\"`]*\.png)['\"`]")

        literal_paths = set(m.group(1) for m in pat_literal.finditer(all_js))
        templates = set(m.group(1) for m in pat_template.finditer(all_js))

        # Converte cada template em regex específica:
        # 'assets/pixel_labs/chars/${char}/${dir}.png' →
        # '^assets/pixel_labs/chars/[^/]+/[^/]+\.png$'
        # ${var} é tratado como [^/]+ (path component, não cruza /).
        template_regexes = []
        for tpl in templates:
            esc = re.escape(tpl)
            # \$\{...\} → [^/]+
            rgx = re.sub(r'\\\$\\\{[^}]+\\\}', r'[^/]+', esc)
            try:
                template_regexes.append(re.compile('^' + rgx + '$'))
            except re.error:
                pass

        # Lista PNGs em disco
        base = ROOT / "assets" / "pixel_labs"
        result = {}
        if base.exists():
            for p in base.rglob("*.png"):
                rel = p.relative_to(ROOT).as_posix()
                in_game = False
                if rel in literal_paths:
                    in_game = True
                else:
                    for rgx in template_regexes:
                        if rgx.match(rel):
                            in_game = True
                            break
                result[rel] = in_game

        total = len(result)
        in_game_count = sum(1 for v in result.values() if v)
        self._send_json({
            "total": total,
            "in_game": in_game_count,
            "not_in_game": total - in_game_count,
            "paths": result,
            "stats": {
                "literal_paths": len(literal_paths),
                "templates": len(templates),
                "js_files_scanned": len(js_files),
            }
        })

    def handle_pixellab_balance(self):
        """Retorna o último saldo postado via POST /pixellab_balance (bookmarklet).
        Saldo é populado pelo bookmarklet rodando na página pixellab.ai/account
        (usa session cookies do user, nada de tokens armazenados no servidor)."""
        if not _balance_cache["data"]:
            self._send_json({
                "error": "no_data",
                "msg": "Saldo ainda não foi capturado. Vá em pixellab.ai/account e use o bookmarklet PixaPro Balance.",
            }, status=404)
            return
        self._send_json(_balance_cache["data"])

    def handle_post_pixellab_balance(self):
        """Recebe saldo postado pelo bookmarklet rodando em pixellab.ai/account.
        Body esperado: { used: 812, total: 2000, plan: "Tier 1: Pixel Apprentice",
                         resets: "May 26", credits_usd: 0.0 }"""
        import time
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self.send_error(400, f"JSON invalido: {e}")
            return
        data["fetched_at"] = datetime.now().isoformat()
        _balance_cache["data"] = data
        _balance_cache["ts"] = time.time()
        # Persistir pra sobreviver restart do server
        try:
            SAVES_DIR.mkdir(parents=True, exist_ok=True)
            with open(SAVES_DIR / "pixellab_balance.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[balance] warn: persist falhou: {e}")
        self._send_json({"ok": True, "saved": data})
        used = data.get("used", "?")
        total = data.get("total", "?")
        print(f"[balance] {used}/{total} ({data.get('plan', '?')})")

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def handle_get_mcp_status(self):
        jobs = list(_mcp_jobs.values())
        jobs.sort(key=lambda j: j.get("ts", ""), reverse=True)
        msg = json.dumps(jobs)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))

    def handle_list_assets(self):
        base = ROOT / "assets" / "pixel_labs"
        result = {"filesystem": [], "orphans": []}
        if base.exists():
            for p in base.rglob("*.png"):
                rel = p.relative_to(ROOT).as_posix()
                # path web-friendly relativo a /tools/asset_gallery.html
                webpath = "../" + rel
                result["filesystem"].append({"path": webpath, "abs": rel})
        msg = json.dumps(result)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))

    def handle_post_mcp_status(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self.send_error(400, f"JSON invalido: {e}")
            return
        job_id = data.get("id")
        if not job_id:
            self.send_error(400, "Campo 'id' obrigatorio")
            return
        data.setdefault("ts", datetime.now().isoformat())
        _mcp_jobs[job_id] = data
        SAVES_DIR.mkdir(parents=True, exist_ok=True)
        mcp_path = SAVES_DIR / "mcp_live.json"
        with open(mcp_path, "w", encoding="utf-8") as f:
            json.dump(list(_mcp_jobs.values()), f, indent=2, ensure_ascii=False)
        msg = json.dumps({"ok": True, "job_id": job_id, "status": data.get("status", "unknown")})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))
        st = data.get("status", "?")
        desc = data.get("description", "")
        print(f"[mcp] {st.upper()} {job_id[:8]}... {desc}")

    def handle_maps_post(self):
        """POST /maps/<name>?project=<slug>  body=json com cfg do map preset.
        Salva em tools/saves/projects/<slug>/maps/<name>.json
        """
        from urllib.parse import urlparse, parse_qs
        u = urlparse(self.path)
        qs = parse_qs(u.query)
        project = (qs.get("project") or ["chapada-escapade"])[0]
        project = re.sub(r"[^a-zA-Z0-9_\-]", "", project) or "chapada-escapade"
        m = re.match(r"^/maps/([^/]+)$", u.path)
        if not m:
            self._send_json({"error": "bad_path"}, status=400)
            return
        name = re.sub(r"[^a-zA-Z0-9_\-]", "", m.group(1))
        if not name:
            self._send_json({"error": "empty_name"}, status=400)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self._send_json({"error": f"bad_json: {e}"}, status=400)
            return
        data["name"] = name
        data["_saved_at"] = datetime.now().isoformat()
        maps_dir = SAVES_DIR / "projects" / project / "maps"
        maps_dir.mkdir(parents=True, exist_ok=True)
        f = maps_dir / f"{name}.json"
        f.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[maps] saved {project}/{name} -> {f.relative_to(ROOT)}")
        self._send_json({"ok": True, "name": name, "project": project, "path": str(f.relative_to(ROOT)).replace("\\", "/")})

    def handle_apply_renames(self):
        """POST body: [{from: "...", to: "..."}, ...] | {renames: [...]}
        Move arquivos no disk, salva backup em
        tools/saves/asset_rename_backup_<ts>/.
        """
        import shutil
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self._send_json({"error": f"bad_json: {e}"}, status=400)
            return
        renames = data if isinstance(data, list) else data.get("renames", [])
        if not renames:
            self._send_json({"error": "no_renames"}, status=400)
            return
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = SAVES_DIR / f"asset_rename_backup_{ts}"
        backup_dir.mkdir(parents=True, exist_ok=True)
        results, errors = [], []
        for r in renames:
            src = ROOT / r["from"]
            dst = ROOT / r["to"]
            if not src.exists():
                errors.append({"from": r["from"], "error": "src_missing"})
                continue
            if dst.exists():
                errors.append({"from": r["from"], "to": r["to"], "error": "dst_exists"})
                continue
            try:
                # Backup do src antes de mover
                bkp = backup_dir / r["from"].replace("/", "__")
                shutil.copy2(src, bkp)
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(src), str(dst))
                results.append({"from": r["from"], "to": r["to"], "ok": True})
            except Exception as e:
                errors.append({"from": r["from"], "error": str(e)})
        manifest = {"ts": ts, "renames": renames, "results": results, "errors": errors}
        (backup_dir / "_manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[renames] applied {len(results)}/{len(renames)} (errors: {len(errors)})")
        print(f"          backup: {backup_dir.relative_to(ROOT)}")
        self._send_json({
            "ok": True,
            "applied": len(results),
            "errors": errors,
            "backup_dir": str(backup_dir.relative_to(ROOT)).replace("\\", "/"),
        })

    def do_POST(self):
        if self.path == "/mcp_status":
            self.handle_post_mcp_status()
            return
        if self.path == "/pixellab_balance":
            self.handle_post_pixellab_balance()
            return
        # Maps: POST /maps/<name>?project=<slug>  body=json do map preset
        if self.path.startswith("/maps/"):
            self.handle_maps_post()
            return
        # Apply renames batch (com backup)
        if self.path == "/apply_renames":
            self.handle_apply_renames()
            return
        if self.path == "/mcp_clear":
            _mcp_jobs.clear()
            mcp_path = SAVES_DIR / "mcp_live.json"
            if mcp_path.exists():
                mcp_path.write_text("[]", encoding="utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true,"cleared":true}')
            print("[mcp] CLEARED all jobs")
            return
        if self.path not in self.SAVE_ENDPOINTS:
            self.send_error(404, "Not found")
            return
        kind = self.SAVE_ENDPOINTS[self.path]

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            self.send_error(400, f"JSON invalido: {e}")
            return

        SAVES_DIR.mkdir(parents=True, exist_ok=True)
        HISTORY_DIR.mkdir(parents=True, exist_ok=True)

        main_path = SAVES_DIR / f"{kind}.json"
        with open(main_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        history_path = HISTORY_DIR / f"{kind}_{ts}.json"
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        count = len(data) if isinstance(data, (dict, list)) else 0
        msg = json.dumps({"ok": True, "count": count, "saved_to": str(main_path.relative_to(ROOT)).replace("\\", "/"), "history": str(history_path.relative_to(ROOT)).replace("\\", "/")})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))
        print(f"[save] {kind}: {count} keys → {main_path.relative_to(ROOT)} (+ history)")


def main():
    # 8080 é reservada pro game. Tools rodam em 8090 por default.
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    if port == 8080:
        print("ERRO: porta 8080 é reservada pro game. Use outra porta (default 8090).")
        sys.exit(1)
    print(f"Serving {ROOT} at http://localhost:{port}")
    print(f"  Game:    http://localhost:{port}/")
    print(f"  Gallery: http://localhost:{port}/tools/asset_gallery.html")
    print(f"  Endpoints: POST /save_decisions, POST /save_configs, GET|POST /mcp_status, GET /pixellab_balance")
    print(f"             GET /maps?project=<slug>, GET /maps/<name>, POST /maps/<name>?project=<slug>")
    print(f"             GET /scan_assets, GET /asset_naming, POST /apply_renames")
    print(f"  Saves:   {SAVES_DIR.relative_to(ROOT)}/")
    server = ThreadingHTTPServer(("", port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")

if __name__ == "__main__":
    main()
