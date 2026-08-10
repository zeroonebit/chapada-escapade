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

// Quips TEMA DO JOGO (2026-08-08) — invasão, vacas, burgers, cerrado.
// Os 500 quips tech-art da era portfolio estão arquivados em
// docs/archive/20_quips_techart_2026-07-06.js (restaurar = copiar de volta).
const QUIP_POOLS = {
    en: {
        farmer: [
            { t: 'Come down here and say that!', m: 'r' },
            { t: 'That cow was my retirement plan!', m: 'r' },
            { t: 'Third cow this week. THIRD.', m: 'y' },
            { t: 'I\'m calling the mayor. And the army.', m: 'r' },
            { t: 'My granddad warned me about the lights.', m: 'y' },
            { t: 'The scarecrows were supposed to stop THIS.', m: 'y' },
            { t: 'You leave my herd alone!', m: 'r' },
            { t: 'Not the prize bull. Anything but the bull.', m: 'r' },
            { t: 'I\'ve got buckshot with your name on it.', m: 'r' },
            { t: 'First the drought, now THIS.', m: 'y' },
            { t: 'The insurance form has no box for \'UFO\'.', m: 'y' },
            { t: 'I saw the beam. Nobody believes me.', m: 'b' },
            { t: 'Stay away from the pigs, you monster!', m: 'r' },
            { t: 'This pitchfork has reach, I swear!', m: 'g' },
            { t: 'My show was getting good, and now this.', m: 'g' },
            { t: 'I\'ll trade you the mother-in-law for the cow.', m: 'g' },
            { t: 'Them burgers better be worth it.', m: 'y' },
            { t: 'The whole town will hear about this!', m: 'r' },
        ],
        ufo: [
            { t: 'Fresh beef, zero gravity.', m: 'g' },
            { t: 'The mothership demands 30 burgers. No pressure.', m: 'b' },
            { t: 'Employee of the month, three galaxies running.', m: 'g' },
            { t: 'Graviton beam: warranty void over 500kg of cow.', m: 'y' },
            { t: 'Abduction is just aggressive takeout.', m: 'g' },
            { t: 'I don\'t make the quota. I just fill it.', m: 'y' },
            { t: 'Best pasture in the quadrant, honestly.', m: 'b' },
            { t: 'Low fuel, high standards.', m: 'y' },
            { t: 'The cows complain. The burgers don\'t.', m: 'y' },
            { t: 'Intergalactic hunger management in progress.', m: 'b' },
            { t: 'Earth: great beef, terrible air defense.', m: 'g' },
            { t: 'My cargo hold smells like a barn.', m: 'y' },
            { t: 'Five cows max. Union rules.', m: 'b' },
            { t: 'One farmer OR five cows. Physics.', m: 'b' },
            { t: 'Torpedoes? Cute.', m: 'g' },
            { t: 'The scarecrows are awake. Adorable.', m: 'g' },
            { t: 'This is a certified organic raid.', m: 'g' },
            { t: 'Drive-thru? I AM the drive-thru.', m: 'g' },
            { t: 'Deliver 30 burgers or the boss eats me.', m: 'y' },
            { t: 'Bacon found. Mission priorities updated.', m: 'g' },
            { t: 'Radar hot, griddle hotter.', m: 'g' },
            { t: 'I flew 40 light-years for THIS commute.', m: 'y' },
            { t: 'Chapada views, premium abduction rates.', m: 'b' },
            { t: 'Warning: beam is addictive for bovines.', m: 'b' },
            { t: 'No cow is safe. No burger is late.', m: 'b' },
            { t: 'They call it stealing. I call it sourcing.', m: 'y' },
        ],
        cow: [
            { t: 'Moo? MOO!!', m: 'r' },
            { t: 'I regret nothing. I regret grass.', m: 'y' },
            { t: 'Tell the herd I floated.', m: 'b' },
            { t: 'Is this about the fence I broke?', m: 'y' },
            { t: 'Best view of the farm I\'ve ever had.', m: 'g' },
            { t: 'I knew the sky was up to something.', m: 'y' },
            { t: 'Put me DOWN. Gently. But down.', m: 'r' },
            { t: 'The grass over there looked greener anyway.', m: 'y' },
            { t: 'I\'m not fast food. I\'m SLOW food.', m: 'r' },
            { t: 'My mother warned me about bright lights.', m: 'y' },
            { t: 'This beats the milking machine, honestly.', m: 'g' },
            { t: 'Four stomachs, zero say in this.', m: 'y' },
            { t: 'The bull is NOT going to like this.', m: 'g' },
            { t: 'I demand to speak to the alien manager.', m: 'r' },
            { t: 'Wheee— I mean, MOO.', m: 'g' },
            { t: 'First time flying. Hooves sweating.', m: 'g' },
            { t: 'If I\'m a burger, I want to be the double.', m: 'y' },
            { t: 'Gravity was my whole personality.', m: 'y' },
            { t: 'The pig said this was a spa trip.', m: 'g' },
            { t: 'Abducted on a Monday. Typical.', m: 'y' },
        ],
        dairy: [
            { t: 'The milk quota is safe. The cows aren\'t.', m: 'y' },
            { t: 'Buckets stay. Cows go.', m: 'b' },
            { t: 'Freshest dairy in orbit.', m: 'g' },
            { t: 'The hay was a bribe.', m: 'y' },
            { t: 'Milking hour got... rescheduled.', m: 'y' },
            { t: 'This corral has a five-star burger rating.', m: 'b' },
            { t: 'The butter churns on. Life finds a way.', m: 'g' },
            { t: 'The trough water is for DRINKING, pig.', m: 'g' },
            { t: 'Cheese takes weeks. Abduction takes seconds.', m: 'b' },
            { t: 'Got milk? Not anymore.', m: 'y' },
        ],
        fence: [
            { t: 'Fences: great against cows, useless against sky.', m: 'y' },
            { t: 'This gate was closed. WAS.', m: 'y' },
            { t: 'The property line ends at the atmosphere.', m: 'b' },
            { t: 'The posts watched everything. Silent witnesses.', m: 'g' },
            { t: 'Barbed wire, meet anti-gravity.', m: 'y' },
            { t: 'Fixed this fence twice. Giving up.', m: 'y' },
            { t: 'The corral holds them. The beam takes them.', m: 'b' },
            { t: 'Wood and nails vs. alien tech. Fair fight.', m: 'g' },
            { t: 'Gates open. Morale closed.', m: 'y' },
            { t: 'Climb-proof. Not float-proof.', m: 'g' },
        ],
        burger: [
            { t: 'Order up: one classic, extra courage.', m: 'g' },
            { t: 'Medium rare, well abducted.', m: 'g' },
            { t: 'The cheese one restores more fuel. Science.', m: 'b' },
            { t: 'From pasture to patty in record time.', m: 'b' },
            { t: 'The double is worth 220. Do the math.', m: 'b' },
            { t: '30 burgers or the invasion fails.', m: 'b' },
            { t: 'Combo unlocked: fries with that panic.', m: 'g' },
            { t: 'No pickles. The mothership hates pickles.', m: 'y' },
            { t: 'Flame-grilled by reentry velocity.', m: 'g' },
            { t: 'Loading... marinating... done.', m: 'b' },
            { t: 'A burger in the beam is worth two in the pen.', m: 'y' },
            { t: 'Bacon DLC now available.', m: 'g' },
            { t: 'The quota doesn\'t eat itself.', m: 'y' },
            { t: 'Chef\'s special: gravity-tenderized.', m: 'g' },
            { t: 'Hot and floating. Grab it.', m: 'b' },
            { t: 'Five stars on GalaxyEats.', m: 'g' },
        ],
        church: [
            { t: 'Sunday service: extra crowded this week.', m: 'y' },
            { t: 'The bell rang by itself. Sure it did.', m: 'y' },
            { t: 'Thoughts and pastures.', m: 'g' },
            { t: 'The choir saw the lights too.', m: 'b' },
            { t: 'Candles lit for the herd.', m: 'b' },
            { t: 'Forgive the alien, for it knows the quota.', m: 'g' },
            { t: 'The steeple is NOT a landing pad.', m: 'r' },
            { t: 'Miracles go up, cows come down. Wait. Reverse.', m: 'g' },
            { t: 'The collection plate takes coins. And cows?', m: 'y' },
            { t: 'Heaven\'s busy tonight.', m: 'b' },
        ],
        cactus: [
            { t: 'Spiky and unbothered since 1892.', m: 'b' },
            { t: 'The beam skips me. Rude. Relieved.', m: 'y' },
            { t: 'I\'ve seen twelve invasions. This one\'s loud.', m: 'y' },
            { t: 'Water? Never heard of her.', m: 'g' },
            { t: 'Hug me. I dare you.', m: 'r' },
            { t: 'Cerrado-born, drought-approved.', m: 'b' },
            { t: 'The cows never say hi anymore.', m: 'y' },
            { t: 'I point at the sky for free.', m: 'g' },
            { t: 'Still here since the last apocalypse.', m: 'b' },
            { t: 'Needles: nature\'s air defense.', m: 'g' },
        ],
        generic: [
            { t: 'The chapada watches. The chapada judges.', m: 'y' },
            { t: 'Somewhere, a mecha just woke up.', m: 'b' },
            { t: 'Wind\'s from the southeast. Cows incoming.', m: 'b' },
            { t: 'Fuel burns. Quotas wait.', m: 'y' },
            { t: 'Every farm has a secret. This one has torpedoes.', m: 'g' },
            { t: 'The lake keeps its opinion to itself.', m: 'g' },
            { t: 'Golden hour is prime abduction time.', m: 'b' },
            { t: 'Rain or shine, beef is beef.', m: 'b' },
            { t: 'The radar sees all. Understands little.', m: 'y' },
            { t: 'Contracts don\'t sign themselves.', m: 'b' },
            { t: 'A quiet night. Suspiciously quiet.', m: 'y' },
            { t: 'Legend says a golden burger floats out here.', m: 'b' },
            { t: 'The scarecrow union filed a complaint.', m: 'g' },
            { t: 'Pigs: 10% of the herd, 90% of the flavor.', m: 'g' },
            { t: 'Fly casual. The mechas are watching.', m: 'y' },
            { t: 'The moon saw everything and said nothing.', m: 'y' },
            { t: 'Somewhere a corral slot just dinged.', m: 'b' },
            { t: 'Grass grows. Cows moo. Ships hum.', m: 'b' },
            { t: 'The ocean is a no-fly zone. Learned that wet.', m: 'y' },
            { t: 'Lakes are fine. The ocean holds grudges.', m: 'g' },
            { t: 'An artifact hums somewhere in the grass.', m: 'b' },
            { t: 'The herd remembers.', m: 'r' },
            { t: 'Burgers won\'t collect themselves.', m: 'y' },
            { t: 'Storm\'s coming. The beam still works.', m: 'b' },
            { t: 'Two moons would be showing off.', m: 'g' },
            { t: 'The farm never sleeps. It naps.', m: 'g' },
            { t: 'Everything here runs on beef and stubbornness.', m: 'y' },
            { t: 'Coins buy upgrades. Someday. A hangar.', m: 'y' },
            { t: 'The horizon curls. Don\'t think about it.', m: 'g' },
            { t: 'Home is where the mothership parks.', m: 'b' },
        ],
    },
    pt: {
        farmer: [
            { t: 'Desce aqui pra dizer isso!', m: 'r' },
            { t: 'Aquela vaca era minha aposentadoria!', m: 'r' },
            { t: 'Terceira vaca essa semana. TERCEIRA.', m: 'y' },
            { t: 'Vou chamar o prefeito. E o exército.', m: 'r' },
            { t: 'Meu avô avisou das luzes no céu.', m: 'y' },
            { t: 'Os espantalhos era pra impedir ISSO.', m: 'y' },
            { t: 'Larga meu rebanho!', m: 'r' },
            { t: 'O touro premiado não. Tudo menos o touro.', m: 'r' },
            { t: 'Tenho chumbo grosso com teu nome.', m: 'r' },
            { t: 'Primeiro a seca, agora ISSO.', m: 'y' },
            { t: 'O seguro não tem campo pra \'óvni\'.', m: 'y' },
            { t: 'Eu vi o feixe. Ninguém acredita.', m: 'b' },
            { t: 'Longe dos porcos, seu monstro!', m: 'r' },
            { t: 'Esse forcado alcança, tô avisando!', m: 'g' },
            { t: 'A novela tava boa, e agora isso.', m: 'g' },
            { t: 'Te troco a sogra pela vaca.', m: 'g' },
            { t: 'É bom que esses hambúrguer valham a pena.', m: 'y' },
            { t: 'A cidade inteira vai saber disso!', m: 'r' },
        ],
        ufo: [
            { t: 'Carne fresca, gravidade zero.', m: 'g' },
            { t: 'A nave-mãe exige 30 hambúrgueres. Sem pressão.', m: 'b' },
            { t: 'Funcionário do mês em três galáxias.', m: 'g' },
            { t: 'Feixe graviton: garantia não cobre vaca de 500kg.', m: 'y' },
            { t: 'Abdução é só um delivery agressivo.', m: 'g' },
            { t: 'Eu não invento a quota. Só cumpro.', m: 'y' },
            { t: 'Melhor pasto do quadrante, sinceramente.', m: 'b' },
            { t: 'Pouco combustível, muito padrão.', m: 'y' },
            { t: 'A vaca reclama. O hambúrguer não.', m: 'y' },
            { t: 'Gestão intergaláctica da fome em andamento.', m: 'b' },
            { t: 'Terra: carne boa, defesa aérea péssima.', m: 'g' },
            { t: 'Meu porão de carga cheira a curral.', m: 'y' },
            { t: 'Cinco vacas no máximo. Regra do sindicato.', m: 'b' },
            { t: 'Um fazendeiro OU cinco vacas. Física.', m: 'b' },
            { t: 'Torpedos? Fofos.', m: 'g' },
            { t: 'Os espantalhos acordaram. Que amor.', m: 'g' },
            { t: 'Isso é um saque orgânico certificado.', m: 'g' },
            { t: 'Drive-thru? EU sou o drive-thru.', m: 'g' },
            { t: 'Entrego 30 hambúrgueres ou o chefe me come.', m: 'y' },
            { t: 'Bacon localizado. Prioridades atualizadas.', m: 'g' },
            { t: 'Radar quente, chapa mais ainda.', m: 'g' },
            { t: 'Voei 40 anos-luz pra ESSE expediente.', m: 'y' },
            { t: 'Vista pra chapada, tarifa premium de abdução.', m: 'b' },
            { t: 'Aviso: o feixe vicia bovinos.', m: 'b' },
            { t: 'Nenhuma vaca segura. Nenhum burger atrasado.', m: 'b' },
            { t: 'Chamam de roubo. Eu chamo de fornecimento.', m: 'y' },
        ],
        cow: [
            { t: 'Muu? MUU!!', m: 'r' },
            { t: 'Não me arrependo de nada. Só do capim.', m: 'y' },
            { t: 'Diz pro rebanho que eu flutuei.', m: 'b' },
            { t: 'É por causa da cerca que eu quebrei?', m: 'y' },
            { t: 'Melhor vista da fazenda que eu já tive.', m: 'g' },
            { t: 'Eu sabia que o céu tramava algo.', m: 'y' },
            { t: 'Me bota no CHÃO. Com jeito. Mas bota.', m: 'r' },
            { t: 'O capim de lá parecia mais verde mesmo.', m: 'y' },
            { t: 'Não sou fast food. Sou SLOW food.', m: 'r' },
            { t: 'Minha mãe avisou das luzes fortes.', m: 'y' },
            { t: 'Melhor que a ordenhadeira, sinceramente.', m: 'g' },
            { t: 'Quatro estômagos, zero opinião nisso.', m: 'y' },
            { t: 'O touro NÃO vai gostar disso.', m: 'g' },
            { t: 'Exijo falar com o gerente alienígena.', m: 'r' },
            { t: 'Uhuu— quer dizer, MUU.', m: 'g' },
            { t: 'Primeiro voo. Cascos suando.', m: 'g' },
            { t: 'Se eu virar hambúrguer, quero ser o duplo.', m: 'y' },
            { t: 'A gravidade era minha personalidade inteira.', m: 'y' },
            { t: 'O porco disse que isso era day spa.', m: 'g' },
            { t: 'Abduzida numa segunda-feira. Típico.', m: 'y' },
        ],
        dairy: [
            { t: 'A cota de leite tá salva. As vacas não.', m: 'y' },
            { t: 'Os baldes ficam. As vacas vão.', m: 'b' },
            { t: 'Laticínio mais fresco da órbita.', m: 'g' },
            { t: 'O feno era suborno.', m: 'y' },
            { t: 'A hora da ordenha foi... remarcada.', m: 'y' },
            { t: 'Esse curral tem cinco estrelas em hambúrguer.', m: 'b' },
            { t: 'A manteiga continua. A vida dá um jeito.', m: 'g' },
            { t: 'A água do coxo é pra BEBER, porco.', m: 'g' },
            { t: 'Queijo leva semanas. Abdução leva segundos.', m: 'b' },
            { t: 'Tem leite? Não tem mais.', m: 'y' },
        ],
        fence: [
            { t: 'Cerca: ótima contra vaca, inútil contra céu.', m: 'y' },
            { t: 'Esse portão tava fechado. TAVA.', m: 'y' },
            { t: 'A divisa do terreno acaba na atmosfera.', m: 'b' },
            { t: 'Os mourões viram tudo. Testemunhas mudas.', m: 'g' },
            { t: 'Arame farpado, conheça a antigravidade.', m: 'y' },
            { t: 'Consertei essa cerca duas vezes. Desisto.', m: 'y' },
            { t: 'O curral segura. O feixe leva.', m: 'b' },
            { t: 'Madeira e prego contra tech alienígena. Justo.', m: 'g' },
            { t: 'Porteira aberta. Moral fechada.', m: 'y' },
            { t: 'À prova de pulo. Não de flutuação.', m: 'g' },
        ],
        burger: [
            { t: 'Saiu o pedido: um clássico, coragem extra.', m: 'g' },
            { t: 'Ao ponto, bem abduzido.', m: 'g' },
            { t: 'O de queijo restaura mais combustível. Ciência.', m: 'b' },
            { t: 'Do pasto ao pão em tempo recorde.', m: 'b' },
            { t: 'O duplo vale 220. Faz as contas.', m: 'b' },
            { t: '30 hambúrgueres ou a invasão fracassa.', m: 'b' },
            { t: 'Combo liberado: batata com esse pânico.', m: 'g' },
            { t: 'Sem picles. A nave-mãe odeia picles.', m: 'y' },
            { t: 'Grelhado na velocidade de reentrada.', m: 'g' },
            { t: 'Preparando... marinando... pronto.', m: 'b' },
            { t: 'Mais vale um burger no feixe que dois no curral.', m: 'y' },
            { t: 'DLC de bacon já disponível.', m: 'g' },
            { t: 'A quota não se come sozinha.', m: 'y' },
            { t: 'Especial do chef: amaciado por gravidade.', m: 'g' },
            { t: 'Quente e flutuando. Pega logo.', m: 'b' },
            { t: 'Cinco estrelas no GalaxyEats.', m: 'g' },
        ],
        church: [
            { t: 'Missa de domingo: lotada essa semana.', m: 'y' },
            { t: 'O sino tocou sozinho. Sei.', m: 'y' },
            { t: 'Orações e pastagens.', m: 'g' },
            { t: 'O coral também viu as luzes.', m: 'b' },
            { t: 'Velas acesas pelo rebanho.', m: 'b' },
            { t: 'Perdoai o alien, pois ele sabe da quota.', m: 'g' },
            { t: 'A torre NÃO é pista de pouso.', m: 'r' },
            { t: 'Milagre sobe, vaca desce. Pera. Contrário.', m: 'g' },
            { t: 'O dízimo aceita moeda. E vaca?', m: 'y' },
            { t: 'O céu tá movimentado hoje.', m: 'b' },
        ],
        cactus: [
            { t: 'Espinhento e tranquilo desde 1892.', m: 'b' },
            { t: 'O feixe me ignora. Grosseria. Alívio.', m: 'y' },
            { t: 'Já vi doze invasões. Essa é barulhenta.', m: 'y' },
            { t: 'Água? Não conheço.', m: 'g' },
            { t: 'Me abraça. Duvido.', m: 'r' },
            { t: 'Nascido no cerrado, aprovado na seca.', m: 'b' },
            { t: 'As vacas nem falam mais oi.', m: 'y' },
            { t: 'Aponto pro céu de graça.', m: 'g' },
            { t: 'Continuo aqui desde o último apocalipse.', m: 'b' },
            { t: 'Espinho: a defesa aérea da natureza.', m: 'g' },
        ],
        generic: [
            { t: 'A chapada observa. A chapada julga.', m: 'y' },
            { t: 'Em algum lugar, um mecha acabou de acordar.', m: 'b' },
            { t: 'Vento de sudeste. Vaca vindo.', m: 'b' },
            { t: 'Combustível queima. Quota espera.', m: 'y' },
            { t: 'Toda fazenda tem um segredo. Essa tem torpedo.', m: 'g' },
            { t: 'O lago guarda a opinião pra ele.', m: 'g' },
            { t: 'Golden hour é horário nobre de abdução.', m: 'b' },
            { t: 'Chova ou faça sol, carne é carne.', m: 'b' },
            { t: 'O radar vê tudo. Entende pouco.', m: 'y' },
            { t: 'Contratos não se assinam sozinhos.', m: 'b' },
            { t: 'Noite calma. Suspeitamente calma.', m: 'y' },
            { t: 'Dizem que um burger dourado flutua por aí.', m: 'b' },
            { t: 'O sindicato dos espantalhos protocolou queixa.', m: 'g' },
            { t: 'Porcos: 10% do rebanho, 90% do sabor.', m: 'g' },
            { t: 'Voa na moral. Os mechas tão de olho.', m: 'y' },
            { t: 'A lua viu tudo e não disse nada.', m: 'y' },
            { t: 'Em algum curral, um slot fez \'ding\'.', m: 'b' },
            { t: 'Capim cresce. Vaca muge. Nave zumbe.', m: 'b' },
            { t: 'O oceano é zona de exclusão aérea. Aprendi molhado.', m: 'y' },
            { t: 'Lago pode. O oceano guarda rancor.', m: 'g' },
            { t: 'Um artefato zumbe em algum lugar do capim.', m: 'b' },
            { t: 'O rebanho não esquece.', m: 'r' },
            { t: 'Os hambúrgueres não vão se coletar sozinhos.', m: 'y' },
            { t: 'Vem tempestade. O feixe segue firme.', m: 'b' },
            { t: 'Duas luas seria ostentação.', m: 'g' },
            { t: 'A fazenda nunca dorme. Cochila.', m: 'g' },
            { t: 'Aqui tudo roda a base de carne e teimosia.', m: 'y' },
            { t: 'Moedas compram upgrade. Um dia. Um hangar.', m: 'y' },
            { t: 'O horizonte entorta. Não pensa nisso.', m: 'g' },
            { t: 'Lar é onde a nave-mãe estaciona.', m: 'b' },
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
        { t: 'This invasion needs a bigger cockpit.', m: 'g' },
        { t: 'The beam won\'t fit on that screen.', m: 'y' },
        { t: 'Aliens invade on desktop.', m: 'b' },
        { t: 'Your finger is blocking the abduction.', m: 'y' },
        { t: 'Phone GPUs got abducted first.', m: 'y' },
        { t: 'PC only. Even off-world.', m: 'b' },
        { t: 'The Jupiter guys play on ultra.', m: 'g' },
        { t: 'They crossed galaxies. Not platforms.', m: 'y' },
    ],
    pt: [
        { t: 'Essa invasão precisa de um cockpit maior.', m: 'g' },
        { t: 'O feixe não cabe nessa tela.', m: 'y' },
        { t: 'Alien invade em desktop.', m: 'b' },
        { t: 'Seu dedo tá tapando a abdução.', m: 'y' },
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
