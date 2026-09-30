import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  documentoVazio, criarForma, atualizarForma, atualizarFormas, moverFormas, apagar, duplicar,
  ligar, atualizarSeta, inverterSeta, trocarTipo, definirTitulo, definirOrientacao, criarLigada,
  lugarLivre, formaPorId, normalizarForma,
} from '../js/modelo.js';

const comDuas = () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 100 }));
  ({ doc: d } = criarForma(d, 'losango', { x: 100, y: 300 }));
  return d;
};

test('documento vazio tem título em branco, folha em pé e nada desenhado', () => {
  const d = documentoVazio();
  assert.equal(d.app, 'fluxograma-facil');
  assert.equal(d.versao, 1);
  assert.deepEqual(d.titulo, { texto: '', cor: 'cinza' });
  assert.deepEqual(d.folha, { orientacao: 'retrato' });
  assert.deepEqual([d.formas, d.setas], [[], []]);
});

test('criar forma usa o tamanho padrão do tipo e ids novos; o original não muda', () => {
  const d0 = documentoVazio();
  const { doc, id } = criarForma(d0, 'losango', { x: 100, y: 200 });
  assert.equal(id, 'f1');
  assert.deepEqual(doc.formas[0], {
    id: 'f1', tipo: 'losango', x: 100, y: 200, l: 180, a: 120, texto: '', cor: 'branco',
    borda: 'lisa', letra: 14, negrito: false, alinhar: 'centro',
  });
  assert.equal(d0.formas.length, 0);
  assert.equal(criarForma(doc, 'retangulo', { x: 400, y: 200 }).id, 'f2');
});

test('criar forma sem posição procura um lugar livre perto do ponto pedido', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 300, y: 300 }));
  const { doc } = criarForma(d, 'retangulo', null, { perto: { x: 390, y: 335 } });
  const [a, b] = doc.formas;
  const sobrepoe = b.x < a.x + a.l && a.x < b.x + b.l && b.y < a.y + a.a && a.y < b.y + b.a;
  assert.equal(sobrepoe, false);
});

test('lugar livre devolve null quando a folha está cheia', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 30, y: 30 }));
  d = atualizarForma(d, 'f1', { l: 734, a: 1063 });
  assert.equal(lugarLivre(d, 180, 70, { x: 400, y: 500 }), null);
});

test('sem lugar livre, a forma nasce por cima, perto do ponto pedido, e avisa', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 30, y: 30 }));
  d = atualizarForma(d, 'f1', { l: 734, a: 1063 });
  const r = criarForma(d, 'losango', null, { perto: { x: 400, y: 500 } });
  assert.equal(r.sobreposta, true);
  const f = formaPorId(r.doc, r.id);
  assert.deepEqual([f.x, f.y], [310, 440]);
});

test('atualizar forma normaliza: cor desconhecida e letra fora da faixa são corrigidas', () => {
  const d = atualizarForma(comDuas(), 'f1', { cor: 'dourado', letra: 99, texto: 'Oi' });
  const f = formaPorId(d, 'f1');
  assert.equal(f.cor, 'branco');
  assert.equal(f.letra, 28);
  assert.equal(f.texto, 'Oi');
  assert.equal(atualizarFormas(d, ['f1', 'f2'], { cor: 'verde' }).formas.every((x) => x.cor === 'verde'), true);
});

test('mover várias de uma vez', () => {
  const d = moverFormas(comDuas(), ['f1', 'f2'], 10, -20);
  assert.deepEqual(d.formas.map((f) => [f.x, f.y]), [[110, 80], [110, 280]]);
});

test('ligar: cria seta, recusa a mesma forma, forma inexistente e seta repetida', () => {
  const d0 = comDuas();
  const r = ligar(d0, 'f1', 'f2');
  assert.equal(r.id, 's1');
  assert.deepEqual(r.doc.setas[0], { id: 's1', de: 'f1', para: 'f2', texto: '', saida: 'auto', chegada: 'auto' });
  assert.equal(ligar(d0, 'f1', 'f1').erro, 'mesma');
  assert.equal(ligar(d0, 'f1', 'f9').erro, 'inexistente');
  assert.equal(ligar(r.doc, 'f1', 'f2').erro, 'repetida');
});

