# Fluxograma Fácil — plano de construção

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um editor de fluxograma em branco, numa página estática, simples o bastante
para servidores com dificuldade no computador montarem e imprimirem o fluxo municipal da dengue.

**Architecture:** Página estática sem framework e sem *build*: `index.html` + `estilo.css` +
módulos ES em `js/`. A lógica fica em módulos **puros**, testados no Node com `node --test`:
paleta, geometria, setas, encaixe, modelo, histórico, loja, modelos e arquivo. Só quatro módulos
mexem na página: `desenho.js`, `interacao.js`, `painel.js` e `app.js`. O documento é um objeto
JSON, e cada operação devolve um documento novo. A `loja` guarda o documento, a seleção e o
histórico de desfazer, e avisa a tela quando algo muda.

**Tech Stack:** HTML, CSS, JavaScript (módulos ES), SVG para contornos e setas, `node:test`
(Node 24) para os testes. As fontes Archivo e Source Sans 3 são copiadas do Guia Saúde. Hospedagem
no GitHub Pages.

**Desenho aprovado:** `docs/superpowers/specs/2026-09-29-fluxograma-facil-design.md`.

---

## Convenções deste plano

- **Pasta do app:** `C:\Users\paulo\OneDrive\Desktop\.claude apps\Fluxograma Facil`, que vira
  `APP` nos comandos abaixo. Todos os caminhos são relativos a ela.
- **Blocos marcados com `arquivo=<caminho>` são o conteúdo COMPLETO do arquivo.** Para gravá-los
  sem redigitar, há um extrator no scratchpad da sessão:
  `node <scratchpad>/extrair.mjs docs/superpowers/plans/2026-09-29-fluxograma-facil.md . <caminho>`.
  Quando o mesmo caminho aparece em dois blocos, vale o último.
- **Node:** `C:/PROGRA~1/nodejs/node.exe` (v24). O comando `node --test` acha sozinho os
  `testes/*.test.js`.
- **Commits:** em português, terminando com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Nada é publicado (push) sem o OK explícito do Paulo.** O repositório será público.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | Só `"type": "module"` e o script de teste |
| `servir.js` | Servidor local da prévia (porta 5180) |
| `.gitignore`, `.nojekyll` | Git e GitHub Pages |
| `fontes/*.woff2` | Archivo (título) e Source Sans 3 (texto) |
| `js/paleta.js` | Constantes: cores, tipos, tamanhos, folha, limites |
| `js/geometria.js` | Caixa do texto, altura necessária, ponto no contorno, contorno SVG |
| `js/setas.js` | Caminho das setas em ângulo reto e posição do rótulo |
| `js/encaixe.js` | Grade, limites da folha, linhas-guia |
| `js/modelo.js` | O documento e todas as operações sobre ele |
| `js/historico.js` | Pilhas de desfazer/refazer |
| `js/loja.js` | Estado da tela: documento, seleção, lotes de desfazer, avisos |
| `js/modelos.js` | Modelo em branco da dengue e folha vazia |
| `js/arquivo.js` | Validar, serializar, nome do arquivo, guardar/abrir/baixar |
| `index.html` | Casca da tela |
| `estilo.css` | Aparência da tela e da impressão |
| `js/desenho.js` | Desenha documento, setas, título e controles na folha |
| `js/interacao.js` | Mouse e teclado na folha: escolher, mover, redimensionar, escrever, ligar |
| `js/painel.js` | Painel da direita, conforme o que está escolhido |
| `js/app.js` | Liga tudo: barra do alto, tela inicial, diálogos, guardado automático, impressão |
| `testes/*.test.js` | Um arquivo de teste por módulo puro |
| `CLAUDE.md` | O porquê das decisões, para quem mexer depois |

---

### Task 1: Estrutura do projeto

**Files:**
- Create: `package.json`, `.gitignore`, `.nojekyll`, `servir.js`
- Create: `fontes/archivo-latin.woff2`, `fontes/sourcesans3-latin.woff2` (cópia do Guia Saúde)
- Modify: `../.claude/launch.json` (entrada `fluxograma-facil`)

- [ ] **Step 1: Gravar os arquivos da estrutura**

