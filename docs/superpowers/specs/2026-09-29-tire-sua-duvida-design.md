# "Tire sua dúvida" — desenho

29/09/2026. Pedido do Paulo: *"Tem como colocar um botão onde a pessoa que tem dificuldade e tem
alguma dúvida, ela digita ali a dúvida e o sistema avisa como ela deve fazer?"*

Havia três caminhos: busca sem IA, IA de verdade (Claude) ou busca agora com IA depois. O escolhido
foi a **busca sem IA**, pelo mesmo motivo do Organograma e do Protocolos Institucionais: custo zero,
nada de servidor nem de chave, e nenhuma cota para um estranho gastar pelo link público.

## O que a pessoa vê

- **O botão.** "Tire sua dúvida" entra na barra do alto **no lugar do "Ajuda"**. O passo a passo
  geral de hoje vira uma das respostas ("Como usar o sistema, do começo ao fim").
- **A janela.** Tem um campo grande, "Escreva sua dúvida do seu jeito", e o botão **Perguntar**
  (Enter também pergunta). A resposta sai em passos curtos, numerados.
- **"Mostrar na tela".** Quando a resposta fala de um botão ou lugar da tela, a janela fecha, a tela
  rola até ele se preciso e ele **pisca** (contorno laranja pulsando por uns 3 s). É o recurso que
  mais ajuda quem tem dificuldade: em vez de procurar o botão pelo nome, a pessoa vê onde ele está.
- **"Talvez você queira saber:"** mostra até duas outras respostas parecidas, clicáveis.
- **Campo vazio:** mostra as perguntas mais comuns (umas 8), clicáveis.
- **Não entendeu:** "Não entendi essa. Tente com outras palavras, ou escolha uma destas:" seguido das
  perguntas mais comuns.

## Como funciona

- **Base de perguntas (`js/duvidas.js`)**, uns 40 itens sobre **o uso do sistema**. Cada item é
  `{ id, pergunta, termos: [jeitos de perguntar], passos: [...], mostrar?: seletor, comum?: true }`.
  **Nenhum conteúdo clínico**, a mesma regra do resto do app.
- **Motor (`js/busca.js`)**, adaptado do `busca.js` do Organograma da Saúde, que já foi testado com
  gente de verdade. Ele:
  - tira acento e pontuação;
  - ignora palavras vazias ("como", "eu", "faço", "pra");
  - entende plural;
  - perdoa erro de digitação (1 letra a partir de 5; 2 a partir de 8);
  - dá peso maior a uma frase conhecida inteira dentro da pergunta.

  É puro (não mexe na página) e testado no Node.
- **Sinônimos** entram nos `termos` de cada pergunta: apagar/excluir/tirar/deletar, seta/flecha/
  linha/ligar, forma/caixa/quadrado/bolinha, voltar/errei/desfazer, e assim por diante. **É na base
  que se ensina, não no motor.**

## Testes

- **`testes/busca.test.js`:** umas 60 frases escritas do jeito que as pessoas escrevem ("errei como
  volta", "a seta ta torta", "quero imprimir", "como coloca sim e nao"), cada uma com a resposta
  esperada.
- **Integridade da base:** todo item tem pergunta, pelo menos 3 termos e pelo menos 1 passo; os `id`
  não se repetem; e todo seletor de "Mostrar na tela" existe no `index.html`.
- **No navegador:** abrir, perguntar, conferir que "Mostrar na tela" faz o botão certo piscar, e que
  o Esc fecha a janela.

## Fora desta versão

- IA (fica a porta: se um dia entrar, é só para o que a busca não achar);
- guardar as perguntas das pessoas (nada sai do computador, então não há como saber o que foi
  perguntado; o Paulo vai contando);
- voz.
