# Fluxograma Fácil — desenho

29/09/2026. Aprovado pelo Paulo em conversa, em duas partes: "como a pessoa usa" e "onde fica e
como guarda".

## 1. Por que existe

A coordenadora da 6ª Regional de Saúde (União da Vitória) pediu ao Paulo um **fluxograma
editável**, para que cada município da Regional monte o seu no plano de contingência das
arboviroses, a dengue principalmente. O exemplo que ela deu foi o *Fluxo Assistencial – Dengue CID
A90* de Curitiba (v10, 09/12/2024). Na página 1 dele estão losangos de pergunta, caixas coloridas
por grupo (A azul, B verde, C amarelo, D vermelho), caixas tracejadas ao lado e setas com SIM/NÃO.

A decisão que define o sistema é do Paulo: *"Eu não quero que você escreva nada (a não ser o
título apenas, que também deve ser editável), e uns quadradinhos, bolinhas, retângulos (como no
pdf) em branco para o pessoal preencher da forma que eles quiserem... tem que ser mais simples do
que já existe atualmente em programas como PowerPoint, Paint etc."*

Então o Fluxograma Fácil é um **editor de fluxograma em branco**. Ele não traz nenhum texto
clínico, e o único texto que vem pronto é o título, que também pode ser editado.

- **Quem usa:** servidores dos municípios da Regional (APS, vigilância), com pouca familiaridade
  com computador, em computador com mouse.
- **Como saber que deu certo:** uma pessoa assim monta e imprime um fluxograma parecido com a
  página 1 de Curitiba, sem ajuda e sem ler manual.

## 2. O que a pessoa vê e faz

### A tela

- **Barra do alto:** Desfazer, Refazer, Salvar no computador, Abrir, Imprimir ou PDF, Começar
  outro e Ajuda. No canto, o aviso "Guardado neste computador".
- **Esquerda, "Pôr na folha":** Retângulo, Arredondado, Losango, Círculo, Texto (sem borda) e
  Seta. São botões grandes, com desenho e nome.
- **Centro:** a folha A4, em pé por padrão (o botão "Deitar a folha" vira para paisagem). O zoom se
  ajusta sozinho para a folha caber na tela. Na tela aparece uma grade leve, que não sai na
  impressão.
- **Direita, "Forma escolhida":** o painel fica sempre no mesmo lugar e muda conforme o que está
  escolhido:
  - **uma forma:** cor (9 cores), borda lisa ou tracejada, letra (A−, A+, Negrito), alinhar
    (centro ou esquerda), trocar a forma, Duplicar e Apagar;
  - **uma seta:** SIM, NÃO, Escrever outro texto, Sem texto, Inverter, Ajustar caminho (por onde sai
    e por onde chega) e Apagar;
  - **o título:** a cor da faixa;
  - **várias formas:** cor, borda, Duplicar e Apagar;
  - **nada:** uma dica curta de por onde começar.

### Como cada coisa funciona

- **Começo.** Na primeira vez, a tela inicial tem dois botões:
  - **"Começar com o modelo":** as formas já vêm no lugar, como na página 1 de Curitiba, todas em
    branco (ver §3);
  - **"Começar com a folha vazia".**

  Se já houver trabalho guardado no navegador, o sistema abre direto nele.
- **Clicar é escrever, arrastar é mover.**
  - Apertar o botão do mouse numa forma e soltar sem mexer escolhe a forma e já põe o cursor no
    texto.
  - Apertar e arrastar move a forma.
  - Com o cursor no texto, arrastar por cima das letras seleciona o texto (é o normal). Para mover a
    forma, pega-se pela beirada, fora das letras.
  - Forma vazia mostra "Clique e escreva" em cinza. Essa dica não sai na impressão.
- **O texto.** É só texto, sem formatação colada de outro lugar. O Enter pula linha.
  - Se o texto não couber, a forma **cresce sozinha para baixo**. Ela nunca encolhe sozinha.
  - O negrito vale para o texto inteiro da forma.
- **Encaixe.**
  - Posição e tamanho se encaixam numa grade de 10 px.
  - Ao arrastar, a forma "gruda" quando o centro ou uma borda dela se alinha com o de uma vizinha (a
    tolerância é de 6 px). Aparece uma linha-guia enquanto está alinhada.
  - Nenhuma forma sai da área útil da folha: a margem de segurança é de 30 px, uns 8 mm.
- **Tamanho.** Há alças grandes nos quatro cantos da forma escolhida. O tamanho mínimo é 40 × 30
  px, e a forma não fica menor do que o texto precisa.
