export type SampleText = {
  label: string;
  description: string;
  text: string;
};

export const SAMPLE_TEXTS: SampleText[] = [
  {
    label: 'Consulta inicial',
    description: 'Primeira consulta com queixas de interação social, rigidez e agitação.',
    text: `Consulta de primeira vez (pediatria do desenvolvimento). Mãe e pai presentes.

Queixa principal:
- Dificuldades na interação social e comportamento agitado desde os 3-4 anos.

História:
A mãe relata que a criança frequentemente evita contato visual, desvia o olhar e às vezes
"parece não ouvir" quando é chamada. Na escola, a professora descreve que ele tende a
brincar sozinho e demora a iniciar interação com outras crianças. Em situações de grupo,
pode ficar mais retraído.

Rotina e rigidez:
Os pais referem irritabilidade quando há mudança na rotina, especialmente no horário do
banho e do jantar. Se a sequência é alterada, ele chora e insiste em "fazer do jeito certo".
Também tem interesses muito fixos por carrinhos e por um desenho específico, falando
longamente sobre o assunto.
Em um exemplo típico, fica irritado quando muda a rotina.

Sensorial:
Queixa de incômodo com sons altos (liquidificador, secador). Em algumas ocasiões, tampa os ouvidos.
Refere que incomoda com sons em ambientes cheios.

Atenção e atividade:
Em casa, é muito agitado, não para quieto e tem dificuldade de permanecer em uma atividade
por muito tempo. Perde objetos com frequência (lápis, borracha). A mãe afirma que ele não
apresenta impulsividade grave, mas por vezes interrompe conversas.

Negativas relevantes:
Nega estereotipias motoras claras. Nega falta de reciprocidade emocional marcada (a mãe diz
que ele busca colo).

Objetivo da consulta:
Registrar sinais e lacunas para orientar investigação clínica, sem concluir diagnóstico.`,
  },
  {
    label: 'Com dados pessoais (PII)',
    description: 'Narrativa curta com nome, e-mail, telefone e CPF para testar anonimização.',
    text: `Paciente do sexo masculino, 7 anos. Narrativa de familiares.

Meu filho João Pedro tem 7 anos. Contato para retorno: joao@example.com e telefone (11) 91234-5678.
Documento informado anteriormente: 123.456.789-10.

A mãe relata que ele não olha nos olhos quando falo. Na escola, prefere ficar sozinho e não
inicia interação.
Fica irritado quando muda a rotina. Em casa, é muito agitado e não para quieto.

Objetivo: demonstrar anonimização antes de processar/salvar texto.`,
  },
  {
    label: 'Seguimento (repetições)',
    description: 'Consulta de seguimento com múltiplas ocorrências do mesmo sintoma.',
    text: `Consulta de seguimento (pediatria do desenvolvimento). Responsável presente.

Queixa principal:
- "Ele é muito agitado" e "não para quieto" em diferentes ambientes.

Relato detalhado:
Durante a manhã, a mãe refere que ele é muito agitado e não para quieto nem para comer.
À tarde, relata novamente que é muito agitado e não para quieto durante as tarefas escolares.
No fim do dia, repete que ele é muito agitado e não para quieto quando precisa tomar banho.
No final de semana, a família menciona que ele é muito agitado e não para quieto no mercado.
Ainda assim, quando está interessado em um desenho, consegue permanecer por alguns minutos.

Sensorial:
Fica incomodado com sons em locais cheios; relata que incomoda com sons e tampa os ouvidos
quando há barulhos altos.

Interação:
Em alguns momentos evita olhar nos olhos. Já houve episódios em que desvia o olhar quando é chamado.

Negativas:
Nega estereotipias motoras.

Objetivo:
Testar múltiplas ocorrências do mesmo sintoma e garantir que o sistema retorne poucas evidências
(top N) para legibilidade e auditoria.`,
  },
  {
    label: 'Narrativa completa (grande)',
    description: 'Caso extenso com diário de 7 dias, transcrições e contradições intencionais.',
    text: `Consulta clínica (pediatria do desenvolvimento / neuropsiquiatria infantil).
Data: 2026-02-10. Participantes: mãe, pai e professora (relato escrito).

Identificação e contato (dados fictícios para teste de LGPD):
- Meu filho João Pedro da Silva tem 7 anos e 4 meses.
- Contato para retorno: joaopedro.silva@example.com; telefone +55 (11) 91234-5678.
- Documento informado anteriormente: 123.456.789-10.

Motivo da consulta (queixa principal):
Os responsáveis pedem avaliação por dificuldades persistentes em interação social, rigidez com rotinas,
hiper-reatividade sensorial e comportamento agitado/distrátil. Reforçam que o objetivo é organizar
as observações e identificar lacunas do que ainda precisa ser perguntado, sem concluir diagnóstico.

Histórico do desenvolvimento (resumo):
- Gestação sem intercorrências relevantes (segundo relato). Parto a termo.
- Marcos motores dentro do esperado, porém sempre foi "muito agitado" e com sono irregular.
- Linguagem: começou a falar tarde; hoje fala bastante quando o tema interessa, mas em conversas
  abertas pode responder de forma curta ou "desligada".

Contexto familiar e rotina:
Em casa, os pais descrevem que ele insiste nas mesmas rotinas. Se muda a ordem do banho e do jantar,
ele fica irritado quando muda a rotina, chora e insiste em fazer "do jeito certo". Se alguém tenta
adiantar uma etapa, ele reage com rigidez. Em algumas semanas, melhora; em outras, piora.
Relatam também interesses muito fixos por carrinhos e por um desenho específico, falando longamente
sobre o assunto, repetindo detalhes.

Interação social (exemplos concretos):
- A mãe relata: "ele não olha nos olhos quando falo", "evita olhar nos olhos" e às vezes desvia o olhar.
- Em festas, prefere ficar sozinho; costuma brincar sozinho e não brinca com outras crianças por muito tempo.
- Na escola, segundo a professora, ele demora a iniciar interação com outras crianças e não inicia interação
  espontaneamente com frequência.
- Em alguns dias, quando está muito interessado, chega a olhar nos olhos por alguns segundos, mas logo volta
  a desviar o olhar e se afasta.

Reciprocidade emocional:
Os pais relatam momentos de busca de colo e carinho, porém também descrevem que por vezes há pouca
reciprocidade emocional em situações de conversa. A professora descreve que ele não responde emocionalmente
em várias interações sociais (ex: quando colegas se aproximam), mas com adultos conhecidos pode buscar contato.
Em outra parte do relato, a mãe diz: "nega falta de reciprocidade emocional marcada", pois ele busca colo.

Comportamento repetitivo e estereotipias:
Os pais inicialmente dizem: "Nega estereotipias motoras claras". Porém, ao detalhar situações de estresse,
relatam que às vezes ele balanca as maos e apresenta movimentos repetitivos quando fica ansioso no mercado
ou quando há barulho. Não é constante, mas aparece em momentos específicos.

Sensorial (sons e ambientes):
Há queixa de incômodo com sons altos (liquidificador, secador, obras). A mãe relata que ele é muito sensivel
a barulhos e incomoda com sons em locais cheios; em algumas ocasiões, tampa os ouvidos.
Em ambientes com muitos estímulos, ele parece mais irritado e quer sair.

Atenção e atividade (desatenção/hiperatividade):
Em casa, é muito agitado e não para quieto. Corre pela casa, levanta no meio das refeições e muda de atividade
frequentemente. Na escola, a professora relata que ele perde o foco rapidamente, se distrai com facilidade e
tem dificuldade de manter a atenção nas atividades, principalmente quando a tarefa é longa.
Os pais relatam que ele vive perdendo materiais: perde objetos como lápis e borracha, perde objetos em casa e
perde objetos na mochila com frequência.

Impulsividade (nuances e contradições propositais para teste):
Os pais dizem: "Nega impulsividade grave". Porém, também relatam comportamentos como:
- por vezes interrompe conversas e fala por cima;
- age por impulso quando quer pegar um brinquedo;
- não espera sua vez em jogos simples.
Em um trecho, a família afirma: "Nega impulsividade". Em outro: "ele está impulsivo e interrompe os outros".

Relato escolar (com exemplos):
A professora descreve que, em atividades em grupo, ele se isola dos outros e prefere ficar sozinho.
Quando a rotina da sala muda (troca de professor, alteração do horário), ele fica irritado quando muda a rotina.
Em dias de prova, ele parece mais sensível a barulhos e tampa os ouvidos.

Saúde geral e sono:
Alimentação razoável. Sono irregular (demora para dormir e acorda cedo). Sem queixas clínicas graves no momento.
Sem uso de medicações. Sem histórico de internações segundo relato.

Linha do tempo (nuances temporais):
- 2024: pais relatam que ele quase nunca fazia contato visual; evitava olhar nos olhos.
- 2025: melhora parcial com mudança de professora, mas ainda desvia o olhar em conversas longas.
- 2026 (últimos 3 meses): piora em agitação, irritabilidade e rigidez; mudança na rotina virou gatilho mais frequente.

Diário (7 dias) com exemplos (texto grande propositalmente; repetições intencionais):

Dia 1 (segunda):
- Manhã: acordou cedo, ficou muito agitado, não para quieto. Perde objetos antes de sair (lápis).
- Escola: perde o foco rapidamente em matemática; demora a iniciar interação no recreio; brinca sozinho.
- Tarde: incomoda com sons de obra na rua; tampa os ouvidos.
- Noite: fala longamente sobre carrinhos e repete detalhes (interesses muito fixos).

Dia 2 (terça):
- Manhã: rotina alterada (banho mais cedo); fica irritado quando muda a rotina.
- Escola: professora nota que ele interrompe conversas e não espera sua vez em jogos.
- Tarde: se distrai com facilidade durante dever de casa; perde o foco rapidamente.
- Noite: evita olhar nos olhos quando chamado; desvia o olhar e se isola.

Dia 3 (quarta):
- Manhã: diz "não quero" quando muda a sequência do café; insiste em fazer do jeito certo.
- Escola: se isola dos outros; prefere ficar sozinho. Não inicia interação espontaneamente.
- Tarde: muito sensível a barulhos; incomoda com sons; tampa os ouvidos no mercado.
- Noite: pai diz "nega impulsividade", mas ele age por impulso para pegar um brinquedo.

Dia 4 (quinta):
- Manhã: afirma estar calmo, mas corre pela casa e não para quieto.
- Escola: perde objetos (borracha) e esquece materiais.
- Tarde: relata que não brinca com outras crianças por muito tempo; brinca sozinho.
- Noite: mãe percebe que ele balanca as maos quando ansioso (não constante).

Dia 5 (sexta):
- Manhã: rotina igual e melhora; ainda assim perde o foco rapidamente quando a tarefa é longa.
- Escola: responde pouco emocionalmente aos colegas; não responde emocionalmente a convites para brincar.
- Tarde: fica irritado quando muda a rotina de voltar para casa; insiste nas mesmas rotinas.
- Noite: ao ser questionado, evita contato visual e desvia o olhar.

Dia 6 (sábado):
- Manhã: família relata "nega impulsividade grave", mas ele interrompe os outros durante conversas.
- Mercado: incomoda com sons; tampa os ouvidos; fica irritado quando muda a rota entre corredores.
- Tarde: perde objetos (chave) e "vive perdendo" itens pequenos.
- Noite: prefere ficar sozinho; se isola dos outros em reunião familiar.

Dia 7 (domingo):
- Manhã: passeio ao parque; inicia interação em 1 momento, mas depois se afasta e prefere ficar sozinho.
- Tarde: quando o assunto é desenho específico, fala muito e mantém atenção por alguns minutos.
- Noite: ao trocar o horário do banho, fica irritado quando muda a rotina.

Checklist (respostas e lacunas propositais):
- Contato visual: reduzido (evita olhar nos olhos, desvia o olhar).
- Interação social: isolamento social e dificuldade em iniciar interação (demora a iniciar interação).
- Rotina/rigidez: insistência nas mesmas rotinas e irritabilidade na mudança na rotina.
- Sensorial: incômodo com sons e hipersensibilidade; tampa os ouvidos.
- Atenção: perde o foco rapidamente, se distrai com facilidade.
- Hiperatividade: muito agitado, não para quieto.
- Impulsividade: relato misto (nega impulsividade grave vs interrompe conversas, não espera sua vez, age por impulso).

Campos em aberto (para gap analysis):
- Frequência exata e intensidade por contexto (casa vs escola).
- Prejuízo funcional (notas, relações, autocuidado).
- Eventos de estresse recentes e histórico familiar.

Transcrição resumida (trechos de fala; grande e repetitivo propositalmente):
Mãe: "Quando eu falo com ele, ele não olha nos olhos. Parece que desvia o olhar e fica no mundo dele."
Pai: "Às vezes ele até olha nos olhos quando eu mostro o carrinho novo, mas logo volta a evitar contato visual."
Mãe: "Na escola ele brinca sozinho. A professora disse que ele prefere ficar sozinho e não brinca com outras crianças."
Pai: "Ele demora a iniciar interação, parece que não inicia interação por conta própria."
Mãe: "Se eu mudo a rotina, ele fica irritado quando muda a rotina. Se eu troco a ordem do banho, ele insiste nas mesmas rotinas."
Pai: "Ele insiste em fazer do jeito certo. Se eu digo 'vamos fazer diferente', ele fica mais irritado."
Mãe: "Ele incomoda com sons. No mercado ele tampa os ouvidos. Em casa, com o liquidificador, tampa os ouvidos."
Pai: "Ele é muito sensível a barulhos. Às vezes ele fala que o som dói."
Mãe: "Ele não para quieto. Ele é muito agitado. Ele corre, levanta, muda de assunto."
Pai: "Na tarefa ele perde o foco rapidamente. Ele se distrai com facilidade."
Mãe: "Ele vive perdendo. Perde objetos. Perde a borracha, perde o lápis, perde o estojo."
Pai: "Em alguns dias ele disse que não perde objetos, mas na prática perde objetos de novo."
Mãe: "Nega impulsividade grave, mas ele interrompe conversas. Ele interrompe os outros o tempo todo."
Pai: "Ele age por impulso quando vê algo que quer. E não espera sua vez."
Mãe: "Sobre estereotipias, eu falei que nega estereotipias motoras claras, mas quando está ansioso ele balanca as maos."
Pai: "Movimentos repetitivos aparecem mais quando está cansado ou com barulho."
Mãe: "Ele busca colo e carinho. Eu disse que nega falta de reciprocidade emocional marcada, mas às vezes ele não responde emocionalmente."
Pai: "Com a irmã ele brinca um pouco, mas depois se isola dos outros."

Relato de escola (mais detalhado; com nuances):
- Em roda de conversa, ele olha para baixo, evita olhar nos olhos e desvia o olhar.
- Quando é chamado para apresentar, perde o foco rapidamente e se distrai com facilidade com ruídos.
- Quando a rotina muda (substituição de professor), fica irritado quando muda a rotina.
- No recreio, brinca sozinho; às vezes observa de longe e prefere ficar sozinho.
- Em jogos, não espera sua vez e age por impulso para pegar peças.
- Perde objetos com frequência e "vive perdendo" itens pequenos na sala.

Relato de terapia/apoio (fictício):
- Foi tentado quadro de rotina e previsibilidade. Em semanas melhores, há redução de crises, mas ainda há rigidez com rotinas.
- Estratégias de regulação sensorial (fone abafador) ajudaram parcialmente, mas ele ainda incomoda com sons e tampa os ouvidos em situações intensas.
- Para atenção, intervalos curtos ajudam; em tarefas longas, perde o foco rapidamente.

Questionário rápido (respostas fechadas; para testar repetição e variedade):
- Contato visual reduzido: sim.
- Dificuldade em iniciar interação: sim.
- Isolamento social: sim (prefere ficar sozinho, brinca sozinho).
- Falta de reciprocidade emocional: relato misto (às vezes busca colo, às vezes não responde emocionalmente).
- Estereotipias motoras: relato misto (nega estereotipias claras, mas há movimentos repetitivos em estresse).
- Insistência nas mesmas rotinas: sim.
- Interesses hiperfocados: sim (carrinhos/desenho; interesses muito fixos).
- Sensibilidade sensorial: sim (sons; tampa os ouvidos).
- Dificuldade de foco: sim (se distrai com facilidade, perde o foco rapidamente).
- Agitação motora: sim (muito agitado, não para quieto).
- Impulsividade: sim (interrompe conversas, não espera sua vez, age por impulso), embora negue gravidade.
- Perda de objetos: sim (perde objetos; vive perdendo).

Objetivo do texto:
Este texto foi escrito propositalmente grande, com repetições e nuances (negações e afirmações no mesmo sintoma)
para testar:
- normalização semântica (sinônimos e variações)
- negação (inclusive quando há menções mistas)
- evidências com offsets e auditoria pelo texto processado (anonimizado)
- robustez do sistema com narrativas longas`,
  },
];
