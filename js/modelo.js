// O documento do fluxograma e todas as operações sobre ele. Toda função recebe
// um documento e devolve OUTRO: o original nunca muda. É isso que deixa o
// desfazer simples (basta guardar fotos) e os testes diretos.
import {
  CORES, TIPOS, TAMANHO_PADRAO, TAM_MIN, LETRA, TEXTO_MAX, TITULO_MAX, ROTULO_MAX,
  LADOS, MARGEM, DISTANCIA_MAIS, tamanhoFolha,
} from './paleta.js';
import { encaixar, limitar } from './encaixe.js';

export const APP = 'fluxograma-facil';
export const VERSAO = 1;
const TAM_MAX = 2000;

export function documentoVazio() {
  return {
    app: APP, versao: VERSAO,
    titulo: { texto: '', cor: 'cinza' },
    folha: { orientacao: 'retrato' },
    formas: [], setas: [],
  };
}

const clonar = (d) => structuredClone(d);

function numero(v, min, max, padrao) {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function textoLimpo(v, max) {
  return typeof v === 'string' ? v.replace(/\r/g, '').slice(0, max) : '';
}

function letraValida(v) {
  const n = numero(v, LETRA.min, LETRA.max, LETRA.padrao);
  return n % 2 === 0 ? n : n - 1; // passo de 2, como os botões A− e A+
}

// Devolve a forma "consertada", ou null se faltar id ou o tipo não existir.
export function normalizarForma(o) {
  if (!o || typeof o !== 'object') return null;
  if (typeof o.id !== 'string' || !o.id || !TIPOS.includes(o.tipo)) return null;
  const pad = TAMANHO_PADRAO[o.tipo];
  return {
    id: o.id,
    tipo: o.tipo,
    x: numero(o.x, 0, TAM_MAX, 0),
    y: numero(o.y, 0, TAM_MAX, 0),
    l: numero(o.l, TAM_MIN.l, TAM_MAX, pad.l),
    a: numero(o.a, TAM_MIN.a, TAM_MAX, pad.a),
    texto: textoLimpo(o.texto, TEXTO_MAX),
    cor: CORES[o.cor] ? o.cor : 'branco',
    borda: o.borda === 'tracejada' ? 'tracejada' : 'lisa',
    letra: letraValida(o.letra),
    negrito: o.negrito === true,
    alinhar: o.alinhar === 'esquerda' ? 'esquerda' : 'centro',
  };
}

export function normalizarSeta(o) {
  if (!o || typeof o !== 'object') return null;
  if (typeof o.id !== 'string' || !o.id || typeof o.de !== 'string' || typeof o.para !== 'string') return null;
  return {
    id: o.id,
    de: o.de,
    para: o.para,
    texto: textoLimpo(o.texto, ROTULO_MAX).replace(/\n/g, ' '),
    saida: LADOS.includes(o.saida) ? o.saida : 'auto',
    chegada: LADOS.includes(o.chegada) ? o.chegada : 'auto',
  };
}

export function normalizarTitulo(o) {
  const t = o && typeof o === 'object' ? o : {};
  return {
    texto: textoLimpo(t.texto, 10000).replace(/\s*\n\s*/g, ' ').slice(0, TITULO_MAX),
    cor: CORES[t.cor] ? t.cor : 'cinza',
  };
}

function proximoId(doc, prefixo) {
  const usados = new Set([...doc.formas, ...doc.setas].map((i) => i.id));
  let max = 0;
  for (const id of usados) {
    const n = Number(id.slice(prefixo.length));
    if (id.startsWith(prefixo) && Number.isInteger(n) && n > max) max = n;
  }
  let n = max + 1;
  while (usados.has(prefixo + n)) n++;
  return prefixo + n;
}

export function formaPorId(doc, id) {
  return doc.formas.find((f) => f.id === id) || null;
}

export function setaPorId(doc, id) {
  return doc.setas.find((s) => s.id === id) || null;
}

export function sobrepoe(a, b, folga = 0) {
  return a.x < b.x + b.l + folga && b.x < a.x + a.l + folga
    && a.y < b.y + b.a + folga && b.y < a.y + a.a + folga;
}

function centroDaFolha(doc) {
  const f = tamanhoFolha(doc.folha.orientacao);
  return { x: f.largura / 2, y: f.altura / 2 };
}

// Lugar livre (sem encostar em ninguém) para uma forma l×a, o mais perto possível
// do ponto `perto` (o centro desejado). Anda em anéis de 20 px; null = folha cheia.
export function lugarLivre(doc, l, a, perto) {
  const folha = tamanhoFolha(doc.folha.orientacao);
  const base = { x: perto.x - l / 2, y: perto.y - a / 2 };
  const PASSO = 20;
  const livre = (p) => !doc.formas.some((f) => sobrepoe({ ...p, l, a }, f, 10));
  for (let raio = 0; raio <= 60; raio++) {
    for (let i = -raio; i <= raio; i++) {
      for (let j = -raio; j <= raio; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== raio) continue; // só a borda do anel
        const p = limitar({ x: encaixar(base.x + i * PASSO), y: encaixar(base.y + j * PASSO), l, a }, folha);
        if (livre(p)) return { x: p.x, y: p.y };
      }
    }
  }
  return null;
}

