import path from 'node:path'
const fount_server = await import(path.resolve('./fount/src/server/server.mjs'))
await fount_server.init()
const { LoadChar, UnloadChar } = await import(path.resolve('./fount/src/server/managers/char_manager.mjs'))
const char = await LoadChar('CI-user', 'CI-char')
console.log('char loaded')

const CI = globalThis.fountCharCI = {
	char,
}

if (char.interfaces.config && char.interfaces.chat) {
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
	CI.assert = (condition, message) => {
		if (!condition) throw new Error(message)
	}
}

await import(path.resolve(path.join('./fount/data/users/CI-user/chars/CI-char', process.argv[2])))
await UnloadChar('CI-user', 'CI-char', 'CI complete')
console.log('CI complete.')
process.exit(0)
