// A marca do autor, num lugar só: a tela inicial, o painel, o "Tire sua dúvida"
// e o manual usam daqui. Pedido do Paulo (30/09/2026): "registra a minha marca".
// O fluxograma IMPRESSO não leva a marca, de propósito: ele é o documento oficial
// de cada município.

export const CREDITOS = {
  autor: 'Enf. Paulo Gomes',
  lugar: 'São Mateus do Sul – PR',
  email: 'paulosergiogp@hotmail.com',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Linha de crédito em HTML, com o e-mail clicável.
export function htmlCreditos() {
  const { autor, lugar, email } = CREDITOS;
  return `Criado por <strong>${esc(autor)}</strong> · ${esc(lugar)}<br>`
    + `Dúvidas, sugestões ou problemas: <a href="mailto:${esc(email)}">${esc(email)}</a>`;
}
