"""Translate PT comments to EN inside js/ files. Touches ONLY comments, not strings."""
import re, glob

PAIRS = [
    # Common conjunctions/prepositions
    ('também', 'also'),
    ('apenas', 'only'),
    ('através', 'through'),
    ('enquanto', 'while'),
    ('embora', 'although'),
    ('quando', 'when'),
    ('cada', 'each'),
    ('próximo', 'next'),
    ('próxima', 'next'),
    ('agora', 'now'),
    ('antes', 'before'),
    ('depois', 'after'),
    ('então', 'then'),
    ('porque', 'because'),
    ('porém', 'however'),
    ('mesmo', 'same'),
    ('vezes', 'times'),
    # Directions/positions
    ('esquerda', 'left'),
    ('direita', 'right'),
    ('acima', 'above'),
    ('abaixo', 'below'),
    ('entre', 'between'),
    ('dentro', 'inside'),
    ('fora', 'outside'),
    ('frente', 'front'),
    ('atrás', 'back'),
    # Status
    ('feito', 'done'),
    ('pronto', 'ready'),
    ('inicial', 'initial'),
    ('temporário', 'temporary'),
    ('permanente', 'permanent'),
    # Game-specific
    ('vacas', 'cows'),
    ('vaca', 'cow'),
    ('bois', 'oxen'),
    ('boi', 'ox'),
    ('nave', 'ufo'),
    ('disco', 'ufo'),
    ('feixe', 'beam'),
    ('cercas', 'fences'),
    ('cerca', 'fence'),
    ('gado', 'cattle'),
    ('pasto', 'pasture'),
    ('chuva', 'rain'),
    ('neblina', 'fog'),
    ('vento', 'wind'),
    ('paciência', 'patience'),
    ('combustível', 'fuel'),
    ('cenário', 'scenery'),
    ('inimigos', 'enemies'),
    ('inimigo', 'enemy'),
    ('atiradores', 'shooters'),
    ('atirador', 'shooter'),
    ('fazendeiros', 'farmers'),
    ('fazendeiro', 'farmer'),
    ('currais', 'corrals'),
    ('curral', 'corral'),
    ('hambúrguer', 'burger'),
    # UI/UX
    ('arquivo', 'file'),
    ('janela', 'window'),
    ('tela', 'screen'),
    ('borda', 'edge'),
    ('clique', 'click'),
    ('toque', 'touch'),
    ('movimento', 'movement'),
    ('velocidade', 'speed'),
    ('aceleração', 'acceleration'),
    ('força', 'force'),
    ('inércia', 'inertia'),
    ('atrito', 'friction'),
    ('sombra', 'shadow'),
    ('profundidade', 'depth'),
    ('camada', 'layer'),
    ('teste', 'test'),
    # Verbs
    ('precisa', 'needs'),
    ('manter', 'keep'),
    ('mostrar', 'show'),
    ('esconder', 'hide'),
    ('atualizar', 'update'),
    ('processar', 'process'),
    ('executar', 'execute'),
    ('começar', 'start'),
    ('terminar', 'end'),
    ('usado', 'used'),
    ('usada', 'used'),
    # Pronouns/articles (only super-safe ones in comments)
    ('isso', 'this'),
    ('aqueles', 'those'),
    ('essa', 'this'),
    ('esse', 'this'),
    ('essas', 'these'),
    ('esses', 'these'),
    ('aquela', 'that'),
    ('aquele', 'that'),
    # Common shorts
    ('pra', 'to'),
    ('logo', 'then'),
    ('sem', 'without'),
    ('estão', 'are'),
    ('está', 'is'),
    ('seja', 'be'),
    ('pode', 'can'),
    ('podem', 'can'),
    ('deve', 'should'),
    ('devem', 'should'),
    ('tem', 'has'),
    ('têm', 'have'),
    ('vai', 'will'),
    ('vão', 'will'),
    ('nesse', 'in this'),
    ('nessa', 'in this'),
    ('desde', 'since'),
    ('durante', 'during'),
    ('mais', 'more'),
    ('menos', 'less'),
    ('igual', 'equal'),
    ('vazio', 'empty'),
    ('cheio', 'full'),
    ('cheia', 'full'),
    # Game-specific extras
    ('bala', 'bullet'),
    ('balas', 'bullets'),
    ('tiro', 'shot'),
    ('colisão', 'collision'),
    ('colisões', 'collisions'),
    ('obstáculo', 'obstacle'),
    ('largura', 'width'),
    ('altura', 'height'),
    ('tamanho', 'size'),
    # NOT 'cor' (collides with English word "core")
    # NOT 'mais' (collides with arithmetic + English "main")
    # Verbs
    ('evita', 'avoids'),
    ('evitar', 'avoid'),
    ('garante', 'ensures'),
    ('garantir', 'ensure'),
    ('permite', 'allows'),
    ('permitir', 'allow'),
    ('aplica', 'applies'),
    ('aplicar', 'apply'),
    ('aplicado', 'applied'),
    ('aplicada', 'applied'),
    # Technical
    ('função', 'function'),
    ('método', 'method'),
    ('classe', 'class'),
    ('valor', 'value'),
    ('chave', 'key'),
    ('lista', 'list'),
    ('tabela', 'table'),
    ('índice', 'index'),
    ('posição', 'position'),
    ('texto', 'text'),
    ('centro', 'center'),
    ('direção', 'direction'),
    ('evento', 'event'),
    ('elemento', 'element'),
    ('luz', 'light'),
    ('raio', 'radius'),
    # Words that typed wrong elsewhere
    ('paciencia', 'patience'),
    ('combustivel', 'fuel'),
    ('cenario', 'scenery'),
    ('inimigo', 'enemy'),
    ('inimigos', 'enemies'),
]

# Sort longest first to avoid substring collisions
PAIRS.sort(key=lambda p: -len(p[0]))

# Build single regex that captures any PT word
def replace_in_comment(m):
    text = m.group(0)
    for old, new in PAIRS:
        # Word boundary using lookarounds (handles diacritics better than \b)
        text = re.sub(r'(?<![A-Za-zÀ-ÿ])' + re.escape(old) + r'(?![A-Za-zÀ-ÿ])',
                      new, text, flags=re.IGNORECASE)
    return text

# Match comments only (// line OR /* block */)
COMMENT_RE = re.compile(r'//[^\n]*|/\*[\s\S]*?\*/')

changed = 0
for f in sorted(glob.glob('js/*.js')):
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    new_content = COMMENT_RE.sub(replace_in_comment, content)
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(new_content)
        changed += 1
        print('OK:', f)
print(f'Total files changed: {changed}')
