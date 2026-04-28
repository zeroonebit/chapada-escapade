"""
Migra ZIPs do PixelLab (em assets/pixel_labs/_inbox/<char>/) pra estrutura do projeto:
  chars/<char>/anims/<anim_short>/<DIR>/frame_NNN.png

- Direções long → short: north→N, south→S, east→E, west→W, north-east→NE, etc.
- Animações renomeadas (ver ANIM_MAP); skipa o que não tá mapeado (deixa o user nomear).
- Não sobrescreve rotations existentes.
- Idempotente: pula arquivos que já existem.
"""
from __future__ import annotations
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox"
CHARS = ROOT / "assets" / "pixel_labs" / "chars"

# ZIP folder name in _inbox/ → char folder name in chars/
CHAR_MAP = {
    "farmer":       "fazendeiro",
    "ufo":          "ufo",
    "bull":         "boi",
    "cow":          "vaca_chubby",     # chubby novo, separado da vaca atual (4-dir)
    "cow_holstein": "vaca_holstein",   # 4-dir, separado
}

# direção long do PixelLab → código curto do projeto
DIR_MAP = {
    "north": "N", "south": "S", "east": "E", "west": "W",
    "north-east": "NE", "north-west": "NW",
    "south-east": "SE", "south-west": "SW",
}

# Pasta animação do ZIP → nome curto no projeto.
# Chave é o prefixo (antes do "-<hash>"); valor é o nome curto OU None pra skipar.
ANIM_MAP = {
    # Templates nomeados (lookup pelo prefixo antes do "-<hash>"):
    "Running":            "running",
    "Scary_Walk":         "scary_walk",
    "Hovering_in_idle":   "hovering_idle",
    "Attack":             "attack",
    "Eating":             "eating",
    "Idle_Shaking_Head":  "idle_head_shake",
    "Rest_Idle":          "rest_idle",
    "Lie_Down":           "lie_down",
    "Stand_Up":           "stand_up",

    # Customs identificados (lookup pelo nome completo, precedência sobre prefixo):
    "animation-4809eb1d": "walk",  # boi walk-4-frames (8d) — confirmado via UI
    "animation-b3a5803e": "walk",  # vaca_chubby walk-4-frames (8d) — confirmado via UI

    # vaca_holstein customs identificados pelo user:
    "animation-18f79c85": "walk",          # 4-dir, 4 frames
    "animation-cf52a224": "running",       # 4-dir, 8 frames
    "animation-34b7dd8d": "custom_mid_b",  # 4-dir, 7 frames — nome provisório, identificar depois
    "the_ufo_hovers_and_fluctuate_in_air_kinda_oscilati": None,  # ufo custom só south, skip
}


def anim_short(folder_name: str) -> str | None:
    """'Running-ee53a6b7' → 'running'; retorna None se mapeado pra skip.
    Tenta primeiro o nome completo (pra customs identificados), depois o prefixo."""
    if folder_name in ANIM_MAP:
        return ANIM_MAP[folder_name]
    prefix = folder_name.rsplit("-", 1)[0]
    return ANIM_MAP.get(prefix)


def organize():
    summary = {"copied": 0, "skipped_existing": 0, "skipped_unmapped": [], "by_char": {}}

    for inbox_name, char_name in CHAR_MAP.items():
        src_root = INBOX / inbox_name
        if not src_root.exists():
            continue
        dst_char = CHARS / char_name
        dst_char.mkdir(parents=True, exist_ok=True)
        char_log = []

        # 1. Rotations (só copia se NÃO existir)
        rot_src = src_root / "rotations"
        if rot_src.exists():
            for png in rot_src.glob("*.png"):
                dst = dst_char / png.name  # mantém nome longo (north-east.png)
                if dst.exists():
                    summary["skipped_existing"] += 1
                else:
                    shutil.copy2(png, dst)
                    summary["copied"] += 1
                    char_log.append(f"+ rotation {png.name}")

        # 2. Animations
        anim_root = src_root / "animations"
        if not anim_root.exists():
            continue
        for anim_dir in sorted(anim_root.iterdir()):
            if not anim_dir.is_dir():
                continue
            short = anim_short(anim_dir.name)
            if short is None:
                summary["skipped_unmapped"].append(f"{char_name}/{anim_dir.name}")
                continue
            for long_dir in anim_dir.iterdir():
                if not long_dir.is_dir():
                    continue
                short_dir = DIR_MAP.get(long_dir.name)
                if short_dir is None:
                    char_log.append(f"? unknown direction {long_dir.name}")
                    continue
                dst_dir = dst_char / "anims" / short / short_dir
                dst_dir.mkdir(parents=True, exist_ok=True)
                for frame in sorted(long_dir.glob("frame_*.png")):
                    dst = dst_dir / frame.name
                    if dst.exists():
                        summary["skipped_existing"] += 1
                    else:
                        shutil.copy2(frame, dst)
                        summary["copied"] += 1
                        char_log.append(f"+ {short}/{short_dir}/{frame.name}")

        if char_log:
            summary["by_char"][char_name] = char_log

    return summary


if __name__ == "__main__":
    s = organize()
    print(f"\n== Resultado ==")
    print(f"Copiados:          {s['copied']}")
    print(f"Pulados (existem): {s['skipped_existing']}")
    if s["skipped_unmapped"]:
        print(f"\nNão mapeados (revisar ANIM_MAP):")
        for x in s["skipped_unmapped"]:
            print(f"  - {x}")
    print(f"\nPor character:")
    for char, log in s["by_char"].items():
        print(f"\n  {char}: {len(log)} arquivos")
        # só mostra primeiros 5 + último pra resumir
        if len(log) <= 6:
            for line in log:
                print(f"    {line}")
        else:
            for line in log[:3]:
                print(f"    {line}")
            print(f"    ... ({len(log) - 4} mais)")
            print(f"    {log[-1]}")
