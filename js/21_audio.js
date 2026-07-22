// 21_audio.js — F5 backport: SFX + música com crossfade (parity Bevy audio.rs)
// O jogo era MUDO. WAVs procedurais (gen_sfx.py do Bevy, seed 1991) entram no
// preload (~1.6MB); os 3 MP3s de música (~10MB) são LAZY — carregam depois do
// boot pra não estourar o tempo de load do Pages. WebAudio destrava no 1º
// clique (o splash resolve o autoplay-block do browser).

// Gains por SFX — os mesmos do Bevy audio.rs
const SFX_GAINS = {
    grab: 0.50, drop: 0.45, deliver: 0.55, burger_ready: 0.50, collect: 0.60,
    shot: 0.30, hit: 0.55, explosion: 0.70, thunder: 1.00,
    gameover: 0.75, victory: 0.75, cowbell: 0.50,
};

// Estado → faixa (Bevy music_ctl): splash=menu · night/midnight=noite · resto=dia
const MUSIC_TRACKS = {
    menu:  'Last_Call_at_the_Three_Moons',
    day:   'Aliens_in_the_Cornfield',
    night: 'The_Midnight_Corral',
};

Object.assign(Jogo.prototype, {

    _setupAudio() {
        // Restart-safe: sons do ciclo anterior morrem antes de recriar
        this.sound.removeAll();
        this._audio = { music: {}, loaded: new Set(), loops: {} };

        // Loops (beam/chuva/vento): tocam SEMPRE em volume 0, o update lerpa
        for (const k of ['beam_loop', 'rain_loop', 'wind_loop']) {
            if (this.cache.audio.exists(k)) {
                this._audio.loops[k] = this.sound.add(k, { loop: true, volume: 0 });
            }
        }

        // Música LAZY: baixa os MP3s agora (pós-boot), toca quando chegar
        for (const [state, file] of Object.entries(MUSIC_TRACKS)) {
            const key = 'music_' + state;
            if (this.cache.audio.exists(key)) { this._audio.loaded.add(key); continue; }
            this.load.audio(key, `assets/audio/${file}.mp3`);
        }
        this.load.on('filecomplete', (key) => {
            if (String(key).startsWith('music_')) this._audio.loaded.add(key);
        });
        this.load.start();

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

    // One-shot com o gain do Bevy × master (dbg.audio.sfx, default 0.9)
    _sfx(key, mul = 1) {
        if (!this._audio || this.sound.locked) return;
        if (!this.cache.audio.exists(key)) return;
        const master = this.dbg?.audio?.sfx ?? 0.9;
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

    // Por frame no _updateBody: lerp dos loops + música
    _updateAudio(delta) {
        if (!this._audio) return;
        const dt = Math.min(delta, 100) / 1000;
        const master = this.dbg?.audio?.sfx ?? 0.9;
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

    // Crossfade por estado (Bevy): fim de jogo = silêncio; k = dt×1.2 (~0.8s)
    _updateMusic(dt) {
        const A = this._audio;
        let want = null;
        if (this.gameOver) want = null;
        else if (!this.gameStarted) want = 'music_menu';
        else {
            const tod = this._atmoCurrent || 'day';
            want = (tod === 'night' || tod === 'midnight') ? 'music_night' : 'music_day';
        }
        if (want && !A.loaded.has(want)) want = null;   // ainda baixando

        const masterM = this.dbg?.audio?.music ?? 0.7;
        const k = Math.min(1, dt * 1.2);
        for (const key of Object.keys(A.music)) {
            const s = A.music[key];
            if (!s) continue;
            const target = (key === want) ? masterM : 0;
            s.setVolume(s.volume + (target - s.volume) * k);
            if (key !== want && s.volume < 0.01 && s.isPlaying) s.pause();
        }
        if (want && !this.sound.locked) {
            if (!A.music[want]) {
                A.music[want] = this.sound.add(want, { loop: true, volume: 0 });
                A.music[want].play();
            } else if (!A.music[want].isPlaying) {
                A.music[want].resume();
            }
        }
    },

});
