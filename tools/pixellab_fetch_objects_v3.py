"""
Baixa os 39 objects novos do batch v3 (windmill, church, buckets, gas can, barrel,
old truck, dry turf, satellite dish, etc) detectados via Chrome MCP.
"""
from __future__ import annotations
import urllib.request
from pathlib import Path

HEADERS = {"User-Agent": "Mozilla/5.0"}
USER_ID = "39495934-ad71-4e56-bb36-f8044fde8e9e"
ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "objects_v3"

NEW_IDS = [
    "464ceee6-179d-43d2-a87f-fbd216c0ca9c",
    "17aa311f-84e6-45ac-afbc-3b08b5bd6e1c",
    "f63dbdb7-3238-4af9-b48e-4fc61879cc59",
    "70008e22-cb63-4ba4-94b5-574805f48f4a",
    "a27ae87b-6a4a-4402-9e7b-c1f1a8497b8d",
    "88d07672-88ab-4a17-a506-b72f5e5dc956",
    "648275bc-f1f0-4df3-8daa-20ab9c3bcbe5",
    "eca3f8b4-d348-4fef-b083-5274a2b7a31f",
    "d68eeeb5-67a2-4138-a008-58bb6a488da2",
    "86b4ae1d-6886-4766-9774-cbd399657916",
    "285318dd-339e-488b-94e6-259f4080ec70",
    "40b05634-3279-46c6-8303-e7103c834acd",
    "443908a9-e37d-43f1-9b88-6ed7717fcf08",
    "e03d02be-b84c-44ed-bc9d-af4392fdb28d",
    "b7be67ef-5242-4b97-8cbb-91c05c7cefd1",
    "25484df0-9adb-4773-85e3-b3ffefd07a08",
    "72294b90-4d18-4667-864e-9d2ca3ed5ecd",
    "7495e7f0-6eb3-40bc-9fa9-3f78108cc9df",
    "e5cbb276-4b7f-43d1-bfa6-9f727a08b9f8",
    "96326331-180d-4fdd-b81d-463712694d03",
    "47b5a78f-03d4-4a1c-b28a-5b8459cea11f",
    "5eb12020-982a-4a43-a2a5-0e5cb79a2dca",
    "f2704fef-4e29-4045-a087-6899a6684004",
    "73fd9e84-7604-41ce-9c56-09b8bb689663",
    "782314ea-b9c5-4a28-9980-d38bef5000ce",
    "17fdfaf6-b17f-4cbb-b254-4e2eb15534de",
    "d2a745e6-5cb1-432c-b98c-8892cc739eb5",
    "e18bf1ca-a8ac-4f7f-ab6d-4bb311acf82f",
    "5edfd9c5-a811-469c-8ebc-60995a1bc1b9",
    "db2e0ab4-ae07-4093-80d6-a134d596d295",
    "983f04c2-e937-4db6-b0f5-ca4f972e8f2d",
    "094591e4-6f2f-40fe-bd99-2f2f6497b05f",
    "fecd422f-b48f-4f4e-847d-3f4976da763c",
    "32386db5-6296-4185-9f87-37528a5e65ed",
    "1fa190a2-e2a9-42f3-9af4-8fc83c8c33ba",
    "ea149954-619e-45e7-8998-df952bc3c93c",
    "c6d57fae-3d47-4c7e-a06d-b67d7abce675",
    "9f2e5c63-dc78-45dd-869d-d08485b5cdc8",
    "5af8e2f8-0bc5-4739-8451-daae312e69bf",
]

def download_all():
    INBOX.mkdir(parents=True, exist_ok=True)
    base = f"https://backblaze.pixellab.ai/file/pixellab-characters/objects/{USER_ID}"
    ok, fail, skipped = 0, 0, 0
    for idx, oid in enumerate(NEW_IDS):
        url = f"{base}/{oid}/rotations/unknown.png"
        out_file = INBOX / f"{idx:02d}_{oid[:8]}.png"
        if out_file.exists():
            skipped += 1
            continue
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req) as r, open(out_file, "wb") as f:
                f.write(r.read())
            print(f"OK  {out_file.name}")
            ok += 1
        except Exception as e:
            print(f"FAIL {oid[:8]} -> {e}")
            fail += 1
    print(f"\n== {ok} baixados, {skipped} ja existiam, {fail} falharam ==")

if __name__ == "__main__":
    download_all()