```json arquivo=package.json
{
  "name": "fluxograma-facil",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

```text arquivo=.gitignore
.claude/
node_modules/
```

```js arquivo=servir.js
// Servidor local mínimo para a prévia: `node servir.js` → http://localhost:5180
// Precisa dele porque módulos ES (<script type="module">) não carregam com o
// index.html aberto direto do disco.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const PORTA = Number(process.env.PORT) || 5180;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const arq = path.resolve(RAIZ, '.' + p);
  if (!arq.startsWith(RAIZ) || arq.includes(`${path.sep}.git`)) { res.writeHead(404); return res.end(); }
  fs.readFile(arq, (erro, dados) => {
    if (erro) { res.writeHead(404); return res.end('não encontrado'); }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(dados);
  });
}).listen(PORTA, () => console.log(`Fluxograma Fácil em http://localhost:${PORTA}`));
```

Depois: `touch .nojekyll` e `cp ../GuiaSaude/fontes/*.woff2 fontes/`.

- [ ] **Step 2: Acrescentar a entrada da prévia em `../.claude/launch.json`** (dentro de
  `configurations`, depois da `central-documentos`):

```json
    {
      "name": "fluxograma-facil",
      "runtimeExecutable": "C:/PROGRA~1/nodejs/node.exe",
      "runtimeArgs": ["Fluxograma Facil/servir.js"],
      "port": 5180
    }
```

- [ ] **Step 3: Conferir que o servidor sobe**

Run: `node servir.js` (em segundo plano) e `curl -s -o /dev/null -w "%{http_code}" http://localhost:5180/package.json`
Expected: `200`. Depois, encerrar o servidor.

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore .nojekyll servir.js fontes
git commit -m "Estrutura do Fluxograma Fácil: servidor local, fontes e package.json"
```

### Task 2: Paleta e constantes

**Files:**
- Create: `js/paleta.js`
- Test: `testes/paleta.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/paleta.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORES, ORDEM_CORES, TIPOS, TAMANHO_PADRAO, TAM_MIN, tamanhoFolha } from '../js/paleta.js';

test('toda cor da ordem existe e tem fundo e borda em hexadecimal', () => {
  assert.deepEqual([...ORDEM_CORES].sort(), Object.keys(CORES).sort());
  for (const nome of ORDEM_CORES) {
    assert.match(CORES[nome].fundo, /^#[0-9A-F]{6}$/);
    assert.match(CORES[nome].borda, /^#[0-9A-F]{6}$/);
  }
});

test('todo tipo tem tamanho padrão acima do mínimo', () => {
  for (const t of TIPOS) {
    assert.ok(TAMANHO_PADRAO[t].l >= TAM_MIN.l && TAMANHO_PADRAO[t].a >= TAM_MIN.a, t);
  }
});

test('folha em pé e deitada trocam largura e altura', () => {
  assert.deepEqual(tamanhoFolha('retrato'), { largura: 794, altura: 1123 });
  assert.deepEqual(tamanhoFolha('paisagem'), { largura: 1123, altura: 794 });
  assert.deepEqual(tamanhoFolha('qualquer'), { largura: 794, altura: 1123 });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/paleta.test.js`
Expected: FAIL com `Cannot find module ... js/paleta.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/paleta.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/paleta.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add js/paleta.js testes/paleta.test.js
git commit -m "Paleta: cores por nome, tipos de forma, folha A4 e limites"
```

### Task 3: Geometria das formas

**Files:**
- Create: `js/geometria.js`
- Test: `testes/geometria.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/geometria.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caixaDoTexto, alturaNecessaria, pontoNaBorda, contorno } from '../js/geometria.js';

const f = (tipo, l, a, x = 0, y = 0) => ({ tipo, x, y, l, a });

test('caixa do texto: retângulo desconta o espaço interno', () => {
  assert.deepEqual(caixaDoTexto(f('retangulo', 180, 70)), { x: 10, y: 8, l: 160, a: 54 });
});

test('caixa do texto: losango usa a faixa central de 60% × 50%', () => {
  assert.deepEqual(caixaDoTexto(f('losango', 200, 100)), { x: 40, y: 25, l: 120, a: 50 });
});

test('altura necessária cresce conforme o tipo', () => {
  assert.equal(alturaNecessaria(f('retangulo', 180, 70), 50), 66);
  assert.equal(alturaNecessaria(f('losango', 180, 120), 50), 100);
  assert.equal(alturaNecessaria(f('circulo', 110, 110), 70), 100);
});

test('ponto no contorno do retângulo: meio do lado ou coordenada dada', () => {
  const r = f('retangulo', 100, 60, 10, 20);
  assert.deepEqual(pontoNaBorda(r, 'cima'), [60, 20]);
  assert.deepEqual(pontoNaBorda(r, 'baixo', 30), [30, 80]);
  assert.deepEqual(pontoNaBorda(r, 'esquerda'), [10, 50]);
});

test('ponto no contorno do losango: vértice no meio, aresta inclinada fora dele', () => {
  const l = f('losango', 100, 60);
  assert.deepEqual(pontoNaBorda(l, 'direita'), [100, 30]);
  assert.deepEqual(pontoNaBorda(l, 'baixo', 25), [25, 45]);
});

test('ponto no contorno do círculo segue a elipse', () => {
  const c = f('circulo', 100, 100);
  assert.deepEqual(pontoNaBorda(c, 'direita'), [100, 50]);
  const [x, y] = pontoNaBorda(c, 'direita', 80);
  assert.equal(y, 80);
  assert.ok(Math.abs(x - 90) < 1e-9);
});

test('contorno: cada tipo vira o elemento SVG certo; texto não tem contorno', () => {
  assert.equal(contorno(f('losango', 100, 60)).attrs.points, '50,1 99,30 50,59 1,30');
  assert.equal(contorno(f('circulo', 100, 60)).tag, 'ellipse');
  assert.equal(contorno(f('arredondado', 180, 70)).attrs.rx, 14);
  assert.equal(contorno(f('retangulo', 180, 70)).attrs.rx, undefined);
  assert.equal(contorno(f('texto', 180, 40)), null);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/geometria.test.js`
Expected: FAIL com `Cannot find module ... js/geometria.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/geometria.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/geometria.test.js`
Expected: PASS (7 testes).

- [ ] **Step 5: Commit**

```bash
git add js/geometria.js testes/geometria.test.js
git commit -m "Geometria: área do texto, altura necessária e ponto no contorno"
```

### Task 4: Caminho das setas

**Files:**
- Create: `js/setas.js`
- Test: `testes/setas.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/setas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tracarSeta, ladosAutomaticos, caminhoSvg, encurtarFim } from '../js/setas.js';

const r = (x, y, l, a, tipo = 'retangulo') => ({ x, y, l, a, tipo });

test('forma embaixo e alinhada: reta para baixo, rótulo a 22 px da saída', () => {
  const A = r(100, 100, 180, 70), B = r(100, 220, 180, 70);
  assert.deepEqual(ladosAutomaticos(A, B), ['baixo', 'cima']);
  const s = tracarSeta(A, B);
  assert.deepEqual(s.pontos, [[190, 170], [190, 220]]);
  assert.deepEqual(s.rotulo, { x: 190, y: 192 });
});

test('losango para a caixa ao lado: reta saindo do vértice (como em Curitiba)', () => {
  const L = r(250, 190, 160, 110, 'losango'), R = r(450, 220, 314, 50, 'arredondado');
  const s = tracarSeta(L, R);
  assert.deepEqual(s.pontos, [[410, 245], [450, 245]]);
  assert.deepEqual(s.rotulo, { x: 430, y: 245 }); // caminho curto: rótulo no meio
});

test('caixa larga para o losango embaixo: reta pelo vértice de cima do losango', () => {
  const T = r(150, 100, 500, 50, 'arredondado'), L = r(250, 190, 160, 110, 'losango');
  assert.deepEqual(tracarSeta(T, L).pontos, [[330, 150], [330, 190]]);
});

test('sem sobreposição: "Z" em ângulo reto com a dobra no meio do vão', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(300, 200, 100, 50));
  assert.deepEqual(s.pontos, [[100, 25], [200, 25], [200, 225], [300, 225]]);
});

test('lados escolhidos à mão, perpendiculares: "L" com uma dobra', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(200, 150, 100, 50), { saida: 'direita', chegada: 'cima' });
  assert.deepEqual(s.pontos, [[100, 25], [250, 25], [250, 150]]);
});

test('mesmo lado nas duas: "U" por fora', () => {
  const s = tracarSeta(r(0, 0, 100, 50), r(0, 100, 100, 50), { saida: 'direita', chegada: 'direita' });
  assert.deepEqual(s.pontos, [[100, 25], [120, 25], [120, 125], [100, 125]]);
});

test('chegada no círculo encosta na curva, não na caixa', () => {
  const s = tracarSeta(r(0, 0, 100, 40), r(40, 100, 100, 100, 'circulo'));
  assert.deepEqual(s.pontos[0], [70, 40]);
  assert.equal(s.pontos[1][0], 70);
  assert.equal(s.pontos[1][1], 104.2);
});

test('caminho SVG e encurtar o fim para caber a ponta', () => {
  assert.equal(caminhoSvg([[0, 0], [10, 0], [10, 20]]), 'M0 0 L10 0 L10 20');
  assert.deepEqual(encurtarFim([[0, 0], [0, 100]], 8), [[0, 0], [0, 92]]);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/setas.test.js`
Expected: FAIL com `Cannot find module ... js/setas.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/setas.js
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
      pontos = [pontoNaBorda(origem, saida, x), pontoNaBorda(destino, chegada, x)];
    }
  } else if (horizontal) {
    const ini = Math.max(a.topo, b.topo);
    const fim = Math.min(a.base, b.base);
    if (fim - ini >= SOBREPOSICAO_MIN) {
      const y = coordenadaReta(ini, fim, a.cy, b.cy);
      pontos = [pontoNaBorda(origem, saida, y), pontoNaBorda(destino, chegada, y)];
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/setas.test.js`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add js/setas.js testes/setas.test.js
git commit -m "Setas: caminho em ângulo reto, reta quando as formas se enxergam"
```

### Task 5: Encaixe (grade, limites e linhas-guia)

**Files:**
- Create: `js/encaixe.js`
- Test: `testes/encaixe.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/encaixe.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encaixar, limitar, guias, posicionar } from '../js/encaixe.js';

const FOLHA = { largura: 794, altura: 1123 };

test('encaixar arredonda para a grade de 10', () => {
  assert.equal(encaixar(14), 10);
  assert.equal(encaixar(15), 20);
  assert.equal(encaixar(123, 5), 125);
});

test('limitar traz a forma para dentro da margem de 30 px', () => {
  assert.deepEqual(limitar({ x: -10, y: 2000, l: 100, a: 50 }, FOLHA), { x: 30, y: 1043 });
  assert.deepEqual(limitar({ x: 200, y: 300, l: 100, a: 50 }, FOLHA), { x: 200, y: 300 });
});

test('guia: borda esquerda a 3 px da vizinha gruda e desenha a linha', () => {
  const g = guias({ x: 103, y: 300, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }]);
  assert.equal(g.dx, -3);
  assert.equal(g.dy, null);
  assert.deepEqual(g.linhas, [{ x1: 100, y1: 100, x2: 100, y2: 350 }]);
});

test('guia: nada perto, nada gruda', () => {
  const g = guias({ x: 400, y: 600, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }]);
  assert.deepEqual(g, { dx: null, dy: null, linhas: [] });
});

test('posicionar: sem guia vale a grade; com guia, a guia vence', () => {
  assert.deepEqual(posicionar({ x: 104, y: 207, l: 100, a: 50 }, [], FOLHA), { x: 100, y: 210, linhas: [] });
  const p = posicionar({ x: 103, y: 207, l: 100, a: 50 }, [{ x: 100, y: 100, l: 100, a: 50 }], FOLHA);
  assert.equal(p.x, 100);
  assert.equal(p.y, 210);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/encaixe.test.js`
Expected: FAIL com `Cannot find module ... js/encaixe.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/encaixe.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/encaixe.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add js/encaixe.js testes/encaixe.test.js
git commit -m "Encaixe: grade de 10 px, linhas-guia e margem da folha"
```

### Task 6: O documento e suas operações

**Files:**
- Create: `js/modelo.js`
- Test: `testes/modelo.test.js`

Toda operação recebe um documento e devolve **outro** (o original não muda). É isso que deixa o
desfazer simples e os testes diretos.

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/modelo.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  documentoVazio, criarForma, atualizarForma, atualizarFormas, moverFormas, apagar, duplicar,
  ligar, atualizarSeta, inverterSeta, trocarTipo, definirTitulo, definirOrientacao, criarLigada,
  lugarLivre, formaPorId, normalizarForma,
} from '../js/modelo.js';

const comDuas = () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 100 }));
  ({ doc: d } = criarForma(d, 'losango', { x: 100, y: 300 }));
  return d;
};

test('documento vazio tem título em branco, folha em pé e nada desenhado', () => {
  const d = documentoVazio();
  assert.equal(d.app, 'fluxograma-facil');
  assert.equal(d.versao, 1);
  assert.deepEqual(d.titulo, { texto: '', cor: 'cinza' });
  assert.deepEqual(d.folha, { orientacao: 'retrato' });
  assert.deepEqual([d.formas, d.setas], [[], []]);
});

test('criar forma usa o tamanho padrão do tipo e ids novos; o original não muda', () => {
  const d0 = documentoVazio();
  const { doc, id } = criarForma(d0, 'losango', { x: 100, y: 200 });
  assert.equal(id, 'f1');
  assert.deepEqual(doc.formas[0], {
    id: 'f1', tipo: 'losango', x: 100, y: 200, l: 180, a: 120, texto: '', cor: 'branco',
    borda: 'lisa', letra: 14, negrito: false, alinhar: 'centro',
  });
  assert.equal(d0.formas.length, 0);
  assert.equal(criarForma(doc, 'retangulo', { x: 400, y: 200 }).id, 'f2');
});

test('criar forma sem posição procura um lugar livre perto do ponto pedido', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 300, y: 300 }));
  const { doc } = criarForma(d, 'retangulo', null, { perto: { x: 390, y: 335 } });
  const [a, b] = doc.formas;
  const sobrepoe = b.x < a.x + a.l && a.x < b.x + b.l && b.y < a.y + a.a && a.y < b.y + b.a;
  assert.equal(sobrepoe, false);
});

test('lugar livre devolve null quando a folha está cheia', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 30, y: 30 }));
  d = atualizarForma(d, 'f1', { l: 734, a: 1063 });
  assert.equal(lugarLivre(d, 180, 70, { x: 400, y: 500 }), null);
});

test('atualizar forma normaliza: cor desconhecida e letra fora da faixa são corrigidas', () => {
  const d = atualizarForma(comDuas(), 'f1', { cor: 'dourado', letra: 99, texto: 'Oi' });
  const f = formaPorId(d, 'f1');
  assert.equal(f.cor, 'branco');
  assert.equal(f.letra, 28);
  assert.equal(f.texto, 'Oi');
  assert.equal(atualizarFormas(d, ['f1', 'f2'], { cor: 'verde' }).formas.every((x) => x.cor === 'verde'), true);
});

test('mover várias de uma vez', () => {
  const d = moverFormas(comDuas(), ['f1', 'f2'], 10, -20);
  assert.deepEqual(d.formas.map((f) => [f.x, f.y]), [[110, 80], [110, 280]]);
});

test('ligar: cria seta, recusa a mesma forma, forma inexistente e seta repetida', () => {
  const d0 = comDuas();
  const r = ligar(d0, 'f1', 'f2');
  assert.equal(r.id, 's1');
  assert.deepEqual(r.doc.setas[0], { id: 's1', de: 'f1', para: 'f2', texto: '', saida: 'auto', chegada: 'auto' });
  assert.equal(ligar(d0, 'f1', 'f1').erro, 'mesma');
  assert.equal(ligar(d0, 'f1', 'f9').erro, 'inexistente');
  assert.equal(ligar(r.doc, 'f1', 'f2').erro, 'repetida');
});

test('apagar forma leva junto as setas dela; apagar seta sozinha', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  const semF1 = apagar(doc, ['f1']);
  assert.deepEqual(semF1.formas.map((f) => f.id), ['f2']);
  assert.equal(semF1.setas.length, 0);
  const semSeta = apagar(doc, ['s1']);
  assert.equal(semSeta.formas.length, 2);
  assert.equal(semSeta.setas.length, 0);
});

test('duplicar copia as formas e as setas entre elas, 20 px ao lado', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  const r = duplicar(doc, ['f1', 'f2']);
  assert.deepEqual(r.ids, ['f3', 'f4']);
  assert.deepEqual([formaPorId(r.doc, 'f3').x, formaPorId(r.doc, 'f3').y], [120, 120]);
  assert.equal(r.doc.setas.length, 2);
  assert.deepEqual([r.doc.setas[1].de, r.doc.setas[1].para], ['f3', 'f4']);
});

test('seta: texto limitado, lados válidos, inverter troca as pontas e os lados', () => {
  const { doc } = ligar(comDuas(), 'f1', 'f2');
  let d = atualizarSeta(doc, 's1', { texto: 'SIM', saida: 'baixo', chegada: 'nada' });
  assert.deepEqual([d.setas[0].texto, d.setas[0].saida, d.setas[0].chegada], ['SIM', 'baixo', 'auto']);
  d = inverterSeta(d, 's1');
  assert.deepEqual([d.setas[0].de, d.setas[0].para, d.setas[0].saida, d.setas[0].chegada], ['f2', 'f1', 'auto', 'baixo']);
});

test('trocar tipo mantém tamanho e texto', () => {
  const d = trocarTipo(atualizarForma(comDuas(), 'f1', { texto: 'X' }), ['f1'], 'circulo');
  const f = formaPorId(d, 'f1');
  assert.deepEqual([f.tipo, f.l, f.a, f.texto], ['circulo', 180, 70, 'X']);
});

test('título: texto limitado a 120 caracteres e sem quebra de linha', () => {
  const d = definirTitulo(documentoVazio(), { texto: 'a\nb' + 'x'.repeat(200), cor: 'rosa' });
  assert.equal(d.titulo.texto.length, 120);
  assert.equal(d.titulo.texto.startsWith('a b'), true);
  assert.equal(d.titulo.cor, 'rosa');
});

test('deitar a folha traz para dentro o que ficaria de fora', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 1000 }));
  d = definirOrientacao(d, 'paisagem');
  assert.equal(d.folha.orientacao, 'paisagem');
  assert.equal(formaPorId(d, 'f1').y, 794 - 30 - 70);
});

test('criar ligada: forma igual 50 px abaixo, já com seta', () => {
  let d = comDuas();
  d = atualizarForma(d, 'f1', { cor: 'vermelho', texto: 'não copia' });
  const r = criarLigada(d, 'f1', 'direita');
  const nova = formaPorId(r.doc, r.id);
  assert.deepEqual([nova.tipo, nova.cor, nova.x, nova.y, nova.texto], ['retangulo', 'vermelho', 330, 100, '']);
  assert.deepEqual([r.doc.setas[0].de, r.doc.setas[0].para], ['f1', r.id]);
});

test('criar ligada pula por cima de quem está no caminho e recusa quando não cabe', () => {
  let d = documentoVazio();
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 100 }));
  ({ doc: d } = criarForma(d, 'retangulo', { x: 100, y: 230 })); // bem onde a nova cairia (y 220)
  const r = criarLigada(d, 'f1', 'baixo');
  assert.equal(formaPorId(r.doc, r.id).y, 350); // 230 + 70 + 50
  assert.equal(criarLigada(d, 'f1', 'cima').erro, 'sem-espaco');
});

test('normalizar forma: id e tipo obrigatórios; números arredondados e limitados', () => {
  assert.equal(normalizarForma({ tipo: 'losango' }), null);
  assert.equal(normalizarForma({ id: 'f1', tipo: 'estrela' }), null);
  const f = normalizarForma({ id: 'f1', tipo: 'retangulo', x: 10.4, y: 'abc', l: 5, a: 99999 });
  assert.deepEqual([f.x, f.y, f.l, f.a], [10, 0, 40, 2000]);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/modelo.test.js`
Expected: FAIL com `Cannot find module ... js/modelo.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/modelo.js
// O documento do fluxograma e todas as operações sobre ele. Toda função recebe
// um documento e devolve OUTRO: o original nunca muda. É isso que deixa o
// desfazer simples (basta guardar fotos) e os testes diretos.
import {
  CORES, TIPOS, TAMANHO_PADRAO, TAM_MIN, LETRA, TEXTO_MAX, TITULO_MAX, ROTULO_MAX,
  LADOS, MARGEM, DISTANCIA_MAIS, tamanhoFolha,
} from './paleta.js';
import { encaixar, limitar } from './encaixe.js';

export const APP = 'fluxograma-facil';
export const VERSAO = 1;
const TAM_MAX = 2000;

export function documentoVazio() {
  return {
    app: APP, versao: VERSAO,
    titulo: { texto: '', cor: 'cinza' },
    folha: { orientacao: 'retrato' },
    formas: [], setas: [],
  };
}

const clonar = (d) => structuredClone(d);

function numero(v, min, max, padrao) {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function textoLimpo(v, max) {
  return typeof v === 'string' ? v.replace(/\r/g, '').slice(0, max) : '';
}

function letraValida(v) {
  const n = numero(v, LETRA.min, LETRA.max, LETRA.padrao);
  return n % 2 === 0 ? n : n - 1; // passo de 2, como os botões A− e A+
}

// Devolve a forma "consertada", ou null se faltar id ou o tipo não existir.
export function normalizarForma(o) {
  if (!o || typeof o !== 'object') return null;
  if (typeof o.id !== 'string' || !o.id || !TIPOS.includes(o.tipo)) return null;
  const pad = TAMANHO_PADRAO[o.tipo];
  return {
    id: o.id,
    tipo: o.tipo,
    x: numero(o.x, 0, TAM_MAX, 0),
    y: numero(o.y, 0, TAM_MAX, 0),
    l: numero(o.l, TAM_MIN.l, TAM_MAX, pad.l),
    a: numero(o.a, TAM_MIN.a, TAM_MAX, pad.a),
    texto: textoLimpo(o.texto, TEXTO_MAX),
    cor: CORES[o.cor] ? o.cor : 'branco',
    borda: o.borda === 'tracejada' ? 'tracejada' : 'lisa',
    letra: letraValida(o.letra),
    negrito: o.negrito === true,
    alinhar: o.alinhar === 'esquerda' ? 'esquerda' : 'centro',
  };
}

export function normalizarSeta(o) {
  if (!o || typeof o !== 'object') return null;
  if (typeof o.id !== 'string' || !o.id || typeof o.de !== 'string' || typeof o.para !== 'string') return null;
  return {
    id: o.id,
    de: o.de,
    para: o.para,
    texto: textoLimpo(o.texto, ROTULO_MAX).replace(/\n/g, ' '),
    saida: LADOS.includes(o.saida) ? o.saida : 'auto',
    chegada: LADOS.includes(o.chegada) ? o.chegada : 'auto',
  };
}

export function normalizarTitulo(o) {
  const t = o && typeof o === 'object' ? o : {};
  return {
    texto: textoLimpo(t.texto, 10000).replace(/\s*\n\s*/g, ' ').slice(0, TITULO_MAX),
    cor: CORES[t.cor] ? t.cor : 'cinza',
  };
}

function proximoId(doc, prefixo) {
  const usados = new Set([...doc.formas, ...doc.setas].map((i) => i.id));
  let max = 0;
  for (const id of usados) {
    const n = Number(id.slice(prefixo.length));
    if (id.startsWith(prefixo) && Number.isInteger(n) && n > max) max = n;
  }
  let n = max + 1;
  while (usados.has(prefixo + n)) n++;
  return prefixo + n;
}

export function formaPorId(doc, id) {
  return doc.formas.find((f) => f.id === id) || null;
}

export function setaPorId(doc, id) {
  return doc.setas.find((s) => s.id === id) || null;
}

export function sobrepoe(a, b, folga = 0) {
  return a.x < b.x + b.l + folga && b.x < a.x + a.l + folga
    && a.y < b.y + b.a + folga && b.y < a.y + a.a + folga;
}

function centroDaFolha(doc) {
  const f = tamanhoFolha(doc.folha.orientacao);
  return { x: f.largura / 2, y: f.altura / 2 };
}

// Lugar livre (sem encostar em ninguém) para uma forma l×a, o mais perto possível
// do ponto `perto` (o centro desejado). Anda em anéis de 20 px; null = folha cheia.
export function lugarLivre(doc, l, a, perto) {
  const folha = tamanhoFolha(doc.folha.orientacao);
  const base = { x: perto.x - l / 2, y: perto.y - a / 2 };
  const PASSO = 20;
  const livre = (p) => !doc.formas.some((f) => sobrepoe({ ...p, l, a }, f, 10));
  for (let raio = 0; raio <= 60; raio++) {
    for (let i = -raio; i <= raio; i++) {
      for (let j = -raio; j <= raio; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== raio) continue; // só a borda do anel
        const p = limitar({ x: encaixar(base.x + i * PASSO), y: encaixar(base.y + j * PASSO), l, a }, folha);
        if (livre(p)) return { x: p.x, y: p.y };
      }
    }
  }
  return null;
}

