// playwright.config.js — suíte de regressão do Chapada Escapade (web/Phaser)
// Roda local e isolada: `npm test`. Sobe o servidor estático em 127.0.0.1:8787
// (tests/serve.cjs), pilota o jogo real em Chromium headless e lê o estado
// pela `window.game` que o 99_main.js já expõe.
//
// Projetos:
//   desktop       1280×800, mouse — jogo completo (splash, tutorial, loop)
//   tablet-touch  1024×768, touch — jogo completo com dedo no lugar do mouse
//   phone-touch   812×375 landscape / 375×812 portrait — modo teaser do index.html
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8787;

module.exports = defineConfig({
    testDir: './tests/e2e',
    // O jogo é pesado (WebGL por software no headless): paralelismo moderado.
    fullyParallel: true,
    workers: process.env.CI ? 2 : 3,
    retries: process.env.CI ? 1 : 0,
    timeout: 120_000,
    expect: { timeout: 15_000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    outputDir: 'test-results',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: 'retain-on-failure',
        video: 'off',
        screenshot: 'only-on-failure',
        // Chromium headless precisa do WebGL por software (SwiftShader) pro
        // Phaser.WEBGL do 99_main.js e do post-FX barrel.
        launchOptions: {
            args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                   '--autoplay-policy=no-user-gesture-required'],
        },
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
            testIgnore: /(touch|phone)\.spec\.js/,
        },
        {
            name: 'tablet-touch',
            // 1024 de largura NÃO cai no failsafe mobile do index.html
            // (max-width 900 / coarse && <1024): jogo completo, só que com touch.
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1024, height: 768 },
                hasTouch: true, isMobile: true,
            },
            testMatch: /touch\.spec\.js/,
        },
        {
            name: 'phone-touch',
            // Mesmo viewport do preset "mobile" do browser embutido (375×812);
            // os testes giram pra landscape quando precisam do jogo rodando.
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 375, height: 812 },
                hasTouch: true, isMobile: true,
                deviceScaleFactor: 2,
            },
            testMatch: /phone\.spec\.js/,
        },
    ],
    webServer: {
        command: `node tests/serve.cjs ${PORT}`,
        url: `http://127.0.0.1:${PORT}/index.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 20_000,
    },
});
