import { AsyncLocalStorage } from 'node:async_hooks'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VirtualConsole } from './scripts/virtualConsole.mjs'

export const AsyncStorage = new AsyncLocalStorage()

const baseConsole = console
globalThis.console = new Proxy({}, {
	get: (target, prop) => Reflect.get(AsyncStorage.getStore()?.console ?? baseConsole, prop),
	getOwnPropertyDescriptor: (target, prop) => Reflect.getOwnPropertyDescriptor(baseConsole, prop),
	getPrototypeOf: (target) => Reflect.getPrototypeOf(baseConsole),
	set: (target, prop, value) => Reflect.set(AsyncStorage.getStore()?.console ?? baseConsole, prop, value),
	setPrototypeOf: (target, value) => Reflect.setPrototypeOf(baseConsole, value)
})
let hasFailures = false
const chardir = path.resolve('./fount/data/users/CI-user/chars/CI-char')

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

let active_test_count = 0
let active_waitting_count = 0

const CI = globalThis.fountCharCI = {
	assert(condition, message) {
		if (!condition) throw new Error(message)
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
	async test(name, fn, {
		start_emoji = '🧪',
		success_emoji = '✅',
		fail_emoji = '❌',
		clean_chat_log = true,
		group_output = true
	} = {}) {
		const parent_context = AsyncStorage.getStore() ?? {}
		const base_console = parent_context.console ?? baseConsole
		const console = new VirtualConsole({
			base_console,
			error_handler: (e) => {
				refine_error(e)
				console.log(`::error file=${e.filename.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::${fail_emoji} ${name}: ${e.message}`)
				console.error(e.stack)
			}
		})
		const test_names = parent_context.test_names ?? []
		const test_chat_log = parent_context.test_chat_log ?? []
		const context = {
			console,
			test_names,
			test_chat_log,
			failed: false,
			subtest_count: 0,
		}
		test_names.push(name)
		console.log(`${group_output ? '::group::' : ''}${start_emoji} ${test_names.join('::')}`)
		active_test_count++
		parent_context.subtest_count++
		try {
			if (clean_chat_log) test_chat_log.length = 0
			return await AsyncStorage.run(context, fn)
		}
		catch (e) {
			console.error(e)
			context.failed = true
			parent_context.failed = true
		}
		finally {
			while (context.subtest_count) await CI.sleep(1000)
			if (!context.failed) console.log(`${success_emoji} ${name}`)
			else hasFailures = true
			if (group_output) console.log('::endgroup::')
			base_console.log(console.outputs.trim().replace(start_emoji, (context.failed ? fail_emoji : success_emoji) + start_emoji))
			test_names.pop()
			active_test_count--
			parent_context.subtest_count--
		}
	},
	async subtest(name, fn, config = {}) {
		return CI.test(name, fn, {
			group_output: false,
			...config
		})
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
		Update: async () => result, // nothing todo
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
		const test_chat_log = AsyncStorage.getStore()?.test_chat_log ?? []
		test_chat_log.push(input)
		const result = (AsyncStorage.getStore() ?? {}).result = {}
		const req = get_req({
			chat_log: test_chat_log,
			...request,
		})
		const reply = await char.interfaces.chat.GetReply(req)
		return {
			reply,
			prompt_struct: result.prompt_struct,
			prompt_single: result.prompt_single
		}
	}
	CI.clearChatLog = () => {
		const test_chat_log = AsyncStorage.getStore()?.test_chat_log ?? []
		test_chat_log.length = 0
	}
}

try {
	await import(path.resolve(path.join(chardir, process.argv[2])))
	while (active_test_count) await CI.sleep(1000)
}
catch (e) {
	refine_error(e)
	console.log('::group::💥🏠 CI file')
	console.log(`::error file=${e.filename.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::💥 ${e.message}`)
	console.error(e.stack)
	console.log('::endgroup::')
	hasFailures = true
}

await CI.test('Unload Char', async () => {
	await UnloadChar('CI-user', 'CI-char', 'CI complete')
}, {
	start_emoji: '👋',
	success_emoji: '🪁',
	fail_emoji: '💀'
})
if (hasFailures) console.log('😭 Char tests failed')
else console.log('🎉 Nice CI!')

process.exit(Number(hasFailures))