- **O "+".** A forma escolhida mostra um "+" em cada lado. Clicar nele cria outra forma **igual**
  (tipo, cor, borda e tamanho) naquele lado, a 50 px de distância, já ligada por seta e com o
  cursor no texto. Se o lugar estiver ocupado, ela vai mais adiante na mesma direção. Se não couber
  na folha, aparece um aviso e nada é criado.
- **Seta entre formas que já existem.** O fluxo tem três cliques:
  1. o botão "Seta";
  2. a forma de onde a seta **sai**;
  3. a forma aonde ela **chega**.

  Enquanto isso, uma faixa no alto vai dizendo o que fazer, com o botão "Cancelar" (Esc também
  cancela). Duas regras de proteção:
  - clicar duas vezes na mesma forma dá um aviso;
  - uma seta repetida (mesma saída e mesma chegada) não é criada de novo.
- **Setas presas às formas.** Quando a forma se move, a seta vai junto. O caminho é automático,
  sempre em ângulo reto (regras no §4). O texto da seta (SIM, NÃO ou outro) fica perto da saída,
  sobre fundo branco. A seta pode ser escolhida com um clique perto da linha, porque a área de
  clique é mais larga que o traço.
- **Selecionar várias.** Arrastar numa área vazia da folha desenha um retângulo, e o que ficar
  dentro fica escolhido. Shift + clique põe ou tira uma forma da seleção. As escolhidas se movem,
  mudam de cor e são apagadas juntas.
- **Apagar.** Pelo botão "Apagar", ou pela tecla Delete/Backspace quando o cursor não está num
  texto. Apagar uma forma apaga as setas dela. O sistema não pede confirmação, porque tudo se
  desfaz.
- **Desfazer e refazer.** Pelos botões ou por Ctrl+Z e Ctrl+Y (Ctrl+Shift+Z também), até 100
  passos. Cada ação conta como um passo:
  - terminar de arrastar;
  - terminar de redimensionar;
  - escrever: um passo quando a pessoa para de digitar por 1 segundo ou sai da forma;
  - mudar cor, borda ou letra;
  - criar, ligar ou apagar.
- **Título.** É uma faixa no alto da folha, com até 3 linhas. Clicar nela e digitar muda o texto; a
  cor da faixa é escolhida no painel.
- **Começar outro, e abrir um arquivo por cima do atual.** Antes de trocar, o sistema pergunta:
  "O fluxograma atual vai ser trocado. Quer salvar ele no computador antes?" As respostas são
  [Salvar e continuar], [Continuar sem salvar] e [Cancelar].
- **Ajuda.** Um painel com seis passos curtos, cada um com um desenho pequeno.
- **Tela estreita (menos de 900 px).** Aparece o aviso "Para montar o fluxograma, use um
  computador. Aqui dá para ver e imprimir." A edição continua funcionando, só que não foi pensada
  para ela.

## 3. O modelo em branco

É a estrutura da página 1 de Curitiba, **sem nenhum texto além do título**.

- **Faixa do título:** "Fluxo de atendimento – Dengue", em cor rosa.
- **Topo:** uma caixa arredondada larga.
- **Coluna do meio:** cinco losangos em fila, ligados por setas para baixo. Abaixo do quinto fica
  uma caixa azul larga (o lugar do grupo A).
- **À direita dos losangos,** cada um com uma seta saindo dele:
  - do 1º: uma caixa branca;
  - do 2º: uma vermelha (D);
  - do 3º: uma amarela (C);
  - do 4º e do 5º: a mesma caixa verde (B).
- **Coluna da esquerda:** quatro caixas tracejadas, em branco, vermelho, amarelo e verde.
- **As setas vêm sem SIM/NÃO:** a pessoa põe com um clique.

A "folha vazia" começa sem formas, com o título em branco ("Clique e escreva o título" em cinza,
dica que não sai na impressão), e com a faixa cinza.

## 4. Por dentro

### Arquivos

```
index.html        casca da tela
estilo.css        aparência da tela e da impressão
js/modelo.js      o documento e as operações sobre ele (puro)
js/historico.js   desfazer/refazer (puro)
js/setas.js       caminho das setas (puro)
js/encaixe.js     grade e linhas-guia (puro)
js/modelos.js     o modelo em branco e a folha vazia (puro)
js/arquivo.js     guardar no navegador, salvar/abrir arquivo, validar
js/editor.js      desenhar na tela e tratar mouse/teclado (a única parte que mexe na página)
js/app.js         liga tudo
fontes/           Archivo (título) e Source Sans 3 (texto), as mesmas do Guia Saúde
testes/           node testes/<nome>.test.js — sem dependência nenhuma
servir.js         servidor local para a prévia
package.json      só {"type": "module"}, para os testes do Node usarem os mesmos módulos
```

