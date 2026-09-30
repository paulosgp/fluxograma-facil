// Caminho das setas: sempre em ângulo reto, e reta sempre que as duas formas
// "se enxergam" (como as setas do fluxo de Curitiba, que saem do vértice do
// losango direto para a caixa ao lado). Não desvia de outras formas: para isso
// existe o "Ajustar caminho" no painel.
import { pontoNaBorda } from './geometria.js';

const DIRECAO = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };
const TOCO = 20;              // quanto a seta anda para fora antes de dobrar
const SOBREPOSICAO_MIN = 20;  // menos que isso, a reta ficaria raspando a quina
const FOLGA_CANTO = 12;       // a reta não encosta a menos disso de um canto
const DIST_ROTULO = 22;

function caixa(f) {
  return { esq: f.x, dir: f.x + f.l, topo: f.y, base: f.y + f.a, cx: f.x + f.l / 2, cy: f.y + f.a / 2 };
}

// Por onde sai e por onde chega, quando ninguém escolheu: vence o eixo com o
// maior vão entre as caixas; se elas se sobrepõem, a diferença entre os centros.
export function ladosAutomaticos(A, B) {
  const a = caixa(A);
  const b = caixa(B);
  const vaoBaixo = b.topo - a.base;
  const vaoCima = a.topo - b.base;
  const vaoDir = b.esq - a.dir;
  const vaoEsq = a.esq - b.dir;
  const vertical = Math.max(vaoBaixo, vaoCima);
  const horizontal = Math.max(vaoDir, vaoEsq);
  if (vertical >= 0 || horizontal >= 0) {
    if (vertical >= horizontal) return vaoBaixo >= vaoCima ? ['baixo', 'cima'] : ['cima', 'baixo'];
    return vaoDir >= vaoEsq ? ['direita', 'esquerda'] : ['esquerda', 'direita'];
  }
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? ['baixo', 'cima'] : ['cima', 'baixo'];
  return dx >= 0 ? ['direita', 'esquerda'] : ['esquerda', 'direita'];
}

// Coordenada da reta dentro da faixa comum [ini, fim]: o centro da forma de
// saída se couber (sai do vértice do losango), senão o da chegada, senão o meio.
function coordenadaReta(ini, fim, cA, cB) {
  const lo = ini + FOLGA_CANTO;
  const hi = fim - FOLGA_CANTO;
  if (lo > hi) return (ini + fim) / 2;
  if (cA >= lo && cA <= hi) return cA;
  if (cB >= lo && cB <= hi) return cB;
  return (lo + hi) / 2;
}

// Losango e círculo só aceitam a reta perto do meio do lado (a um quarto da
// medida, no máximo): mais longe, ela encostaria na aresta inclinada ou na curva,
// e a seta pareceria sair "de lado". Aí vale a dobra saindo do vértice.
function retaBoaPara(f, lado, c) {
  if (f.tipo !== 'losango' && f.tipo !== 'circulo') return true;
  if (lado === 'cima' || lado === 'baixo') return Math.abs(c - (f.x + f.l / 2)) <= f.l / 4;
  return Math.abs(c - (f.y + f.a / 2)) <= f.a / 4;
}

const trocar = ([x, y]) => [y, x];

// Os dois lados no mesmo eixo (horizontal).
function rotaParalela(p0, d0, p3, d3) {
  if (d0[0] === -d3[0]) {
    if ((p3[0] - p0[0]) * d0[0] > 0) {
      const mx = (p0[0] + p3[0]) / 2;
      return [p0, [mx, p0[1]], [mx, p3[1]], p3];
    }
    const p1 = [p0[0] + d0[0] * TOCO, p0[1]];
    const p2 = [p3[0] + d3[0] * TOCO, p3[1]];
    const my = (p0[1] + p3[1]) / 2;
    return [p0, p1, [p1[0], my], [p2[0], my], p2, p3];
  }
  const mx = d0[0] > 0 ? Math.max(p0[0], p3[0]) + TOCO : Math.min(p0[0], p3[0]) - TOCO;
  return [p0, [mx, p0[1]], [mx, p3[1]], p3];
}

// Um lado horizontal e o outro vertical: uma dobra, se ela anda no sentido da
// saída e chega no sentido certo; senão, sai um toco de cada lado e liga.
function rotaPerpendicular(p0, d0, p3, d3) {
  const canto = d0[0] !== 0 ? [p3[0], p0[1]] : [p0[0], p3[1]];
  const segue = (canto[0] - p0[0]) * d0[0] + (canto[1] - p0[1]) * d0[1] > 0;
  const entra = (p3[0] - canto[0]) * -d3[0] + (p3[1] - canto[1]) * -d3[1] > 0;
  if (segue && entra) return [p0, canto, p3];
  const p1 = [p0[0] + d0[0] * TOCO, p0[1] + d0[1] * TOCO];
  const p2 = [p3[0] + d3[0] * TOCO, p3[1] + d3[1] * TOCO];
  const meio = d0[0] !== 0 ? [p1[0], p2[1]] : [p2[0], p1[1]];
  return [p0, p1, meio, p2, p3];
}

