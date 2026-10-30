// 03_tutorial.spec.js — tutorial inteiro (10 passos) jogado de ponta a ponta com
// o mouse. A leitura mínima por passo (5s) é reduzida pra 700ms via a propriedade
// que o próprio 17_tutorial.js usa (_tutMinReadMs); todo o resto é o jogo como
// está. Se a nave morrer no meio (o tanque sai do BURGER com ~37% e os passos
// 07-10 gastam), o teste faz o que o jogador faria: RESTART e segue do passo
// retomado (mecânica __cepTutResume). As ações estão em tutorial_helpers.js.
const { test } = require('./fixtures');
const { playTutorial } = require('./tutorial_helpers');

test.describe('tutorial', () => {
    test('10 passos de ponta a ponta (mouse)', async ({ game, page }) => {
        test.setTimeout(480_000);
        await playTutorial(game, page);
    });
});
