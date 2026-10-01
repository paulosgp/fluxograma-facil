import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avisarAcesso, enderecoDoAviso, URL_CONTAGEM } from '../js/acesso.js';

// Todo teste passa um fetch FALSO: o de verdade gravaria uma linha na planilha do Paulo.
function armazem(inicial = {}) {
  const m = new Map(Object.entries(inicial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
}
function buscaFalsa(resposta = () => Promise.resolve({ ok: true })) {
  const f = (url, opcoes) => { f.chamadas.push({ url, opcoes }); return resposta(); };
  f.chamadas = [];
  return f;
}
const NO_AR = 'fluxograma.guiaaps.com.br';
const esperar = () => new Promise((r) => setTimeout(r, 0));

test('endereço: script do Guia Clínico, app=fluxograma, uid e versão codificados', () => {
  const u = new URL(enderecoDoAviso('a b&c', '1'));
  assert.equal(u.origin + u.pathname, URL_CONTAGEM);
  assert.equal(u.searchParams.get('acao'), 'acesso');
  assert.equal(u.searchParams.get('app'), 'fluxograma');
  assert.equal(u.searchParams.get('uid'), 'a b&c');
  assert.equal(u.searchParams.get('v'), '1');
});

test('no ar: manda uma vez por sessão, com um número sorteado e guardado no aparelho', async () => {
  const local = armazem(), sessao = armazem(), buscar = buscaFalsa();
  assert.equal(avisarAcesso({ host: NO_AR, local, sessao, buscar }), true);
  assert.equal(buscar.chamadas.length, 1);
  const uid = local.getItem('ff_uid');
  assert.ok(uid && uid.length >= 8, 'sorteou e guardou o número do aparelho');
  assert.equal(new URL(buscar.chamadas[0].url).searchParams.get('uid'), uid);
  assert.equal(buscar.chamadas[0].opcoes.cache, 'no-store');
  await esperar();
  assert.equal(sessao.getItem('ff_ping_ok'), '1');
  assert.equal(avisarAcesso({ host: NO_AR, local, sessao, buscar }), false, 'mesma sessão: não manda de novo');
  assert.equal(buscar.chamadas.length, 1);
});

test('aparelho que já tem número: usa o mesmo (é assim que se contam aparelhos distintos)', () => {
  const local = armazem({ ff_uid: 'numero-antigo' }), buscar = buscaFalsa();
  avisarAcesso({ host: NO_AR, local, sessao: armazem(), buscar });
  assert.equal(new URL(buscar.chamadas[0].url).searchParams.get('uid'), 'numero-antigo');
});

test('máquina de quem desenvolve e arquivo aberto do disco: não manda', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', 'fluxo.localhost', '', undefined]) {
    const buscar = buscaFalsa();
    assert.equal(avisarAcesso({ host, local: armazem(), sessao: armazem(), buscar }), false, String(host));
    assert.equal(buscar.chamadas.length, 0, String(host));
  }
});

test('sem internet: não marca a sessão (tenta na próxima abertura) e não lança', async () => {
  const sessao = armazem(), buscar = buscaFalsa(() => Promise.reject(new Error('sem rede')));
  assert.equal(avisarAcesso({ host: NO_AR, local: armazem(), sessao, buscar }), true);
  await esperar();
  assert.equal(sessao.getItem('ff_ping_ok'), null);
});

test('armazenamento bloqueado ou navegador sem fetch: não lança nem atrapalha', () => {
  const bloqueado = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  const buscar = buscaFalsa();
  assert.equal(avisarAcesso({ host: NO_AR, local: bloqueado, sessao: bloqueado, buscar }), false);
  assert.equal(buscar.chamadas.length, 0, 'sem sessão não dá para contar uma vez só: melhor não contar');
  assert.equal(avisarAcesso({ host: NO_AR, local: armazem(), sessao: armazem(), buscar: null }), false);
});
