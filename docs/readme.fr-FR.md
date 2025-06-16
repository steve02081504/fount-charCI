# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (US)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-States.png)](../readme.md)
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

Un outil d'Intégration Continue (CI) concis mais puissant, conçu spécifiquement pour les développeurs de rôles [fount](https://github.com/steve02081504/fount) afin d'automatiser les tests et de garantir la stabilité de vos rôles.

Il vous aide à détecter les erreurs au niveau du code telles que les problèmes de syntaxe, les appels d'API échoués et les exceptions dans les fonctions des outils, garantissant ainsi la convivialité de base de votre rôle avant sa publication et empêchant les erreurs triviales d'affecter l'expérience utilisateur.

## ✨ Fonctionnalités

Cet outil de CI se concentre sur le test de la robustesse programmatique de votre rôle, couvrant principalement les domaines suivants :

- ✅ **Tests Structurés**: Organisez vos cas de test à l'aide de blocs `test` de type Jest, avec prise en charge de n'importe quel niveau d'imbrication, rendant vos scripts de test clairs et faciles à lire.
- ✅ **Tests Concurrents et Séquentiels**: Prise en charge de l'exécution de tests en parallèle pour augmenter la vitesse, ou garantie de l'exécution séquentielle avec `await`.
- ✅ **Hooks de Test**: Fournit des fonctions hook `beforeAll`, `afterAll`, `beforeEach` et `afterEach` pour configurer et démonter l'environnement à différentes étapes du cycle de vie des tests.
- ✅ **Environnements de Test Isolés**: Chaque test dispose de son propre espace de travail indépendant et automatiquement nettoyé (pour les opérations sur les fichiers) et d'un routeur HTTP, empêchant les interférences entre les tests.
- ✅ **Piloté par les Assertions**: Vérifiez les résultats des tests avec la fonction `assert`, qui signale des messages d'erreur clairs en cas d'échec.
- ✅ **Simulation d'Interaction en Plusieurs Étapes**: Simulez avec précision le flux complet "penser -> utiliser l'outil -> répondre" de l'IA, en testant la logique complexe de `replyHandler`.
- ✅ **Inspection des Journaux Système et des Prompts**: Capable d'inspecter les informations au niveau du système renvoyées à l'IA après l'exécution de l'outil, et même de récupérer le prompt final envoyé à l'IA, garantissant que la logique et le traitement des données sont conformes aux attentes.
- ✅ **Rapports de Test Détaillés**: Génère automatiquement de superbes rapports de synthèse de tests interactifs dans GitHub Actions, incluant la durée, les journaux et les détails des erreurs pour chaque test.

> Compte tenu de la nature non déterministe du contenu généré par les LLM, cet outil **ne peut pas** évaluer la qualité d'un prompt ou le mérite du contenu généré par l'IA. Sa valeur principale réside dans la garantie de l'exactitude des parties programmatiques du rôle.

## 🚀 Démarrage Rapide

Configurez des tests automatisés pour votre projet de rôle fount en seulement trois étapes.

### Étape 1 : Créer le Fichier de Workflow

Dans le répertoire racine de votre projet de rôle, créez le fichier de configuration CI : `.github/workflows/CI.yml`.

### Étape 2 : Remplir avec le Modèle

Collez le contenu suivant dans le fichier `CI.yml`. Il exécutera automatiquement les tests lors des envois de code.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Requis pour la mise à jour du cache

on:
  # Autoriser le déclenchement manuel
  workflow_dispatch:
  # Déclencher automatiquement lorsque les fichiers .mjs sont modifiés
  push:
    paths:
      - '**.mjs'
    # Ignorer les envois de tags pour éviter le déclenchement lors des publications de version
    tags-ignore:
      - '*'
    # Autoriser les envois depuis n'importe quelle branche
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Spécifiez le chemin vers votre script de test CI
          CI-filepath: .github/workflows/CI.mjs
          # (Facultatif) Spécifiez un nom d'utilisateur pour la CI, par défaut "CI-user"
          # CI-username: mon-utilisateur-ci
```

### Étape 3 : Créer le Script de Test CI

Dans le répertoire racine de votre projet de rôle, créez le fichier d'entrée CI : `.github/workflows/CI.mjs`. Voici un modèle de test basique et moderne :

```javascript
// fountCharCI est automatiquement injecté dans la portée globale et peut être utilisé directement
const CI = fountCharCI;

