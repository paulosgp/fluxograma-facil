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

test('todo link de resposta é e-mail ou arquivo que existe no site', () => {
  for (const d of BASE) {
    if (!d.link) continue;
    assert.ok(d.link.texto, `${d.id}: link sem texto`);
    if (d.link.href.startsWith('mailto:')) continue;
    assert.ok(fs.existsSync(new URL(`../${d.link.href}`, import.meta.url)), `${d.id}: ${d.link.href} não existe`);
  }
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
  ['como faz pra imprimir em pdf', 'pdf'],
  ['quero fazer um losango', 'forma-nova'],
  ['a caixa ficou em cima da outra', 'forma-escondida'],
  ['como apaga tudo', 'comecar-outro'],
  ['deixar a seta reta', 'seta-torta'],
  ['tem como mudar a seta de lugar', 'seta-torta'],
  ['o que faço primeiro', 'usar-geral'],
  ['nao to conseguindo apagar a seta', 'apagar-seta'],
  ['como volta o que apaguei', 'desfazer'],
  ['como coloco nao na seta', 'sim-nao'],
  ['quem criou esse sistema', 'quem-fez'],
  ['encontrei um erro no sistema', 'quem-fez'],
  ['quero dar uma sugestao', 'quem-fez'],
  ['tem manual?', 'manual'],
  ['quero imprimir o manual', 'manual'],
  ['deu errado', 'desfazer'],
  ['nao acho o arquivo', 'abrir'],
  ['quero colocar um texto sem caixa', 'forma-nova'],
  ['como eu escrevo sim', 'sim-nao'],
  ['quero mudar a cor do losango', 'cor'],
  ['como faço pra caixa ficar tracejada', 'borda'],
  ['errei tudo', 'desfazer'],
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
