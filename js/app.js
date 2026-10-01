// Liga tudo: barra do alto, paleta, tela inicial, diálogos, guardado automático e
// impressão. A cada mudança na loja (ou no estado da tela), redesenha tudo.
import { criarLoja } from './loja.js';
import { criarDesenho } from './desenho.js';
import { criarInteracao } from './interacao.js';
import { criarPainel } from './painel.js';
import { modeloDengue, folhaVazia } from './modelos.js';
import { definirOrientacao } from './modelo.js';
import { guardarNoNavegador, lerDoNavegador, baixarArquivo, lerArquivo } from './arquivo.js';
import { criarDuvidas } from './duvidas-tela.js';
import { htmlCreditos } from './creditos.js';
import { avisarAcesso } from './acesso.js';

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
const dialogoAberto = () => !$('dialogo').hidden || !$('inicio').hidden || !$('duvidas').hidden;

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
  if (ev.key === 'Escape' && !$('duvidas').hidden) duvidas.fechar();
  else if (ev.key === 'Escape' && fecharDialogo) fecharDialogo('cancelar');
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
// "✓ Guardado" curto de propósito: com a frase inteira, a barra do alto quebrava em
// duas linhas num notebook de 1366 px e roubava altura da folha. A frase inteira
// fica no title (aparece ao passar o mouse).
function marcarGuardado() {
  const s = $('status');
  s.classList.remove('ruim');
  s.textContent = '✓ Guardado';
  s.title = 'Tudo o que você faz fica guardado sozinho neste computador.';
}
function guardar() {
  clearTimeout(relogioGuardar);
  // Com a tela inicial aberta, a pessoa ainda não escolheu nada: guardar agora (o
  // beforeunload chama isto) gravaria a folha vazia, e a tela inicial sumiria na
  // próxima visita.
  if (!$('inicio').hidden) return;
  if (guardarNoNavegador(loja.doc)) { marcarGuardado(); return; }
  const s = $('status');
  s.classList.add('ruim');
  s.textContent = 'Não deu para guardar neste navegador. Use "Salvar no computador".';
  s.title = '';
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
  loja.carregar(r.doc, { desfazivel: temConteudo(loja.doc) });
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

// Sem nada antes (o primeiro começo), carregar não entra no Desfazer.
const comecar = (novo) => { loja.carregar(novo, { desfazivel: temConteudo(loja.doc) }); fecharInicio(); };
$('ini-modelo').addEventListener('click', () => comecar(modeloDengue()));
$('ini-vazia').addEventListener('click', () => comecar(folhaVazia()));
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
// ---------- Tire sua dúvida ----------
// (O passo a passo geral que ficava no antigo botão "Ajuda" virou a resposta
// "Como usar o sistema, do começo ao fim?", em duvidas.js.)
// "Mostrar na tela": o alvo pisca (contorno laranja) por uns 3 s.
function piscar(seletor) {
  interacao.terminarEdicao();
  const alvo = document.querySelector(seletor);
  if (!alvo) return;
  alvo.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  alvo.classList.remove('piscando');
  void alvo.offsetWidth; // reinicia a animação se já estava piscando
  alvo.classList.add('piscando');
  setTimeout(() => alvo.classList.remove('piscando'), 3600);
}
const duvidas = criarDuvidas({
  el: {
    cobertura: $('duvidas'), form: $('duvidas-form'), campo: $('duvidas-campo'),
    resultado: $('duvidas-resultado'), fechar: $('duvidas-fechar'),
  },
  mostrarNaTela: piscar,
});
$('bt-duvida').addEventListener('click', () => {
  interacao.terminarEdicao();
  interacao.sairModoSeta();
  duvidas.abrir();
});

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
for (const n of document.querySelectorAll('[data-creditos]')) n.innerHTML = htmlCreditos();
avisarAcesso();
new ResizeObserver(() => redesenhar()).observe(el.palco);
redesenhar();
if (guardado) marcarGuardado();
else mostrarInicio(false);
// Com as fontes carregadas, as medidas de texto mudam: cresce quem ficou apertado.
document.fonts.ready.then(() => {
  redesenhar();
  const d = interacao.crescer(loja.doc, loja.doc.formas.map((f) => f.id));
  if (d !== loja.doc) loja.trocar(d);
});
