# CLAUDE.md — Fluxograma Fácil

Editor de fluxograma **em branco**, feito para os municípios da **6ª Regional de Saúde (União da
Vitória)** montarem o fluxo municipal do plano de contingência das arboviroses (a dengue,
principalmente).

O pedido chegou em 29/09/2026. A coordenadora da Regional pediu ao Paulo "um fluxograma editável",
e o exemplo que ela deu foi o *Fluxo Assistencial – Dengue CID A90* de Curitiba (v10,
09/12/2024).

A decisão que define o sistema é do Paulo: *"Eu não quero que você escreva nada (a não ser o
título apenas, que também deve ser editável), e uns quadradinhos, bolinhas, retângulos (como no
pdf) em branco para o pessoal preencher da forma que eles quiserem... tem que ser mais simples do
que já existe atualmente em programas como PowerPoint, Paint etc"* — porque *"são pessoas que têm um
pouco de dificuldade com computador"*.

Desenho aprovado: [docs/superpowers/specs/2026-09-29-fluxograma-facil-design.md](docs/superpowers/specs/2026-09-29-fluxograma-facil-design.md).
Plano de construção: [docs/superpowers/plans/2026-09-29-fluxograma-facil.md](docs/superpowers/plans/2026-09-29-fluxograma-facil.md)
(o código dos blocos `arquivo=` foi a primeira versão; o que vale é o que está nos arquivos).

## Infraestrutura compartilhada

Vale a regra da pasta raiz ([`.claude apps/CLAUDE.md`](../CLAUDE.md)). Este app não tem banco,
login, chave nem dado de paciente, então as regras de RLS/LGPD de lá não o alcançam. O que se aplica
é manter este arquivo atualizado sem esperar ser pedido.

## O que é e o que não é

- **É** um editor com o mínimo de ferramentas:
  - formas: retângulo, arredondado, losango, círculo e texto solto;
  - setas presas às formas;
  - cor, borda, letra e negrito;
  - um modelo em branco que repete a estrutura da página 1 de Curitiba;
  - impressão/PDF em A4;
  - arquivo para salvar e abrir de novo.
