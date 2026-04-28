// 05_hud.js — HUD: criação e posicionamento dos elementos da interface
Object.assign(Jogo.prototype, {

    _criarHUD() {
        // HUD acima do atmosphere overlay (depth 195) e do storm flash (196)
        const D = 200, D2 = 201;

        // ── Score ─────────────────────────────────────────────────────
        // frame limpo (sem dígitos baked-in); número sobreposto pelo código
        this.hud.scoreBg   = this.add.image(0,0,'hud_score_frame').setDisplaySize(200,52).setScrollFactor(0).setDepth(D);
        this.hud.scoreText = this.add.text(0,12,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoScore    = this.hud.scoreText;

        // ── COWS box (vacas + bois abduzidos no feixe) ─────────────────
        this.hud.cowsBox  = this.add.image(0, 0, 'hud_cows_box').setDisplaySize(160, 80).setScrollFactor(0).setDepth(D);
        this.hud.cowsText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        // ── BURGERS box (total entregue) ───────────────────────────────
        this.hud.burgersBox  = this.add.image(0, 0, 'hud_burgers_box').setDisplaySize(176, 80).setScrollFactor(0).setDepth(D);
        this.hud.burgersText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoContador   = this.hud.burgersText;  // alias mantido pra _virarBurger

        // ── Barra Combustível ─────────────────────────────────────────
        // Frame com label baked → pinta preto sobre label + escreve com Phaser text (i18n dinâmico)
        const combFrameKey = this.textures.exists('hud_combustivel_frame')
            ? 'hud_combustivel_frame' : 'hud_frame_combustivel';
        this.hud.combImg     = this.add.image(0,0,combFrameKey).setDisplaySize(380,68).setScrollFactor(0).setDepth(D);
        this.hud.combFill    = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
        this.hud.combLabelBg = this.add.rectangle(0,0,90,18,0x000000,1).setScrollFactor(0).setDepth(D2);
        this.hud.combLabel   = this.add.text(0,0,'FUEL',{fontSize:'12px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);
        this.barraCombustivel = this.hud.combFill;

        // ── Barra Graviton ────────────────────────────────────────────
        const eneFrameKey = this.textures.exists('hud_graviton_frame')
            ? 'hud_graviton_frame' : 'hud_frame_graviton';
        this.hud.eneImg     = this.add.image(0,0,eneFrameKey).setDisplaySize(290,72).setScrollFactor(0).setDepth(D);
        this.hud.eneFill    = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
        this.hud.eneLabelBg = this.add.rectangle(0,0,90,18,0x000000,1).setScrollFactor(0).setDepth(D2);
        this.hud.eneLabel   = this.add.text(0,0,'GRAVITON',{fontSize:'12px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);
        this.barraEnergia = this.hud.eneFill;

        // Hint inicial removido — tutorial cobre instruções de input.

        // ── Seta indicadora e rastro ──────────────────────────────────
        this.setaIndicadora = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.rastroMouse    = [];
        this.graficoRastro  = this.add.graphics().setDepth(9);

        // ── Radar (canto inferior esquerdo) ───────────────────────────
        // hud_radar_frame: sprite com NSWE marcados; conteúdo (sweep + blips) desenhado dentro
        this.hud.miniBg  = this.add.graphics().setScrollFactor(0).setDepth(D - 0.5);  // fundo verde + sweep abaixo do frame
        this.hud.radarFrame = null;  // criado em _posicionarHUD após sabermos posição
        this.hud.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(D);  // blips entre fundo e frame
        this._radarAngle = 0;
        // Map de blip → lastSeenAt (timestamp em ms) pra fade
        this._radarBlipFades = new Map();

        // Aplica i18n inicial nos labels (FUEL/GRAVITON em EN, COMBUSTÍVEL/GRAVITON em PT)
        if (this._applyHudI18n) this._applyHudI18n();
    },

    _posicionarHUD() {
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

        // Radar — sprite frame + sweep/blips internos
        // Frame PNG é 600x600; usamos display 160x160 (R interno ~62px após borda)
        const FRAME_DISPLAY = 160;
        const R = 62;          // raio do interior verde do sprite (ajustado pra caber dentro do frame)
        const PAD = 14;
        const rx = PAD + FRAME_DISPLAY/2;
        const ry = h - FRAME_DISPLAY/2 - PAD - 58 + R/2;
        this._mini = { cx: rx, cy: ry, r: R };

        // Cria/reposiciona o sprite do frame (uma vez)
        if (!this.hud.radarFrame) {
            const frameKey = this.textures.exists('hud_radar_frame') ? 'hud_radar_frame' : null;
            if (frameKey) {
                this.hud.radarFrame = this.add.image(rx, ry, frameKey)
                    .setDisplaySize(FRAME_DISPLAY, FRAME_DISPLAY)
                    .setScrollFactor(0).setDepth(201);  // acima dos blips
            }
        } else {
            this.hud.radarFrame.setPosition(rx, ry);
        }

        // Fundo (radar interno verde escuro) — desenhado abaixo do frame
        this.hud.miniBg.clear();
        if (!this.hud.radarFrame) {
            // Fallback se sprite faltou
            this.hud.miniBg.fillStyle(0x000a04, 0.82);
            this.hud.miniBg.fillCircle(rx, ry, R);
        }
    },

    // Mostra/esconde as barras de combustível e graviton (usado pelo tutorial)
    _setBarrasVisibility(combVisible, gravVisible) {
        if (this.hud.combImg)     this.hud.combImg.setVisible(combVisible);
        if (this.hud.combFill)    this.hud.combFill.setVisible(combVisible);
        if (this.hud.combLabelBg) this.hud.combLabelBg.setVisible(combVisible);
        if (this.hud.combLabel)   this.hud.combLabel.setVisible(combVisible);
        if (this.hud.eneImg)      this.hud.eneImg.setVisible(gravVisible);
        if (this.hud.eneFill)     this.hud.eneFill.setVisible(gravVisible);
        if (this.hud.eneLabelBg)  this.hud.eneLabelBg.setVisible(gravVisible);
        if (this.hud.eneLabel)    this.hud.eneLabel.setVisible(gravVisible);
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

    _atualizarMinimapa() {
        const m = this._mini; if (!m || !this.hud?.miniGfx || !this.nave) return;
        const { cx, cy, r } = m;
        const W = 8000, H = 6000;
        const RANGE = Math.max(W, H) * 0.6;
        const wx = (vx) => cx + (vx - this.nave.x) / RANGE * r;
        const wy = (vy) => cy + (vy - this.nave.y) / RANGE * r;
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

        if (this.currais)     for (const c of this.currais)     collect(c, 0x4499ff, 2.5);
        if (this.vacas)       for (const v of this.vacas) {
            if (!v.scene || v._destroyed || v.isBurger) continue;
            collect(v, v.tipo === 'boi' ? 0xaa7744 : 0xffffff, 1.8);
        }
        if (this.fazendeiros) for (const f of this.fazendeiros) {
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