test('apagar forma leva junto as setas dela; apagar seta sozinha', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  const semF1 = apagar(doc, ['f1']);
  assert.deepEqual(semF1.formas.map((f) => f.id), ['f2']);
  assert.equal(semF1.setas.length, 0);
  const semSeta = apagar(doc, ['s1']);
  assert.equal(semSeta.formas.length, 2);
  assert.equal(semSeta.setas.length, 0);
});

test('duplicar copia as formas e as setas entre elas, 20 px ao lado', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  const r = duplicar(doc, ['f1', 'f2']);
  assert.deepEqual(r.ids, ['f3', 'f4']);
  assert.deepEqual([formaPorId(r.doc, 'f3').x, formaPorId(r.doc, 'f3').y], [120, 120]);
  assert.equal(r.doc.setas.length, 2);
  assert.deepEqual([r.doc.setas[1].de, r.doc.setas[1].para], ['f3', 'f4']);
});

test('seta: texto limitado, lados válidos, inverter troca as pontas e os lados', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  let d = atualizarSeta(doc, 's1', { texto: 'SIM', saida: 'baixo', chegada: 'nada' });
  assert.deepEqual([d.setas[0].texto, d.setas[0].saida, d.setas[0].chegada], ['SIM', 'baixo', 'auto']);
  d = inverterSeta(d, 's1');
  assert.deepEqual([d.setas[0].de, d.setas[0].para, d.setas[0].saida, d.setas[0].chegada], ['f2', 'f1', 'auto', 'baixo']);
});

test('trocar tipo mantém tamanho e texto', () => {
  const d = trocarTipo(atualizarForma(comDuas(), 'f1', { texto: 'X' }), ['f1'], 'circulo');
  const f = formaPorId(d, 'f1');
  assert.deepEqual([f.tipo, f.l, f.a, f.texto], ['circulo', 180, 70, 'X']);
});

test('título: texto limitado a 120 caracteres e sem quebra de linha', () => {
  const d = definirTitulo(documentoVazio(), { texto: 'a\nb' + 'x'.repeat(200), cor: 'rosa' });
  assert.equal(d.titulo.texto.length, 120);
  assert.equal(d.titulo.texto.startsWith('a b'), true);
  assert.equal(d.titulo.cor, 'rosa');
});

test('deitar a folha traz para dentro o que ficaria de fora', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 1000 }));
  d = definirOrientacao(d, 'paisagem');
  assert.equal(d.folha.orientacao, 'paisagem');
  assert.equal(formaPorId(d, 'f1').y, 794 - 30 - 70);
});

test('criar ligada: forma igual 50 px abaixo, já com seta', () => {
  let d = comDuas();
  d = atualizarForma(d, 'f1', { cor: 'vermelho', texto: 'não copia' });
  const r = criarLigada(d, 'f1', 'direita');
  const nova = formaPorId(r.doc, r.id);
  assert.deepEqual([nova.tipo, nova.cor, nova.x, nova.y, nova.texto], ['retangulo', 'vermelho', 330, 100, '']);
  assert.deepEqual([r.doc.setas[0].de, r.doc.setas[0].para], ['f1', r.id]);
});

test('criar ligada pula por cima de quem está no caminho e recusa quando não cabe', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 100 }));
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 230 })); // bem onde a nova cairia (y 220)
  const r = criarLigada(d, 'f1', 'baixo');
  assert.equal(formaPorId(r.doc, r.id).y, 350); // 230 + 70 + 50
  assert.equal(criarLigada(d, 'f1', 'cima').erro, 'sem-espaco');
});

test('normalizar forma: id e tipo obrigatórios; números arredondados e limitados', () => {
  assert.equal(normalizarForma({ tipo: 'losango' }), null);
  assert.equal(normalizarForma({ id: 'f1', tipo: 'estrela' }), null);
  const f = normalizarForma({ id: 'f1', tipo: 'retangulo', x: 10.4, y: 'abc', l: 5, a: 99999 });
  assert.deepEqual([f.x, f.y, f.l, f.a], [10, 0, 40, 2000]);
});
