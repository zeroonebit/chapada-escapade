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
    },

    _positionHUD() {
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
                  shooters:'SHOOTERS', burgers:'BURGERS' },
            pt: { fuel:'COMBUSTÍVEL', graviton:'GRAVITON', score:'PONTOS',
                  bulls:'BOIS', cows:'VACAS', farmers:'FAZENDEIROS',
                  shooters:'ESPANTALHOS', burgers:'HAMBURGUERES' },
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
        const RANGE = Math.max(W, H) * 0.6;
        // Mapa world -> elipse da cavidade
        const wx = (vx) => cx + (vx - this.ufo.x) / RANGE * rx;
        const wy = (vy) => cy + (vy - this.ufo.y) / RANGE * ry;
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

        // Pool de mini sprites holograficos: hide tudo, after ativa os
        // necessarios (sprite recycle pattern).
        const pool = this._radarHoloPool || [];
        for (const s of pool) s.setVisible(false);
        let poolIdx = 0;

        // Projecao plana — elipse cozida no frame perspectivo.
        const renderHolo = (entity, texKey, tint, baseScale) => {
            if (poolIdx >= pool.length) return;
            const bx = wx(entity.x), by = wy(entity.y);
            if (!inRadar(bx, by)) return;
            const ang = Math.atan2(by - cy, bx - cx);
            if (sweptThis(ang)) fades.set(entity, now);
            const last = fades.get(entity);
            if (last == null) return;
            const age = now - last;
            if (age > FADE_MS) { fades.delete(entity); return; }
            const alpha = 1 - (age / FADE_MS);

            const s = pool[poolIdx++];
            if (!s.scene) return;
            s.setVisible(true);
            s.setPosition(bx, by);
            if (s.texture.key !== texKey && this.textures.exists(texKey)) {
                s.setTexture(texKey);
            }
            s.setDisplaySize(baseScale, baseScale);
            s.setTint(tint);
            s.setAlpha(alpha * 0.85);
        };

        // corral: square cyan via Graphics, projecao plana
        if (this.corrals) {
            for (const c of this.corrals) {
                const bx = wx(c.x), by = wy(c.y);
                if (!inRadar(bx, by)) continue;
                const ang = Math.atan2(by - cy, bx - cx);
                if (sweptThis(ang)) fades.set(c, now);
                const last = fades.get(c);
                if (last == null) continue;
                const age = now - last;
                if (age > FADE_MS) { fades.delete(c); continue; }
                const alpha = 1 - (age / FADE_MS);
                g.fillStyle(0x4499ff, alpha);
                g.fillRect(bx - 2.5, by - 2.5, 5, 5);
            }
        }

        // Cows + oxen + farmers usam pool de mini sprites holograficos
        if (this.cows) for (const v of this.cows) {
            if (!v.scene || v._destroyed || v.isBurger) continue;
            const isOx = v.tipo === 'bull';
            renderHolo(v,
                isOx ? 'ox_S' : 'cow_S',
                isOx ? 0xddccaa : 0xaaffee,    // ox marrom-clarinho cyan / cow cyan
                18                              // display size em px
            );
        }
        if (this.farmers) for (const f of this.farmers) {
            if (!f.scene || f._destroyed || f._dying) continue;
            renderHolo(f, 'farmer_S', 0xffee99, 18);
        }

        // Ship — ponto verde central fixo + pulso (always visível)
        g.fillStyle(0xaaffcc, 1);
        g.fillCircle(cx, cy, 3.5);
        const pulse = 0.5 + 0.5 * Math.sin(this._radarAngle * 4);
        g.lineStyle(1.2, 0xaaffcc, 0.5 * pulse);
        g.strokeCircle(cx, cy, 6 + pulse * 3);
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
