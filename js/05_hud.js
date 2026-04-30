// 05_hud.js — HUD: criação e posicionamento dos elementos da interface

Object.assign(Jogo.prototype, {

    _createHUD() {
        // HUD above do atmosphere overlay (depth 195) e do storm flash (196)
        const D = 200, D2 = 201;

        // ── Score ─────────────────────────────────────────────────────
        // frame limpo (without dígitos baked-in); número sobreposto pelo código
        this.hud.scoreBg   = this.add.image(0,0,'hud_score_frame').setDisplaySize(200,52).setScrollFactor(0).setDepth(D);
        this.hud.scoreText = this.add.text(0,12,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.scoreText    = this.hud.scoreText;

        // ── COWS box (cows + oxen abduzidos no beam) ─────────────────
        this.hud.cowsBox  = this.add.image(0, 0, 'hud_cows_box').setDisplaySize(160, 80).setScrollFactor(0).setDepth(D);
        this.hud.cowsText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        // ── BURGERS box (total entregue) ───────────────────────────────
        this.hud.burgersBox  = this.add.image(0, 0, 'hud_burgers_box').setDisplaySize(176, 80).setScrollFactor(0).setDepth(D);
        this.hud.burgersText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.counterText   = this.hud.burgersText;  // alias mantido to _turnIntoBurger

        // ── Barra Fuel ─────────────────────────────────────────────────
        // Layer 1 (D): _frame com bar-slot preto = mascara baseline "vazio"
        // Layer 2 (D+0.3): _full colorido, cropado from left to pct -> sobe
        // por cima da mascara preta, simulando enchimento.
        // pct=1 -> _full inteiro -> tampa o preto -> bar cheia
        // pct=0 -> crop=0 -> _full some -> mascara preta exposta = vazio
        const COMB_W = 380, COMB_H = 68;
        const useFrameMask = this.textures.exists('hud_combustivel_frame') && this.textures.exists('hud_combustivel_full');
        if (useFrameMask) {
            this.hud.combImg     = this.add.image(0,0,'hud_combustivel_frame').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D);
            this.hud.combFillImg = this.add.image(0,0,'hud_combustivel_full').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else if (this.textures.exists('hud_comb_empty_v2') && this.textures.exists('hud_comb_full_v2')) {
            this.hud.combImg     = this.add.image(0,0,'hud_comb_empty_v2').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D);
            this.hud.combFillImg = this.add.image(0,0,'hud_comb_full_v2').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else {
            this.hud.combImg  = this.add.image(0,0,'hud_frame_combustivel').setDisplaySize(COMB_W, COMB_H).setScrollFactor(0).setDepth(D);
            this.hud.combFill = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
            this.fuelBar = this.hud.combFill;
        }
        this.hud.combLabelBg = this.add.rectangle(0,0,1,1,0x000000,0).setScrollFactor(0).setDepth(D2).setVisible(false);
        this.hud.combLabel   = this.add.text(0,0,'FUEL',{fontSize:'13px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);

        // ── Barra Graviton (mesma logica frame-as-mask) ─────────────
        const ENE_W = 290, ENE_H = 72;
        const useFrameMaskG = this.textures.exists('hud_graviton_frame') && this.textures.exists('hud_graviton_full');
        if (useFrameMaskG) {
            this.hud.eneImg     = this.add.image(0,0,'hud_graviton_frame').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D);
            this.hud.eneFillImg = this.add.image(0,0,'hud_graviton_full').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else if (this.textures.exists('hud_grav_empty_v2') && this.textures.exists('hud_grav_full_v2')) {
            this.hud.eneImg     = this.add.image(0,0,'hud_grav_empty_v2').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D);
            this.hud.eneFillImg = this.add.image(0,0,'hud_grav_full_v2').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D + 0.3).setOrigin(0.5);
        } else {
            this.hud.eneImg  = this.add.image(0,0,'hud_frame_graviton').setDisplaySize(ENE_W, ENE_H).setScrollFactor(0).setDepth(D);
            this.hud.eneFill = this.add.graphics().setScrollFactor(0).setDepth(D + 0.5);
            this.energyBar = this.hud.eneFill;
        }
        // Idem combustivel — PNG v3 com area limpa, overlay Phaser visivel
        this.hud.eneLabelBg = this.add.rectangle(0,0,1,1,0x000000,0).setScrollFactor(0).setDepth(D2).setVisible(false);
        this.hud.eneLabel   = this.add.text(0,0,'GRAVITON',{fontSize:'13px',fill:'#ffffff',fontStyle:'bold',letterSpacing:2})
            .setOrigin(0.5).setScrollFactor(0).setDepth(D2 + 0.5);

        // Hint inicial removido — tutorial cobre instruções de input.

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
        // ADD blend mode -> look holografico dentro do dome 3D.
        this._radarHoloPool = [];
        this._radarHoloPoolSize = 32;
        this._radarHoloDome = null;

        // Applies i18n inicial nos labels (FUEL/GRAVITON em EN, COMBUSTÍVEL/GRAVITON em PT)
        if (this._applyHudI18n) this._applyHudI18n();
    },

    _positionHUD() {
        const w = this.scale.width, h = this.scale.height;

        // Score — centro-topo
        this.hud.scoreBg.setPosition(w/2, 28);
        this.hud.scoreText.setPosition(w/2, 32);

        // COWS + BURGERS boxes lado a lado no canto superior esquerdo
        this.hud.cowsBox.setPosition(90, 55);
        this.hud.cowsText.setPosition(122, 62);   // ao lado direito do ícone cow
        this.hud.burgersBox.setPosition(265, 55);
        this.hud.burgersText.setPosition(300, 62);

        // Barras empilhadas no centro-rodape SEM overlap (cada PNG eh 68 tall em
        // display, precisa de >=68 entre os dois centros). Antes tinha 42 de gap
        // -> PAC label cobria ENE bar fill em 13px.
        const ENE_Y = h - 104;
        const PAC_Y = h - 36;
        this.hud.eneImg.setPosition(w/2, ENE_Y);
        this.hud.combImg.setPosition(w/2, PAC_Y);
        if (this.hud.eneFillImg)  this.hud.eneFillImg.setPosition(w/2, ENE_Y);
        if (this.hud.combFillImg) this.hud.combFillImg.setPosition(w/2, PAC_Y);

        this._eneBar  = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };
        this._combBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };

        // Labels sobre area limpa do PNG v3 (offset -20 do centro do bar
        // bate com bbox do label no source @ scale 1.24-1.33)
        if (this.hud.eneLabel) {
            this.hud.eneLabelBg.setPosition(w/2, ENE_Y - 20);
            this.hud.eneLabel.setPosition(w/2, ENE_Y - 20);
            this.hud.combLabelBg.setPosition(w/2, PAC_Y - 20);
            this.hud.combLabel.setPosition(w/2, PAC_Y - 20);
        }

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }

        // Radar v2 — sprite tilted/perspectivo (radar_frame_v2.png 1024x1024).
        // Source frame visivel 864x564 (aspect 1.53), inner hollow ellipse
        // ~468x238 (aspect 1.97). Display proporcional 220x144 -> inner
        // ellipse aprox 120x60.
        const FRAME_W = 220, FRAME_H = Math.round(FRAME_W * 564 / 864);  // ~144
        const INNER_RX = Math.round(FRAME_W * 234 / 864);   // half-width inner
        const INNER_RY = Math.round(FRAME_H * 119 / 564);   // half-height inner
        const PAD_X = 14, PAD_BOTTOM = 18;  // radar coladinho no rodape (eixos X distintos das bars)
        const cx = PAD_X + FRAME_W/2;
        const cy = h - PAD_BOTTOM - FRAME_H/2;
        // _mini exposes rx/ry pra _updateMinimap projetar elipse + z dome
        this._mini = { cx, cy, rx: INNER_RX, ry: INNER_RY, r: INNER_RX };

        // Cria sprite do radar v2 (lazy — primeira vez ou apos resize)
        if (!this.hud.radarFrameV2 && this.textures.exists('hud_radar_frame_v2')) {
            this.hud.radarFrameV2 = this.add.image(cx, cy, 'hud_radar_frame_v2')
                .setScrollFactor(0).setDepth(199.5).setDisplaySize(FRAME_W, FRAME_H);
        } else if (this.hud.radarFrameV2) {
            this.hud.radarFrameV2.setPosition(cx, cy).setDisplaySize(FRAME_W, FRAME_H);
        }

        // Hide o sprite radar antigo se existir (radar_frame.png v1)
        if (this.hud.radarFrame) this.hud.radarFrame.setVisible(false);

        // Fundo verde escuro dentro da elipse (sem dome 3D)
        this.hud.miniBg.clear();
        this.hud.miniBg.fillStyle(0x002211, 0.55);
        this.hud.miniBg.fillEllipse(cx, cy, INNER_RX * 2, INNER_RY * 2);
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
    },

    // Shows/hides as barras de fuel e graviton (usado pelo tutorial)
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

    // Updates fill v2 via setCrop — chamado pelos updaters de combustivel/graviton
    // pct: 0..1 (proporção atual da barra)
    _updateFillCrop(fillImg, pct) {
        if (!fillImg || !fillImg.scene) return;
        const tex = fillImg.texture;
        const w = tex.source[0].width;
        const h = tex.source[0].height;
        // Crop revela only a parte esquerda proporcional (resto fica preto = empty)
        fillImg.setCrop(0, 0, Math.max(0, w * pct), h);
    },

    // Applies i18n aos labels das barras (chamado when lang muda)
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
        const { cx, cy, rx, ry } = m;
        const r = rx;  // compat (sweep usa raio horizontal)
        const W = 8000, H = 6000;
        const RANGE = Math.max(W, H) * 0.6;
        // Mapa world -> elipse: x usa rx, y usa ry (perspective squash baked)
        const wx = (vx) => cx + (vx - this.ship.x) / RANGE * rx;
        const wy = (vy) => cy + (vy - this.ship.y) / RANGE * ry;
        // Teste elipse: u² + v² <= 1 com u=(x-cx)/rx, v=(y-cy)/ry
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

        // Se o dome shader esta ativo, fundo verde + concentric circles ja vem
        // dele -> pula o desenho do graphics. Senao desenha fallback.
        if (!this._radarHoloDome) {
            g.fillStyle(0x002211, 0.45);
            g.fillCircle(cx, cy, r);
        }

        // Triângulo de varredura (leque de ~50°) — fica acima do dome shader.
        // Sweep usa rx/ry pra varredura ellipse (acompanha tilt do frame)
        const SWEEP = Math.PI * 0.28;
        g.fillStyle(0x55ff99, 0.18);
        g.beginPath();
        g.moveTo(cx, cy);
        for (let i = 0; i <= 16; i++) {
            const a = sa - SWEEP + (SWEEP / 16) * i;
            g.lineTo(cx + Math.cos(a)*rx, cy + Math.sin(a)*ry);
        }
        g.closePath(); g.fillPath();
        // Linha de scan brilhante
        g.lineStyle(1.5, 0x99ffcc, 1.0);
        g.lineBetween(cx, cy, cx + Math.cos(sa)*rx, cy + Math.sin(sa)*ry);

        // Decay-based blips: each entidade only "acende" when a sweep line passa by ela.
        // Depois fade gradual via lastSeenAt timestamp (decay ~2.5s).
        const now = this.time?.now ?? 0;
        const FADE_MS = 2500;
        const fades = this._radarBlipFades;

        // Helper: testa se sweep line passou pelo angulo do blip nesse frame
        const sweptThis = (blipAng) => {
            // Normaliza ambos to [0, 2π)
            let prev = ((prevAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let curr = ((sa     % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            let b    = ((blipAng% (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
            // Se cruzou 0 (prev > curr), divide em 2 segmentos
            if (prev <= curr) return b >= prev && b <= curr;
            return b >= prev || b <= curr;
        };

        // Pool de mini sprites holograficos: hide tudo, depois ativa os
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

        // Curral: square cyan via Graphics, projecao plana
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
            const isOx = v.tipo === 'ox';
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

    // Cleanup do map de blip fades when entidades morrem (evita leak)
    _cleanRadarFades() {
        if (!this._radarBlipFades) return;
        for (const entity of this._radarBlipFades.keys()) {
            if (!entity || !entity.scene || entity._destroyed || entity._dying) {
                this._radarBlipFades.delete(entity);
            }
        }
    }

});
