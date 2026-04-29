// 13_terrain_shader.js — Terreno cell-shaded ink+watercolor via fragment shader.
// Recebe terrainGrid as textura RGBA (canal R = altitude * 85), blenda 4 terrenos
// with noise jitter, detecta bordas to desenhar linhas de "ink", posterize to cell-shade,
// water ondulando with sin(time).
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
        // NEAREST filter to não interpolar altitudes (nós fazemos blend manual)
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
    // textura has R = altitude * 85; converte de volta to 0..3
    return floor(texture2D(iChannel0, uv).r * 3.0 + 0.5);
}

vec3 colorFor(float t) {
    if (t < 0.5) return vec3(45.0, 95.0, 130.0) / 255.0;   // 0 water
    if (t < 1.5) return vec3(235.0, 218.0, 165.0) / 255.0; // 1 sand
    if (t < 2.5) return vec3(105.0, 165.0, 80.0) / 255.0;  // 2 grass
    return vec3(180.0, 95.0, 60.0) / 255.0;                // 3 dirt
}

vec3 inkFor(float t) {
    if (t < 0.5) return vec3(15.0, 30.0, 50.0) / 255.0;
    if (t < 1.5) return vec3(120.0, 90.0, 55.0) / 255.0;
    if (t < 2.5) return vec3(40.0, 75.0, 30.0) / 255.0;
    return vec3(80.0, 40.0, 20.0) / 255.0;
}

void main() {
    // DEBUG MODE: reads textura crua + colore by altitude by cell (without blend)
    vec2 uv = fragCoord;
    float alt = sampleAlt(uv);
    vec3 color = colorFor(alt);
    // Posterize sutil
    color = floor(color * 12.0) / 12.0;
    // Animation de water
    if (alt < 0.5) {
        float ripple = sin(uv.x * 40.0 + iTime * 0.8) * 0.025
                     + sin(uv.y * 30.0 + iTime * 0.6) * 0.025;
        color += vec3(ripple);
    }
    gl_FragColor = vec4(color, 1.0);
}
`;

        // ── 3. Creates BaseShader e adiciona as GameObject cobrindo o map
        const baseShader = new Phaser.Display.BaseShader(
            'terrain_cellshade',
            fragSrc
        );

        // add.shader(shader, x, y, width, height, textures[]) — passa texKey no
        // array to Phaser auto-bindar em iChannel0 (setSampler2D after nem always pega)
        this.terrainShader = this.add.shader(baseShader, W / 2, H / 2, W, H, [texKey]);
        this.terrainShader.setDepth(0);
    }

});
