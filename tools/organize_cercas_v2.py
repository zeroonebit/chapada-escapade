"""
Copia as 14 cercas novas do _inbox/new_batch para chars/nature/cercas_v2
com nomes legiveis. ID visual feito a partir do new_batch_sheet.png.
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "new_batch"
OUT   = ROOT / "assets" / "pixel_labs" / "chars" / "nature" / "cercas_v2"

# (idx do contact sheet, nome legivel)
CERCAS = [
    ("00_59264715", "fence_double_short_h"),   # cerca dupla horizontal curta
    ("01_78265b0a", "post_lantern_low"),        # post baixo com lanterna
    ("03_d4f51c6f", "gate_closed_solid"),       # portao fechado tabuas grossas
    ("04_5485fc63", "post_lantern_thin"),       # post fino com lanterna
    ("06_76ebec72", "post_double_rope"),        # post duplo com corda/lanterna
    ("08_c9602f60", "post_carved"),             # post torneado
    ("09_c62d86d1", "segment_tall_dual"),       # segmento alto duplo ornamental
    ("10_1d19c9b9", "fence_curved_short"),      # cerca curva curta
    ("11_254c9449", "post_thin_simple"),        # post fino simples
    ("12_c2a65157", "tower_ornamental_thin"),   # torre ornamental fina
    ("13_8f54f2eb", "fence_curved_long"),       # cerca curva longa
    ("14_3115a5b5", "gate_open_double"),        # portao duplo aberto
    ("16_f2bde7ca", "gate_thin_double"),        # portao duplo fino
    ("18_4284b9e5", "beam_horizontal"),         # viga horizontal solta
]

def organize():
    OUT.mkdir(parents=True, exist_ok=True)
    ok, fail = 0, 0
    for src_stem, dst_name in CERCAS:
        src = INBOX / f"{src_stem}.png"
        dst = OUT / f"{dst_name}.png"
        if not src.exists():
            print(f"FAIL {src_stem} -> source nao existe")
            fail += 1
            continue
        shutil.copy2(src, dst)
        print(f"OK  {dst_name:30s} <- {src_stem}.png")
        ok += 1
    print(f"\n== {ok} copiados, {fail} falhas ==")
    print(f"Out: {OUT}")

if __name__ == "__main__":
    organize()
