// Contagem anônima de acessos, no mesmo esquema do Guia Clínico. Pedido do Paulo
// (30/09/2026): saber quantas pessoas estão usando, com um aviso diário no celular.
//
// Uma vez por sessão do navegador, o app chama o script do Guia Clínico, que grava
// a data, um número sorteado neste aparelho e a versão na aba "acessos_fluxograma"
// da planilha "GuiaClinicoAPS - Dispositivos". Não vai nome, e-mail, nem nada do
// fluxograma. O script é o do Guia Clínico (e não um próprio) por escolha dele: o
// do Guia já está autorizado na conta Google; um script novo pedia uma autorização
// que o navegador abria numa janela fora do alcance do Claude.
//
// Sem internet, script fora do ar, navegador que bloqueia o armazenamento: fica por
// isso mesmo. A contagem nunca atrapalha o desenho. E não roda em localhost nem com
// o arquivo aberto do disco, para os testes de quem desenvolve não virarem acesso.

export const URL_CONTAGEM = 'https://script.google.com/macros/s/AKfycbw-HxfZK1UHcqOF2CShR9oet5eE9_pdGGuKCvDLipFmUS3J8y151NUatLjhV5nSVQOc/exec';
export const VERSAO = '1';
const CHAVE_UID = 'ff_uid';
const CHAVE_SESSAO = 'ff_ping_ok';
const MAQUINA_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)$/;

export function enderecoDoAviso(uid, versao = VERSAO) {
  return `${URL_CONTAGEM}?acao=acesso&app=fluxograma&uid=${encodeURIComponent(uid)}&v=${encodeURIComponent(versao)}`;
}

function sortear() {
  return globalThis.crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2));
}

// Devolve true quando mandou o aviso. Nunca lança. Os testes passam host,
// armazenamento e fetch falsos; no navegador vêm os de verdade.
export function avisarAcesso(o = {}) {
  try {
    const host = 'host' in o ? o.host : globalThis.location?.hostname;
    if (!host || MAQUINA_LOCAL.test(host)) return false;
    const local = 'local' in o ? o.local : globalThis.localStorage;
    const sessao = 'sessao' in o ? o.sessao : globalThis.sessionStorage;
    const buscar = 'buscar' in o ? o.buscar : globalThis.fetch;
    if (sessao.getItem(CHAVE_SESSAO)) return false;
    let uid = null;
    try { uid = local.getItem(CHAVE_UID); } catch { /* sem armazenamento: número novo */ }
    if (!uid) {
      uid = sortear();
      try { local.setItem(CHAVE_UID, uid); } catch { /* idem */ }
    }
    // A sessão só fica marcada se o aviso chegou: sem internet, tenta na próxima abertura.
    buscar(enderecoDoAviso(uid), { cache: 'no-store' })
      .then(() => { try { sessao.setItem(CHAVE_SESSAO, '1'); } catch { /* idem */ } })
      .catch(() => {});
    return true;
  } catch {
    return false;
  }
}
