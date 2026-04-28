"""
Baixa map_objects do PixelLab pelo CDN público (backblaze) e organiza por categoria.
Os IDs foram extraídos via Chrome MCP da página /create-object.

URL pattern:
  https://backblaze.pixellab.ai/file/pixellab-characters/objects/<userId>/<id>/rotations/unknown.png
"""
from __future__ import annotations
import urllib.request
from pathlib import Path

# Backblaze rejeita User-Agent default do urllib (Python-urllib/3.x → 403)
# Usar UA de browser destrava
HEADERS = {"User-Agent": "Mozilla/5.0"}

USER_ID = "39495934-ad71-4e56-bb36-f8044fde8e9e"
ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "nature"

# (idx, categoria, objectId)
OBJECTS = [
    (0, "cercas",  "b5d7456d-186d-4379-9c2a-5681737093e0"),
    (1, "geral",   "01e2a143-58ef-46db-b14e-4dae676bb2a2"),
    (2, "geral",   "01ceb4fa-7989-4438-be08-a992c9bfb6e9"),
    (4, "cercas",  "fe3bc4fc-37da-4f92-bc18-95e1501c9c30"),
    (5, "geral",   "cc8e94e5-9430-4c7d-8d56-e5bbc6dc663b"),
    (6, "geral",   "aec7d82b-dd13-4340-adf1-2464a1992a49"),
    (8, "cercas",  "3d682a91-7dad-4e4d-804f-72595abe35d8"),
    (9, "geral",   "9cc2fd1b-993a-40f2-9b70-b10b8232f18a"),
    (10, "cactus", "27e95ef9-5e43-4b64-a215-9596ba64f04f"),
    (12, "cercas", "f8226014-430a-4f18-8712-1ba28e65c037"),
    (13, "geral",  "d635d609-ac83-4811-bd1c-57dec90a292f"),
    (14, "cactus", "c6cc4f34-08b7-40b6-9c33-7746a96e780c"),
    (16, "cercas", "859b70f9-9e29-4406-a3fd-9147fe264127"),
    (17, "geral",  "cfc0e360-1f31-46f1-8b4d-9c6680ded1e7"),
    (18, "cactus", "51d6a60a-6523-47c2-98a8-7217ee8a38cb"),
    (20, "cercas", "01ce7305-bee6-4947-931c-8f227ad6557c"),
    (21, "geral",  "ccab237b-ab5d-4cfd-90b1-90613622bef1"),
    (22, "geral",  "737ad325-f35f-479e-ba87-e1128e892109"),
    (24, "cercas", "63e4f6fb-cfb3-4618-a2b4-0fc72a9d791b"),
    (25, "geral",  "06429809-1576-4ae9-9075-0d4556738e51"),
    (26, "cactus", "906d8ac9-0ddb-4bf1-b353-18139bc57719"),
    (28, "cercas", "d86688d6-1a36-4302-b9c1-f94dc8826504"),
    (29, "geral",  "0c0a2a8d-d17d-4788-a473-8d46e54b1003"),
    (32, "cercas", "a6e7f5e2-13ca-461f-858b-20428e6db1aa"),
    (33, "geral",  "fdcd8015-eefe-4cf7-a61b-bd64eb0a9582"),
    (36, "cercas", "9df4caaf-705a-44b5-8c3c-980374ccc6b7"),
    (37, "geral",  "2eececa0-c846-4886-8fb5-93a34271c949"),
    (40, "geral",  "e371b4de-5244-45e8-a1d6-7b109df1addd"),
    (41, "geral",  "e5c9839b-92c5-4fe6-8e13-30a849ce47a6"),
    (44, "geral",  "83c7e018-8cea-4714-9b7c-082da9412f66"),
    (45, "geral",  "6ea0484d-3351-43c3-bfb0-bd0b8be69503"),
]

def download_all():
    base = f"https://backblaze.pixellab.ai/file/pixellab-characters/objects/{USER_ID}"
    ok, fail, skipped = 0, 0, 0
    for idx, cat, oid in OBJECTS:
        url = f"{base}/{oid}/rotations/unknown.png"
        out_dir = INBOX / cat
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / f"{idx:02d}_{oid[:8]}.png"
        if out_file.exists():
            skipped += 1
            continue
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req) as r, open(out_file, "wb") as f:
                f.write(r.read())
            print(f"OK  {cat:7s} {out_file.name}")
            ok += 1
        except Exception as e:
            print(f"FAIL {cat:7s} {oid[:8]} -> {e}")
            fail += 1
    print(f"\n== {ok} baixados, {skipped} já existiam, {fail} falharam ==")

if __name__ == "__main__":
    download_all()
