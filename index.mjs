import { AsyncLocalStorage } from 'node:async_hooks'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import http from 'node:http'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import express from 'npm:express@^5.1.0'
import cookieParser from 'npm:cookie-parser@^1.4.0'
import fileUpload from 'npm:express-fileupload@^1.5.0'
import { Router as WsAbleRouter } from 'npm:websocket-express@^3.1.3'

import { VirtualConsole } from './scripts/virtualConsole.mjs'

const unhandledRejectionHandler = (reason, promise) => {
	const store = AsyncStorage.getStore()
	const error = reason instanceof Error ? reason : new Error(String(reason))
	if (store) {
		error.message = `[Unhandled Rejection] ${error.stack || error}`
		store.console.error(error)
		store.failed = true
	} else {
		console.error('💥 [Unhandled Rejection outside test context]:', error.stack || error)
		process.exit(1)
	}
	hasFailures = true
}
process.on('unhandledRejection', unhandledRejectionHandler)
process.on('uncaughtException', unhandledRejectionHandler)


const app = express()
app.use(express.json({ limit: Infinity }))
app.use(express.urlencoded({ limit: Infinity, extended: true }))
app.use(fileUpload())
app.use(cookieParser())
const httpServer = await new Promise((resolve) => {
	http.createServer(app).listen(8972, resolve)
})
const routers = {}
app.use((req, res, next) => {
	let subpath = req.path.split('/').slice(1)[0]
	if (!routers[subpath]) return next()
	return routers[subpath](req, res, next)
})
app.use((req, res, next, err) => {
	const store = AsyncStorage.getStore()
	if (store) {
		store.console.error(err)
		store.failed = true
	}
	next(err)
})

function getTestHash(test_names) {
	const hash = createHash('sha256')
	hash.update(test_names.join('/'))
	return hash.digest('hex').substring(0, 16)
}

function refine_error(error) {
	const stackLines = error.stack.split('\n')
	let firstStackLine = stackLines[1]
	if (firstStackLine.includes('at Object.assert') && firstStackLine.includes(import.meta.url)) firstStackLine = stackLines[2] // 去除assert
	const match = firstStackLine.match(/at\s+(?:.*\s+)?\(?(.+):(\d+):(\d+)\)?$/)
	if (match) {
		const [, filePath, line, column] = match
		error.filename ??= fileURLToPath(filePath)
		error.lineNumber ??= Number(line)
		error.columnNumber ??= Number(column)
	}
}

export const AsyncStorage = new AsyncLocalStorage()
function getContext(name) {
	const parent_context = AsyncStorage.getStore() ?? {}
	const base_console = parent_context.console ?? globalThis.console

	const console = new VirtualConsole({
		base_console,
		error_handler: (e) => {
			refine_error(e)
			const title = e.message.split('\n')[0]
			console.log(`::error file=${e.filename?.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::${fail_emoji} ${name}: ${title}`)
			console.error(e.stack)
		}
	})

	const test_names = [...(parent_context.test_names ?? [])]
	if (name) test_names.push(name)

	const testHash = getTestHash(test_names)
	const workSpacePath = path.resolve('./.ci-workspaces', testHash)
	const router = new WsAbleRouter()
	routers[testHash] = router

	return {
		console,
		test_names,
		failed: false,
		parent_context,
		subtest_count: 0,
		hooks: {
			beforeAll: [],
			beforeEach: [],
			afterEach: [],
			afterAll: [],
		}, // 存储当前层级的钩子
		tests: [],
		has_started: false,
		context: {
			workSpace: {
				path: workSpacePath,
				clear: () => {
					fs.rmSync(workSpacePath, { recursive: true, force: true })
					fs.mkdirSync(workSpacePath, { recursive: true })
				}
			},
			http: {
				router,
				url: `http://localhost:8972/${testHash}`
			},
			metaData: {},
		}
	}
}
const baseContext = Object.assign(getContext(), {
	console: globalThis.console,
	is_top_level: true
})
const context = new Proxy({}, {
	get: (target, prop) => Reflect.get(AsyncStorage.getStore() ?? baseContext, prop),
	getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor(baseContext, prop),
	getPrototypeOf: (target) => Reflect.getPrototypeOf(baseContext),
	set: (target, prop, value) => Reflect.set(AsyncStorage.getStore() ?? baseContext, prop, value),
	setPrototypeOf: (target, value) => Reflect.setPrototypeOf(baseContext, value)
})
const baseConsole = console
globalThis.console = new Proxy({}, {
	get: (target, prop) => Reflect.get(context.console, prop),
	getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor(baseConsole, prop),
	getPrototypeOf: (target) => Reflect.getPrototypeOf(baseConsole),
	set: (target, prop, value) => Reflect.set(context.console, prop, value),
	setPrototypeOf: (target, value) => Reflect.setPrototypeOf(baseConsole, value)
})

