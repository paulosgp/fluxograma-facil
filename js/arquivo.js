// O documento fora da tela: validar e consertar o que vem de fora, o nome do
// arquivo, guardar no navegador, baixar e ler arquivo. As funções de navegador
// só tocam em localStorage/document/Blob quando chamadas, então o módulo carrega
// no Node para os testes.
import { APP, VERSAO, normalizarForma, normalizarSeta, normalizarTitulo } from './modelo.js';
import { limitar } from './encaixe.js';
import { tamanhoFolha } from './paleta.js';

export const CHAVE = 'fluxograma-facil:documento';
const INVALIDO = 'Este arquivo não é de um fluxograma feito aqui.';
const MAIS_NOVO = 'Este arquivo foi feito numa versão mais nova do Fluxograma Fácil. Atualize a página e tente de novo.';

// Aceita o que dá para aproveitar e descarta o resto; recusa só o que nem é
// fluxograma daqui. Ids são únicos entre formas e setas.
export function validarDocumento(o) {
  if (!o || typeof o !== 'object' || o.app !== APP) return { ok: false, erro: INVALIDO };
  if (typeof o.versao === 'number' && o.versao > VERSAO) return { ok: false, erro: MAIS_NOVO };
  if (o.versao !== VERSAO) return { ok: false, erro: INVALIDO };
  const orientacao = o.folha && o.folha.orientacao === 'paisagem' ? 'paisagem' : 'retrato';
  const folha = tamanhoFolha(orientacao);
  const ids = new Set();
  const formas = [];
  for (const bruto of Array.isArray(o.formas) ? o.formas : []) {
    const f = normalizarForma(bruto);
    if (!f || ids.has(f.id)) continue;
    Object.assign(f, limitar(f, folha));
    ids.add(f.id);
    formas.push(f);
  }
  const idsFormas = new Set(ids);
  const pares = new Set();
  const setas = [];
  for (const bruto of Array.isArray(o.setas) ? o.setas : []) {
    const s = normalizarSeta(bruto);
    if (!s || ids.has(s.id) || !idsFormas.has(s.de) || !idsFormas.has(s.para) || s.de === s.para) continue;
    const par = `${s.de}>${s.para}`;
    if (pares.has(par)) continue;
    pares.add(par);
    ids.add(s.id);
    setas.push(s);
  }
  return {
    ok: true,
    doc: { app: APP, versao: VERSAO, titulo: normalizarTitulo(o.titulo), folha: { orientacao }, formas, setas },
  };
}

export function lerJson(texto) {
  try {
    return validarDocumento(JSON.parse(texto));
  } catch {
    return { ok: false, erro: INVALIDO };
  }
}

export function serializar(doc) {
  return JSON.stringify(doc, null, 2);
}

// "Fluxograma - <título>.json", sem o que o Windows proíbe em nome de arquivo.
export function nomeDoArquivo(titulo) {
  const limpo = String(titulo || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .replace(/[. ]+$/, '');
  return limpo ? `Fluxograma - ${limpo}.json` : 'Fluxograma.json';
}

// ---- Só no navegador ----

export function guardarNoNavegador(doc) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(doc));
    return true;
  } catch {
    return false;
  }
}

export function lerDoNavegador() {
  try {
    const t = localStorage.getItem(CHAVE);
    if (!t) return null;
    const r = lerJson(t);
    return r.ok ? r.doc : null;
  } catch {
    return null;
  }
}

// Baixa o arquivo e devolve o nome que ele recebeu.
export function baixarArquivo(doc) {
  const blob = new Blob([serializar(doc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeDoArquivo(doc.titulo.texto);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return a.download;
}

export async function lerArquivo(arquivo) {
  if (!arquivo || arquivo.size > 5_000_000) return { ok: false, erro: INVALIDO };
  try {
    return lerJson(await arquivo.text());
  } catch {
    return { ok: false, erro: 'Não deu para ler este arquivo.' };
  }
}
