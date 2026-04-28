"""
Baixa os 20 objetos NOVOS do PixelLab (criados após o batch original de 31).
IDs detectados via Chrome MCP em pixellab.ai/create-object — diferenca entre lista
atual (51) e os 31 ja em pixellab_objects_fetch.py.
"""
from __future__ import annotations
import urllib.request
from pathlib import Path

HEADERS = {"User-Agent": "Mozilla/5.0"}
USER_ID = "39495934-ad71-4e56-bb36-f8044fde8e9e"
ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "new_batch"

NEW_IDS = [
    "59264715-9aed-44f6-bf34-5b50eec8c739",
    "78265b0a-61a1-4bd4-88ff-70df09e04061",
    "d914a0e1-8d46-4747-b512-bdaac13e3d19",
    "d4f51c6f-489d-4b9b-a536-d648e2fb10bc",
    "5485fc63-01e2-4471-a240-f8805bb16863",
    "f9a3ed86-87a8-4184-920a-c07153bfbb4f",
    "76ebec72-2c64-4e4c-a823-5c3d83781860",
    "ff11ef4e-19ea-4fb1-aacf-f15ee554c667",
    "c9602f60-4c09-49b1-b397-4716965e49e1",
    "c62d86d1-6a24-4973-9f9c-7a1bb0c29b91",
    "1d19c9b9-b083-40f7-8d8b-60f1b1f6408b",
    "254c9449-47ea-4075-abb0-44e86552a753",
    "c2a65157-c58f-4bc0-9a25-ea223e1b1a65",
    "8f54f2eb-0610-4524-a282-998bf1a9e37d",
    "3115a5b5-2be2-44ed-b94f-16a667911404",
    "d99188f1-7ea3-4311-a840-0cc93ec59fbc",
    "f2bde7ca-a2e3-4725-b0a0-3f06df88dfcd",
    "e642282e-141f-453e-90ca-d19b3a2c06d9",
    "4284b9e5-f9e2-4e56-8fc4-3c5cc8dad29d",
    "9178bfd0-d5f1-4f4c-939c-cb8f58495996",
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
    print(f"Inbox: {INBOX}")

if __name__ == "__main__":
    download_all()
