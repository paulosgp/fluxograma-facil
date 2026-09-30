import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarDocumento, lerJson, serializar, nomeDoArquivo } from '../js/arquivo.js';
import { modeloDengue } from '../js/modelos.js';

const INVALIDO = 'Este arquivo não é de um fluxograma feito aqui.';

test('documento bom passa inteiro, ida e volta', () => {
  const d = modeloDengue();
  const r = lerJson(serializar(d));
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc, d);
});

test('recusa o que não é fluxograma daqui', () => {
  for (const lixo of [null, 'texto', {}, { app: 'outro', versao: 1 }]) {
    assert.deepEqual(validarDocumento(lixo), { ok: false, erro: INVALIDO });
  }
  assert.match(validarDocumento({ app: 'fluxograma-facil', versao: 2 }).erro, /versão mais nova/);
  assert.deepEqual(lerJson('{isto não é json'), { ok: false, erro: INVALIDO });
});

test('conserta: campos estranhos, formas quebradas, ids repetidos e setas soltas saem', () => {
  const r = validarDocumento({
    app: 'fluxograma-facil', versao: 1, extra: 'x',
    titulo: { texto: 'T', cor: 'dourado' }, folha: { orientacao: 'deitada' },
    formas: [
      { id: 'f1', tipo: 'retangulo', x: 100, y: 100, virus: true },
      { id: 'f1', tipo: 'losango', x: 300, y: 300 },
      { id: 'f2', tipo: 'estrela' },
      { id: 'f3', tipo: 'circulo', x: 5000, y: -50 },
    ],
    setas: [
      { id: 's1', de: 'f1', para: 'f3' },
      { id: 's2', de: 'f1', para: 'f3' },
      { id: 's3', de: 'f1', para: 'f9' },
      { id: 's4', de: 'f3', para: 'f3' },
      { id: 'f1', de: 'f3', para: 'f1' },
    ],
  });
  assert.equal(r.ok, true);
  assert.equal('extra' in r.doc, false);
  assert.deepEqual(r.doc.titulo, { texto: 'T', cor: 'cinza' });
  assert.equal(r.doc.folha.orientacao, 'retrato');
  assert.deepEqual(r.doc.formas.map((f) => f.id), ['f1', 'f3']);
  assert.equal('virus' in r.doc.formas[0], false);
  assert.deepEqual([r.doc.formas[1].x, r.doc.formas[1].y], [794 - 30 - 110, 30]);
  assert.deepEqual(r.doc.setas.map((s) => s.id), ['s1']);
});

test('nome do arquivo: sem caracteres proibidos no Windows, até 60 letras', () => {
  assert.equal(nomeDoArquivo('Fluxo: dengue/2026?'), 'Fluxograma - Fluxo dengue2026.json');
  assert.equal(nomeDoArquivo('   '), 'Fluxograma.json');
  assert.equal(nomeDoArquivo('x'.repeat(100)), `Fluxograma - ${'x'.repeat(60)}.json`);
});
