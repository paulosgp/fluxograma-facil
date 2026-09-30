import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encaixar, limitar, guias, posicionar } from '../js/encaixe.js';

const FOLHA = { largura: 794, altura: 1123 };

test('encaixar arredonda para a grade de 10', () => {
  assert.equal(encaixar(14), 10);
  assert.equal(encaixar(15), 20);
  assert.equal(encaixar(123, 5), 125);
});

test('limitar traz a forma para dentro da margem de 30 px', () => {
  assert.deepEqual(limitar({ x: -10, y: 2000, l: 100, a: 50 }, FOLHA), { x: 30, y: 1043 });
  assert.deepEqual(limitar({ x: 200, y: 300, l: 100, a: 50 }, FOLHA), { x: 200, y: 300 });
});

test('guia: borda esquerda a 3 px da vizinha gruda e desenha a linha', () => {
  const g = guias({ x: 103, y: 300, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }]);
  assert.equal(g.dx, -3);
  assert.equal(g.dy, null);
  assert.deepEqual(g.linhas, [{ x1: 100, y1: 100, x2: 100, y2: 350 }]);
});

test('guia: nada perto, nada gruda', () => {
  const g = guias({ x: 400, y: 600, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }]);
  assert.deepEqual(g, { dx: null, dy: null, linhas: [] });
});

test('posicionar: sem guia vale a grade; com guia, a guia vence', () => {
  assert.deepEqual(posicionar({ x: 104, y: 207, l: 100, a: 50 }, [], FOLHA), { x: 100, y: 210, linhas: [] });
  const p = posicionar({ x: 103, y: 207, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }], FOLHA);
  assert.equal(p.x, 100);
  assert.equal(p.y, 210);
});