// pos: {x, y} do canto, ou null para procurar lugar livre perto de opcoes.perto.
// opcoes.estilo: forma de onde copiar tamanho, cor, borda e letra (o texto nunca).
export function criarForma(doc, tipo, pos, opcoes = {}) {
  const pad = TAMANHO_PADRAO[tipo];
  const estilo = opcoes.estilo || {};
  const l = estilo.l ?? pad.l;
  const a = estilo.a ?? pad.a;
  let p = pos;
  if (!p) {
    p = lugarLivre(doc, l, a, opcoes.perto || centroDaFolha(doc));
    if (!p) return { doc, id: null, erro: 'sem-espaco' };
  }
  const id = proximoId(doc, 'f');
  const novo = clonar(doc);
  novo.formas.push(normalizarForma({ ...estilo, id, tipo, x: p.x, y: p.y, l, a, texto: '' }));
  return { doc: novo, id };
}

export function atualizarFormas(doc, ids, mudancas) {
  const alvo = new Set(ids);
  const m = { ...mudancas };
  delete m.id;
  if (m.tipo !== undefined && !TIPOS.includes(m.tipo)) delete m.tipo;
  const novo = clonar(doc);
  novo.formas = novo.formas.map((f) => (alvo.has(f.id) ? normalizarForma({ ...f, ...m }) : f));
  return novo;
}

export function atualizarForma(doc, id, mudancas) {
  return atualizarFormas(doc, [id], mudancas);
}

export function trocarTipo(doc, ids, tipo) {
  return atualizarFormas(doc, ids, { tipo });
}

export function moverFormas(doc, ids, dx, dy) {
  const alvo = new Set(ids);
  const novo = clonar(doc);
  for (const f of novo.formas) {
    if (alvo.has(f.id)) {
      f.x = Math.round(f.x + dx);
      f.y = Math.round(f.y + dy);
    }
  }
  return novo;
}

// Apaga formas e setas pelos ids; uma forma apagada leva junto as setas dela.
export function apagar(doc, ids) {
  const alvo = new Set(ids);
  const novo = clonar(doc);
  novo.formas = novo.formas.filter((f) => !alvo.has(f.id));
  novo.setas = novo.setas.filter((s) => !alvo.has(s.id) && !alvo.has(s.de) && !alvo.has(s.para));
  return novo;
}

// Cópias 20 px para baixo e para a direita; as setas ENTRE as copiadas vêm junto.
export function duplicar(doc, ids) {
  const escolhidas = new Set(ids);
  const folha = tamanhoFolha(doc.folha.orientacao);
  const novo = clonar(doc);
  const mapa = new Map();
  for (const f of doc.formas) {
    if (!escolhidas.has(f.id)) continue;
    const id = proximoId(novo, 'f');
    const p = limitar({ ...f, x: f.x + 20, y: f.y + 20 }, folha);
    novo.formas.push({ ...f, id, x: p.x, y: p.y });
    mapa.set(f.id, id);
  }
  for (const s of doc.setas) {
    if (mapa.has(s.de) && mapa.has(s.para)) {
      novo.setas.push({ ...s, id: proximoId(novo, 's'), de: mapa.get(s.de), para: mapa.get(s.para) });
    }
  }
  return { doc: novo, ids: [...mapa.values()] };
}

// erro: 'mesma' (de = para), 'inexistente' ou 'repetida' (mesma saída e chegada).
export function ligar(doc, de, para) {
  if (de === para) return { doc, id: null, erro: 'mesma' };
  if (!formaPorId(doc, de) || !formaPorId(doc, para)) return { doc, id: null, erro: 'inexistente' };
  if (doc.setas.some((s) => s.de === de && s.para === para)) return { doc, id: null, erro: 'repetida' };
  const novo = clonar(doc);
  const id = proximoId(novo, 's');
  novo.setas.push(normalizarSeta({ id, de, para }));
  return { doc: novo, id };
}

export function atualizarSeta(doc, id, mudancas) {
  const novo = clonar(doc);
  novo.setas = novo.setas.map((s) => (s.id === id
    ? normalizarSeta({ ...s, texto: mudancas.texto ?? s.texto, saida: mudancas.saida ?? s.saida, chegada: mudancas.chegada ?? s.chegada })
    : s));
  return novo;
}

export function inverterSeta(doc, id) {
  const novo = clonar(doc);
  novo.setas = novo.setas.map((s) => (s.id === id
    ? { ...s, de: s.para, para: s.de, saida: s.chegada, chegada: s.saida }
    : s));
  return novo;
}

export function definirTitulo(doc, mudancas) {
  const novo = clonar(doc);
  novo.titulo = normalizarTitulo({ ...doc.titulo, ...mudancas });
  return novo;
}

// Vira a folha e traz para dentro dela o que ficaria de fora.
export function definirOrientacao(doc, orientacao) {
  const novo = clonar(doc);
  novo.folha.orientacao = orientacao === 'paisagem' ? 'paisagem' : 'retrato';
  const folha = tamanhoFolha(novo.folha.orientacao);
  for (const f of novo.formas) Object.assign(f, limitar(f, folha));
  return novo;
}

const PASSO_LADO = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };

// O "+": forma igual à de origem (sem o texto), a DISTANCIA_MAIS px do lado pedido,
// já ligada por seta. Se alguém estiver no caminho, pula para depois dele.
export function criarLigada(doc, idOrigem, lado) {
  const o = formaPorId(doc, idOrigem);
  if (!o || !PASSO_LADO[lado]) return { doc, id: null, erro: 'inexistente' };
  const folha = tamanhoFolha(doc.folha.orientacao);
  const [dx, dy] = PASSO_LADO[lado];
  const { l, a } = o;
  let x = dx === 0 ? o.x : (dx > 0 ? o.x + o.l + DISTANCIA_MAIS : o.x - DISTANCIA_MAIS - l);
  let y = dy === 0 ? o.y : (dy > 0 ? o.y + o.a + DISTANCIA_MAIS : o.y - DISTANCIA_MAIS - a);
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const dentro = x >= MARGEM && y >= MARGEM
      && x + l <= folha.largura - MARGEM && y + a <= folha.altura - MARGEM;
    if (!dentro) return { doc, id: null, erro: 'sem-espaco' };
    const bloqueio = doc.formas.find((f) => sobrepoe({ x, y, l, a }, f, 10));
    if (!bloqueio) {
      const r = criarForma(doc, o.tipo, { x, y }, { estilo: o });
      const lig = ligar(r.doc, idOrigem, r.id);
      return { doc: lig.doc, id: r.id, seta: lig.id };
    }
    if (dx > 0) x = bloqueio.x + bloqueio.l + DISTANCIA_MAIS;
    else if (dx < 0) x = bloqueio.x - DISTANCIA_MAIS - l;
    else if (dy > 0) y = bloqueio.y + bloqueio.a + DISTANCIA_MAIS;
    else y = bloqueio.y - DISTANCIA_MAIS - a;
  }
  return { doc, id: null, erro: 'sem-espaco' };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/modelo.test.js`
Expected: PASS (16 testes).

- [ ] **Step 5: Commit**

```bash
git add js/modelo.js testes/modelo.test.js
git commit -m "Modelo: documento imutável com criar, mover, ligar, duplicar, apagar e o \"+\""
```

### Task 7: Histórico de desfazer

**Files:**
- Create: `js/historico.js`
- Test: `testes/historico.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/historico.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarHistorico, registrar, desfazer, refazer, podeDesfazer, podeRefazer } from '../js/historico.js';

test('desfazer volta foto a foto, refazer anda de novo', () => {
  let h = criarHistorico();
  h = registrar(h, 'A');
  h = registrar(h, 'B');
  let r = desfazer(h, 'C');
  assert.equal(r.foto, 'B');
  r = desfazer(r.hist, 'B');
  assert.equal(r.foto, 'A');
  assert.equal(podeDesfazer(r.hist), false);
  const f = refazer(r.hist, 'A');
  assert.equal(f.foto, 'B');
  assert.equal(podeRefazer(f.hist), true);
});

test('sem passado não desfaz; ação nova apaga o futuro', () => {
  let h = criarHistorico();
  assert.equal(desfazer(h, 'X'), null);
  h = registrar(h, 'A');
  const r = desfazer(h, 'B');
  const h2 = registrar(r.hist, 'A');
  assert.equal(podeRefazer(h2), false);
});

