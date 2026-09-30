// Encaixe: é o que deixa o desenho arrumado sem a pessoa se esforçar.
// Grade de 10 px, linhas-guia com as vizinhas e a margem de segurança da folha.
import { GRADE, MARGEM } from './paleta.js';

export function encaixar(v, passo = GRADE) {
  return Math.round(v / passo) * passo;
}

// Traz o retângulo para dentro da área útil da folha.
export function limitar(r, folha, margem = MARGEM) {
  const maxX = Math.max(margem, folha.largura - margem - r.l);
  const maxY = Math.max(margem, folha.altura - margem - r.a);
  return { x: Math.min(Math.max(r.x, margem), maxX), y: Math.min(Math.max(r.y, margem), maxY) };
}

// Pares de referência que grudam: esquerda↔esquerda, centro↔centro,
// direita↔direita, e bordas encostadas (esquerda↔direita e direita↔esquerda).
const PARES = [[0, 0], [1, 1], [2, 2], [0, 2], [2, 0]];
const refX = (r) => [r.x, r.x + r.l / 2, r.x + r.l];
const refY = (r) => [r.y, r.y + r.a / 2, r.y + r.a];

// Quanto falta para o retângulo que se move grudar na referência mais próxima
// (até `tol` px). dx/dy = null quando nada está perto.
export function guias(mov, outras, tol = 6) {
  let bx = null;
  let by = null;
  const mx = refX(mov);
  const my = refY(mov);
  for (const o of outras) {
    const ox = refX(o);
    const oy = refY(o);
    for (const [i, j] of PARES) {
      const d = ox[j] - mx[i];
      if (Math.abs(d) <= tol && (!bx || Math.abs(d) < Math.abs(bx.d))) bx = { d, x: ox[j], o };
      const e = oy[j] - my[i];
      if (Math.abs(e) <= tol && (!by || Math.abs(e) < Math.abs(by.d))) by = { d: e, y: oy[j], o };
    }
  }
  const linhas = [];
  if (bx) {
    const y = mov.y + (by ? by.d : 0);
    linhas.push({ x1: bx.x, y1: Math.min(y, bx.o.y), x2: bx.x, y2: Math.max(y + mov.a, bx.o.y + bx.o.a) });
  }
  if (by) {
    const x = mov.x + (bx ? bx.d : 0);
    linhas.push({ x1: Math.min(x, by.o.x), y1: by.y, x2: Math.max(x + mov.l, by.o.x + by.o.l), y2: by.y });
  }
  return { dx: bx ? bx.d : null, dy: by ? by.d : null, linhas };
}

// Posição final de algo sendo arrastado: a guia vence a grade; por último,
// o limite da folha.
export function posicionar(mov, outras, folha) {
  const g = guias(mov, outras);
  const x = g.dx !== null ? mov.x + g.dx : encaixar(mov.x);
  const y = g.dy !== null ? mov.y + g.dy : encaixar(mov.y);
  const p = limitar({ ...mov, x, y }, folha);
  return { x: p.x, y: p.y, linhas: g.linhas };
}
