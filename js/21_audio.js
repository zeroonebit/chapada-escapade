// 21_audio.js — F5 backport: SFX + música com crossfade (parity Bevy audio.rs)
// O jogo era MUDO. WAVs procedurais (gen_sfx.py do Bevy, seed 1991) entram no
// preload (~1.6MB); as 9 faixas de música (~28MB) são SOB DEMANDA — só a que
// vai tocar baixa, uma por vez, fora do boot. WebAudio destrava no 1º clique
// (o splash resolve o autoplay-block do browser).

// Gains por SFX — os mesmos do Bevy audio.rs
const SFX_GAINS = {
    grab: 0.50, drop: 0.45, deliver: 0.55, burger_ready: 0.50, collect: 0.60,
    shot: 0.30, hit: 0.55, explosion: 0.70, thunder: 1.00,
    gameover: 0.75, victory: 0.75, cowbell: 0.50,
};

// Estado → POOL de faixas (splash=menu · night/midnight=noite · resto=dia).
// Eram 3 faixas fixas; com 9 no disco cada estado sorteia do seu pool e roda
// pra próxima quando a faixa acaba — por isso as faixas tocam com loop:false.
const MUSIC_POOLS = {
    menu:  ['Last_Call_at_the_Three_Moons', 'The_Porch_Dog_s_Sigh'],
    day:   ['Aliens_in_the_Cornfield', 'Barnyard_UFO',
            'High_Noon_in_the_Chicken_Coop', 'Run_Until_The_Feathers_Fly',
            'The_Bull_s_Warning'],
    night: ['The_Midnight_Corral', 'The_Heifers_Midnight_Gaze'],
};
const MUSIC_ALL = Object.values(MUSIC_POOLS).flat();

