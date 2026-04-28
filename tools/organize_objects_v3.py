"""
Organiza os 9 objects do batch v3 em chars/nature/objects/ com nomes legíveis.
IDs identificados visualmente via contact sheet objects_v3_sheet.png.
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "objects_v3"
OUT   = ROOT / "assets" / "pixel_labs" / "chars" / "nature" / "objects"

ITEMS = [
    ("02_f63dbdb7", "church"),
    ("04_a27ae87b", "dry_turf"),
    ("08_d68eeeb5", "windmill"),
    ("13_e03d02be", "satellite_dish_rusty"),
    ("14_b7be67ef", "gas_can"),
    ("16_72294b90", "barrel_rusty"),
    ("17_7495e7f0", "old_truck"),
    ("22_f2704fef", "bucket_empty"),
    ("34_1fa190a2", "bucket_milk"),
]

def organize():
    OUT.mkdir(parents=True, exist_ok=True)
    ok = 0
    for src_stem, dst_name in ITEMS:
        src = INBOX / f"{src_stem}.png"
        dst = OUT / f"{dst_name}.png"
        if not src.exists():
            print(f"FAIL {src_stem} -> source nao existe")
            continue
        shutil.copy2(src, dst)
        print(f"OK  {dst_name:24s} <- {src_stem}.png")
        ok += 1
    print(f"\n== {ok}/{len(ITEMS)} copiados ==\n{OUT}")

if __name__ == "__main__":
    organize()
