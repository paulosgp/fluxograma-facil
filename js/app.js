// Liga tudo: barra do alto, paleta, tela inicial, diálogos, guardado automático e
// impressão. A cada mudança na loja (ou no estado da tela), redesenha tudo.
import { criarLoja } from './loja.js';
import { criarDesenho } from './desenho.js';
import { criarInteracao } from './interacao.js';
import { criarPainel } from './painel.js';
import { modeloDengue, folhaVazia } from './modelos.js';
import { definirOrientacao } from './modelo.js';
import { guardarNoNavegador, lerDoNavegador, baixarArquivo, lerArquivo } from './arquivo.js';

const $ = (id) => document.getElementById(id);
const el = {
  palco: $('palco'), caixa: $('folha-caixa'), folha: $('folha'), setas: $('camada-setas'),
  formas: $('camada-formas'), rotulos: $('camada-rotulos'), controles: $('camada-controles'),
  titulo: $('titulo'), tituloTexto: $('titulo-texto'),
};

const guardado = lerDoNavegador();
const loja = criarLoja(guardado || folhaVazia());

// ---------- Avisos e faixa do modo seta ----------
let relogioAviso = null;
function avisar(msg) {
  const a = $('aviso');
  a.textContent = msg;
  a.hidden = false;
  clearTimeout(relogioAviso);
  relogioAviso = setTimeout(() => { a.hidden = true; }, 7000);
}
const faixa = {
  mostrar(texto) { $('faixa-texto').textContent = texto; $('faixa').hidden = false; },
  esconder() { $('faixa').hidden = true; },
};

// ---------- Diálogo ----------
let fecharDialogo = null;
const dialogoAberto = () => !$('dialogo').hidden || !$('inicio').hidden;

function dialogo({ titulo, corpo, botoes }) {
  return new Promise((resolve) => {
    $('dialogo-titulo').textContent = titulo;
    $('dialogo-corpo').innerHTML = corpo;
    const caixa = $('dialogo-botoes');
    caixa.replaceChildren();
    const fechar = (valor) => {
      $('dialogo').hidden = true;
      fecharDialogo = null;
      resolve(valor);
    };
    for (const b of botoes) {
      const n = document.createElement('button');
      n.type = 'button';
      n.className = b.destaque ? 'bt bt-destaque' : 'bt';
      n.textContent = b.rotulo;
      n.addEventListener('click', () => fechar(b.valor));
      caixa.appendChild(n);
    }
    fecharDialogo = fechar;
    $('dialogo').hidden = false;
    (caixa.querySelector('.bt-destaque') || caixa.lastElementChild).focus();
  });
}

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && fecharDialogo) fecharDialogo('cancelar');
  else if (ev.key === 'Escape' && !$('inicio').hidden && !$('ini-voltar').hidden) fecharInicio();
});

// ---------- Desenho, interação e painel ----------
const desenho = criarDesenho(el);
let interacao = null;
let painel = null;
let orientacaoPagina = '';

function redesenhar() {
  const tela = interacao ? interacao.estadoTela() : { guias: [], laco: null, modoSeta: null };
  desenho.tudo(loja.doc, { selecao: loja.selecao, ...tela });
  if (painel) painel.atualizar();
  $('bt-desfazer').disabled = !loja.podeDesfazer();
  $('bt-refazer').disabled = !loja.podeRefazer();
  $('bt-seta').classList.toggle('ativo', !!tela.modoSeta);
  const deitada = loja.doc.folha.orientacao === 'paisagem';
  $('bt-folha-texto').textContent = deitada ? 'Pôr a folha em pé' : 'Deitar a folha';
  if (orientacaoPagina !== loja.doc.folha.orientacao) {
    orientacaoPagina = loja.doc.folha.orientacao;
    $('estilo-pagina').textContent = `@page { size: A4 ${deitada ? 'landscape' : 'portrait'}; margin: 0; }`;
  }
}

interacao = criarInteracao({ loja, desenho, el, avisar, faixa, redesenhar, dialogoAberto });
painel = criarPainel({ loja, el: $('painel'), interacao, avisar });

// ---------- Guardado automático ----------
let relogioGuardar = null;
function guardar() {
  clearTimeout(relogioGuardar);
  const ok = guardarNoNavegador(loja.doc);
  const s = $('status');
  s.classList.toggle('ruim', !ok);
  s.textContent = ok ? '✓ Guardado neste computador' : 'Não deu para guardar neste navegador. Use "Salvar no computador".';
}
loja.ouvir((motivo) => {
  redesenhar();
  if (motivo !== 'selecao') {
    clearTimeout(relogioGuardar);
    relogioGuardar = setTimeout(guardar, 400);
  }
});
window.addEventListener('beforeunload', guardar);

// ---------- Trocar de documento ----------
const temConteudo = (d) => d.formas.length > 0 || d.titulo.texto !== '';

async function perguntarAntesDeTrocar() {
  if (!temConteudo(loja.doc)) return 'continuar';
  const r = await dialogo({
    titulo: 'Trocar de fluxograma',
    corpo: '<p>O fluxograma atual vai ser trocado. Quer salvar ele no computador antes?</p>',
    botoes: [
      { rotulo: 'Cancelar', valor: 'cancelar' },
      { rotulo: 'Continuar sem salvar', valor: 'continuar' },
      { rotulo: 'Salvar e continuar', valor: 'salvar', destaque: true },
    ],
  });
  if (r === 'salvar') salvarArquivo();
  return r;
}

function salvarArquivo() {
  interacao.terminarEdicao();
  const nome = baixarArquivo(loja.doc);
  avisar(`Arquivo salvo na pasta Downloads com o nome "${nome}". Para continuar depois, use o botão Abrir.`);
}

