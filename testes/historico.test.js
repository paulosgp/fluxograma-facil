import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarHistorico, registrar, desfazer, refazer, podeDesfazer, podeRefazer } from '../js/historico.js';

test('desfazer volta foto a foto, refazer anda de novo', () => {
  let h = criarHistorico();
  h = registrar(h, 'A');
  h = registrar(h, 'B');
  let r = desfazer(h, 'C');
  assert.equal(r.foto, 'B');
  r = desfazer(r.hist, 'B');
  assert.equal(r.foto, 'A');
  assert.equal(podeDesfazer(r.hist), false);
  const f = refazer(r.hist, 'A');
  assert.equal(f.foto, 'B');
  assert.equal(podeRefazer(f.hist), true);
});

test('sem passado não desfaz; ação nova apaga o futuro', () => {
  let h = criarHistorico();
  assert.equal(desfazer(h, 'X'), null);
  h = registrar(h, 'A');
  const r = desfazer(h, 'B');
  const h2 = registrar(r.hist, 'A');
  assert.equal(podeRefazer(h2), false);
});

test('guarda no máximo o limite de fotos, as mais recentes', () => {
  let h = criarHistorico(3);
  for (const f of ['1', '2', '3', '4', '5']) h = registrar(h, f);
  assert.deepEqual(h.passado, ['3', '4', '5']);
});