// pos: {x, y} do canto, ou null para procurar lugar livre perto de opcoes.perto.
// opcoes.estilo: forma de onde copiar tamanho, cor, borda e letra (o texto nunca).
// Sem lugar livre, a forma nasce POR CIMA das outras, perto do ponto pedido
// (sobreposta: true), em vez de ser recusada: o modelo ocupa a folha quase
// inteira, e "a folha está cheia" confundia quem via espaço na tela.
export function criarForma(doc, tipo, pos, opcoes = {}) {
  const pad = TAMANHO_PADRAO[tipo];
  const estilo = opcoes.estilo || {};
  const l = estilo.l ?? pad.l;
  const a = estilo.a ?? pad.a;
  let p = pos;
  let sobreposta = false;
  if (!p) {
    const perto = opcoes.perto || centroDaFolha(doc);
    p = lugarLivre(doc, l, a, perto);
    if (!p) {
      sobreposta = true;
      p = limitar({ x: encaixar(perto.x - l / 2), y: encaixar(perto.y - a / 2), l, a }, tamanhoFolha(doc.folha.orientacao));
    }
  }
  const id = proximoId(doc, 'f');
  const novo = clonar(doc);
  novo.formas.push(normalizarForma({ ...estilo, id, tipo, x: p.x, y: p.y, l, a, texto: '' }));
  return { doc: novo, id, sobreposta };
}

export function atualizarFormas(doc, ids, mudancas) {
  const alvo = new Set(ids);
  const m = { ...mudancas };
  delete m.id;
  if (m.tipo !== undefined && !TIPOS.includes(m.tipo)) delete m.tipo;
  const novo = clonar(doc);
  novo.formas = novo.formas.map((f) => (alvo.has(f.id) ? normalizarForma({ ...f, ...m }) : f));
  return novo;
}

export function atualizarForma(doc, id, mudancas) {
  return atualizarFormas(doc, [id], mudancas);
}

export function trocarTipo(doc, ids, tipo) {
  return atualizarFormas(doc, ids, { tipo });
}

export function moverFormas(doc, ids, dx, dy) {
  const alvo = new Set(ids);
  const novo = clonar(doc);
  for (const f of novo.formas) {
    if (alvo.has(f.id)) {
      f.x = Math.round(f.x + dx);
      f.y = Math.round(f.y + dy);
    }
  }
  return novo;
}

// Apaga formas e setas pelos ids; uma forma apagada leva junto as setas dela.
export function apagar(doc, ids) {
  const alvo = new Set(ids);
  const novo = clonar(doc);
  novo.formas = novo.formas.filter((f) => !alvo.has(f.id));
  novo.setas = novo.setas.filter((s) => !alvo.has(s.id) && !alvo.has(s.de) && !alvo.has(s.para));
  return novo;
}

// Cópias 20 px para baixo e para a direita; as setas ENTRE as copiadas vêm junto.
export function duplicar(doc, ids) {
  const escolhidas = new Set(ids);
  const folha = tamanhoFolha(doc.folha.orientacao);
  const novo = clonar(doc);
  const mapa = new Map();
  for (const f of doc.formas) {
    if (!escolhidas.has(f.id)) continue;
    const id = proximoId(novo, 'f');
    const p = limitar({ ...f, x: f.x + 20, y: f.y + 20 }, folha);
    novo.formas.push({ ...f, id, x: p.x, y: p.y });
    mapa.set(f.id, id);
  }
  for (const s of doc.setas) {
    if (mapa.has(s.de) && mapa.has(s.para)) {
      novo.setas.push({ ...s, id: proximoId(novo, 's'), de: mapa.get(s.de), para: mapa.get(s.para) });
    }
  }
  return { doc: novo, ids: [...mapa.values()] };
}