É uma página estática, sem framework e sem etapa de montagem (*build*). Os módulos são ES
(`<script type="module">`), que funcionam no GitHub Pages e no `servir.js`, mas não abrindo o
arquivo direto do disco, e isso não faz falta.

### O documento (o mesmo formato vale no navegador e no arquivo salvo)

```json
{
  "app": "fluxograma-facil",
  "versao": 1,
  "titulo": { "texto": "Fluxo de atendimento – Dengue", "cor": "rosa" },
  "folha": { "orientacao": "retrato" },
  "formas": [
    { "id": "f1", "tipo": "losango", "x": 320, "y": 200, "l": 150, "a": 100,
      "texto": "", "cor": "branco", "borda": "lisa", "letra": 14, "negrito": false,
      "alinhar": "centro" }
  ],
  "setas": [
    { "id": "s1", "de": "f1", "para": "f2", "texto": "", "saida": "auto", "chegada": "auto" }
  ]
}
```

- **`tipo`:** `retangulo`, `arredondado`, `losango`, `circulo` ou `texto`. O `texto` não tem borda
  nem fundo, e para ele o painel esconde a cor e a borda.
- **`cor`:** um nome da paleta, nunca um código hexadecimal. Assim a paleta pode ser ajustada sem
  quebrar arquivo salvo. As cores são branco, cinza, azul, verde, amarelo, laranja, vermelho, rosa
  e roxo. Cada uma tem um fundo claro e uma borda mais escura do mesmo tom, e a letra é sempre
  escura, para imprimir bem.
- **Números:**
  - a folha mede 794 × 1123 px em pé e 1123 × 794 deitada (A4 a 96 dpi);
  - `letra` vai de 10 a 28, com passo de 2 e padrão 14;
  - tamanhos iniciais: retângulo e arredondado 180 × 70, losango 150 × 100, círculo 100 × 100,
    texto 180 × 40.
- **Ao abrir um arquivo,** `arquivo.js` valida tudo:
  - `app` e `versao` precisam ser os esperados;
  - os tipos precisam ser conhecidos;
  - os `id` não podem se repetir;
  - toda seta precisa apontar para formas que existem;
  - números fora da faixa são trazidos para dentro dela;
  - campos desconhecidos são descartados;
  - cada texto tem no máximo 2.000 caracteres.

  Se o arquivo não servir, aparece a mensagem "Este arquivo não é de um fluxograma feito aqui." e o
  trabalho atual não muda.

### Caminho das setas (`setas.js`, função pura)

- **Pontos de saída e de chegada:** o meio de cada lado. Nos quatro tipos de forma esse ponto fica
  sobre o contorno. No losango ele é o próprio vértice.
- **Lado automático:** compara-se o vão vertical com o horizontal entre as duas caixas. Se a de
  chegada está mais abaixo do que ao lado, a seta sai por baixo e chega por cima, e o mesmo vale
  para as outras direções. Se as caixas se sobrepõem, decide a diferença entre os centros.
- **Reta sempre que der.** Se as duas caixas se sobrepõem no eixo perpendicular (no mínimo 20 px), a
  seta é uma reta só, como as de Curitiba. A coordenada da reta é, nesta ordem de preferência:
  1. o centro da forma de saída, se ele cair dentro da outra;
  2. o centro da forma de chegada, se ele cair dentro da primeira;
  3. o meio da sobreposição.

  O ponto em que a reta encosta no losango ou no círculo é calculado sobre o contorno de verdade,
  não sobre a caixa.
- **Sem sobreposição:** a seta vira um "Z" de três segmentos em ângulo reto, com a dobra no meio do
  vão.
- **Lados escolhidos à mão ("Ajustar caminho"):**
  - lados opostos: "Z";
  - lados perpendiculares: "L";
  - o mesmo lado: "U", afastado 20 px da forma.
- **Rótulo:** fica a 22 px do início do caminho, sobre fundo branco.
- **Assinatura:** `tracarSeta(origem, destino, { saida, chegada }) → { pontos: [[x, y], ...],
  rotulo: { x, y } }`. O traçado não desvia de outras formas, e para isso existe o "Ajustar
  caminho".

### Encaixe (`encaixe.js`, funções puras)

- `encaixar(valor, passo = 10)`.
- `guias(movendo, outras, tolerancia = 6) → { dx, dy, linhas }`. Alinha as bordas esquerda e
  direita, as bordas de cima e de baixo e os centros.
- `limitar(forma, folha, margem = 30)`.

### Desfazer (`historico.js`)

Uma pilha de "fotos" do documento, em JSON, com limite de 100. Refazer se perde quando entra uma
ação nova.

### Texto e crescimento

- O texto fica num `div` com `contenteditable="plaintext-only"`. Onde o navegador não aceitar isso,
  usa-se `true` e, ao colar, entra só o texto puro. É exibido com `white-space: pre-wrap`.