function rota(p0, ladoSaida, p3, ladoChegada) {
  const d0 = DIRECAO[ladoSaida];
  const d3 = DIRECAO[ladoChegada];
  const h0 = d0[0] !== 0;
  const h3 = d3[0] !== 0;
  if (h0 !== h3) return rotaPerpendicular(p0, d0, p3, d3);
  if (h0) return rotaParalela(p0, d0, p3, d3);
  return rotaParalela(trocar(p0), trocar(d0), trocar(p3), trocar(d3)).map(trocar);
}

// Arredonda a 0,1 px, tira pontos repetidos e pontos no meio de um trecho reto.
function limpar(pts) {
  const r = [];
  for (const p of pts) {
    const q = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
    const u = r[r.length - 1];
    if (u && u[0] === q[0] && u[1] === q[1]) continue;
    r.push(q);
  }
  for (let i = r.length - 2; i >= 1; i--) {
    const [a, b, c] = [r[i - 1], r[i], r[i + 1]];
    if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) r.splice(i, 1);
  }
  return r;
}

// Ponto a `dist` px do início, andando pelo caminho; caminho curto → o meio.
function pontoAoLongo(pts, dist) {
  const trechos = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const c = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    trechos.push(c);
    total += c;
  }
  let alvo = total < dist * 2 ? total / 2 : dist;
  for (let i = 1; i < pts.length; i++) {
    const c = trechos[i - 1];
    if (alvo <= c && c > 0) {
      const t = alvo / c;
      return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t };
    }
    alvo -= c;
  }
  const u = pts[pts.length - 1];
  return { x: u[0], y: u[1] };
}

// origem/destino: formas {x, y, l, a, tipo}. opcoes: { saida, chegada } = lado ou 'auto'.
export function tracarSeta(origem, destino, opcoes = {}) {
  const [autoS, autoC] = ladosAutomaticos(origem, destino);
  const saida = opcoes.saida && opcoes.saida !== 'auto' ? opcoes.saida : autoS;
  const chegada = opcoes.chegada && opcoes.chegada !== 'auto' ? opcoes.chegada : autoC;
  const a = caixa(origem);
  const b = caixa(destino);
  let pontos = null;
  const vertical = (saida === 'baixo' && chegada === 'cima' && b.topo >= a.base)
    || (saida === 'cima' && chegada === 'baixo' && b.base <= a.topo);
  const horizontal = (saida === 'direita' && chegada === 'esquerda' && b.esq >= a.dir)
    || (saida === 'esquerda' && chegada === 'direita' && b.dir <= a.esq);
  if (vertical) {
    const ini = Math.max(a.esq, b.esq);
    const fim = Math.min(a.dir, b.dir);
    if (fim - ini >= SOBREPOSICAO_MIN) {
      const x = coordenadaReta(ini, fim, a.cx, b.cx);
      if (retaBoaPara(origem, saida, x) && retaBoaPara(destino, chegada, x)) {
        pontos = [pontoNaBorda(origem, saida, x), pontoNaBorda(destino, chegada, x)];
      }
    }
  } else if (horizontal) {
    const ini = Math.max(a.topo, b.topo);
    const fim = Math.min(a.base, b.base);
    if (fim - ini >= SOBREPOSICAO_MIN) {
      const y = coordenadaReta(ini, fim, a.cy, b.cy);
      if (retaBoaPara(origem, saida, y) && retaBoaPara(destino, chegada, y)) {
        pontos = [pontoNaBorda(origem, saida, y), pontoNaBorda(destino, chegada, y)];
      }
    }
  }
  if (!pontos) pontos = rota(pontoNaBorda(origem, saida), saida, pontoNaBorda(destino, chegada), chegada);
  pontos = limpar(pontos);
  return { pontos, rotulo: pontoAoLongo(pontos, DIST_ROTULO) };
}

export function caminhoSvg(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
}

// Recua o fim do caminho em `n` px, para a ponta da seta (desenhada à frente)
// terminar exatamente no contorno, sem a ponta cega do traço aparecer.
export function encurtarFim(pts, n) {
  const r = pts.map((p) => [...p]);
  const a = r[r.length - 2];
  const b = r[r.length - 1];
  const c = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (c <= n) return r;
  b[0] -= ((b[0] - a[0]) / c) * n;
  b[1] -= ((b[1] - a[1]) / c) * n;
  return r;
}
