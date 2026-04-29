// 18_atmosphere.js — Time of day overlay (gradient vertical) + weather presets
// 6 TOD presets (dawn/day/dusk/sunset/night/midnight) + auto-cycle opcional
// Weather: clear / rain / fog / storm (storm has flash de raio aleatório)
// Tutorial always em "day" + "clear" (não confunde o player)

const TOD_PRESETS = {
    // alpha 0 = without overlay (Day brilhante)
    day:      { top: [0,   0,   0  ], bot: [0,   0,   0  ], alpha: 0.0  },
    // Rosa/lilás top → laranja claro bottom (manhã suave)
    dawn:     { top: [255, 180, 200], bot: [255, 220, 180], alpha: 0.18 },
    // Laranja top → dourado bottom (entardecer)
    dusk:     { top: [255, 140, 80 ], bot: [255, 200, 150], alpha: 0.22 },
    // Vermelho top → roxo bottom (pôr do sol intenso)
    sunset:   { top: [200, 60,  50 ], bot: [120, 50,  100], alpha: 0.32 },
    // Azul escuro top → preto bottom (noite)
    night:    { top: [10,  25,  60 ], bot: [5,   10,  25 ], alpha: 0.48 },
    // Quase preto top→bottom (madrugada)
    midnight: { top: [0,   5,   17 ], bot: [0,   0,   5  ], alpha: 0.66 },
};
const TOD_ORDER = ['dawn', 'day', 'dusk', 'sunset', 'night', 'midnight'];

Object.assign(Jogo.prototype, {

    _setupAtmosphere() {
        // Gradient overlay (depth 195 = below do HUD em 100+ mas above de rain 180)
        this._atmoGfx = this.add.graphics().setScrollFactor(0).setDepth(195);
        // Flash de raio (storm)
        this._atmoFlashGfx = this.add.graphics().setScrollFactor(0).setDepth(196).setVisible(false);
        this._atmoCycleTimer = 0;
        this._atmoCycleDuration = 60000;  // 60s by preset → ciclo de 6min
        this._atmoCurrent = 'day';
        this._scheduleStormFlash();
        // Resize: redesenha gradient cobrindo nova area
        this.scale.on('resize', () => this._drawAtmoGradient(TOD_PRESETS[this._atmoCurrent]));
        this._applyAtmosphere();
    },

    _drawAtmoGradient(p) {
        const w = this.scale.width, h = this.scale.height;
        const g = this._atmoGfx;
        if (!g) return;
        g.clear();
        if (!p || p.alpha <= 0) return;
        const top = (p.top[0] << 16) | (p.top[1] << 8) | p.top[2];
        const bot = (p.bot[0] << 16) | (p.bot[1] << 8) | p.bot[2];
        g.fillGradientStyle(top, top, bot, bot, p.alpha);
        g.fillRect(0, 0, w, h);
    },

    // Applies time of day + weather (chamado when muda preset ou no setup)
    _applyAtmosphere() {
        // Tutorial always em day + clear
        const presetKey = this.tutorialMode ? 'day' : (this.dbg?.fx?.timeOfDay ?? 'day');
        const p = TOD_PRESETS[presetKey] || TOD_PRESETS.day;
        this._drawAtmoGradient(p);
        this._atmoCurrent = presetKey;
        this._applyWeatherPreset();
    },

    _applyWeatherPreset() {
        const cfg = this.dbg?.fx;
        if (!cfg) return;
        const weather = this.tutorialMode ? 'clear' : (cfg.weather ?? 'clear');
        switch (weather) {
            case 'clear':
                cfg.chuva = false;
                cfg.neblina = false;
                cfg.snow = false;
                cfg.vento = false;
                break;
            case 'rain':
                cfg.chuva = true;
                cfg.neblina = false;
                cfg.snow = false;
                cfg.vento = false;
                cfg.chuvaIntensidade = Math.max(0.5, cfg.chuvaIntensidade ?? 0.5);
                break;
            case 'fog':
                cfg.chuva = false;
                cfg.neblina = true;
                cfg.snow = false;
                cfg.vento = false;
                cfg.neblinaIntensidade = Math.max(0.6, cfg.neblinaIntensidade ?? 0.5);
                break;
            case 'snow':
                cfg.chuva = false;
                cfg.neblina = false;
                cfg.snow = true;
                cfg.vento = false;
                cfg.snowCount = Math.max(80, cfg.snowCount ?? 100);
                cfg.snowIntensidade = Math.max(0.7, cfg.snowIntensidade ?? 0.85);
                break;
            case 'storm':
                cfg.chuva = true;
                cfg.neblina = true;
                cfg.snow = false;
                cfg.vento = true;
                cfg.chuvaIntensidade = 1.0;
                cfg.neblinaIntensidade = 0.85;
                cfg.chuvaCount = 250;
                cfg.chuvaVelocidade = 1.8;
                cfg.chuvaTamanho = 1.4;
                cfg.chuvaAngulo = 0.04;
                cfg.ventoForca   = 0.04;
                break;
        }
        if (this._applyFXVisibility) this._applyFXVisibility();
    },

    // Update no loop: avança auto-cycle se ativado
    _atmoUpdate(delta) {
        const cfg = this.dbg?.fx;
        if (!cfg || this.tutorialMode) return;
        if (!cfg.timeAutoCycle) return;
        this._atmoCycleTimer += delta;
        if (this._atmoCycleTimer >= this._atmoCycleDuration) {
            this._atmoCycleTimer = 0;
            const idx = TOD_ORDER.indexOf(this._atmoCurrent);
            const nextKey = TOD_ORDER[(idx + 1) % TOD_ORDER.length];
            cfg.timeOfDay = nextKey;
            if (this._saveDebugCfg) this._saveDebugCfg();
            this._applyAtmosphere();
        }
    },

    _scheduleStormFlash() {
        const next = Phaser.Math.Between(5000, 15000);
        this.time.delayedCall(next, () => {
            // Cena still activates? (this.sys existe enquanto a scene não was destroyed)
            if (!this.sys || !this.sys.isActive()) return;
            if (this.dbg?.fx?.weather === 'storm' && !this.tutorialMode) {
                this._stormFlash();
            }
            this._scheduleStormFlash();
        });
    },

    _stormFlash() {
        const w = this.scale.width, h = this.scale.height;
        const f = this._atmoFlashGfx;
        if (!f) return;
        f.clear();
        f.fillStyle(0xffffff, 0.75);
        f.fillRect(0, 0, w, h);
        f.setVisible(true).setAlpha(0.75);
        this.tweens.add({
            targets: f, alpha: 0,
            duration: 220, ease: 'Cubic.easeIn',
            onComplete: () => { if (f.scene) f.setVisible(false); }
        });
        // Eco curto pro segundo flash do raio
        this.time.delayedCall(280, () => {
            if (this.dbg?.fx?.weather !== 'storm') return;
            f.clear(); f.fillStyle(0xffffff, 0.55); f.fillRect(0, 0, w, h);
            f.setVisible(true).setAlpha(0.55);
            this.tweens.add({
                targets: f, alpha: 0, duration: 180,
                onComplete: () => { if (f.scene) f.setVisible(false); }
            });
        });
    },

});
