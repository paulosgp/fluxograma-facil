// A janela do "Tire sua dúvida": a pessoa escreve, a busca acha a resposta na
// base e ela aparece em passos, com "Mostrar na tela" apontando o botão certo.
import { BASE, COMUNS } from './duvidas.js';
import { buscar } from './busca.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const porId = new Map(BASE.map((d) => [d.id, d]));

// el = { cobertura, form, campo, resultado, fechar }; mostrarNaTela(seletor) faz o alvo piscar.
export function criarDuvidas({ el, mostrarNaTela }) {
  const lista = (ids) => ids.map((id) => porId.get(id)).filter(Boolean)
    .map((d) => `<button type="button" class="duvida-link" data-duvida="${d.id}">${esc(d.pergunta)}</button>`)
    .join('');
  const rotulo = (texto) => `<p class="duvidas-rotulo">${texto}</p>`;

  function htmlResposta(d) {
    const mostrar = d.mostrar
      ? `<button type="button" class="bt bt-destaque" data-mostrar="${esc(d.mostrar)}">Mostrar na tela</button>`
      : '';
    return `<div class="resposta"><h3>${esc(d.pergunta)}</h3><ol>${d.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>${mostrar}</div>`;
  }

  function mostrarComuns() {
    el.resultado.innerHTML = rotulo('Perguntas mais comuns:') + lista(COMUNS);
  }

  function mostrarItem(d, outras = []) {
    el.resultado.innerHTML = htmlResposta(d)
      + (outras.length ? rotulo('Talvez você queira saber:') + lista(outras.map((o) => o.id)) : '');
  }

  function perguntar() {
    const texto = el.campo.value.trim();
    if (!texto) { mostrarComuns(); return; }
    const r = buscar(BASE, texto);
    if (r.resposta) { mostrarItem(r.resposta, r.alternativas); return; }
    el.resultado.innerHTML = '<p class="nao-entendi">Não entendi essa. Tente com outras palavras, ou escolha uma das perguntas abaixo.</p>'
      + (r.alternativas.length ? rotulo('Parecidas com o que você escreveu:') + lista(r.alternativas.map((a) => a.id)) : '')
      + rotulo('Perguntas mais comuns:') + lista(COMUNS.filter((id) => !r.alternativas.some((a) => a.id === id)));
  }

  function abrir() {
    el.cobertura.hidden = false;
    el.campo.value = '';
    mostrarComuns();
    el.campo.focus();
  }

  function fechar() {
    el.cobertura.hidden = true;
  }

  el.form.addEventListener('submit', (ev) => { ev.preventDefault(); perguntar(); });
  el.fechar.addEventListener('click', fechar);
  // Clique fora do cartão fecha.
  el.cobertura.addEventListener('pointerdown', (ev) => { if (ev.target === el.cobertura) fechar(); });
  el.resultado.addEventListener('click', (ev) => {
    const d = ev.target.closest('[data-duvida]');
    if (d) {
      const item = porId.get(d.dataset.duvida);
      if (item) mostrarItem(item);
      return;
    }
    const m = ev.target.closest('[data-mostrar]');
    if (m) {
      fechar();
      mostrarNaTela(m.dataset.mostrar);
    }
  });

  return { abrir, fechar, aberta: () => !el.cobertura.hidden };
}
