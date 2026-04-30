#!/usr/bin/env python3
"""
gallery_server.py — Servidor estático + endpoint POST /save_decisions

Uso:
  python tools/gallery_server.py [port]

Substitui `python -m http.server 8080` adicionando:
  POST /save_decisions  → grava JSON em tools/saves/decisions.json
                          + cópia timestamped em tools/saves/history/
"""

import json
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
        super().do_GET()

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

    def do_POST(self):
        if self.path == "/mcp_status":
            self.handle_post_mcp_status()
            return
        if self.path == "/pixellab_balance":
            self.handle_post_pixellab_balance()
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
    print(f"  Saves:   {SAVES_DIR.relative_to(ROOT)}/")
    server = ThreadingHTTPServer(("", port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")

if __name__ == "__main__":
    main()