- A área do texto depende do tipo de forma:
  - no retângulo e no arredondado, a forma menos o espaço interno;
  - no losango, a metade central (50% da largura e da altura);
  - no círculo, cerca de 70% dele.
- Depois de cada tecla, mede-se a altura que o texto precisa. Se passar da atual, a forma cresce
  para baixo, com o topo parado. Se ela crescer além da folha, ganha contorno vermelho e o painel
  sugere diminuir a letra ou alargar a forma.

### Guardar, salvar, abrir e imprimir (`arquivo.js`)

- **Guardado automático:** o documento vai para o `localStorage` (chave
  `fluxograma-facil:documento`) 400 ms depois de cada mudança. Se falhar, aparece uma faixa
  amarela: "Não deu para guardar neste navegador. Use 'Salvar no computador'."
- **"Salvar no computador":** baixa o arquivo `Fluxograma - <título>.json`, com no máximo 60
  caracteres e sem os caracteres que o Windows proíbe no nome.
- **"Abrir":** aceita o arquivo pelo seletor ou arrastado para a página.
- **"Imprimir ou PDF":**
  - antes, aparece a dica "Na janela que abrir, escolha 'Salvar como PDF' se quiser o arquivo.";
  - depois, `window.print()`;
  - na impressão, só a folha aparece, em tamanho real;
  - `@page` recebe o tamanho A4 com a orientação da folha e margem 0, e as cores saem exatas
    (`print-color-adjust: exact`);
  - dicas, seleção e grade não saem no papel.

### Navegadores

Chrome, Edge e Firefox recentes, no Windows. Internet Explorer fica de fora.

## 5. Hospedagem e repositório

- **Local e repositório:** a pasta local é `Fluxograma Facil`. O repositório é
  `paulosgp/fluxograma-facil`, **público** (o Pages gratuito só serve repositório público), branch
  `master`. O Pages publica a raiz do `master`, com `.nojekyll`.
- **Endereço:** o provisório é `paulosgp.github.io/fluxograma-facil`. Um endereço próprio fica para
  depois, por decisão do Paulo. Como o sistema serve a Regional inteira, talvez não fique no
  domínio de São Mateus.
- **Publicar só com o OK explícito do Paulo,** porque é conteúdo público.
- **Espelho `apps`:** a pasta entra no `PREFIX_MAP` do gancho
  (`.claude/scripts/sync-apps-monorepo.js`), como os outros apps.
- **Prévia local:** o `.claude/launch.json` da raiz ganha a entrada `fluxograma-facil`, rodando
  `node "Fluxograma Facil/servir.js"` na porta 5180.
- **Documentação:** o app ganha o próprio `CLAUDE.md`, e o da raiz ganha um item sobre ele.

## 6. Testes

- **Unitários, no Node e sem dependência:**
  - `modelo`: criar, mover, duplicar, ligar, apagar em cascata;
  - `historico`;
  - `setas`: alinhadas, desalinhadas, reta com losango e com círculo, lados forçados em Z, L e U,
    rótulo;
  - `encaixe`;
  - `arquivo`: a validação aceita o que é bom, recusa lixo e conserta números fora da faixa;
  - `modelos`: o modelo em branco é válido, toda seta aponta para uma forma que existe, e nenhuma
    forma sai da folha nem se sobrepõe a outra.
- **No navegador (painel de prévia), clicando como um usuário:**
  1. começar com o modelo;
  2. escrever em três formas;
  3. criar forma pelo "+";
  4. ligar pelo botão Seta;
  5. pôr SIM e NÃO;
  6. mudar a cor;
  7. apagar e desfazer;
  8. salvar o arquivo, recarregar a página e abrir o arquivo de novo;
  9. ver a impressão.

  O Paulo recebe capturas de tela do resultado.

## 7. Fora desta versão

- o brasão ou logo do município;
- mais de uma página;
- seta solta, sem estar presa a forma;
- girar forma;
- qualquer texto clínico pronto;
- celular otimizado;
- exportar imagem PNG;
- login, painel da Regional, trabalho a várias mãos;
- negrito em só uma parte do texto.

## 8. Pequenas decisões tomadas no desenho (conferir com o Paulo)

- **Alinhar o texto à esquerda,** além de centralizado. Serve para listas como a de "sinais de
  alarme" do exemplo.
- **Selecionar várias formas arrastando por cima,** para mover um pedaço do fluxo de uma vez.
- **O negrito vale para o texto inteiro da forma,** o que é mais previsível para quem tem
  dificuldade.
- **O "+" cria uma forma igual à escolhida,** e ela pode ser trocada depois pelo painel.
