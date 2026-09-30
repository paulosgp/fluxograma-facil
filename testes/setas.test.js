import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tracarSeta, ladosAutomaticos, caminhoSvg, encurtarFim } from '../js/setas.js';

const r = (x, y, l, a, tipo = 'retangulo') => ({ x, y, l, a, tipo });

test('forma embaixo e alinhada: reta para baixo, rótulo a 22 px da saída', () => {
  const A = r(100, 100, 180, 70), B = r(100, 220, 180, 70);
  assert.deepEqual(ladosAutomaticos(A, B), ['baixo', 'cima']);
  const s = tracarSeta(A, B);
  assert.deepEqual(s.pontos, [[190, 170], [190, 220]]);
  assert.deepEqual(s.rotulo, { x: 190, y: 192 });
});

test('losango para a caixa ao lado: reta saindo do vértice (como em Curitiba)', () => {
  const L = r(250, 190, 160, 110, 'losango'), R = r(450, 220, 314, 50, 'arredondado');
  const s = tracarSeta(L, R);
  assert.deepEqual(s.pontos, [[410, 245], [450, 245]]);
  assert.deepEqual(s.rotulo, { x: 430, y: 245 }); // caminho curto: rótulo no meio
});

test('caixa larga para o losango embaixo: reta pelo vértice de cima do losango', () => {
  const T = r(150, 100, 500, 50, 'arredondado'), L = r(250, 190, 160, 110, 'losango');
  assert.deepEqual(tracarSeta(T, L).pontos, [[330, 150], [330, 190]]);
});

test('sem sobreposição: "Z" em ângulo reto com a dobra no meio do vão', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(300, 200, 100, 50));
  assert.deepEqual(s.pontos, [[100, 25], [200, 25], [200, 225], [300, 225]]);
});

test('lados escolhidos à mão, perpendiculares: "L" com uma dobra', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(200, 150, 100, 50), { saida: 'direita', chegada: 'cima' });
  assert.deepEqual(s.pontos, [[100, 25], [250, 25], [250, 150]]);
});

test('mesmo lado nas duas: "U" por fora', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(0, 100, 100, 50), { saida: 'direita', chegada: 'direita' });
  assert.deepEqual(s.pontos, [[100, 25], [120, 25], [120, 125], [100, 125]]);
});

test('chegada no círculo encosta na curva, não na caixa', () => {
  const s = tracarSeta(r(0, 0, 100, 40), r(40, 100, 100, 100, 'circulo'));
  assert.deepEqual(s.pontos[0], [70, 40]);
  assert.equal(s.pontos[1][0], 70);
  assert.equal(s.pontos[1][1], 104.2);
});

test('losango com pouca sobreposição: sai pelo vértice e dobra, não pela aresta inclinada', () => {
  const L = r(250, 190, 160, 110, 'losango'), R = r(450, 280, 314, 60, 'arredondado');
  assert.deepEqual(tracarSeta(L, R).pontos, [[410, 245], [430, 245], [430, 310], [450, 310]]);
});

test('círculo encostado longe do meio: chega pelo ponto do meio, com dobra', () => {
  const s = tracarSeta(r(0, 0, 100, 40), r(60, 100, 100, 100, 'circulo'));
  assert.deepEqual(s.pontos, [[50, 40], [50, 70], [110, 70], [110, 100]]);
});

test('caminho SVG e encurtar o fim para caber a ponta', () => {
  assert.equal(caminhoSvg([[0, 0], [10, 0], [10, 20]]), 'M0 0 L10 0 L10 20');
  assert.deepEqual(encurtarFim([[0, 0], [0, 100]], 8), [[0, 0], [0, 92]]);
});