Object.assign(Jogo.prototype, {

    _setupAudio() {
        // Restart-safe: sons do ciclo anterior morrem antes de recriar
        this.sound.removeAll();
        this._audio = {
            music: {}, loaded: new Set(), loading: new Set(), loops: {},
            cur: null, curState: undefined,
        };

        // Loops (beam/chuva/vento): tocam SEMPRE em volume 0, o update lerpa
        for (const k of ['beam_loop', 'rain_loop', 'wind_loop']) {
            if (this.cache.audio.exists(k)) {
                this._audio.loops[k] = this.sound.add(k, { loop: true, volume: 0 });
            }
        }

        // Música: o cache de áudio é do GAME (sobrevive ao scene.restart), então
        // o que já baixou num ciclo anterior entra pronto. O resto vem sob
        // demanda em _ensureTrack — 9 faixas × ~3MB não cabem no boot do Pages.
        for (const stem of MUSIC_ALL) {
            const key = 'music_' + stem;
            if (this.cache.audio.exists(key)) this._audio.loaded.add(key);
        }

        // Loops só tocam após o unlock do WebAudio (1º clique)
        const startLoops = () => {
            if (!this._audio) return;
            for (const s of Object.values(this._audio.loops)) {
                if (s && !s.isPlaying) s.play();
            }
        };
        if (this.sound.locked) this.sound.once('unlocked', startLoops);
        else startLoops();
    },

    // Baixa UMA faixa (a que vai tocar). Retorna true se já dá pra usar.
    _ensureTrack(stem) {
        const key = 'music_' + stem;
        if (this._audio.loaded.has(key)) return true;
        if (this.cache.audio.exists(key)) { this._audio.loaded.add(key); return true; }
        if (this._audio.loading.has(key)) return false;
        this._audio.loading.add(key);
        this.load.audio(key, `assets/audio/${stem}.mp3`);
        this.load.once(`filecomplete-audio-${key}`, () => {
            if (!this._audio) return;
            this._audio.loading.delete(key);
            this._audio.loaded.add(key);
        });
        if (!this.load.isLoading()) this.load.start();
        return false;
    },

    // Sorteia do pool do estado evitando repetir a faixa que acabou de tocar
    _pickTrack(state) {
        const pool = MUSIC_POOLS[state];
        if (!pool || !pool.length) return null;
        const others = pool.filter(t => t !== this._audio.cur);
        const src = others.length ? others : pool;
        return src[(Math.random() * src.length) | 0];
    },

    // One-shot com o gain do Bevy × master (dbg.audio.sfx, default 0.8)
    _sfx(key, mul = 1) {
        if (!this._audio || this.sound.locked) return;
        if (!this.cache.audio.exists(key)) return;
        const master = this.dbg?.audio?.sfx ?? 0.8;
        const gain = (SFX_GAINS[key] ?? 0.5) * master * mul;
        if (gain <= 0.01) return;
        this.sound.play(key, { volume: Math.min(1, gain) });
    },

    // Cowbell com gate de 0.7s (Bevy: só vacas, ao correr/ser abduzida)
    _cowbell() {
        const now = this.time?.now ?? 0;
        if (now - (this._lastCowbellT || 0) < 700) return;
        this._lastCowbellT = now;
        this._sfx('cowbell');
    },

    // Por frame no update() (fora do _updateBody, que nao roda no splash/game
    // over): lerp dos loops + música
    _updateAudio(delta) {
        if (!this._audio) return;
        const dt = Math.min(delta, 100) / 1000;
        const master = this.dbg?.audio?.sfx ?? 0.8;
        const L = this._audio.loops;
        const lerpVol = (s, target) => {
            if (!s) return;
            s.setVolume(s.volume + (target - s.volume) * Math.min(1, dt * 6));
        };
        // Beam hum 0.85 com o feixe ligado (Bevy)
        const beamOn = this.gameStarted && !this.gameOver && this.energiaLed > 0 &&
            (this.isMobile ? !!this._beamHeld : this.input?.activePointer?.isDown);
        lerpVol(L.beam_loop, beamOn ? 0.85 * master : 0);
        // Chuva: 0.20×rain / 0.28×storm, cap 0.35 (Bevy)
        const fx = this.dbg?.fx || {};
        const rainT = fx.rain ? (fx.weather === 'storm' ? 0.28 : 0.20) : 0;
        lerpVol(L.rain_loop, Math.min(0.35, rainT) * master);
        // Vento on/off (Bevy: wind_strength/2.2 × 0.35)
        lerpVol(L.wind_loop, (fx.wind ? 0.20 : 0) * master);

        this._updateMusic(dt);
    },

    // Crossfade por estado (Bevy): fim de jogo = silêncio; k = dt×1.2 (~0.8s).
    // Trocar de estado sorteia faixa nova do pool; faixa que termina sorteia a
    // próxima do MESMO pool (rotação — todas as 9 aparecem jogando).
    _updateMusic(dt) {
        const A = this._audio;
        let state = null;
        if (this.gameOver) state = null;
        else if (!this.gameStarted) state = 'menu';
        else {
            const tod = this._atmoCurrent || 'day';
            state = (tod === 'night' || tod === 'midnight') ? 'night' : 'day';
        }

        // Player do CONFIGS (parity Bevy music_ctl): pausa = silencio, faixa
        // manual toca fixa, 'auto' volta a rotear por estado/TOD.
        const cfgA = this.dbg?.audio || {};
        const manual = (cfgA.track && cfgA.track !== 'auto') ? cfgA.track : null;
        const wasManual = !!A.manual;
        A.manual = !!manual;
        if (!state || cfgA.paused) A.cur = null;
        else if (manual) A.cur = manual;
        else if (state !== A.curState || !A.cur || wasManual) A.cur = this._pickTrack(state);
        A.curState = state;
        if (A.cur) this._ensureTrack(A.cur);

        // Só vira "want" quando o MP3 chegou; até lá o crossfade fica em silêncio
        const want = (A.cur && A.loaded.has('music_' + A.cur)) ? 'music_' + A.cur : null;

        // Cria/reinicia a desejada em volume 0 — o lerp abaixo é quem levanta
        if (want && !this.sound.locked) {
            let s = A.music[want];
            if (!s) s = A.music[want] = this.sound.add(want, { loop: false, volume: 0 });
            if (!s.isPlaying) {
                s.play();
                s.setVolume(0);
                s.off('complete');   // sem acúmulo quando a faixa é retomada
                s.once('complete', () => {
                    if (this._audio !== A) return;
                    A.cur = this._pickTrack(A.curState);
                });
            }
        }

        const masterM = this.dbg?.audio?.music ?? 0.55;
        const k = Math.min(1, dt * 1.2);
        for (const key of Object.keys(A.music)) {
            const s = A.music[key];
            if (!s) continue;
            const target = (key === want) ? masterM : 0;
            s.setVolume(s.volume + (target - s.volume) * k);
            if (key !== want && s.volume < 0.01 && s.isPlaying) s.stop();
        }
    },

    // Player do CONFIGS > AUDIO — port 1:1 do MenuTab::Audio do Bevy.
    // Os botoes nao sao data-cfg (nao mapeiam 1 controle -> 1 valor), entao
    // tem bind proprio; o <select> ja e' bindado pelo menu generico.
    _bindMusicPlayer() {
        const pp   = document.getElementById('mus-playpause');
        const prev = document.getElementById('mus-prev');
        const next = document.getElementById('mus-next');
        const sel  = document.getElementById('mus-track');
        const now  = document.getElementById('mus-now');
        if (!pp || !prev || !next || !sel) return;

        const opts = ['auto', ...MUSIC_ALL];
        const refresh = () => {
            const a = this.dbg.audio;
            pp.innerHTML = a.paused ? '&#9654;' : '&#9208;';   // ▶ / ⏸
            sel.value = a.track;
            if (now) {
                const cur = this._audio?.cur;
                now.textContent = a.paused ? '— paused —'
                    : (cur ? '♪ ' + cur.replace(/_/g, ' ') : '…');
            }
        };
        const step = (d) => {
            const i = Math.max(0, opts.indexOf(this.dbg.audio.track));
            this.dbg.audio.track = opts[(i + d + opts.length) % opts.length];
            this._saveDebugCfg();
            if (this._metaAch) this._metaAch('audiophile');
            refresh();
        };

        pp.addEventListener('click', () => {
            this.dbg.audio.paused = !this.dbg.audio.paused;
            this._saveDebugCfg();
            refresh();
        });
        prev.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        sel.addEventListener('change', () => {
            if (this._metaAch) this._metaAch('audiophile');
            refresh();
        });

        this._musPlayerRefresh = refresh;
        refresh();
    },

});