async function abrirArquivo(arquivo) {
  const r = await lerArquivo(arquivo);
  if (!r.ok) { avisar(r.erro); return; }
  interacao.terminarEdicao();
  interacao.sairModoSeta();
  loja.carregar(r.doc);
  fecharInicio();
}

function mostrarInicio(podeVoltar) {
  interacao.terminarEdicao();
  interacao.sairModoSeta();
  $('ini-voltar').hidden = !podeVoltar;
  $('inicio').hidden = false;
  $('ini-modelo').focus();
}
function fecharInicio() { $('inicio').hidden = true; }

$('ini-modelo').addEventListener('click', () => { loja.carregar(modeloDengue()); fecharInicio(); });
$('ini-vazia').addEventListener('click', () => { loja.carregar(folhaVazia()); fecharInicio(); });
$('ini-abrir').addEventListener('click', () => $('entrada-arquivo').click());
$('ini-voltar').addEventListener('click', fecharInicio);

$('entrada-arquivo').addEventListener('change', (ev) => {
  const arquivo = ev.target.files[0];
  ev.target.value = '';
  if (arquivo) abrirArquivo(arquivo);
});

window.addEventListener('dragover', (ev) => {
  if (ev.dataTransfer && [...ev.dataTransfer.types].includes('Files')) ev.preventDefault();
});
window.addEventListener('drop', async (ev) => {
  const arquivo = ev.dataTransfer && ev.dataTransfer.files[0];
  if (!arquivo) return;
  ev.preventDefault();
  if (!$('inicio').hidden) { abrirArquivo(arquivo); return; }
  if ((await perguntarAntesDeTrocar()) !== 'cancelar') abrirArquivo(arquivo);
});

// ---------- Barra do alto ----------
$('bt-desfazer').addEventListener('click', () => { interacao.terminarEdicao(); loja.desfazer(); });
$('bt-refazer').addEventListener('click', () => { interacao.terminarEdicao(); loja.refazer(); });
$('bt-salvar').addEventListener('click', salvarArquivo);
$('bt-abrir').addEventListener('click', async () => {
  if ((await perguntarAntesDeTrocar()) !== 'cancelar') $('entrada-arquivo').click();
});
$('bt-novo').addEventListener('click', async () => {
  if ((await perguntarAntesDeTrocar()) !== 'cancelar') mostrarInicio(true);
});
$('bt-imprimir').addEventListener('click', async () => {
  const r = await dialogo({
    titulo: 'Imprimir ou salvar em PDF',
    corpo: `<p>Na janela que vai abrir:</p><ol>
      <li>Para <strong>papel</strong>: escolha a impressora e clique em Imprimir.</li>
      <li>Para <strong>arquivo PDF</strong>: em <strong>Destino</strong>, escolha <strong>Salvar como PDF</strong>.</li></ol>`,
    botoes: [{ rotulo: 'Cancelar', valor: 'cancelar' }, { rotulo: 'Continuar', valor: 'ok', destaque: true }],
  });
  if (r !== 'ok') return;
  interacao.terminarEdicao();
  interacao.sairModoSeta();
  loja.selecionar({});
  setTimeout(() => window.print(), 50);
});
$('bt-ajuda').addEventListener('click', () => dialogo({
  titulo: 'Como usar',
  corpo: `<ol>
    <li><strong>Escrever:</strong> clique numa forma e digite. Para terminar, clique fora dela.</li>
    <li><strong>Mover:</strong> aperte o botão do mouse em cima da forma e arraste.</li>
    <li><strong>Forma nova:</strong> use os botões da esquerda (Retângulo, Losango...).</li>
    <li><strong>Ligar formas:</strong> clique numa forma e depois no <strong>+</strong> azul: nasce outra forma, já ligada por seta. Ou use o botão <strong>Seta</strong>: clique na forma de onde ela sai e depois na forma aonde chega.</li>
    <li><strong>SIM ou NÃO na seta:</strong> clique na seta e escolha no painel da direita.</li>
    <li><strong>Errou?</strong> Use <strong>Desfazer</strong>. <strong>Terminou?</strong> Use <strong>Imprimir ou PDF</strong>. Para continuar em outro dia ou em outro computador, use <strong>Salvar no computador</strong> e, depois, <strong>Abrir</strong>.</li>
  </ol><p>Enquanto você trabalha, tudo fica guardado sozinho neste computador.</p>`,
  botoes: [{ rotulo: 'Entendi', valor: 'ok', destaque: true }],
}));

// ---------- Paleta ----------
for (const b of document.querySelectorAll('.bt-forma[data-tipo]')) {
  b.addEventListener('click', () => interacao.adicionarForma(b.dataset.tipo));
}
$('bt-seta').addEventListener('click', () => {
  if (interacao.estadoTela().modoSeta) interacao.sairModoSeta(); else interacao.entrarModoSeta();
});
$('faixa-cancelar').addEventListener('click', () => interacao.sairModoSeta());
$('bt-folha').addEventListener('click', () => {
  interacao.terminarEdicao();
  const nova = loja.doc.folha.orientacao === 'paisagem' ? 'retrato' : 'paisagem';
  loja.aplicar(definirOrientacao(loja.doc, nova));
});

// ---------- Começo ----------
new ResizeObserver(() => redesenhar()).observe(el.palco);
redesenhar();
if (guardado) $('status').textContent = '✓ Guardado neste computador';
else mostrarInicio(false);
// Com as fontes carregadas, as medidas de texto mudam: cresce quem ficou apertado.
document.fonts.ready.then(() => {
  redesenhar();
  const d = interacao.crescer(loja.doc, loja.doc.formas.map((f) => f.id));
  if (d !== loja.doc) loja.trocar(d);
});
