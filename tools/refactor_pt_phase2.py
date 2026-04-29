"""
Fase 2 do refactor PT->EN: vars locais e termos secundários em closures.
NÃO TOCA EM:
- Identificadores prototype (já feito na Fase 1)
- Comentários (Fase 2b — separado pra controlar)
- Strings literals (chars/vaca/, body.label, etc)
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_DIR = ROOT / "js"

RENAMES = [
    # Vars locais comuns em PT — só nomes que aparecem como `let X` / `const X` / `var X`
    # ou como params de função
    # Ordem importa (compostos primeiro)
    ('naveScale',      'shipScale'),
    ('navSpeed',       'navSpeed'),  # já EN
    ('navSpeedAnim',   'navSpeedAnim'),
    ('navVx',          'navVx'),
    ('navVy',          'navVy'),
    ('vAxDelta',       'vAxDelta'),
    ('tiltTarget',     'tiltTarget'),
    ('tiltCurrent',    'tiltCurrent'),
    ('discoRot',       'discoRot'),  # nome de config
    ('curralPositions', 'corralPositions'),
    ('hudKeys',        'hudKeys'),
    ('hintMsg',        'hintMsg'),
    ('hintTxt',        'hintTxt'),
    ('beamScale',      'beamScale'),
    ('beamAtivo',      'beamActive'),
    ('querBeam',       'wantBeam'),
    ('animKey',        'animKey'),
    ('hoverKey',       'hoverKey'),
    ('runKey',         'runKey'),
    ('idleKey',        'idleKey'),
    ('fazSize',        'farmerSize'),
    ('fazScale',       'farmerScale'),
    ('massa',          'mass'),
    ('tamanho',        'size'),
    ('candidatas',     'candidates'),
    ('aceitas',        'accepted'),
    ('livres',         'free'),
    ('promote',        'promote'),  # já EN
    ('readyIcons',     'readyIcons'),
    ('loadingIcons',   'loadingIcons'),
    ('colhidos',       'harvested'),
    ('colhidosIcons',  'harvestedIcons'),
    ('pontosBrutos',   'rawPoints'),
    ('pontos',         'points'),
    ('multi',          'multi'),
    ('qtd',            'qty'),
    ('cargaVacas',     'carryingCows'),
    ('cargaFarmers',   'carryingFarmers'),
    ('cargaMul',       'carryingMul'),
    ('podeVacas',      'canCarryCows'),
    ('podeFarmers',    'canCarryFarmers'),
    ('drainMul',       'drainMul'),
    ('cowsInBeam',     'cowsInBeam'),  # já EN
    ('vegeKeys',       'vegeKeys'),
    ('pedrasKeys',     'rocksKeys'),
    ('fences',         'fences'),  # já EN
    ('lmPlaced',       'lmPlaced'),
    ('placed',         'placed'),
    ('cluster',        'cluster'),
    ('isLand',         'isLand'),
    ('isContent',      'isContent'),
    ('hasReady',       'hasReady'),
    ('inSplash',       'inSplash'),
    ('snap',           'snap'),
    ('useV2Comb',      'useV2Comb'),
    ('useV2Ene',       'useV2Energy'),
    # Variáveis de loops
    ('cx',             'cx'),  # já EN
    ('cy',             'cy'),
    # Vars que ainda apareciam em PT
    ('ssize',          'ssize'),
    ('arquivosAssets', 'assetFiles'),
    ('escala',         'scale'),
    ('largura',        'width'),
    ('altura',         'height'),
    ('horizontal',     'horizontal'),
    ('vertical',       'vertical'),
    ('faseIdx',        'phaseIdx'),
    # Common standalone PT words used as vars (cuidado: word-boundary protege)
    ('rotacao',        'rotation'),
    ('velocidade',     'speed'),
    ('direcao',        'direction'),
    # NÃO mexer em 'tipo' (palavra usada como param/local muito comum, risco alto)
    # NÃO mexer em vacas/boi/fazendeiro/curral (texture keys/labels)
]

def apply_renames(content):
    count = 0
    for old, new in RENAMES:
        if old == new:
            continue
        pat = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(old) + r'(?![A-Za-z0-9_])')
        new_content = pat.sub(new, content)
        if new_content != content:
            occurrences = len(pat.findall(content))
            count += occurrences
            content = new_content
    return content, count

def main():
    files = sorted(JS_DIR.glob('*.js'))
    total = 0
    for f in files:
        original = f.read_text(encoding='utf-8')
        new_content, count = apply_renames(original)
        if count > 0:
            f.write_text(new_content, encoding='utf-8')
            print(f'  {f.name}: {count} replacements')
            total += count
    print(f'\nTotal Fase 2: {total}')

if __name__ == '__main__':
    main()
