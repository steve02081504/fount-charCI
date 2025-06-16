# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./docs/readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./docs/readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./docs/readme.zh-CN.md)

Uma ferramenta de Integração Contínua (CI) concisa, porém poderosa, projetada especificamente para desenvolvedores de papéis [fount](https://github.com/steve02081504/fount) para automatizar testes e garantir que seus papéis sejam executados de forma estável.

Ela ajuda a detectar erros em nível de código, como problemas de sintaxe, chamadas de API com falha e exceções em funções de ferramentas, garantindo assim a usabilidade básica do seu papel antes do lançamento e evitando que erros triviais afetem a experiência do usuário.

## ✨ Recursos

Esta ferramenta de CI se concentra em testar a robustez programática do seu papel, cobrindo principalmente as seguintes áreas:

- ✅ **Testes Estruturados**: Organize seus casos de teste usando blocos `test` semelhantes ao Jest, com suporte para qualquer nível de aninhamento, tornando seus scripts de teste claros e fáceis de ler.
- ✅ **Testes Concorrentes e Sequenciais**: Suporte para executar testes em paralelo para aumentar a velocidade ou garantir a execução sequencial com `await`.
- ✅ **Ganchos de Teste**: Fornece funções de gancho `beforeAll`, `afterAll`, `beforeEach` e `afterEach` para configurar e desmontar o ambiente em diferentes estágios do ciclo de vida do teste.
- ✅ **Ambientes de Teste Isolados**: Cada teste tem seu próprio espaço de trabalho independente e limpo automaticamente (para operações de arquivo) e roteador HTTP, evitando interferência entre os testes.
- ✅ **Orientado a Asserções**: Verifique os resultados do teste com a função `assert`, que relata mensagens de erro claras em caso de falha.
- ✅ **Simulação de Interação em Múltiplas Etapas**: Simule com precisão o fluxo completo de "pensar -> usar ferramenta -> responder" da IA, testando lógicas complexas de `replyHandler`.
- ✅ **Inspeção de Log do Sistema e Prompt**: Capaz de inspecionar informações em nível de sistema retornadas à IA após a execução da ferramenta e até mesmo recuperar o prompt final enviado à IA, garantindo que a lógica e o processamento de dados estejam conforme o esperado.
- ✅ **Relatórios de Teste Detalhados**: Gera automaticamente relatórios de resumo de teste bonitos e interativos no GitHub Actions, incluindo a duração, logs e detalhes de erro para cada teste.

> Dada a natureza não determinística do conteúdo gerado por LLM, esta ferramenta **não pode** avaliar a qualidade de um prompt ou o mérito do conteúdo gerado por IA. Seu valor principal reside em garantir a correção das partes programáticas do papel.

## 🚀 Início Rápido

Configure testes automatizados para o seu projeto de papel fount em apenas três etapas.

### Etapa 1: Criar o Arquivo de Fluxo de Trabalho

No diretório raiz do seu projeto de papel, crie o arquivo de configuração de CI: `.github/workflows/CI.yml`.

### Etapa 2: Preencher com o Modelo

Cole o seguinte conteúdo no arquivo `CI.yml`. Ele executará testes automaticamente após os pushes de código.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Necessário para atualizar o cache

on:
  # Permitir acionamento manual
  workflow_dispatch:
  # Acionar automaticamente quando arquivos .mjs forem alterados
  push:
    paths:
      - '**.mjs'
    # Ignorar pushes de tag para evitar acionamento em lançamentos de versão
    tags-ignore:
      - '*'
    # Permitir pushes de qualquer branch
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Especifique o caminho para o seu script de teste de CI
          CI-filepath: .github/workflows/CI.mjs
          # (Opcional) Especifique um nome de usuário para a CI, o padrão é "CI-user"
          # CI-username: my-ci-user
```

### Etapa 3: Criar o Script de Teste de CI

No diretório raiz do seu projeto de papel, crie o arquivo de entrada de CI: `.github/workflows/CI.mjs`. Abaixo está um modelo de teste básico e moderno:

```javascript
// fountCharCI é injetado automaticamente no escopo global e pode ser usado diretamente
const CI = fountCharCI;

// --- Caso de Teste 1: Tratamento de fallback sem uma fonte de IA ---
await CI.test('noAI Fallback', async () => {
	// Remova a fonte de IA para testar o manipulador de fallback
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput sem argumentos simula uma solicitação vazia ou padrão
	await CI.runOutput();
	// Se nenhum erro for lançado, o teste passa
});

// --- Caso de Teste 2: Conversa básica com IA ---
await CI.test('Basic AI Response', async () => {
	// Garanta que uma fonte de IA esteja definida
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simule a entrada do usuário "Olá" e verifique o conteúdo final retornado pelo papel
	const { reply } = await CI.runInput('Olá');

	// Afirme que a saída final do papel corresponde ao que a fonte de IA retornou
	// A fonte de IA simulada da CI retorna por padrão "Se eu nunca mais te vir, bom dia, boa tarde e boa noite."
	CI.assert(reply.content.includes('bom dia'), 'O personagem falhou ao retornar o conteúdo da IA corretamente.');
});
```

Assim que essas etapas forem concluídas, o fluxo de trabalho de teste será executado automaticamente toda vez que você enviar uma atualização para um arquivo `.mjs` em seu repositório GitHub.

## 📖 Referência da API de CI

`fount-charCI` fornece uma API concisa, porém poderosa, para construir seus testes.

### Definindo Testes

#### `CI.test(name, asyncFn, options)`

Define um bloco de teste. Pode ser um teste de nível superior ou aninhado em outros blocos `test` para formar subtestes.

- `name` (String): Uma descrição do teste.
- `asyncFn` (Function): Uma função assíncrona contendo a lógica do teste.
- `options` (Object, Opcional): Opções de configuração para o comportamento do teste.
  - `start_emoji` (String): Emoji exibido quando o teste é iniciado. O padrão é `🧪`.
  - `success_emoji` (String): Emoji exibido quando o teste é bem-sucedido. O padrão é `✅`.
  - `fail_emoji` (String): Emoji exibido quando o teste falha. O padrão é `❌`.

#### Testes Concorrentes e Sequenciais

`CI.test` retorna um objeto semelhante a uma Promise, o que torna o controle do fluxo de execução muito simples.

- **Execução Sequencial**: Use `await` ao chamar `CI.test` se quiser que os testes sejam executados um após o outro em ordem.
- **Execução Concorrente**: Você pode chamar vários testes independentes sem `await` para que sejam executados em paralelo.

### Ganchos de Teste

Essas funções permitem executar código em diferentes pontos do ciclo de vida do teste, ideal para configurar e desmontar ambientes de teste compartilhados.

- `CI.beforeAll(asyncFn)`: Executa uma vez antes de todos os testes no escopo atual (dentro de um bloco `test`).
- `CI.afterAll(asyncFn)`: Executa uma vez após a conclusão de todos os testes no escopo atual.
- `CI.beforeEach(asyncFn)`: Executa antes de cada teste no escopo atual.
- `CI.afterEach(asyncFn)`: Executa após a conclusão de cada teste no escopo atual.

```javascript
// Exemplo: Usando ganchos e dados de contexto para gerenciar um banco de dados simulado
CI.test('Testes com um banco de dados compartilhado', async () => {
	CI.beforeAll(() => {
		console.log('Inicializando banco de dados simulado...');
		// Use o objeto context.data para armazenar recursos compartilhados dentro do escopo
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Testes de banco de dados concluídos. Visitas finais: ${finalCount}`);
	});

	CI.test('Visita do usuário incrementa o contador', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'As visitas devem ser maiores que 0');
	});
});
```

### Contexto de Teste

#### `CI.context`

Um objeto mágico que fornece acesso ao ambiente isolado do **teste atual**.

- `CI.context.workSpace`:
  - `path` (String): O caminho absoluto para o diretório de trabalho exclusivo do teste atual.
- `CI.context.http`:
  - `router` (Express Router): Uma instância do Express Router exclusiva para este teste.
  - `url` (String): A URL completa para acessar o roteador dedicado deste teste.
- `CI.context.data` (Object): Um objeto vazio usado para passar dados entre os ganchos de um teste e seu corpo.

### Simulando Interação

#### `CI.runInput(input, request)`

Simula um **usuário enviando uma mensagem** para o papel.

- `input` (String | Object): A entrada do usuário.
- `request` (Object, Opcional): Um objeto de solicitação parcial para substituir os parâmetros de solicitação padrão.
- **Retorna** (Object): Um objeto contendo informações detalhadas de depuração:
  - `reply` (Object): O resultado final retornado por `GetReply` do papel.
  - `prompt_struct` (Object): O prompt estruturado enviado à IA.
  - `prompt_single` (String): O prompt enviado à IA, convertido em uma única string.

#### `CI.runOutput(output, request)`

Simula a **saída da IA** para testar o `replyHandler` do papel.

- `output` (String | Array | Function): O conteúdo simulado retornado pela IA.
  - **String**: Simula a IA retornando esta string diretamente.
  - **Array**: Simula uma interação em várias etapas. Cada elemento no array, que pode ser uma string ou uma função, é usado sequencialmente como valor de retorno da IA.
  - **Function**: Gera dinamicamente a saída da IA.
    - **Async**: A função pode ser `async`.
    - **Parâmetros**: A função recebe um objeto `result` contendo `prompt_single` e `prompt_struct` como seu argumento.
    - **Valor de Retorno**: O valor de retorno da função se torna a **próxima** saída da IA na sequência.
    - **Caso de Uso**: Isso é extremamente útil para fazer asserções ou executar lógica complexa no meio de uma interação em várias etapas.

- `request` (Object, Opcional): O mesmo que `CI.runInput`.
- **Retorna** (Object): O resultado final de `GetReply` do papel.

#### O Objeto `result`

O valor de retorno das funções de interação (ou sua propriedade `reply`) origina-se do valor de retorno de `GetReply` do papel e normalmente inclui:

- **`content`** (String): O conteúdo de texto final apresentado ao usuário.
- **`logContextBefore`** (Array|Undefined): Um array de logs de mensagens registrando todo o histórico antes que o `content` final fosse gerado, incluindo mensagens com o papel `tool` (resultados da execução da ferramenta), papel `user` e papel `char`.

### Ferramentas Utilitárias

- `CI.assert(condition, message)`: Realiza uma asserção.
- `CI.char`: Um atalho para acessar o objeto de instância de papel atualmente carregado.
- `CI.sleep(ms)`: Pausa a execução pelo número especificado de milissegundos.
- `CI.wait(fn, timeout)`: Sonda a função `fn` até que ela retorne um valor verdadeiro ou o tempo limite seja atingido.

## 💡 Uso Avançado

### Testando Funções de Operação de Arquivo

Você pode testar com segurança funções que leem e gravam arquivos usando `CI.context.workSpace`.

**Exemplo:** Testando a função `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Função: <run-bash>', async () => {
	// Use o caminho do espaço de trabalho isolado
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Diretório criado.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> falhou ao criar o diretório.');
	CI.assert(result.content === 'Diretório criado.', 'A mensagem final está incorreta.');
});
```

### Testando Navegação na Web (com asserções de etapas intermediárias)

Você pode construir testes complexos de interação de rede usando `CI.context.http` e o argumento de função de `runOutput`.

**Exemplo:** Testando a função `<web-browse>` e validando o conteúdo do seu prompt.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Função: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Este é um parágrafo de teste.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. A IA decide navegar na página
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Use uma função para validar a etapa intermediária e fornecer a próxima resposta da IA
		async (midResult) => {
			// Asserção: Verifique se o prompt enviado à IA inclui o conteúdo da página da web
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Este é um parágrafo de teste'), 'O conteúdo da web não estava no prompt.');

			// Retorne a resposta final da IA
			return 'O parágrafo diz: Este é um parágrafo de teste.';
		}
	]);

	// Asserção: Verifique se o conteúdo final fornecido ao usuário está correto
	CI.assert(result.content.includes('O parágrafo diz'), 'A resposta final está incorreta.');
});
```

## Ainda se sentindo perdido?

Dê uma olhada em como o primeiro papel fount do mundo, [`Gentian`](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs), faz isso!
