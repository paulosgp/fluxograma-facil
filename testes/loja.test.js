import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLoja } from '../js/loja.js';

const doc = (...ids) => ({ formas: ids.map((id) => ({ id })), setas: [] });

test('aplicar registra um passo; desfazer e refazer trocam o documento', () => {
  const loja = criarLoja(doc('f1'));
  loja.aplicar(doc('f1', 'f2'));
  assert.equal(loja.doc.formas.length, 2);
  assert.equal(loja.desfazer(), true);
  assert.equal(loja.doc.formas.length, 1);
  assert.equal(loja.refazer(), true);
  assert.equal(loja.doc.formas.length, 2);
  assert.equal(loja.refazer(), false);
});

test('um lote com várias trocas vira um passo só; lote sem mudança não conta', () => {
  const loja = criarLoja(doc());
  loja.comecar();
  loja.trocar(doc('f1'));
  loja.trocar(doc('f1', 'f2'));
  loja.confirmar();
  loja.comecar();
  loja.confirmar();
  loja.desfazer();
  assert.deepEqual(loja.doc, doc());
  assert.equal(loja.podeDesfazer(), false);
});

test('desfazer no meio de um lote fecha o lote antes', () => {
  const loja = criarLoja(doc());
  loja.comecar();
  loja.trocar(doc('f1'));
  assert.equal(loja.podeDesfazer(), true);
  loja.desfazer();
  assert.deepEqual(loja.doc, doc());
});

test('seleção perde o que foi apagado', () => {
  const loja = criarLoja(doc('f1', 'f2'));
  loja.selecionar({ formas: ['f1', 'f2'] });
  loja.aplicar(doc('f2'));
  assert.deepEqual(loja.selecao.formas, ['f2']);
});

test('avisa quem ouve, com o motivo', () => {
  const loja = criarLoja(doc());
  const motivos = [];
  const parar = loja.ouvir((m) => motivos.push(m));
  loja.selecionar({ titulo: true });
  loja.aplicar(doc('f1'));
  parar();
  loja.selecionar({});
  assert.deepEqual(motivos, ['selecao', 'doc', 'historico']);
});

test('carregar outro documento limpa a seleção e pode ser desfeito', () => {
  const loja = criarLoja(doc('f1'));
  loja.selecionar({ formas: ['f1'] });
  loja.carregar(doc('f9'));
  assert.deepEqual(loja.selecao, { formas: [], seta: null, titulo: false });
  loja.desfazer();
  assert.deepEqual(loja.doc, doc('f1'));
});
