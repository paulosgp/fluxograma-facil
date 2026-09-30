// Geometria das formas, em pixels da folha: onde fica o texto dentro de cada uma,
// quanto de altura um texto pede e onde uma reta encosta no contorno de verdade.

// Área do texto. Losango: faixa central de 60% × 50% — o retângulo inscrito exato
// (50% × 50%) deixava caber só uma palavra curta por linha. Círculo: perto do
// retângulo inscrito na elipse (70,7%).
const AREA = {
  retangulo: { px: 10, py: 8 },
  arredondado: { px: 12, py: 8 },
  texto: { px: 4, py: 4 },
  losango: { fl: 0.6, fa: 0.5 },
  circulo: { fl: 0.72, fa: 0.7 },
};

// Caixa do texto relativa ao canto da forma.
export function caixaDoTexto(f) {
  const ar = AREA[f.tipo] || AREA.retangulo;
  if (ar.fl) {
    const l = f.l * ar.fl;
    const a = f.a * ar.fa;
    return { x: (f.l - l) / 2, y: (f.a - a) / 2, l, a };
  }
  return { x: ar.px, y: ar.py, l: Math.max(0, f.l - 2 * ar.px), a: Math.max(0, f.a - 2 * ar.py) };
}

// Altura mínima da forma para caber um texto de `alturaTexto` px.
export function alturaNecessaria(f, alturaTexto) {
  const ar = AREA[f.tipo] || AREA.retangulo;
  if (ar.fl) return Math.ceil(alturaTexto / ar.fa);
  return Math.ceil(alturaTexto + 2 * ar.py);
}

// Distância do centro até o contorno, na vertical, numa coluna x.
function meiaAltura(f, x) {
  const w2 = f.l / 2;
  const h2 = f.a / 2;
  const u = Math.min(Math.abs(x - (f.x + w2)), w2);
  if (f.tipo === 'losango') return h2 * (1 - u / w2);
  if (f.tipo === 'circulo') return h2 * Math.sqrt(Math.max(0, 1 - (u / w2) ** 2));
  return h2;
}

// Distância do centro até o contorno, na horizontal, numa linha y.
function meiaLargura(f, y) {
  const w2 = f.l / 2;
  const h2 = f.a / 2;
  const v = Math.min(Math.abs(y - (f.y + h2)), h2);
  if (f.tipo === 'losango') return w2 * (1 - v / h2);
  if (f.tipo === 'circulo') return w2 * Math.sqrt(Math.max(0, 1 - (v / h2) ** 2));
  return w2;
}

// Ponto em que uma reta perpendicular ao `lado`, passando pela coordenada `c`
// (x para cima/baixo, y para esquerda/direita), encosta no contorno.
// Sem `c`, é o meio do lado — no losango, o próprio vértice.
export function pontoNaBorda(f, lado, c) {
  const cx = f.x + f.l / 2;
  const cy = f.y + f.a / 2;
  if (lado === 'cima' || lado === 'baixo') {
    const x = c ?? cx;
    const d = meiaAltura(f, x);
    return [x, lado === 'cima' ? cy - d : cy + d];
  }
  const y = c ?? cy;
  const d = meiaLargura(f, y);
  return [lado === 'esquerda' ? cx - d : cx + d, y];
}

// Contorno em SVG no sistema da própria forma (0,0 no canto). O traço fica 1 px
// para dentro para não ser cortado pela borda do <svg>. O tipo "texto" não tem.
export function contorno(f) {
  const i = 1;
  const { l, a } = f;
  switch (f.tipo) {
    case 'losango':
      return { tag: 'polygon', attrs: { points: `${l / 2},${i} ${l - i},${a / 2} ${l / 2},${a - i} ${i},${a / 2}` } };
    case 'circulo':
      return { tag: 'ellipse', attrs: { cx: l / 2, cy: a / 2, rx: l / 2 - i, ry: a / 2 - i } };
    case 'arredondado': {
      const r = Math.min(14, a / 4, l / 4);
      return { tag: 'rect', attrs: { x: i, y: i, width: l - 2 * i, height: a - 2 * i, rx: r, ry: r } };
    }
    case 'texto':
      return null;
    default:
      return { tag: 'rect', attrs: { x: i, y: i, width: l - 2 * i, height: a - 2 * i } };
  }
}