test('guarda no máximo o limite de fotos, as mais recentes', () => {
  let h = criarHistorico(3);
  for (const f of ['1', '2', '3', '4', '5']) h = registrar(h, f);
  assert.deepEqual(h.passado, ['3', '4', '5']);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/historico.test.js`
Expected: FAIL com `Cannot find module ... js/historico.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/historico.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/historico.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add js/historico.js testes/historico.test.js
git commit -m "Histórico: desfazer e refazer por fotos do documento, até 100 passos"
```

### Task 8: A loja (estado da tela)

**Files:**
- Create: `js/loja.js`
- Test: `testes/loja.test.js`

A loja junta documento, seleção e histórico. A ideia central é o **lote**: `comecar()` tira a
foto de antes, as mudanças vão entrando com `trocar()` e `confirmar()` registra **um** passo de
desfazer, se algo mudou. Arrastar é um lote (do apertar ao soltar), e digitar também (até a pessoa
parar por 1 s).

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/loja.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLoja } from '../js/loja.js';

const doc = (...ids) => ({ formas: ids.map((id) => ({ id })), setas: [] });

test('aplicar registra um passo; desfazer e refazer trocam o documento', () => {
  const loja = criarLoja(doc('f1'));
  loja.aplicar(doc('f1', 'f2'));
  assert.equal(loja.doc.formas.length, 2);
  assert.equal(loja.desfazer(), true);
  assert.equal(loja.doc.formas.length, 1);
  assert.equal(loja.refazer(), true);
  assert.equal(loja.doc.formas.length, 2);
  assert.equal(loja.refazer(), false);
});

test('um lote com várias trocas vira um passo só; lote sem mudança não conta', () => {
  const loja = criarLoja(doc());
  loja.comecar();
  loja.trocar(doc('f1'));
  loja.trocar(doc('f1', 'f2'));
  loja.confirmar();
  loja.comecar();
  loja.confirmar();
  loja.desfazer();
  assert.deepEqual(loja.doc, doc());
  assert.equal(loja.podeDesfazer(), false);
});

test('desfazer no meio de um lote fecha o lote antes', () => {
  const loja = criarLoja(doc());
  loja.comecar();
  loja.trocar(doc('f1'));
  assert.equal(loja.podeDesfazer(), true);
  loja.desfazer();
  assert.deepEqual(loja.doc, doc());
});

test('seleção perde o que foi apagado', () => {
  const loja = criarLoja(doc('f1', 'f2'));
  loja.selecionar({ formas: ['f1', 'f2'] });
  loja.aplicar(doc('f2'));
  assert.deepEqual(loja.selecao.formas, ['f2']);
});

test('avisa quem ouve, com o motivo', () => {
  const loja = criarLoja(doc());
  const motivos = [];
  const parar = loja.ouvir((m) => motivos.push(m));
  loja.selecionar({ titulo: true });
  loja.aplicar(doc('f1'));
  parar();
  loja.selecionar({});
  assert.deepEqual(motivos, ['selecao', 'doc', 'historico']);
});

test('carregar outro documento limpa a seleção e pode ser desfeito', () => {
  const loja = criarLoja(doc('f1'));
  loja.selecionar({ formas: ['f1'] });
  loja.carregar(doc('f9'));
  assert.deepEqual(loja.selecao, { formas: [], seta: null, titulo: false });
  loja.desfazer();
  assert.deepEqual(loja.doc, doc('f1'));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/loja.test.js`
Expected: FAIL com `Cannot find module ... js/loja.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/loja.js
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

    // Outro documento inteiro (começar outro, abrir arquivo). Dá para desfazer.
    carregar(novo) {
      loja.confirmar();
      selecao = semSelecao();
      loja.aplicar(novo, 'carregar');
    },
  };
  return loja;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/loja.test.js`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add js/loja.js testes/loja.test.js
git commit -m "Loja: documento, seleção e lotes de desfazer num lugar só"
```

### Task 9: O modelo em branco e a folha vazia

**Files:**
- Create: `js/modelos.js`
- Test: `testes/modelos.test.js`

O modelo repete a página 1 de Curitiba **sem nenhum texto além do título**. As posições foram
pensadas para cada seta sair reta do vértice do losango.

```
        [          caixa larga do topo          ]
[trac. ]      <L1> ──▶ [ branca ]
[branco]       │
[      ]      <L2> ──▶ [ vermelha (D)  ]
[trac. ]       │
[verm. ]      <L3> ──▶ [ amarela (C)   ]
[      ]       │
[trac. ]      <L4> ──▶ [               ]
[amar. ]       │        [ verde (B)     ]
[trac. ]      <L5> ──▶ [               ]
[verde ]       │
[      ]      [       azul (A), larga       ]
```

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/modelos.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeloDengue, folhaVazia } from '../js/modelos.js';
import { documentoVazio, normalizarForma, sobrepoe, formaPorId } from '../js/modelo.js';
import { tamanhoFolha, MARGEM } from '../js/paleta.js';
import { tracarSeta } from '../js/setas.js';

test('modelo: só o título vem escrito; 15 formas e 11 setas', () => {
  const d = modeloDengue();
  assert.deepEqual(d.titulo, { texto: 'Fluxo de atendimento – Dengue', cor: 'rosa' });
  assert.equal(d.formas.length, 15);
  assert.equal(d.setas.length, 11);
  assert.equal(d.formas.every((f) => f.texto === ''), true);
  assert.equal(d.setas.every((s) => s.texto === ''), true);
});

test('modelo: toda forma já está normalizada e dentro da área útil da folha', () => {
  const d = modeloDengue();
  const folha = tamanhoFolha(d.folha.orientacao);
  for (const f of d.formas) {
    assert.deepEqual(normalizarForma(f), f);
    assert.ok(f.x >= MARGEM && f.y >= MARGEM, f.id);
    assert.ok(f.x + f.l <= folha.largura - MARGEM && f.y + f.a <= folha.altura - MARGEM, f.id);
  }
});

test('modelo: nenhuma forma encosta em outra', () => {
  const { formas } = modeloDengue();
  for (let i = 0; i < formas.length; i++) {
    for (let j = i + 1; j < formas.length; j++) {
      assert.equal(sobrepoe(formas[i], formas[j]), false, `${formas[i].id} × ${formas[j].id}`);
    }
  }
});

test('modelo: toda seta liga formas que existem e sai reta (dois pontos)', () => {
  const d = modeloDengue();
  for (const s of d.setas) {
    const de = formaPorId(d, s.de);
    const para = formaPorId(d, s.para);
    assert.ok(de && para, s.id);
    assert.equal(tracarSeta(de, para).pontos.length, 2, s.id);
  }
});

test('cada chamada devolve um documento novo; folha vazia = documento vazio', () => {
  const a = modeloDengue();
  a.formas[0].texto = 'mexi';
  assert.equal(modeloDengue().formas[0].texto, '');
  assert.deepEqual(folhaVazia(), documentoVazio());
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/modelos.test.js`
Expected: FAIL com `Cannot find module ... js/modelos.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/modelos.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/modelos.test.js`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add js/modelos.js testes/modelos.test.js
git commit -m "Modelos: estrutura da página 1 de Curitiba em branco, e a folha vazia"
```

### Task 10: Arquivo (validar, salvar, abrir, guardar no navegador)

**Files:**
- Create: `js/arquivo.js`
- Test: `testes/arquivo.test.js`

- [ ] **Step 1: Escrever o teste**

```js arquivo=testes/arquivo.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarDocumento, lerJson, serializar, nomeDoArquivo } from '../js/arquivo.js';
import { modeloDengue } from '../js/modelos.js';

const INVALIDO = 'Este arquivo não é de um fluxograma feito aqui.';

test('documento bom passa inteiro, ida e volta', () => {
  const d = modeloDengue();
  const r = lerJson(serializar(d));
  assert.equal(r.ok, true);
  assert.deepEqual(r.doc, d);
});

test('recusa o que não é fluxograma daqui', () => {
  for (const lixo of [null, 'texto', {}, { app: 'outro', versao: 1 }]) {
    assert.deepEqual(validarDocumento(lixo), { ok: false, erro: INVALIDO });
  }
  assert.match(validarDocumento({ app: 'fluxograma-facil', versao: 2 }).erro, /versão mais nova/);
  assert.deepEqual(lerJson('{isto não é json'), { ok: false, erro: INVALIDO });
});

test('conserta: campos estranhos, formas quebradas, ids repetidos e setas soltas saem', () => {
  const r = validarDocumento({
    app: 'fluxograma-facil', versao: 1, extra: 'x',
    titulo: { texto: 'T', cor: 'dourado' }, folha: { orientacao: 'deitada' },
    formas: [
      { id: 'f1', tipo: 'retangulo', x: 100, y: 100, virus: true },
      { id: 'f1', tipo: 'losango', x: 300, y: 300 },
      { id: 'f2', tipo: 'estrela' },
      { id: 'f3', tipo: 'circulo', x: 5000, y: -50 },
    ],
    setas: [
      { id: 's1', de: 'f1', para: 'f3' },
      { id: 's2', de: 'f1', para: 'f3' },
      { id: 's3', de: 'f1', para: 'f9' },
      { id: 's4', de: 'f3', para: 'f3' },
      { id: 'f1', de: 'f3', para: 'f1' },
    ],
  });
  assert.equal(r.ok, true);
  assert.equal('extra' in r.doc, false);
  assert.deepEqual(r.doc.titulo, { texto: 'T', cor: 'cinza' });
  assert.equal(r.doc.folha.orientacao, 'retrato');
  assert.deepEqual(r.doc.formas.map((f) => f.id), ['f1', 'f3']);
  assert.equal('virus' in r.doc.formas[0], false);
  assert.deepEqual([r.doc.formas[1].x, r.doc.formas[1].y], [794 - 30 - 110, 30]);
  assert.deepEqual(r.doc.setas.map((s) => s.id), ['s1']);
});

test('nome do arquivo: sem caracteres proibidos no Windows, até 60 letras', () => {
  assert.equal(nomeDoArquivo('Fluxo: dengue/2026?'), 'Fluxograma - Fluxo dengue2026.json');
  assert.equal(nomeDoArquivo('   '), 'Fluxograma.json');
  assert.equal(nomeDoArquivo('x'.repeat(100)), `Fluxograma - ${'x'.repeat(60)}.json`);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test testes/arquivo.test.js`
Expected: FAIL com `Cannot find module ... js/arquivo.js`.

- [ ] **Step 3: Implementar**

```js arquivo=js/arquivo.js
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node --test testes/arquivo.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Rodar todos os testes e fazer o commit**

Run: `node --test`
Expected: PASS em todos os arquivos (paleta, geometria, setas, encaixe, modelo, historico, loja, modelos, arquivo).

```bash
git add js/arquivo.js testes/arquivo.test.js
git commit -m "Arquivo: validar e consertar o que vem de fora, nome do arquivo, guardar e abrir"
```

### Task 11: A casca da tela (HTML e CSS)

**Files:**
- Create: `index.html`, `estilo.css`

Não há teste automático para esta tarefa: ela é conferida no navegador nas Tasks 15 e 16.

- [ ] **Step 1: Gravar o `index.html`**

```html arquivo=index.html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fluxograma Fácil</title>
<meta name="description" content="Monte o fluxograma do seu município de um jeito fácil: formas, setas e texto, pronto para imprimir.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a5fb4'/%3E%3Cpath d='M16 5l7 7-7 7-7-7z' fill='%23fff'/%3E%3Cpath d='M16 19v6m-3-3 3 3 3-3' stroke='%23fff' stroke-width='2' fill='none'/%3E%3C/svg%3E">
<link rel="preload" href="fontes/sourcesans3-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fontes/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="estilo.css">
<style id="estilo-pagina">@page { size: A4 portrait; margin: 0; }</style>
</head>
<body>
<header class="barra">
  <div class="marca">
    <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1a5fb4"/><path d="M16 5l7 7-7 7-7-7z" fill="#fff"/><path d="M16 19v6m-3-3 3 3 3-3" stroke="#fff" stroke-width="2" fill="none"/></svg>
    <span>Fluxograma Fácil</span>
  </div>
  <div class="barra-botoes">
    <button id="bt-desfazer" class="bt" title="Desfazer (Ctrl+Z)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/></svg>Desfazer</button>
    <button id="bt-refazer" class="bt" title="Refazer (Ctrl+Y)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/></svg>Refazer</button>
    <span class="separador"></span>
    <button id="bt-salvar" class="bt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 19h16"/></svg>Salvar no computador</button>
    <button id="bt-abrir" class="bt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h6l2 2h10v10H3zM3 7V5h6"/></svg>Abrir</button>
    <button id="bt-imprimir" class="bt bt-destaque"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>Imprimir ou PDF</button>
    <span class="separador"></span>
    <button id="bt-novo" class="bt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM12 11v6m-3-3h6"/></svg>Começar outro</button>
    <button id="bt-ajuda" class="bt"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/></svg>Ajuda</button>
  </div>
  <div id="status" class="status" role="status"></div>
  <input type="file" id="entrada-arquivo" accept=".json,application/json" hidden>
</header>

<div id="faixa" class="faixa" hidden>
  <span id="faixa-texto"></span>
  <button id="faixa-cancelar" class="bt">Cancelar</button>
</div>
<div id="aviso" class="aviso" role="alert" hidden></div>
<div class="aviso-tela">Para montar o fluxograma, use um computador. Aqui dá para ver e imprimir.</div>

<main class="area">
  <nav class="paleta" aria-label="Pôr na folha">
    <h2>Pôr na folha</h2>
    <button class="bt-forma" data-tipo="retangulo"><svg viewBox="0 0 40 28" aria-hidden="true"><rect x="3" y="4" width="34" height="20"/></svg><span>Retângulo</span></button>
    <button class="bt-forma" data-tipo="arredondado"><svg viewBox="0 0 40 28" aria-hidden="true"><rect x="3" y="4" width="34" height="20" rx="7"/></svg><span>Arredondado</span></button>
    <button class="bt-forma" data-tipo="losango"><svg viewBox="0 0 40 28" aria-hidden="true"><path d="M20 2 38 14 20 26 2 14z"/></svg><span>Losango</span></button>
    <button class="bt-forma" data-tipo="circulo"><svg viewBox="0 0 40 28" aria-hidden="true"><ellipse cx="20" cy="14" rx="16" ry="11"/></svg><span>Círculo</span></button>
    <button class="bt-forma" data-tipo="texto"><svg viewBox="0 0 40 28" aria-hidden="true"><path d="M11 7h18M20 7v15"/></svg><span>Texto</span></button>
    <button class="bt-forma" id="bt-seta"><svg viewBox="0 0 40 28" aria-hidden="true"><path d="M4 14h30m-7-7 7 7-7 7"/></svg><span>Seta</span></button>
    <hr>
    <button class="bt-forma" id="bt-folha"><svg viewBox="0 0 40 28" aria-hidden="true"><rect x="8" y="2" width="24" height="24" rx="2"/><path d="M13 20l7-7 7 7"/></svg><span id="bt-folha-texto">Deitar a folha</span></button>
  </nav>

  <section class="palco" id="palco">
    <div class="folha-caixa" id="folha-caixa">
      <div class="folha retrato com-grade" id="folha">
        <svg class="camada-setas" id="camada-setas" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="titulo" id="titulo"><div class="titulo-texto" id="titulo-texto" spellcheck="true"></div></div>
        <div class="camada-formas" id="camada-formas"></div>
        <div class="camada-rotulos" id="camada-rotulos"></div>
        <div class="camada-controles" id="camada-controles"></div>
      </div>
    </div>
  </section>

  <aside class="painel" id="painel" aria-label="Forma escolhida"></aside>
</main>

<div id="inicio" class="cobertura" hidden>
  <div class="cartao cartao-inicio">
    <h1>Fluxograma Fácil</h1>
    <p>Monte o fluxograma do seu município: formas, setas e texto, pronto para imprimir.</p>
    <div class="escolhas">
      <button id="ini-modelo" class="escolha">
        <svg viewBox="0 0 120 150" aria-hidden="true"><rect x="10" y="6" width="100" height="12" rx="3" fill="#F8D3E1" stroke="#C2507A"/><path d="M60 26l14 9-14 9-14-9z" fill="#fff" stroke="#5F6368"/><path d="M60 56l14 9-14 9-14-9z" fill="#F9CFCF" stroke="#C43D3D"/><path d="M60 86l14 9-14 9-14-9z" fill="#FFF1BF" stroke="#C79A00"/><rect x="82" y="58" width="30" height="16" rx="3" fill="#F9CFCF" stroke="#C43D3D"/><rect x="82" y="88" width="30" height="16" rx="3" fill="#FFF1BF" stroke="#C79A00"/><rect x="8" y="30" width="28" height="50" rx="3" fill="#fff" stroke="#5F6368" stroke-dasharray="3 2"/><rect x="46" y="116" width="66" height="26" rx="3" fill="#D6E6F7" stroke="#3B78B8"/></svg>
        <strong>Começar com o modelo</strong>
        <span>As formas já vêm no lugar, em branco. É só escrever.</span>
      </button>
      <button id="ini-vazia" class="escolha">
        <svg viewBox="0 0 120 150" aria-hidden="true"><rect x="10" y="6" width="100" height="12" rx="3" fill="#ECEFF1" stroke="#78909C"/><rect x="10" y="26" width="100" height="118" rx="3" fill="#fff" stroke="#c7ccd1" stroke-dasharray="4 3"/></svg>
        <strong>Começar com a folha vazia</strong>
        <span>Só o título. Você põe as formas que quiser.</span>
      </button>
    </div>
    <button id="ini-abrir" class="bt-link">Abrir um fluxograma salvo no computador</button>
    <button id="ini-voltar" class="bt-link" hidden>Voltar para o fluxograma que estava aberto</button>
  </div>
</div>

<div id="dialogo" class="cobertura" hidden>
  <div class="cartao cartao-dialogo" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
    <h2 id="dialogo-titulo"></h2>
    <div id="dialogo-corpo" class="dialogo-corpo"></div>
    <div id="dialogo-botoes" class="dialogo-botoes"></div>
  </div>
</div>

<script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Gravar o `estilo.css`**

```css arquivo=estilo.css
/* Fluxograma Fácil — aparência da tela e da impressão.
   Público: gente com dificuldade no computador. Por isso botões grandes, com
   desenho E nome, letra de 15 px para cima, e nada que apareça só ao passar o mouse. */

@font-face { font-family: 'Archivo'; font-style: normal; font-weight: 600 700; font-display: block;
  src: url(fontes/archivo-latin.woff2) format('woff2'); }
@font-face { font-family: 'Source Sans 3'; font-style: normal; font-weight: 400 600; font-display: block;
  src: url(fontes/sourcesans3-latin.woff2) format('woff2'); }

:root {
  --azul: #1a5fb4; --azul-claro: #e3edfb; --azul-forte: #134a8e;
  --texto: #1f2328; --texto-2: #57606a; --linha: #d0d7de; --fundo: #f3f5f8; --palco: #e4e8ee;
  --perigo: #b42318; --aviso: #fff4ce; --ok: #1a7f37;
  --zoom: 1;
  font-family: 'Source Sans 3', 'Segoe UI', Arial, sans-serif;
  color: var(--texto);
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body { display: flex; flex-direction: column; background: var(--fundo); font-size: 16px; overflow: hidden; }
button { font: inherit; color: inherit; }
[hidden] { display: none !important; }

/* ---------- Barra do alto ---------- */
.barra { display: flex; align-items: center; gap: 12px; padding: 8px 14px; background: #fff;
  border-bottom: 1px solid var(--linha); flex-wrap: wrap; }
.marca { display: flex; align-items: center; gap: 8px; font-family: 'Archivo', sans-serif; font-weight: 700;
  font-size: 18px; color: var(--azul-forte); white-space: nowrap; }
.marca svg { width: 28px; height: 28px; }
.barra-botoes { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.separador { width: 1px; height: 28px; background: var(--linha); margin: 0 4px; }
.bt { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 6px 12px;
  border: 1px solid var(--linha); border-radius: 8px; background: #fff; cursor: pointer; font-size: 15px; }
.bt svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round; }
.bt:hover { background: var(--azul-claro); border-color: var(--azul); }
.bt:disabled { opacity: .4; cursor: default; background: #fff; border-color: var(--linha); }
.bt-destaque { background: var(--azul); border-color: var(--azul); color: #fff; }
.bt-destaque:hover { background: var(--azul-forte); }
.status { margin-left: auto; font-size: 14px; color: var(--ok); white-space: nowrap; }
.status.ruim { color: var(--perigo); }

.faixa { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 10px 16px;
  background: #fde68a; font-size: 18px; font-weight: 600; }
.aviso { padding: 10px 16px; background: var(--aviso); border-bottom: 1px solid #e3c567; font-size: 16px; text-align: center; }
.aviso-tela { display: none; }

/* ---------- Área de trabalho ---------- */
.area { flex: 1; min-height: 0; display: grid; grid-template-columns: 150px minmax(0, 1fr) 260px; }

.paleta { background: #fff; border-right: 1px solid var(--linha); padding: 12px 10px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 8px; }
.paleta h2, .painel h2 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: var(--texto-2);
  text-transform: uppercase; letter-spacing: .04em; }
.paleta hr { width: 100%; border: 0; border-top: 1px solid var(--linha); margin: 6px 0; }
.bt-forma { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px;
  border: 1px solid var(--linha); border-radius: 10px; background: #fff; cursor: pointer; font-size: 15px; }
.bt-forma svg { width: 44px; height: 30px; fill: #fff; stroke: #3d4650; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round; }
.bt-forma:hover { background: var(--azul-claro); border-color: var(--azul); }
.bt-forma.ativo { background: #fde68a; border-color: #b7791f; }

.palco { overflow: auto; background: var(--palco); padding: 24px; }
.folha-caixa { position: relative; margin: 0 auto; }

.folha { position: absolute; left: 0; top: 0; background: #fff; transform-origin: 0 0;
  transform: scale(var(--zoom)); box-shadow: 0 2px 10px rgba(0, 0, 0, .18); overflow: hidden; }
.folha.retrato { width: 794px; height: 1123px; }
.folha.paisagem { width: 1123px; height: 794px; }
.folha.com-grade { background-image:
  linear-gradient(to right, rgba(0, 0, 0, .045) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(0, 0, 0, .045) 1px, transparent 1px);
  background-size: 20px 20px; }
.folha::after { content: ''; position: absolute; inset: 30px; border: 1px dashed rgba(0, 0, 0, .12);
  pointer-events: none; }

.camada-setas, .camada-formas, .camada-rotulos, .camada-controles { position: absolute; inset: 0; }
.camada-setas { overflow: visible; pointer-events: none; }
.camada-formas, .camada-rotulos, .camada-controles { pointer-events: none; }

/* ---------- Formas ---------- */
.forma { position: absolute; pointer-events: auto; cursor: pointer; }
.forma .contorno { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.texto-caixa { position: absolute; display: flex; align-items: center; justify-content: center; }
.texto { width: 100%; outline: none; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.25;
  color: #1d1d1d; text-align: center; cursor: text; min-height: 1.25em; }
.forma.esquerda .texto { text-align: left; }
.forma.negrito .texto { font-weight: 600; }
.forma.vazia:not(.editando) .texto-caixa::after { content: 'Clique e escreva'; position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; text-align: center; color: #8a9099;
  font-size: 13px; pointer-events: none; }
.forma.tipo-texto:not(.selecionada):not(.editando):not(.fora) { outline: 1px dashed #c3c9d0; }
.forma.selecionada { outline: 2px dashed var(--azul); outline-offset: 5px; }
.forma.editando { outline: 2px solid var(--azul); outline-offset: 5px; }
.forma.fora { outline: 3px solid var(--perigo); outline-offset: 3px; }
.folha.arrastando .forma { cursor: grabbing; }
.folha.modo-seta .forma { cursor: crosshair; }
.folha.modo-seta .forma:hover { outline: 3px solid #f59e0b; outline-offset: 4px; }
.forma.origem-seta { outline: 3px solid #d97706; outline-offset: 4px; }

/* ---------- Título ---------- */
.titulo { position: absolute; left: 30px; right: 30px; top: 30px; min-height: 50px; padding: 8px 18px;
  display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 2px solid;
  cursor: text; }
.titulo-texto { width: 100%; outline: none; text-align: center; font-family: 'Archivo', sans-serif;
  font-weight: 700; font-size: 22px; line-height: 1.2; color: #1d1d1d; }
.titulo.vazio .titulo-texto::before { content: 'Clique e escreva o título'; color: #8a9099; font-weight: 600; }
.titulo.selecionado { outline: 2px solid var(--azul); outline-offset: 4px; }

/* ---------- Setas ---------- */
.seta-alvo { fill: none; stroke: #000; stroke-opacity: 0; stroke-width: 16; pointer-events: stroke; cursor: pointer; }
.seta-linha { fill: none; stroke: #2b2f33; stroke-width: 2; }
.seta.selecionada .seta-linha { stroke: var(--azul); stroke-width: 3; }
.rotulo { position: absolute; transform: translate(-50%, -50%); padding: 0 4px; background: #fff; border-radius: 3px;
  font-weight: 600; font-size: 13px; line-height: 1.3; white-space: nowrap; pointer-events: auto; cursor: pointer; }
.rotulo.selecionado { color: var(--azul); outline: 2px solid var(--azul); }

/* ---------- Controles (tamanho constante na tela, qualquer que seja o zoom) ---------- */
.ctl-mais, .ctl-alca { position: absolute; pointer-events: auto;
  transform: translate(-50%, -50%) scale(calc(1 / var(--zoom))); }
.ctl-mais { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #fff; background: var(--azul);
  color: #fff; font-size: 22px; line-height: 25px; text-align: center; cursor: pointer; padding: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .3); }
.ctl-mais:hover { background: var(--azul-forte); }
.ctl-alca { width: 16px; height: 16px; background: #fff; border: 3px solid var(--azul); border-radius: 3px; }
.ctl-alca[data-canto='no'], .ctl-alca[data-canto='se'] { cursor: nwse-resize; }
.ctl-alca[data-canto='ne'], .ctl-alca[data-canto='so'] { cursor: nesw-resize; }
.guia { position: absolute; background: #e8590c; pointer-events: none; }
.laco { position: absolute; border: 1px dashed var(--azul); background: rgba(26, 95, 180, .08); pointer-events: none; }

/* ---------- Painel da direita ---------- */
.painel { background: #fff; border-left: 1px solid var(--linha); padding: 14px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px; font-size: 15px; }
.painel .dica { color: var(--texto-2); line-height: 1.5; margin: 0; }
.painel .grupo { display: flex; flex-direction: column; gap: 6px; }
.painel .rotulo-grupo { font-weight: 600; }
.painel .linha { display: flex; gap: 6px; flex-wrap: wrap; }
.cores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.cor { height: 36px; border-radius: 8px; border: 2px solid; cursor: pointer; font-size: 13px; }
.cor.ativo { box-shadow: 0 0 0 3px var(--azul); }
.opcao { min-height: 38px; padding: 4px 10px; border: 1px solid var(--linha); border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 15px; }
.opcao:hover { border-color: var(--azul); background: var(--azul-claro); }
.opcao.ativo { border: 2px solid var(--azul); background: var(--azul-claro); font-weight: 600; }
.opcao svg { width: 30px; height: 22px; fill: #fff; stroke: #3d4650; stroke-width: 2; vertical-align: middle; }
.opcao.perigo { color: var(--perigo); border-color: #f1b5ae; }
.opcao.perigo:hover { background: #fdecea; }
.painel input[type='text'] { width: 100%; min-height: 38px; padding: 4px 8px; border: 1px solid var(--linha);
  border-radius: 8px; font: inherit; }
.painel .alerta { background: #fdecea; color: var(--perigo); padding: 8px 10px; border-radius: 8px; line-height: 1.4; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- Coberturas: tela inicial e diálogos ---------- */
.cobertura { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  background: rgba(20, 28, 38, .5); padding: 16px; }
.cartao { background: #fff; border-radius: 16px; padding: 28px; max-width: 760px; width: 100%;
  max-height: 100%; overflow: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, .3); }
.cartao h1 { margin: 0 0 6px; font-family: 'Archivo', sans-serif; font-size: 28px; color: var(--azul-forte); }
.cartao h2 { margin: 0 0 12px; font-family: 'Archivo', sans-serif; font-size: 22px; }
.cartao p { margin: 0 0 18px; font-size: 17px; line-height: 1.5; color: var(--texto-2); }
.escolhas { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.escolha { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px; text-align: center;
  border: 2px solid var(--linha); border-radius: 14px; background: #fff; cursor: pointer; }
.escolha:hover { border-color: var(--azul); background: var(--azul-claro); }
.escolha svg { width: 110px; height: 136px; }
.escolha strong { font-size: 19px; }
.escolha span { color: var(--texto-2); font-size: 15px; line-height: 1.4; }
.bt-link { background: none; border: 0; color: var(--azul); text-decoration: underline; cursor: pointer;
  font-size: 16px; padding: 6px 0; }
.cartao-dialogo { max-width: 560px; }
.dialogo-corpo { font-size: 17px; line-height: 1.5; margin-bottom: 20px; }
.dialogo-corpo ol { padding-left: 22px; margin: 0; }
.dialogo-corpo li { margin-bottom: 10px; }
.dialogo-botoes { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
.dialogo-botoes .bt { min-height: 44px; font-size: 16px; }

/* ---------- Tela estreita ---------- */
@media (max-width: 899px) {
  body { overflow: auto; }
  .aviso-tela { display: block; padding: 10px 16px; background: var(--aviso); text-align: center; }
  .area { display: flex; flex-direction: column; }
  .paleta { flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--linha); }
  .paleta h2, .paleta hr { display: none; }
  .bt-forma { min-width: 96px; }
  .palco { min-height: 70vh; padding: 12px; }
  .painel { border-left: 0; border-top: 1px solid var(--linha); }
  .escolhas { grid-template-columns: 1fr; }
}

/* ---------- Impressão: só a folha, em tamanho real ---------- */
@media print {
  html, body { height: auto; overflow: visible; background: #fff; display: block; }
  .barra, .faixa, .aviso, .aviso-tela, .paleta, .painel, .cobertura, .camada-controles { display: none !important; }
  .area { display: block; }
  .palco { overflow: visible; padding: 0; background: none; }
  .folha-caixa { width: auto !important; height: auto !important; margin: 0; }
  .folha { position: relative; transform: none !important; box-shadow: none; background: #fff !important; }
  .folha::after { display: none; }
  /* 1 mm a menos que o papel: evita a folha em branco a mais que alguns navegadores soltam por arredondamento */
  .folha.retrato { width: 210mm; height: 296mm; }
  .folha.paisagem { width: 297mm; height: 209mm; }
  .forma, .titulo { outline: none !important; }
  .forma.vazia .texto-caixa::after, .titulo.vazio .titulo-texto::before { content: none !important; }
  .titulo.vazio { visibility: hidden; }
  .seta.selecionada .seta-linha { stroke: #2b2f33; stroke-width: 2; }
  .rotulo.selecionado { color: inherit; outline: none; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html estilo.css
git commit -m "Casca da tela: barra, formas, folha A4, painel e impressão"
```

### Task 12: Desenhar o documento na folha

**Files:**
- Create: `js/desenho.js`

O desenho não decide nada: recebe o documento e o "estado da tela" e reflete os dois na página.
O estado da tela é `{ selecao, editandoId, editandoTitulo, modoSeta, guias, laco, arrastando }`.
Uma regra importante: **o texto da forma que está sendo editada nunca é reescrito pelo desenho**.
Reescrever faria o cursor pular para o começo no meio da digitação. Pelo mesmo motivo, as formas só
são reordenadas quando a ordem mudou de fato, porque mover o nó tira o foco dele.

- [ ] **Step 1: Gravar o módulo**

```js arquivo=js/desenho.js
// Desenha o documento na folha: formas, setas, rótulos, título e controles.
// Só reflete o estado; quem decide o que muda é interacao.js e painel.js.
import { CORES, MARGEM, tamanhoFolha } from './paleta.js';
import { caixaDoTexto, contorno } from './geometria.js';
import { tracarSeta, caminhoSvg, encurtarFim } from './setas.js';
import { formaPorId } from './modelo.js';

const NS = 'http://www.w3.org/2000/svg';
const PONTA = 8; // quanto a linha recua para a ponta da seta caber

export function criarDesenho(el) {
  const elementos = new Map(); // id → { raiz, svg, caixa, texto, assinatura }
  let zoom = 1;

  function ajustarFolha(doc) {
    const f = tamanhoFolha(doc.folha.orientacao);
    const disponivel = el.palco.clientWidth - 48;
    zoom = Math.min(1.2, Math.max(0.5, disponivel / f.largura));
    document.documentElement.style.setProperty('--zoom', String(zoom));
    el.caixa.style.width = `${f.largura * zoom}px`;
    el.caixa.style.height = `${f.altura * zoom}px`;
    el.folha.classList.toggle('retrato', doc.folha.orientacao !== 'paisagem');
    el.folha.classList.toggle('paisagem', doc.folha.orientacao === 'paisagem');
    el.setas.setAttribute('viewBox', `0 0 ${f.largura} ${f.altura}`);
    el.setas.setAttribute('width', f.largura);
    el.setas.setAttribute('height', f.altura);
  }

  function novoElemento(id) {
    const raiz = document.createElement('div');
    raiz.className = 'forma';
    raiz.dataset.id = id;
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('contorno');
    const caixa = document.createElement('div');
    caixa.className = 'texto-caixa';
    const texto = document.createElement('div');
    texto.className = 'texto';
    texto.spellcheck = true;
    caixa.appendChild(texto);
    raiz.append(svg, caixa);
    return { raiz, svg, caixa, texto, assinatura: '' };
  }

  function atualizarElemento(e, f, estado, folha) {
    const cor = CORES[f.cor] || CORES.branco;
    const s = e.raiz.style;
    s.left = `${f.x}px`;
    s.top = `${f.y}px`;
    s.width = `${f.l}px`;
    s.height = `${f.a}px`;
    const assinatura = [f.tipo, f.l, f.a, f.cor, f.borda].join('|');
    if (assinatura !== e.assinatura) {
      e.assinatura = assinatura;
      e.svg.setAttribute('viewBox', `0 0 ${f.l} ${f.a}`);
      e.svg.replaceChildren();
      const c = contorno(f);
      if (c) {
        const n = document.createElementNS(NS, c.tag);
        for (const [k, v] of Object.entries(c.attrs)) n.setAttribute(k, v);
        n.setAttribute('fill', cor.fundo);
        n.setAttribute('stroke', cor.borda);
        n.setAttribute('stroke-width', '2');
        if (f.borda === 'tracejada') n.setAttribute('stroke-dasharray', '8 5');
        e.svg.appendChild(n);
      }
      const cx = caixaDoTexto(f);
      Object.assign(e.caixa.style, { left: `${cx.x}px`, top: `${cx.y}px`, width: `${cx.l}px`, height: `${cx.a}px` });
    }
    e.texto.style.fontSize = `${f.letra}px`;
    const editando = estado.editandoId === f.id;
    if (!editando && e.texto.textContent !== f.texto) e.texto.textContent = f.texto;
    const fora = f.x + f.l > folha.largura - MARGEM + 1 || f.y + f.a > folha.altura - MARGEM + 1;
    const cl = e.raiz.classList;
    cl.toggle('vazia', f.texto === '');
    cl.toggle('esquerda', f.alinhar === 'esquerda');
    cl.toggle('negrito', f.negrito);
    cl.toggle('selecionada', estado.selecao.formas.includes(f.id) && !editando);
    cl.toggle('editando', editando);
    cl.toggle('fora', fora);
    cl.toggle('origem-seta', !!(estado.modoSeta && estado.modoSeta.de === f.id));
    for (const t of ['retangulo', 'arredondado', 'losango', 'circulo', 'texto']) cl.toggle(`tipo-${t}`, f.tipo === t);
  }

  function desenharFormas(doc, estado) {
    const folha = tamanhoFolha(doc.folha.orientacao);
    const vivos = new Set();
    const ordem = [];
    for (const f of doc.formas) {
      let e = elementos.get(f.id);
      if (!e) {
        e = novoElemento(f.id);
        elementos.set(f.id, e);
        el.formas.appendChild(e.raiz);
      }
      atualizarElemento(e, f, estado, folha);
      vivos.add(f.id);
      ordem.push(e.raiz);
    }
    for (const [id, e] of elementos) {
      if (!vivos.has(id)) {
        e.raiz.remove();
        elementos.delete(id);
      }
    }
    const filhos = el.formas.children;
    if (ordem.some((n, i) => filhos[i] !== n)) for (const n of ordem) el.formas.appendChild(n);
  }

  function marcador(id, cor) {
    const m = document.createElementNS(NS, 'marker');
    for (const [k, v] of Object.entries({
      id, viewBox: '0 0 10 10', refX: '2', refY: '5', markerWidth: '10', markerHeight: '10',
      markerUnits: 'userSpaceOnUse', orient: 'auto',
    })) m.setAttribute(k, v);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M0,0 L10,5 L0,10 z');
    p.setAttribute('fill', cor);
    m.appendChild(p);
    return m;
  }

  function desenharSetas(doc, estado) {
    const defs = document.createElementNS(NS, 'defs');
    defs.append(marcador('ponta', '#2b2f33'), marcador('ponta-sel', '#1a5fb4'));
    const itens = [defs];
    const rotulos = [];
    for (const s of doc.setas) {
      const de = formaPorId(doc, s.de);
      const para = formaPorId(doc, s.para);
      if (!de || !para) continue;
      const t = tracarSeta(de, para, s);
      const escolhida = estado.selecao.seta === s.id;
      const g = document.createElementNS(NS, 'g');
      g.classList.add('seta');
      if (escolhida) g.classList.add('selecionada');
      g.dataset.id = s.id;
      const alvo = document.createElementNS(NS, 'path');
      alvo.classList.add('seta-alvo');
      alvo.setAttribute('d', caminhoSvg(t.pontos));
      const linha = document.createElementNS(NS, 'path');
      linha.classList.add('seta-linha');
      linha.setAttribute('d', caminhoSvg(encurtarFim(t.pontos, PONTA)));
      linha.setAttribute('marker-end', `url(#${escolhida ? 'ponta-sel' : 'ponta'})`);
      g.append(alvo, linha);
      itens.push(g);
      if (s.texto) {
        const r = document.createElement('div');
        r.className = escolhida ? 'rotulo selecionado' : 'rotulo';
        r.dataset.seta = s.id;
        r.textContent = s.texto;
        r.style.left = `${t.rotulo.x}px`;
        r.style.top = `${t.rotulo.y}px`;
        rotulos.push(r);
      }
    }
    el.setas.replaceChildren(...itens);
    el.rotulos.replaceChildren(...rotulos);
  }

  function desenharTitulo(doc, estado) {
    const cor = CORES[doc.titulo.cor] || CORES.cinza;
    el.titulo.style.background = cor.fundo;
    el.titulo.style.borderColor = cor.borda;
    el.titulo.classList.toggle('vazio', doc.titulo.texto === '' && !estado.editandoTitulo);
    el.titulo.classList.toggle('selecionado', estado.selecao.titulo && !estado.editandoTitulo);
    if (!estado.editandoTitulo && el.tituloTexto.textContent !== doc.titulo.texto) {
      el.tituloTexto.textContent = doc.titulo.texto;
    }
  }

  function bloco(classe, x, y, props = {}) {
    const n = document.createElement(props.tag || 'div');
    n.className = classe;
    n.style.left = `${x}px`;
    n.style.top = `${y}px`;
    if (props.l !== undefined) n.style.width = `${props.l}px`;
    if (props.a !== undefined) n.style.height = `${props.a}px`;
    return n;
  }

  function desenharControles(doc, estado) {
    const itens = [];
    const sel = estado.selecao.formas;
    if (sel.length === 1 && !estado.modoSeta && !estado.arrastando) {
      const f = formaPorId(doc, sel[0]);
      if (f) {
        const d = 26 / zoom; // distância constante na tela
        const mais = {
          cima: [f.x + f.l / 2, f.y - d], baixo: [f.x + f.l / 2, f.y + f.a + d],
          esquerda: [f.x - d, f.y + f.a / 2], direita: [f.x + f.l + d, f.y + f.a / 2],
        };
        for (const [lado, [x, y]] of Object.entries(mais)) {
          const b = bloco('ctl-mais', x, y, { tag: 'button' });
          b.type = 'button';
          b.dataset.lado = lado;
          b.title = 'Criar outra forma ligada aqui';
          b.setAttribute('aria-label', `Criar outra forma ligada, ${lado}`);
          b.textContent = '+';
          itens.push(b);
        }
        const cantos = { no: [f.x, f.y], ne: [f.x + f.l, f.y], so: [f.x, f.y + f.a], se: [f.x + f.l, f.y + f.a] };
        for (const [canto, [x, y]] of Object.entries(cantos)) {
          const a = bloco('ctl-alca', x, y);
          a.dataset.canto = canto;
          a.title = 'Puxe para mudar o tamanho';
          itens.push(a);
        }
      }
    }
    const fino = 1.5 / zoom;
    for (const g of estado.guias || []) {
      const vertical = g.x1 === g.x2;
      itens.push(bloco('guia', g.x1, g.y1, vertical ? { l: fino, a: g.y2 - g.y1 } : { l: g.x2 - g.x1, a: fino }));
    }
    if (estado.laco) {
      const { x, y, l, a } = estado.laco;
      itens.push(bloco('laco', x, y, { l, a }));
    }
    el.controles.replaceChildren(...itens);
  }

  return {
    get zoom() { return zoom; },
    tudo(doc, estado) {
      ajustarFolha(doc);
      desenharTitulo(doc, estado);
      desenharFormas(doc, estado);
      desenharSetas(doc, estado);
      desenharControles(doc, estado);
      el.folha.classList.toggle('modo-seta', !!estado.modoSeta);
      el.folha.classList.toggle('arrastando', !!estado.arrastando);
    },
    // Ponto do mouse em pixels da folha.
    paraFolha(ev) {
      const r = el.folha.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / zoom, y: (ev.clientY - r.top) / zoom };
    },
    textoDe(id) {
      const e = elementos.get(id);
      return e ? e.texto : null;
    },
    alturaDoTexto(id) {
      const e = elementos.get(id);
      return e ? e.texto.scrollHeight : 0;
    },
  };
}
```

- [ ] **Step 2: Acrescentar ao `estilo.css` a moldura de tela do tipo "texto"** (sem contorno, ele
  ficaria invisível enquanto vazio). Isso já está incluído na versão final do `estilo.css` da Task 11:
  a regra `.forma.tipo-texto:not(.selecionada):not(.editando):not(.fora)`.

- [ ] **Step 3: Commit**

```bash
git add js/desenho.js estilo.css
git commit -m "Desenho: formas, setas com ponta, rótulos, título e controles na folha"
```

### Task 13: Mouse e teclado na folha

**Files:**
- Create: `js/interacao.js`

As regras do desenho aprovado, na ordem em que o `pointerdown` as testa:

1. **"+"** cria forma ligada (no soltar).
2. **Alça** redimensiona.
3. **Rótulo ou seta** escolhe a seta.
4. **Forma:**
   - no modo seta, é origem ou destino;
   - se o cursor já está no texto dela, o navegador cuida;
   - com Shift, põe ou tira da seleção;
   - senão, **clicar escreve e arrastar move** (4 px de tolerância).
5. **Título:** escreve.
6. **Vazio:** laço de seleção. Um clique sem arrastar tira a seleção.

Quem escreve acumula num lote, que fecha depois de 1 s parado ou ao sair da forma.

- [ ] **Step 1: Gravar o módulo**

```js arquivo=js/interacao.js
// Mouse e teclado na folha. Mantém o "estado da tela" (quem está sendo editado,
// modo seta, guias, laço) e traduz gestos em operações do modelo, pela loja.
import { TEXTO_MAX, GRADE, MARGEM, TAM_MIN, tamanhoFolha } from './paleta.js';
import { alturaNecessaria } from './geometria.js';
import { encaixar, posicionar } from './encaixe.js';
import {
  formaPorId, atualizarForma, moverFormas, apagar, ligar, criarForma, criarLigada, definirTitulo,
} from './modelo.js';

const TOLERANCIA = 4; // px de tela antes de um clique virar arrasto

// "plaintext-only" impede colar negrito/cor de outro lugar; onde não existir, "true" + colar limpo.
const EDITAVEL = (() => {
  const d = document.createElement('div');
  d.contentEditable = 'plaintext-only';
  return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true';
})();

function lerTexto(n) {
  return n.innerText.replace(/\r/g, '').replace(/\n$/, '');
}

function colocarCursor(alvo, ev) {
  let range = null;
  if (ev && document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(ev.clientX, ev.clientY);
    if (p && alvo.contains(p.offsetNode)) {
      range = document.createRange();
      range.setStart(p.offsetNode, p.offset);
    }
  } else if (ev && document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    if (r && alvo.contains(r.startContainer)) range = r;
  }
  if (!range) { // sem ponto (ou fora do texto): cursor no fim
    range = document.createRange();
    range.selectNodeContents(alvo);
    range.collapse(false);
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function caixaDoGrupo(doc, ids) {
  const fs = doc.formas.filter((f) => ids.includes(f.id));
  const x = Math.min(...fs.map((f) => f.x));
  const y = Math.min(...fs.map((f) => f.y));
  return { x, y, l: Math.max(...fs.map((f) => f.x + f.l)) - x, a: Math.max(...fs.map((f) => f.y + f.a)) - y };
}

export function criarInteracao({ loja, desenho, el, avisar, faixa, redesenhar, dialogoAberto }) {
  const tela = { editandoId: null, editandoTitulo: false, modoSeta: null, guias: [], laco: null, arrastando: false };
  let gesto = null;
  let relogioLote = null;

  const fecharLoteDepois = () => {
    clearTimeout(relogioLote);
    relogioLote = setTimeout(() => loja.confirmar(), 1000);
  };

  // ---------- Escrever ----------
  function terminarEdicao() {
    const havia = tela.editandoId || tela.editandoTitulo;
    if (tela.editandoId) {
      const t = desenho.textoDe(tela.editandoId);
      tela.editandoId = null;
      if (t) { t.contentEditable = 'false'; t.blur(); }
    }
    if (tela.editandoTitulo) {
      tela.editandoTitulo = false;
      el.tituloTexto.contentEditable = 'false';
      el.tituloTexto.blur();
    }
    clearTimeout(relogioLote);
    loja.confirmar();
    if (havia) {
      window.getSelection()?.removeAllRanges();
      redesenhar();
    }
  }

  function comecarEdicao(id, ev) {
    if (tela.editandoId === id) return;
    terminarEdicao();
    loja.selecionar({ formas: [id] });
    tela.editandoId = id;
    redesenhar();
    const t = desenho.textoDe(id);
    if (!t) return;
    t.contentEditable = EDITAVEL;
    t.focus({ preventScroll: true });
    colocarCursor(t, ev);
  }

  function comecarEdicaoTitulo(ev) {
    if (tela.editandoTitulo) return;
    terminarEdicao();
    loja.selecionar({ titulo: true });
    tela.editandoTitulo = true;
    redesenhar();
    el.tituloTexto.contentEditable = EDITAVEL;
    el.tituloTexto.focus({ preventScroll: true });
    colocarCursor(el.tituloTexto, ev);
  }

  // A forma cresce para baixo (topo parado) quando o texto não cabe; nunca encolhe sozinha.
  function crescerSePreciso(doc, id) {
    const f = formaPorId(doc, id);
    if (!f) return doc;
    const precisa = Math.ceil(alturaNecessaria(f, desenho.alturaDoTexto(id)) / GRADE) * GRADE;
    return precisa > f.a ? atualizarForma(doc, id, { a: precisa }) : doc;
  }

  el.formas.addEventListener('input', (ev) => {
    const raiz = ev.target.closest('.forma');
    if (!raiz || raiz.dataset.id !== tela.editandoId) return;
    let texto = lerTexto(ev.target);
    if (texto.length > TEXTO_MAX) {
      texto = texto.slice(0, TEXTO_MAX);
      ev.target.textContent = texto;
      colocarCursor(ev.target);
    }
    loja.comecar();
    const doc = atualizarForma(loja.doc, tela.editandoId, { texto });
    loja.trocar(crescerSePreciso(doc, tela.editandoId));
    fecharLoteDepois();
  });

  el.tituloTexto.addEventListener('input', () => {
    if (!tela.editandoTitulo) return;
    loja.comecar();
    loja.trocar(definirTitulo(loja.doc, { texto: lerTexto(el.tituloTexto) }));
    fecharLoteDepois();
  });

  // Colar entra só como texto, sem cor nem negrito de outro lugar.
  for (const alvo of [el.formas, el.tituloTexto]) {
    alvo.addEventListener('paste', (ev) => {
      if (!tela.editandoId && !tela.editandoTitulo) return;
      ev.preventDefault();
      document.execCommand('insertText', false, ev.clipboardData.getData('text/plain'));
    });
  }

  // Clicou fora do texto (no painel, por exemplo): termina de escrever.
  function aoPerderFoco() {
    setTimeout(() => {
      const t = tela.editandoId ? desenho.textoDe(tela.editandoId) : tela.editandoTitulo ? el.tituloTexto : null;
      if (t && document.activeElement !== t && document.hasFocus()) terminarEdicao();
    }, 0);
  }
  el.formas.addEventListener('focusout', aoPerderFoco);
  el.tituloTexto.addEventListener('focusout', aoPerderFoco);

  // ---------- Seta pelo botão ----------
  function entrarModoSeta() {
    terminarEdicao();
    loja.selecionar({});
    tela.modoSeta = { etapa: 'origem', de: null };
    faixa.mostrar('Clique na forma de onde a seta SAI.');
    redesenhar();
  }

  function sairModoSeta() {
    if (!tela.modoSeta) return;
    tela.modoSeta = null;
    faixa.esconder();
    redesenhar();
  }

  function cliqueNoModoSeta(id) {
    if (tela.modoSeta.etapa === 'origem') {
      tela.modoSeta = { etapa: 'destino', de: id };
      faixa.mostrar('Agora clique na forma aonde a seta CHEGA.');
      redesenhar();
      return;
    }
    if (id === tela.modoSeta.de) {
      avisar('A seta precisa chegar em OUTRA forma. Clique na forma aonde ela chega.');
      return;
    }
    const r = ligar(loja.doc, tela.modoSeta.de, id);
    sairModoSeta();
    if (r.erro === 'repetida') {
      avisar('Essas duas formas já estão ligadas por uma seta.');
      return;
    }
    if (r.erro) return;
    loja.aplicar(r.doc);
    loja.selecionar({ seta: r.id });
  }

  // ---------- Ações usadas pela paleta, pelo painel e pelo teclado ----------
  function centroVisivel() {
    const r = el.palco.getBoundingClientRect();
    const alto = Math.min(r.bottom, window.innerHeight);
    return desenho.paraFolha({ clientX: r.left + r.width / 2, clientY: r.top + (alto - r.top) / 2 });
  }

  function adicionarForma(tipo) {
    sairModoSeta();
    terminarEdicao();
    const r = criarForma(loja.doc, tipo, null, { perto: centroVisivel() });
    if (r.erro) {
      avisar('A folha está cheia. Apague ou diminua alguma forma para caber outra.');
      return;
    }
    loja.aplicar(r.doc);
    comecarEdicao(r.id);
  }

  function criarPeloMais(lado) {
    const id = loja.selecao.formas[0];
    if (!id) return;
    terminarEdicao();
    const r = criarLigada(loja.doc, id, lado);
    if (r.erro) {
      avisar('Não cabe outra forma desse lado da folha. Arraste as formas para abrir espaço, ou use outro "+".');
      return;
    }
    loja.aplicar(r.doc);
    comecarEdicao(r.id);
  }

  function apagarSelecao() {
    const s = loja.selecao;
    const ids = s.seta ? [s.seta] : s.formas;
    if (!ids.length) return false;
    terminarEdicao();
    loja.aplicar(apagar(loja.doc, ids));
    loja.selecionar({});
    return true;
  }

  function escolherSeta(id) {
    terminarEdicao();
    loja.selecionar({ seta: id });
  }

  // ---------- Mouse ----------
  function redimensionar(g, p) {
    const o = g.orig;
    const dx = p.x - g.inicio.x;
    const dy = p.y - g.inicio.y;
    const folha = tamanhoFolha(loja.doc.folha.orientacao);
    const oeste = g.canto[1] === 'o';
    const norte = g.canto[0] === 'n';
    let x1 = o.x;
    let y1 = o.y;
    let x2 = o.x + o.l;
    let y2 = o.y + o.a;
    if (oeste) x1 = Math.max(MARGEM, encaixar(o.x + dx)); else x2 = Math.min(folha.largura - MARGEM, encaixar(x2 + dx));
    if (norte) y1 = Math.max(MARGEM, encaixar(o.y + dy)); else y2 = Math.min(folha.altura - MARGEM, encaixar(y2 + dy));
    if (x2 - x1 < TAM_MIN.l) { if (oeste) x1 = x2 - TAM_MIN.l; else x2 = x1 + TAM_MIN.l; }
    if (y2 - y1 < TAM_MIN.a) { if (norte) y1 = y2 - TAM_MIN.a; else y2 = y1 + TAM_MIN.a; }
    loja.trocar(atualizarForma(loja.doc, g.id, { x: x1, y: y1, l: x2 - x1, a: y2 - y1 }));
  }

  function aoApertar(ev) {
    if (ev.button !== 0 || dialogoAberto()) return;
    const alvo = ev.target;
    const p = desenho.paraFolha(ev);

    const mais = alvo.closest('.ctl-mais');
    if (mais) { ev.preventDefault(); gesto = { tipo: 'mais', lado: mais.dataset.lado }; return; }

    const alca = alvo.closest('.ctl-alca');
    if (alca) {
      ev.preventDefault();
      const id = loja.selecao.formas[0];
      const f = formaPorId(loja.doc, id);
      if (!f) return;
      terminarEdicao();
      loja.comecar();
      tela.arrastando = true;
      gesto = { tipo: 'alca', canto: alca.dataset.canto, id, inicio: p, orig: { ...f } };
      return;
    }

    const rotulo = alvo.closest('.rotulo');
    if (rotulo && !tela.modoSeta) { ev.preventDefault(); escolherSeta(rotulo.dataset.seta); return; }
    const seta = alvo.closest('.seta');
    if (seta && !tela.modoSeta) { ev.preventDefault(); escolherSeta(seta.dataset.id); return; }

    const raiz = alvo.closest('.forma');
    if (raiz) {
      const id = raiz.dataset.id;
      if (tela.modoSeta) { ev.preventDefault(); cliqueNoModoSeta(id); return; }
      if (tela.editandoId === id && alvo.closest('.texto')) return; // o navegador cuida do cursor
      ev.preventDefault();
      if (ev.shiftKey) {
        terminarEdicao();
        const atual = loja.selecao.formas;
        loja.selecionar({ formas: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id] });
        return;
      }
      const grupo = loja.selecao.formas.includes(id) && loja.selecao.formas.length > 1;
      gesto = { tipo: 'forma', id, inicio: p, cliente: [ev.clientX, ev.clientY], moveu: false, ids: grupo ? [...loja.selecao.formas] : [id] };
      return;
    }

    if (alvo.closest('.titulo')) {
      if (tela.modoSeta) return;
      if (tela.editandoTitulo && alvo.closest('.titulo-texto')) return;
      ev.preventDefault();
      comecarEdicaoTitulo(ev);
      return;
    }

    if (tela.modoSeta) return;
    ev.preventDefault();
    terminarEdicao();
    gesto = { tipo: 'laco', inicio: p, cliente: [ev.clientX, ev.clientY], moveu: false, somar: ev.shiftKey };
  }

  function aoMover(ev) {
    if (!gesto) return;
    const p = desenho.paraFolha(ev);
    const longe = () => Math.hypot(ev.clientX - gesto.cliente[0], ev.clientY - gesto.cliente[1]) >= TOLERANCIA;

    if (gesto.tipo === 'forma') {
      if (!gesto.moveu) {
        if (!longe()) return;
        gesto.moveu = true;
        terminarEdicao();
        if (!loja.selecao.formas.includes(gesto.id)) loja.selecionar({ formas: [gesto.id] });
        loja.comecar();
        gesto.docInicio = loja.doc;
        gesto.caixa = caixaDoGrupo(loja.doc, gesto.ids);
        gesto.outras = loja.doc.formas.filter((f) => !gesto.ids.includes(f.id));
        tela.arrastando = true;
      }
      const folha = tamanhoFolha(loja.doc.folha.orientacao);
      const c = gesto.caixa;
      const alvo = posicionar({ ...c, x: c.x + p.x - gesto.inicio.x, y: c.y + p.y - gesto.inicio.y }, gesto.outras, folha);
      tela.guias = alvo.linhas;
      loja.trocar(moverFormas(gesto.docInicio, gesto.ids, alvo.x - c.x, alvo.y - c.y));
      return;
    }
    if (gesto.tipo === 'alca') { redimensionar(gesto, p); return; }
    if (gesto.tipo === 'laco') {
      if (!gesto.moveu && !longe()) return;
      gesto.moveu = true;
      const i = gesto.inicio;
      tela.laco = { x: Math.min(i.x, p.x), y: Math.min(i.y, p.y), l: Math.abs(p.x - i.x), a: Math.abs(p.y - i.y) };
      redesenhar();
    }
  }

  function aoSoltar(ev) {
    if (!gesto) return;
    const g = gesto;
    gesto = null;
    if (g.tipo === 'mais') {
      if (ev.target.closest && ev.target.closest('.ctl-mais')) criarPeloMais(g.lado);
      return;
    }
    if (g.tipo === 'forma') {
      if (!g.moveu) { comecarEdicao(g.id, ev); return; }
      tela.arrastando = false;
      tela.guias = [];
      loja.confirmar();
      redesenhar();
      return;
    }
    if (g.tipo === 'alca') {
      loja.trocar(crescerSePreciso(loja.doc, g.id));
      tela.arrastando = false;
      loja.confirmar();
      redesenhar();
      return;
    }
    if (g.tipo === 'laco') {
      const r = tela.laco;
      tela.laco = null;
      if (!g.moveu || !r) { loja.selecionar({}); return; }
      const dentro = loja.doc.formas
        .filter((f) => f.x >= r.x && f.y >= r.y && f.x + f.l <= r.x + r.l && f.y + f.a <= r.y + r.a)
        .map((f) => f.id);
      loja.selecionar({ formas: g.somar ? [...new Set([...loja.selecao.formas, ...dentro])] : dentro });
    }
  }

  el.folha.addEventListener('pointerdown', aoApertar);
  window.addEventListener('pointermove', aoMover);
  window.addEventListener('pointerup', aoSoltar);
  window.addEventListener('pointercancel', aoSoltar);

  // Clique no cinza em volta da folha: larga tudo.
  el.palco.addEventListener('pointerdown', (ev) => {
    if (ev.target === el.palco || ev.target === el.caixa) {
      sairModoSeta();
      terminarEdicao();
      loja.selecionar({});
    }
  });

  // ---------- Teclado ----------
  document.addEventListener('keydown', (ev) => {
    if (dialogoAberto()) return;
    const ctrl = ev.ctrlKey || ev.metaKey;
    const k = ev.key.toLowerCase();
    if (tela.editandoId || tela.editandoTitulo) {
      if (ev.key === 'Escape' || (tela.editandoTitulo && ev.key === 'Enter')) { ev.preventDefault(); terminarEdicao(); return; }
      if (ctrl && (k === 'z' || k === 'y')) {
        ev.preventDefault();
        terminarEdicao();
        if (k === 'y' || ev.shiftKey) loja.refazer(); else loja.desfazer();
        return;
      }
      if (ctrl && (k === 'b' || k === 'i' || k === 'u')) ev.preventDefault();
      return;
    }
    const t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (ctrl && k === 'z') { ev.preventDefault(); if (ev.shiftKey) loja.refazer(); else loja.desfazer(); return; }
    if (ctrl && k === 'y') { ev.preventDefault(); loja.refazer(); return; }
    if (ev.key === 'Escape') { if (tela.modoSeta) sairModoSeta(); else loja.selecionar({}); return; }
    // Backspace com UMA forma escolhida apaga letra, como quem digita (ver "letra digitada"
    // abaixo) — apagar a forma inteira seria uma surpresa. Delete apaga a forma.
    if (ev.key === 'Backspace' && loja.selecao.formas.length === 1) {
      ev.preventDefault();
      comecarEdicao(loja.selecao.formas[0]);
      document.execCommand('delete');
      return;
    }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { if (apagarSelecao()) ev.preventDefault(); return; }
    // Letra digitada com uma forma escolhida: começa a escrever nela.
    if (!ctrl && !ev.altKey && ev.key.length === 1 && loja.selecao.formas.length === 1) {
      ev.preventDefault();
      comecarEdicao(loja.selecao.formas[0]);
      document.execCommand('insertText', false, ev.key);
    }
  });

  // Depois de mudar letra ou tipo pelo painel: cresce quem ficou sem espaço.
  // (Chamar DEPOIS de a mudança ter sido desenhada, porque mede o texto na tela.)
  function crescer(doc, ids) {
    return ids.reduce((d, id) => crescerSePreciso(d, id), doc);
  }

  return {
    estadoTela: () => ({ ...tela }),
    terminarEdicao, comecarEdicao, entrarModoSeta, sairModoSeta, adicionarForma, apagarSelecao, crescer,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add js/interacao.js
git commit -m "Interação: clicar escreve, arrastar move, alças, laço, \"+\", modo seta e teclado"
```

### Task 14: Painel da direita

**Files:**
- Create: `js/painel.js`

O painel só substitui o próprio HTML **quando o conteúdo muda**. Se ele fosse refeito a cada
redesenho, o botão sob o mouse seria trocado entre o apertar e o soltar, e o clique se perderia.
Isso acontece sempre que clicar no painel tira o foco de um texto em edição.

- [ ] **Step 1: Gravar o módulo**

```js arquivo=js/painel.js
// Painel da direita: mostra as opções do que está escolhido (forma, várias
// formas, seta ou título) e aplica a escolha. Sempre no mesmo lugar.
import { CORES, ORDEM_CORES, TIPOS, NOMES_TIPOS, LETRA, ROTULO_MAX, MARGEM, tamanhoFolha } from './paleta.js';
import {
  formaPorId, setaPorId, atualizarFormas, trocarTipo, duplicar, atualizarSeta, inverterSeta, definirTitulo,
} from './modelo.js';

const ICONES = {
  retangulo: '<rect x="3" y="4" width="34" height="20"/>',
  arredondado: '<rect x="3" y="4" width="34" height="20" rx="7"/>',
  losango: '<path d="M20 2 38 14 20 26 2 14z"/>',
  circulo: '<ellipse cx="20" cy="14" rx="16" ry="11"/>',
  texto: '<path d="M11 7h18M20 7v15" fill="none"/>',
};
const LADOS = [['auto', 'Auto'], ['cima', '↑'], ['baixo', '↓'], ['esquerda', '←'], ['direita', '→']];
const NOME_LADO = { cima: 'em cima', baixo: 'embaixo', esquerda: 'à esquerda', direita: 'à direita' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ativo = (sim) => (sim ? ' ativo' : '');
const todas = (lista, fn) => lista.length > 0 && lista.every(fn);

function botao(acao, valor, rotulo, eAtivo = false, extra = '', titulo = '') {
  const t = titulo ? ` title="${esc(titulo)}"` : '';
  return `<button type="button" class="opcao${ativo(eAtivo)}${extra}"${t} data-acao="${acao}" data-valor="${esc(valor)}">${rotulo}</button>`;
}

function cores(atual) {
  return `<div class="grupo"><span class="rotulo-grupo">Cor</span><div class="cores">${ORDEM_CORES.map((n) => {
    const c = CORES[n];
    return `<button type="button" class="cor${ativo(atual === n)}" data-acao="cor" data-valor="${n}" title="${c.nome}" aria-label="${c.nome}" style="background:${c.fundo};border-color:${c.borda}"></button>`;
  }).join('')}</div></div>`;
}

export function criarPainel({ loja, el, interacao, avisar }) {
  let ultimo = '';

  function htmlNada() {
    return `<h2>Forma escolhida</h2>
      <p class="dica">Nada escolhido.</p>
      <p class="dica"><strong>Para escrever:</strong> clique numa forma e digite.</p>
      <p class="dica"><strong>Para pôr uma forma:</strong> use os botões da esquerda.</p>
      <p class="dica"><strong>Para ligar formas:</strong> clique numa forma e depois no <strong>+</strong> azul, ou use o botão <strong>Seta</strong>.</p>`;
  }

  function htmlFormas(fs) {
    const uma = fs.length === 1;
    const f = fs[0];
    const soTexto = todas(fs, (x) => x.tipo === 'texto');
    const partes = [`<h2>${uma ? 'Forma escolhida' : `${fs.length} formas escolhidas`}</h2>`];
    if (!soTexto) {
      const cor = todas(fs, (x) => x.cor === f.cor) ? f.cor : null;
      partes.push(cores(cor));
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Borda</span><div class="linha">
        ${botao('borda', 'lisa', 'Lisa', todas(fs, (x) => x.borda === 'lisa'))}
        ${botao('borda', 'tracejada', 'Tracejada', todas(fs, (x) => x.borda === 'tracejada'))}</div></div>`);
    }
    if (uma) {
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Letra (${f.letra})</span><div class="linha">
        ${botao('letra', '-2', 'A−', false)}${botao('letra', '2', 'A+', false)}
        ${botao('negrito', '', '<strong>Negrito</strong>', f.negrito)}</div>
        <div class="linha">${botao('alinhar', 'centro', 'Centralizado', f.alinhar === 'centro')}
        ${botao('alinhar', 'esquerda', 'À esquerda', f.alinhar === 'esquerda')}</div></div>`);
      partes.push(`<div class="grupo"><span class="rotulo-grupo">Trocar a forma</span><div class="linha">${TIPOS.map((t) =>
        botao('tipo', t, `<svg viewBox="0 0 40 28" aria-hidden="true">${ICONES[t]}</svg><span class="sr">${NOMES_TIPOS[t]}</span>`,
          f.tipo === t, '', NOMES_TIPOS[t])).join('')}</div></div>`);
    }
    partes.push(`<div class="linha">${botao('duplicar', '', 'Duplicar')}${botao('apagar', '', 'Apagar', false, ' perigo')}</div>`);
    if (fs.some((x) => x.fora)) partes.push('<p class="alerta">Tem forma passando da margem da folha: ela pode sair cortada na impressão. Diminua a letra ou alargue a forma.</p>');
    return partes.join('');
  }

  function htmlSeta(s) {
    const lados = (qual) => `<div class="linha">${LADOS.map(([v, r]) =>
      botao(qual, v, r, s[qual] === v, '', v === 'auto' ? 'Automático' : NOME_LADO[v])).join('')}</div>`;
    return `<h2>Seta escolhida</h2>
      <div class="grupo"><span class="rotulo-grupo">Texto na seta</span><div class="linha">
        ${botao('seta-texto', 'SIM', 'SIM', s.texto === 'SIM')}${botao('seta-texto', 'NÃO', 'NÃO', s.texto === 'NÃO')}
        ${botao('seta-texto', '', 'Sem texto', s.texto === '')}</div>
        <label for="seta-outro">Ou escreva outro:</label>
        <div class="linha"><input type="text" id="seta-outro" maxlength="${ROTULO_MAX}" value="${esc(['SIM', 'NÃO'].includes(s.texto) ? '' : s.texto)}" placeholder="Talvez">
        ${botao('seta-outro', '', 'Pôr')}</div></div>
      <div class="grupo"><span class="rotulo-grupo">Direção</span>${botao('inverter', '', 'Inverter a seta')}</div>
      <div class="grupo"><span class="rotulo-grupo">Ajustar caminho</span>
        <span>Sai por:</span>${lados('saida')}<span>Chega por:</span>${lados('chegada')}</div>
      <div class="linha">${botao('apagar', '', 'Apagar a seta', false, ' perigo')}</div>`;
  }

  function htmlTitulo(doc) {
    return `<h2>Título</h2><p class="dica">Clique no título para escrever.</p>${cores(doc.titulo.cor).replace('>Cor<', '>Cor da faixa<')}`;
  }

  function montar() {
    const { doc, selecao } = loja;
    if (selecao.seta) {
      const s = setaPorId(doc, selecao.seta);
      if (s) return htmlSeta(s);
    }
    if (selecao.titulo) return htmlTitulo(doc);
    const folha = tamanhoFolha(doc.folha.orientacao);
    const fs = selecao.formas.map((id) => formaPorId(doc, id)).filter(Boolean).map((f) => ({
      ...f, fora: f.x + f.l > folha.largura - MARGEM + 1 || f.y + f.a > folha.altura - MARGEM + 1,
    }));
    return fs.length ? htmlFormas(fs) : htmlNada();
  }

  function atualizar() {
    const html = montar();
    if (html === ultimo) return;
    ultimo = html;
    el.innerHTML = html;
  }

  // Muda e, depois de desenhar, cresce quem ficou sem espaço para o texto.
  function mudarFormas(ids, fn) {
    loja.comecar();
    loja.trocar(fn(loja.doc));
    loja.trocar(interacao.crescer(loja.doc, ids));
    loja.confirmar();
  }

  function executar(acao, valor) {
    interacao.terminarEdicao();
    const { doc, selecao } = loja;
    const ids = selecao.formas;
    const seta = selecao.seta;
    switch (acao) {
      case 'cor':
        if (selecao.titulo) loja.aplicar(definirTitulo(doc, { cor: valor }));
        else loja.aplicar(atualizarFormas(doc, ids, { cor: valor }));
        break;
      case 'borda': loja.aplicar(atualizarFormas(doc, ids, { borda: valor })); break;
      case 'letra': {
        const f = formaPorId(doc, ids[0]);
        const nova = f.letra + Number(valor);
        if (nova < LETRA.min || nova > LETRA.max) { avisar(nova < LETRA.min ? 'A letra já está no menor tamanho.' : 'A letra já está no maior tamanho.'); return; }
        mudarFormas(ids, (d) => atualizarFormas(d, ids, { letra: nova }));
        break;
      }
      case 'negrito': {
        const f = formaPorId(doc, ids[0]);
        mudarFormas(ids, (d) => atualizarFormas(d, ids, { negrito: !f.negrito }));
        break;
      }
      case 'alinhar': loja.aplicar(atualizarFormas(doc, ids, { alinhar: valor })); break;
      case 'tipo': mudarFormas(ids, (d) => trocarTipo(d, ids, valor)); break;
      case 'duplicar': {
        const r = duplicar(doc, ids);
        loja.aplicar(r.doc);
        loja.selecionar({ formas: r.ids });
        break;
      }
      case 'apagar': interacao.apagarSelecao(); break;
      case 'seta-texto': loja.aplicar(atualizarSeta(doc, seta, { texto: valor })); break;
      case 'seta-outro': {
        const campo = el.querySelector('#seta-outro');
        loja.aplicar(atualizarSeta(doc, seta, { texto: campo ? campo.value.trim() : '' }));
        break;
      }
      case 'inverter': loja.aplicar(inverterSeta(doc, seta)); break;
      case 'saida': case 'chegada': loja.aplicar(atualizarSeta(doc, seta, { [acao]: valor })); break;
      default: break;
    }
  }

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (b) executar(b.dataset.acao, b.dataset.valor);
  });
  el.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'seta-outro') {
      ev.preventDefault();
      executar('seta-outro', '');
    }
  });

  return { atualizar };
}
```

- [ ] **Step 2: Acrescentar a classe `.sr` (texto só para leitor de tela) no fim do `estilo.css`**
  (antes do bloco `@media (max-width: 899px)`). Já está incluída na versão final do `estilo.css`
  (Task 11).

- [ ] **Step 3: Commit**

```bash
git add js/painel.js estilo.css
git commit -m "Painel: cor, borda, letra, alinhamento, trocar forma, duplicar, apagar e seta"
```

### Task 15: Ligar tudo (app.js)

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Gravar o módulo**

```js arquivo=js/app.js
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
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js index.html
git commit -m "App: barra do alto, tela inicial, diálogos, guardado automático e impressão"
```

### Task 16: Conferir no navegador, clicando como um usuário

**Files:**
- Modify: o que o roteiro abaixo mostrar que está errado. Cada correção vira um commit próprio,
  com o sintoma na mensagem.

- [ ] **Step 1: Subir a prévia**

`preview_start` com `{ name: "fluxograma-facil" }`, e depois `read_console_messages` com
`onlyErrors: true`.
Expected: a tela inicial com os dois cartões e **nenhum erro** no console.

- [ ] **Step 2: Roteiro do usuário**, conferindo cada passo com `read_page` ou `javascript_tool`
  (lendo `localStorage['fluxograma-facil:documento']`) e, nos visuais, com `screenshot`:

1. **"Começar com o modelo":** 15 formas, 11 setas e o título rosa.
2. **Clicar no losango do meio (sem arrastar) e digitar "Sinais de alarme?":** o texto aparece
   centralizado e a forma continua do mesmo tamanho.
3. **Digitar um texto longo numa caixa pequena:** a forma cresce para baixo, em múltiplos de 10.
4. **Arrastar uma caixa:** ela anda em passos de 10 e gruda (aparece a linha laranja) quando se
   alinha com outra. A seta presa a ela acompanha.
5. **Clicar numa forma e no "+" de baixo:** nasce uma forma igual embaixo, ligada, com o cursor
   nela.
6. **Botão "Seta":** a faixa amarela aparece; clicar em duas formas cria a seta e o painel mostra
   SIM/NÃO. Clicar em "SIM" põe o rótulo perto da saída.
7. **Mudar a cor e a borda, apertar A+ três vezes e trocar para círculo:** tudo reflete na hora.
8. **Delete apaga a forma e as setas dela, e Ctrl+Z traz de volta.** Backspace numa forma
   escolhida apaga uma letra, não a forma.
9. **Laço sobre três formas, e arrastar:** as três andam juntas.
10. **"Deitar a folha":** a folha vira e nada fica de fora.
11. **Recarregar a página:** o fluxograma continua lá, sem a tela inicial.
12. **"Salvar no computador":** baixa `Fluxograma - Fluxo de atendimento – Dengue.json`. Depois,
    "Começar outro" → "Continuar sem salvar" → "Começar com a folha vazia", e "Abrir" o arquivo:
    volta tudo.
13. **"Imprimir ou PDF" → Continuar:** trocar antes `window.print` por um espião, via
    `javascript_tool`, e conferir que ele é chamado. Para **ver** a impressão, usar o Playwright
    (`browser_run_code_unsafe`) em `http://localhost:5180`: `page.emulateMedia({ media: 'print' })` e
    uma captura de tela. Tem de aparecer só a folha, sem grade, dicas ou seleção, e com as cores.
    Depois, `page.pdf({ format: 'A4' })` precisa dar **uma** página só.
14. **Tela de 800 px (`resize_window`):** aparece o aviso de tela estreita e a paleta vira linha.
    Voltar para `desktop`.

- [ ] **Step 3: Rodar todos os testes**

Run: `node --test`
Expected: PASS em todos.

- [ ] **Step 4: Commit das correções** (se houver), uma por problema.

### Task 17: Documentar

**Files:**
- Create: `CLAUDE.md` (do app)
- Modify: `../CLAUDE.md` (raiz): item "Fluxograma Fácil" na infraestrutura e na lista de
  `CLAUDE.md` de cada pasta.
- Modify: `docs/superpowers/specs/2026-09-29-fluxograma-facil-design.md`: registrar que o losango
  nasce com 180 × 120 e o círculo com 110 × 110 (e por quê), que o zoom ocupa a largura (texto
  legível, rolando na vertical) e que Backspace numa forma escolhida apaga uma letra.

- [ ] **Step 1: Escrever o `CLAUDE.md` do app**, no estilo dos outros da pasta: o pedido e a
  decisão do Paulo (com a citação), o que é e o que não é, o mapa dos arquivos, as regras que não
  são óbvias e as armadilhas:
  - o texto em edição não é reescrito pelo desenho;
  - o painel só troca o HTML quando muda;
  - `plaintext-only`;
  - a folha de 296 mm na impressão;
  - as cores guardadas por nome;
  - o modelo sem texto clínico.

  Incluir também como rodar a prévia e os testes, e onde está publicado.

- [ ] **Step 2: Atualizar o `CLAUDE.md` da raiz** (bloco "Infraestrutura compartilhada" e lista final).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs
git commit -m "CLAUDE.md do Fluxograma Fácil e ajustes do desenho registrados"
```

### Task 18: Publicar (SÓ com o OK explícito do Paulo)

- [ ] **Step 1:** Perguntar ao Paulo se pode criar o repositório **público**
  `paulosgp/fluxograma-facil` e ligar o GitHub Pages.
- [ ] **Step 2 (com o OK):**
  `cd "<APP>" && gh repo create paulosgp/fluxograma-facil --public --source . --push`, depois
  `gh api -X POST repos/paulosgp/fluxograma-facil/pages -f "source[branch]=master" -f "source[path]=/"`.
- [ ] **Step 3:** Acrescentar `'Fluxograma Facil': 'Fluxograma Facil'` ao `PREFIX_MAP` de
  `../.claude/scripts/sync-apps-monorepo.js` e rodar o script à mão (procedimento do `CLAUDE.md` da
  raiz). Conferir com `tail -3` no log.
- [ ] **Step 4:** Conferir `https://paulosgp.github.io/fluxograma-facil/` no navegador (pode levar
  1–2 min para o Pages publicar).
- [ ] **Step 5:** Atualizar os dois `CLAUDE.md` com o endereço e fazer commit + push.

