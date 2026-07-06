// 20_quips.js — Random funny one-liners que aparecem como floating text
// when player abduz/mata/passa perto de coisas. Toggle em dbg.fx.quips.
//
// each linha now has mood: r=angry(red) g=funny(green) y=ironic(yellow) b=factual(blue)
// Format: { t: 'text', m: 'g' }

const TONE_COLORS = {
    r: '#ff5566',  // angry / irritada
    g: '#66ff88',  // funny / engraçada
    y: '#ffdd44',  // ironic / ironica
    b: '#66ccff',  // factual / informativa
};

// Quips tema TECH ART (2026-07-06) — o jogo é o protótipo do portfolio ZerO-OneBit,
// entao as piadas agora falam de rig, LOD, UV, shader, instancing etc.
const QUIP_POOLS = {
    en: {
        farmer: [
            { t: 'My rig has no hope bone.', m: 'y' },
            { t: 'This wasn\'t in the GDD.', m: 'y' },
            { t: 'Angry NPC. Blame the level designer.', m: 'g' },
            { t: 'Rage animation: 8 directions.', m: 'b' },
            { t: 'No ragdoll, please.', m: 'r' },
            { t: 'I did the donut tutorial for THIS?', m: 'y' },
            { t: 'My digital twin doesn\'t suffer like this.', m: 'y' },
            { t: 'I\'m 3D-scanning you for the lawsuit!', m: 'r' },
            { t: 'Lost the cow AND the dataset.', m: 'y' },
            { t: 'In Blender this was Ctrl+Z.', m: 'g' },
        ],
        ufo: [
            { t: 'Real-time rendered. Zero bakes.', m: 'b' },
            { t: 'PBR: Physically Based Abduction.', m: 'g' },
            { t: 'Beam with tasteful bloom.', m: 'b' },
            { t: 'Billboards always face you. Always.', m: 'g' },
            { t: 'Draw call from outer space.', m: 'y' },
            { t: 'GPU-instanced abduction.', m: 'b' },
            { t: 'Procedural abduction zone.', m: 'b' },
            { t: 'Aliens skip docs. Straight to nodes.', m: 'g' },
            { t: 'No collider, no mercy.', m: 'r' },
            { t: 'You\'re the next asset.', m: 'r' },
            { t: 'The beam is just an aggressive 3D scanner.', m: 'g' },
            { t: 'Photogrammetry: 360 photos and your cow.', m: 'y' },
            { t: 'Gaussian splat detected. Abducting points.', m: 'b' },
            { t: 'This ship was trained on synthetic data.', m: 'b' },
            { t: 'Long exposure reveals UFOs. Hi.', m: 'g' },
            { t: 'Bortle 1 skies: great for invasions.', m: 'b' },
            { t: 'Not a shooting star. It\'s me.', m: 'y' },
            { t: 'Tracking? I do the tracking here.', m: 'r' },
            { t: 'A 3-gaussian splat: me, the beam, the panic.', m: 'g' },
            { t: 'Stack 200 frames, I\'m still motion-blurred.', m: 'y' },
        ],
        cow: [
            { t: 'Low-poly cow, high-res drama.', m: 'g' },
            { t: 'Panic blendshape at 100%.', m: 'g' },
            { t: '8-direction quadruped. Count the UVs later.', m: 'y' },
            { t: 'Clean topology, dirty fate.', m: 'y' },
            { t: 'Not a mesh anymore. A snack.', m: 'r' },
            { t: 'Cow #42 of the synthetic dataset.', m: 'b' },
            { t: 'My digital twin grazes in peace.', m: 'y' },
            { t: 'Scanned without consent.', m: 'r' },
            { t: 'Ground truth: me, running.', m: 'b' },
            { t: 'Data augmentation: now with fear.', m: 'g' },
            { t: 'Overfitting on grass.', m: 'g' },
            { t: 'A point cloud of myself.', m: 'y' },
        ],
        dairy: [
            { t: 'Milk has no cache. Gone is gone.', m: 'y' },
            { t: 'Dairy pipeline interrupted.', m: 'b' },
            { t: 'Milk shader: actual subsurface.', m: 'b' },
            { t: 'Contents may get culled.', m: 'b' },
            { t: 'No version control for milk.', m: 'y' },
            { t: 'Synthetic milk trains no one.', m: 'y' },
            { t: 'That was a FLIP solver of milk.', m: 'g' },
            { t: 'The milk\'s digital twin still goes sour.', m: 'g' },
        ],
        fence: [
            { t: 'Fence: decorative collider.', m: 'g' },
            { t: 'A bounding box won\'t hold a cow.', m: 'y' },
            { t: 'Defensive level design has failed.', m: 'b' },
            { t: 'The navmesh doesn\'t cover the sky.', m: 'y' },
            { t: 'Next patch: roof with occlusion.', m: 'g' },
            { t: 'Copy to Points: 400 planks, one fence.', m: 'b' },
            { t: 'Scanned, printed, ignored.', m: 'y' },
            { t: 'Blender has a modifier for this.', m: 'g' },
        ],
        burger: [
            { t: 'The cow\'s final LOD.', m: 'g' },
            { t: 'PBR burger: physically based juiciness.', m: 'g' },
            { t: 'From high-poly model to low-poly lunch.', m: 'y' },
            { t: 'Cheese texture: 4K. It deserves it.', m: 'b' },
            { t: 'Order discarded in the z-buffer.', m: 'b' },
            { t: 'Printed at 0.2mm of juiciness.', m: 'g' },
            { t: 'Supports? This burger is self-supporting.', m: 'g' },
            { t: 'Slicer says: bun, beef, cheese, bun.', m: 'b' },
            { t: 'PLA: Prime Layer of Angus.', m: 'g' },
            { t: 'UV-cured, like resin.', m: 'y' },
        ],
        church: [
            { t: 'Not even the lightmap can save us.', m: 'y' },
            { t: 'Pray for stable framerate.', m: 'g' },
            { t: 'Global illumination, literally.', m: 'b' },
            { t: 'Miracles are not in the changelog.', m: 'y' },
            { t: 'This wasn\'t in the docs.', m: 'g' },
            { t: 'You can see the Milky Way from here. And you.', m: 'b' },
            { t: 'God doesn\'t use a denoiser.', m: 'y' },
            { t: 'The priest took up astrophotography tonight.', m: 'g' },
        ],
        cactus: [
            { t: 'Cactus: 12 tris, zero fear.', m: 'b' },
            { t: 'Vertex by vertex, still standing.', m: 'b' },
            { t: 'Didn\'t even get billboarded.', m: 'y' },
            { t: 'Instance #4087.', m: 'b' },
            { t: 'Tech artists…', m: 'y' },
            { t: 'Procedurally sculpted. No mercy.', m: 'b' },
            { t: 'A Blender user would make me with one modifier.', m: 'y' },
            { t: 'I was scattered by attribute.', m: 'b' },
        ],
        generic: [
            { t: 'Procedural, even the crimes.', m: 'g' },
            { t: 'Instanced, not duplicated.', m: 'b' },
            { t: 'No UV overlap, no witnesses.', m: 'g' },
            { t: 'All this runs in your browser. You\'re welcome.', m: 'y' },
            { t: 'New seed, same chaos.', m: 'y' },
            { t: 'Wang tiles silently judging.', m: 'g' },
            { t: 'The normal map saw everything.', m: 'y' },
            { t: 'Made with nodes and bad intentions.', m: 'g' },
            { t: 'Optimized to abduct at 60 fps.', m: 'b' },
            { t: 'Cooked live, no cache.', m: 'g' },
            { t: 'All of this is one malicious HDA.', m: 'g' },
            { t: 'VEX: Very EXtracted cows.', m: 'g' },
            { t: 'A For-Each loop of problems.', m: 'y' },
            { t: 'Press H, the camera finds the chaos.', m: 'g' },
            { t: 'A Blender user would render this for free.', m: 'y' },
            { t: 'The donut tutorial prepared no one for this.', m: 'g' },
            { t: 'A radiance field of crime.', m: 'g' },
            { t: 'The whole Cerrado in gaussian splats: 2GB.', m: 'b' },
            { t: '100% synthetic data. 0% cow consent.', m: 'y' },
            { t: 'Training the network on your despair.', m: 'r' },
            { t: 'Epoch 47: the AI learned to flee.', m: 'g' },
            { t: 'The farm\'s digital twin is also panicking.', m: 'y' },
            { t: 'Photogrammetry works better if you don\'t run.', m: 'b' },
            { t: 'Resin printed, IPA washed.', m: 'b' },
            { t: 'Polar alignment: perfect for abductions.', m: 'b' },
            { t: 'This renders faster than Cycles.', m: 'y' },
        ],
    },
    pt: {
        farmer: [
            { t: 'Meu rig não veio com bone de esperança.', m: 'y' },
            { t: 'Isso não tava no GDD.', m: 'y' },
            { t: 'NPC bravo. Culpa do level designer.', m: 'g' },
            { t: 'Animação de fúria: 8 direções.', m: 'b' },
            { t: 'Ragdoll não, por favor.', m: 'r' },
            { t: 'Fiz o tutorial do donut pra isso?', m: 'y' },
            { t: 'Meu gêmeo digital não sofre assim.', m: 'y' },
            { t: 'Vou te escanear em 3D pro processo!', m: 'r' },
            { t: 'Perdi a vaca E o dataset.', m: 'y' },
            { t: 'No Blender isso era Ctrl+Z.', m: 'g' },
        ],
        ufo: [
            { t: 'Renderizado em tempo real. Zero bake.', m: 'b' },
            { t: 'PBR: Physically Based Rapto.', m: 'g' },
            { t: 'Feixe com bloom no capricho.', m: 'b' },
            { t: 'Billboard sempre te encara. Sempre.', m: 'g' },
            { t: 'Draw call vindo do espaço.', m: 'y' },
            { t: 'Abdução instanciada na GPU.', m: 'b' },
            { t: 'Zona de abdução procedural.', m: 'b' },
            { t: 'Alien não lê doc. Vai direto nos nodes.', m: 'g' },
            { t: 'Sem collider, sem piedade.', m: 'r' },
            { t: 'Você é o próximo asset.', m: 'r' },
            { t: 'O feixe é só um scanner 3D agressivo.', m: 'g' },
            { t: 'Fotogrametria: 360 fotos e a sua vaca.', m: 'y' },
            { t: 'Gaussian splat detectado. Abduzindo pontos.', m: 'b' },
            { t: 'Nave treinada em dados sintéticos.', m: 'b' },
            { t: 'Longa exposição revela OVNIs. Oi.', m: 'g' },
            { t: 'Céu Bortle 1: ótimo pra invadir.', m: 'b' },
            { t: 'Não é estrela cadente. Sou eu.', m: 'y' },
            { t: 'Tracking? Aqui quem trackeia sou eu.', m: 'r' },
            { t: 'Splat de 3 gaussianas: eu, o feixe e o pânico.', m: 'g' },
            { t: 'Stack de 200 frames e ainda saio borrado.', m: 'y' },
        ],
        cow: [
            { t: 'Vaca low-poly, drama high-res.', m: 'g' },
            { t: 'Blendshape de pânico em 100%.', m: 'g' },
            { t: 'Quadrúpede em 8 direções. Conta as UVs depois.', m: 'y' },
            { t: 'Topologia limpa, destino sujo.', m: 'y' },
            { t: 'Não é mais mesh. É lanche.', m: 'r' },
            { t: 'Vaca nº 42 do dataset sintético.', m: 'b' },
            { t: 'Meu gêmeo digital pasta em paz.', m: 'y' },
            { t: 'Escaneada sem consentimento.', m: 'r' },
            { t: 'Ground truth: eu, correndo.', m: 'b' },
            { t: 'Data augmentation: agora com medo.', m: 'g' },
            { t: 'Overfitting em capim.', m: 'g' },
            { t: 'Point cloud de mim mesma.', m: 'y' },
        ],
        dairy: [
            { t: 'Leite não tem cache. Sumiu, sumiu.', m: 'y' },
            { t: 'Pipeline láctea interrompida.', m: 'b' },
            { t: 'Shader de leite: subsurface de verdade.', m: 'b' },
            { t: 'Conteúdo pode ser culled.', m: 'b' },
            { t: 'Leite não tem controle de versão.', m: 'y' },
            { t: 'Leite sintético não treina ninguém.', m: 'y' },
            { t: 'Isso era um FLIP solver de leite.', m: 'g' },
            { t: 'Gêmeo digital do leite: azeda igual.', m: 'g' },
        ],
        fence: [
            { t: 'Cerca: collider decorativo.', m: 'g' },
            { t: 'Bounding box não segura vaca.', m: 'y' },
            { t: 'Level design defensivo falhou.', m: 'b' },
            { t: 'O navmesh não cobre o céu.', m: 'y' },
            { t: 'Próximo patch: teto com oclusão.', m: 'g' },
            { t: 'Copy to Points: 400 traves, 1 cerca.', m: 'b' },
            { t: 'Escaneada, impressa, ignorada.', m: 'y' },
            { t: 'No Blender tem modifier pra isso.', m: 'g' },
        ],
        burger: [
            { t: 'O LOD final da vaca.', m: 'g' },
            { t: 'Burger PBR: suculência fisicamente correta.', m: 'g' },
            { t: 'Do high-poly pro lanche low-poly.', m: 'y' },
            { t: 'Textura do queijo: 4K. Merece.', m: 'b' },
            { t: 'Pedido descartado no z-buffer.', m: 'b' },
            { t: 'Impresso em camadas de 0.2mm de suculência.', m: 'g' },
            { t: 'Suporte? Esse burger é self-supporting.', m: 'g' },
            { t: 'Slicer diz: pão, carne, queijo, pão.', m: 'b' },
            { t: 'PLA: Picanha em Layer Adhesion.', m: 'g' },
            { t: 'Curado em UV, que nem resina.', m: 'y' },
        ],
        church: [
            { t: 'Nem o lightmap salva agora.', m: 'y' },
            { t: 'Reza pra não dropar frame.', m: 'g' },
            { t: 'Iluminação global, literalmente.', m: 'b' },
            { t: 'Milagre não tá no changelog.', m: 'y' },
            { t: 'Isso não tava na documentação.', m: 'g' },
            { t: 'Daqui se vê a Via Láctea. E você.', m: 'b' },
            { t: 'Deus não usa denoiser.', m: 'y' },
            { t: 'O padre virou astrofotógrafo hoje.', m: 'g' },
        ],
        cactus: [
            { t: 'Cacto: 12 tris, zero medo.', m: 'b' },
            { t: 'Vértice por vértice, sigo de pé.', m: 'b' },
            { t: 'Nem billboard me fizeram.', m: 'y' },
            { t: 'Instância nº 4087.', m: 'b' },
            { t: 'Artistas técnicos…', m: 'y' },
            { t: 'Esculpido procedural. Sem dó.', m: 'b' },
            { t: 'Usuário de Blender me faria com 1 modifier.', m: 'y' },
            { t: 'Fui scattered por atributo.', m: 'b' },
        ],
        generic: [
            { t: 'Procedural até no crime.', m: 'g' },
            { t: 'Instanciado, não duplicado.', m: 'b' },
            { t: 'Sem UV overlap, sem testemunha.', m: 'g' },
            { t: 'Isso tudo roda no browser. De nada.', m: 'y' },
            { t: 'Seed nova, caos igual.', m: 'y' },
            { t: 'Wang tiles julgando em silêncio.', m: 'g' },
            { t: 'O normal map viu tudo.', m: 'y' },
            { t: 'Feito com nodes e má intenção.', m: 'g' },
            { t: 'Otimizado pra abduzir a 60 fps.', m: 'b' },
            { t: 'Cookado ao vivo, sem cache.', m: 'g' },
            { t: 'Isso tudo é um HDA mal-intencionado.', m: 'g' },
            { t: 'VEX: Vacas EXtraídas.', m: 'g' },
            { t: 'For-Each de problemas.', m: 'y' },
            { t: 'Aperta H que a câmera acha o caos.', m: 'g' },
            { t: 'Usuário de Blender renderizava isso de graça.', m: 'y' },
            { t: 'Tutorial do donut não preparou ninguém pra isso.', m: 'g' },
            { t: 'Radiance field do crime.', m: 'g' },
            { t: 'O Cerrado inteiro em gaussian splats: 2GB.', m: 'b' },
            { t: 'Dados 100% sintéticos. Vacas 0% consentidas.', m: 'y' },
            { t: 'Treinando a rede com o seu desespero.', m: 'r' },
            { t: 'Epoch 47: a IA aprendeu a fugir.', m: 'g' },
            { t: 'Digital twin da fazenda: também em pânico.', m: 'y' },
            { t: 'Fotogrametria funciona melhor parado.', m: 'b' },
            { t: 'Impresso em resina, lavado no IPA.', m: 'b' },
            { t: 'Alinhamento polar perfeito pra abdução.', m: 'b' },
            { t: 'Isso renderiza mais rápido que o Cycles.', m: 'y' },
        ],
    },
};

