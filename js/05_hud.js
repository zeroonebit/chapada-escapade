// 05_hud.js — HUD: criação e posicionamento dos elementos da interface
Object.assign(Jogo.prototype, {

    _createHUD() {
        // HUD acima do atmosphere overlay (depth 195) e do storm flash (196)
        const D = 200, D2 = 201;

        // ── Score ─────────────────────────────────────────────────────
        // frame limpo (sem dígitos baked-in); número sobreposto pelo código
        this.hud.scoreBg   = this.add.image(0,0,'hud_score_frame').setDisplaySize(200,52).setScrollFactor(0).setDepth(D);
        this.hud.scoreText = this.add.text(0,12,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.scoreText    = this.hud.scoreText;

        // ── COWS box (vacas + bois abduzidos no feixe) ─────────────────
        this.hud.cowsBox  = this.add.image(0, 0, 'hud_cows_box').setDisplaySize(160, 80).setScrollFactor(0).setDepth(D);
        this.hud.cowsText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        // ── BURGERS box (total entregue) ───────────────────────────────
        this.hud.burgersBox  = this.add.image(0, 0, 'hud_burgers_box').setDisplaySize(176, 80).setScrollFactor(0).setDepth(D);
        this.hud.burgersText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.counterText   = this.hud.burgersText;  // alias mantido pra _turnIntoBurger

        // ── Barra Combustível (v2: empty base + full com setCrop dinâmico) ─
        const COMB_W = 380, COMB_H = 68;
        const useV2Comb = this.textures.exists('hud_comb_empty_v2') && this.textures.exists('hud_comb_full_v2');
        if (useV2Comb) {
            this.hud.combImg     = this.add.image(0,0,'hud_comb_empty_v2').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D);
            this.hud.combFillImg = this.add.image(0,0,'hud_comb_full_v2').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else {
            // Fallback pro frame antigo + Graphics fill
            this.hud.combImg  = this.add.image(0,0,'hud_frame_combustivel').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D);
            this.hud.combFill = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
            this.fuelBar = this.hud.combFill;
        }
        this.hud.combLabelBg = this.add.rectangle(0,0,90,18,0x000000,1).setScrollFactor(0).setDepth(D2);
        this.hud.combLabel   = this.add.text(0,0,'FUEL',{fontSize:'12px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);

        // ── Barra Graviton (v2 mesma lógica) ─────────────────────────
        const ENE_W = 290, ENE_H = 72;
        const useV2Ene = this.textures.exists('hud_grav_empty_v2') && this.textures.exists('hud_grav_full_v2');
        if (useV2Ene) {
            this.hud.eneImg     = this.add.image(0,0,'hud_grav_empty_v2').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D);
            this.hud.eneFillImg = this.add.image(0,0,'hud_grav_full_v2').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else {
            this.hud.eneImg  = this.add.image(0,0,'hud_frame_graviton').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D);
            this.hud.eneFill = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
            this.energyBar = this.hud.eneFill;
        }
        this.hud.eneLabelBg = this.add.rectangle(0,0,90,18,0x000000,1).setScrollFactor(0).setDepth(D2);
        this.hud.eneLabel   = this.add.text(0,0,'GRAVITON',{fontSize:'12px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);

        // Hint inicial removido — tutorial cobre instruções de input.

        // ── Seta indicadora e rastro ──────────────────────────────────
        this.indicatorArrow = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.mouseTrail    = [];
        this.trailGraphic  = this.add.graphics().setDepth(9);

        // ── Radar (canto inferior esquerdo) ───────────────────────────
        // hud_radar_frame: sprite com NSWE marcados; conteúdo (sweep + blips) desenhado dentro
        this.hud.miniBg  = this.add.graphics().setScrollFactor(0).setDepth(D - 0.5);  // fundo verde + sweep abaixo do frame
        this.hud.radarFrame = null;  // criado em _positionHUD após sabermos posição
        this.hud.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(D);  // blips entre fundo e frame
        this._radarAngle = 0;
        // Map de blip → lastSeenAt (timestamp em ms) pra fade
        this._radarBlipFades = new Map();

        // Aplica i18n inicial nos labels (FUEL/GRAVITON em EN, COMBUSTÍVEL/GRAVITON em PT)
        if (this._applyHudI18n) this._applyHudI18n();
    },

    _positionHUD() {
        const w = this.scale.width, h = this.scale.height;

        // Score — centro-topo
        this.hud.scoreBg.setPosition(w/2, 28);
        this.hud.scoreText.setPosition(w/2, 32);

        // COWS + BURGERS boxes lado a lado no canto superior esquerdo
        this.hud.cowsBox.setPosition(90, 55);
        this.hud.cowsText.setPosition(122, 62);   // ao lado direito do ícone vaca
        this.hud.burgersBox.setPosition(265, 55);
        this.hud.burgersText.setPosition(300, 62);

        // Barras empilhadas no centro-rodapé com gap visível
        const ENE_Y = h - 60;
        const PAC_Y = h - 18;
        this.hud.eneImg.setPosition(w/2, ENE_Y);
        this.hud.combImg.setPosition(w/2, PAC_Y);
        if (this.hud.eneFillImg)  this.hud.eneFillImg.setPosition(w/2, ENE_Y);
        if (this.hud.combFillImg) this.hud.combFillImg.setPosition(w/2, PAC_Y);

        this._eneBar  = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };
        this._combBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };

        // Labels acima das barras (pintura preta cobre label baked, texto Phaser por cima)
        if (this.hud.eneLabel) {
            this.hud.eneLabelBg.setPosition(w/2, ENE_Y - 22);
            this.hud.eneLabel.setPosition(w/2, ENE_Y - 22);
            this.hud.combLabelBg.setPosition(w/2, PAC_Y - 22);
            this.hud.combLabel.setPosition(w/2, PAC_Y - 22);
        }

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }

        // Radar — Graphics-based (versão original) com decay system novo
        const R = 70, PAD = 14;
        const rx = PAD + R, ry = h - R - PAD - 58 + R/2;
        this._mini = { cx: rx, cy: ry, r: R };

        // Esconde o sprite frame se existir (não usado nessa versão)
        if (this.hud.radarFrame) this.hud.radarFrame.setVisible(false);

        // Redesenha o fundo (estático — só muda no resize)
        this.hud.miniBg.clear();
        this.hud.miniBg.fillStyle(0x000a04, 0.82);
        this.hud.miniBg.fillCircle(rx, ry, R);
        // Círculos concêntricos
        [0.33, 0.66, 1.0].forEach(f => {
            this.hud.miniBg.lineStyle(f === 1.0 ? 1.5 : 0.8, 0x00ff55, f === 1.0 ? 0.8 : 0.25);
            this.hud.miniBg.strokeCircle(rx, ry, R * f);
        });
        // Cruz central
        this.hud.miniBg.lineStyle(0.8, 0x00ff55, 0.2);
        this.hud.miniBg.lineBetween(rx - R, ry, rx + R, ry);
        this.hud.miniBg.lineBetween(rx, ry - R, rx, ry + R);
    },

    // Mostra/esconde as barras de combustível e graviton (usado pelo tutorial)
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

    // Atualiza fill v2 via setCrop — chamado pelos updaters de combustivel/graviton
    // pct: 0..1 (proporção atual da barra)
    _updateFillCrop(fillImg, pct) {
        if (!fillImg || !fillImg.scene) return;
        const tex = fillImg.texture;
        const w = tex.source[0].width;
        const h = tex.source[0].height;
        // Crop revela só a parte esquerda proporcional (resto fica preto = empty)
        fillImg.setCrop(0, 0, Math.max(0, w * pct), h);
    },

    // Aplica i18n aos labels das barras (chamado quando lang muda)
    _applyHudI18n() {
        const lang = this.dbg?.behavior?.lang || 'en';
        const labels = {
            en: { fuel: 'FUEL',         graviton: 'GRAVITON' },
            pt: { fuel: 'COMBUSTÍVEL',  graviton: 'GRAVITON' },
        };
        const L = labels[lang] || labels.en;
        if (this.hud.combLabel) this.hud.combLabel.setText(L.fuel);
        if (this.hud.eneLabel)  this.hud.eneLabel.setText(L.graviton);
    },

    _updateMinimap() {
        const m = this._mini; if (!m || !this.hud?.miniGfx || !this.ship) return;
        const { cx, cy, r } = m;
        const W = 8000, H = 6000;
        const RANGE = Math.max(W, H) * 0.6;
        const wx = (vx) => cx + (vx - this.ship.x) / RANGE * r;
        const wy = (vy) => cy + (vy - this.ship.y) / RANGE * r;
        const inRadar = (x, y) => (x-cx)*(x-cx)+(y-cy)*(y-cy) <= r*r;

        const g = this.hud.miniGfx;
        g.clear();

        // Sweep angle (continuo)
        const prevAngle = this._radarAngle || 0;
        this._radarAngle = (prevAngle + 0.018) % (Math.PI * 2);
        const sa = this._radarAngle;

        // Fundo verde semi-transparente dentro do interior
        g.fillStyle(0x002211, 0.45);
        g.fillCircle(cx, cy, r);

        // Triângulo de varredura (leque de ~50°)
        const SWEEP = Math.PI * 0.28;
        g.fillStyle(0x00ff55, 0.10);
        g.beginPath();
        g.moveTo(cx, cy);
        for (let i = 0; i <= 16; i++) {
            const a = sa - SWEEP + (SWEEP / 16) * i;
            g.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
        }
        g.closePath(); g.fillPath();
        // Linha de scan brilhante
        g.lineStyle(1.5, 0x55ff99, 0.95);
        g.lineBetween(cx, cy, cx + Math.cos(sa)*r, cy + Math.sin(sa)*r);

        // Decay-based blips: cada entidade só "acende" quando a sweep line passa por ela.
        // Depois fade gradual via lastSeenAt timestamp (decay ~2.5s).
        const now = this.time?.now ?? 0;
        const FADE_MS = 2500;
        const fades = this._radarBlipFades;

        // Helper: testa se sweep line passou pelo angulo do blip nesse frame
        const sweptThis = (blipAng) => {
            // Normaliza ambos pra [0, 2π)
            let prev = ((prevAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let curr = ((sa     % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let b    = ((blipAng% (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            // Se cruzou 0 (prev > curr), divide em 2 segmentos
            if (prev <= curr) return b >= prev && b <= curr;
            return b >= prev || b <= curr;
        };

        // Coleta blips e atualiza lastSeenAt se foram varridos agora
        const blips = [];
        const collect = (entity, color, size = 2) => {
            const bx = wx(entity.x), by = wy(entity.y);
            if (!inRadar(bx, by)) return;
            const ang = Math.atan2(by - cy, bx - cx);
            if (sweptThis(ang)) fades.set(entity, now);
            const last = fades.get(entity);
            if (last == null) return;  // ainda não foi visto
            const age = now - last;
            if (age > FADE_MS) { fades.delete(entity); return; }
            const alpha = 1 - (age / FADE_MS);  // 1 → 0 ao longo de FADE_MS
            blips.push({ x: bx, y: by, color, size, alpha });
        };

        if (this.corrals)     for (const c of this.corrals)     collect(c, 0x4499ff, 2.5);
        if (this.cows)       for (const v of this.cows) {
            if (!v.scene || v._destroyed || v.isBurger) continue;
            collect(v, v.tipo === 'boi' ? 0xaa7744 : 0xffffff, 1.8);
        }
        if (this.farmers) for (const f of this.farmers) {
            if (!f.scene || f._destroyed || f._dying) continue;
            collect(f, 0xffdd33, 2);
        }

        // Desenha blips com alpha decay
        for (const b of blips) {
            g.fillStyle(b.color, b.alpha);
            if (b.size === 2.5) g.fillRect(b.x - 2.5, b.y - 2.5, 5, 5);
            else                g.fillCircle(b.x, b.y, b.size);
        }

        // Nave — ponto verde central fixo + pulso (sempre visível)
        g.fillStyle(0x66ff99, 1);
        g.fillCircle(cx, cy, 3);
        const pulse = 0.5 + 0.5 * Math.sin(this._radarAngle * 4);
        g.lineStyle(1, 0x66ff99, 0.4 * pulse);
        g.strokeCircle(cx, cy, 6 + pulse * 3);
    },

    // Cleanup do map de blip fades quando entidades morrem (evita leak)
    _cleanRadarFades() {
        if (!this._radarBlipFades) return;
        for (const entity of this._radarBlipFades.keys()) {
            if (!entity || !entity.scene || entity._destroyed || entity._dying) {
                this._radarBlipFades.delete(entity);
            }
        }
    }

});
