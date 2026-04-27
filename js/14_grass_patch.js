// 14_grass_patch.js — Patch orgânico de grama interativo via fragment shader.
// Cobre uma área central, mask com noise pra forma orgânica, blades de grama
// que "dobram" pela posição do mouse com falloff smoothstep, vento por sin(time).
//
// Nota: usa fragment-only approximation. Verdadeiro vertex displacement (mesh
// subdividido + vertex shader) daria efeito 3D real mas exige Phaser.GameObjects.Mesh
// custom pipeline — bem mais código. Esta versão é visualmente equivalente pra
// um patch top-down e usa só GLSL fragment.
Object.assign(Jogo.prototype, {

    _setupGrassPatch(W, H) {
        const PATCH_W = 900;
        const PATCH_H = 700;

        const fragSrc = `
precision mediump float;

uniform float iTime;
uniform vec2  iResolution;
uniform vec2  uMouse;       // mouse em UV local do patch (0..1)
uniform float uMouseActive; // 0 ou 1 (mouse fora do patch = 0)

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

    // ── 1. Mask orgânica (alpha) via fbm — borda irregular não-circular
    vec2 center = vec2(0.5);
    vec2 toCenter = uv - center;
    float distFromCenter = length(toCenter);
    float patchNoise = fbm(uv * 4.5 + 17.3);
    float threshold = 0.30 + patchNoise * 0.18;
    float patchAlpha = 1.0 - smoothstep(threshold, threshold + 0.10, distFromCenter);
    if (patchAlpha < 0.02) discard;

    // ── 2. Vento (deslocamento sutil contínuo)
    float windPhase = iTime * 1.4 + uv.y * 4.0;
    float windX = sin(windPhase) * 0.004 + sin(iTime * 0.7 + uv.x * 2.0) * 0.003;
    float windY = cos(windPhase * 0.8) * 0.002;

    // ── 3. Pressão do mouse (bend away com smoothstep falloff)
    vec2 toMouse = uv - uMouse;
    float mouseDist = length(toMouse);
    float bendStrength = (1.0 - smoothstep(0.0, 0.18, mouseDist)) * uMouseActive;
    vec2 bendDir = normalize(toMouse + 0.0001);
    // Bend "lean": empurra blades pra fora do mouse com curvatura suave
    vec2 bendOffset = bendDir * bendStrength * 0.05;

    // ── 4. UV deformada pra render dos blades
    vec2 bUV = uv + vec2(windX, windY) + bendOffset;

    // ── 5. Blade pattern — listras finas verticais com variação por noise
    // Aleatorização por blade pra não ficar uniforme
    float bladeColumn = floor(bUV.x * 180.0);
    float bladeRand = hash(vec2(bladeColumn, 0.0));
    float bladeOffsetY = bladeRand * 0.04;
    float bladeMask = sin((bUV.x + bladeRand * 0.01) * 180.0) * 0.5 + 0.5;
    bladeMask = smoothstep(0.55, 0.95, bladeMask);

    // Variação de altura por blade (top mais escuro, base mais clara)
    float vGradient = uv.y + bladeOffsetY;
    float bladeShade = mix(0.55, 1.0, vGradient);

    // Detalhe interno: sub-noise pra textura
    float detail = fbm(uv * 30.0) * 0.15;

    // ── 6. Cor — verde sage pintura watercolor
    vec3 darkGreen  = vec3(0.20, 0.32, 0.12);
    vec3 baseGreen  = vec3(0.42, 0.62, 0.24);
    vec3 lightGreen = vec3(0.62, 0.82, 0.38);

    vec3 color = mix(darkGreen, baseGreen, bladeShade + detail);
    color = mix(color, lightGreen, bladeMask * (1.0 - bendStrength * 0.5));

    // Sombra na zona "pisada" pelo mouse
    color *= mix(1.0, 0.55, bendStrength);

    // Highlight no anel de transição da pressão (efeito de "ar comprimido")
    float ring = smoothstep(0.18, 0.20, mouseDist) - smoothstep(0.20, 0.22, mouseDist);
    color += vec3(ring * 0.18 * uMouseActive);

    // ── 7. Soft edge da patch
    float edgeSoft = smoothstep(threshold + 0.10, threshold, distFromCenter);
    gl_FragColor = vec4(color, edgeSoft);
}
`;

        const baseShader = new Phaser.Display.BaseShader(
            'grass_patch_shader',
            fragSrc,
            undefined,
            {
                uMouse:        { type: '2f', value: { x: 0.5, y: 0.5 } },
                uMouseActive:  { type: '1f', value: 0.0 }
            }
        );

        this.grassShader = this.add.shader(baseShader, W / 2, H / 2, PATCH_W, PATCH_H);
        this.grassShader.setDepth(0.5);

        // Geometria do patch em world coords pra mapear o mouse
        this._grassPatchBox = {
            x0: W / 2 - PATCH_W / 2,
            y0: H / 2 - PATCH_H / 2,
            w:  PATCH_W,
            h:  PATCH_H
        };
    },

    _updateGrassMouse() {
        if (!this.grassShader || !this._grassPatchBox) return;
        // Pega cursor virtual em world space
        const cam = this.cameras.main;
        const wp = cam.getWorldPoint(this.virtualX, this.virtualY);
        const box = this._grassPatchBox;
        const u = (wp.x - box.x0) / box.w;
        const v = (wp.y - box.y0) / box.h;
        const inside = u >= 0 && u <= 1 && v >= 0 && v <= 1;
        this.grassShader.setUniform('uMouse.value', { x: u, y: v });
        this.grassShader.setUniform('uMouseActive.value', inside ? 1.0 : 0.0);
    }

});
