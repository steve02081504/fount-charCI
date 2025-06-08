import path from 'node:path'
import { fileURLToPath } from 'node:url'
const fount_server = await import(path.resolve('./fount/src/server/server.mjs'))
await fount_server.init()

let failed = false
const chardir = path.resolve('./fount/data/users/CI-user/chars/CI-char')
const test_names = []

function refine_error(error) {
	const stackLines = error.stack.split('\n')
	const firstStackLine = stackLines[1]
	const match = firstStackLine.match(/at\s+(?:.*\s+)?\(?(.+):(\d+):(\d+)\)?$/)
	if (match) {
		const [, filePath, line, column] = match
		error.filename ??= fileURLToPath(filePath)
		error.lineNumber ??= Number(line)
		error.columnNumber ??= Number(column)
	}
}

const CI = globalThis.fountCharCI = {
	assert(condition, message) {
		if (!condition) throw new Error(message)
	},
	async test(name, fn, {
		start_emoji = '🧪',
		success_emoji = '✅',
		fail_emoji = '❌'
	} = {}) {
		console.log(`::group::${start_emoji} ${name}`)
		try {
			await fn()
			console.log(`${success_emoji} ${name}`)
		}
		catch (e) {
			refine_error(e)
			console.log(`::error file=${e.filename.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}}::{${fail_emoji} ${name}: ${e.message}`)
			console.error(e.stack)
			failed = true
		}
		finally {
			console.log('::endgroup::')
		}
	},
	async subtest(name, fn, {
		start_emoji = '🧪',
		success_emoji = '✅',
		fail_emoji = '❌'
	} = {}) {
		test_names.push(name)
		console.log(`${start_emoji} ${test_names.join('::')}`)
		try {
			await fn()
			console.log(`${success_emoji} ${name}`)
		}
		catch (e) {
			refine_error(e)
			console.log(`::error file=${e.filename.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::${fail_emoji} ${test_names.join('::')}: ${e.message}`)
			console.error(e.stack)
			failed = true
		}
		finally {
			test_names.pop()
		}
	}
}

const { LoadChar, UnloadChar } = await import(path.resolve('./fount/src/server/managers/char_manager.mjs'))

await CI.test('Load Char', async () => {
	CI.char = await LoadChar('CI-user', 'CI-char')
}, {
	start_emoji: '🙂',
	success_emoji: '🥰',
	fail_emoji: '😭'
})

const { char } = CI

if (char.interfaces.config && char.interfaces.chat)
	CI.runOutput = (output, request) => {
		CI.output = output
		let req = null
		req = {
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
			Update: async () => req,
			AddChatLogEntry: async (entry) => { },
			world: null,
			char,
			user: null,
			other_chars: {},
			chat_scoped_char_memory: {},
			plugins: {},
			extension: {},
			...request
		}
		return char.interfaces.chat.GetReply(req)
	}


try {
	await import(path.resolve(path.join(chardir, process.argv[2])))
}
catch (e) {
	refine_error(e)
	console.log('::group::🏠 CI file')
	console.log(`::error file=${e.filename.replace(chardir + '/', '')},line=${e.lineNumber},endLine=${e.endLineNumber || e.lineNumber},col=${e.columnNumber},endColumn=${e.endColumnNumber || e.columnNumber},title=${e.name}::💥 ${e.message}`)
	console.error(e.stack)
	console.log('::endgroup::')
	failed = true
}

await CI.test('Unload Char', async () => {
	await UnloadChar('CI-user', 'CI-char', 'CI complete')
}, {
	start_emoji: '👋',
	success_emoji: '🪁',
	fail_emoji: '💀'
})
if (failed)
	console.log('😭 Char tests failed')
else
	console.log('🎉 Nice CI!')
process.exit(Number(failed))
