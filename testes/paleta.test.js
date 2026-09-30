import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORES, ORDEM_CORES, TIPOS, TAMANHO_PADRAO, TAM_MIN, tamanhoFolha } from '../js/paleta.js';

test('toda cor da ordem existe e tem fundo e borda em hexadecimal', () => {
  assert.deepEqual([...ORDEM_CORES].sort(), Object.keys(CORES).sort());
  for (const nome of ORDEM_CORES) {
    assert.match(CORES[nome].fundo, /^#[0-9A-F]{6}$/);
    assert.match(CORES[nome].borda, /^#[0-9A-F]{6}$/);
  }
});

test('todo tipo tem tamanho padrão acima do mínimo', () => {
  for (const t of TIPOS) {
    assert.ok(TAMANHO_PADRAO[t].l >= TAM_MIN.l && TAMANHO_PADRAO[t].a >= TAM_MIN.a, t);
  }
});

test('folha em pé e deitada trocam largura e altura', () => {
  assert.deepEqual(tamanhoFolha('retrato'), { largura: 794, altura: 1123 });
  assert.deepEqual(tamanhoFolha('paisagem'), { largura: 1123, altura: 794 });
  assert.deepEqual(tamanhoFolha('qualquer'), { largura: 794, altura: 1123 });
});
