// ============================================================
//  A busca que entende, do "Tire sua dúvida". Sem IA paga, sem servidor.
//
//  Adaptada do busca.js do Organograma da Saúde, que já tinha sido testado
//  com gente de verdade. Ela não procura a palavra exata: tira acento,
//  entende plural, perdoa erro de digitação e dá mais peso a uma frase
//  conhecida inteira dentro da pergunta.
//
//  Ela não sabe nada do fluxograma: quem "entende" é a base (duvidas.js).
//  Quanto mais jeitos de perguntar estiverem lá, mais esperta ela fica.
//  É lá que se ensina, não aqui. Pura, para ser testada no Node.
// ============================================================

// Palavras que dizem COMO a pessoa fala, não o que ela quer. "sim" e "não"
// estão aqui de propósito: soltas, aparecem em quase toda dúvida ("não
// consigo..."); por isso só contam dentro de frase inteira ("sim e não").
const VAZIAS = new Set((
  'a o as os um uma uns umas de da do das dos em no na nos nas para pra pro por com sem '
  + 'e ou que se eu me meu minha meus minhas seu sua voce ele ela isso esse essa este esta aqui ali la '
  + 'quero queria preciso precisa precisando gostaria como onde qual quais quem quando porque pq tem ter '
  + 'fazer faco faz ir vou vai sobre ao aos ja nao sim tipo coisa algum alguma mais muito bom dia tarde '
  + 'noite oi ola favor consigo consegue conseguir posso pode poderia ta agora entao ai gente sistema programa site'
).split(' '));

export function normalizar(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Raiz leve do português: o bastante para plural, sem juntar palavras diferentes.
export function raizDe(p) {
  if (p.length <= 3) return p;
  if (p.endsWith('coes')) return p.slice(0, -4) + 'cao';
  if (p.endsWith('oes') || p.endsWith('aes')) return p.slice(0, -3) + 'ao';
  if (p.endsWith('ais')) return p.slice(0, -3) + 'al';
  if (p.endsWith('eis')) return p.slice(0, -3) + 'el';
  if (p.endsWith('ns')) return p.slice(0, -2) + 'm';
  if (p.endsWith('s') && !p.endsWith('ss') && p.length > 4) return p.slice(0, -1);
  return p;
}

export function palavras(t, tirarVazias) {
  const ps = normalizar(t).split(' ').filter(Boolean);
  return (tirarVazias ? ps.filter((p) => !VAZIAS.has(p)) : ps).map(raizDe);
}

function distancia(a, b, teto) {
  if (Math.abs(a.length - b.length) > teto) return teto + 1;
  let ant = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < menor) menor = cur[j];
    }
    if (menor > teto) return teto + 1;
    ant = cur;
  }
  return ant[b.length];
}

// Quão bem a palavra q casa com a palavra k: 0 a 1.
export function casa(q, k) {
  if (q === k) return 1;
  const menor = Math.min(q.length, k.length);
  // Começo igual: "apago" acha "apagar"; diferença de tamanho até 3.
  if (menor >= 4 && Math.abs(q.length - k.length) <= 3) {
    let i = 0;
    while (i < menor && q[i] === k[i]) i++;
    if (i >= menor - 1 && i >= 4) return 0.9;
  }
  // Erro de digitação: 1 letra a partir de 5; 2 a partir de 8.
  if (menor >= 5) {
    const teto = menor >= 8 ? 2 : 1;
    if (distancia(q, k, teto) <= teto) return 0.8;
  }
  return 0;
}

function melhorCasamento(q, lista) {
  let m = 0;
  for (const k of lista) {
    const c = casa(q, k);
    if (c > m) m = c;
    if (m === 1) break;
  }
  return m;
}

// Termo com "sim" ou "não" só vale como FRASE INTEIRA. Palavra por palavra,
// "não na seta" viraria só "seta" e "não consigo mover" só "mover", e essas
// respostas apareceriam para qualquer dúvida sobre setas ou sobre mover.
const SO_FRASE = new Set(['sim', 'nao']);

// Nota de uma frase conhecida (termo) contra a pergunta.
function notaTermo(qNorm, qPalavras, termo) {
  const tNorm = normalizar(termo);
  if (!tNorm) return 0;
  const tPal = palavras(tNorm, true);
  const todas = tNorm.split(' ');
  // A frase inteira dentro da pergunta é o sinal mais forte (vale até para
  // frases só de palavras vazias, como "sim e não"). Dentro da frase, "sim" e
  // "não" têm sentido e contam no peso ("escrevo sim" vale mais que "escrevo").
  // No empate, vence a que aparece antes na pergunta.
  const pos = (` ${qNorm} `).indexOf(` ${tNorm} `);
  if (pos >= 0) {
    const peso = tPal.length + todas.filter((p) => SO_FRASE.has(p)).length;
    return 10 + peso * 2 + (1 - pos / (qNorm.length + 1)) * 0.9;
  }
  if (todas.some((p) => SO_FRASE.has(p))) return 0;
  // Frase de várias palavras com UMA só de conteúdo ("mais uma caixa", "fazer a
  // seta") também só vale inteira: palavra por palavra ela vira "caixa" ou "seta"
  // e passa a responder qualquer dúvida sobre caixas ou setas. (Palavra solta,
  // como "negrito", continua casando com plural e erro de digitação.)
  if (tPal.length === 1 && todas.length > 1) return 0;
  if (!tPal.length || !qPalavras.length) return 0;
  let soma = 0;
  for (const tp of tPal) soma += melhorCasamento(tp, qPalavras);
  const fracao = soma / tPal.length;
  if (fracao >= 0.99) return 6 + tPal.length * 2;
  if (fracao >= 0.8 && tPal.length > 1) return 5 + tPal.length;
  if (tPal.length === 1) return fracao * 6;
  return fracao >= 0.5 ? fracao * 4 : 0;
}

// O melhor termo decide; os outros só desempatam, e pouco (senão ganharia quem
// cadastrou mais variações da mesma palavra).
function notaItem(qNorm, qPalavras, item) {
  let melhor = 0;
  let soma = 0;
  for (const t of [item.pergunta, ...item.termos]) {
    const n = notaTermo(qNorm, qPalavras, t);
    if (n > melhor) melhor = n;
    soma += n;
  }
  return melhor + Math.min(soma - melhor, 4) * 0.05;
}

// base: [{ id, pergunta, termos, passos, mostrar?, comum? }]
// → { resposta: item | null, alternativas: [item, ...] (até 2) }
export function buscar(base, consulta) {
  const qNorm = normalizar(consulta);
  const qPal = palavras(consulta, true);
  if (!qNorm) return { resposta: null, alternativas: [] };
  const palQ = qPal.length ? qPal : palavras(consulta, false);
  const notas = base
    .map((item) => ({ item, nota: notaItem(qNorm, palQ, item) }))
    .filter((x) => x.nota >= 3)
    .sort((a, b) => b.nota - a.nota);
  if (!notas.length || notas[0].nota < 4.5) {
    return { resposta: null, alternativas: notas.slice(0, 2).map((x) => x.item) };
  }
  return {
    resposta: notas[0].item,
    alternativas: notas.slice(1, 3).filter((x) => x.nota >= notas[0].nota * 0.6).map((x) => x.item),
  };
}