// erro: 'mesma' (de = para), 'inexistente' ou 'repetida' (mesma saída e chegada).
export function ligar(doc, de, para) {
  if (de === para) return { doc, id: null, erro: 'mesma' };
  if (!formaPorId(doc, de) || !formaPorId(doc, para)) return { doc, id: null, erro: 'inexistente' };
  if (doc.setas.some((s) => s.de === de && s.para === para)) return { doc, id: null, erro: 'repetida' };
  const novo = clonar(doc);
  const id = proximoId(novo, 's');
  novo.setas.push(normalizarSeta({ id, de, para }));
  return { doc: novo, id };
}

export function atualizarSeta(doc, id, mudancas) {
  const novo = clonar(doc);
  novo.setas = novo.setas.map((s) => (s.id === id
    ? normalizarSeta({ ...s, texto: mudancas.texto ?? s.texto, saida: mudancas.saida ?? s.saida, chegada: mudancas.chegada ?? s.chegada })
    : s));
  return novo;
}

export function inverterSeta(doc, id) {
  const novo = clonar(doc);
  novo.setas = novo.setas.map((s) => (s.id === id
    ? { ...s, de: s.para, para: s.de, saida: s.chegada, chegada: s.saida }
    : s));
  return novo;
}

export function definirTitulo(doc, mudancas) {
  const novo = clonar(doc);
  novo.titulo = normalizarTitulo({ ...doc.titulo, ...mudancas });
  return novo;
}

// Vira a folha e traz para dentro dela o que ficaria de fora.
export function definirOrientacao(doc, orientacao) {
  const novo = clonar(doc);
  novo.folha.orientacao = orientacao === 'paisagem' ? 'paisagem' : 'retrato';
  const folha = tamanhoFolha(novo.folha.orientacao);
  for (const f of novo.formas) Object.assign(f, limitar(f, folha));
  return novo;
}

const PASSO_LADO = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };

// O "+": forma igual à de origem (sem o texto), a DISTANCIA_MAIS px do lado pedido,
// já ligada por seta. Se alguém estiver no caminho, pula para depois dele.
export function criarLigada(doc, idOrigem, lado) {
  const o = formaPorId(doc, idOrigem);
  if (!o || !PASSO_LADO[lado]) return { doc, id: null, erro: 'inexistente' };
  const folha = tamanhoFolha(doc.folha.orientacao);
  const [dx, dy] = PASSO_LADO[lado];
  const { l, a } = o;
  let x = dx === 0 ? o.x : (dx > 0 ? o.x + o.l + DISTANCIA_MAIS : o.x - DISTANCIA_MAIS - l);
  let y = dy === 0 ? o.y : (dy > 0 ? o.y + o.a + DISTANCIA_MAIS : o.y - DISTANCIA_MAIS - a);
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const dentro = x >= MARGEM && y >= MARGEM
      && x + l <= folha.largura - MARGEM && y + a <= folha.altura - MARGEM;
    if (!dentro) return { doc, id: null, erro: 'sem-espaco' };
    const bloqueio = doc.formas.find((f) => sobrepoe({ x, y, l, a }, f, 10));
    if (!bloqueio) {
      const r = criarForma(doc, o.tipo, { x, y }, { estilo: o });
      const lig = ligar(r.doc, idOrigem, r.id);
      return { doc: lig.doc, id: r.id, seta: lig.id };
    }
    if (dx > 0) x = bloqueio.x + bloqueio.l + DISTANCIA_MAIS;
    else if (dx < 0) x = bloqueio.x - DISTANCIA_MAIS - l;
    else if (dy > 0) y = bloqueio.y + bloqueio.a + DISTANCIA_MAIS;
    else y = bloqueio.y - DISTANCIA_MAIS - a;
  }
  return { doc, id: null, erro: 'sem-espaco' };
}
