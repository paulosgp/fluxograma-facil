// Desfazer e refazer por "fotos" do documento (texto JSON). Cada função devolve
// um histórico novo; nada é alterado no lugar.

export function criarHistorico(limite = 100) {
  return { passado: [], futuro: [], limite };
}

// Guarda a foto de ANTES da ação. Ação nova apaga o que dava para refazer.
export function registrar(h, fotoAntes) {
  return { ...h, passado: [...h.passado, fotoAntes].slice(-h.limite), futuro: [] };
}

export function desfazer(h, fotoAtual) {
  if (!h.passado.length) return null;
  const foto = h.passado[h.passado.length - 1];
  return { hist: { ...h, passado: h.passado.slice(0, -1), futuro: [...h.futuro, fotoAtual] }, foto };
}

export function refazer(h, fotoAtual) {
  if (!h.futuro.length) return null;
  const foto = h.futuro[h.futuro.length - 1];
  return { hist: { ...h, passado: [...h.passado, fotoAtual], futuro: h.futuro.slice(0, -1) }, foto };
}

export const podeDesfazer = (h) => h.passado.length > 0;
export const podeRefazer = (h) => h.futuro.length > 0;
