// Os dois começos possíveis. O modelo repete a estrutura da página 1 do fluxo de
// Curitiba (o exemplo que a Regional deu) SEM NENHUM TEXTO além do título: foi a
// decisão do Paulo — quem escreve o conteúdo é cada município.
import { documentoVazio, normalizarForma, normalizarSeta } from './modelo.js';

const forma = (id, tipo, x, y, l, a, cor, extra = {}) =>
  normalizarForma({ id, tipo, x, y, l, a, cor, ...extra });

export function modeloDengue() {
  const doc = documentoVazio();
  doc.titulo = { texto: 'Fluxo de atendimento – Dengue', cor: 'rosa' };
  const lista = { alinhar: 'esquerda' };
  const lateral = { borda: 'tracejada', alinhar: 'esquerda' };
  doc.formas = [
    forma('f1', 'arredondado', 150, 100, 500, 50, 'branco'),
    // coluna do meio: as perguntas
    forma('f2', 'losango', 250, 190, 160, 110, 'branco'),
    forma('f3', 'losango', 250, 340, 160, 110, 'vermelho'),
    forma('f4', 'losango', 250, 490, 160, 110, 'amarelo'),
    forma('f5', 'losango', 250, 640, 160, 110, 'branco'),
    forma('f6', 'losango', 250, 790, 160, 110, 'verde'),
    forma('f7', 'arredondado', 250, 940, 514, 150, 'azul', lista),
    // coluna da direita: para onde vai cada resposta
    forma('f8', 'arredondado', 450, 220, 314, 50, 'branco'),
    forma('f9', 'arredondado', 450, 320, 314, 150, 'vermelho', lista),
    forma('f10', 'arredondado', 450, 490, 314, 120, 'amarelo', lista),
    forma('f11', 'arredondado', 450, 630, 314, 280, 'verde', lista),
    // coluna da esquerda: os quadros de apoio
    forma('f12', 'arredondado', 30, 190, 200, 220, 'branco', lateral),
    forma('f13', 'arredondado', 30, 430, 200, 220, 'vermelho', lateral),
    forma('f14', 'arredondado', 30, 670, 200, 200, 'amarelo', lateral),
    forma('f15', 'arredondado', 30, 890, 200, 200, 'verde', lateral),
  ];
  const ligacoes = [
    ['f1', 'f2'], ['f2', 'f3'], ['f3', 'f4'], ['f4', 'f5'], ['f5', 'f6'], ['f6', 'f7'],
    ['f2', 'f8'], ['f3', 'f9'], ['f4', 'f10'], ['f5', 'f11'], ['f6', 'f11'],
  ];
  doc.setas = ligacoes.map(([de, para], i) => normalizarSeta({ id: `s${i + 1}`, de, para }));
  return doc;
}

export function folhaVazia() {
  return documentoVazio();
}
