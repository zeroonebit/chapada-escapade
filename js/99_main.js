// 99_main.js — Configuration do Phaser e instanciação do game
// Carregado by último: depende de Game (definido em 01_scene.js + módulos)

const config = {
    type: Phaser.WEBGL,  // WEBGL necessário pro shader procedural de terreno (13_terrain_shader.js)
    parent: 'game-host',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    physics: { default: 'matter', matter: { gravity:{x:0,y:0}, debug:false } },
    scene: [Jogo]
};

window.game = new Phaser.Game(config);
