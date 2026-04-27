// 99_main.js — Configuração do Phaser e instanciação do jogo
// Carregado por último: depende de Jogo (definido em 01_scene.js + módulos)

const config = {
    type: Phaser.CANVAS,  // Canvas evita bloqueio CORS no protocolo file://
    parent: 'game-host',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    physics: { default: 'matter', matter: { gravity:{x:0,y:0}, debug:false } },
    scene: [Jogo]
};

new Phaser.Game(config);
