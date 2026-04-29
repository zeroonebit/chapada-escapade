"""
Refactor PT-BR → EN nos identificadores e métodos do projeto.
Word-boundary regex pra evitar matches dentro de palavras maiores.

NÃO MEXE EM:
- Strings literais que sao paths de assets (chars/vaca/, etc) — Fase 3
- Strings 'vaca'/'boi' em body.label (afetam runtime — Fase 3 também)
- Texture keys 'vaca_S' (Fase 3)
- Comentários PT (Fase 2)
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_DIR = ROOT / "js"

# Mapeamento curado PT → EN
# Ordem importa: trocar vars longas antes das curtas (vacas_abduzidas antes de vacas)
RENAMES = [
    # Compostos primeiro (precedencia)
    ('vacas_abduzidas',     'abductedCows'),
    ('combustivelAtual',    'fuelCurrent'),
    ('combustivelMax',      'fuelMax'),
    ('barraCombustivel',    'fuelBar'),
    ('barraEnergia',        'energyBar'),
    ('cargaVacas',          'carryingCows'),
    ('cargaFarmers',        'carryingFarmers'),
    ('cargaMul',            'carryingMul'),
    ('podeVacas',           'canCarryCows'),
    ('podeFarmers',         'canCarryFarmers'),
    ('scoreAtual',          'score'),
    ('textoScore',          'scoreText'),
    ('textoContador',       'counterText'),
    ('setaIndicadora',      'indicatorArrow'),
    ('sombraNave',          'shipShadow'),
    ('coneLuz',             'lightCone'),
    ('raioCone',            'coneRadius'),
    ('rastroMouse',         'mouseTrail'),
    ('graficoRastro',       'trailGraphic'),
    ('mascoteCount',        'mascotCount'),
    ('mascoteCountTxt',     'mascotCountTxt'),
    ('mascoteFeno',         'mascotHay'),
    ('mascoteBalde',        'mascotBucket'),
    ('mascote',             'mascot'),
    ('presaNaMoita',        'stuckInBush'),
    ('presaNaGrama',        'stuckInGrass'),
    ('pacienciaAtual',      'fuelCurrent'),
    ('pacienciaMax',        'fuelMax'),
    ('barraPaciencia',      'fuelBar'),
    # Methods
    ('_criarVaca',          '_createCow'),
    ('_criarFazendeiro',    '_createFarmer'),
    ('_criarAtirador',      '_createShooter'),
    ('_criarBurgerEntity',  '_createBurgerEntity'),
    ('_criarHUD',           '_createHUD'),
    ('_construirCurral',    '_buildCorral'),
    ('_atualizarCombustivel','_updateFuel'),
    ('_atualizarPaciencia', '_updateFuel'),
    ('_atualizarRastro',    '_updateTrail'),
    ('_atualizarSeta',      '_updateArrow'),
    ('_atualizarSombras',   '_updateShadows'),
    ('_atualizarMinimapa',  '_updateMinimap'),
    ('_atualizarLEDs',      '_updateLEDs'),
    ('_atualizarIAVacas',   '_updateCowsAI'),
    ('_atualizarFazendeiros','_updateFarmers'),
    ('_atualizarAtiradores','_updateShooters'),
    ('_moverNave',          '_moveShip'),
    ('_tentarAbduzir',      '_tryAbduct'),
    ('_explodir',           '_explode'),
    ('_virarBurger',        '_turnIntoBurger'),
    ('_setupColisoes',      '_setupCollisions'),
    ('_colisaoAmbiente',    '_environmentCollision'),
    ('_verificarEntrega',   '_checkDelivery'),
    ('_dropCowsAtCurral',   '_dropCowsAtCorral'),
    ('_atrairBurgersBeam',  '_attractBurgersBeam'),
    ('_processarSlot',      '_processSlot'),
    ('_processarVacaNoCurral','_processCowInCorral'),
    ('_coletarSlot',        '_collectSlot'),
    ('_coletarBurgersPerto','_collectNearbyBurgers'),
    ('_coletarDoCurral',    '_collectFromCorral'),
    ('_filaSlot',           '_slotQueuePos'),
    ('_slotPos',            '_slotPos'),  # já EN
    ('_ensureCowMascote',   '_ensureCowMascot'),
    ('_setBarrasVisibility','_setBarsVisibility'),
    ('_spawnBurgerLoadingFila','_spawnBurgerLoadingQueue'),
    ('_reflowFila',         '_reflowQueue'),
    ('_texturaDirecional',  '_directionalTexture'),
    ('_spawnFazendeiroAtirando','_spawnShootingFarmer'),
    ('_spawnFazendeiro',    '_spawnFarmer'),
    ('_fisicaBacia',        '_basinPhysics'),
    ('_soltarVaca',         '_releaseCow'),
    ('_soltarTodas',        '_releaseAll'),
    ('_destruirVaca',       '_destroyCow'),
    ('_destruirAtirador',   '_destroyShooter'),
    ('_repovoar',           '_repopulate'),
    ('_setupVacas',         '_setupCows'),
    ('_setupAtiradores',    '_setupShooters'),
    ('_setupCenario',       '_setupScenery'),
    ('_setupPausa',         '_setupPause'),
    ('_posicionarHUD',      '_positionHUD'),
    ('_posicionarMobileControls','_positionMobileControls'),
    ('_atualizarJoy',       '_updateJoy'),
    ('_checkVitoria',       '_checkVictory'),
    ('_vitoria',            '_victory'),
    ('_anyCurralReady',     '_anyCorralReady'),
    ('_clearSlot',          '_clearSlot'),  # já EN
    ('_ensureSlots',        '_ensureSlots'),  # já EN
    ('_slotsLivres',        '_freeSlots'),
    # this.X — apenas identificadores ainda PT
    ('this.vacas',          'this.cows'),
    ('this.fazendeiros',    'this.farmers'),
    ('this.atiradores',     'this.shooters'),
    ('this.balas',          'this.bullets'),
    ('this.currais',        'this.corrals'),
    ('this.driveThrus',     'this.driveThrus'),  # já EN
    ('this.nave',           'this.ship'),
    ('this.dificuldade',    'this.difficulty'),
    ('this.pausado',        'this.paused'),
    ('this.grassPatches',   'this.grassPatches'),  # já EN
    ('this.fazendeirosTimer','this.farmersTimer'),
    # Locals comuns (em closures/funcs)
    # Cuidado: 'vaca' / 'boi' / 'fazendeiro' como vars locais — tem que ser word boundary estrito
    # Vamos pular esses pra evitar quebrar matches incorretos. Renomear manual depois se necessário.
]

def apply_renames(content):
    count = 0
    for old, new in RENAMES:
        if old == new:
            continue
        # Word boundary: \b funciona pra alfanumericos+_, mas '.' e ':' separam
        # Pra `this.X`, preciso match incluindo `this.`
        if old.startswith('this.'):
            # Exato match this.X (não pode ter .Y depois sem . — é OK porque this.cows.length é literal match)
            pat = re.compile(re.escape(old) + r'(?![A-Za-z0-9_])')
        elif old.startswith('_'):
            # Method: _criarVaca( ou _criarVaca, ou _criarVaca = etc
            pat = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(old) + r'(?![A-Za-z0-9_])')
        else:
            # Var word-boundary
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
    print(f'\nTotal: {total} replacements em {len(files)} arquivos')

if __name__ == '__main__':
    main()
