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

Ein prägnantes und dennoch leistungsstarkes Continuous Integration (CI)-Tool, das speziell für [fount](https://github.com/steve02081504/fount)-Rollenentwickler entwickelt wurde, um Tests zu automatisieren und sicherzustellen, dass Ihre Rollen stabil laufen.

Es hilft Ihnen, Fehler auf Codeebene wie Syntaxprobleme, fehlgeschlagene API-Aufrufe und Ausnahmen in Werkzeugfunktionen zu erkennen und so die grundlegende Benutzerfreundlichkeit Ihrer Rolle vor der Veröffentlichung zu gewährleisten und zu verhindern, dass triviale Fehler die Benutzererfahrung beeinträchtigen.

## ✨ Funktionen

Dieses CI-Tool konzentriert sich auf das Testen der programmatischen Robustheit Ihrer Rolle und deckt hauptsächlich die folgenden Bereiche ab:

- ✅ **Strukturiertes Testen**: Organisieren Sie Ihre Testfälle mit Jest-ähnlichen `test`-Blöcken, mit Unterstützung für jede Verschachtelungsebene, wodurch Ihre Testskripte klar und leicht lesbar werden.
- ✅ **Gleichzeitiges & sequentielles Testen**: Unterstützung für die parallele Ausführung von Tests zur Erhöhung der Geschwindigkeit oder Sicherstellung der sequentiellen Ausführung mit `await`.
- ✅ **Test-Hooks**: Bietet `beforeAll`, `afterAll`, `beforeEach` und `afterEach` Hook-Funktionen zum Einrichten und Abbauen der Umgebung in verschiedenen Phasen des Testlebenszyklus.
- ✅ **Isolierte Testumgebungen**: Jeder Test verfügt über einen eigenen unabhängigen, automatisch bereinigten Arbeitsbereich (für Dateioperationen) und HTTP-Router, um Interferenzen zwischen Tests zu vermeiden.
- ✅ **Assertion-gesteuert**: Überprüfen Sie Testergebnisse mit der `assert`-Funktion, die bei Fehlern klare Fehlermeldungen meldet.
- ✅ **Simulation mehrstufiger Interaktionen**: Simulieren Sie präzise den vollständigen "Denken -> Werkzeug verwenden -> Antworten"-Ablauf der KI und testen Sie komplexe `replyHandler`-Logik.
- ✅ **Systemprotokoll- & Prompt-Inspektion**: Kann Systeminformationen untersuchen, die nach der Werkzeugausführung an die KI zurückgegeben werden, und sogar den endgültigen Prompt abrufen, der an die KI gesendet wurde, um sicherzustellen, dass Logik und Datenverarbeitung wie erwartet sind.
- ✅ **Detaillierte Testberichte**: Generiert automatisch schöne, interaktive Testzusammenfassungsberichte in GitHub Actions, einschließlich Dauer, Protokolle und Fehlerdetails für jeden Test.

> Angesichts der nicht-deterministischen Natur von LLM-generierten Inhalten kann dieses Tool die Qualität eines Prompts oder den Wert von KI-generierten Inhalten **nicht** bewerten. Sein Kernwert liegt darin, die Korrektheit der programmatischen Teile der Rolle zu gewährleisten.

## 🚀 Schnellstart

Richten Sie automatisierte Tests für Ihr fount-Rollenprojekt in nur drei Schritten ein.

### Schritt 1: Erstellen der Workflow-Datei

Erstellen Sie im Stammverzeichnis Ihres Rollenprojekts die CI-Konfigurationsdatei: `.github/workflows/CI.yml`.

### Schritt 2: Füllen mit der Vorlage

Fügen Sie den folgenden Inhalt in die Datei `CI.yml` ein. Tests werden automatisch bei Code-Pushes ausgeführt.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Erforderlich für die Aktualisierung des Caches

on:
  # Manuelles Auslösen erlauben
  workflow_dispatch:
  # Automatisch auslösen, wenn .mjs-Dateien geändert werden
  push:
    paths:
      - '**.mjs'
    # Tag-Pushes ignorieren, um ein Auslösen bei Versionsfreigaben zu vermeiden
    tags-ignore:
      - '*'
    # Pushes von jedem Branch erlauben
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Geben Sie den Pfad zu Ihrem CI-Testskript an
          CI-filepath: .github/workflows/CI.mjs
          # (Optional) Geben Sie einen Benutzernamen für die CI an, standardmäßig "CI-user"
          # CI-username: mein-ci-benutzer
```

### Schritt 3: Erstellen des CI-Testskripts

Erstellen Sie im Stammverzeichnis Ihres Rollenprojekts die CI-Eingabedatei: `.github/workflows/CI.mjs`. Unten finden Sie eine moderne, grundlegende Testvorlage:

```javascript
// fountCharCI wird automatisch in den globalen Geltungsbereich injiziert und kann direkt verwendet werden
const CI = fountCharCI;

// --- Testfall 1: Fallback-Behandlung ohne KI-Quelle ---
await CI.test('noAI Fallback', async () => {
	// Entfernen Sie die KI-Quelle, um den Fallback-Handler zu testen
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput ohne Argumente simuliert eine leere oder Standardanforderung
	await CI.runOutput();
	// Wenn kein Fehler ausgelöst wird, ist der Test erfolgreich
});

// --- Testfall 2: Grundlegende KI-Konversation ---
await CI.test('Basic AI Response', async () => {
	// Stellen Sie sicher, dass eine KI-Quelle festgelegt ist
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simulieren Sie die Benutzereingabe "Hallo" und überprüfen Sie den endgültigen Inhalt, der von der Rolle zurückgegeben wird
	const { reply } = await CI.runInput('Hallo');

	// Stellen Sie sicher, dass die endgültige Ausgabe der Rolle mit dem übereinstimmt, was die KI-Quelle zurückgegeben hat
	// Die CI-Mock-KI-Quelle gibt standardmäßig "Wenn ich dich nie wiedersehe, guten Morgen, guten Tag und gute Nacht." zurück.
	CI.assert(reply.content.includes('guten Morgen'), 'Charakter konnte den KI-Inhalt nicht korrekt zurückgeben.');
});
```

Sobald diese Schritte abgeschlossen sind, wird der Test-Workflow jedes Mal automatisch ausgeführt, wenn Sie eine Aktualisierung einer `.mjs`-Datei in Ihrem GitHub-Repository pushen.

## 📖 CI-API-Referenz

`fount-charCI` bietet eine prägnante und dennoch leistungsstarke API zum Erstellen Ihrer Tests.

### Definieren von Tests

#### `CI.test(name, asyncFn, options)`

Definiert einen Testblock. Es kann ein Test auf oberster Ebene sein oder in andere `test`-Blöcke verschachtelt werden, um Untertests zu bilden.

- `name` (String): Eine Beschreibung des Tests.
- `asyncFn` (Function): Eine asynchrone Funktion, die die Testlogik enthält.
- `options` (Object, Optional): Konfigurationsoptionen für das Verhalten des Tests.
  - `start_emoji` (String): Emoji, das angezeigt wird, wenn der Test startet. Standardmäßig `🧪`.
  - `success_emoji` (String): Emoji, das angezeigt wird, wenn der Test erfolgreich ist. Standardmäßig `✅`.
  - `fail_emoji` (String): Emoji, das angezeigt wird, wenn der Test fehlschlägt. Standardmäßig `❌`.

#### Gleichzeitiges & sequentielles Testen

`CI.test` gibt ein Promise-ähnliches Objekt zurück, was die Steuerung des Ausführungsflusses sehr einfach macht.

- **Sequentielle Ausführung**: Verwenden Sie `await`, wenn Sie `CI.test` aufrufen, wenn Tests nacheinander ausgeführt werden sollen.
- **Gleichzeitige Ausführung**: Sie können mehrere unabhängige Tests ohne `await` aufrufen, damit sie parallel ausgeführt werden.

### Test-Hooks

Diese Funktionen ermöglichen es Ihnen, Code an verschiedenen Punkten im Testlebenszyklus auszuführen, ideal zum Einrichten und Abbauen gemeinsam genutzter Testumgebungen.

- `CI.beforeAll(asyncFn)`: Wird einmal vor allen Tests im aktuellen Geltungsbereich (innerhalb eines `test`-Blocks) ausgeführt.
- `CI.afterAll(asyncFn)`: Wird einmal ausgeführt, nachdem alle Tests im aktuellen Geltungsbereich abgeschlossen sind.
- `CI.beforeEach(asyncFn)`: Wird vor jedem Test im aktuellen Geltungsbereich ausgeführt.
- `CI.afterEach(asyncFn)`: Wird ausgeführt, nachdem jeder Test im aktuellen Geltungsbereich abgeschlossen ist.

```javascript
// Beispiel: Verwendung von Hooks und Kontextdaten zur Verwaltung einer Mock-Datenbank
CI.test('Tests mit einer gemeinsam genutzten Datenbank', async () => {
	CI.beforeAll(() => {
		console.log('Initialisiere Mock-Datenbank...');
		// Verwenden Sie das context.data-Objekt, um gemeinsam genutzte Ressourcen innerhalb des Geltungsbereichs zu speichern
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Datenbanktests abgeschlossen. Endgültige Besuche: ${finalCount}`);
	});

	CI.test('Benutzerbesuch erhöht Zähler', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Besuche sollten größer als 0 sein');
	});
});
```

### Testkontext

#### `CI.context`

Ein magisches Objekt, das Zugriff auf die isolierte Umgebung des **aktuellen Tests** bietet.

- `CI.context.workSpace`:
  - `path` (String): Der absolute Pfad zum eindeutigen Arbeitsverzeichnis des aktuellen Tests.
- `CI.context.http`:
  - `router` (Express Router): Eine Express-Router-Instanz, die exklusiv für diesen Test gilt.
  - `url` (String): Die vollständige URL für den Zugriff auf den dedizierten Router dieses Tests.
- `CI.context.data` (Object): Ein leeres Objekt, das zum Übergeben von Daten zwischen den Hooks eines Tests und seinem Hauptteil verwendet wird.

### Simulieren von Interaktionen

#### `CI.runInput(input, request)`

Simuliert, dass ein **Benutzer eine Nachricht** an die Rolle sendet.

- `input` (String | Object): Die Eingabe des Benutzers.
- `request` (Object, Optional): Ein partielles Anforderungsobjekt zum Überschreiben von Standardanforderungsparametern.
- **Gibt zurück** (Object): Ein Objekt mit detaillierten Debugging-Informationen:
  - `reply` (Object): Das endgültige Ergebnis, das von `GetReply` der Rolle zurückgegeben wird.
  - `prompt_struct` (Object): Der strukturierte Prompt, der an die KI gesendet wird.
  - `prompt_single` (String): Der an die KI gesendete Prompt, der in einen einzelnen String konvertiert wurde.

#### `CI.runOutput(output, request)`

Simuliert die **Ausgabe der KI**, um den `replyHandler` der Rolle zu testen.

- `output` (String | Array | Function): Der simulierte Inhalt, der von der KI zurückgegeben wird.
  - **String**: Simuliert, dass die KI diesen String direkt zurückgibt.
  - **Array**: Simuliert eine mehrstufige Interaktion. Jedes Element im Array, das ein String oder eine Funktion sein kann, wird nacheinander als Rückgabewert der KI verwendet.
  - **Function**: Generiert dynamisch die Ausgabe der KI.
    - **Async**: Die Funktion kann `async` sein.
    - **Parameter**: Die Funktion erhält ein `result`-Objekt mit `prompt_single` und `prompt_struct` als Argument.
    - **Rückgabewert**: Der Rückgabewert der Funktion wird zur **nächsten** Ausgabe der KI in der Sequenz.
    - **Anwendungsfall**: Dies ist äußerst nützlich, um während einer mehrstufigen Interaktion Assertions zu machen oder komplexe Logik auszuführen.

- `request` (Object, Optional): Dasselbe wie `CI.runInput`.
- **Gibt zurück** (Object): Das endgültige Ergebnis von `GetReply` der Rolle.

#### Das `result`-Objekt

Der Rückgabewert von Interaktionsfunktionen (oder deren `reply`-Eigenschaft) stammt aus dem Rückgabewert von `GetReply` der Rolle und enthält normalerweise:

- **`content`** (String): Der endgültige Textinhalt, der dem Benutzer präsentiert wird.
- **`logContextBefore`** (Array|Undefined): Ein Array von Nachrichtenprotokollen, die den gesamten Verlauf aufzeichnen, bevor der endgültige `content` generiert wurde, einschließlich Nachrichten mit der Rolle `tool` (Werkzeugausführungsergebnisse), `user` und `char`.

### Hilfswerkzeuge

- `CI.assert(condition, message)`: Führt eine Assertion durch.
- `CI.char`: Eine Verknüpfung für den Zugriff auf das aktuell geladene Rolleninstanzobjekt.
- `CI.sleep(ms)`: Hält die Ausführung für die angegebene Anzahl von Millisekunden an.
- `CI.wait(fn, timeout)`: Ruft die `fn`-Funktion ab, bis sie einen wahrheitsgemäßen Wert zurückgibt oder ein Timeout auftritt.

## 💡 Erweiterte Nutzung

### Testen von Dateioperationsfunktionen

Sie können Funktionen, die Dateien lesen und schreiben, sicher mit `CI.context.workSpace` testen.

**Beispiel:** Testen der Funktion `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <run-bash>', async () => {
	// Verwenden Sie den isolierten Arbeitsbereichspfad
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Verzeichnis erstellt.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> konnte Verzeichnis nicht erstellen.');
	CI.assert(result.content === 'Verzeichnis erstellt.', 'Endgültige Nachricht ist falsch.');
});
```

### Testen des Webbrowsings (mit Assertions für Zwischenschritte)

Sie können komplexe Netzwerkinteraktionstests mit `CI.context.http` und dem Funktionsargument von `runOutput` erstellen.

**Beispiel:** Testen der Funktion `<web-browse>` und Validieren ihres Prompt-Inhalts.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Dies ist ein Testabsatz.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. Die KI beschließt, die Seite zu durchsuchen
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Verwenden Sie eine Funktion, um den Zwischenschritt zu validieren und die nächste Antwort der KI bereitzustellen
		async (midResult) => {
			// Assertion: Überprüfen Sie, ob der an die KI gesendete Prompt den Webseiteninhalt enthält
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Dies ist ein Testabsatz'), 'Webinhalt war nicht im Prompt.');

			// Geben Sie die endgültige Antwort der KI zurück
			return 'Der Absatz lautet: Dies ist ein Testabsatz.';
		}
	]);

	// Assertion: Überprüfen Sie, ob der dem Benutzer gegebene endgültige Inhalt korrekt ist
	CI.assert(result.content.includes('Der Absatz lautet'), 'Endgültige Antwort ist falsch.');
});
```

## Immer noch verwirrt?

Schauen Sie sich an, wie die weltweit erste fount-Rolle, [`Gentian`, es macht](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)!
