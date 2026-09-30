import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeloDengue, folhaVazia } from '../js/modelos.js';
import { documentoVazio, normalizarForma, sobrepoe, formaPorId } from '../js/modelo.js';
import { tamanhoFolha, MARGEM } from '../js/paleta.js';
import { tracarSeta } from '../js/setas.js';

test('modelo: só o título vem escrito; 15 formas e 11 setas', () => {
  const d = modeloDengue();
  assert.deepEqual(d.titulo, { texto: 'Fluxo de atendimento – Dengue', cor: 'rosa' });
  assert.equal(d.formas.length, 15);
  assert.equal(d.setas.length, 11);
  assert.equal(d.formas.every((f) => f.texto === ''), true);
  assert.equal(d.setas.every((s) => s.texto === ''), true);
});

test('modelo: toda forma já está normalizada e dentro da área útil da folha', () => {
  const d = modeloDengue();
  const folha = tamanhoFolha(d.folha.orientacao);
  for (const f of d.formas) {
    assert.deepEqual(normalizarForma(f), f);
    assert.ok(f.x >= MARGEM && f.y >= MARGEM, f.id);
    assert.ok(f.x + f.l <= folha.largura - MARGEM && f.y + f.a <= folha.altura - MARGEM, f.id);
  }
});

test('modelo: nenhuma forma encosta em outra', () => {
  const { formas } = modeloDengue();
  for (let i = 0; i < formas.length; i++) {
    for (let j = i + 1; j < formas.length; j++) {
      assert.equal(sobrepoe(formas[i], formas[j]), false, `${formas[i].id} × ${formas[j].id}`);
    }
  }
});

test('modelo: toda seta liga formas que existem e sai reta (dois pontos)', () => {
  const d = modeloDengue();
  for (const s of d.setas) {
    const de = formaPorId(d, s.de);
    const para = formaPorId(d, s.para);
    assert.ok(de && para, s.id);
    assert.equal(tracarSeta(de, para).pontos.length, 2, s.id);
  }
});

test('cada chamada devolve um documento novo; folha vazia = documento vazio', () => {
  const a = modeloDengue();
  a.formas[0].texto = 'mexi';
  assert.equal(modeloDengue().formas[0].texto, '');
  assert.deepEqual(folhaVazia(), documentoVazio());
});
