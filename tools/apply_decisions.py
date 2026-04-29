#!/usr/bin/env python3
"""
apply_decisions.py — Aplica decisões de curadoria exportadas do asset_gallery.html

Uso:
  python tools/apply_decisions.py decisions.json [--dry-run]

Ações:
  promote  → move arquivo de inbox/ pra chars/nature/<target>/
  discard  → git rm do arquivo + lista IDs pra deletar no PixelLab via MCP
  rename   → git mv pra novo nome (mesmo diretório)

--dry-run mostra o que faria sem executar.
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "chars" / "nature" / "v2" / "inbox"
CHARS_NATURE = ROOT / "assets" / "pixel_labs" / "chars" / "nature"

def run_git(*args):
    subprocess.run(["git", *args], cwd=str(ROOT), check=True)

def grep_refs(name):
    result = subprocess.run(
        ["git", "grep", "-l", name, "--", "js/", "index.html"],
        cwd=str(ROOT), capture_output=True, text=True
    )
    return result.stdout.strip().splitlines() if result.stdout.strip() else []

def main():
    if len(sys.argv) < 2:
        print("Uso: python tools/apply_decisions.py decisions.json [--dry-run]")
        sys.exit(1)

    decisions_path = Path(sys.argv[1])
    dry_run = "--dry-run" in sys.argv

    with open(decisions_path, "r", encoding="utf-8") as f:
        decisions = json.load(f)

    pixellab_delete_ids = []
    stats = {"promote": 0, "discard": 0, "rename": 0, "skip": 0}

    for asset_id, dec in decisions.items():
        action = dec["action"]
        name = dec.get("name", "?")
        rel_path = dec.get("path", "")

        src = ROOT / rel_path.lstrip("../").replace("/", "\\") if rel_path else None
        if not src:
            src = INBOX / f"{name}.png"

        print(f"\n{'[DRY] ' if dry_run else ''}[{action.upper()}] {name}")

        if action == "promote":
            target_dir = CHARS_NATURE / dec.get("target", "objects")
            dest = target_dir / src.name
            print(f"  {src} → {dest}")
            if not dry_run:
                target_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(src), str(dest))
                run_git("add", str(dest))
                try:
                    run_git("rm", "--cached", str(src))
                except subprocess.CalledProcessError:
                    pass
            stats["promote"] += 1

        elif action == "discard":
            refs = grep_refs(name)
            if refs:
                print(f"  ⚠ REFS encontradas em: {', '.join(refs)}")
                print(f"  → Não removendo automaticamente. Resolva as refs primeiro.")
                stats["skip"] += 1
                continue
            print(f"  git rm {src}")
            pixellab_delete_ids.append({"id": asset_id, "name": name})
            if not dry_run:
                if src.exists():
                    run_git("rm", "-f", str(src))
                else:
                    also = list(CHARS_NATURE.rglob(src.name))
                    for p in also:
                        print(f"  git rm {p}")
                        run_git("rm", "-f", str(p))
            stats["discard"] += 1

        elif action == "rename":
            new_name = dec.get("newName", name)
            dest = src.parent / f"{new_name}.png"
            print(f"  git mv {src.name} → {dest.name}")
            if not dry_run:
                if src.exists():
                    run_git("mv", str(src), str(dest))
                else:
                    print(f"  ⚠ Arquivo não encontrado: {src}")
                    stats["skip"] += 1
                    continue
            stats["rename"] += 1

    print("\n" + "=" * 50)
    print(f"Promote: {stats['promote']} | Discard: {stats['discard']} | Rename: {stats['rename']} | Skip: {stats['skip']}")

    if pixellab_delete_ids:
        print(f"\n🔴 {len(pixellab_delete_ids)} assets pra deletar no PixelLab via MCP:")
        for item in pixellab_delete_ids:
            print(f"  mcp__pixellab__delete_object(id=\"{item['id']}\")  # {item['name']}")

        mcp_path = ROOT / "tools" / "pixellab_delete_list.json"
        with open(mcp_path, "w", encoding="utf-8") as f:
            json.dump(pixellab_delete_ids, f, indent=2)
        print(f"\n  Lista salva em: {mcp_path}")
        print(f"  → Rode no Claude Code: 'Lê tools/pixellab_delete_list.json e deleta cada object via MCP'")

    if dry_run:
        print("\n⚠ DRY RUN — nada foi alterado. Rode sem --dry-run pra aplicar.")

if __name__ == "__main__":
    main()
