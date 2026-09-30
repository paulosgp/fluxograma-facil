# "Tire sua dúvida" — plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o botão "Tire sua dúvida": a pessoa escreve a dúvida do jeito dela e recebe a
resposta em passos, com "Mostrar na tela" apontando o botão certo.

**Architecture:** São três módulos novos:
- `js/busca.js`, o motor, puro, adaptado do `busca.js` do Organograma da Saúde;
- `js/duvidas.js`, a base, com as perguntas sobre o uso do sistema;
- `js/duvidas-tela.js`, a janela.

O `app.js` liga a janela ao botão e faz o "piscar". O motor e a base têm testes no Node; a janela é
conferida no navegador.

**Tech Stack:** o mesmo do app (módulos ES, `node --test`).

**Desenho:** `docs/superpowers/specs/2026-09-29-tire-sua-duvida-design.md`.

**Convenções:** as mesmas do plano principal. Os blocos marcados com `arquivo=<caminho>` são o
arquivo completo e podem ser gravados com o extrator do scratchpad. Os commits terminam com
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Mapa de arquivos

| Arquivo | Mudança |
|---|---|
| `js/busca.js` | **novo**: normalizar, raiz, palavras vazias, tolerância a erro, nota por frase |
| `js/duvidas.js` | **novo**: `BASE` (≈ 42 perguntas) e `COMUNS` (ids da lista inicial) |
| `js/duvidas-tela.js` | **novo**: abrir/fechar, perguntar, desenhar respostas, "Mostrar na tela" |
| `testes/busca.test.js` | **novo**: o motor com uma base de brinquedo |
| `testes/duvidas.test.js` | **novo**: integridade da base e ≈ 60 frases reais → resposta esperada |
| `index.html` | trocar o botão "Ajuda" por "Tire sua dúvida"; janela `#duvidas` |
| `estilo.css` | janela de dúvidas, botão em destaque, animação `.piscando` |
| `js/app.js` | ligar o botão, o Esc, o `dialogoAberto` e o `piscar`; remover a ajuda antiga |
| `js/painel.js` | dica "Tem dúvida?" no painel sem seleção |

---

### Task 1: O motor da busca

**Files:**
- Create: `js/busca.js`
- Test: `testes/busca.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/busca.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, raizDe, palavras, casa, buscar } from '../js/busca.js';

const BASE = [
  { id: 'desfazer', pergunta: 'Como desfazer?', termos: ['desfazer', 'voltar o que fiz', 'errei'], passos: ['x'] },
  { id: 'cor', pergunta: 'Como mudar a cor?', termos: ['mudar a cor', 'pintar', 'colorir'], passos: ['x'] },
  { id: 'simnao', pergunta: 'SIM ou NÃO na seta', termos: ['sim e nao', 'sim na seta'], passos: ['x'] },
];

test('normalizar tira acento, pontuação e sobra de espaço', () => {
  assert.equal(normalizar('  Não  consigo, ESCREVER!! '), 'nao consigo escrever');
});

test('raiz leve: plural sai, palavra curta fica', () => {
  assert.equal(raizDe('setas'), 'seta');
  assert.equal(raizDe('ligacoes'), 'ligacao');
  assert.equal(raizDe('cor'), 'cor');
});

test('palavras vazias saem; "sim" e "não" só contam dentro de frase', () => {
  assert.deepEqual(palavras('como eu faço pra pintar', true), ['pintar']);
  assert.deepEqual(palavras('sim e não', true), []);
});

test('casa: igual, começo da palavra e erro de digitação', () => {
  assert.equal(casa('pintar', 'pintar'), 1);
  assert.equal(casa('apagar', 'apago'), 0.9);
  assert.equal(casa('desfazer', 'desfaser'), 0.8);
  assert.equal(casa('cor', 'dor'), 0);
});

test('buscar: acha pela frase, pelo sinônimo e com erro de digitação', () => {
  assert.equal(buscar(BASE, 'errei, e agora?').resposta.id, 'desfazer');
  assert.equal(buscar(BASE, 'quero pintar a caixa').resposta.id, 'cor');
  assert.equal(buscar(BASE, 'como desfaser').resposta.id, 'desfazer');
  assert.equal(buscar(BASE, 'como coloca sim e não').resposta.id, 'simnao');
});

test('termo com "sim"/"não" só vale inteiro: "mexer na seta" não cai no SIM/NÃO', () => {
  assert.equal(buscar(BASE, 'mexer na seta').resposta, null);
});

test('buscar: nada parecido, sem resposta; campo vazio também', () => {
  assert.equal(buscar(BASE, 'receita de bolo').resposta, null);
  assert.equal(buscar(BASE, '   ').resposta, null);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `node --test testes/busca.test.js` → FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

```js arquivo=js/busca.js
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
  // A frase inteira dentro da pergunta é o sinal mais forte (vale até para
  // frases só de palavras vazias, como "sim e não"). No empate, vence a que
  // aparece antes na pergunta.
  const pos = (` ${qNorm} `).indexOf(` ${tNorm} `);
  if (pos >= 0) return 10 + tPal.length * 2 + (1 - pos / (qNorm.length + 1)) * 0.9;
  if (tNorm.split(' ').some((p) => SO_FRASE.has(p))) return 0;
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
```

- [ ] **Step 4: Rodar e ver passar** — `node --test testes/busca.test.js` → PASS (7 testes).
- [ ] **Step 5: Commit** — `git add js/busca.js testes/busca.test.js && git commit -m "Busca do Tire sua dúvida: sem acento, plural, erro de digitação e frases"`

### Task 2: A base de perguntas

**Files:**
- Create: `js/duvidas.js`
- Test: `testes/duvidas.test.js` (Task 3)

Regras da base:
- **só sobre o USO do sistema,** nada clínico;
- linguagem de quem tem dificuldade, com o nome exato dos botões na tela;
- **frases com duas ou mais palavras de conteúdo valem mais que palavra solta.** Por isso, cada
  dúvida parecida com outra ganha frases próprias (ex.: "apagar a seta" em `apagar-seta`, para não
  cair em `apagar-forma`).

- [ ] **Step 1: Gravar a base**

```js arquivo=js/duvidas.js
// A base do "Tire sua dúvida": as perguntas sobre COMO USAR o sistema, cada uma
// com vários jeitos de perguntar (termos) e a resposta em passos curtos.
// Nada clínico aqui — mesma regra do resto do app.
//
// É aqui que se ensina a busca (js/busca.js não sabe nada do fluxograma):
// dúvida nova, ou pergunta que caiu na resposta errada → acrescente frases
// nos termos (frases com duas palavras de conteúdo valem mais que palavra
// solta) e um caso em testes/duvidas.test.js.
//
// mostrar: seletor do que pisca em "Mostrar na tela" (tem de existir no index.html).

