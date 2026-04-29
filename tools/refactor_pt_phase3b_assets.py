"""
Fase 3b: refactor MASSIVO de paths/texture keys/body labels.

ETAPA 1 (este script): atualiza CÓDIGO referindo aos paths e keys novos.
ETAPA 2 (manual via git mv): renomeia as PASTAS no disco.

Mapeamento:
- Asset folder names (paths em strings):
  * chars/vaca/        -> chars/cow/
  * chars/boi/         -> chars/ox/
  * chars/fazendeiro/  -> chars/farmer/
  * chars/nature/cercas/    -> chars/nature/fences/
  * chars/nature/cercas_v2/ -> chars/nature/fences_v2/
  * chars/nature/pedras/    -> chars/nature/rocks/
  * chars/nature/vegetacao/ -> chars/nature/vegetation/
  * chars/nature/outros/    -> chars/nature/misc/

- Texture key prefixes:
  * vaca_*  -> cow_*
  * boi_*   -> ox_*
  * faz_*   -> farmer_* (era faz_run_*, faz_S, etc)
  * fazendeiro -> farmer (texture key 'fazendeiro')
  * vaca_frente / vaca_cima_sobe / etc -> cow_front / cow_top_up / etc
  * boi_frente / boi_cima_sobe / etc   -> ox_front / ox_top_up / etc
  * nat_pedra_* -> nat_rock_*
  * nat_vege_*  -> nat_veg_*
  * nat_cerca_* -> nat_fence_*
  * nat_outro_* -> nat_misc_*

- Body labels (literal strings):
  * 'vaca' -> 'cow'
  * 'boi'  -> 'ox'
  * 'fazendeiro' -> 'farmer'
  * 'rocha' -> 'rock'
  * 'moita' -> 'bush'
  * 'hamburguer' -> 'burger'

- Property names em curral struct (PT residuais):
  * curral.vaca (slot field) -> curral.cow

NÃO toca:
- localStorage keys (dbg.enabled.vacas etc)
- dirs8 keys ('south', 'east' etc)
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_DIR = ROOT / "js"

# String literal substitutions — apenas dentro de aspas simples ou duplas
STRING_SUBS = [
    # Folder paths (mais específicos primeiro)
    ("chars/vaca/",          "chars/cow/"),
    ("chars/boi/",           "chars/ox/"),
    ("chars/fazendeiro/",    "chars/farmer/"),
    ("chars/nature/cercas_v2/", "chars/nature/fences_v2/"),
    ("chars/nature/cercas/",    "chars/nature/fences/"),
    ("chars/nature/pedras/",    "chars/nature/rocks/"),
    ("chars/nature/vegetacao/", "chars/nature/vegetation/"),
    ("chars/nature/outros/",    "chars/nature/misc/"),
]

# Body labels e literal strings curtas (precisam quote check)
LITERAL_SUBS = [
    # Body labels usados em colision e identificação
    ("'vaca'",        "'cow'"),
    ('"vaca"',        '"cow"'),
    ("'boi'",         "'ox'"),
    ('"boi"',         '"ox"'),
    ("'fazendeiro'",  "'farmer'"),
    ('"fazendeiro"',  '"farmer"'),
    ("'rocha'",       "'rock'"),
    ('"rocha"',       '"rock"'),
    ("'moita'",       "'bush'"),
    ('"moita"',       '"bush"'),
    ("'hamburguer'",  "'burger'"),
    ('"hamburguer"',  '"burger"'),
    # Tipo values em arrays
    ("'holstein'",    "'holstein'"),  # holstein é nome de raça, mantém
    # Texture key prefixes — common patterns
    # Nature keys
    ("'nat_pedra_",   "'nat_rock_"),
    ("`nat_pedra_",   "`nat_rock_"),
    ("'nat_vege_",    "'nat_veg_"),
    ("`nat_vege_",    "`nat_veg_"),
    ("'nat_cerca_",   "'nat_fence_"),
    ("`nat_cerca_",   "`nat_fence_"),
    ("'nat_outro_",   "'nat_misc_"),
    ("`nat_outro_",   "`nat_misc_"),
]

# Texture key prefix renames (pegamos via regex word-boundary aware)
# Aplica em strings tipo 'vaca_S', 'vaca_walk_S_0', 'boi_idle_NE_3' etc
TEXTURE_KEY_PATTERNS = [
    # vaca_X (S, E, NE, walk_S_0, eat_NE_3, etc) -> cow_X
    (r"\bvaca_(?=[A-Z]|walk|eat|angry|run|idle|frente|cima)", "cow_"),
    # boi_X
    (r"\bboi_(?=[A-Z]|walk|idle|frente|cima)", "ox_"),
    # faz_X (faz_run, faz_S, etc)
    (r"\bfaz_(?=[A-Z]|run)", "farmer_"),
    # vaca/boi/fazendeiro identifiers em strings (`vaca`, `boi`)
    # Cuidado: já cobrimos via LITERAL_SUBS pra body.label
]

# Dictionaries / property names usados em código
PROP_RENAMES = [
    # Em curral.slots[].vaca (slot field)
    (r'\.vaca\b', '.cow'),  # CUIDADO: pode pegar this.vaca (já não existe), mas seguro porque nada
    # Em ANIM8 array char field
    (r"char:\s*'vaca'",       "char: 'cow'"),
    (r"char:\s*'boi'",        "char: 'ox'"),
    (r"char:\s*'fazendeiro'", "char: 'farmer'"),
    # prefix: 'vaca_walk' etc — esses ficam, ou viram cow_walk
    (r"prefix:\s*'vaca_",       "prefix: 'cow_"),
    (r"prefix:\s*'boi_",        "prefix: 'ox_"),
    (r"prefix:\s*'faz_",        "prefix: 'farmer_"),
]

# Variable identifiers que sobraram em PT
VAR_RENAMES = [
    # tipo: tipo é param/var muito usada — verificar contexto
    # 'tipo === \'vaca\'' etc
    (r"tipo\s*===\s*'vaca'",       "type === 'cow'"),
    (r"tipo\s*===\s*'boi'",        "type === 'ox'"),
    (r"tipo\s*===\s*'holstein'",   "type === 'holstein'"),  # raça mantém
    # 'tipo === ' string check
]

def apply_to_file(path):
    content = path.read_text(encoding='utf-8')
    original = content
    count = 0

    # 1. String path substitutions
    for old, new in STRING_SUBS:
        if old in content:
            n = content.count(old)
            content = content.replace(old, new)
            count += n

    # 2. Literal/quoted substitutions
    for old, new in LITERAL_SUBS:
        if old in content:
            n = content.count(old)
            content = content.replace(old, new)
            count += n

    # 3. Texture key patterns (regex)
    for pat_str, repl in TEXTURE_KEY_PATTERNS:
        pat = re.compile(pat_str)
        new_content, n = pat.subn(repl, content)
        if n > 0:
            content = new_content
            count += n

    # 4. Property renames
    for pat_str, repl in PROP_RENAMES:
        pat = re.compile(pat_str)
        new_content, n = pat.subn(repl, content)
        if n > 0:
            content = new_content
            count += n

    # 5. Variable renames específicos
    for pat_str, repl in VAR_RENAMES:
        pat = re.compile(pat_str)
        new_content, n = pat.subn(repl, content)
        if n > 0:
            content = new_content
            count += n

    if content != original:
        path.write_text(content, encoding='utf-8')
    return count

def main():
    files = sorted(JS_DIR.glob('*.js'))
    total = 0
    for f in files:
        n = apply_to_file(f)
        if n > 0:
            print(f'  {f.name}: {n} replacements')
            total += n
    print(f'\nTotal Fase 3b code update: {total}')
    print('\n⚠️  PRÓXIMO PASSO MANUAL: rodar git mv das pastas de assets')
    print('  git mv assets/pixel_labs/chars/vaca       assets/pixel_labs/chars/cow')
    print('  git mv assets/pixel_labs/chars/boi        assets/pixel_labs/chars/ox')
    print('  git mv assets/pixel_labs/chars/fazendeiro assets/pixel_labs/chars/farmer')
    print('  git mv assets/pixel_labs/chars/nature/cercas    assets/pixel_labs/chars/nature/fences')
    print('  git mv assets/pixel_labs/chars/nature/cercas_v2 assets/pixel_labs/chars/nature/fences_v2')
    print('  git mv assets/pixel_labs/chars/nature/pedras    assets/pixel_labs/chars/nature/rocks')
    print('  git mv assets/pixel_labs/chars/nature/vegetacao assets/pixel_labs/chars/nature/vegetation')
    print('  git mv assets/pixel_labs/chars/nature/outros    assets/pixel_labs/chars/nature/misc')

if __name__ == '__main__':
    main()