// Cooldowns (ms): por categoria de source + global
const QUIP_COOLDOWN_SOURCE = {
    cow: 8000, farmer: 0, dairy: 12000, fence: 15000,
    burger: 6000, church: 30000, cactus: 25000, generic: 0,
};
const QUIP_GLOBAL_COOLDOWN = 3000;

// Quips exclusivos do mobile teaser (saem do ufo voador)
const MOBILE_QUIPS = {
    en: [
        { t: 'Touchscreens can\'t handle this shader.', m: 'g' },
        { t: 'Mobile? The barrel distortion declined.', m: 'g' },
        { t: 'Aliens render on desktop.', m: 'b' },
        { t: 'Your finger is blocking the post-processing.', m: 'y' },
        { t: 'Phone GPUs got abducted first.', m: 'y' },
        { t: 'PC only. Even off-world.', m: 'b' },
        { t: 'The Jupiter guys play on ultra.', m: 'g' },
        { t: 'They crossed galaxies. Not platforms.', m: 'y' },
    ],
    pt: [
        { t: 'Touchscreen não aguenta esse shader.', m: 'g' },
        { t: 'Mobile? O barrel distortion recusou.', m: 'g' },
        { t: 'Alien renderiza em desktop.', m: 'b' },
        { t: 'Seu dedo tá tapando o post-processing.', m: 'y' },
        { t: 'GPU de celular foi abduzida primeiro.', m: 'y' },
        { t: 'Só PC. Até fora do planeta.', m: 'b' },
        { t: 'Os de Júpiter jogam no ultra.', m: 'g' },
        { t: 'Cruzaram galáxias. Não plataformas.', m: 'y' },
    ],
};

