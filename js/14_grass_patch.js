// 14_grass_patch.js — Patch orgânico de grama interativo via fragment shader.
// Versão atual: SIMPLIFICADA pra debug — confirma que shader pipeline renderiza
// antes de adicionar interatividade complexa.
Object.assign(Jogo.prototype, {

    _setupGrassPatch(W, H) {
        const PATCH_W = 900;
        const PATCH_H = 700;

        const fragSrc = `
precision mediump float;

uniform float iTime;
uniform vec2  iResolution;

varying vec2 fragCoord;

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
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
}

void main() {
    vec2 uv = fragCoord;

    // Mask orgânica: distância do centro + noise → forma irregular
    vec2 toCenter = uv - vec2(0.5);
    float distFromCenter = length(toCenter);
    float patchNoise = fbm(uv * 4.5 + 17.3);
    float threshold = 0.30 + patchNoise * 0.18;
    float edgeSoft = smoothstep(threshold + 0.12, threshold - 0.05, distFromCenter);

    // Vento (sutil, contínuo)
    float windPhase = iTime * 1.4 + uv.y * 4.0;
    float windX = sin(windPhase) * 0.005;

    // Blades verticais com vento aplicado
    vec2 bUV = uv + vec2(windX, 0.0);
    float bladeColumn = floor(bUV.x * 160.0);
    float bladeRand = hash(vec2(bladeColumn, 0.0));
    float bladeMask = sin((bUV.x + bladeRand * 0.01) * 160.0) * 0.5 + 0.5;
    bladeMask = smoothstep(0.55, 0.95, bladeMask);

    // Variação tonal por blade
    float bladeShade = mix(0.55, 1.0, uv.y + bladeRand * 0.04);
    float detail = fbm(uv * 30.0) * 0.15;

    // Cores
    vec3 darkGreen  = vec3(0.20, 0.32, 0.12);
    vec3 baseGreen  = vec3(0.42, 0.62, 0.24);
    vec3 lightGreen = vec3(0.62, 0.82, 0.38);
    vec3 color = mix(darkGreen, baseGreen, bladeShade + detail);
    color = mix(color, lightGreen, bladeMask);

    gl_FragColor = vec4(color, edgeSoft);
}
`;

        const baseShader = new Phaser.Display.BaseShader('grass_patch_shader', fragSrc);
        this.grassShader = this.add.shader(baseShader, W / 2, H / 2, PATCH_W, PATCH_H);
        this.grassShader.setDepth(5);  // bem acima de qualquer fundo
    },

    _updateGrassMouse() {
        // No-op por enquanto. Mouse interaction volta depois que confirmar
        // que o shader base tá renderizando.
    }

});