const chardir = path.resolve('./fount/data/users/CI-user/chars/CI-char')

let hasFailures = false
let active_test_count = 0
let active_waitting_count = 0
let totalTests = 0
let passedTests = 0
const failedTestsInfo = []

async function runTest(name, fn, {
	start_emoji = '🧪',
	success_emoji = '✅',
	fail_emoji = '❌',
	is_top_level = false,
} = {}) {
	const context = getContext(name)
	const parent_context = context.parent_context
	context.is_top_level = is_top_level

	totalTests++
	const isTopLevelTest = parent_context.is_top_level !== false
	if (!is_top_level) console.log(`${isTopLevelTest ? '::group::' : ''}${start_emoji} ${test_names.join(' > ')}`)
	active_test_count++
	if (parent_context.subtest_count !== undefined) parent_context.subtest_count++

	const startTime = performance.now()
	const startMemory = isTopLevelTest ? process.memoryUsage().heapUsed : 0

	try {
		await AsyncStorage.run(context, async () => {
			// 执行钩子和测试主体
			try {
				context.context.workSpace.clear() // 初始化工作区
				if (parent_context.hooks?.beforeEach) await Promise.all(parent_context.hooks.beforeEach.map(fn => fn()))
				if (!parent_context.has_started) await Promise.all(parent_context.hooks.beforeAll.map(fn => fn()))

				await fn()
				await Promise.all(context.tests.map(({ name, fn, config }) => runTest(name, fn, config)))
				while (context.subtest_count > 0) await CI.sleep(1000) // 可能有子测试被then但未被await
			}
			finally {
				if (context.hooks?.afterAll) await context.hooks.afterAll()
				if (parent_context.hooks?.afterEach) await parent_context.hooks.afterEach()

				fs.rmSync(workSpacePath, { recursive: true, force: true }) // 最终清理
			}
		})
	} catch (e) {
		console.error(e)
		context.failed = true
	} finally {
		const duration = (performance.now() - startTime).toFixed(2)
		let memoryUsage = ''
		if (isTopLevelTest && !context.failed) {
			const endMemory = process.memoryUsage().heapUsed
			const diff = endMemory - startMemory
			memoryUsage = ` (mem: ${diff > 0 ? '+' : ''}${(diff / 1024 / 1024).toFixed(2)} MB)`
		}

		const final_emoji = context.failed ? fail_emoji : success_emoji
		const final_message = `${final_emoji} ${start_emoji} ${name} (${duration}ms)${memoryUsage}`

		if (!context.failed)
			passedTests++
		else {
			hasFailures = true
			if (parent_context) parent_context.failed = true
			failedTestsInfo.push({ name: test_names.join(' > '), log: console.outputs })
		}

		if (!is_top_level) {
			if (isTopLevelTest) console.log('::endgroup::')
			base_console.log(console.outputs.trim().replace(start_emoji, final_message))
		}

		test_names.pop()
		active_test_count--
		if (parent_context.subtest_count !== undefined) parent_context.subtest_count--
	}
}

const CI = globalThis.fountCharCI = {
	context: new Proxy({}, {
		get: (target, prop) => Reflect.get(AsyncStorage.getStore()?.context ?? {}, prop),
		getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor({}, prop),
		getPrototypeOf: (target) => Reflect.getPrototypeOf({}),
		set: (target, prop, value) => Reflect.set(AsyncStorage.getStore()?.context, prop, value),
		setPrototypeOf: (target, value) => Reflect.setPrototypeOf({}, value),
		isExtensible: (target) => Reflect.isExtensible({}),
	}),
	assert(condition, message) {
		if (!condition) throw new Error(`Assertion failed: ${message}`)
	},
	async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },
	async wait(fn, timeout = 10000) {
		const test_names = AsyncStorage.getStore()?.test_names ?? []
		active_waitting_count += test_names.length
		const afn = async () => fn()
		try {
			while (timeout > 0) {
				if (await afn().catch(_ => 0)) return
				await CI.sleep(1000)
				if (active_waitting_count == active_test_count) timeout -= 1000
			}
		}
		catch (e) { throw e }
		finally {
			active_waitting_count -= test_names.length
		}
	},
	beforeAll(fn) {
		AsyncStorage.getStore().hooks.beforeAll.push(fn)
	},
	afterAll(fn) {
		AsyncStorage.getStore().hooks.afterAll.push(fn)
	},
	beforeEach(fn) {
		AsyncStorage.getStore().hooks.beforeEach.push(fn)
	},
	afterEach(fn) {
		AsyncStorage.getStore().hooks.afterEach.push(fn)
	},
	test(name, fn, config = {}) {
		const store = AsyncStorage.getStore()
		store.tests.push({ name, fn, config })
		const run = () => {
			store.tests.pop()
			return runTest(name, fn, config)
		}
		return {
			then: (resolve, reject) => run().then(resolve, reject),
			catch: (reject) => run().catch(reject),
			finally: (fn) => run().finally(fn)
		}
	}
}

