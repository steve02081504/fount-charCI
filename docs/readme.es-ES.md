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

Una herramienta de Integración Continua (CI) concisa pero potente, diseñada específicamente para los desarrolladores de roles de [fount](https://github.com/steve02081504/fount) para automatizar las pruebas y asegurar que sus roles se ejecuten de forma estable.

Le ayuda a detectar errores a nivel de código, como problemas de sintaxis, llamadas a API fallidas y excepciones en las funciones de las herramientas, garantizando así la usabilidad básica de su rol antes del lanzamiento y evitando que errores triviales afecten la experiencia del usuario.

## ✨ Características

Esta herramienta de CI se centra en probar la robustez programática de su rol, cubriendo principalmente las siguientes áreas:

- ✅ **Pruebas Estructuradas**: Organice sus casos de prueba utilizando bloques `test` de tipo Jest, con soporte para cualquier nivel de anidación, haciendo que sus scripts de prueba sean claros y fáciles de leer.
- ✅ **Pruebas Concurrentes y Secuenciales**: Soporte para ejecutar pruebas en paralelo para aumentar la velocidad, o asegurar la ejecución secuencial con `await`.
- ✅ **Ganchos de Prueba (Test Hooks)**: Proporciona funciones de gancho `beforeAll`, `afterAll`, `beforeEach` y `afterEach` para configurar y desmontar el entorno en diferentes etapas del ciclo de vida de la prueba.
- ✅ **Entornos de Prueba Aislados**: Cada prueba tiene su propio espacio de trabajo independiente y automáticamente limpiado (para operaciones de archivos) y un enrutador HTTP, evitando interferencias entre pruebas.
- ✅ **Impulsado por Aserciones**: Verifique los resultados de las pruebas con la función `assert`, que informa mensajes de error claros en caso de fallo.
- ✅ **Simulación de Interacción de Múltiples Pasos**: Simule con precisión el flujo completo "pensar -> usar herramienta -> responder" de la IA, probando la lógica compleja de `replyHandler`.
- ✅ **Inspección de Registros del Sistema y Prompts**: Capaz de inspeccionar la información a nivel de sistema devuelta a la IA después de la ejecución de la herramienta, e incluso recuperar el prompt final enviado a la IA, asegurando que la lógica y el procesamiento de datos sean los esperados.
- ✅ **Informes de Prueba Detallados**: Genera automáticamente informes de resumen de pruebas hermosos e interactivos en GitHub Actions, incluyendo la duración, los registros y los detalles de error de cada prueba.

> Dada la naturaleza no determinista del contenido generado por LLM, esta herramienta **no puede** evaluar la calidad de un prompt o el mérito del contenido generado por IA. Su valor principal radica en garantizar la corrección de las partes programáticas del rol.

## 🚀 Inicio Rápido

Configure pruebas automatizadas para su proyecto de rol de fount en solo tres pasos.

### Paso 1: Crear el Archivo de Flujo de Trabajo

En el directorio raíz de su proyecto de rol, cree el archivo de configuración de CI: `.github/workflows/CI.yml`.

### Paso 2: Poblar con la Plantilla

Pegue el siguiente contenido en el archivo `CI.yml`. Ejecutará pruebas automáticamente cada vez que se envíen cambios al código.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Requerido para actualizar la caché

on:
  # Permitir activación manual
  workflow_dispatch:
  # Activar automáticamente cuando se cambien archivos .mjs
  push:
    paths:
      - '**.mjs'
    # Ignorar pushes de etiquetas para evitar la activación en lanzamientos de versiones
    tags-ignore:
      - '*'
    # Permitir pushes desde cualquier rama
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Especificar la ruta a su script de prueba de CI
          CI-filepath: .github/workflows/CI.mjs
          # (Opcional) Especificar un nombre de usuario para la CI, por defecto "CI-user"
          # CI-username: mi-usuario-ci
```

### Paso 3: Crear el Script de Prueba de CI

En el directorio raíz de su proyecto de rol, cree el archivo de entrada de CI: `.github/workflows/CI.mjs`. A continuación se muestra una plantilla de prueba básica y moderna:

```javascript
// fountCharCI se inyecta automáticamente en el ámbito global y se puede usar directamente
const CI = fountCharCI;

// --- Caso de Prueba 1: Manejo de fallback sin una fuente de IA ---
await CI.test('noAI Fallback', async () => {
	// Eliminar la fuente de IA para probar el manejador de fallback
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput sin argumentos simula una solicitud vacía o predeterminada
	await CI.runOutput();
	// Si no se lanza ningún error, la prueba pasa
});

// --- Caso de Prueba 2: Conversación básica con IA ---
await CI.test('Basic AI Response', async () => {
	// Asegurar que se establezca una fuente de IA
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simular la entrada del usuario "Hola" y verificar el contenido final devuelto por el rol
	const { reply } = await CI.runInput('Hola');

	// Afirmar que la salida final del rol coincide con lo que devolvió la fuente de IA
	// La fuente de IA simulada de CI devuelve por defecto "Si nunca te vuelvo a ver, buenos días, buenas tardes y buenas noches."
	CI.assert(reply.content.includes('buenos días'), 'El personaje no devolvió el contenido de la IA correctamente.');
});
```

Una vez completados estos pasos, el flujo de trabajo de prueba se ejecutará automáticamente cada vez que envíe una actualización a un archivo `.mjs` en su repositorio de GitHub.

## 📖 Referencia de la API de CI

`fount-charCI` proporciona una API concisa pero potente para construir sus pruebas.

### Definición de Pruebas

#### `CI.test(name, asyncFn, options)`

Define un bloque de prueba. Puede ser una prueba de nivel superior o anidarse dentro de otros bloques `test` para formar subpruebas.

- `name` (String): Una descripción de la prueba.
- `asyncFn` (Function): Una función asíncrona que contiene la lógica de la prueba.
- `options` (Object, Opcional): Opciones de configuración para el comportamiento de la prueba.
  - `start_emoji` (String): Emoji que se muestra cuando comienza la prueba. Por defecto `🧪`.
  - `success_emoji` (String): Emoji que se muestra cuando la prueba tiene éxito. Por defecto `✅`.
  - `fail_emoji` (String): Emoji que se muestra cuando la prueba falla. Por defecto `❌`.

#### Pruebas Concurrentes y Secuenciales

`CI.test` devuelve un objeto similar a una Promesa, lo que hace que controlar el flujo de ejecución sea muy simple.

- **Ejecución Secuencial**: Use `await` al llamar a `CI.test` si desea que las pruebas se ejecuten una tras otra en orden.
- **Ejecución Concurrente**: Puede llamar a múltiples pruebas independientes sin `await` para que se ejecuten en paralelo.

### Ganchos de Prueba (Test Hooks)

Estas funciones le permiten ejecutar código en diferentes puntos del ciclo de vida de la prueba, ideal para configurar y desmontar entornos de prueba compartidos.

- `CI.beforeAll(asyncFn)`: Se ejecuta una vez antes de todas las pruebas en el ámbito actual (dentro de un bloque `test`).
- `CI.afterAll(asyncFn)`: Se ejecuta una vez después de que todas las pruebas en el ámbito actual hayan finalizado.
- `CI.beforeEach(asyncFn)`: Se ejecuta antes de cada prueba en el ámbito actual.
- `CI.afterEach(asyncFn)`: Se ejecuta después de que cada prueba en el ámbito actual haya finalizado.

```javascript
// Ejemplo: Uso de ganchos y datos de contexto para gestionar una base de datos simulada
CI.test('Pruebas con una base de datos compartida', async () => {
	CI.beforeAll(() => {
		console.log('Inicializando base de datos simulada...');
		// Use el objeto context.data para almacenar recursos compartidos dentro del ámbito
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Pruebas de base de datos completadas. Visitas finales: ${finalCount}`);
	});

	CI.test('La visita del usuario incrementa el contador', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Las visitas deben ser mayores que 0');
	});
});
```

### Contexto de Prueba

#### `CI.context`

Un objeto mágico que proporciona acceso al entorno aislado de la **prueba actual**.

- `CI.context.workSpace`:
  - `path` (String): La ruta absoluta al directorio de trabajo único de la prueba actual.
- `CI.context.http`:
  - `router` (Express Router): Una instancia de Express Router exclusiva para esta prueba.
  - `url` (String): La URL completa para acceder al enrutador dedicado de esta prueba.
- `CI.context.data` (Object): Un objeto vacío utilizado para pasar datos entre los ganchos de una prueba y su cuerpo.

### Simulación de Interacción

#### `CI.runInput(input, request)`

Simula a un **usuario enviando un mensaje** al rol.

- `input` (String | Object): La entrada del usuario.
- `request` (Object, Opcional): Un objeto de solicitud parcial para anular los parámetros de solicitud predeterminados.
- **Devuelve** (Object): Un objeto que contiene información detallada de depuración:
  - `reply` (Object): El resultado final devuelto por `GetReply` del rol.
  - `prompt_struct` (Object): El prompt estructurado enviado a la IA.
  - `prompt_single` (String): El prompt enviado a la IA, convertido en una sola cadena.

#### `CI.runOutput(output, request)`

Simula la **salida de la IA** para probar el `replyHandler` del rol.

- `output` (String | Array | Function): El contenido simulado devuelto por la IA.
  - **String**: Simula que la IA devuelve esta cadena directamente.
  - **Array**: Simula una interacción de múltiples pasos. Cada elemento del array, que puede ser una cadena o una función, se utiliza secuencialmente como valor de retorno de la IA.
  - **Function**: Genera dinámicamente la salida de la IA.
    - **Async**: La función puede ser `async`.
    - **Parámetros**: La función recibe un objeto `result` que contiene `prompt_single` y `prompt_struct` como argumento.
    - **Valor de Retorno**: El valor de retorno de la función se convierte en la **siguiente** salida de la IA en la secuencia.
    - **Caso de Uso**: Esto es extremadamente útil para realizar aserciones o ejecutar lógica compleja en medio de una interacción de múltiples pasos.

- `request` (Object, Opcional): Igual que `CI.runInput`.
- **Devuelve** (Object): El resultado final de `GetReply` del rol.

#### El Objeto `result`

El valor de retorno de las funciones de interacción (o su propiedad `reply`) se origina en el valor de retorno de `GetReply` del rol y generalmente incluye:

- **`content`** (String): El contenido de texto final presentado al usuario.
- **`logContextBefore`** (Array|Undefined): Un array de registros de mensajes que registran todo el historial antes de que se generara el `content` final, incluyendo mensajes con el rol `tool` (resultados de ejecución de herramientas), rol `user` y rol `char`.

### Herramientas de Utilidad

- `CI.assert(condition, message)`: Realiza una aserción.
- `CI.char`: Un atajo para acceder al objeto de instancia de rol actualmente cargado.
- `CI.sleep(ms)`: Pausa la ejecución durante el número especificado de milisegundos.
- `CI.wait(fn, timeout)`: Sondea la función `fn` hasta que devuelva un valor verdadero o se agote el tiempo de espera.

## 💡 Uso Avanzado

### Prueba de Funciones de Operación de Archivos

Puede probar de forma segura funciones que leen y escriben archivos utilizando `CI.context.workSpace`.

**Ejemplo:** Prueba de la función `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Función: <run-bash>', async () => {
	// Usar la ruta del espacio de trabajo aislado
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directorio creado.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> no pudo crear el directorio.');
	CI.assert(result.content === 'Directorio creado.', 'El mensaje final es incorrecto.');
});
```

### Prueba de Navegación Web (con aserciones de pasos intermedios)

Puede construir pruebas complejas de interacción de red utilizando `CI.context.http` y el argumento de función de `runOutput`.

**Ejemplo:** Prueba de la función `<web-browse>` y validación del contenido de su prompt.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Función: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Este es un párrafo de prueba.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. La IA decide navegar por la página
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Usar una función para validar el paso intermedio y proporcionar la siguiente respuesta de la IA
		async (midResult) => {
			// Aserción: Verificar si el prompt enviado a la IA incluye el contenido de la página web
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Este es un párrafo de prueba'), 'El contenido web no estaba en el prompt.');

			// Devolver la respuesta final de la IA
			return 'El párrafo dice: Este es un párrafo de prueba.';
		}
	]);

	// Aserción: Verificar si el contenido final entregado al usuario es correcto
	CI.assert(result.content.includes('El párrafo dice'), 'La respuesta final es incorrecta.');
});
```

## ¿Aún te sientes perdido?

¡Echa un vistazo a cómo lo hace el primer rol de fount del mundo, [`Gentian`](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)!
