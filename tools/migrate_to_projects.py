"""
migrate_to_projects.py — Copia ChapadaEscapade de N:\\WebGames para H:\\Projects.
Ignora Thumbs.db e atualiza arquivos de config automaticamente.
"""
import shutil
import pathlib
import json

SRC = pathlib.Path(r"N:\WebGames\ChapadaEscapade")
DST = pathlib.Path(r"H:\Projects\ChapadaEscapade")

IGNORE = shutil.ignore_patterns("Thumbs.db", "*.db")

# ── 1. Copiar arvore ──────────────────────────────────────────────────────────
print(f"Copiando {SRC}  →  {DST} ...")
shutil.copytree(str(SRC), str(DST), ignore=IGNORE, dirs_exist_ok=True)
print("✅ Cópia concluída")

# ── 2. Atualizar .claude/settings.local.json ─────────────────────────────────
settings_path = DST / ".claude" / "settings.local.json"
settings = {
    "permissions": {
        "allow": [
            "Read(H:\\\\Projects\\\\**)",
            "Edit(H:\\\\Projects\\\\**)",
            "Write(H:\\\\Projects\\\\**)",
            "Glob(H:\\\\Projects\\\\**)",
            "Grep(H:\\\\Projects\\\\**)",
            "Bash(ls:*)",
            "Bash(mkdir:*)",
            "Bash(mv:*)",
            "Bash(cp:*)",
            "Bash(rm:*)",
            "Bash(python:*)",
            "Bash(pip:*)",
            "Bash(sleep:*)",
            "Bash(wc:*)",
            "Bash(echo:*)",
            "mcp__Claude_Preview__preview_start",
            "mcp__Claude_Preview__preview_list",
            "mcp__Claude_Preview__preview_console_logs",
            "mcp__Claude_Preview__preview_eval",
            "mcp__Claude_Preview__preview_screenshot",
            "mcp__Claude_Preview__preview_inspect",
            "mcp__Claude_Preview__preview_logs",
            "mcp__Claude_Preview__preview_network",
            "mcp__Claude_Preview__preview_snapshot"
        ]
    }
}
with open(settings_path, "w") as f:
    json.dump(settings, f, indent=2)
print(f"✅ settings.local.json atualizado → {settings_path}")

# ── 3. Atualizar .claude/launch.json ─────────────────────────────────────────
launch_path = DST / ".claude" / "launch.json"
launch = {
    "version": "0.0.1",
    "configurations": [
        {
            "name": "Chapada Escapade (static)",
            "runtimeExecutable": "python",
            "runtimeArgs": ["-m", "http.server", "8080"],
            "port": 8080
        }
    ]
}
with open(launch_path, "w") as f:
    json.dump(launch, f, indent=2)
print(f"✅ launch.json atualizado → {launch_path}")

# ── 4. Atualizar CLAUDE.md ────────────────────────────────────────────────────
claude_md = DST / "CLAUDE.md"
text = claude_md.read_text(encoding="utf-8")
text = text.replace(r"N:\WebGames\ChapadaEscapade", r"H:\Projects\ChapadaEscapade")
text = text.replace(r"N:\WebGames", r"H:\Projects")
text = text.replace("\\\\BoloNas\\home\\WebGames\\ChapadaEscapade", r"H:\Projects\ChapadaEscapade")
text = text.replace("///BoloNas/home/WebGames/**", "H:\\\\Projects\\\\**")
# Atualiza seção de acesso
old_acesso = """### Acesso ao NAS
- Drive mapeado: `N:\\WebGames\\ChapadaEscapade` (preferir, mais rápido que UNC)
- UNC fallback: `\\\\BoloNas\\home\\WebGames\\ChapadaEscapade`"""
new_acesso = """### Localização
- **Drive local:** `H:\\Projects\\ChapadaEscapade`"""
text = text.replace(old_acesso, new_acesso)
claude_md.write_text(text, encoding="utf-8")
print(f"✅ CLAUDE.md atualizado → {claude_md}")

print("\n🎉 Migração concluída! Abra o Claude Code em H:\\Projects\\ChapadaEscapade")
print("   O servidor HTTP roda de dentro dessa pasta agora (sem --directory).")
