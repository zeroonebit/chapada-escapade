// 13_terrain_shader.js — Terreno cell-shaded ink+watercolor via fragment shader.
// Recebe terrainGrid como textura RGBA (canal R = altitude * 85), blenda 4 terrenos
// com noise jitter, detecta bordas pra desenhar linhas de "ink", posterize pra cell-shade,
// água ondulando com sin(time).
Object.assign(Jogo.prototype, {

    _setupTerrainShader(W, H) {
        if (!this.terrainGrid) return;
        const COLS = this.terrainGrid[0].length;
        const ROWS = this.terrainGrid.length;

        // ── 1. Empacota terrainGrid em uma textura 40×30 (R = altitude*85)
        const texKey = 'terrain_grid_tex';
        if (this.textures.exists(texKey)) this.textures.remove(texKey);
        const canvas = this.textures.createCanvas(texKey, COLS, ROWS);
        const ctx = canvas.getContext();
        const imgData = ctx.createImageData(COLS, ROWS);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const altitude = this.terrainGrid[y][x]; // 0..3
                const idx = (y * COLS + x) * 4;
                imgData.data[idx]     = altitude * 85; // R
                imgData.data[idx + 1] = 0;             // G
                imgData.data[idx + 2] = 0;             // B
                imgData.data[idx + 3] = 255;           // A
            }
        }
        ctx.putImageData(imgData, 0, 0);
        canvas.refresh();
        // NEAREST filter pra não interpolar altitudes (nós fazemos blend manual)
        canvas.setFilter(Phaser.Textures.FilterMode.NEAREST);

        // ── 2. Fragment shader cell-shaded ink + watercolor
        const fragSrc = `
precision mediump float;

uniform float     iTime;
uniform vec2      iResolution;
uniform sampler2D iChannel0;

varying vec2 fragCoord;

const vec2 GRID_SIZE = vec2(${COLS}.0, ${ROWS}.0);

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
}

float sampleAlt(vec2 uv) {
    // textura tem R = altitude * 85; converte de volta pra 0..3
    return floor(texture2D(iChannel0, uv).r * 3.0 + 0.5);
}

vec3 colorFor(float t) {
    if (t < 0.5) return vec3(45.0, 95.0, 130.0) / 255.0;   // 0 água
    if (t < 1.5) return vec3(235.0, 218.0, 165.0) / 255.0; // 1 areia
    if (t < 2.5) return vec3(105.0, 165.0, 80.0) / 255.0;  // 2 grama
    return vec3(180.0, 95.0, 60.0) / 255.0;                // 3 terra
}

vec3 inkFor(float t) {
    if (t < 0.5) return vec3(15.0, 30.0, 50.0) / 255.0;
    if (t < 1.5) return vec3(120.0, 90.0, 55.0) / 255.0;
    if (t < 2.5) return vec3(40.0, 75.0, 30.0) / 255.0;
    return vec3(80.0, 40.0, 20.0) / 255.0;
}

void main() {
    vec2 uv = fragCoord;

    // Jitter as coords com fbm pra borda orgânica wavy
    float jx = (fbm(uv * GRID_SIZE * 0.6) - 0.5) * 0.06;
    float jy = (fbm(uv * GRID_SIZE * 0.6 + 100.0) - 0.5) * 0.06;
    vec2 jUV = uv + vec2(jx, jy);

    // Pega os 4 cells vizinhos
    vec2 cellPos = jUV * GRID_SIZE - 0.5;
    vec2 cell00uv = (floor(cellPos) + 0.5) / GRID_SIZE;
    vec2 cell10uv = cell00uv + vec2(1.0 / GRID_SIZE.x, 0.0);
    vec2 cell01uv = cell00uv + vec2(0.0, 1.0 / GRID_SIZE.y);
    vec2 cell11uv = cell00uv + vec2(1.0 / GRID_SIZE.x, 1.0 / GRID_SIZE.y);

    float a = sampleAlt(cell00uv);
    float b = sampleAlt(cell10uv);
    float c = sampleAlt(cell01uv);
    float d = sampleAlt(cell11uv);

    // Snap pra altitude dominante (por proximidade dentro do cell)
    vec2 f = fract(cellPos);
    float val;
    if (f.x < 0.5 && f.y < 0.5) val = a;
    else if (f.x >= 0.5 && f.y < 0.5) val = b;
    else if (f.x < 0.5 && f.y >= 0.5) val = c;
    else val = d;

    // Detecta se está perto de borda (altitudes diferentes ao redor)
    bool isBorder = (a != b) || (a != c) || (a != d) || (b != c) || (b != d) || (c != d);

    vec3 baseColor = colorFor(val);
    vec3 finalColor;

    if (isBorder) {
        // Linha de ink
        vec3 ink = inkFor(val);
        // Aproxima da borda? mistura mais ink
        float edgeDist = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        float inkStrength = 1.0 - smoothstep(0.0, 0.35, edgeDist);
        finalColor = mix(baseColor, ink, inkStrength * 0.7);
    } else {
        // Watercolor wash (sutil noise + posterize cell-shade)
        float wash = (fbm(uv * 80.0) - 0.5) * 0.08;
        float edgeDark = (fbm(uv * 200.0) - 0.5) * 0.04;
        finalColor = baseColor + vec3(wash + edgeDark);
        // Posterize 12 steps pra dar cell-shade hard
        finalColor = floor(finalColor * 12.0) / 12.0;
    }

    // Animação de água (só em altitude 0)
    if (val < 0.5) {
        float ripple = sin(uv.x * 40.0 + iTime * 0.8) * 0.025
                     + sin(uv.y * 30.0 + iTime * 0.6) * 0.025
                     + sin((uv.x + uv.y) * 50.0 - iTime * 1.2) * 0.015;
        finalColor += vec3(ripple);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

        // ── 3. Cria BaseShader e adiciona como GameObject cobrindo o mapa
        const baseShader = new Phaser.Display.BaseShader(
            'terrain_cellshade',
            fragSrc
        );

        // add.shader(shader, x, y, width, height)
        this.terrainShader = this.add.shader(baseShader, W / 2, H / 2, W, H);
        this.terrainShader.setSampler2D('iChannel0', texKey, 0);
        this.terrainShader.setDepth(0);
    }

});
