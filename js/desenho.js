// Desenha o documento na folha: formas, setas, rótulos, título e controles.
// Só reflete o estado; quem decide o que muda é interacao.js e painel.js.
import { CORES, MARGEM, tamanhoFolha } from './paleta.js';
import { caixaDoTexto, contorno } from './geometria.js';
import { tracarSeta, caminhoSvg, encurtarFim } from './setas.js';
import { formaPorId } from './modelo.js';

const NS = 'http://www.w3.org/2000/svg';
const PONTA = 8; // quanto a linha recua para a ponta da seta caber

export function criarDesenho(el) {
  const elementos = new Map(); // id → { raiz, svg, caixa, texto, assinatura }
  let zoom = 1;

  function ajustarFolha(doc) {
    const f = tamanhoFolha(doc.folha.orientacao);
    const disponivel = el.palco.clientWidth - 48;
    zoom = Math.min(1.2, Math.max(0.5, disponivel / f.largura));
    document.documentElement.style.setProperty('--zoom', String(zoom));
    el.caixa.style.width = `${f.largura * zoom}px`;
    el.caixa.style.height = `${f.altura * zoom}px`;
    el.folha.classList.toggle('retrato', doc.folha.orientacao !== 'paisagem');
    el.folha.classList.toggle('paisagem', doc.folha.orientacao === 'paisagem');
    el.setas.setAttribute('viewBox', `0 0 ${f.largura} ${f.altura}`);
    el.setas.setAttribute('width', f.largura);
    el.setas.setAttribute('height', f.altura);
  }

  function novoElemento(id) {
    const raiz = document.createElement('div');
    raiz.className = 'forma';
    raiz.dataset.id = id;
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('contorno');
    const caixa = document.createElement('div');
    caixa.className = 'texto-caixa';
    const texto = document.createElement('div');
    texto.className = 'texto';
    texto.spellcheck = true;
    caixa.appendChild(texto);
    raiz.append(svg, caixa);
    return { raiz, svg, caixa, texto, assinatura: '' };
  }

  function atualizarElemento(e, f, estado, folha) {
    const cor = CORES[f.cor] || CORES.branco;
    const s = e.raiz.style;
    s.left = `${f.x}px`;
    s.top = `${f.y}px`;
    s.width = `${f.l}px`;
    s.height = `${f.a}px`;
    const assinatura = [f.tipo, f.l, f.a, f.cor, f.borda].join('|');
    if (assinatura !== e.assinatura) {
      e.assinatura = assinatura;
      e.svg.setAttribute('viewBox', `0 0 ${f.l} ${f.a}`);
      e.svg.replaceChildren();
      const c = contorno(f);
      if (c) {
        const n = document.createElementNS(NS, c.tag);
        for (const [k, v] of Object.entries(c.attrs)) n.setAttribute(k, v);
        n.setAttribute('fill', cor.fundo);
        n.setAttribute('stroke', cor.borda);
        n.setAttribute('stroke-width', '2');
        if (f.borda === 'tracejada') n.setAttribute('stroke-dasharray', '8 5');
        e.svg.appendChild(n);
      }
      const cx = caixaDoTexto(f);
      Object.assign(e.caixa.style, { left: `${cx.x}px`, top: `${cx.y}px`, width: `${cx.l}px`, height: `${cx.a}px` });
    }
    e.texto.style.fontSize = `${f.letra}px`;
    const editando = estado.editandoId === f.id;
    if (!editando && e.texto.textContent !== f.texto) e.texto.textContent = f.texto;
    const fora = f.x + f.l > folha.largura - MARGEM + 1 || f.y + f.a > folha.altura - MARGEM + 1;
    const cl = e.raiz.classList;
    cl.toggle('vazia', f.texto === '');
    cl.toggle('esquerda', f.alinhar === 'esquerda');
    cl.toggle('negrito', f.negrito);
    cl.toggle('selecionada', estado.selecao.formas.includes(f.id) && !editando);
    cl.toggle('editando', editando);
    cl.toggle('fora', fora);
    cl.toggle('origem-seta', !!(estado.modoSeta && estado.modoSeta.de === f.id));
    for (const t of ['retangulo', 'arredondado', 'losango', 'circulo', 'texto']) cl.toggle(`tipo-${t}`, f.tipo === t);
  }

  function desenharFormas(doc, estado) {
    const folha = tamanhoFolha(doc.folha.orientacao);
    const vivos = new Set();
    const ordem = [];
    for (const f of doc.formas) {
      let e = elementos.get(f.id);
      if (!e) {
        e = novoElemento(f.id);
        elementos.set(f.id, e);
        el.formas.appendChild(e.raiz);
      }
      atualizarElemento(e, f, estado, folha);
      vivos.add(f.id);
      ordem.push(e.raiz);
    }
    for (const [id, e] of elementos) {
      if (!vivos.has(id)) {
        e.raiz.remove();
        elementos.delete(id);
      }
    }
    const filhos = el.formas.children;
    if (ordem.some((n, i) => filhos[i] !== n)) for (const n of ordem) el.formas.appendChild(n);
  }

  function marcador(id, cor) {
    const m = document.createElementNS(NS, 'marker');
    for (const [k, v] of Object.entries({
      id, viewBox: '0 0 10 10', refX: '2', refY: '5', markerWidth: '10', markerHeight: '10',
      markerUnits: 'userSpaceOnUse', orient: 'auto',
    })) m.setAttribute(k, v);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M0,0 L10,5 L0,10 z');
    p.setAttribute('fill', cor);
    m.appendChild(p);
    return m;
  }

  function desenharSetas(doc, estado) {
    const defs = document.createElementNS(NS, 'defs');
    defs.append(marcador('ponta', '#2b2f33'), marcador('ponta-sel', '#1a5fb4'));
    const itens = [defs];
    const rotulos = [];
    for (const s of doc.setas) {
      const de = formaPorId(doc, s.de);
      const para = formaPorId(doc, s.para);
      if (!de || !para) continue;
      const t = tracarSeta(de, para, s);
      const escolhida = estado.selecao.seta === s.id;
      const g = document.createElementNS(NS, 'g');
      g.classList.add('seta');
      if (escolhida) g.classList.add('selecionada');
      g.dataset.id = s.id;
      const alvo = document.createElementNS(NS, 'path');
      alvo.classList.add('seta-alvo');
      alvo.setAttribute('d', caminhoSvg(t.pontos));
      const linha = document.createElementNS(NS, 'path');
      linha.classList.add('seta-linha');
      linha.setAttribute('d', caminhoSvg(encurtarFim(t.pontos, PONTA)));
      linha.setAttribute('marker-end', `url(#${escolhida ? 'ponta-sel' : 'ponta'})`);
      g.append(alvo, linha);
      itens.push(g);
      if (s.texto) {
        const r = document.createElement('div');
        r.className = escolhida ? 'rotulo selecionado' : 'rotulo';
        r.dataset.seta = s.id;
        r.textContent = s.texto;
        r.style.left = `${t.rotulo.x}px`;
        r.style.top = `${t.rotulo.y}px`;
        rotulos.push(r);
      }
    }
    el.setas.replaceChildren(...itens);
    el.rotulos.replaceChildren(...rotulos);
  }

  function desenharTitulo(doc, estado) {
    const cor = CORES[doc.titulo.cor] || CORES.cinza;
    el.titulo.style.background = cor.fundo;
    el.titulo.style.borderColor = cor.borda;
    el.titulo.classList.toggle('vazio', doc.titulo.texto === '' && !estado.editandoTitulo);
    el.titulo.classList.toggle('selecionado', estado.selecao.titulo && !estado.editandoTitulo);
    if (!estado.editandoTitulo && el.tituloTexto.textContent !== doc.titulo.texto) {
      el.tituloTexto.textContent = doc.titulo.texto;
    }
  }

  function bloco(classe, x, y, props = {}) {
    const n = document.createElement(props.tag || 'div');
    n.className = classe;
    n.style.left = `${x}px`;
    n.style.top = `${y}px`;
    if (props.l !== undefined) n.style.width = `${props.l}px`;
    if (props.a !== undefined) n.style.height = `${props.a}px`;
    return n;
  }

  function desenharControles(doc, estado) {
    const itens = [];
    const sel = estado.selecao.formas;
    if (sel.length === 1 && !estado.modoSeta && !estado.arrastando) {
      const f = formaPorId(doc, sel[0]);
      if (f) {
        const d = 26 / zoom; // distância constante na tela
        const mais = {
          cima: [f.x + f.l / 2, f.y - d], baixo: [f.x + f.l / 2, f.y + f.a + d],
          esquerda: [f.x - d, f.y + f.a / 2], direita: [f.x + f.l + d, f.y + f.a / 2],
        };
        for (const [lado, [x, y]] of Object.entries(mais)) {
          const b = bloco('ctl-mais', x, y, { tag: 'button' });
          b.type = 'button';
          b.dataset.lado = lado;
          b.title = 'Criar outra forma ligada aqui';
          b.setAttribute('aria-label', `Criar outra forma ligada, ${lado}`);
          b.textContent = '+';
          itens.push(b);
        }
        const cantos = { no: [f.x, f.y], ne: [f.x + f.l, f.y], so: [f.x, f.y + f.a], se: [f.x + f.l, f.y + f.a] };
        for (const [canto, [x, y]] of Object.entries(cantos)) {
          const a = bloco('ctl-alca', x, y);
          a.dataset.canto = canto;
          a.title = 'Puxe para mudar o tamanho';
          itens.push(a);
        }
      }
    }
    const fino = 1.5 / zoom;
    for (const g of estado.guias || []) {
      const vertical = g.x1 === g.x2;
      itens.push(bloco('guia', g.x1, g.y1, vertical ? { l: fino, a: g.y2 - g.y1 } : { l: g.x2 - g.x1, a: fino }));
    }
    if (estado.laco) {
      const { x, y, l, a } = estado.laco;
      itens.push(bloco('laco', x, y, { l, a }));
    }
    el.controles.replaceChildren(...itens);
  }

  return {
    get zoom() { return zoom; },
    tudo(doc, estado) {
      ajustarFolha(doc);
      desenharTitulo(doc, estado);
      desenharFormas(doc, estado);
      desenharSetas(doc, estado);
      desenharControles(doc, estado);
      el.folha.classList.toggle('modo-seta', !!estado.modoSeta);
      el.folha.classList.toggle('arrastando', !!estado.arrastando);
    },
    // Ponto do mouse em pixels da folha.
    paraFolha(ev) {
      const r = el.folha.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / zoom, y: (ev.clientY - r.top) / zoom };
    },
    textoDe(id) {
      const e = elementos.get(id);
      return e ? e.texto : null;
    },
    alturaDoTexto(id) {
      const e = elementos.get(id);
      return e ? e.texto.scrollHeight : 0;
    },
  };
}
