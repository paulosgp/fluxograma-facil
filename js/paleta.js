// Constantes do desenho: cores, tipos de forma, tamanhos da folha e limites.
// As cores são guardadas no documento pelo NOME, nunca pelo código: assim dá
// para ajustar um tom aqui sem estragar arquivo salvo.

export const CORES = {
  branco:   { nome: 'Branco',   fundo: '#FFFFFF', borda: '#5F6368' },
  cinza:    { nome: 'Cinza',    fundo: '#ECEFF1', borda: '#78909C' },
  azul:     { nome: 'Azul',     fundo: '#D6E6F7', borda: '#3B78B8' },
  verde:    { nome: 'Verde',    fundo: '#D9EDCC', borda: '#4E8F2F' },
  amarelo:  { nome: 'Amarelo',  fundo: '#FFF1BF', borda: '#C79A00' },
  laranja:  { nome: 'Laranja',  fundo: '#FDDCBE', borda: '#D9772B' },
  vermelho: { nome: 'Vermelho', fundo: '#F9CFCF', borda: '#C43D3D' },
  rosa:     { nome: 'Rosa',     fundo: '#F8D3E1', borda: '#C2507A' },
  roxo:     { nome: 'Roxo',     fundo: '#E2DAF5', borda: '#7453C0' },
};
export const ORDEM_CORES = ['branco', 'cinza', 'azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'rosa', 'roxo'];

export const TIPOS = ['retangulo', 'arredondado', 'losango', 'circulo', 'texto'];
export const NOMES_TIPOS = {
  retangulo: 'Retângulo', arredondado: 'Arredondado', losango: 'Losango', circulo: 'Círculo', texto: 'Texto',
};
// O losango e o círculo nascem maiores que no desenho (150×100 e 100×100): a área
// útil de texto deles é bem menor que a forma, e 150 px de largura só cabia uma
// palavra curta por linha.
export const TAMANHO_PADRAO = {
  retangulo: { l: 180, a: 70 },
  arredondado: { l: 180, a: 70 },
  losango: { l: 180, a: 120 },
  circulo: { l: 110, a: 110 },
  texto: { l: 180, a: 40 },
};

// A4 a 96 dpi, em pixels de CSS.
export const FOLHA = { retrato: { largura: 794, altura: 1123 }, paisagem: { largura: 1123, altura: 794 } };
export const MARGEM = 30;          // ~8 mm: nenhuma forma passa daqui
export const GRADE = 10;
export const LETRA = { min: 10, max: 28, passo: 2, padrao: 14 };
export const TAM_MIN = { l: 40, a: 30 };
export const TEXTO_MAX = 2000;
export const TITULO_MAX = 120;
export const ROTULO_MAX = 30;
export const DISTANCIA_MAIS = 50;  // vão entre a forma e a criada pelo "+"
export const LADOS = ['cima', 'baixo', 'esquerda', 'direita'];

export function tamanhoFolha(orientacao) {
  return FOLHA[orientacao] || FOLHA.retrato;
}
