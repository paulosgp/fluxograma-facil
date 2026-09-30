// Estado da tela: o documento, o que está escolhido e o histórico de desfazer.
// Não mexe na página: quem desenha ouve os avisos (ouvir) e redesenha.
import {
  criarHistorico, registrar, desfazer as voltar, refazer as avancar, podeDesfazer, podeRefazer,
} from './historico.js';

const semSelecao = () => ({ formas: [], seta: null, titulo: false });

export function criarLoja(docInicial) {
  let doc = docInicial;
  let hist = criarHistorico(100);
  let selecao = semSelecao();
  let fotoLote = null;
  const ouvintes = new Set();
  const avisar = (motivo) => { for (const f of [...ouvintes]) f(motivo); };

  // Tira da seleção o que não existe mais no documento.
  function podarSelecao() {
    const ids = new Set(doc.formas.map((f) => f.id));
    const formas = selecao.formas.filter((id) => ids.has(id));
    const seta = selecao.seta && doc.setas.some((s) => s.id === selecao.seta) ? selecao.seta : null;
    if (formas.length !== selecao.formas.length || seta !== selecao.seta) selecao = { ...selecao, formas, seta };
  }

  const loja = {
    get doc() { return doc; },
    get selecao() { return selecao; },
    get emLote() { return fotoLote !== null; },
    podeDesfazer: () => podeDesfazer(hist) || fotoLote !== null,
    podeRefazer: () => podeRefazer(hist),

    ouvir(f) {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },

    comecar() {
      if (fotoLote === null) fotoLote = JSON.stringify(doc);
    },
    confirmar() {
      if (fotoLote === null) return;
      if (fotoLote !== JSON.stringify(doc)) hist = registrar(hist, fotoLote);
      fotoLote = null;
      avisar('historico');
    },
    // Troca o documento dentro do lote aberto (ou sem registrar, se não houver lote).
    trocar(novo, motivo = 'doc') {
      doc = novo;
      podarSelecao();
      avisar(motivo);
    },
    // Uma mudança inteira: um passo de desfazer.
    aplicar(novo, motivo = 'doc') {
      loja.comecar();
      loja.trocar(novo, motivo);
      loja.confirmar();
    },

    desfazer() {
      loja.confirmar();
      const r = voltar(hist, JSON.stringify(doc));
      if (!r) return false;
      hist = r.hist;
      doc = JSON.parse(r.foto);
      podarSelecao();
      avisar('desfazer');
      return true;
    },
    refazer() {
      loja.confirmar();
      const r = avancar(hist, JSON.stringify(doc));
      if (!r) return false;
      hist = r.hist;
      doc = JSON.parse(r.foto);
      podarSelecao();
      avisar('refazer');
      return true;
    },

    selecionar(sel = {}) {
      selecao = { formas: [...(sel.formas || [])], seta: sel.seta || null, titulo: !!sel.titulo };
      podarSelecao();
      avisar('selecao');
    },

    // Outro documento inteiro (começar outro, abrir arquivo). Dá para desfazer,
    // menos quando não havia nada antes: logo depois de "Começar com o modelo",
    // o Desfazer levaria de volta a uma folha vazia que a pessoa nunca viu.
    carregar(novo, { desfazivel = true } = {}) {
      loja.confirmar();
      selecao = semSelecao();
      if (desfazivel) {
        loja.aplicar(novo, 'carregar');
        return;
      }
      doc = novo;
      hist = criarHistorico(100);
      avisar('carregar');
    },
  };
  return loja;
}