await CI.test('Init Fount Server', async () => {
	const fount_server = await import(path.resolve('./fount/src/server/server.mjs'))
	await fount_server.init()
	const { registerAsyncLocalStorage } = await import(path.resolve('./fount/src/server/async_storage.mjs'))
	registerAsyncLocalStorage('charCI', AsyncStorage)
}, {
	start_emoji: '⛲',
	success_emoji: '👋',
	fail_emoji: '💀'
})

if (hasFailures) {
	console.log('😭 Fount server failed for start')
	process.exit(1)
}

const { LoadChar, UnloadChar } = await import(path.resolve('./fount/src/server/managers/char_manager.mjs'))

await CI.test('Load Char', async () => {
	CI.char = await LoadChar('CI-user', 'CI-char')
}, {
	start_emoji: '🚗',
	success_emoji: '🥰',
	fail_emoji: '😭'
})

const { char } = CI
function get_req(diff) {
	let result
	return result = Object.assign({
		supported_functions: {
			markdown: true,
			mathjax: true,
			html: true,
			unsafe_html: true,
			files: true,
			add_message: true,
		},
		chat_name: 'CI',
		chat_id: 0,
		char_id: 'CI-char',
		username: 'CI-user',
		UserCharname: 'CI-userchar',
		Charname: 'CI-char',
		locales: ['en-UK'],
		chat_log: [],
		Update: async () => result,
		AddChatLogEntry: async (entry) => {
			result.chat_log.push({
				name: entry.role,
				content: '',
				files: [],
				...entry,
			})
		},
		world: null,
		char,
		user: null,
		other_chars: {},
		chat_scoped_char_memory: {},
		plugins: {},
		extension: {}
	}, diff)
}

if (char.interfaces.config && char.interfaces.chat) {
	CI.runOutput = async (output, request) => {
		(AsyncStorage.getStore() ?? {}).output = output
		const req = get_req(request)
		return await char.interfaces.chat.GetReply(req)
	}
	CI.runInput = async (input, request) => {
		if (input instanceof String) input = {
			role: 'user',
			content: input,
			files: []
		}
		if (!(input instanceof Array)) input = [input]
		const result = (AsyncStorage.getStore() ?? {}).result = {}
		const req = get_req({
			chat_log: input,
			...request,
		})
		const reply = await char.interfaces.chat.GetReply(req)
		return {
			reply,
			prompt_struct: result.prompt_struct,
			prompt_single: result.prompt_single
		}
	}
}

await CI.test('CI Main', async () => {
	try {
		await import(path.resolve(path.join(chardir, process.argv[2])))
	}
	catch (e) {
		refine_error(e)
		console.log('::group::💥🏠 CI file')
		console.log(`::error file=${e.filename?.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::💥 ${e.message}`)
		console.error(e.stack)
		console.log('::endgroup::')
		hasFailures = true
	}
}, {
	is_top_level: true,
})

if (process.env.GITHUB_STEP_SUMMARY) {
	const summaryIcon = hasFailures ? '❌' : '✅'
	let summary = `## ${summaryIcon} Test Results: ${passedTests} / ${totalTests} Passed\n\n`
	if (hasFailures) {
		summary += `### Failed Tests\n\n`
		summary += `| Test Name | Error Log |\n`
		summary += `|---|---|\n`
		for (const failure of failedTestsInfo) {
			const logDetails = failure.log.replace(/\r\n|\n/g, '<br>').replace(/\|/g, '\\|')
			summary += `| **${failure.name}** | <details><summary>Click to expand</summary>${logDetails}</details> |\n`
		}
	} else {
		summary += `All tests passed successfully! 🎉\n`
	}
	fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}

await CI.test('Unload Char', async () => {
	await UnloadChar('CI-user', 'CI-char', 'CI complete')
}, {
	start_emoji: '👋',
	success_emoji: '🪁',
	fail_emoji: '💀'
})

if (hasFailures) console.log(`😭 Char tests failed (${totalTests - passedTests} failures)`)
else console.log(`🎉 Nice CI! All ${totalTests} tests passed.`)

process.exit(Number(hasFailures))
