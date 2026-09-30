// Mouse e teclado na folha. Mantém o "estado da tela" (quem está sendo editado,
// modo seta, guias, laço) e traduz gestos em operações do modelo, pela loja.
import { TEXTO_MAX, GRADE, MARGEM, TAM_MIN, tamanhoFolha } from './paleta.js';
import { alturaNecessaria } from './geometria.js';
import { encaixar, posicionar } from './encaixe.js';
import {
  formaPorId, atualizarForma, moverFormas, apagar, ligar, criarForma, criarLigada, definirTitulo,
} from './modelo.js';

const TOLERANCIA = 4; // px de tela antes de um clique virar arrasto

// "plaintext-only" impede colar negrito/cor de outro lugar; onde não existir, "true" + colar limpo.
const EDITAVEL = (() => {
  const d = document.createElement('div');
  d.contentEditable = 'plaintext-only';
  return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true';
})();

function lerTexto(n) {
  return n.innerText.replace(/\r/g, '').replace(/\n$/, '');
}

function colocarCursor(alvo, ev) {
  let range = null;
  if (ev && document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(ev.clientX, ev.clientY);
    if (p && alvo.contains(p.offsetNode)) {
      range = document.createRange();
      range.setStart(p.offsetNode, p.offset);
    }
  } else if (ev && document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    if (r && alvo.contains(r.startContainer)) range = r;
  }
  if (!range) { // sem ponto (ou fora do texto): cursor no fim
    range = document.createRange();
    range.selectNodeContents(alvo);
    range.collapse(false);
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function caixaDoGrupo(doc, ids) {
  const fs = doc.formas.filter((f) => ids.includes(f.id));
  const x = Math.min(...fs.map((f) => f.x));
  const y = Math.min(...fs.map((f) => f.y));
  return { x, y, l: Math.max(...fs.map((f) => f.x + f.l)) - x, a: Math.max(...fs.map((f) => f.y + f.a)) - y };
}

export function criarInteracao({ loja, desenho, el, avisar, faixa, redesenhar, dialogoAberto }) {
  const tela = { editandoId: null, editandoTitulo: false, modoSeta: null, guias: [], laco: null, arrastando: false };
  let gesto = null;
  let relogioLote = null;

  const fecharLoteDepois = () => {
    clearTimeout(relogioLote);
    relogioLote = setTimeout(() => loja.confirmar(), 1000);
  };

  // ---------- Escrever ----------
  function terminarEdicao() {
    const havia = tela.editandoId || tela.editandoTitulo;
    if (tela.editandoId) {
      const t = desenho.textoDe(tela.editandoId);
      tela.editandoId = null;
      if (t) { t.contentEditable = 'false'; t.blur(); }
    }
    if (tela.editandoTitulo) {
      tela.editandoTitulo = false;
      el.tituloTexto.contentEditable = 'false';
      el.tituloTexto.blur();
    }
    clearTimeout(relogioLote);
    loja.confirmar();
    if (havia) {
      window.getSelection()?.removeAllRanges();
      redesenhar();
    }
  }

  function comecarEdicao(id, ev) {
    if (tela.editandoId === id) return;
    terminarEdicao();
    loja.selecionar({ formas: [id] });
    tela.editandoId = id;
    redesenhar();
    const t = desenho.textoDe(id);
    if (!t) return;
    t.contentEditable = EDITAVEL;
    t.focus({ preventScroll: true });
    colocarCursor(t, ev);
  }

  function comecarEdicaoTitulo(ev) {
    if (tela.editandoTitulo) return;
    terminarEdicao();
    loja.selecionar({ titulo: true });
    tela.editandoTitulo = true;
    redesenhar();
    el.tituloTexto.contentEditable = EDITAVEL;
    el.tituloTexto.focus({ preventScroll: true });
    colocarCursor(el.tituloTexto, ev);
  }

  // A forma cresce para baixo (topo parado) quando o texto não cabe; nunca encolhe sozinha.
  function crescerSePreciso(doc, id) {
    const f = formaPorId(doc, id);
    if (!f) return doc;
    const precisa = Math.ceil(alturaNecessaria(f, desenho.alturaDoTexto(id)) / GRADE) * GRADE;
    return precisa > f.a ? atualizarForma(doc, id, { a: precisa }) : doc;
  }

  el.formas.addEventListener('input', (ev) => {
    const raiz = ev.target.closest('.forma');
    if (!raiz || raiz.dataset.id !== tela.editandoId) return;
    let texto = lerTexto(ev.target);
    if (texto.length > TEXTO_MAX) {
      texto = texto.slice(0, TEXTO_MAX);
      ev.target.textContent = texto;
      colocarCursor(ev.target);
    }
    loja.comecar();
    const doc = atualizarForma(loja.doc, tela.editandoId, { texto });
    loja.trocar(crescerSePreciso(doc, tela.editandoId));
    fecharLoteDepois();
  });

  el.tituloTexto.addEventListener('input', () => {
    if (!tela.editandoTitulo) return;
    loja.comecar();
    loja.trocar(definirTitulo(loja.doc, { texto: lerTexto(el.tituloTexto) }));
    fecharLoteDepois();
  });

  // Colar entra só como texto, sem cor nem negrito de outro lugar.
  for (const alvo of [el.formas, el.tituloTexto]) {
    alvo.addEventListener('paste', (ev) => {
      if (!tela.editandoId && !tela.editandoTitulo) return;
      ev.preventDefault();
      document.execCommand('insertText', false, ev.clipboardData.getData('text/plain'));
    });
  }

  // Clicou fora do texto (no painel, por exemplo): termina de escrever.
  function aoPerderFoco() {
    setTimeout(() => {
      const t = tela.editandoId ? desenho.textoDe(tela.editandoId) : tela.editandoTitulo ? el.tituloTexto : null;
      if (t && document.activeElement !== t && document.hasFocus()) terminarEdicao();
    }, 0);
  }
  el.formas.addEventListener('focusout', aoPerderFoco);
  el.tituloTexto.addEventListener('focusout', aoPerderFoco);

  // ---------- Seta pelo botão ----------
  function entrarModoSeta() {
    terminarEdicao();
    loja.selecionar({});
    tela.modoSeta = { etapa: 'origem', de: null };
    faixa.mostrar('Clique na forma de onde a seta SAI.');
    redesenhar();
  }

  function sairModoSeta() {
    if (!tela.modoSeta) return;
    tela.modoSeta = null;
    faixa.esconder();
    redesenhar();
  }

  function cliqueNoModoSeta(id) {
    if (tela.modoSeta.etapa === 'origem') {
      tela.modoSeta = { etapa: 'destino', de: id };
      faixa.mostrar('Agora clique na forma aonde a seta CHEGA.');
      redesenhar();
      return;
    }
    if (id === tela.modoSeta.de) {
      avisar('A seta precisa chegar em OUTRA forma. Clique na forma aonde ela chega.');
      return;
    }
    const r = ligar(loja.doc, tela.modoSeta.de, id);
    sairModoSeta();
    if (r.erro === 'repetida') {
      avisar('Essas duas formas já estão ligadas por uma seta.');
      return;
    }
    if (r.erro) return;
    loja.aplicar(r.doc);
    loja.selecionar({ seta: r.id });
  }

  // ---------- Ações usadas pela paleta, pelo painel e pelo teclado ----------
  function centroVisivel() {
    const r = el.palco.getBoundingClientRect();
    const alto = Math.min(r.bottom, window.innerHeight);
    return desenho.paraFolha({ clientX: r.left + r.width / 2, clientY: r.top + (alto - r.top) / 2 });
  }

  function adicionarForma(tipo) {
    sairModoSeta();
    terminarEdicao();
    const r = criarForma(loja.doc, tipo, null, { perto: centroVisivel() });
    if (r.erro) {
      avisar('A folha está cheia. Apague ou diminua alguma forma para caber outra.');
      return;
    }
    loja.aplicar(r.doc);
    comecarEdicao(r.id);
  }

  function criarPeloMais(lado) {
    const id = loja.selecao.formas[0];
    if (!id) return;
    terminarEdicao();
    const r = criarLigada(loja.doc, id, lado);
    if (r.erro) {
      avisar('Não cabe outra forma desse lado da folha. Arraste as formas para abrir espaço, ou use outro "+".');
      return;
    }
    loja.aplicar(r.doc);
    comecarEdicao(r.id);
  }

  function apagarSelecao() {
    const s = loja.selecao;
    const ids = s.seta ? [s.seta] : s.formas;
    if (!ids.length) return false;
    terminarEdicao();
    loja.aplicar(apagar(loja.doc, ids));
    loja.selecionar({});
    return true;
  }

  function escolherSeta(id) {
    terminarEdicao();
    loja.selecionar({ seta: id });
  }

  // ---------- Mouse ----------
  function redimensionar(g, p) {
    const o = g.orig;
    const dx = p.x - g.inicio.x;
    const dy = p.y - g.inicio.y;
    const folha = tamanhoFolha(loja.doc.folha.orientacao);
    const oeste = g.canto[1] === 'o';
    const norte = g.canto[0] === 'n';
    let x1 = o.x;
    let y1 = o.y;
    let x2 = o.x + o.l;
    let y2 = o.y + o.a;
    if (oeste) x1 = Math.max(MARGEM, encaixar(o.x + dx)); else x2 = Math.min(folha.largura - MARGEM, encaixar(x2 + dx));
    if (norte) y1 = Math.max(MARGEM, encaixar(o.y + dy)); else y2 = Math.min(folha.altura - MARGEM, encaixar(y2 + dy));
    if (x2 - x1 < TAM_MIN.l) { if (oeste) x1 = x2 - TAM_MIN.l; else x2 = x1 + TAM_MIN.l; }
    if (y2 - y1 < TAM_MIN.a) { if (norte) y1 = y2 - TAM_MIN.a; else y2 = y1 + TAM_MIN.a; }
    loja.trocar(atualizarForma(loja.doc, g.id, { x: x1, y: y1, l: x2 - x1, a: y2 - y1 }));
  }

  function aoApertar(ev) {
    if (ev.button !== 0 || dialogoAberto()) return;
    const alvo = ev.target;
    const p = desenho.paraFolha(ev);

    const mais = alvo.closest('.ctl-mais');
    if (mais) { ev.preventDefault(); gesto = { tipo: 'mais', lado: mais.dataset.lado }; return; }

    const alca = alvo.closest('.ctl-alca');
    if (alca) {
      ev.preventDefault();
      const id = loja.selecao.formas[0];
      const f = formaPorId(loja.doc, id);
      if (!f) return;
      terminarEdicao();
      loja.comecar();
      tela.arrastando = true;
      gesto = { tipo: 'alca', canto: alca.dataset.canto, id, inicio: p, orig: { ...f } };
      return;
    }

    const rotulo = alvo.closest('.rotulo');
    if (rotulo && !tela.modoSeta) { ev.preventDefault(); escolherSeta(rotulo.dataset.seta); return; }
    const seta = alvo.closest('.seta');
    if (seta && !tela.modoSeta) { ev.preventDefault(); escolherSeta(seta.dataset.id); return; }

    const raiz = alvo.closest('.forma');
    if (raiz) {
      const id = raiz.dataset.id;
      if (tela.modoSeta) { ev.preventDefault(); cliqueNoModoSeta(id); return; }
      if (tela.editandoId === id && alvo.closest('.texto')) return; // o navegador cuida do cursor
      ev.preventDefault();
      if (ev.shiftKey) {
        terminarEdicao();
        const atual = loja.selecao.formas;
        loja.selecionar({ formas: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id] });
        return;
      }
      const grupo = loja.selecao.formas.includes(id) && loja.selecao.formas.length > 1;
      gesto = { tipo: 'forma', id, inicio: p, cliente: [ev.clientX, ev.clientY], moveu: false, ids: grupo ? [...loja.selecao.formas] : [id] };
      return;
    }

    if (alvo.closest('.titulo')) {
      if (tela.modoSeta) return;
      if (tela.editandoTitulo && alvo.closest('.titulo-texto')) return;
      ev.preventDefault();
      comecarEdicaoTitulo(ev);
      return;
    }

    if (tela.modoSeta) return;
    ev.preventDefault();
    terminarEdicao();
    gesto = { tipo: 'laco', inicio: p, cliente: [ev.clientX, ev.clientY], moveu: false, somar: ev.shiftKey };
  }

  function aoMover(ev) {
    if (!gesto) return;
    const p = desenho.paraFolha(ev);
    const longe = () => Math.hypot(ev.clientX - gesto.cliente[0], ev.clientY - gesto.cliente[1]) >= TOLERANCIA;

    if (gesto.tipo === 'forma') {
      if (!gesto.moveu) {
        if (!longe()) return;
        gesto.moveu = true;
        terminarEdicao();
        if (!loja.selecao.formas.includes(gesto.id)) loja.selecionar({ formas: [gesto.id] });
        loja.comecar();
        gesto.docInicio = loja.doc;
        gesto.caixa = caixaDoGrupo(loja.doc, gesto.ids);
        gesto.outras = loja.doc.formas.filter((f) => !gesto.ids.includes(f.id));
        tela.arrastando = true;
      }
      const folha = tamanhoFolha(loja.doc.folha.orientacao);
      const c = gesto.caixa;
      const alvo = posicionar({ ...c, x: c.x + p.x - gesto.inicio.x, y: c.y + p.y - gesto.inicio.y }, gesto.outras, folha);
      tela.guias = alvo.linhas;
      loja.trocar(moverFormas(gesto.docInicio, gesto.ids, alvo.x - c.x, alvo.y - c.y));
      return;
    }
    if (gesto.tipo === 'alca') { redimensionar(gesto, p); return; }
    if (gesto.tipo === 'laco') {
      if (!gesto.moveu && !longe()) return;
      gesto.moveu = true;
      const i = gesto.inicio;
      tela.laco = { x: Math.min(i.x, p.x), y: Math.min(i.y, p.y), l: Math.abs(p.x - i.x), a: Math.abs(p.y - i.y) };
      redesenhar();
    }
  }

  function aoSoltar(ev) {
    if (!gesto) return;
    const g = gesto;
    gesto = null;
    if (g.tipo === 'mais') {
      if (ev.target.closest && ev.target.closest('.ctl-mais')) criarPeloMais(g.lado);
      return;
    }
    if (g.tipo === 'forma') {
      if (!g.moveu) { comecarEdicao(g.id, ev); return; }
      tela.arrastando = false;
      tela.guias = [];
      loja.confirmar();
      redesenhar();
      return;
    }
    if (g.tipo === 'alca') {
      loja.trocar(crescerSePreciso(loja.doc, g.id));
      tela.arrastando = false;
      loja.confirmar();
      redesenhar();
      return;
    }
    if (g.tipo === 'laco') {
      const r = tela.laco;
      tela.laco = null;
      if (!g.moveu || !r) { loja.selecionar({}); return; }
      const dentro = loja.doc.formas
        .filter((f) => f.x >= r.x && f.y >= r.y && f.x + f.l <= r.x + r.l && f.y + f.a <= r.y + r.a)
        .map((f) => f.id);
      loja.selecionar({ formas: g.somar ? [...new Set([...loja.selecao.formas, ...dentro])] : dentro });
    }
  }

  el.folha.addEventListener('pointerdown', aoApertar);
  window.addEventListener('pointermove', aoMover);
  window.addEventListener('pointerup', aoSoltar);
  window.addEventListener('pointercancel', aoSoltar);

  // Clique no cinza em volta da folha: larga tudo.
  el.palco.addEventListener('pointerdown', (ev) => {
    if (ev.target === el.palco || ev.target === el.caixa) {
      sairModoSeta();
      terminarEdicao();
      loja.selecionar({});
    }
  });

  // ---------- Teclado ----------
  document.addEventListener('keydown', (ev) => {
    if (dialogoAberto()) return;
    const ctrl = ev.ctrlKey || ev.metaKey;
    const k = ev.key.toLowerCase();
    if (tela.editandoId || tela.editandoTitulo) {
      if (ev.key === 'Escape' || (tela.editandoTitulo && ev.key === 'Enter')) { ev.preventDefault(); terminarEdicao(); return; }
      if (ctrl && (k === 'z' || k === 'y')) {
        ev.preventDefault();
        terminarEdicao();
        if (k === 'y' || ev.shiftKey) loja.refazer(); else loja.desfazer();
        return;
      }
      if (ctrl && (k === 'b' || k === 'i' || k === 'u')) ev.preventDefault();
      return;
    }
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (ctrl && k === 'z') { ev.preventDefault(); if (ev.shiftKey) loja.refazer(); else loja.desfazer(); return; }
    if (ctrl && k === 'y') { ev.preventDefault(); loja.refazer(); return; }
    if (ev.key === 'Escape') { if (tela.modoSeta) sairModoSeta(); else loja.selecionar({}); return; }
    // Backspace com UMA forma escolhida apaga letra, como quem digita (ver "letra digitada"
    // abaixo) — apagar a forma inteira seria uma surpresa. Delete apaga a forma.
    if (ev.key === 'Backspace' && loja.selecao.formas.length === 1) {
      ev.preventDefault();
      comecarEdicao(loja.selecao.formas[0]);
      document.execCommand('delete');
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { if (apagarSelecao()) ev.preventDefault(); return; }
    // Letra digitada com uma forma escolhida: começa a escrever nela.
    if (!ctrl && !ev.altKey && ev.key.length === 1 && loja.selecao.formas.length === 1) {
      ev.preventDefault();
      comecarEdicao(loja.selecao.formas[0]);
      document.execCommand('insertText', false, ev.key);
    }
  });

  // Depois de mudar letra ou tipo pelo painel: cresce quem ficou sem espaço.
  // (Chamar DEPOIS de a mudança ter sido desenhada, porque mede o texto na tela.)
  function crescer(doc, ids) {
    return ids.reduce((d, id) => crescerSePreciso(d, id), doc);
  }

  return {
    estadoTela: () => ({ ...tela }),
    terminarEdicao, comecarEdicao, entrarModoSeta, sairModoSeta, adicionarForma, apagarSelecao, crescer,
  };
}
