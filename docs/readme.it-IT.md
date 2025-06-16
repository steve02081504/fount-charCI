# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)
[![Deutsch](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Germany.png)](./readme.de-DE.md)
[![Español](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Spain.png)](./readme.es-ES.md)
[![Français](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/France.png)](./readme.fr-FR.md)
[![हिन्दी](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/India.png)](./readme.hi-IN.md)
[![Italiano](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Italy.png)](./readme.it-IT.md)
[![한국어](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/South-Korea.png)](./readme.ko-KR.md)
[![Português (Brasil)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Brazil.png)](./readme.pt-BR.md)
[![Русский](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Russia.png)](./readme.ru-RU.md)
[![Tiếng Việt](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Vietnam.png)](./readme.vi-VN.md)

Uno strumento di Integrazione Continua (CI) conciso ma potente, progettato specificamente per gli sviluppatori di ruoli [fount](https://github.com/steve02081504/fount) per automatizzare i test e garantire che i tuoi ruoli vengano eseguiti in modo stabile.

Ti aiuta a individuare errori a livello di codice come problemi di sintassi, chiamate API fallite ed eccezioni nelle funzioni degli strumenti, garantendo così l'usabilità di base del tuo ruolo prima del rilascio e impedendo che errori banali influiscano sull'esperienza dell'utente.

## ✨ Funzionalità

Questo strumento CI si concentra sul test della robustezza programmatica del tuo ruolo, coprendo principalmente le seguenti aree:

- ✅ **Test Strutturati**: organizza i tuoi casi di test utilizzando blocchi `test` simili a Jest, con supporto per qualsiasi livello di annidamento, rendendo i tuoi script di test chiari e facili da leggere.
- ✅ **Test Concorrenti e Sequenziali**: supporto per l'esecuzione di test in parallelo per aumentare la velocità o per garantire l'esecuzione sequenziale con `await`.
- ✅ **Hook di Test**: fornisce funzioni hook `beforeAll`, `afterAll`, `beforeEach` e `afterEach` per configurare e smantellare l'ambiente in diverse fasi del ciclo di vita del test.
- ✅ **Ambienti di Test Isolati**: ogni test ha il proprio spazio di lavoro indipendente e pulito automaticamente (per le operazioni sui file) e un router HTTP, evitando interferenze tra i test.
- ✅ **Guidato da Asserzioni**: verifica i risultati dei test con la funzione `assert`, che segnala messaggi di errore chiari in caso di fallimento.
- ✅ **Simulazione di Interazione Multi-step**: simula con precisione il flusso completo "pensa -> usa strumento -> rispondi" dell'IA, testando la logica complessa di `replyHandler`.
- ✅ **Ispezione dei Log di Sistema e dei Prompt**: in grado di ispezionare le informazioni a livello di sistema restituite all'IA dopo l'esecuzione dello strumento e persino di recuperare il prompt finale inviato all'IA, garantendo che la logica e l'elaborazione dei dati siano come previsto.
- ✅ **Report di Test Dettagliati**: genera automaticamente report di riepilogo dei test belli e interattivi in GitHub Actions, inclusi la durata, i log e i dettagli degli errori per ogni test.

> Data la natura non deterministica dei contenuti generati da LLM, questo strumento **non può** valutare la qualità di un prompt o il merito dei contenuti generati dall'IA. Il suo valore principale risiede nel garantire la correttezza delle parti programmatiche del ruolo.

## 🚀 Avvio Rapido

Configura test automatizzati per il tuo progetto di ruolo fount in soli tre passaggi.

### Passaggio 1: Creare il File del Flusso di Lavoro

Nella directory principale del tuo progetto di ruolo, crea il file di configurazione CI: `.github/workflows/CI.yml`.

### Passaggio 2: Popolare con il Modello

Incolla il seguente contenuto nel file `CI.yml`. Eseguirà automaticamente i test al momento del push del codice.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Necessario per l'aggiornamento della cache

on:
  # Consenti attivazione manuale
  workflow_dispatch:
  # Attiva automaticamente quando i file .mjs vengono modificati
  push:
    paths:
      - '**.mjs'
    # Ignora i push di tag per evitare l'attivazione al rilascio di versioni
    tags-ignore:
      - '*'
    # Consenti push da qualsiasi ramo
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Specifica il percorso del tuo script di test CI
          CI-filepath: .github/workflows/CI.mjs
          # (Opzionale) Specifica un nome utente per la CI, il valore predefinito è "CI-user"
          # CI-username: my-ci-user
```

### Passaggio 3: Creare lo Script di Test CI

Nella directory principale del tuo progetto di ruolo, crea il file di ingresso CI: `.github/workflows/CI.mjs`. Di seguito è riportato un modello di test di base e moderno:

```javascript
// fountCharCI viene automaticamente iniettato nell'ambito globale e può essere utilizzato direttamente
const CI = fountCharCI;

// --- Caso di Test 1: Gestione del fallback senza una fonte AI ---
await CI.test('noAI Fallback', async () => {
	// Rimuovi la fonte AI per testare il gestore di fallback
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput senza argomenti simula una richiesta vuota o predefinita
	await CI.runOutput();
	// Se non viene generato alcun errore, il test passa
});

// --- Caso di Test 2: Conversazione AI di base ---
await CI.test('Basic AI Response', async () => {
	// Assicurati che sia impostata una fonte AI
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simula l'input dell'utente "Ciao" e controlla il contenuto finale restituito dal ruolo
	const { reply } = await CI.runInput('Ciao');

	// Afferma che l'output finale del ruolo corrisponde a quanto restituito dalla fonte AI
	// La fonte AI mock di CI restituisce per impostazione predefinita "Se non ti vedrò più, buongiorno, buon pomeriggio e buonanotte."
	CI.assert(reply.content.includes('buongiorno'), 'Il personaggio non è riuscito a restituire correttamente il contenuto AI.');
});
```

Una volta completati questi passaggi, il flusso di lavoro di test verrà eseguito automaticamente ogni volta che si esegue il push di un aggiornamento a un file `.mjs` nel repository GitHub.

## 📖 Riferimento API CI

`fount-charCI` fornisce un'API concisa ma potente per la creazione dei test.

### Definizione dei Test

#### `CI.test(name, asyncFn, options)`

Definisce un blocco di test. Può essere un test di primo livello o annidato all'interno di altri blocchi `test` per formare sotto-test.

- `name` (Stringa): una descrizione del test.
- `asyncFn` (Funzione): una funzione asincrona contenente la logica del test.
- `options` (Oggetto, Opzionale): opzioni di configurazione per il comportamento del test.
  - `start_emoji` (Stringa): Emoji visualizzata all'avvio del test. Predefinito `🧪`.
  - `success_emoji` (Stringa): Emoji visualizzata quando il test ha esito positivo. Predefinito `✅`.
  - `fail_emoji` (Stringa): Emoji visualizzata quando il test fallisce. Predefinito `❌`.

#### Test Concorrenti e Sequenziali

`CI.test` restituisce un oggetto simile a una Promise, il che rende molto semplice il controllo del flusso di esecuzione.

- **Esecuzione Sequenziale**: utilizza `await` quando chiami `CI.test` se desideri che i test vengano eseguiti uno dopo l'altro in ordine.
- **Esecuzione Concorrente**: puoi chiamare più test indipendenti senza `await` per eseguirli in parallelo.

### Hook di Test

Queste funzioni consentono di eseguire codice in diversi punti del ciclo di vita del test, ideali per configurare e smantellare ambienti di test condivisi.

- `CI.beforeAll(asyncFn)`: viene eseguito una volta prima di tutti i test nell'ambito corrente (all'interno di un blocco `test`).
- `CI.afterAll(asyncFn)`: viene eseguito una volta dopo il completamento di tutti i test nell'ambito corrente.
- `CI.beforeEach(asyncFn)`: viene eseguito prima di ogni test nell'ambito corrente.
- `CI.afterEach(asyncFn)`: viene eseguito dopo il completamento di ogni test nell'ambito corrente.

```javascript
// Esempio: Utilizzo di hook e dati di contesto برای مدیریت یک پایگاه داده ساختگی
CI.test('Test con un database condiviso', async () => {
	CI.beforeAll(() => {
		console.log('Inizializzazione del database mock...');
		// Utilizza l'oggetto context.data per archiviare risorse condivise all'interno dell'ambito
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Test del database completati. Visite finali: ${finalCount}`);
	});

	CI.test('La visita dell'utente incrementa il contatore', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Le visite dovrebbero essere maggiori di 0');
	});
});
```

### Contesto del Test

#### `CI.context`

Un oggetto magico che fornisce l'accesso all'ambiente isolato del **test corrente**.

- `CI.context.workSpace`:
  - `path` (Stringa): il percorso assoluto della directory di lavoro univoca del test corrente.
- `CI.context.http`:
  - `router` (Router Express): un'istanza del router Express esclusiva per questo test.
  - `url` (Stringa): l'URL completo برای دسترسی به روتر اختصاصی این تست.
- `CI.context.data` (Oggetto): un oggetto vuoto utilizzato per passare dati tra gli hook di un test e il suo corpo.

### Simulazione dell'Interazione

#### `CI.runInput(input, request)`

Simula un **utente che invia un messaggio** al ruolo.

- `input` (Stringa | Oggetto): l'input dell'utente.
- `request` (Oggetto, Opzionale): un oggetto di richiesta parziale per sovrascrivere i parametri di richiesta predefiniti.
- **Restituisce** (Oggetto): un oggetto contenente informazioni di debug dettagliate:
  - `reply` (Oggetto): il risultato finale restituito da `GetReply` del ruolo.
  - `prompt_struct` (Oggetto): il prompt strutturato inviato all'IA.
  - `prompt_single` (Stringa): il prompt inviato all'IA, convertito in una singola stringa.

#### `CI.runOutput(output, request)`

Simula l'**output dell'IA** per testare il `replyHandler` del ruolo.

- `output` (Stringa | Array | Funzione): il contenuto simulato restituito dall'IA.
  - **Stringa**: simula l'IA che restituisce direttamente questa stringa.
  - **Array**: simula un'interazione multi-step. Ogni elemento nell'array, che può essere una stringa o una funzione, viene utilizzato in sequenza come valore di ritorno dell'IA.
  - **Funzione**: genera dinamicamente l'output dell'IA.
    - **Asincrona**: la funzione può essere `async`.
    - **Parametri**: la funzione riceve un oggetto `result` contenente `prompt_single` e `prompt_struct` come argomento.
    - **Valore di Ritorno**: il valore di ritorno della funzione diventa il **successivo** output dell'IA nella sequenza.
    - **Caso d'Uso**: è estremamente utile per effettuare asserzioni o eseguire logiche complesse nel mezzo di un'interazione multi-step.

- `request` (Oggetto, Opzionale): come `CI.runInput`.
- **Restituisce** (Oggetto): il risultato finale da `GetReply` del ruolo.

#### L'Oggetto `result`

Il valore di ritorno delle funzioni di interazione (o la loro proprietà `reply`) ha origine dal valore di ritorno di `GetReply` del ruolo e in genere include:

- **`content`** (Stringa): il contenuto testuale finale presentato all'utente.
- **`logContextBefore`** (Array|Undefined): un array di log dei messaggi che registrano tutta la cronologia prima della generazione del `content` finale, inclusi i messaggi con il ruolo `tool` (risultati dell'esecuzione dello strumento), il ruolo `user` e il ruolo `char`.

### Strumenti Utilità

- `CI.assert(condition, message)`: esegue un'asserzione.
- `CI.char`: una scorciatoia per accedere all'oggetto dell'istanza del ruolo attualmente caricato.
- `CI.sleep(ms)`: mette in pausa l'esecuzione per il numero specificato di millisecondi.
- `CI.wait(fn, timeout)`: esegue il polling della funzione `fn` finché non restituisce un valore truthy o scade il timeout.

## 💡 Utilizzo Avanzato

### Test delle Funzioni di Operazione sui File

Puoi testare in sicurezza le funzioni che leggono e scrivono file utilizzando `CI.context.workSpace`.

**Esempio:** Test della funzione `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Funzione: <run-bash>', async () => {
	// Utilizza il percorso dello spazio di lavoro isolato
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory creata.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> non è riuscito a creare la directory.');
	CI.assert(result.content === 'Directory creata.', 'Il messaggio finale non è corretto.');
});
```

### Test della Navigazione Web (con asserzioni di passaggi intermedi)

Puoi costruire test complessi di interazione di rete utilizzando `CI.context.http` e l'argomento funzione di `runOutput`.

**Esempio:** Test della funzione `<web-browse>` e convalida del contenuto del suo prompt.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Funzione: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Questo è un paragrafo di prova.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. L'IA decide di navigare nella pagina
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Utilizza una funzione per convalidare il passaggio intermedio e fornire la successiva risposta dell'IA
		async (midResult) => {
			// Asserzione: controlla se il prompt inviato all'IA include il contenuto della pagina web
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Questo è un paragrafo di prova'), 'Il contenuto web non era nel prompt.');

			// Restituisci la risposta finale dell'IA
			return 'Il paragrafo dice: Questo è un paragrafo di prova.';
		}
	]);

	// Asserzione: controlla se il contenuto finale fornito all'utente è corretto
	CI.assert(result.content.includes('Il paragrafo dice'), 'La risposta finale non è corretta.');
});
```

## Ti senti ancora perso?

Dai un'occhiata a come fa il primo ruolo fount del mondo, [`Gentian`](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)!
