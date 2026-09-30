// Painel da direita: mostra as opções do que está escolhido (forma, várias
// formas, seta ou título) e aplica a escolha. Sempre no mesmo lugar.
import { CORES, ORDEM_CORES, TIPOS, NOMES_TIPOS, LETRA, ROTULO_MAX, MARGEM, tamanhoFolha } from './paleta.js';
import {
  formaPorId, setaPorId, atualizarFormas, trocarTipo, duplicar, atualizarSeta, inverterSeta, definirTitulo,
} from './modelo.js';
import { htmlCreditos } from './creditos.js';

const ICONES = {
  retangulo: '<rect x="3" y="4" width="34" height="20"/>',
  arredondado: '<rect x="3" y="4" width="34" height="20" rx="7"/>',
  losango: '<path d="M20 2 38 14 20 26 2 14z"/>',
  circulo: '<ellipse cx="20" cy="14" rx="16" ry="11"/>',
  texto: '<path d="M11 7h18M20 7v15" fill="none"/>',
};
const LADOS = [['auto', 'Auto'], ['cima', '↑'], ['baixo', '↓'], ['esquerda', '←'], ['direita', '→']];
const NOME_LADO = { cima: 'em cima', baixo: 'embaixo', esquerda: 'à esquerda', direita: 'à direita' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ativo = (sim) => (sim ? ' ativo' : '');
const todas = (lista, fn) => lista.length > 0 && lista.every(fn);

function botao(acao, valor, rotulo, eAtivo = false, extra = '', titulo = '') {
  const t = titulo ? ` title="${esc(titulo)}"` : '';
  return `<button type="button" class="opcao${ativo(eAtivo)}${extra}"${t} data-acao="${acao}" data-valor="${esc(valor)}">${rotulo}</button>`;
}

function cores(atual) {
  return `<div class="grupo"><span class="rotulo-grupo">Cor</span><div class="cores">${ORDEM_CORES.map((n) => {
    const c = CORES[n];
    return `<button type="button" class="cor${ativo(atual === n)}" data-acao="cor" data-valor="${n}" title="${c.nome}" aria-label="${c.nome}" style="background:${c.fundo};border-color:${c.borda}"></button>`;
  }).join('')}</div></div>`;
}

export function criarPainel({ loja, el, interacao, avisar }) {
  let ultimo = '';

  function htmlNada() {
    return `<h2>Forma escolhida</h2>
      <p class="dica">Nada escolhido.</p>
      <p class="dica"><strong>Para escrever:</strong> clique numa forma e digite.</p>
      <p class="dica"><strong>Para pôr uma forma:</strong> use os botões da esquerda.</p>
      <p class="dica"><strong>Para ligar formas:</strong> clique numa forma e depois no <strong>+</strong> azul, ou use o botão <strong>Seta</strong>.</p>
      <p class="dica"><strong>Tem dúvida?</strong> Clique em <strong>Tire sua dúvida</strong>, no alto da tela.</p>
      <p class="creditos">${htmlCreditos()}</p>`;
  }

  function htmlFormas(fs) {
    const uma = fs.length === 1;
    const f = fs[0];
    const soTexto = todas(fs, (x) => x.tipo === 'texto');
    const partes = [`<h2>${uma ? 'Forma escolhida' : `${fs.length} formas escolhidas`}</h2>`];
    if (!soTexto) {
      const cor = todas(fs, (x) => x.cor === f.cor) ? f.cor : null;
      partes.push(cores(cor));
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Borda</span><div class="linha">
        ${botao('borda', 'lisa', 'Lisa', todas(fs, (x) => x.borda === 'lisa'))}
        ${botao('borda', 'tracejada', 'Tracejada', todas(fs, (x) => x.borda === 'tracejada'))}</div></div>`);
    }
    if (uma) {
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Letra (${f.letra})</span><div class="linha">
        ${botao('letra', '-2', 'A−', false)}${botao('letra', '2', 'A+', false)}
        ${botao('negrito', '', '<strong>Negrito</strong>', f.negrito)}</div>
        <div class="linha">${botao('alinhar', 'centro', 'Centralizado', f.alinhar === 'centro')}
        ${botao('alinhar', 'esquerda', 'À esquerda', f.alinhar === 'esquerda')}</div></div>`);
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Trocar a forma</span><div class="linha">${TIPOS.map((t) =>
        botao('tipo', t, `<svg viewBox="0 0 40 28" aria-hidden="true">${ICONES[t]}</svg><span class="sr">${NOMES_TIPOS[t]}</span>`,
          f.tipo === t, '', NOMES_TIPOS[t])).join('')}</div></div>`);
    }
    partes.push(`<div class="linha">${botao('duplicar', '', 'Duplicar')}${botao('apagar', '', 'Apagar', false, ' perigo')}</div>`);
    if (fs.some((x) => x.fora)) partes.push('<p class="alerta">Tem forma passando da margem da folha: ela pode sair cortada na impressão. Diminua a letra ou alargue a forma.</p>');
    return partes.join('');
  }

  function htmlSeta(s) {
    const lados = (qual) => `<div class="linha">${LADOS.map(([v, r]) =>
      botao(qual, v, r, s[qual] === v, '', v === 'auto' ? 'Automático' : NOME_LADO[v])).join('')}</div>`;
    return `<h2>Seta escolhida</h2>
      <div class="grupo"><span class="rotulo-grupo">Texto na seta</span><div class="linha">
        ${botao('seta-texto', 'SIM', 'SIM', s.texto === 'SIM')}${botao('seta-texto', 'NÃO', 'NÃO', s.texto === 'NÃO')}
        ${botao('seta-texto', '', 'Sem texto', s.texto === '')}</div>
        <label for="seta-outro">Ou escreva outro:</label>
        <div class="linha"><input type="text" id="seta-outro" maxlength="${ROTULO_MAX}" value="${esc(['SIM', 'NÃO'].includes(s.texto) ? '' : s.texto)}" placeholder="Talvez">
        ${botao('seta-outro', '', 'Pôr')}</div></div>
      <div class="grupo"><span class="rotulo-grupo">Direção</span>${botao('inverter', '', 'Inverter a seta')}</div>
      <div class="grupo"><span class="rotulo-grupo">Ajustar caminho</span>
        <span>Sai por:</span>${lados('saida')}<span>Chega por:</span>${lados('chegada')}</div>
      <div class="linha">${botao('apagar', '', 'Apagar a seta', false, ' perigo')}</div>`;
  }

  function htmlTitulo(doc) {
    return `<h2>Título</h2><p class="dica">Clique no título para escrever.</p>${cores(doc.titulo.cor).replace('>Cor<', '>Cor da faixa<')}`;
  }

  function montar() {
    const { doc, selecao } = loja;
    if (selecao.seta) {
      const s = setaPorId(doc, selecao.seta);
      if (s) return htmlSeta(s);
    }
    if (selecao.titulo) return htmlTitulo(doc);
    const folha = tamanhoFolha(doc.folha.orientacao);
    const fs = selecao.formas.map((id) => formaPorId(doc, id)).filter(Boolean).map((f) => ({
      ...f, fora: f.x + f.l > folha.largura - MARGEM + 1 || f.y + f.a > folha.altura - MARGEM + 1,
    }));
    return fs.length ? htmlFormas(fs) : htmlNada();
  }

  function atualizar() {
    const html = montar();
    if (html === ultimo) return;
    ultimo = html;
    el.innerHTML = html;
  }

  // Muda e, depois de desenhar, cresce quem ficou sem espaço para o texto.
  function mudarFormas(ids, fn) {
    loja.comecar();
    loja.trocar(fn(loja.doc));
    loja.trocar(interacao.crescer(loja.doc, ids));
    loja.confirmar();
  }

  function executar(acao, valor) {
    interacao.terminarEdicao();
    const { doc, selecao } = loja;
    const ids = selecao.formas;
    const seta = selecao.seta;
    switch (acao) {
      case 'cor':
        if (selecao.titulo) loja.aplicar(definirTitulo(doc, { cor: valor }));
        else loja.aplicar(atualizarFormas(doc, ids, { cor: valor }));
        break;
      case 'borda': loja.aplicar(atualizarFormas(doc, ids, { borda: valor })); break;
      case 'letra': {
        const f = formaPorId(doc, ids[0]);
        const nova = f.letra + Number(valor);
        if (nova < LETRA.min || nova > LETRA.max) { avisar(nova < LETRA.min ? 'A letra já está no menor tamanho.' : 'A letra já está no maior tamanho.'); return; }
        mudarFormas(ids, (d) => atualizarFormas(d, ids, { letra: nova }));
        break;
      }
      case 'negrito': {
        const f = formaPorId(doc, ids[0]);
        mudarFormas(ids, (d) => atualizarFormas(d, ids, { negrito: !f.negrito }));
        break;
      }
      case 'alinhar': loja.aplicar(atualizarFormas(doc, ids, { alinhar: valor })); break;
      case 'tipo': mudarFormas(ids, (d) => trocarTipo(d, ids, valor)); break;
      case 'duplicar': {
        const r = duplicar(doc, ids);
        loja.aplicar(r.doc);
        loja.selecionar({ formas: r.ids });
        break;
      }
      case 'apagar': interacao.apagarSelecao(); break;
      case 'seta-texto': loja.aplicar(atualizarSeta(doc, seta, { texto: valor })); break;
      case 'seta-outro': {
        const campo = el.querySelector('#seta-outro');
        loja.aplicar(atualizarSeta(doc, seta, { texto: campo ? campo.value.trim() : '' }));
        break;
      }
      case 'inverter': loja.aplicar(inverterSeta(doc, seta)); break;
      case 'saida': case 'chegada': loja.aplicar(atualizarSeta(doc, seta, { [acao]: valor })); break;
      default: break;
    }
  }

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (b) executar(b.dataset.acao, b.dataset.valor);
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'seta-outro') {
      ev.preventDefault();
      executar('seta-outro', '');
    }
  });

  return { atualizar };
}