- **Não escreve conteúdo nenhum.** O único texto pronto é o título do modelo ("Fluxo de atendimento
  – Dengue"), e ele é editável. **Não acrescente texto clínico a modelo algum** sem o Paulo pedir: foi a
  primeira coisa que ele recusou.
- **Não tem servidor.** Tudo roda no navegador de quem usa. O trabalho fica guardado sozinho no
  `localStorage` daquele navegador (chave `fluxograma-facil:documento`) e, pelo botão, num arquivo
  `.json` que se abre pelo próprio site.

### Os princípios de uso, que valem para qualquer mudança

O público tem dificuldade com computador. Por isso:

- **Botões grandes, com desenho E nome.** Nenhum botão só com ícone, nada que só apareça ao passar o
  mouse.
- **O painel da direita fica sempre no mesmo lugar** e muda conforme o que está escolhido. Não há
  menu de clique direito nem barra flutuante.
- **Clicar numa forma é escrever nela. Arrastar é mover.** Não existe duplo clique para aprender.
- **Tudo se desfaz.** Por isso apagar não pede confirmação.
- **O desenho se arruma sozinho:** grade de 10 px, linhas-guia, setas em ângulo reto e caixas que
  crescem com o texto.

## Arquivos

```
index.html        casca da tela (barra, paleta, folha, painel, tela inicial, diálogo)
estilo.css        tela e impressão
js/paleta.js      constantes: cores (por NOME), tipos, tamanhos, folha A4, limites
js/geometria.js   área do texto de cada forma, altura necessária, ponto no contorno
js/setas.js       caminho das setas (puro)
js/encaixe.js     grade, margem, linhas-guia (puro)
js/modelo.js      o documento e as operações — cada uma devolve um documento NOVO
js/historico.js   pilhas de desfazer/refazer (fotos JSON)
js/loja.js        documento + seleção + lotes de desfazer; avisa quem desenha
js/modelos.js     o modelo em branco (15 formas, 11 setas) e a folha vazia
js/arquivo.js     validar/consertar arquivo, nome do arquivo, guardar, baixar, abrir
js/desenho.js     desenha na folha (só reflete, não decide)
js/interacao.js   mouse e teclado: escrever, mover, alças, laço, "+", modo seta
js/painel.js      painel da direita
js/busca.js       motor do "Tire sua dúvida" (puro) — ver a seção própria
js/duvidas.js     a BASE do "Tire sua dúvida": perguntas, jeitos de perguntar, passos
js/duvidas-tela.js a janela do "Tire sua dúvida"
js/app.js         liga tudo: barra, tela inicial, diálogos, guardado automático, impressão
testes/           node --test  (158 testes, só dos módulos puros)
servir.js         servidor da prévia: node servir.js → http://localhost:5180
fontes/           Archivo e Source Sans 3, copiadas do Guia Saúde
```

**Prévia:** `preview_start` com o nome `fluxograma-facil` (entrada no `.claude/launch.json` da
raiz). Módulos ES não carregam com o `index.html` aberto direto do disco, e por isso existe o
`servir.js`.

## Decisões que não são óbvias no código

- **Documento imutável e loja com lotes.** Toda operação do `modelo.js` devolve outro documento, e
  o desfazer só guarda fotos. A loja agrupa mudanças num lote (`comecar` → várias `trocar` →
  `confirmar`), e o lote vira **um** passo de desfazer:
  - arrastar vai do apertar ao soltar;
  - digitar vai até 1 s parado ou até sair da forma.
- **O texto que está sendo editado nunca é reescrito pelo desenho.** Reescrever faria o cursor pular
  para o começo no meio da digitação.
- **As formas só são reordenadas no DOM quando a ordem muda de fato,** porque mover um nó tira o
  foco dele.
- **O painel só troca o próprio HTML quando o conteúdo muda.** Clicar no painel tira o foco de um
  texto em edição; isso redesenha tudo, e, se o painel fosse refeito, o botão sob o mouse mudaria
  entre o apertar e o soltar, e o clique se perderia.
- **`contenteditable="plaintext-only"`,** com recuo para `true` e colar só texto. O motivo é não
  entrar negrito ou cor colados do Word. O negrito vale para a forma inteira, decisão aprovada:
  é mais previsível.
- **Cores guardadas por nome** (`azul`, `vermelho`...), nunca por código. Assim um tom pode ser
  ajustado em `paleta.js` sem estragar arquivo salvo.
- **Setas retas sempre que as formas "se enxergam",** como as de Curitiba, que saem do vértice do
  losango direto para a caixa ao lado. No losango e no círculo, porém, a reta só é aceita **perto
  do meio do lado** (um quarto da medida). Mais longe, ela encostaria na aresta inclinada e a seta
  pareceria sair de lado; nesse caso ela sai do vértice e dobra. O defeito foi visto no teste no
  navegador em 29/09/2026 e está coberto em `testes/setas.test.js`.
- **Forma nova sem lugar livre nasce POR CIMA das outras,** perto do meio da tela, com aviso para
  arrastá-la. O modelo ocupa a folha quase inteira, e a primeira versão respondia "A folha está
  cheia" a quem estava vendo espaço na tela.
- **O "+" continua recusando quando não cabe** ("não cabe outra forma desse lado"). A seta dele tem
  direção, e pôr a forma em outro lugar enganaria.
- **O primeiro começo não entra no Desfazer.** Logo depois de "Começar com o modelo", o Desfazer
  levaria a uma folha vazia que a pessoa nunca viu. Trocar um fluxograma que já tinha conteúdo
  continua desfazível (`loja.carregar(doc, { desfazivel })`).
- **Backspace numa forma escolhida (sem o cursor nela) apaga uma letra, não a forma.** O desenho
  aprovado dizia "Delete/Backspace apagam", mas digitar uma letra com a forma escolhida já começa a
  escrever nela, e o Backspace apagar a forma inteira seria uma surpresa. Quem apaga a forma é o
  Delete ou o botão.
- **O losango nasce com 180 × 120 e o círculo com 110 × 110** (o desenho previa 150 × 100 e
  100 × 100). A área útil de texto deles é bem menor que a forma, e no tamanho previsto só cabia
  uma palavra curta por linha.
- **O zoom ocupa a largura da área central** (entre 0,5 e 1,2), com rolagem na vertical. O desenho
  falava em "caber na tela", mas a folha inteira na altura de um notebook deixaria a letra com
  8 px. O `scrollbar-gutter: stable` do `.palco` não é enfeite: sem ele, a barra vertical aparecia
  depois do cálculo do zoom, roubava 15 px e criava rolagem horizontal.
- **As camadas da folha têm `z-index` explícito** (setas 1, título 2, formas 3, rótulos 4,
  controles 5). Isso deixa a forma escolhida subir (`z-index: 1`) dentro da camada das formas sem
  cobrir rótulos e controles. A ordem de impressão continua sendo a do documento.
- **Na impressão, a folha tem 296 mm, 1 mm a menos que o papel,** para não sair uma página em branco
  a mais por arredondamento. Isso foi conferido com o Playwright: `emulateMedia('print')` e
  `page.pdf()` deram **uma** página, sem grade, dicas ou seleção, e com as cores.
- **Deitar a folha com o modelo amontoa as formas embaixo.** O modelo foi desenhado em pé, e virar
  só traz para dentro o que ficaria de fora. O Desfazer resolve. Se o Paulo pedir, dá para fazer um
  modelo próprio para a folha deitada.
- **O botão "Ajuda" deu lugar ao "Tire sua dúvida"** (29/09/2026). O passo a passo que ficava nele
  virou a resposta "Como usar o sistema, do começo ao fim?".
- **Nada é guardado enquanto a tela inicial está aberta.** O `beforeunload` guarda ao sair. Sem essa
  trava, quem recarregava ainda na tela inicial gravava a folha vazia e nunca mais via a tela inicial.
- **O aviso da barra é só "✓ Guardado".** A frase inteira fica no `title`. Com "Guardado neste
  computador", a barra quebrava em duas linhas num notebook de 1366 px e roubava altura da folha.

## Tire sua dúvida (29/09/2026)

Pedido do Paulo: *"Tem como colocar um botão onde a pessoa que tem dificuldade e tem alguma dúvida,
ela digita ali a dúvida e o sistema avisa como ela deve fazer?"*. Ele escolheu a **busca sem IA**,
pelo mesmo motivo do Organograma e do Protocolos Institucionais: custo zero, nada de servidor nem
de chave, e nenhuma cota que um estranho possa gastar pelo link público. Desenho em
`docs/superpowers/specs/2026-09-29-tire-sua-duvida-design.md`.

- **O que a pessoa vê:**
  - escreve a dúvida do jeito dela e recebe a resposta em passos numerados, mais "Talvez você
    queira saber" com até duas parecidas;
  - com o campo vazio, ou quando a busca não entende, aparecem as perguntas mais comuns
    (`COMUNS`);
  - **"Mostrar na tela"** fecha a janela e faz o botão certo **piscar** em laranja (classe
    `.piscando`, que força `opacity: 1` porque o Desfazer desligado é semitransparente). É o recurso
    que mais ajuda quem tem dificuldade.
- **O motor (`busca.js`)** é adaptado do `busca.js` do Organograma da Saúde:
  - tira acento;
  - ignora palavras vazias;
  - entende plural;
  - perdoa erro de digitação;
  - e uma frase conhecida inteira na pergunta vale mais que palavras soltas.

  Duas regras novas saíram dos erros das frases de teste:
  - **termo com "sim" ou "não" só vale como frase inteira.** Palavra por palavra, "não consigo
    mover" viraria "mover", e "não na seta" viraria "seta";
  - **frase de várias palavras com uma só de conteúdo também só vale inteira.** "Mais uma caixa"
    virava "caixa" e respondia qualquer dúvida sobre caixas. Palavra solta ("negrito",
    "desfazer") continua tolerando plural e erro.

  Dentro de frase inteira, "sim" e "não" contam no peso. Por isso "escrevo sim" ganha de
  "escrevo".
- **A base (`duvidas.js`)** tem 43 perguntas **sobre o uso do sistema; nada clínico**. **É na base
  que se ensina, não no motor.** Quando uma pergunta cair na resposta errada:
  1. acrescente frases com **duas palavras de conteúdo** nos `termos` do item certo;
  2. acrescente um caso em `testes/duvidas.test.js`.

  Cuidado com palavra solta que fica a uma letra de uma palavra comum: "grade" pegava "grave", e
  "gravar" pegava "grave", o que fazia "dengue grave" cair em "salvar".
- **Os testes:**
  - `testes/duvidas.test.js` tem 85 frases do jeito que as pessoas escrevem, cada uma com a
    resposta esperada, mais três perguntas fora do assunto que têm de ficar sem resposta;
  - todo `mostrar` tem de existir no `index.html`.
- **Limite conhecido:** como nada sai do computador, não há como saber o que as pessoas perguntaram.
  A lista melhora com o que o Paulo for contando.

## Armadilha para testar

**Limpar o `localStorage` e recarregar não volta à tela inicial**, porque o `beforeunload` guarda o
trabalho de novo ao sair. Para simular a primeira visita:
`Storage.prototype.setItem = () => {}; localStorage.clear(); location.reload()`. A troca do
`setItem` morre na recarga.

Pelo painel de navegador do app, a digitação "type" injeta texto sem gerar teclas. Por isso o atalho
"digitar com a forma escolhida" só pode ser testado com teclas de verdade (a ação "key" ou o
Playwright).

## A marca do autor, o manual e o roteiro (30/09/2026)

- **Marca.** O Paulo pediu *"registra a minha marca... Sistema criado por Enf. Paulo Gomes, contato:
  paulosergiogp@hotmail.com ou algo melhor"*. Ficou assim: "Criado por **Enf. Paulo Gomes** · São
  Mateus do Sul – PR / Dúvidas, sugestões ou problemas: e-mail". A linha virou também um canal de
  retorno, que a busca sem servidor não tem.
  - **Onde aparece:** na tela inicial, no pé do painel da direita e no "Tire sua dúvida" (a pergunta
    `quem-fez`, com botão de e-mail), além do `<meta name="author">`.
  - **Fonte única:** `js/creditos.js`. Para trocar o e-mail ou o nome, mude lá. O `manual.html` e o
    roteiro têm o texto escrito à mão e precisam ser mudados junto, e depois gera-se o PDF de novo.
  - **O fluxograma IMPRESSO não leva a marca, de propósito:** ele é o documento oficial de cada
    município.
  - O e-mail foi usado exatamente como o Paulo escreveu. O e-mail da conta dele é outro, do Gmail.
- **Manual.** Está em `manual.html` (a página no site) e em `manual.pdf`, gerado dela pelo
  Playwright (`page.pdf`, A4, 7 páginas). As figuras ficam em `manual/*.png`, capturadas com
  `deviceScaleFactor: 2`. Há link na tela inicial, no rodapé do "Tire sua dúvida" e na resposta
  `manual`. Uma cópia do PDF está em `ESF/CURSOS E CAPACITAÇÕES/PLANO DE CONTIGENCIA - DENGUE`.
  Lições da paginação:
  - capture o conteúdo do painel e da paleta, não a coluna inteira, que tem um vazio embaixo;
  - a paleta sai melhor em linha, capturada na tela estreita;
  - não force quebra de página: `break-inside: avoid` nos blocos basta.
- **Roteiro de apresentação.** Fica em `docs/apresentacao/roteiro.html`, com PDF de 2 páginas na
  mesma pasta do plano de contingência. Não tem link no site: é para o Paulo apresentar. Tem "Faça /
  Fale" para cada passo da demonstração e as perguntas que costumam aparecer.
- **Tela estreita consertada.** Com menos de 900 px, a área de trabalho ficava presa na altura da
  janela e a paleta encolhia até sumir. Apareceu ao capturar a figura da paleta. Agora a área cresce
  com o conteúdo e a página rola.

## Publicação

**No ar em `https://fluxograma.guiaaps.com.br`** desde 30/09/2026, no GitHub Pages com domínio
próprio e HTTPS obrigatório. De 29 a 30/09 esteve em `paulosgp.github.io/fluxograma-facil`, que agora
redireciona sozinho (301) para o endereço novo.

- **O domínio.** O CNAME `fluxograma` → `paulosgp.github.io.` foi criado em 30/09/2026 na zona do
  `guiaaps.com.br` no Registro.br, pelo Claude in Chrome, com o Paulo logado e o "pode criar" dele.
  A zona fica no **modo avançado**. As outras entradas (4 A do site principal, `www`, e os CNAME da
  Vercel do documentos, encaminha e planifica) não foram tocadas.
  - **A ordem seguida:** primeiro o DNS; depois o arquivo `CNAME` e a API do Pages (`cname`); por
    último `https_enforced` com o certificado já `approved`, que saiu em poucos minutos.
  - **Armadilha:** a página do domínio no Registro.br tem **dois** botões "Salvar alterações". O da
    zona DNS fica logo abaixo da tabela, ao lado de Cancelar. O outro é o dos contatos.
- **O `localStorage` é por endereço.** O que alguém fez no link antigo não aparece no novo. Em 30/09
  isso não afetou ninguém, porque só o Paulo tinha testado. **Se o endereço mudar de novo com gente
  usando,** antes é preciso pedir a todos "Salvar no computador", para depois "Abrir" no endereço novo.

- **Repositório:** `paulosgp/fluxograma-facil`, **público** (o Pages gratuito só serve repositório
  público), branch `master`, publicado a partir da raiz. O Paulo autorizou ("Publicar agora").
- **Publicar = commit + `git push`.** O Pages atualiza em 1–2 min, e não há passo de montagem.
- **Por que `guiaaps.com.br`:** foi escolha do Paulo em 30/09/2026. É o domínio neutro "Guia APS",
  onde já estão o Planifica e o Protocolos, e combina com um sistema da Regional inteira.
  - **Por que a ordem DNS → Pages:** com o domínio ligado no Pages antes de o DNS existir, o link
    antigo redireciona para um endereço que não responde, e o site sai do ar.
  - **O Registro.br pede login do Paulo,** e senha é algo que o Claude não digita.
- **O espelho `apps`:** o app está no monorepo desde 29/09/2026 (entrou no `PREFIX_MAP` do gancho).
- **O que vai a público:** o repositório inteiro, inclusive `docs/` e este arquivo. Não há dado
  pessoal nem de paciente em lugar nenhum; mantenha assim.
