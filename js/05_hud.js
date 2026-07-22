// 05_hud.js — HUD: criação e posicionamento dos elementos da interface

Object.assign(Jogo.prototype, {

    _createHUD() {
        // HUD above do atmosphere overlay (depth 195) e do storm flash (196)
        const D = 200, D2 = 201;

        // ── 3 SCORE BOXES V2 (nameless: label PT/EN overlaid via Phaser) ─────
        // Cada box tem 2 zonas: header (top, label) + body (bottom, icon+value)
        // Display ratio aprox 633x205 = ~3.1:1
        const useV2Boxes = this.textures.exists('hud_score_v2');
        const BOX_W = 180, BOX_H = 58;
        // Score (top-center): empty box, label SCORE/PONTOS no header, value no body
        this.hud.scoreBg   = this.add.image(0,0, useV2Boxes ? 'hud_score_v2' : 'hud_score_frame').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.scoreLabel = this.add.text(0,0,'SCORE',{fontSize:'10px',fill:'#aaffcc',fontStyle:'bold',letterSpacing:2}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.scoreText = this.add.text(0,0,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.scoreText    = this.hud.scoreText;

        // ── COWS box (cows abduzidos no beam) ─────────────────
        this.hud.cowsBox   = this.add.image(0, 0, useV2Boxes ? 'hud_cows_v2' : 'hud_cows_box').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.cowsLabel = this.add.text(0,0,'COWS',{fontSize:'10px',fill:'#aaffcc',fontStyle:'bold',letterSpacing:2}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.cowsText  = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        // ── 5 boxes em coluna left: BULLS, COWS, FARMERS, SHOOTERS, BURGERS
        const VAL_STYLE = {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3};
        const LBL_STYLE = {fontSize:'10px', fill:'#aaffcc', fontStyle:'bold', letterSpacing:2};
        // BULLS
        this.hud.bullsBox    = this.add.image(0, 0, 'hud_bulls_v2').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.bullsLabel  = this.add.text(0,0,'BULLS', LBL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.bullsText   = this.add.text(0,0,'0', VAL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        // FARMERS
        this.hud.farmersBox    = this.add.image(0, 0, 'hud_farmers_v2').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.farmersLabel  = this.add.text(0,0,'FARMERS', LBL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.farmersText   = this.add.text(0,0,'0', VAL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        // SHOOTERS
        this.hud.shootersBox    = this.add.image(0, 0, 'hud_shooters_v2').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.shootersLabel  = this.add.text(0,0,'SHOOTERS', LBL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.shootersText   = this.add.text(0,0,'0', VAL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        // BURGERS
        this.hud.burgersBox   = this.add.image(0, 0, useV2Boxes ? 'hud_burgers_v2' : 'hud_burgers_box').setDisplaySize(BOX_W, BOX_H).setScrollFactor(0).setDepth(D);
        this.hud.burgersLabel = this.add.text(0,0,'BURGERS', LBL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.hud.burgersText  = this.add.text(0, 0, '0', VAL_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.counterText   = this.hud.burgersText;  // alias mantido pra _turnIntoBurger

        // Cores de IDENTIDADE (F4, parity Bevy): uma cor amarra contador ↔
        // blip do radar — a linha fica legível sem decodificar o ícone
        this.hud.bullsText.setColor('#9ee62c');     // lime
        this.hud.cowsText.setColor('#ede914');      // amarelo
        this.hud.farmersText.setColor('#609cff');   // azul
        this.hud.shootersText.setColor('#fb2617');  // vermelho (mecha)
        this.hud.burgersText.setColor('#b02df8');   // roxo

        // ── Barras combinadas (PNG unico fuel+graviton, nameless) ───────
        // _empty_nameless = mascara preta + _full-nameless = barras coloridas.
        // Dois fillImg apontam pro mesmo _full, cada um com crop region propria
        // (independencia entre as duas barras). _empty fica embaixo, _full crops
        // por cima conforme pct.
        const HUD_W = 460, HUD_H = 306;  // ratio 1536:1024 ≈ 1.5
        this.hud.combinedBg = this.add.image(0, 0, 'hud_combined_empty')
            .setDisplaySize(HUD_W, HUD_H).setScrollFactor(0).setDepth(D);
        this.hud.combFillImg = this.add.image(0, 0, 'hud_combined_full')
            .setDisplaySize(HUD_W, HUD_H).setScrollFactor(0).setDepth(D + 0.3);
        this.hud.eneFillImg = this.add.image(0, 0, 'hud_combined_full')
            .setDisplaySize(HUD_W, HUD_H).setScrollFactor(0).setDepth(D + 0.3);
        // Bar regions em fractions da texture (medidas via Pillow)
        this.hud.combFillImg._cropRegion = { fx: 0.235, fy: 0.528, fw: 0.521, fh: 0.073 };
        this.hud.eneFillImg._cropRegion  = { fx: 0.278, fy: 0.662, fw: 0.434, fh: 0.064 };
        // Aliases pra _setBarsVisibility e outros consumidores
        this.hud.combImg = this.hud.combinedBg;
        this.hud.eneImg  = this.hud.combinedBg;
        this.hud._combinedHud = true;
        // Labels FUEL/GRAVITON com cor identica aos labels do HUD esquerdo
        // (#aaffcc, fontSize 10px, letterSpacing 2). FUEL fica no espaco preto
        // ACIMA da barra de fuel, GRAVITON fica no espaco preto ABAIXO da
        // barra de graviton (posicionados em _positionHUD).
        this.hud.combLabelBg = this.add.rectangle(0,0,1,1,0x000000,0).setScrollFactor(0).setDepth(D2).setVisible(false);
        this.hud.combLabel   = this.add.text(0,0,'FUEL',{fontSize:'10px',fill:'#aaffcc',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);
        this.hud.eneLabelBg = this.add.rectangle(0,0,1,1,0x000000,0).setScrollFactor(0).setDepth(D2).setVisible(false);
        this.hud.eneLabel   = this.add.text(0,0,'GRAVITON',{fontSize:'10px',fill:'#aaffcc',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);

        // Hint initial removido — tutorial cobre instruções de input.

        // ── Seta indicadora e rastro ──────────────────────────────────
        this.indicatorArrow = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.mouseTrail    = [];
        this.trailGraphic  = this.add.graphics().setDepth(9);

        // ── Radar (canto inferior esquerdo) ───────────────────────────
        // hud_radar_frame: sprite with NSWE marcados; conteúdo (sweep + blips) desenhado inside
        this.hud.miniBg  = this.add.graphics().setScrollFactor(0).setDepth(D - 0.5);  // fundo verde + sweep below do frame
        this.hud.radarFrame = null;  // criado em _positionHUD após sabermos position
        this.hud.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(D);  // blips between fundo e frame
        this._radarAngle = 0;
        // Map de blip → lastSeenAt (timestamp em ms) to fade
        this._radarBlipFades = new Map();

        // Pool de mini sprites holograficos pros blips (reciclados por frame).
        // Substituem os pixels de fillCircle/fillRect — ficam com tint cyan +
        // ADD blend mode -> look holografico inside do dome 3D.
        this._radarHoloPool = [];
        this._radarHoloPoolSize = 32;
        this._radarHoloDome = null;

        // Applies i18n initial nos labels (FUEL/GRAVITON em EN, fuel/GRAVITON em PT)
        if (this._applyHudI18n) this._applyHudI18n();

        // ── COCKPIT FinalHud (fidelidade Bevy) — desktop only ──
        if (!this.isMobile && this.textures.exists('hud_dash_final')) {
            this._createCockpit();
        }
    },

    // ── COCKPIT FinalHud (port de Bevy hud.rs, coordenadas da arte) ──
    // dash_final 2056×541 vira o HUD: contadores nos 5 slots, células de
    // fuel/graviton via off-strips, radar DENTRO do scope, score na placa,
    // joystick vivo e lente do emissor dinâmica. O HUD legado some.
    _createCockpit() {
        this._cockpit = true;
        const D = 200;
        this.hud.ckDash = this.add.image(0, 0, 'hud_dash_final')
            .setOrigin(0.5, 1).setScrollFactor(0).setDepth(D + 0.05);
        // Ícones dos 5 slots (ordem Bevy: BULLS COWS FARMERS MECHA BURGERS)
        const ICONS = [['ox_S', null], ['cow_S', null], ['farmer_S', null],
                       ['mecha_atlas', 'mecha_blue_S'], ['burger_classic', null]];
        this.hud.ckIcons = ICONS.map(([k, f]) => {
            const img = f ? this.add.image(0, 0, k, f) : this.add.image(0, 0, k);
            return img.setScrollFactor(0).setDepth(D + 0.9);
        });
        this.hud.ckOffFuel = this.add.image(0, 0, 'hud_cells_off_fuel')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(D + 0.2);
        this.hud.ckOffGrav = this.add.image(0, 0, 'hud_cells_off_grav')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(D + 0.2);
        this.hud.ckBeamOff = this.add.image(0, 0, 'hud_dash_beam_off')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(D + 0.2);
        this.hud.ckKnob = this.add.image(0, 0, 'hud_joystick_top')
            .setScrollFactor(0).setDepth(D + 0.2).setVisible(false);
        const mkT = (t, color) => this.add.text(0, 0, t, {
            fontFamily: '"VT323", "Courier New", monospace',
            fontSize: '16px', fill: color,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 0.9);
        this.hud.ckFuelLbl  = mkT('PROPULSION REACTOR FUEL', '#ffaa40');
        this.hud.ckGravLbl  = mkT('TRACTOR GRAVITON BEAM PULSE', '#a280ff');
        this.hud.ckScoreLbl = mkT('SCORE', '#00ff55').setOrigin(1, 0.5);
        this._positionCockpit();
        // O _positionHUD legado roda DEPOIS (create e resize) e devolve os
        // textos reutilizados pra row antiga. Como o listener de resize do
        // legado é registrado DEPOIS deste, adiamos 1 tick — o cockpit fala
        // por último nos dois caminhos (boot e resize).
        const ckLate = () => this.time.delayedCall(0, () => {
            if (this._cockpit) this._positionCockpit();
        });
        ckLate();
        this.scale.on('resize', ckLate);
    },

    _positionCockpit() {
        const w = this.scale.width, h = this.scale.height;
        const s = (w * 0.44) / 2056;   // dash_scale do Bevy
        const minX = w / 2 - (2056 * s) / 2, minY = h - 541 * s;
        this._ckScale = s; this._ckMin = { x: minX, y: minY };
        const dpx = (x, y) => ({ x: minX + x * s, y: minY + y * s });

        this.hud.ckDash.setPosition(w / 2, h).setDisplaySize(2056 * s, 541 * s);

        // Contadores REUTILIZADOS nos slots da arte (cores F4 já aplicadas)
        const SLOTS = [[457, 672], [692, 901], [921, 1134], [1155, 1360], [1381, 1592]];
        const texts = [this.hud.bullsText, this.hud.cowsText, this.hud.farmersText,
                       this.hud.shootersText, this.hud.burgersText];
        SLOTS.forEach(([x0, x1], i) => {
            const p = dpx((x0 + 86 + x1 - 40) / 2, 72);
            texts[i].setPosition(p.x, p.y)
                .setFontFamily('"VT323", "Courier New", monospace')
                .setFontSize(Math.max(12, Math.round(58 * s))).setDepth(201);
            const q = dpx(x0 + 44, 72);
            this.hud.ckIcons[i].setPosition(q.x, q.y).setDisplaySize(66 * s, 66 * s);
        });

        // Off-strips (rects da arte: fuel 268-725, grav 1277-1731, y 316-379)
        const of = dpx(268, 316), og = dpx(1277, 316);
        this.hud.ckOffFuel.setPosition(of.x, of.y)
            .setDisplaySize((725 - 268) * s, (379 - 316) * s);
        this.hud.ckOffGrav.setPosition(og.x, og.y)
            .setDisplaySize((1731 - 1277) * s, (379 - 316) * s);

        const bl = dpx(1824, 196);
        this.hud.ckBeamOff.setPosition(bl.x, bl.y).setDisplaySize(176 * s, 176 * s);

        const fl = dpx(512, 226), gl = dpx(1527, 226);
        this.hud.ckFuelLbl.setPosition(fl.x, fl.y).setFontSize(Math.max(9, Math.round(42 * s)));
        this.hud.ckGravLbl.setPosition(gl.x, gl.y).setFontSize(Math.max(8, Math.round(37 * s)));

        // SCORE na placa da arte (zona 1035,476 — Bevy)
        const sc = dpx(1028, 476);
        this.hud.ckScoreLbl.setPosition(sc.x, sc.y).setFontSize(Math.max(10, Math.round(34 * s)));
        if (this.scoreText) {
            this.scoreText.setPosition(dpx(1042, 476).x, sc.y).setOrigin(0, 0.5)
                .setFontFamily('"VT323", "Courier New", monospace')
                .setFontSize(Math.max(10, Math.round(34 * s)))
                .setColor('#00ff55').setDepth(201);
        }

        // Radar DENTRO do scope da arte (centro 1020,278 · disco vivo 133 art px)
        const rc = dpx(1020, 278);
        this._mini = { cx: rc.x, cy: rc.y, rx: 133 * s, ry: 133 * s,
                       maskCx: rc.x, maskCy: rc.y, maskRx: 133 * s, maskRy: 133 * s };
        if (this.hud.radarTerrainImg?.scene) {
            this.hud.radarTerrainImg.setDepth(D_CK_RADAR_TERRAIN)
                .setDisplaySize(266 * s, 266 * s);
        }
        if (this.hud.miniGfx) this.hud.miniGfx.setDepth(D_CK_RADAR_GFX);

        // Esconde o HUD legado (boxes/barras/frame do radar antigo)
        const hide = ['bullsBox','bullsLabel','cowsBox','cowsLabel','farmersBox','farmersLabel',
                      'shootersBox','shootersLabel','burgersBox','burgersLabel','scoreBg','scoreLabel',
                      'combinedBg','combFillImg','eneFillImg','combLabel','eneLabel','miniBg','radarTint'];
        for (const k of hide) if (this.hud[k]) this.hud[k].setVisible(false);
        if (this.hud.radarFrameGfx) this.hud.radarFrameGfx.clear();
    },

    // Por frame: células discretas + lente do emissor + joystick vivo
    _updateCockpit() {
        if (!this._cockpit) return;
        const w = this.scale.width, h = this.scale.height;
        if (this._ckW !== w || this._ckH !== h) {
            this._ckW = w; this._ckH = h;
            this._positionCockpit();
        }
        const s = this._ckScale || 0.3;

        // Células: a arte assa as 12 ACESAS; as apagadas vêm do off-strip
        // via crop. FUEL acende da DIREITA (arte espelhada — Bevy), GRAVITON
        // da esquerda.
        const FUEL = [276,314,351,388,425,461,498,535,572,608,645,682];
        const GRAV = [1285,1321,1358,1395,1432,1469,1505,1542,1578,1614,1651,1688];
        const fLit = Math.round(Phaser.Math.Clamp((this.fuelCurrent || 0) / 100, 0, 1) * 12);
        const gLit = Math.round(Phaser.Math.Clamp((this.energiaLed || 0) / 100, 0, 1) * 12);
        const oF = this.hud.ckOffFuel, oG = this.hud.ckOffGrav;
        if (fLit >= 12) oF.setVisible(false);
        else {
            oF.setVisible(true);
            const bx = fLit <= 0 ? 725 : FUEL[12 - fLit];
            oF.setCrop(0, 0, oF.width * ((bx - 268) / (725 - 268)), oF.height);
        }
        if (gLit >= 12) oG.setVisible(false);
        else {
            oG.setVisible(true);
            const bx = gLit <= 0 ? 1277 : GRAV[gLit];
            const fx = (bx - 1277) / (1731 - 1277);
            oG.setCrop(oG.width * fx, 0, oG.width * (1 - fx), oG.height);
        }

        // Lente do emissor: apagada quando o graviton tá idle
        const beamOn = this.gameStarted && !this.gameOver && this.energiaLed > 0 &&
            (this.isMobile ? !!this._beamHeld : this.input?.activePointer?.isDown);
        this.hud.ckBeamOff.setVisible(!beamOn);

        // Joystick VIVO: só a bola, desloca com a velocidade da nave; no
        // repouso some (a bola baked da arte assume — truque do Bevy)
        const bv = this.ufo?.body?.velocity || { x: 0, y: 0 };
        const dx = Phaser.Math.Clamp(bv.x * 1.2, -14, 14);
        const dy = Phaser.Math.Clamp(bv.y * 1.2, -11, 11);
        const mag = Math.hypot(dx, dy);
        const knob = this.hud.ckKnob;
        if (mag > 0.6) {
            knob.setVisible(true)
                .setAlpha(Phaser.Math.Clamp((mag - 0.6) / 2.4, 0, 1))
                .setPosition(this._ckMin.x + (137 + dx) * s, this._ckMin.y + (229 + dy) * s)
                .setDisplaySize(106 * 1.45 * s, 106 * 1.45 * s);
        } else {
            knob.setVisible(false);
        }

        // Barras antigas re-escondidas (algum caminho legado pode reexibir)
        if (this.hud.combFillImg?.visible) this.hud.combFillImg.setVisible(false);
        if (this.hud.eneFillImg?.visible)  this.hud.eneFillImg.setVisible(false);
    },

    _positionHUD() {
        // COCKPIT on: o layout legado NÃO mexe em nada — o cockpit é dono
        // dos textos reutilizados, do score e do _mini (fim da briga de
        // ordem de listeners no boot/resize)
        if (this._cockpit) { this._positionCockpit(); return; }
        const w = this.scale.width, h = this.scale.height;

        // Boxes V2: header (top) + body (icon+value)
        const HDR_OFF = -19;
        const VAL_OFF = 8;

        // 6 boxes em ROW horizontal no TOP -- bulls/cows/farmers/SCORE/shooters/burgers
        // Score no MEIO da row (4a posicao, idx=3). Tudo na mesma linha.
        // BOX_W=180 + GAP_X=8 -> total 6*180 + 5*8 = 1120px (cabe em 1280+)
        const ROW_Y = 56;  // y do centro de cada box (top do screen)
        const GAP_X = 8;
        const ROW_BOX_W = 180;
        const stackOrder = [
            { box: 'bullsBox',    lbl: 'bullsLabel',    val: 'bullsText',    centered: false },
            { box: 'cowsBox',     lbl: 'cowsLabel',     val: 'cowsText',     centered: false },
            { box: 'farmersBox',  lbl: 'farmersLabel',  val: 'farmersText',  centered: false },
            { box: 'scoreBg',     lbl: 'scoreLabel',    val: 'scoreText',    centered: true  },  // SCORE no meio
            { box: 'shootersBox', lbl: 'shootersLabel', val: 'shootersText', centered: false },
            { box: 'burgersBox',  lbl: 'burgersLabel',  val: 'burgersText',  centered: false },
        ];
        const TOTAL_W = stackOrder.length * ROW_BOX_W + (stackOrder.length - 1) * GAP_X;
        const FIRST_X = Math.round(w/2 - TOTAL_W/2 + ROW_BOX_W/2);
        const VAL_X_OFF = 35;  // value text a direita do icon (boxes com icon a esq)
        stackOrder.forEach((o, i) => {
            const cx = FIRST_X + i * (ROW_BOX_W + GAP_X);
            if (this.hud[o.box]) this.hud[o.box].setPosition(cx, ROW_Y);
            if (this.hud[o.lbl]) this.hud[o.lbl].setPosition(cx, ROW_Y + HDR_OFF);
            // Score: value text centralizado (sem icon). Outros: value a direita do icon
            const valX = o.centered ? cx : (cx + VAL_X_OFF);
            if (this.hud[o.val]) this.hud[o.val].setPosition(valX, ROW_Y + VAL_OFF);
        });

        // Barras: combined PNG OU 2 separados
        if (this.hud._combinedHud && this.hud.combinedBg) {
            const HUD_W = 460, HUD_H = 306;
            const cy = h - HUD_H/2 + 30;  // bottom (alguns 30px do fundo cortados pq PNG has area transparente embaixo)
            this.hud.combinedBg.setPosition(w/2, cy);
            if (this.hud.combFillImg) this.hud.combFillImg.setPosition(w/2, cy);
            if (this.hud.eneFillImg)  this.hud.eneFillImg.setPosition(w/2, cy);
            // Labels nos slots pretos do HUD combined:
            // FUEL fica ACIMA da barra de fuel (espaco preto top do fuel slot)
            // GRAVITON fica ABAIXO da barra de graviton (espaco preto bottom)
            const combR = this.hud.combFillImg?._cropRegion;
            const eneR  = this.hud.eneFillImg?._cropRegion;
            if (combR && this.hud.combLabel) {
                // ~28px acima do top da barra
                const lblY = cy + (combR.fy - 0.5) * HUD_H - 14;
                this.hud.combLabel.setPosition(w/2, lblY);
                this.hud.combLabelBg.setPosition(w/2, lblY);
            }
            if (eneR && this.hud.eneLabel) {
                // ~14px abaixo do bottom da barra
                const lblY = cy + (eneR.fy + eneR.fh - 0.5) * HUD_H + 14;
                this.hud.eneLabel.setPosition(w/2, lblY);
                this.hud.eneLabelBg.setPosition(w/2, lblY);
            }
            // _eneBar/_combBar (compat) — top-left+w+h (mesmo formato do fallback)
            // V2 mede em fractions: top y = cy + (fy - 0.5)*HUD_H
            const combBw = HUD_W * combR.fw;
            const combBh = HUD_H * combR.fh;
            const combBx = w/2 - combBw/2;
            const combBy = cy + (combR.fy - 0.5) * HUD_H;
            this._combBar = { x: combBx, y: combBy, w: combBw, h: combBh };
            const eneBw = HUD_W * eneR.fw;
            const eneBh = HUD_H * eneR.fh;
            const eneBx = w/2 - eneBw/2;
            const eneBy = cy + (eneR.fy - 0.5) * HUD_H;
            this._eneBar = { x: eneBx, y: eneBy, w: eneBw, h: eneBh };
        } else {
            const ENE_Y = h - 104;
            const PAC_Y = h - 36;
            this.hud.eneImg.setPosition(w/2, ENE_Y);
            this.hud.combImg.setPosition(w/2, PAC_Y);
            if (this.hud.eneFillImg)  this.hud.eneFillImg.setPosition(w/2, ENE_Y);
            if (this.hud.combFillImg) this.hud.combFillImg.setPosition(w/2, PAC_Y);
            this._eneBar  = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };
            this._combBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };
            if (this.hud.eneLabel) {
                this.hud.eneLabelBg.setPosition(w/2, ENE_Y - 20);
                this.hud.eneLabel.setPosition(w/2, ENE_Y - 20);
                this.hud.combLabelBg.setPosition(w/2, PAC_Y - 20);
                this.hud.combLabel.setPosition(w/2, PAC_Y - 20);
            }
        }

        // Hint initial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }

        // Radar v2: ring base (metal porthole) + dome glass (overlay).
        // Source: ring 643x367 (ratio 1.75), dome 562x501 (ratio 1.12).
        // Display preserva aspect do ring pra nao distorcer o frame.
        // Inner hollow do ring: ~60% da width / ~50% da height visivel.
        const RING_W = 220;
        const RING_H = Math.round(RING_W * 367 / 643);  // ~126
        const FRAME_W = RING_W, FRAME_H = RING_H;
        const INNER_RX = Math.round(RING_W * 0.32);  // raio horizontal interno
        const INNER_RY = Math.round(RING_H * 0.28);  // raio vertical interno
        const PAD_X = 14, PAD_BOTTOM = 18;
        // Radar agora no canto BOTTOM-RIGHT (era bottom-left)
        const cx = w - PAD_X - RING_W/2;
        const cy = h - PAD_BOTTOM - RING_H/2;
        this._mini = { cx, cy, rx: INNER_RX, ry: INNER_RY, r: INNER_RX };

        // Ring metalico do PNG escondido -- design custom abaixo evita o
        // problema de alinhamento por causa da perspectiva embutida no PNG.
        // Glass dome ja foi destruido em commit anterior.
        if (this.hud.radarRing) {
            this.hud.radarRing.setVisible(false);
        }
        if (this.hud.radarDome) {
            this.hud.radarDome.destroy();
            this.hud.radarDome = null;
        }
        // ── Frame custom do radar (Graphics, sem PNG) ──────────────────
        // Anel escuro com borda externa verde glow + borda interna sutil.
        // Cor matches o tutorial box (0x001a08 fill, 0x00ff55 strokes).
        if (!this.hud.radarFrameGfx) {
            this.hud.radarFrameGfx = this.add.graphics().setScrollFactor(0).setDepth(199.0);
        }
        const fg = this.hud.radarFrameGfx;
        fg.clear();
        // Outer glow (borda larga semi-transparente, da hint de profundidade)
        fg.lineStyle(6, 0x00ff55, 0.10);
        fg.strokeEllipse(cx, cy, INNER_RX * 2 + 26, INNER_RY * 2 + 26);
        // Anel escuro principal (espessura 8px, fill via stroke largo)
        fg.lineStyle(10, 0x001a08, 0.92);
        fg.strokeEllipse(cx, cy, INNER_RX * 2 + 14, INNER_RY * 2 + 14);
        // Borda externa fina verde brilhante
        fg.lineStyle(1.6, 0x00ff55, 0.95);
        fg.strokeEllipse(cx, cy, INNER_RX * 2 + 18, INNER_RY * 2 + 18);
        // Borda interna fina verde (bordo do hollow)
        fg.lineStyle(1.2, 0x00ff55, 0.7);
        fg.strokeEllipse(cx, cy, INNER_RX * 2 + 10, INNER_RY * 2 + 10);
        // 4 mini "rivets" cardinais no anel (pontinhos verdes)
        fg.fillStyle(0x00ff55, 0.85);
        const RIVET_R = 1.6;
        const ring_rx = INNER_RX + 7;
        const ring_ry = INNER_RY + 7;
        fg.fillCircle(cx + ring_rx, cy, RIVET_R);
        fg.fillCircle(cx - ring_rx, cy, RIVET_R);
        fg.fillCircle(cx, cy + ring_ry, RIVET_R);
        fg.fillCircle(cx, cy - ring_ry, RIVET_R);

        // ── Sem mascara: o ring metalico ja "contem" visualmente o conteudo
        // (qualquer leak fica embaixo do metal do ring, depth 199 < 199.5+).
        // GeometryMask era a causa do bug de "radar nao inicializa primeira
        // sessao" (mask shape nao aplicava direito ate scene restart).
        // Se ja existe um mask remanescente de sessao anterior, remove.
        const MASK_RX = INNER_RX * 0.95;
        const MASK_RY = INNER_RY * 0.95;
        if (this._radarMask) {
            if (this.hud.miniBg)  this.hud.miniBg.clearMask();
            if (this.hud.miniGfx) this.hud.miniGfx.clearMask();
            this._radarMask = null;
        }
        if (this._radarMaskShape) {
            this._radarMaskShape.destroy();
            this._radarMaskShape = null;
        }
        // Frame custom symmetric -> cavidade no centro geometrico.
        const CAV_DY = 0;
        // Pos da cavidade pro _updateMinimap (sweep + blips renderizam aqui)
        this._mini.maskCx = cx;
        this._mini.maskCy = cy + CAV_DY;
        this._mini.maskRx = MASK_RX;
        this._mini.maskRy = MASK_RY;

        // Pool de sprites: limpa qualquer mask remanescente
        if (this._radarHoloPool && this._radarHoloPool.length) {
            for (const s of this._radarHoloPool) {
                if (s && s.scene) s.clearMask();
            }
        }

        // ── Fundo alien green vibrante + quadrantes ─────────────────────
        const fcx = cx, fcy = cy + CAV_DY;
        this.hud.miniBg.clear();
        // Base verde-alien escura
        this.hud.miniBg.fillStyle(0x003322, 0.7);
        this.hud.miniBg.fillEllipse(fcx, fcy, MASK_RX * 2, MASK_RY * 2);
        // Glow interno verde vibrante
        this.hud.miniBg.fillStyle(0x00ff66, 0.12);
        this.hud.miniBg.fillEllipse(fcx, fcy, MASK_RX * 2, MASK_RY * 2);
        // Quadrantes: horizontal (E-W) + vertical (N-S) semi-transparente
        this.hud.miniBg.lineStyle(1, 0x66ffaa, 0.45);
        this.hud.miniBg.lineBetween(fcx - MASK_RX, fcy, fcx + MASK_RX, fcy);
        this.hud.miniBg.lineBetween(fcx, fcy - MASK_RY, fcx, fcy + MASK_RY);
        // Aneis concentricos (escala radial)
        this.hud.miniBg.lineStyle(1, 0x66ffaa, 0.25);
        this.hud.miniBg.strokeEllipse(fcx, fcy, MASK_RX * 1.0, MASK_RY * 1.0);
        this.hud.miniBg.strokeEllipse(fcx, fcy, MASK_RX * 0.66, MASK_RY * 0.66);
        this.hud.miniBg.strokeEllipse(fcx, fcy, MASK_RX * 0.33, MASK_RY * 0.33);
        if (this.hud.miniGfx) this.hud.miniGfx.setDepth(200);

        // Pool de mini sprites holograficos pros blips (segue elipse plana)
        if (this._radarHoloPool && this._radarHoloPool.length === 0) {
            for (let i = 0; i < this._radarHoloPoolSize; i++) {
                const tex = this.textures.exists('cow_S') ? 'cow_S' : null;
                if (!tex) break;
                const s = this.add.image(0, 0, tex)
                    .setScrollFactor(0).setDepth(200.5)
                    .setBlendMode(Phaser.BlendModes.ADD)
                    .setVisible(false);
                this._radarHoloPool.push(s);
            }
        }

        // ── Vidro/scanline overlay sutil sobre a cavidade ──
        // Elipse verde transparente cobre SO a cavidade (nao o frame),
        // alpha 0.20 -- da o feel "atras de um vidro fume" sem matar
        // a leitura dos blips. Combina com cor 0x001a08 do tutorial.
        const TINT_RX = INNER_RX * 0.95;
        const TINT_RY = INNER_RY * 0.95;
        if (!this.hud.radarTint) {
            this.hud.radarTint = this.add.ellipse(cx, cy + CAV_DY, TINT_RX*2, TINT_RY*2, 0x001a08, 0.20)
                .setScrollFactor(0).setDepth(201);
        } else {
            this.hud.radarTint.setPosition(cx, cy + CAV_DY)
                .setSize(TINT_RX*2, TINT_RY*2)
                .setDisplaySize(TINT_RX*2, TINT_RY*2);
        }
    },

    // Shows/hides as barras de fuel e graviton (used pelo tutorial)
    _setBarsVisibility(combVisible, gravVisible) {
        if (this.hud.combImg)     this.hud.combImg.setVisible(combVisible);
        if (this.hud.combFill)    this.hud.combFill.setVisible(combVisible);
        if (this.hud.combFillImg) this.hud.combFillImg.setVisible(combVisible);
        if (this.hud.combLabelBg) this.hud.combLabelBg.setVisible(combVisible);
        if (this.hud.combLabel)   this.hud.combLabel.setVisible(combVisible);
        if (this.hud.eneImg)      this.hud.eneImg.setVisible(gravVisible);
        if (this.hud.eneFill)     this.hud.eneFill.setVisible(gravVisible);
        if (this.hud.eneFillImg)  this.hud.eneFillImg.setVisible(gravVisible);
        if (this.hud.eneLabelBg)  this.hud.eneLabelBg.setVisible(gravVisible);
        if (this.hud.eneLabel)    this.hud.eneLabel.setVisible(gravVisible);
    },

    // Updates fill v2 via setCrop — chamado pelos updaters de fuel/graviton
    // pct: 0..1 (proporção atual da barra)
    _updateFillCrop(fillImg, pct) {
        if (!fillImg || !fillImg.scene) return;
        const tex = fillImg.texture;
        const tw = tex.source[0].width;
        const th = tex.source[0].height;
        const p = Math.max(0, Math.min(1, pct));
        if (fillImg._cropRegion) {
            // Combined HUD: crop em region especifica da bar
            const r = fillImg._cropRegion;
            fillImg.setCrop(r.fx * tw, r.fy * th, r.fw * tw * p, r.fh * th);
        } else {
            // Fallback: crop a partir do canto esquerdo full-width
            fillImg.setCrop(0, 0, tw * p, th);
        }
    },

    // Applies i18n aos labels das barras (chamado when lang muda)
    _applyHudI18n() {
        const lang = this.dbg?.behavior?.lang || 'en';
        const labels = {
            en: { fuel:'FUEL', graviton:'GRAVITON', score:'SCORE',
                  bulls:'BULLS', cows:'COWS', farmers:'FARMERS',
                  shooters:'MECHAS', burgers:'BURGERS' },
            pt: { fuel:'COMBUSTÍVEL', graviton:'GRAVITON', score:'PONTOS',
                  bulls:'BOIS', cows:'VACAS', farmers:'FAZENDEIROS',
                  shooters:'MECHAS', burgers:'HAMBURGUERES' },
        };
        const L = labels[lang] || labels.en;
        if (this.hud.combLabel)     this.hud.combLabel.setText(L.fuel);
        if (this.hud.eneLabel)      this.hud.eneLabel.setText(L.graviton);
        if (this.hud.scoreLabel)    this.hud.scoreLabel.setText(L.score);
        if (this.hud.bullsLabel)    this.hud.bullsLabel.setText(L.bulls);
        if (this.hud.cowsLabel)     this.hud.cowsLabel.setText(L.cows);
        if (this.hud.farmersLabel)  this.hud.farmersLabel.setText(L.farmers);
        if (this.hud.shootersLabel) this.hud.shootersLabel.setText(L.shooters);
        if (this.hud.burgersLabel)  this.hud.burgersLabel.setText(L.burgers);
    },

    _updateMinimap() {
        const m = this._mini; if (!m || !this.hud?.miniGfx || !this.ufo) return;
        // Coords da CAVIDADE (mascara) — sweep e blips renderizam aqui to
        // ficar inside do clip do GeometryMask, without leak embaixo do frame.
        const cx = m.maskCx ?? m.cx;
        const cy = m.maskCy ?? m.cy;
        const rx = m.maskRx ?? m.rx;
        const ry = m.maskRy ?? m.ry;
        const W = 8000, H = 6000;
        // RADAR-MINIMAPA (F4, parity Bevy): o disco mostra a ILHA INTEIRA —
        // terreno desenhado + blips em posição ABSOLUTA (a nave se move no mapa)
        const wx = (vx) => cx + (vx / W - 0.5) * 2 * rx;
        const wy = (vy) => cy + (vy / H - 0.5) * 2 * ry;

        // Fundo de terreno: 1 canvas por mapa, recorte elíptico no próprio alpha
        if (!this._radarTerrainBuilt && this.terrainGrid) {
            this._buildRadarTerrainTexture();
            if (this.hud.radarTerrainImg?.scene) this.hud.radarTerrainImg.destroy();
            this.hud.radarTerrainImg = this.add.image(cx, cy, 'radar_terrain')
                .setScrollFactor(0).setDepth(this._cockpit ? D_CK_RADAR_TERRAIN : 199.05)
                .setDisplaySize(rx * 2, ry * 2).setAlpha(0.92);
            // sweep/blips por cima do terreno (e do dash, no cockpit)
            this.hud.miniGfx.setDepth(this._cockpit ? D_CK_RADAR_GFX : 199.5);
            this._radarTerrainBuilt = true;
        }
        if (this.hud.radarTerrainImg?.scene) this.hud.radarTerrainImg.setPosition(cx, cy);
        const inRadar = (x, y) => {
            const u = (x - cx) / rx, v = (y - cy) / ry;
            return u*u + v*v <= 1;
        };

        const g = this.hud.miniGfx;
        g.clear();

        // Sweep angle (continuo)
        const prevAngle = this._radarAngle || 0;
        this._radarAngle = (prevAngle + 0.018) % (Math.PI * 2);
        const sa = this._radarAngle;

        // Triângulo de varredura (leque de ~50°) — alien green vibrante
        const SWEEP = Math.PI * 0.28;
        g.fillStyle(0x00ff66, 0.22);
        g.beginPath();
        g.moveTo(cx, cy);
        for (let i = 0; i <= 16; i++) {
            const a = sa - SWEEP + (SWEEP / 16) * i;
            g.lineTo(cx + Math.cos(a)*rx, cy + Math.sin(a)*ry);
        }
        g.closePath(); g.fillPath();
        // Linha de scan brilhante alien
        g.lineStyle(1.5, 0xaaffcc, 1.0);
        g.lineBetween(cx, cy, cx + Math.cos(sa)*rx, cy + Math.sin(sa)*ry);

        // Decay-based blips: each entidade only "acende" when a sweep line passa by ela.
        // after fade gradual via lastSeenAt timestamp (decay ~2.5s).
        const now = this.time?.now ?? 0;
        const FADE_MS = 2500;
        const fades = this._radarBlipFades;

        // Periodic cleanup do Map (entidades mortas acumulam refs -> mem leak)
        // Cada 60 frames (~1s @ 60fps) varre fades e remove entidades destroyed
        this._radarFadeClean = (this._radarFadeClean || 0) + 1;
        if (this._radarFadeClean >= 60) {
            this._radarFadeClean = 0;
            this._cleanRadarFades();
        }

        // Helper: testa se sweep line passou pelo angulo do blip in this frame
        const sweptThis = (blipAng) => {
            // Normaliza ambos to [0, 2π)
            let prev = ((prevAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let curr = ((sa     % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let b    = ((blipAng% (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            // Se cruzou 0 (prev > curr), divide em 2 segmentos
            if (prev <= curr) return b >= prev && b <= curr;
            return b >= prev || b <= curr;
        };

        // Pool antigo de holo-sprites aposentado (F4: blips = PONTINHOS
        // coloridos, decisão final do Bevy) — mantém escondido
        for (const s of (this._radarHoloPool || [])) s.setVisible(false);

        // Blip = ponto colorido com assento escuro, flash f⁸ no instante do
        // sweep e alpha pow(0.6) que segura opaco e cai no fim (Bevy hud.rs)
        const dot = (ent, exWorld, eyWorld, color, size) => {
            const bx = wx(exWorld), by = wy(eyWorld);
            if (!inRadar(bx, by)) return;
            const ang = Math.atan2(by - cy, bx - cx);
            if (sweptThis(ang)) fades.set(ent, now);
            const last = fades.get(ent);
            if (last == null) return;
            const age = now - last;
            if (age > FADE_MS) { fades.delete(ent); return; }
            const f = 1 - age / FADE_MS;
            const alpha = Math.pow(f, 0.6);
            const flash = Math.pow(f, 8) * 0.7;
            const mix = (ch) => Math.round(ch + (255 - ch) * flash);
            const r = (color >> 16) & 255, gg = (color >> 8) & 255, b = color & 255;
            const c2 = (mix(r) << 16) | (mix(gg) << 8) | mix(b);
            g.fillStyle(0x000000, alpha * 0.45);
            g.fillCircle(bx, by, size * 1.55);
            g.fillStyle(c2, alpha);
            g.fillCircle(bx, by, size * (1 + f * 0.3));
        };

        // Cores de identidade (Bevy): cow amarelo · bull lime · farmer azul ·
        // curral CIANO · mecha vermelho · burger pronto ROXO
        if (this.corrals) for (const c of this.corrals) {
            dot(c, c.x, c.y, 0x00e0d0, 5);
            if (c.slots) for (const slot of c.slots) {
                if (slot && slot.state === 'ready' && !slot._sendoColetado && slot.icon?.scene) {
                    dot(slot, slot.icon.x, slot.icon.y, 0xb02df8, 4);
                }
            }
        }
        if (this.cows) for (const v of this.cows) {
            if (!v.scene || v._destroyed || v.isBurger) continue;
            const col = v.tipo === 'bull' ? 0x9ee62c : 0xede914;
            dot(v, v.x, v.y, col, 3);
        }
        if (this.farmers) for (const f of this.farmers) {
            if (!f.scene || f._destroyed || f._dying) continue;
            dot(f, f.x, f.y, 0x609cff, 3);
        }
        if (this.shooters) for (const at of this.shooters) {
            dot(at, at.x, at.y, 0xfb2617, 4);
        }
        // Itens RAROS (F6): estrela branca (Bevy: white 5.5)
        if (this._rareItems) for (const it of this._rareItems) {
            if (it.sprite?.scene) dot(it, it.sprite.x, it.sprite.y, 0xffffff, 5);
        }

        // Nave — ponto verde ABSOLUTO no mapa + pulso (sempre visível)
        const sx = wx(this.ufo.x), sy = wy(this.ufo.y);
        g.fillStyle(0xaaffcc, 1);
        g.fillCircle(sx, sy, 3.5);
        const pulse = 0.5 + 0.5 * Math.sin(this._radarAngle * 4);
        g.lineStyle(1.2, 0xaaffcc, 0.5 * pulse);
        g.strokeCircle(sx, sy, 6 + pulse * 3);
    },

    // Canvas 1:1 com o grid do terreno (100×75), paleta apagada de radar,
    // cantos fora da elipse transparentes (o disco recorta a si mesmo)
    _buildRadarTerrainTexture() {
        const grd = this.terrainGrid;
        if (!grd) return;
        const ROWS = grd.length, COLS = grd[0].length;
        const cv = document.createElement('canvas');
        cv.width = COLS; cv.height = ROWS;
        const ctx = cv.getContext('2d');
        const img = ctx.createImageData(COLS, ROWS);
        const PAL = [[14, 40, 62], [118, 100, 62], [46, 88, 48], [104, 70, 44]];
        const hC = COLS / 2, hR = ROWS / 2;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const i = (y * COLS + x) * 4;
                const p = PAL[grd[y][x]] || PAL[3];
                const u = (x + 0.5 - hC) / hC, v = (y + 0.5 - hR) / hR;
                img.data[i] = p[0]; img.data[i+1] = p[1]; img.data[i+2] = p[2];
                img.data[i+3] = (u*u + v*v <= 1) ? 235 : 0;
            }
        }
        ctx.putImageData(img, 0, 0);
        if (this.textures.exists('radar_terrain')) this.textures.remove('radar_terrain');
        this.textures.addCanvas('radar_terrain', cv);
    },

    // Cleanup do map de blip fades when entidades morrem (avoids leak)
    _cleanRadarFades() {
        if (!this._radarBlipFades) return;
        for (const entity of this._radarBlipFades.keys()) {
            if (!entity || !entity.scene || entity._destroyed || entity._dying) {
                this._radarBlipFades.delete(entity);
            }
        }
    }

});
