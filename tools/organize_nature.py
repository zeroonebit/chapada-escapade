"""
Organiza os 31 PNGs nature do PixelLab em chars/nature/<categoria>/<nome>.png
baseado na ID visual feita no contact sheet.
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "nature"
OUT = ROOT / "assets" / "pixel_labs" / "chars" / "nature"

# (subdir do inbox, idx-id, categoria_destino, nome_legivel)
ITEMS = [
    # PEDRAS
    ("geral",  "33_fdcd8015", "pedras",     "boulder_red_cluster"),
    ("geral",  "37_2eececa0", "pedras",     "rock_small_smooth"),
    ("geral",  "44_83c7e018", "pedras",     "rock_pillar_tall"),

    # VEGETAÇÃO — cactus
    ("cactus", "10_27e95ef9", "vegetacao",  "bush_round_dense"),
    ("cactus", "14_c6cc4f34", "vegetacao",  "cactus_saguaro_tall"),
    ("cactus", "18_51d6a60a", "vegetacao",  "cactus_medium"),
    ("cactus", "26_906d8ac9", "vegetacao",  "cactus_dead_dry"),
    ("geral",  "06_aec7d82b", "vegetacao",  "cactus_branching"),
    ("geral",  "21_ccab237b", "vegetacao",  "cactus_cluster_low"),
    ("geral",  "29_0c0a2a8d", "vegetacao",  "cactus_saguaro_2"),
    ("geral",  "45_6ea0484d", "vegetacao",  "cactus_dead_vine"),
    # bushes / mato
    ("geral",  "13_d635d609", "vegetacao",  "bush_round"),
    ("geral",  "09_9cc2fd1b", "vegetacao",  "patch_cluster"),
    ("geral",  "05_cc8e94e5", "vegetacao",  "bush_dry"),
    ("geral",  "40_e371b4de", "vegetacao",  "agave_dark"),

    # PLACAS
    ("geral",  "02_01ceb4fa", "placas",     "placa_seta_dir"),
    ("geral",  "17_cfc0e360", "placas",     "placa_procurado"),
    ("geral",  "25_06429809", "placas",     "placa_madeira"),
    ("geral",  "41_e5c9839b", "placas",     "placa_pintada"),

    # OUTROS
    ("geral",  "01_01e2a143", "outros",     "pile_logs"),
    ("geral",  "22_737ad325", "outros",     "hay_bale"),

    # CERCAS
    ("cercas", "00_b5d7456d", "cercas",     "post_single"),
    ("cercas", "04_fe3bc4fc", "cercas",     "fence_full_h"),
    ("cercas", "08_3d682a91", "cercas",     "fence_broken"),
    ("cercas", "12_f8226014", "cercas",     "plank_v"),
    ("cercas", "16_859b70f9", "cercas",     "fence_gate_open"),
    ("cercas", "20_01ce7305", "cercas",     "fence_corner"),
    ("cercas", "24_63e4f6fb", "cercas",     "fence_long"),
    ("cercas", "28_d86688d6", "cercas",     "fence_short"),
    ("cercas", "32_a6e7f5e2", "cercas",     "post_thin"),
    ("cercas", "36_9df4caaf", "cercas",     "fence_normal"),
]

def go():
    moved, skipped = 0, 0
    for sub, fn, cat, name in ITEMS:
        src = INBOX / sub / f"{fn}.png"
        dst_dir = OUT / cat
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / f"{name}.png"
        if not src.exists():
            print(f"MISS {src}")
            continue
        if dst.exists():
            skipped += 1
            continue
        shutil.copy2(src, dst)
        print(f"+ {cat}/{name}.png")
        moved += 1
    print(f"\n{moved} copiados, {skipped} já existiam")

if __name__ == "__main__":
    go()