Object.assign(Jogo.prototype, {

    _setupQuips() {
        this._lastQuipT = 0;          // timestamp do ultimo quip global
        this._quipProxTimer = 0;      // throttle de proximity check (a each 500ms)
        this._activeQuips = [];       // quips ativos: rastreiam target a each frame
        // MOBILE_MODE: schedule recursivo de quip do ufo a each 10-15s.
        // Quips normais (proximity, abduct, etc.) ficam silenciados.
        if (window.__MOBILE_MODE) {
            this._scheduleMobileQuip();
        }
    },

    // Registra um quip ativo: txt segue target.x/y + offsetY decrescente,
    // alpha decai linear ate sumir. Chamado por _showQuip e _scheduleMobileQuip.
    _registerQuip(txt, target, baseOffsetY, floatDist, duration) {
        if (!this._activeQuips) this._activeQuips = [];
        const startT = this.time?.now ?? 0;
        this._activeQuips.push({
            txt, target, baseOffsetY, floatDist, duration, startT,
        });
    },

    // Atualiza todos quips ativos a each frame: reposiciona em target.x/y +
    // offset que sobe ao longo da duracao + alpha decai. Remove os finalizados.
    _updateActiveQuips() {
        const list = this._activeQuips;
        if (!list || !list.length) return;
        const now = this.time?.now ?? 0;
        for (let i = list.length - 1; i >= 0; i--) {
            const q = list[i];
            const elapsed = now - q.startT;
            const t = elapsed / q.duration;
            // Target sumiu (entidade morta) -> destroi quip junto
            if (!q.txt || !q.txt.scene) { list.splice(i, 1); continue; }
            if (!q.target || (q.target.scene === undefined && q.target !== this.ufo)) {
                q.txt.destroy(); list.splice(i, 1); continue;
            }
            if (t >= 1) { q.txt.destroy(); list.splice(i, 1); continue; }
            // Ease cubic-out (1 - (1-t)^3)
            const e = 1 - Math.pow(1 - t, 3);
            const yOff = q.baseOffsetY - q.floatDist * e;
            q.txt.x = q.target.x;
            q.txt.y = q.target.y + yOff;
            // Alpha: full ate 60%, after fade linear
            q.txt.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
        }
    },

    _scheduleMobileQuip() {
        const delay = Phaser.Math.Between(10000, 15000);
        this.time.delayedCall(delay, () => {
            if (!this.ufo || !this.ufo.scene) return;
            const lang = this.dbg?.behavior?.lang || 'en';
            const pool = MOBILE_QUIPS[lang] || MOBILE_QUIPS.en;
            const entry = pool[Math.floor(Math.random() * pool.length)];
            const color = TONE_COLORS[entry.m] || TONE_COLORS.y;
            const txt = this.add.text(this.ufo.x, this.ufo.y - 60, entry.t, {
                fontSize: '24px',
                fill: color,
                fontStyle: 'bold',
                stroke: '#1a0008',
                strokeThickness: 4,
                fontFamily: '"VT323", "Courier New", monospace',
                shadow: { color: color, fill: false, blur: 10 },
            }).setOrigin(0.5).setDepth(195);
            // Segue a ufo: baseOffset -60, sobe +80 ao longo de 5500ms
            this._registerQuip(txt, this.ufo, -60, 80, 5500);
            this._scheduleMobileQuip();  // re-schedule
        });
    },

    // Mostra quip flutuante above do target. Retorna true se conseguiu.
    _showQuip(target, category) {
        if (window.__MOBILE_MODE) return false;  // mobile usa MOBILE_QUIPS dedicado
        if (!this.dbg?.fx?.quips) return false;
        const lang = this.dbg?.behavior?.lang || 'en';
        const pool = (QUIP_POOLS[lang] || QUIP_POOLS.en)[category];
        if (!pool || !pool.length) return false;
        const now = this.time?.now ?? 0;

        // Global cooldown — avoids spam
        if (now - this._lastQuipT < QUIP_GLOBAL_COOLDOWN) return false;

        // Per-source cooldown (target._lastQuipT)
        const sourceCD = QUIP_COOLDOWN_SOURCE[category] ?? 0;
        if (target && sourceCD > 0) {
            if (target._lastQuipT && (now - target._lastQuipT) < sourceCD) return false;
            target._lastQuipT = now;
        }

        const entry = pool[Math.floor(Math.random() * pool.length)];
        const color = TONE_COLORS[entry.m] || TONE_COLORS.y;
        const x = target?.x ?? this.ufo?.x ?? 0;
        const y = (target?.y ?? this.ufo?.y ?? 0) - 40;

        const txt = this.add.text(x, y, entry.t, {
            fontSize: '26px',
            fill: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: { color: '#000', fill: true, blur: 6 },
        }).setOrigin(0.5).setDepth(60);

        // Segue o target: baseOffset -40, sobe +80 ao longo de 4800ms
        this._registerQuip(txt, target, -40, 80, 4800);

        this._lastQuipT = now;
        return true;
    },

    // Proximity check (chamado do _updateBody throttled a 500ms).
    // Dispara quips de church/cactus when player passa perto.
    _quipProximityCheck(delta) {
        if (window.__MOBILE_MODE) return;  // mobile usa MOBILE_QUIPS dedicado
        if (!this.dbg?.fx?.quips) return;
        this._quipProxTimer = (this._quipProxTimer ?? 0) + delta;
        if (this._quipProxTimer < 500) return;
        this._quipProxTimer = 0;

        const ship = this.ufo;
        if (!ship) return;
        const PROX_R2 = 350 * 350;  // radius de 350px

        // Landmarks (church, windmill, etc — todos compartilham pool 'church')
        if (this._landmarkPositions) {
            for (const lm of this._landmarkPositions) {
                const dx = lm.x - ship.x, dy = lm.y - ship.y;
                if (dx*dx + dy*dy < PROX_R2) {
                    if (this._showQuip(lm, lm.key.includes('church') ? 'church' : 'generic')) return;
                }
            }
        }

        // Cactus/vegetacao (sample 1 por proximity check to performance)
        // Pega aleatorio: itera primeira metade e dispara no primeiro proximo.
        // Nao has _vegePositions tracked — fallback: 5% chance de generic.
        if (Math.random() < 0.04) {
            // Quip generico aleatorio (without source) — ancora na ship
            this._showQuip({ x: ship.x, y: ship.y - 30 }, 'cactus');
        }
    },
});