export const BASE = [
  {
    id: 'usar-geral',
    pergunta: 'Como usar o sistema, do começo ao fim?',
    termos: ['como usar', 'como funciona', 'como funciona isso', 'passo a passo', 'por onde comeco', 'por onde começar',
      'como comecar', 'nao sei usar', 'nao sei mexer', 'primeira vez', 'tutorial', 'manual', 'ajuda', 'me ensina',
      'explicar como funciona'],
    passos: [
      'Escolha "Começar com o modelo" (as formas já vêm no lugar) ou "Começar com a folha vazia".',
      'Para escrever, clique numa forma e digite. Para terminar, clique fora dela.',
      'Para mover, aperte o botão do mouse em cima da forma e arraste.',
      'Para pôr uma forma nova, use os botões da esquerda (Retângulo, Losango...).',
      'Para ligar formas, clique numa forma e depois no + azul. Ou use o botão Seta.',
      'Errou? Clique em Desfazer. Terminou? Clique em "Imprimir ou PDF".',
      'Para continuar outro dia, use "Salvar no computador" e, depois, Abrir.',
    ],
    comum: true,
  },
  {
    id: 'escrever',
    pergunta: 'Como escrever dentro de uma forma?',
    termos: ['escrever', 'escrevo', 'digitar', 'digito', 'colocar texto', 'por texto', 'botar texto', 'escrever na caixa',
      'escrever no quadrado', 'escrever na forma', 'onde escrevo', 'onde digito', 'preencher', 'colocar palavra',
      'colocar o nome', 'texto na forma', 'nao consigo escrever', 'nao aparece o que eu digito', 'nao escreve'],
    passos: [
      'Clique uma vez na forma.',
      'Quando aparecer o risquinho piscando, é só digitar.',
      'Para terminar, clique fora da forma.',
    ],
    mostrar: '#folha',
    comum: true,
  },
  {
    id: 'apagar-texto',
    pergunta: 'Como apagar ou corrigir o que escrevi?',
    termos: ['apagar o que escrevi', 'apagar texto', 'apagar o texto', 'apagar a palavra', 'apagar letra', 'corrigir',
      'corrijo', 'corrigir o texto', 'escrevi errado', 'errei a palavra', 'errei o texto', 'mudar o texto',
      'trocar o texto', 'editar o texto', 'arrumar o texto', 'consertar o texto'],
    passos: [
      'Clique na forma, no ponto do texto que quer mudar.',
      'Use a tecla de apagar (Backspace, a tecla grande com a seta ←) ou a tecla Delete.',
      'Ou passe o mouse por cima das palavras, com o botão apertado, e digite por cima.',
    ],
  },
  {
    id: 'mover',
    pergunta: 'Como mudar uma forma de lugar?',
    termos: ['mover', 'mexer a caixa', 'arrastar', 'arrasto', 'mudar de lugar', 'trocar de lugar', 'levar para outro lugar',
      'empurrar', 'puxar a caixa', 'posicao', 'mudar a posicao', 'nao consigo mover', 'nao sai do lugar'],
    passos: [
      'Aperte o botão do mouse em cima da forma e, sem soltar, arraste.',
      'Solte onde quiser. Ela se ajeita sozinha na grade, e as setas vão junto.',
      'Se você estiver escrevendo nela, pegue pela beirada, fora das letras.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'tamanho',
    pergunta: 'Como aumentar ou diminuir uma forma?',
    termos: ['aumentar a forma', 'aumentar a caixa', 'diminuir a caixa', 'diminuir a forma', 'tamanho da caixa',
      'tamanho da forma', 'caixa maior', 'caixa menor', 'forma maior', 'forma menor', 'esticar', 'encolher', 'alargar',
      'redimensionar', 'mudar o tamanho', 'caixa muito grande', 'caixa muito pequena'],
    passos: [
      'Clique na forma. Aparecem quadradinhos azuis nos cantos.',
      'Aperte o mouse num quadradinho e arraste: para fora aumenta, para dentro diminui.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'forma-nova',
    pergunta: 'Como colocar uma forma nova?',
    termos: ['forma nova', 'nova forma', 'colocar forma', 'colocar outra forma', 'coloco outra forma', 'colocar caixa',
      'outra caixa', 'mais uma caixa', 'adicionar', 'acrescentar', 'inserir', 'criar forma', 'criar caixa',
      'por um quadrado', 'colocar retangulo', 'colocar losango', 'colocar circulo', 'colocar bolinha',
      'colocar quadradinho'],
    passos: [
      'Olhe os botões da esquerda, em "Pôr na folha": Retângulo, Arredondado, Losango, Círculo e Texto.',
      'Clique no que quiser: a forma aparece na folha, pronta para escrever.',
      'Depois, arraste para o lugar certo.',
    ],
    mostrar: '.paleta',
    comum: true,
  },
  {
    id: 'ligar',
    pergunta: 'Como ligar uma forma na outra com seta?',
    termos: ['ligar', 'ligar as formas', 'ligar uma na outra', 'ligar as caixas', 'colocar seta', 'colocar a seta',
      'criar seta', 'faco a seta', 'faz a seta', 'fazer a seta', 'seta entre', 'colocar flecha', 'fazer flecha',
      'conectar', 'conectar as formas', 'conecto as formas', 'ligacao', 'apontar de uma pra outra', 'linha entre as caixas'],
    passos: [
      'Jeito mais fácil: clique numa forma e depois no + azul do lado onde quer a próxima. Ela nasce já ligada por seta.',
      'Para ligar duas formas que já existem: clique no botão Seta, à esquerda.',
      'Depois clique na forma de onde a seta SAI e, por último, na forma aonde ela CHEGA.',
    ],
    mostrar: '#bt-seta',
    comum: true,
  },
  {
    id: 'mais-azul',
    pergunta: 'Para que servem os + azuis em volta da forma?',
    termos: ['mais azul', 'os mais azuis', 'pra que serve o mais', 'para que serve o mais', 'bolinha azul',
      'bolinhas azuis', 'botao de mais', 'sinal de mais', 'circulo azul', 'simbolo de mais', 'botao azul'],
    passos: [
      'Eles aparecem quando você clica numa forma.',
      'Clicar num + cria outra forma igual daquele lado, já ligada por seta, pronta para escrever.',
      'Se não couber mais nada daquele lado, aparece um aviso.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'sim-nao',
    pergunta: 'Como colocar SIM ou NÃO na seta?',
    termos: ['sim e nao', 'sim ou nao', 'sim nao', 'sim na seta', 'nao na seta', 'escrever sim', 'escrever nao',
      'escrever sim na seta', 'colocar sim', 'colocar nao', 'por sim', 'por nao', 'escrever na seta', 'texto na seta',
      'nome na seta', 'palavra na seta', 'legenda da seta', 'rotulo', 'etiqueta'],
    passos: [
      'Clique em cima da seta. Ela fica azul.',
      'No painel da direita, clique em SIM ou em NÃO.',
      'Para outra palavra, escreva em "Ou escreva outro" e clique em Pôr.',
    ],
    mostrar: '#painel',
    comum: true,
  },
  {
    id: 'apagar-forma',
    pergunta: 'Como apagar uma forma?',
    termos: ['apagar a forma', 'apagar forma', 'apagar a caixa', 'apagar caixa', 'apagar o quadrado', 'apagar o losango',
      'apagar o circulo', 'apagar a bolinha', 'excluir', 'excluir a caixa', 'deletar', 'tirar a caixa', 'tirar a forma',
      'remover a caixa', 'remover', 'jogar fora', 'sumir com a caixa', 'eliminar'],
    passos: [
      'Clique na forma.',
      'Clique em Apagar, no painel da direita (ou aperte a tecla Delete).',
      'As setas ligadas a ela somem junto. Errou? Clique em Desfazer.',
    ],
    mostrar: '#painel',
    comum: true,
  },
  {
    id: 'apagar-seta',
    pergunta: 'Como apagar uma seta?',
    termos: ['apagar a seta', 'apagar seta', 'apagar a flecha', 'apagar flecha', 'tirar a seta', 'tirar a flecha',
      'excluir a seta', 'excluir a flecha', 'deletar a seta', 'remover a seta', 'remover a flecha', 'apagar a linha',
      'tirar a linha'],
    passos: [
      'Clique em cima da seta. Ela fica azul.',
      'Clique em "Apagar a seta", no painel da direita (ou aperte a tecla Delete).',
    ],
    mostrar: '#painel',
  },
  {
    id: 'desfazer',
    pergunta: 'Como desfazer o que eu fiz?',
    termos: ['desfazer', 'desfaco', 'desfaz', 'voltar', 'volta', 'volto', 'voltar atras', 'errei', 'fiz errado',
      'deu errado', 'estraguei', 'baguncei', 'ctrl z', 'como era antes', 'voltar como estava', 'cancelar o que fiz'],
    passos: [
      'Clique no botão Desfazer, no alto da tela (ou aperte Ctrl + Z).',
      'Cada clique volta um passo. Pode clicar várias vezes.',
      'Voltou demais? Clique em Refazer.',
    ],
    mostrar: '#bt-desfazer',
    comum: true,
  },
  {
    id: 'apagou-sem-querer',
    pergunta: 'Apaguei sem querer. Dá para recuperar?',
    termos: ['apaguei sem querer', 'sem querer', 'exclui sem querer', 'sumiu', 'sumiu a caixa', 'sumiu a forma',
      'desapareceu', 'perdi a forma', 'perdi a caixa', 'recuperar', 'trazer de volta', 'apaguei errado', 'apagou tudo'],
    passos: [
      'Clique em Desfazer, no alto da tela, quantas vezes precisar.',
      'Tudo volta, na ordem em que foi feito.',
    ],
    mostrar: '#bt-desfazer',
  },
  {
    id: 'refazer',
    pergunta: 'Para que serve o botão Refazer?',
    termos: ['refazer', 'refaz', 'ctrl y', 'desfiz demais', 'voltei demais', 'desfazer o desfazer', 'avancar'],
    passos: [
      'Ele desfaz o Desfazer: traz de volta o que você acabou de desfazer.',
      'Só funciona logo depois de usar o Desfazer.',
    ],
    mostrar: '#bt-refazer',
  },
  {
    id: 'cor',
    pergunta: 'Como mudar a cor de uma forma?',
    termos: ['cor', 'cores', 'mudar a cor', 'trocar a cor', 'pintar', 'colorir', 'colorido', 'cor da caixa',
      'cor da forma', 'fundo da caixa', 'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'rosa', 'roxo', 'cinza', 'branco'],
    passos: [
      'Clique na forma.',
      'No painel da direita, em "Cor", clique na cor que quiser.',
      'Para pintar várias de uma vez, escolha todas antes (veja "Como escolher várias formas de uma vez?").',
    ],
    mostrar: '#painel',
  },
  {
    id: 'borda',
    pergunta: 'Como deixar a borda tracejada (pontilhada)?',
    termos: ['tracejada', 'tracejado', 'pontilhada', 'pontilhado', 'borda', 'contorno', 'linha em volta',
      'risco em volta', 'tracinhos', 'borda lisa', 'linha da caixa pontilhada'],
    passos: [
      'Clique na forma.',
      'No painel da direita, em "Borda", clique em Tracejada. Para voltar, clique em Lisa.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'letra-tamanho',
    pergunta: 'Como aumentar ou diminuir a letra?',
    termos: ['letra maior', 'letra menor', 'aumentar a letra', 'diminuir a letra', 'tamanho da letra', 'letra pequena',
      'letra grande', 'letra muito pequena', 'fonte', 'fonte maior', 'fonte menor', 'aumentar a fonte', 'letra miuda',
      'nao consigo ler'],
    passos: [
      'Clique na forma.',
      'No painel da direita, em "Letra": A+ aumenta e A− diminui.',
      'Se o texto não couber, a forma cresce junto.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'negrito',
    pergunta: 'Como deixar a letra em negrito?',
    termos: ['negrito', 'letra forte', 'letra grossa', 'letra mais grossa', 'destacar', 'realcar', 'letra escura',
      'bold', 'grifar'],
    passos: [
      'Clique na forma.',
      'No painel da direita, clique em Negrito. Vale para todo o texto daquela forma.',
      'Clique de novo para tirar.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'alinhar',
    pergunta: 'Como deixar o texto à esquerda, em lista?',
    termos: ['alinhar', 'alinhamento', 'esquerda', 'texto na esquerda', 'centralizar', 'centralizado', 'no centro',
      'lista', 'fazer lista', 'topicos', 'itens', 'um embaixo do outro', 'organizar o texto', 'marcadores'],
    passos: [
      'Clique na forma.',
      'No painel da direita, em "Letra", clique em "À esquerda". Para voltar, "Centralizado".',
      'Para fazer lista, comece cada linha com um tracinho (-) e aperte Enter para ir para a próxima.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'pular-linha',
    pergunta: 'Como pular uma linha dentro da forma?',
    termos: ['pular linha', 'pular uma linha', 'nova linha', 'outra linha', 'linha de baixo', 'descer uma linha',
      'quebrar linha', 'enter', 'paragrafo'],
    passos: ['Enquanto escreve na forma, aperte a tecla Enter.'],
  },
  {
    id: 'trocar-forma',
    pergunta: 'Como trocar a forma (virar losango, círculo...)?',
    termos: ['trocar a forma', 'mudar a forma', 'trocar o formato', 'mudar o formato', 'virar losango', 'virar circulo',
      'virar quadrado', 'virar retangulo', 'transformar', 'mudar para losango', 'mudar pra losango',
      'mudar pra circulo', 'trocar quadrado por', 'mudar o desenho da caixa'],
    passos: [
      'Clique na forma.',
      'No painel da direita, em "Trocar a forma", clique no desenho da forma que quiser.',
      'O texto e a cor continuam.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'qual-forma',
    pergunta: 'Qual forma usar para cada coisa?',
    termos: ['qual forma usar', 'qual forma', 'para que serve o losango', 'pra que serve o losango', 'o que e o losango',
      'serve o losango', 'serve o circulo', 'diferenca entre as formas', 'significado das formas', 'quando usar',
      'o que significa'],
    passos: [
      'Losango: uma pergunta de SIM ou NÃO. Dele costumam sair duas setas.',
      'Retângulo ou Arredondado: o que fazer, o passo, o lugar para onde a pessoa vai.',
      'Círculo: o começo ou o fim do fluxo.',
      'Texto: uma observação solta, sem caixa em volta.',
    ],
    mostrar: '.paleta',
  },
  {
    id: 'duplicar',
    pergunta: 'Como fazer uma cópia de uma forma?',
    termos: ['copiar', 'copia', 'duplicar', 'fazer uma copia', 'mais uma igual', 'outra igual', 'repetir a forma',
      'clonar', 'ctrl c', 'copiar e colar'],
    passos: [
      'Clique na forma.',
      'Clique em Duplicar, no painel da direita.',
      'A cópia aparece do lado, com a mesma cor e o mesmo tamanho. Arraste para onde quiser.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'varias',
    pergunta: 'Como escolher várias formas de uma vez?',
    termos: ['varias formas', 'varias caixas', 'selecionar varias', 'escolher varias', 'todas de uma vez', 'mover tudo',
      'mover varias', 'mover tudo junto', 'marcar varias', 'selecionar tudo', 'grupo', 'juntas', 'apagar varias',
      'pintar varias'],
    passos: [
      'Aperte o mouse num lugar vazio da folha e arraste, fazendo um retângulo em volta das formas.',
      'Ou segure a tecla Shift e clique em cada forma.',
      'Depois, dá para arrastar, pintar ou apagar todas juntas.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'seta-torta',
    pergunta: 'A seta ficou torta ou passando por cima. Como arrumar?',
    termos: ['seta torta', 'seta ficou torta', 'seta ta torta', 'seta dobrada', 'seta passando por cima', 'seta por cima',
      'seta feia', 'seta no lugar errado', 'arrumar a seta', 'endireitar a seta', 'flecha torta', 'seta cruzando',
      'seta atravessando', 'ajustar caminho', 'mudar o caminho da seta'],
    passos: [
      'Arraste as formas para ficarem alinhadas, uma embaixo ou ao lado da outra: a seta fica reta sozinha.',
      'Ou clique na seta e, no painel da direita, em "Ajustar caminho", escolha por onde ela sai e por onde chega.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'inverter-seta',
    pergunta: 'A seta está apontando para o lado errado. Como virar?',
    termos: ['inverter', 'inverter a seta', 'seta ao contrario', 'seta invertida', 'apontando errado',
      'apontando pro lado errado', 'virar a seta', 'trocar a direcao', 'direcao da seta', 'sentido da seta',
      'ponta do outro lado'],
    passos: [
      'Clique na seta.',
      'Clique em "Inverter a seta", no painel da direita.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'titulo',
    pergunta: 'Como mudar o título?',
    termos: ['titulo', 'mudar o titulo', 'escrever o titulo', 'trocar o titulo', 'nome do fluxograma', 'trocar o nome',
      'cabecalho', 'faixa de cima', 'cor do titulo', 'cor da faixa', 'nome em cima'],
    passos: [
      'Clique no título, na faixa do alto da folha, e escreva. Enter termina.',
      'Para mudar a cor da faixa, clique no título e escolha a cor no painel da direita.',
    ],
    mostrar: '#titulo',
  },
  {
    id: 'deitar',
    pergunta: 'Como deixar a folha deitada (na horizontal)?',
    termos: ['deitar a folha', 'folha deitada', 'deitada', 'paisagem', 'horizontal', 'virar a folha', 'girar a folha',
      'folha em pe', 'em pe', 'retrato', 'vertical', 'folha de lado'],
    passos: [
      'Clique em "Deitar a folha", à esquerda, embaixo dos botões das formas.',
      'Para voltar, clique em "Pôr a folha em pé".',
      'Dica: o modelo foi feito com a folha em pé. Se deitar e ficar bagunçado, clique em Desfazer.',
    ],
    mostrar: '#bt-folha',
  },
  {
    id: 'imprimir',
    pergunta: 'Como imprimir?',
    termos: ['imprimir', 'imprimi', 'imprimo', 'impressora', 'impressao', 'tirar no papel', 'passar pro papel',
      'no papel', 'folha impressa'],
    passos: [
      'Clique em "Imprimir ou PDF", no alto da tela, e depois em Continuar.',
      'Na janela que abrir, escolha a impressora.',
      'Clique em Imprimir.',
    ],
    mostrar: '#bt-imprimir',
  },
  {
    id: 'pdf',
    pergunta: 'Como salvar em PDF?',
    termos: ['pdf', 'salvar em pdf', 'salvar pdf', 'gerar pdf', 'fazer pdf', 'arquivo pdf', 'transformar em pdf',
      'exportar', 'baixar pdf'],
    passos: [
      'Clique em "Imprimir ou PDF", no alto da tela, e depois em Continuar.',
      'Na janela que abrir, em "Destino", escolha "Salvar como PDF".',
      'Clique em Salvar e escolha a pasta.',
    ],
    mostrar: '#bt-imprimir',
    comum: true,
  },
  {
    id: 'salvar',
    pergunta: 'Como salvar para continuar depois?',
    termos: ['salvar', 'salvo', 'guardar', 'gravar', 'continuar depois', 'nao perder', 'salvar o trabalho',
      'salva sozinho', 'salvar no computador', 'backup'],
    passos: [
      'Enquanto você trabalha, o sistema já guarda tudo sozinho neste computador.',
      'Para ter um arquivo (e levar para outro computador), clique em "Salvar no computador".',
      'O arquivo vai para a pasta Downloads, com o nome "Fluxograma - ...".',
    ],
    mostrar: '#bt-salvar',
    comum: true,
  },
  {
    id: 'abrir',
    pergunta: 'Como abrir um fluxograma que eu salvei?',
    termos: ['abrir', 'abrir o arquivo', 'abrir arquivo', 'carregar', 'continuar o que salvei', 'abrir o que salvei',
      'achar o arquivo', 'onde fica o arquivo', 'onde esta o arquivo', 'arquivo salvo', 'arquivo json'],
    passos: [
      'Clique em Abrir, no alto da tela.',
      'Escolha o arquivo. Ele costuma estar na pasta Downloads, com o nome "Fluxograma - ...".',
      'Também dá para arrastar o arquivo para dentro da página.',
    ],
    mostrar: '#bt-abrir',
  },
  {
    id: 'outro-computador',
    pergunta: 'Como continuar em outro computador?',
    termos: ['outro computador', 'outro pc', 'outra maquina', 'levar para casa', 'levar pra casa', 'pen drive',
      'pendrive', 'trocar de computador', 'notebook', 'computador de casa'],
    passos: [
      'Neste computador, clique em "Salvar no computador".',
      'Leve o arquivo para o outro computador (pen drive, e-mail ou WhatsApp).',
      'No outro computador, abra este mesmo site e clique em Abrir.',
    ],
    mostrar: '#bt-salvar',
  },
  {
    id: 'perdi',
    pergunta: 'Fechei a página. Perdi o que fiz?',
    termos: ['perdi', 'perdi tudo', 'perdi o trabalho', 'fechei', 'fechei a pagina', 'fechou', 'fechar a pagina',
      'se eu fechar', 'sumiu tudo', 'desligou', 'acabou a luz', 'travou', 'atualizei a pagina', 'recarreguei',
      'vai perder'],
    passos: [
      'Não. Abrindo de novo neste mesmo computador e no mesmo navegador, está tudo lá.',
      'Só em outro computador (ou em outro navegador) é que não aparece. Para isso, use "Salvar no computador" e depois Abrir.',
    ],
  },
  {
    id: 'comecar-outro',
    pergunta: 'Como começar um fluxograma novo?',
    termos: ['comecar de novo', 'fluxograma novo', 'novo fluxograma', 'outro fluxograma', 'recomecar', 'do zero', 'zerar',
      'limpar tudo', 'folha nova', 'folha em branco', 'apagar tudo e comecar', 'comecar outro'],
    passos: [
      'Clique em "Começar outro", no alto da tela.',
      'O sistema pergunta se você quer salvar o atual antes.',
      'Depois escolha "Começar com o modelo" ou "Começar com a folha vazia".',
    ],
    mostrar: '#bt-novo',
  },
  {
    id: 'modelo',
    pergunta: 'O que é o modelo? Posso mudar ele?',
    termos: ['modelo', 'o modelo', 'mudar o modelo', 'formas prontas', 'esqueleto', 'modelo de curitiba', 'exemplo',
      'o que vem pronto', 'pode mudar o modelo'],
    passos: [
      'É um esqueleto com as formas já no lugar, todas em branco, parecido com o fluxo que a Regional mandou de exemplo.',
      'Pode escrever, mudar, apagar e acrescentar o que quiser. Nada ali é obrigatório.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'mandar',
    pergunta: 'Como mandar o fluxograma para a Regional?',
    termos: ['mandar', 'enviar', 'mandar para a regional', 'mandar pra regional', 'regional', 'email', 'whatsapp', 'zap',
      'compartilhar', 'anexar', 'entregar', 'mandar para a coordenadora', 'mandar por email', 'mandar por whatsapp'],
    passos: [
      'Para mandar pronto, para ler ou imprimir: salve em PDF ("Imprimir ou PDF") e mande o arquivo.',
      'Para alguém continuar mexendo: mande o arquivo de "Salvar no computador". A pessoa abre com o botão Abrir, neste site.',
    ],
    mostrar: '#bt-imprimir',
  },
  {
    id: 'forma-vermelha',
    pergunta: 'A forma ficou com um contorno vermelho. O que é?',
    termos: ['contorno vermelho', 'borda vermelha', 'vermelho em volta', 'ficou vermelho', 'passou da folha',
      'saiu da folha', 'fora da folha', 'cortado', 'vai sair cortado', 'margem', 'passou da margem'],
    passos: [
      'É um aviso: a forma passou da margem da folha e pode sair cortada na impressão.',
      'Diminua a letra (A−) ou alargue a forma, puxando o quadradinho do canto, para ela voltar para dentro.',
    ],
    mostrar: '#painel',
  },
  {
    id: 'texto-nao-cabe',
    pergunta: 'O texto não cabe na forma. E agora?',
    termos: ['nao cabe', 'texto nao cabe', 'nao coube', 'texto grande', 'muito texto', 'texto cortado', 'texto saindo',
      'texto escondido', 'texto espremido', 'texto passando', 'caixa pequena para o texto'],
    passos: [
      'A forma cresce sozinha para baixo quando o texto não cabe.',
      'Se ficar comprida demais, alargue a forma (puxe o quadradinho do canto) ou diminua a letra (A−).',
    ],
  },
  {
    id: 'forma-escondida',
    pergunta: 'Uma forma ficou escondida atrás de outra. Como pegar?',
    termos: ['escondida', 'atras da outra', 'atras de outra', 'por baixo', 'embaixo da outra', 'uma em cima da outra',
      'sobreposta', 'encavalada', 'tampou', 'cobriu', 'sumiu atras'],
    passos: [
      'Clique na parte que aparece: enquanto escolhida, ela fica na frente das outras.',
      'Arraste para um lugar livre.',
      'Se não aparecer nada dela, arraste a forma de cima para o lado.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'grade',
    pergunta: 'O que são os quadradinhos cinza e a linha tracejada da folha?',
    termos: ['quadradinhos cinza', 'quadriculado', 'grade', 'linhas cinza', 'fundo quadriculado',
      'linha tracejada da folha', 'pontilhado da folha', 'vai sair na impressao', 'quadrados no fundo'],
    passos: [
      'São guias para ajudar a alinhar as formas. Não saem na impressão.',
      'A linha tracejada é a margem: o que ficar dentro dela sai inteiro no papel.',
    ],
    mostrar: '#folha',
  },
  {
    id: 'celular',
    pergunta: 'Dá para usar no celular?',
    termos: ['celular', 'no celular', 'pelo celular', 'telefone', 'tablet', 'smartphone', 'tela pequena'],
    passos: [
      'Dá para abrir, ver e imprimir.',
      'Mas montar o fluxograma é bem mais fácil no computador, com mouse.',
    ],
  },
  {
    id: 'cancelar-seta',
    pergunta: 'Cliquei em Seta e quero desistir. Como cancelo?',
    termos: ['cancelar a seta', 'cancelar seta', 'cancelo a seta', 'desistir da seta', 'sair da seta', 'faixa amarela',
      'botao seta amarelo', 'travou na seta', 'nao sai da seta'],
    passos: ['Clique em Cancelar, na faixa amarela do alto (ou aperte a tecla Esc).'],
  },
];

// A lista que aparece com o campo vazio (e quando a busca não entende).
export const COMUNS = ['usar-geral', 'escrever', 'forma-nova', 'ligar', 'sim-nao', 'apagar-forma', 'desfazer', 'pdf', 'salvar'];
```

- [ ] **Step 2: Commit** — `git add js/duvidas.js && git commit -m "Base do Tire sua dúvida: 43 perguntas sobre o uso do sistema"`

### Task 3: As frases de verdade (testes da base)

**Files:**
- Test: `testes/duvidas.test.js`
- Modify: `js/duvidas.js`: acrescentar frases nos termos até todas passarem. **Não mexer no
  motor para fazer um caso passar;** quem ensina é a base.

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/duvidas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BASE, COMUNS } from '../js/duvidas.js';
import { buscar } from '../js/busca.js';

const HTML = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function existeNaTela(sel) {
  if (sel.startsWith('#')) return HTML.includes(`id="${sel.slice(1)}"`);
  if (sel.startsWith('.')) return new RegExp(`class="[^"]*\\b${sel.slice(1)}\\b`).test(HTML);
  return false;
}

test('base inteira: id único, pergunta, 3+ termos, 1+ passo; comuns existem', () => {
  const ids = new Set();
  for (const d of BASE) {
    assert.ok(!ids.has(d.id), `id repetido: ${d.id}`);
    ids.add(d.id);
    assert.ok(d.pergunta && d.pergunta.length > 5, d.id);
    assert.ok(Array.isArray(d.termos) && d.termos.length >= 3, `${d.id}: poucos termos`);
    assert.ok(Array.isArray(d.passos) && d.passos.length >= 1, `${d.id}: sem passos`);
  }
  for (const c of COMUNS) assert.ok(ids.has(c), `comum inexistente: ${c}`);
});

test('todo "Mostrar na tela" aponta para algo que existe no index.html', () => {
  for (const d of BASE) if (d.mostrar) assert.ok(existeNaTela(d.mostrar), `${d.id}: ${d.mostrar}`);
});

// Frases do jeito que as pessoas escrevem: sem acento, com erro, falando "caixa".
const CASOS = [
  ['errei como volto', 'desfazer'],
  ['como desfaço o que fiz', 'desfazer'],
  ['ctrl z', 'desfazer'],
  ['desfaser', 'desfazer'],
  ['apaguei sem querer a caixa', 'apagou-sem-querer'],
  ['sumiu a forma que eu fiz', 'apagou-sem-querer'],
  ['voltei demais', 'refazer'],
  ['como apago uma caixa', 'apagar-forma'],
  ['excluir o quadrado', 'apagar-forma'],
  ['apgar a caixa', 'apagar-forma'],
  ['como tirar a flecha', 'apagar-seta'],
  ['apagar a seta', 'apagar-seta'],
  ['quero ligar uma caixa na outra', 'ligar'],
  ['como faço a seta', 'ligar'],
  ['como conecto as formas', 'ligar'],
  ['pra que serve o mais azul', 'mais-azul'],
  ['como coloca sim e nao', 'sim-nao'],
  ['escrever sim na seta', 'sim-nao'],
  ['a seta ta torta', 'seta-torta'],
  ['a seta ficou passando por cima da caixa', 'seta-torta'],
  ['a seta ta apontando pro lado errado', 'inverter-seta'],
  ['como escrevo dentro da caixa', 'escrever'],
  ['nao consigo escrever', 'escrever'],
  ['escrevi errado como corrijo', 'apagar-texto'],
  ['como mudo a cor', 'cor'],
  ['pintar de vermelho', 'cor'],
  ['deixar pontilhado', 'borda'],
  ['aumentar a letra', 'letra-tamanho'],
  ['a letra ta muito pequena', 'letra-tamanho'],
  ['negrito', 'negrito'],
  ['deixar a letra mais grossa', 'negrito'],
  ['colocar o texto na esquerda', 'alinhar'],
  ['fazer uma lista', 'alinhar'],
  ['como pular linha', 'pular-linha'],
  ['como mudar pra losango', 'trocar-forma'],
  ['pra que serve o losango', 'qual-forma'],
  ['copiar a caixa', 'duplicar'],
  ['selecionar varias caixas', 'varias'],
  ['mover tudo junto', 'varias'],
  ['como arrasto a caixa', 'mover'],
  ['mudar a caixa de lugar', 'mover'],
  ['aumentar o tamanho da caixa', 'tamanho'],
  ['o texto nao cabe', 'texto-nao-cabe'],
  ['como coloco outra forma', 'forma-nova'],
  ['adicionar um circulo', 'forma-nova'],
  ['mudar o titulo', 'titulo'],
  ['trocar o nome do fluxograma', 'titulo'],
  ['deixar a folha deitada', 'deitar'],
  ['folha na horizontal', 'deitar'],
  ['como imprimo', 'imprimir'],
  ['quero imprimir', 'imprimir'],
  ['salvar em pdf', 'pdf'],
  ['gerar pdf', 'pdf'],
  ['como salvo', 'salvar'],
  ['vai perder se eu fechar?', 'perdi'],
  ['fechei a pagina perdi tudo', 'perdi'],
  ['abrir o arquivo que salvei', 'abrir'],
  ['onde fica o arquivo salvo', 'abrir'],
  ['levar pra outro computador', 'outro-computador'],
  ['comecar de novo do zero', 'comecar-outro'],
  ['o que e o modelo', 'modelo'],
  ['mandar para a regional', 'mandar'],
  ['mandar por whatsapp', 'mandar'],
  ['ficou vermelho em volta da caixa', 'forma-vermelha'],
  ['a caixa sumiu atras da outra', 'forma-escondida'],
  ['pra que serve os quadradinhos cinza', 'grade'],
  ['da pra usar no celular', 'celular'],
  ['como cancelo a seta', 'cancelar-seta'],
  ['como funciona isso', 'usar-geral'],
  ['por onde comeco', 'usar-geral'],
];

for (const [frase, esperado] of CASOS) {
  test(`"${frase}" → ${esperado}`, () => {
    const r = buscar(BASE, frase);
    assert.equal(r.resposta && r.resposta.id, esperado, `veio ${r.resposta && r.resposta.id}`);
  });
}

test('o que não é sobre o sistema fica sem resposta', () => {
  for (const frase of ['o que e dengue grave', 'receita de bolo', 'qual a senha do wifi']) {
    assert.equal(buscar(BASE, frase).resposta, null, frase);
  }
});
```

- [ ] **Step 2: Rodar** — `node --test testes/duvidas.test.js`. Para cada caso que falhar, acrescente
  a frase (ou a conjugação que faltou) nos `termos` do item certo, em `js/duvidas.js`. Rode de novo
  até tudo passar.
- [ ] **Step 3: Commit** — `git add js/duvidas.js testes/duvidas.test.js && git commit -m "Tire sua dúvida: 70 frases reais testadas contra a base"`

### Task 4: A janela na tela

**Files:**
- Create: `js/duvidas-tela.js`
- Modify: `index.html`, `estilo.css`, `js/app.js`, `js/painel.js`

- [ ] **Step 1: Gravar o módulo da janela**

```js arquivo=js/duvidas-tela.js
// A janela do "Tire sua dúvida": a pessoa escreve, a busca acha a resposta na
// base e ela aparece em passos, com "Mostrar na tela" apontando o botão certo.
import { BASE, COMUNS } from './duvidas.js';
import { buscar } from './busca.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const porId = new Map(BASE.map((d) => [d.id, d]));

// el = { cobertura, form, campo, resultado, fechar }; mostrarNaTela(seletor) faz o alvo piscar.
export function criarDuvidas({ el, mostrarNaTela }) {
  const lista = (ids) => ids.map((id) => porId.get(id)).filter(Boolean)
    .map((d) => `<button type="button" class="duvida-link" data-duvida="${d.id}">${esc(d.pergunta)}</button>`)
    .join('');
  const rotulo = (texto) => `<p class="duvidas-rotulo">${texto}</p>`;

  function htmlResposta(d) {
    const mostrar = d.mostrar
      ? `<button type="button" class="bt bt-destaque" data-mostrar="${esc(d.mostrar)}">Mostrar na tela</button>`
      : '';
    return `<div class="resposta"><h3>${esc(d.pergunta)}</h3><ol>${d.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>${mostrar}</div>`;
  }

  function mostrarComuns() {
    el.resultado.innerHTML = rotulo('Perguntas mais comuns:') + lista(COMUNS);
  }

  function mostrarItem(d, outras = []) {
    el.resultado.innerHTML = htmlResposta(d)
      + (outras.length ? rotulo('Talvez você queira saber:') + lista(outras.map((o) => o.id)) : '');
  }

  function perguntar() {
    const texto = el.campo.value.trim();
    if (!texto) { mostrarComuns(); return; }
    const r = buscar(BASE, texto);
    if (r.resposta) { mostrarItem(r.resposta, r.alternativas); return; }
    el.resultado.innerHTML = '<p class="nao-entendi">Não entendi essa. Tente com outras palavras, ou escolha uma das perguntas abaixo.</p>'
      + (r.alternativas.length ? rotulo('Parecidas com o que você escreveu:') + lista(r.alternativas.map((a) => a.id)) : '')
      + rotulo('Perguntas mais comuns:') + lista(COMUNS.filter((id) => !r.alternativas.some((a) => a.id === id)));
  }

  function abrir() {
    el.cobertura.hidden = false;
    el.campo.value = '';
    mostrarComuns();
    el.campo.focus();
  }

  function fechar() {
    el.cobertura.hidden = true;
  }

  el.form.addEventListener('submit', (ev) => { ev.preventDefault(); perguntar(); });
  el.fechar.addEventListener('click', fechar);
  // Clique fora do cartão fecha.
  el.cobertura.addEventListener('pointerdown', (ev) => { if (ev.target === el.cobertura) fechar(); });
  el.resultado.addEventListener('click', (ev) => {
    const d = ev.target.closest('[data-duvida]');
    if (d) {
      const item = porId.get(d.dataset.duvida);
      if (item) mostrarItem(item);
      return;
    }
    const m = ev.target.closest('[data-mostrar]');
    if (m) {
      fechar();
      mostrarNaTela(m.dataset.mostrar);
    }
  });

  return { abrir, fechar, aberta: () => !el.cobertura.hidden };
}
```

- [ ] **Step 2: `index.html`:** trocar o botão Ajuda

```html
    <button id="bt-ajuda" class="bt"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/></svg>Ajuda</button>
```
por
```html
    <button id="bt-duvida" class="bt bt-duvida"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M10 9.2a2 2 0 1 1 2.8 1.8c-.5.2-.8.6-.8 1.2M12 14h.01"/></svg>Tire sua dúvida</button>
```
e acrescentar a janela antes de `<div id="dialogo" ...>`:
```html
<div id="duvidas" class="cobertura" hidden>
  <div class="cartao cartao-duvidas" role="dialog" aria-modal="true" aria-labelledby="duvidas-titulo">
    <div class="duvidas-topo">
      <h2 id="duvidas-titulo">Tire sua dúvida</h2>
      <button id="duvidas-fechar" class="bt" type="button">Fechar</button>
    </div>
    <form id="duvidas-form" class="duvidas-form" autocomplete="off">
      <input id="duvidas-campo" type="text" maxlength="200" placeholder="Escreva sua dúvida do seu jeito. Ex.: como apago uma seta?" aria-label="Sua dúvida">
      <button class="bt bt-destaque" type="submit">Perguntar</button>
    </form>
    <div id="duvidas-resultado" class="duvidas-resultado" aria-live="polite"></div>
  </div>
</div>
```

- [ ] **Step 3: `estilo.css`:** acrescentar antes de `/* ---------- Tela estreita`

```css
/* ---------- Tire sua dúvida ---------- */
.bt-duvida { background: #fff4ce; border-color: #e3c567; font-weight: 600; }
.bt-duvida:hover { background: #fde68a; border-color: #b7791f; }
#duvidas { align-items: flex-start; padding-top: 6vh; }
.cartao-duvidas { max-width: 660px; }
.duvidas-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.duvidas-topo h2 { margin: 0; }
.duvidas-form { display: flex; gap: 8px; margin: 14px 0 16px; }
.duvidas-form input { flex: 1; min-width: 0; min-height: 48px; padding: 6px 12px; border: 2px solid var(--linha);
  border-radius: 10px; font: inherit; font-size: 17px; }
.duvidas-form input:focus { outline: none; border-color: var(--azul); }
.duvidas-resultado { display: flex; flex-direction: column; gap: 8px; }
.resposta { border: 2px solid var(--azul); background: var(--azul-claro); border-radius: 12px; padding: 14px 16px; }
.resposta h3 { margin: 0 0 8px; font-size: 18px; color: var(--azul-forte); }
.resposta ol { margin: 0; padding-left: 22px; line-height: 1.5; font-size: 16px; }
.resposta li { margin-bottom: 4px; }
.resposta .bt { margin-top: 10px; }
.duvidas-rotulo { color: var(--texto-2); font-size: 15px; margin: 6px 0 0; }
.duvida-link { text-align: left; padding: 10px 12px; border: 1px solid var(--linha); border-radius: 10px;
  background: #fff; cursor: pointer; font-size: 16px; }
.duvida-link:hover { border-color: var(--azul); background: var(--azul-claro); }
.nao-entendi { background: var(--aviso); border-radius: 10px; padding: 10px 12px; margin: 0; }
/* "Mostrar na tela": o alvo pisca com um contorno laranja, sem mexer no layout. */
@keyframes piscar { 0%, 100% { outline-color: rgba(234, 88, 12, 0); } 50% { outline-color: rgba(234, 88, 12, 1); } }
.piscando { outline: 4px solid rgba(234, 88, 12, 0); outline-offset: 3px; animation: piscar .7s ease-in-out 5; }
```

- [ ] **Step 4: `js/app.js`:** importar e ligar.
  1. Acrescentar `import { criarDuvidas } from './duvidas-tela.js';`.
  2. Trocar `const dialogoAberto = () => !$('dialogo').hidden || !$('inicio').hidden;` por
     `const dialogoAberto = () => !$('dialogo').hidden || !$('inicio').hidden || !$('duvidas').hidden;`.
  3. No `keydown` do Esc, antes das outras linhas:
     `if (ev.key === 'Escape' && !$('duvidas').hidden) { duvidas.fechar(); return; }`.
  4. Trocar todo o `$('bt-ajuda').addEventListener(...)` (a janela "Como usar") por:

```js
// ---------- Tire sua dúvida ----------
// "Mostrar na tela": o alvo pisca (contorno laranja) por uns 3 s.
function piscar(seletor) {
  interacao.terminarEdicao();
  const alvo = document.querySelector(seletor);
  if (!alvo) return;
  alvo.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  alvo.classList.remove('piscando');
  void alvo.offsetWidth; // reinicia a animação se já estava piscando
  alvo.classList.add('piscando');
  setTimeout(() => alvo.classList.remove('piscando'), 3600);
}
const duvidas = criarDuvidas({
  el: {
    cobertura: $('duvidas'), form: $('duvidas-form'), campo: $('duvidas-campo'),
    resultado: $('duvidas-resultado'), fechar: $('duvidas-fechar'),
  },
  mostrarNaTela: piscar,
});
$('bt-duvida').addEventListener('click', () => {
  interacao.terminarEdicao();
  interacao.sairModoSeta();
  duvidas.abrir();
});
```

- [ ] **Step 5: `js/painel.js`:** no `htmlNada()`, acrescentar uma última dica:
  `<p class="dica"><strong>Tem dúvida?</strong> Clique em <strong>Tire sua dúvida</strong>, no alto da tela.</p>`

- [ ] **Step 6: Rodar os testes** (`node --test`, tudo passa) e fazer o commit:
  `git add index.html estilo.css js && git commit -m "Botão Tire sua dúvida: janela, resposta em passos e Mostrar na tela"`

### Task 5: Conferir no navegador, documentar e publicar

- [ ] **Navegador (prévia `fluxograma-facil`):**
  1. abrir a janela e ver a lista comum;
  2. perguntar "errei como volto" e ver a resposta do Desfazer;
  3. clicar em "Mostrar na tela" e ver o Desfazer piscar;
  4. perguntar "receita de bolo" e ver "Não entendi";
  5. o Esc fecha;
  6. nenhum erro no console.
- [ ] **`CLAUDE.md` do app:** seção "Tire sua dúvida", com o motor, a base, como ensinar, a regra
  do sim/não e o que fica de fora.
- [ ] **Commit + `cd "<APP>" && git push origin master`.** O Pages atualiza e o gancho sincroniza o
  espelho; conferir com `tail -3` no log.
- [ ] **Conferir no endereço publicado:** que "Tire sua dúvida" abre e responde.