// --- Cas de Test 1 : Gestion du fallback sans source d'IA ---
await CI.test('noAI Fallback', async () => {
	// Supprimer la source d'IA pour tester le gestionnaire de fallback
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput sans arguments simule une requête vide ou par défaut
	await CI.runOutput();
	// Si aucune erreur n'est levée, le test réussit
});

// --- Cas de Test 2 : Conversation IA basique ---
await CI.test('Basic AI Response', async () => {
	// S'assurer qu'une source d'IA est définie
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simuler l'entrée utilisateur "Bonjour" et vérifier le contenu final retourné par le rôle
	const { reply } = await CI.runInput('Bonjour');

	// Affirmer que la sortie finale du rôle correspond à ce que la source d'IA a retourné
	// La source d'IA simulée de CI retourne par défaut "Si je ne vous revois plus, bonjour, bon après-midi et bonne nuit."
	CI.assert(reply.content.includes('bonjour'), 'Le personnage n\'a pas réussi à retourner correctement le contenu de l\'IA.');
});
```

Une fois ces étapes terminées, le workflow de test s'exécutera automatiquement chaque fois que vous enverrez une mise à jour d'un fichier `.mjs` dans votre dépôt GitHub.

## 📖 Référence de l'API CI

`fount-charCI` fournit une API concise mais puissante pour construire vos tests.

### Définition des Tests

#### `CI.test(name, asyncFn, options)`

Définit un bloc de test. Il peut s'agir d'un test de niveau supérieur ou imbriqué dans d'autres blocs `test` pour former des sous-tests.

- `name` (String) : Une description du test.
- `asyncFn` (Function) : Une fonction asynchrone contenant la logique du test.
- `options` (Object, Facultatif) : Options de configuration pour le comportement du test.
  - `start_emoji` (String) : Emoji affiché au démarrage du test. Par défaut `🧪`.
  - `success_emoji` (String) : Emoji affiché lorsque le test réussit. Par défaut `✅`.
  - `fail_emoji` (String) : Emoji affiché lorsque le test échoue. Par défaut `❌`.

#### Tests Concurrents et Séquentiels

`CI.test` retourne un objet de type Promesse, ce qui simplifie grandement le contrôle du flux d'exécution.

- **Exécution Séquentielle**: Utilisez `await` lors de l'appel à `CI.test` si vous souhaitez que les tests s'exécutent les uns après les autres dans l'ordre.
- **Exécution Concurrente**: Vous pouvez appeler plusieurs tests indépendants sans `await` pour les exécuter en parallèle.

### Hooks de Test

Ces fonctions vous permettent d'exécuter du code à différents moments du cycle de vie des tests, idéal pour configurer et démonter des environnements de test partagés.

- `CI.beforeAll(asyncFn)`: S'exécute une fois avant tous les tests dans la portée actuelle (au sein d'un bloc `test`).
- `CI.afterAll(asyncFn)`: S'exécute une fois après la fin de tous les tests dans la portée actuelle.
- `CI.beforeEach(asyncFn)`: S'exécute avant chaque test dans la portée actuelle.
- `CI.afterEach(asyncFn)`: S'exécute après la fin de chaque test dans la portée actuelle.

```javascript
// Exemple : Utilisation de hooks et de données de contexte pour gérer une base de données simulée
CI.test('Tests avec une base de données partagée', async () => {
	CI.beforeAll(() => {
		console.log('Initialisation de la base de données simulée...');
		// Utiliser l'objet context.data pour stocker les ressources partagées dans la portée
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Tests de base de données terminés. Visites finales : ${finalCount}`);
	});

	CI.test('La visite de l\'utilisateur incrémente le compteur', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Les visites devraient être supérieures à 0');
	});
});
```

### Contexte de Test

#### `CI.context`

Un objet magique qui donne accès à l'environnement isolé du **test actuel**.

- `CI.context.workSpace`:
  - `path` (String) : Le chemin absolu vers le répertoire de travail unique du test actuel.
- `CI.context.http`:
  - `router` (Express Router) : Une instance de routeur Express exclusive à ce test.
  - `url` (String) : L'URL complète pour accéder au routeur dédié de ce test.
- `CI.context.data` (Object) : Un objet vide utilisé pour transmettre des données entre les hooks d'un test et son corps.

### Simulation d'Interaction

#### `CI.runInput(input, request)`

Simule un **utilisateur envoyant un message** au rôle.

- `input` (String | Object) : L'entrée de l'utilisateur.
- `request` (Object, Facultatif) : Un objet de requête partiel pour remplacer les paramètres de requête par défaut.
- **Retourne** (Object) : Un objet contenant des informations de débogage détaillées :
  - `reply` (Object) : Le résultat final retourné par `GetReply` du rôle.
  - `prompt_struct` (Object) : Le prompt structuré envoyé à l'IA.
  - `prompt_single` (String) : Le prompt envoyé à l'IA, converti en une seule chaîne.

#### `CI.runOutput(output, request)`

Simule la **sortie de l'IA** pour tester le `replyHandler` du rôle.

- `output` (String | Array | Function) : Le contenu simulé retourné par l'IA.
  - **String**: Simule l'IA retournant cette chaîne directement.
  - **Array**: Simule une interaction en plusieurs étapes. Chaque élément du tableau, qui peut être une chaîne ou une fonction, est utilisé séquentiellement comme valeur de retour de l'IA.
  - **Function**: Génère dynamiquement la sortie de l'IA.
    - **Async**: La fonction peut être `async`.
    - **Paramètres**: La fonction reçoit un objet `result` contenant `prompt_single` et `prompt_struct` comme argument.
    - **Valeur de Retour**: La valeur de retour de la fonction devient la **prochaine** sortie de l'IA dans la séquence.
    - **Cas d'Utilisation**: Ceci est extrêmement utile pour effectuer des assertions ou exécuter une logique complexe au milieu d'une interaction en plusieurs étapes.

- `request` (Object, Facultatif) : Identique à `CI.runInput`.
- **Retourne** (Object) : Le résultat final de `GetReply` du rôle.

#### L'Objet `result`

La valeur de retour des fonctions d'interaction (ou leur propriété `reply`) provient de la valeur de retour de `GetReply` du rôle et inclut généralement :

- **`content`** (String) : Le contenu textuel final présenté à l'utilisateur.
- **`logContextBefore`** (Array|Undefined) : Un tableau de journaux de messages enregistrant tout l'historique avant la génération du `content` final, y compris les messages avec le rôle `tool` (résultats d'exécution d'outils), le rôle `user` et le rôle `char`.

### Outils Utilitaires

- `CI.assert(condition, message)`: Effectue une assertion.
- `CI.char`: Un raccourci pour accéder à l'objet d'instance de rôle actuellement chargé.
- `CI.sleep(ms)`: Met en pause l'exécution pendant le nombre de millisecondes spécifié.
- `CI.wait(fn, timeout)`: Interroge la fonction `fn` jusqu'à ce qu'elle retourne une valeur véridique ou que le délai d'attente soit écoulé.

## 💡 Utilisation Avancée

### Test des Fonctions d'Opération sur les Fichiers

Vous pouvez tester en toute sécurité les fonctions qui lisent et écrivent des fichiers en utilisant `CI.context.workSpace`.

**Exemple :** Test de la fonction `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Fonction : <run-bash>', async () => {
	// Utiliser le chemin de l'espace de travail isolé
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Répertoire créé.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> n\'a pas réussi à créer le répertoire.');
	CI.assert(result.content === 'Répertoire créé.', 'Le message final est incorrect.');
});
```

### Test de la Navigation Web (avec assertions d'étapes intermédiaires)

Vous pouvez construire des tests d'interaction réseau complexes en utilisant `CI.context.http` et l'argument de fonction de `runOutput`.

**Exemple :** Test de la fonction `<web-browse>` et validation du contenu de son prompt.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Fonction : <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Ceci est un paragraphe de test.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. L'IA décide de naviguer sur la page
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Utiliser une fonction pour valider l'étape intermédiaire et fournir la prochaine réponse de l'IA
		async (midResult) => {
			// Assertion : Vérifier si le prompt envoyé à l'IA inclut le contenu de la page web
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Ceci est un paragraphe de test'), 'Le contenu Web n\'était pas dans le prompt.');

			// Retourner la réponse finale de l'IA
			return 'Le paragraphe dit : Ceci est un paragraphe de test.';
		}
	]);

	// Assertion : Vérifier si le contenu final donné à l'utilisateur est correct
	CI.assert(result.content.includes('Le paragraphe dit'), 'La réponse finale est incorrecte.');
});
```

## Toujours perdu ?

Jetez un œil à la façon dont le premier rôle fount au monde, [`Gentian`, le fait](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs) !
