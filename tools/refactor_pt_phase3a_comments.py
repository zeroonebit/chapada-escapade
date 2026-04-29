"""
Fase 3a: traduz comentários PT-BR → EN nos arquivos JS.
Detecta // e /* */ comments e mapeia palavras comuns.
Não toca em strings literals.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_DIR = ROOT / "js"

# Mapeamento de palavras/frases comuns PT → EN
# Aplicado dentro de comentários apenas
WORD_MAP = [
    # Frases inteiras (mais específico primeiro)
    ('— sem isso, colisão com beam/atirador deita o bicho de lado', '— without this, collision with beam/shooter knocks down the entity'),
    ('matter.add.SPRITE (não image)', 'matter.add.SPRITE (not image)'),
    ('sprite suporta .anims, image não', 'sprite supports .anims, image does not'),
    # Verbos comuns
    ('Configurações', 'Settings'),
    ('Carrega', 'Loads'),
    ('carrega', 'loads'),
    ('Mostra', 'Shows'),
    ('mostra', 'shows'),
    ('Esconde', 'Hides'),
    ('esconde', 'hides'),
    ('Atualiza', 'Updates'),
    ('atualiza', 'updates'),
    ('Desenha', 'Draws'),
    ('desenha', 'draws'),
    ('Cria', 'Creates'),
    ('cria', 'creates'),
    ('Destroi', 'Destroys'),
    ('Remove', 'Removes'),
    ('remove', 'removes'),
    ('Ativa', 'Activates'),
    ('ativa', 'activates'),
    ('Desativa', 'Deactivates'),
    ('Calcula', 'Calculates'),
    ('calcula', 'calculates'),
    ('Verifica', 'Checks'),
    ('verifica', 'checks'),
    ('Aguarda', 'Waits'),
    ('aguarda', 'waits'),
    ('Garante', 'Ensures'),
    ('Aplica', 'Applies'),
    ('aplica', 'applies'),
    ('Limpa', 'Clears'),
    ('Define', 'Defines'),
    ('Inicia', 'Starts'),
    ('inicia', 'starts'),
    ('Para', 'Stops'),
    ('Spawna', 'Spawns'),
    ('spawna', 'spawns'),
    ('Reseta', 'Resets'),
    ('Salva', 'Saves'),
    ('Lê', 'Reads'),
    ('lê', 'reads'),
    # Substantivos comuns
    ('Animação', 'Animation'),
    ('animação', 'animation'),
    ('Animações', 'Animations'),
    ('animações', 'animations'),
    ('Direção', 'Direction'),
    ('direção', 'direction'),
    ('Direções', 'Directions'),
    ('direções', 'directions'),
    ('Velocidade', 'Speed'),
    ('velocidade', 'speed'),
    ('Tamanho', 'Size'),
    ('tamanho', 'size'),
    ('Posição', 'Position'),
    ('posição', 'position'),
    ('posições', 'positions'),
    ('Configuração', 'Configuration'),
    ('Pontuação', 'Score'),
    ('pontuação', 'score'),
    ('Cores', 'Colors'),
    ('cores', 'colors'),
    ('Tela', 'Screen'),
    ('tela', 'screen'),
    ('Mundo', 'World'),
    ('mundo', 'world'),
    ('Mapa', 'Map'),
    ('mapa', 'map'),
    ('Câmera', 'Camera'),
    ('câmera', 'camera'),
    ('Vetor', 'Vector'),
    ('Tempo', 'Time'),
    ('tempo', 'time'),
    ('Frequência', 'Frequency'),
    ('Comprimento', 'Length'),
    ('Distância', 'Distance'),
    ('distância', 'distance'),
    ('Altura', 'Height'),
    ('altura', 'height'),
    ('Largura', 'Width'),
    ('largura', 'width'),
    ('Cor', 'Color'),
    ('cor', 'color'),
    # Conceitos do jogo (CUIDADO: não toca em texture keys que estão em strings)
    ('vaca', 'cow'),
    ('Vaca', 'Cow'),
    ('vacas', 'cows'),
    ('Vacas', 'Cows'),
    ('boi', 'ox'),
    ('Boi', 'Ox'),
    ('bois', 'oxen'),
    ('Bois', 'Oxen'),
    ('fazendeiro', 'farmer'),
    ('Fazendeiro', 'Farmer'),
    ('fazendeiros', 'farmers'),
    ('Fazendeiros', 'Farmers'),
    ('atirador', 'shooter'),
    ('Atirador', 'Shooter'),
    ('atiradores', 'shooters'),
    ('Atiradores', 'Shooters'),
    ('curral', 'corral'),
    ('Curral', 'Corral'),
    ('currais', 'corrals'),
    ('Currais', 'Corrals'),
    ('nave', 'ship'),
    ('Nave', 'Ship'),
    ('cenário', 'scenery'),
    ('Cenário', 'Scenery'),
    ('combustível', 'fuel'),
    ('Combustível', 'Fuel'),
    ('feixe', 'beam'),
    ('Feixe', 'Beam'),
    ('graviton', 'graviton'),  # já EN
    ('rocha', 'rock'),
    ('Rocha', 'Rock'),
    ('rochas', 'rocks'),
    ('Rochas', 'Rocks'),
    ('moita', 'bush'),
    ('Moita', 'Bush'),
    ('grama', 'grass'),
    ('Grama', 'Grass'),
    ('areia', 'sand'),
    ('Areia', 'Sand'),
    ('terra', 'dirt'),
    ('Terra', 'Dirt'),
    ('água', 'water'),
    ('Água', 'Water'),
    ('cerca', 'fence'),
    ('Cerca', 'Fence'),
    ('cercas', 'fences'),
    ('hambúrguer', 'burger'),
    ('Hambúrguer', 'Burger'),
    ('inimigo', 'enemy'),
    ('Inimigo', 'Enemy'),
    ('inimigos', 'enemies'),
    ('Inimigos', 'Enemies'),
    ('jogo', 'game'),
    ('Jogo', 'Game'),  # cuidado — class name
    ('jogador', 'player'),
    ('Jogador', 'Player'),
    ('chuva', 'rain'),
    ('Chuva', 'Rain'),
    ('neblina', 'fog'),
    ('Neblina', 'Fog'),
    ('neve', 'snow'),
    ('Neve', 'Snow'),
    ('tempestade', 'storm'),
    ('Tempestade', 'Storm'),
    # Adjetivos / pronomes / etc
    ('rápido', 'fast'),
    ('lento', 'slow'),
    ('grande', 'large'),
    ('pequeno', 'small'),
    ('cheio', 'full'),
    ('vazio', 'empty'),
    ('aberto', 'open'),
    ('fechado', 'closed'),
    ('alto', 'high'),
    ('baixo', 'low'),
    ('antes', 'before'),
    ('depois', 'after'),
    ('durante', 'during'),
    ('quando', 'when'),
    ('então', 'then'),
    ('agora', 'now'),
    ('sempre', 'always'),
    ('nunca', 'never'),
    ('mesmo', 'same'),
    ('outro', 'other'),
    ('cada', 'each'),
    ('todos', 'all'),
    ('todas', 'all'),
    ('apenas', 'only'),
    ('também', 'also'),
    ('ainda', 'still'),
    ('mais', 'more'),
    ('menos', 'less'),
    ('entre', 'between'),
    ('dentro', 'inside'),
    ('fora', 'outside'),
    ('acima', 'above'),
    ('abaixo', 'below'),
    ('próximo', 'near'),
    ('próxima', 'near'),
    ('longe', 'far'),
    ('pra', 'to'),
    ('para', 'to'),
    ('com', 'with'),
    ('sem', 'without'),
    ('por', 'by'),
    ('como', 'as'),
    ('só', 'only'),
    ('era', 'was'),
    ('foi', 'was'),
    ('está', 'is'),
    ('tem', 'has'),
    ('é', 'is'),
    ('OK', 'OK'),  # já EN
]

def translate_comment(comment_text):
    """Aplica word substitution dentro do texto do comentário."""
    result = comment_text
    for old, new in WORD_MAP:
        # Word-boundary respeita acentos via \W (não-palavra inclui caracteres especiais)
        # Mas como temos acentos em PT, usar lookahead/lookbehind manuais
        pat = re.compile(r'(?<![A-Za-zÀ-ú0-9_])' + re.escape(old) + r'(?![A-Za-zÀ-ú0-9_])')
        result = pat.sub(new, result)
    return result

# Match // line comments and /* block comments */
LINE_COMMENT_PAT  = re.compile(r'(//[^\n]*)')
BLOCK_COMMENT_PAT = re.compile(r'(/\*[\s\S]*?\*/)')

def process_file(content):
    count = 0
    def repl_line(m):
        nonlocal count
        translated = translate_comment(m.group(0))
        if translated != m.group(0):
            count += 1
        return translated
    def repl_block(m):
        nonlocal count
        translated = translate_comment(m.group(0))
        if translated != m.group(0):
            count += 1
        return translated
    content = BLOCK_COMMENT_PAT.sub(repl_block, content)
    content = LINE_COMMENT_PAT.sub(repl_line, content)
    return content, count

def main():
    files = sorted(JS_DIR.glob('*.js'))
    total = 0
    for f in files:
        original = f.read_text(encoding='utf-8')
        new_content, count = process_file(original)
        if count > 0:
            f.write_text(new_content, encoding='utf-8')
            print(f'  {f.name}: {count} comments translated')
            total += count
    print(f'\nTotal Fase 3a (comments): {total}')

if __name__ == '__main__':
    main()
