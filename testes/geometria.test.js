import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caixaDoTexto, alturaNecessaria, pontoNaBorda, contorno } from '../js/geometria.js';

const f = (tipo, l, a, x = 0, y = 0) => ({ tipo, x, y, l, a });

test('caixa do texto: retângulo desconta o espaço interno', () => {
  assert.deepEqual(caixaDoTexto(f('retangulo', 180, 70)), { x: 10, y: 8, l: 160, a: 54 });
});

test('caixa do texto: losango usa a faixa central de 60% × 50%', () => {
  assert.deepEqual(caixaDoTexto(f('losango', 200, 100)), { x: 40, y: 25, l: 120, a: 50 });
});

test('altura necessária cresce conforme o tipo', () => {
  assert.equal(alturaNecessaria(f('retangulo', 180, 70), 50), 66);
  assert.equal(alturaNecessaria(f('losango', 180, 120), 50), 100);
  assert.equal(alturaNecessaria(f('circulo', 110, 110), 70), 100);
});

test('ponto no contorno do retângulo: meio do lado ou coordenada dada', () => {
  const r = f('retangulo', 100, 60, 10, 20);
  assert.deepEqual(pontoNaBorda(r, 'cima'), [60, 20]);
  assert.deepEqual(pontoNaBorda(r, 'baixo', 30), [30, 80]);
  assert.deepEqual(pontoNaBorda(r, 'esquerda'), [10, 50]);
});

test('ponto no contorno do losango: vértice no meio, aresta inclinada fora dele', () => {
  const l = f('losango', 100, 60);
  assert.deepEqual(pontoNaBorda(l, 'direita'), [100, 30]);
  assert.deepEqual(pontoNaBorda(l, 'baixo', 25), [25, 45]);
});

test('ponto no contorno do círculo segue a elipse', () => {
  const c = f('circulo', 100, 100);
  assert.deepEqual(pontoNaBorda(c, 'direita'), [100, 50]);
  const [x, y] = pontoNaBorda(c, 'direita', 80);
  assert.equal(y, 80);
  assert.ok(Math.abs(x - 90) < 1e-9);
});

test('contorno: cada tipo vira o elemento SVG certo; texto não tem contorno', () => {
  assert.equal(contorno(f('losango', 100, 60)).attrs.points, '50,1 99,30 50,59 1,30');
  assert.equal(contorno(f('circulo', 100, 60)).tag, 'ellipse');
  assert.equal(contorno(f('arredondado', 180, 70)).attrs.rx, 14);
  assert.equal(contorno(f('retangulo', 180, 70)).attrs.rx, undefined);
  assert.equal(contorno(f('texto', 180, 40)), null);
});
