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
            { t: 'Where\'s the Ctrl+S of my life?', m: 'y' },
            { t: 'Is this a bug or a feature?', m: 'y' },
            { t: 'My insurance doesn\'t cover raytracing.', m: 'y' },
            { t: 'I\'ll just print a new cow in PLA.', m: 'g' },
            { t: 'The AI said it would rain today. Thanks, AI.', m: 'y' },
            { t: 'Rotoscoped against my will.', m: 'r' },
            { t: 'I\'m an NPC but I have feelings.', m: 'y' },
            { t: 'My hat has more polygons than me.', m: 'g' },
            { t: 'Called support. Been queued for 3 patches.', m: 'y' },
            { t: 'Gimbal lock in my neck from looking up.', m: 'g' },
            { t: 'Documenting it all for the lawsuit. Frame by frame.', m: 'r' },
            { t: 'This farm was my personal project.', m: 'y' },
            { t: 'I learned ZBrush to sculpt my rage.', m: 'g' },
            { t: 'I want to speak to the game designer. NOW.', m: 'r' },
            { t: 'My life became training data.', m: 'y' },
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
            { t: 'Ship modeled in SOPs. Obviously.', m: 'b' },
            { t: 'Display flag on me. Always.', m: 'g' },
            { t: 'My trail is a particle solver.', m: 'b' },
            { t: 'Came from space, render locally.', m: 'g' },
            { t: 'Abduction with complimentary volumetric fog.', m: 'b' },
            { t: 'A cloud VDB? No, that\'s just me.', m: 'g' },
            { t: 'Nanite? I have a fixed tri count and pride.', m: 'y' },
            { t: 'Anti-gravity is just a well-written wrangle.', m: 'g' },
            { t: 'Spline flight with artisanal easing.', m: 'b' },
            { t: 'Turntable? This is a real 360.', m: 'g' },
            { t: 'LiDAR-scanned the whole farm in one pass.', m: 'b' },
            { t: 'NeRF can\'t capture me. Too fast.', m: 'g' },
            { t: 'This dome is respectable subsurface.', m: 'b' },
            { t: 'CUDA out of memory? Earthling problem.', m: 'y' },
            { t: 'Real-time inference: cow or bull?', m: 'b' },
            { t: 'Onboard classifier: 98% sure it\'s a cow.', m: 'g' },
            { t: 'My digital twin is in another galaxy.', m: 'y' },
            { t: 'Dithering between stars to leave no trail.', m: 'b' },
            { t: 'Perfect guiding, no EQ mount needed.', m: 'b' },
            { t: 'I\'ve photobombed 200 dark frames.', m: 'g' },
            { t: 'I\'m the artifact in your stacking.', m: 'y' },
            { t: 'Framerate independent. Physics too.', m: 'b' },
            { t: 'Native upscale. I actually grew.', m: 'g' },
            { t: 'My beam passed the Turing test.', m: 'g' },
            { t: 'Prompt: "alien ship, 8-dir, cute but menacing".', m: 'y' },
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
            { t: 'My retopo was made with love. For this.', m: 'y' },
            { t: 'I have 4 directions and none escapes.', m: 'y' },
            { t: 'Cow mocap: me, running for free.', m: 'g' },
            { t: 'My UVs are seamless. My fate isn\'t.', m: 'y' },
            { t: 'Subdivide my sadness.', m: 'g' },
            { t: 'Carefully weight-painted despair.', m: 'g' },
            { t: 'Am I CC0 by any chance?', m: 'r' },
            { t: 'Labeled: "abductable".', m: 'y' },
            { t: 'My normal map hides the eye bags.', m: 'g' },
            { t: 'My life\'s bake: 512x512.', m: 'y' },
            { t: '8-frame anim cycle. Panic on loop.', m: 'b' },
            { t: 'The neural net confused me with a bull. Again.', m: 'y' },
            { t: 'Scanned in 4D: space and suffering.', m: 'g' },
            { t: 'Print another me. Good luck leveling the bed.', m: 'g' },
            { t: 'Confirmed: not a NeRF, an actual cow.', m: 'b' },
            { t: 'Instance? No. I\'m the original.', m: 'r' },
            { t: 'My favorite blendshape was "peace".', m: 'y' },
            { t: 'My escape, rendered in real time.', m: 'b' },
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
            { t: 'Particle milk: 2 million points.', m: 'b' },
            { t: 'Viscosity calibrated. Hope wasn\'t.', m: 'y' },
            { t: 'Spilled on frame 1, mourned on 240.', m: 'g' },
            { t: 'Not even vellum holds this leak.', m: 'g' },
            { t: 'Raw milk: no post-processing.', m: 'b' },
            { t: 'Perfect whitepoint. Ironically.', m: 'g' },
            { t: 'Dairy dataset compromised.', m: 'b' },
            { t: 'I simmed this spill 40 times.', m: 'y' },
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
            { t: 'Low-poly fence, high-tech invasion.', m: 'y' },
            { t: 'Instanced 400 times for nothing.', m: 'y' },
            { t: 'Booleans don\'t scare me. The beam does.', m: 'g' },
            { t: 'Level of detail: just enough to fail.', m: 'y' },
            { t: 'Collision disabled for optimization. Great.', m: 'r' },
            { t: 'Warping? Only reality itself.', m: 'g' },
            { t: 'Procedural wood, artisanal incompetence.', m: 'g' },
            { t: 'Holding cows wasn\'t in the specs.', m: 'b' },
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
            { t: '100% infill. No hollow aftertaste.', m: 'g' },
            { t: 'A perfect first layer: the bun.', m: 'b' },
            { t: 'Zero stringing between cheese and bun.', m: 'g' },
            { t: 'Benchy? Here the test print is a burger.', m: 'g' },
            { t: 'My smart material is mayo.', m: 'g' },
            { t: 'My photo ended up in a food dataset.', m: 'y' },
            { t: 'Sesame texture: hand-scattered.', m: 'b' },
            { t: 'Tasteful lettuce displacement.', m: 'b' },
            { t: 'Edible in 12 draw calls.', m: 'g' },
            { t: 'Raft? No, that\'s just the tray.', m: 'g' },
            { t: 'Digital twin burger: zero calories.', m: 'y' },
            { t: 'Grilled with ember raytracing.', m: 'b' },
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
            { t: 'The bell has more reverb than faith.', m: 'y' },
            { t: 'Stained glass: history\'s first shader.', m: 'b' },
            { t: 'Down here it\'s all baked lighting.', m: 'g' },
            { t: 'Tonight\'s sky is full of noise.', m: 'y' },
            { t: 'ISO 100 in the soul.', m: 'g' },
            { t: 'Tower aligned with Polaris. Coincidence?', m: 'b' },
            { t: 'Faith is believing without seeing the wireframe.', m: 'g' },
            { t: 'We baptized a robot yesterday. A digital twin.', m: 'g' },
            { t: 'The priest denoised the sermon.', m: 'g' },
            { t: 'Gothic architecture: medieval nanite.', m: 'b' },
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
            { t: 'My spikes are a hair system.', m: 'b' },
            { t: 'I live on sunlight and vertex colors.', m: 'g' },
            { t: 'Few polygons, lots of personality.', m: 'b' },
            { t: 'Neither drought nor decimate takes me down.', m: 'y' },
            { t: 'Grew 2cm in 3 patches.', m: 'b' },
            { t: 'Photographed 600 times for photogrammetry.', m: 'y' },
            { t: 'My silhouette is an honest SDF.', m: 'g' },
            { t: 'Printable without supports. Jealous?', m: 'g' },
            { t: 'The AI classified me: "hostile vegetation".', m: 'y' },
            { t: 'Natural ambient occlusion in the folds.', m: 'b' },
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
            { t: 'Trust the null: OUT_final_v2_FINAL.', m: 'g' },
            { t: 'chramp() on destiny\'s curve.', m: 'g' },
            { t: '$F is life\'s only constant.', m: 'y' },
            { t: 'A pyro solver for the barbecue. Overkill? Maybe.', m: 'g' },
            { t: 'Emotional RBD: everything collapsing beautifully.', m: 'g' },
            { t: 'Vellum nerves, fully simulated.', m: 'g' },
            { t: 'PDG scheduled this chaos in parallel.', m: 'b' },
            { t: 'USD: Universal Scene of Despair.', m: 'g' },
            { t: 'Solaris saw it. Karma charged for it.', m: 'g' },
            { t: 'Group by attribute: @fear==1.', m: 'g' },
            { t: 'Normalized the escape vector.', m: 'b' },
            { t: 'Quaternions avoid gimbal lock, not abduction.', m: 'b' },
            { t: 'Linear interpolation between peace and chaos.', m: 'y' },
            { t: 'Ngon detected. Call the authorities.', m: 'g' },
            { t: 'Society\'s retopology has failed.', m: 'y' },
            { t: 'Suzanne would never approve of this.', m: 'g' },
            { t: 'Geometry nodes arriving where Houdini already was.', m: 'y' },
            { t: 'Eevee by day, Cycles by night.', m: 'b' },
            { t: 'Blender is free. The trauma isn\'t.', m: 'g' },
            { t: 'Loss going down, morale too.', m: 'y' },
            { t: 'The AI hallucinated one extra cow.', m: 'g' },
            { t: 'Gradient descent, downhill fast.', m: 'g' },
            { t: 'A 4D tensor: x, y, z and fear.', m: 'g' },
            { t: 'Manual annotation: 10,000 cows later.', m: 'y' },
            { t: 'COLMAP refused to reconstruct this.', m: 'g' },
            { t: 'Splat training: 30k iterations of pure chaos.', m: 'b' },
            { t: 'A radiance field that smells burnt.', m: 'g' },
            { t: 'Dense point cloud, sparse future.', m: 'y' },
            { t: 'Point cloud or points in the cloud?', m: 'g' },
            { t: 'No flat frame fixes this existential vignette.', m: 'g' },
            { t: 'A Bahtinov mask to focus on the problem.', m: 'g' },
            { t: 'Light pollution: blame the beam.', m: 'y' },
            { t: 'Invasion\'s first layer: good bed adhesion.', m: 'g' },
            { t: 'Clogged nozzle, intact plan.', m: 'b' },
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
            { t: 'Cadê o Ctrl+S da minha vida?', m: 'y' },
            { t: 'Isso é bug ou feature?', m: 'y' },
            { t: 'Meu seguro não cobre raytracing.', m: 'y' },
            { t: 'Vou imprimir uma vaca nova em PLA.', m: 'g' },
            { t: 'A IA disse que ia chover hoje. Valeu, IA.', m: 'y' },
            { t: 'Rotoscopado contra a vontade.', m: 'r' },
            { t: 'Sou NPC mas tenho sentimentos.', m: 'y' },
            { t: 'Meu chapéu tem mais polígonos que eu.', m: 'g' },
            { t: 'Chamei o suporte. Tô na fila há 3 patches.', m: 'y' },
            { t: 'Gimbal lock no pescoço de tanto olhar pra cima.', m: 'g' },
            { t: 'Documentando tudo pro processo. Frame a frame.', m: 'r' },
            { t: 'Essa fazenda era meu projeto pessoal.', m: 'y' },
            { t: 'Aprendi ZBrush pra esculpir minha raiva.', m: 'g' },
            { t: 'Quero falar com o game designer. AGORA.', m: 'r' },
            { t: 'Minha vida virou dado de treino.', m: 'y' },
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
            { t: 'Nave modelada em SOPs. Óbvio.', m: 'b' },
            { t: 'Display flag em mim. Sempre.', m: 'g' },
            { t: 'Meu rastro é um solver de partículas.', m: 'b' },
            { t: 'Vim do espaço, mas renderizo local.', m: 'g' },
            { t: 'Abdução com fog volumétrico de cortesia.', m: 'b' },
            { t: 'VDB de nuvem? Não, sou eu mesmo.', m: 'g' },
            { t: 'Nanite? Tenho tri count fixo e orgulho.', m: 'y' },
            { t: 'Antigravidade é só um wrangle bem escrito.', m: 'g' },
            { t: 'Voo em spline com easing artesanal.', m: 'b' },
            { t: 'Turntable? Aqui é 360 de verdade.', m: 'g' },
            { t: 'Fiz o LiDAR da fazenda numa passada só.', m: 'b' },
            { t: 'NeRF não me captura. Rápido demais.', m: 'g' },
            { t: 'Essa dome é subsurface de respeito.', m: 'b' },
            { t: 'CUDA out of memory? Problema de terráqueo.', m: 'y' },
            { t: 'Inferência em tempo real: vaca ou boi?', m: 'b' },
            { t: 'Classificador de bordo: 98% de certeza que é vaca.', m: 'g' },
            { t: 'Meu gêmeo digital tá em outra galáxia.', m: 'y' },
            { t: 'Dithering entre estrelas pra não deixar rastro.', m: 'b' },
            { t: 'Guiding perfeito, nem preciso de montagem EQ.', m: 'b' },
            { t: 'Já apareci em 200 dark frames.', m: 'g' },
            { t: 'Sou o artefato do seu stacking.', m: 'y' },
            { t: 'Independente de framerate. De física também.', m: 'b' },
            { t: 'Upscale nativo. Cresci mesmo.', m: 'g' },
            { t: 'Meu feixe passou no teste de Turing.', m: 'g' },
            { t: 'Prompt: "nave alien, 8 direções, fofa e ameaçadora".', m: 'y' },
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
            { t: 'Meu retopo foi feito com carinho. Pra isso.', m: 'y' },
            { t: 'Tenho 4 direções e nenhuma escapa.', m: 'y' },
            { t: 'Mocap de vaca: eu, correndo de graça.', m: 'g' },
            { t: 'Minhas UVs não têm costura. Meu destino tem.', m: 'y' },
            { t: 'Subdivide minha tristeza.', m: 'g' },
            { t: 'Desespero com weight paint caprichado.', m: 'g' },
            { t: 'Por acaso eu sou CC0?', m: 'r' },
            { t: 'Fui labelada: "abduzível".', m: 'y' },
            { t: 'Meu normal map esconde as olheiras.', m: 'g' },
            { t: 'O bake da minha vida: 512x512.', m: 'y' },
            { t: 'Anim cycle de 8 frames. Pânico em loop.', m: 'b' },
            { t: 'A rede neural me confundiu com boi. De novo.', m: 'y' },
            { t: 'Escaneada em 4D: espaço e sofrimento.', m: 'g' },
            { t: 'Imprime outra eu. Boa sorte nivelando a mesa.', m: 'g' },
            { t: 'Confirmado: não sou NeRF, sou vaca mesmo.', m: 'b' },
            { t: 'Instância? Não. Eu sou a original.', m: 'r' },
            { t: 'Meu blendshape favorito era "paz".', m: 'y' },
            { t: 'Minha fuga, renderizada em tempo real.', m: 'b' },
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
            { t: 'Leite em partículas: 2 milhões de pontos.', m: 'b' },
            { t: 'Viscosidade calibrada. A esperança não.', m: 'y' },
            { t: 'Derramado no frame 1, chorado no 240.', m: 'g' },
            { t: 'Nem vellum segura esse vazamento.', m: 'g' },
            { t: 'Leite cru: sem pós-processamento.', m: 'b' },
            { t: 'Whitepoint perfeito. Ironicamente.', m: 'g' },
            { t: 'Dataset de laticínio comprometido.', m: 'b' },
            { t: 'Simulei esse derramamento 40 vezes.', m: 'y' },
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
            { t: 'Cerca low-poly, invasão high-tech.', m: 'y' },
            { t: 'Instanciada 400 vezes pra nada.', m: 'y' },
            { t: 'Boolean não me assusta. O feixe sim.', m: 'g' },
            { t: 'Nível de detalhe: suficiente pra falhar.', m: 'y' },
            { t: 'Colisão desligada por otimização. Ótimo.', m: 'r' },
            { t: 'Warping? Só se for o da realidade.', m: 'g' },
            { t: 'Madeira procedural, incompetência artesanal.', m: 'g' },
            { t: 'Segurar vaca não tava nas specs.', m: 'b' },
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
            { t: 'Infill 100%. Sem gostinho de vazio.', m: 'g' },
            { t: 'Primeira camada perfeita: o pão.', m: 'b' },
            { t: 'Zero stringing entre o queijo e o pão.', m: 'g' },
            { t: 'Benchy? Aqui o teste de impressão é o burger.', m: 'g' },
            { t: 'Meu smart material é maionese.', m: 'g' },
            { t: 'Minha foto foi parar num dataset de comida.', m: 'y' },
            { t: 'Textura de gergelim: scatter manual.', m: 'b' },
            { t: 'Displacement de alface no capricho.', m: 'b' },
            { t: 'Comível em 12 draw calls.', m: 'g' },
            { t: 'Raft? Não, isso é a bandeja mesmo.', m: 'g' },
            { t: 'Burger gêmeo digital: zero calorias.', m: 'y' },
            { t: 'Grelhado com raytracing de brasa.', m: 'b' },
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
            { t: 'O sino tem mais reverb que fé.', m: 'y' },
            { t: 'Vitral: o primeiro shader da história.', m: 'b' },
            { t: 'Aqui embaixo é tudo luz baked.', m: 'g' },
            { t: 'O céu de hoje tá cheio de ruído.', m: 'y' },
            { t: 'ISO 100 na alma.', m: 'g' },
            { t: 'Torre alinhada com a polar. Coincidência?', m: 'b' },
            { t: 'Fé é acreditar sem ver o wireframe.', m: 'g' },
            { t: 'Batizamos um robô ontem. Era digital twin.', m: 'g' },
            { t: 'O padre denoisou o sermão.', m: 'g' },
            { t: 'Arquitetura gótica: nanite medieval.', m: 'b' },
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
            { t: 'Meus espinhos são hair system.', m: 'b' },
            { t: 'Sobrevivo de sol e vertex colors.', m: 'g' },
            { t: 'Poucos polígonos, muita personalidade.', m: 'b' },
            { t: 'Nem seca nem decimate me derrubam.', m: 'y' },
            { t: 'Cresci 2cm em 3 patches.', m: 'b' },
            { t: 'Fotografado 600 vezes pra fotogrametria.', m: 'y' },
            { t: 'Minha silhueta é um SDF honesto.', m: 'g' },
            { t: 'Imprimível sem suporte. Inveja?', m: 'g' },
            { t: 'A IA me classificou: "vegetação hostil".', m: 'y' },
            { t: 'Ambient occlusion natural nas dobras.', m: 'b' },
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
            { t: 'Confia no null: OUT_final_v2_FINAL.', m: 'g' },
            { t: 'chramp() na curva do destino.', m: 'g' },
            { t: '$F é a única constante da vida.', m: 'y' },
            { t: 'Pyro solver no churrasco. Exagero? Talvez.', m: 'g' },
            { t: 'RBD emocional: tudo desabando bonito.', m: 'g' },
            { t: 'Nervos de vellum, totalmente simulados.', m: 'g' },
            { t: 'O PDG agendou esse caos em paralelo.', m: 'b' },
            { t: 'USD: Universal Scene do Desespero.', m: 'g' },
            { t: 'Solaris viu. Karma cobrou.', m: 'g' },
            { t: 'Grupo por atributo: @medo==1.', m: 'g' },
            { t: 'Normalizei o vetor da fuga.', m: 'b' },
            { t: 'Quaternion evita gimbal lock, não abdução.', m: 'b' },
            { t: 'Interpolação linear entre paz e caos.', m: 'y' },
            { t: 'Ngon detectado. Chamem as autoridades.', m: 'g' },
            { t: 'A retopologia da sociedade falhou.', m: 'y' },
            { t: 'A Suzanne jamais aprovaria isso.', m: 'g' },
            { t: 'Geometry nodes chegando onde o Houdini já tava.', m: 'y' },
            { t: 'Eevee de dia, Cycles de noite.', m: 'b' },
            { t: 'Blender é grátis. O trauma não.', m: 'g' },
            { t: 'Loss caindo, moral também.', m: 'y' },
            { t: 'A IA alucinou uma vaca a mais.', m: 'g' },
            { t: 'Gradient descent ladeira abaixo.', m: 'g' },
            { t: 'Tensor 4D: x, y, z e medo.', m: 'g' },
            { t: 'Anotação manual: 10.000 vacas depois.', m: 'y' },
            { t: 'O COLMAP se recusou a reconstruir isso.', m: 'g' },
            { t: 'Treino de splat: 30k iterações de puro caos.', m: 'b' },
            { t: 'Radiance field com cheiro de queimado.', m: 'g' },
            { t: 'Point cloud densa, futuro esparso.', m: 'y' },
            { t: 'Nuvem de pontos ou pontos na nuvem?', m: 'g' },
            { t: 'Flat frame não corrige essa vinheta existencial.', m: 'g' },
            { t: 'Máscara de Bahtinov pra focar no problema.', m: 'g' },
            { t: 'Poluição luminosa: culpa do feixe.', m: 'y' },
            { t: 'Primeira camada da invasão: aderiu bem.', m: 'g' },
            { t: 'Nozzle entupido, plano intacto.', m: 'b' },
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
        // isGO: alvo era um GameObject VIVO no registro. Âncoras {x,y} puras
        // (church/cactus/TOD) têm scene undefined DESDE SEMPRE — o check de
        // "alvo morto" matava esses quips no frame 1 (bug antigo, fix F4).
        const isGO = !!(target && target.scene) || target === this.ufo;
        this._activeQuips.push({
            txt, target, baseOffsetY, floatDist, duration, startT, isGO,
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
            // Só destrói se o alvo era GameObject e MORREU — âncora {x,y}
            // pura fica parada no lugar (fix F4 do bug do frame 1)
            if (!q.target || (q.isGO && !q.target.scene && q.target !== this.ufo)) {
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

        // BALÃO cartoon (F4, parity Bevy quips.rs): fundo creme, stroke na
        // cor do mood, rabinho apontando pro dono, texto escuro bold
        const balloon = this._makeQuipBalloon(entry.t, color);
        balloon.setPosition(x, y).setDepth(60);

        // TTL por comprimento (Bevy): 2.6s + 55ms/char, clamp 3.2–6s
        const ttl = Phaser.Math.Clamp(2600 + entry.t.length * 55, 3200, 6000);
        this._registerQuip(balloon, target, -40, 80, ttl);

        this._lastQuipT = now;
        return true;
    },

    // Constrói o balão (container: Graphics arredondado + rabinho + texto).
    // Pop de entrada 0.6→1 (Back.easeOut), igual ao Bevy.
    _makeQuipBalloon(text, moodHex) {
        const t = this.add.text(0, 0, text, {
            fontSize: '20px', fill: '#261e1a', fontStyle: 'bold',
            fontFamily: '"VT323", "Courier New", monospace',
        }).setOrigin(0.5);
        const w = t.width + 22, h = t.height + 12;
        const strokeCol = Phaser.Display.Color.HexStringToColor(moodHex).color;
        const g = this.add.graphics();
        g.fillStyle(0xfcf9ee, 0.96);
        g.lineStyle(2.4, strokeCol, 1);
        g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        g.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, 0, h / 2 + 10);
        g.lineBetween(-6, h / 2 - 1, 0, h / 2 + 10);
        g.lineBetween(6, h / 2 - 1, 0, h / 2 + 10);
        const c = this.add.container(0, 0, [g, t]);
        c.setScale(0.6);
        this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
        return c;
    },

    // Fala ambiente na virada de TOD/clima (F4) — balão preso na nave.
    // Pools portados 1:1 do Bevy atmosphere.rs (TOD_QUIPS/weather_quip_pool).
    _ambientQuip(map, key) {
        if (window.__MOBILE_MODE) return;
        if (!this.dbg?.fx?.quips || !this.ufo?.scene) return;
        if (!this.gameStarted || this.gameOver) return;
        const lang = this.dbg?.behavior?.lang || 'en';
        const pool = (map[lang] || map.en)[key];
        if (!pool || !pool.length) return;
        const text = pool[Math.floor(Math.random() * pool.length)];
        const balloon = this._makeQuipBalloon(text, TONE_COLORS.g);
        balloon.setPosition(this.ufo.x, this.ufo.y - 60).setDepth(60);
        const ttl = Phaser.Math.Clamp(2600 + text.length * 55, 3200, 6000);
        this._registerQuip(balloon, this.ufo, -60, 80, ttl);
    },
    _quipTOD(key)     { this._ambientQuip(TOD_QUIPS_AMBIENT, key); },
    _quipWeather(key) { this._ambientQuip(WEATHER_QUIPS_AMBIENT, key); },

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

// ── FALAS DE TOD/CLIMA (F4) — port 1:1 de Bevy atmosphere.rs ─────────
const TOD_QUIPS_AMBIENT = {
    en: {
        day:      ["high noon — burger o'clock!", "lunchtime... where's my burger?"],
        dusk:     ["getting late already?", "the day's winding down..."],
        sunset:   ["what a Cerrado sunset!", "golden hour, huh"],
        night:    ["wait, night already?", "that got dark fast"],
        midnight: ["midnight — prime abducting hours", "everyone asleep... cow-snatch time"],
        dawn:     ["whoa, dawn already?", "sun's coming up..."],
    },
    pt: {
        day:      ["meio-dia, hora do rango!", "hora do almoço, cadê meu hambúrguer?"],
        dusk:     ["nossa, tá ficando tarde?", "o dia tá caindo..."],
        sunset:   ["que pôr do sol no Cerrado!", "hora dourada, hein"],
        night:    ["ih, já é de noite?", "escureceu rápido, hein?"],
        midnight: ["meia-noite, hora das abduções", "todo mundo dormindo, bora roubar vaca"],
        dawn:     ["eita, amanheceu já?", "raiando o dia..."],
    },
};
const WEATHER_QUIPS_AMBIENT = {
    en: {
        rain:  ["rain! my hull's gonna rust", "who turned on the sky shower?"],
        fog:   ["fog... where'd the cows go?", "can't see a hoof out here"],
        storm: ["storm! lightning + beam = no thanks", "thunder? rough night to abduct"],
        snow:  ["snow in the Cerrado? weird", "cows on ice — premium burger"],
        clear: ["sky's clear, nice", "sun's back, phew"],
    },
    pt: {
        rain:  ["chuva! minha lataria vai enferrujar", "quem ligou o chuveiro do céu?"],
        fog:   ["neblina... cadê as vacas?", "não enxergo um palmo!"],
        storm: ["tempestade! raio + graviton = não", "trovão? péssima noite pra roubar vaca"],
        snow:  ["neve no Cerrado? tá esquisito", "vaca no freezer, hambúrguer premium"],
        clear: ["céu limpou, que beleza", "sol de volta, ufa"],
    },
};
