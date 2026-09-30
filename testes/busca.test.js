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

test('frase com uma só palavra de conteúdo vale inteira: "mais uma caixa" não pega toda dúvida de caixa', () => {
  const base = [...BASE, { id: 'nova', pergunta: 'Forma nova', termos: ['mais uma caixa', 'adicionar'], passos: ['x'] }];
  assert.equal(buscar(base, 'apagar a caixa').resposta, null);
  assert.equal(buscar(base, 'quero mais uma caixa').resposta.id, 'nova');
});

test('buscar: nada parecido, sem resposta; campo vazio também', () => {
  assert.equal(buscar(BASE, 'receita de bolo').resposta, null);
  assert.equal(buscar(BASE, '   ').resposta, null);
});
