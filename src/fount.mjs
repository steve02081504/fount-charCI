import path from 'node:path'

import { CI } from './ci.mjs'
import { context } from './context.mjs'
import { exit } from './exit.mjs'
import { EMOJI, anyTestFailed, charname, username } from './globals.mjs'
import { loadmjs } from './utils.mjs'

export async function initFount() {
	await CI.test('Init Fount Server', async () => {
		const fount_server = await loadmjs(path.join(import.meta.dirname, '../fount/src/server/server.mjs'))
		const result = await fount_server.init({
			data_path: path.resolve(path.join(import.meta.dirname, '../fount', '.vm_data_charCI')),
			starts: {
				Web: false,
				IPC: false,
				Tray: false,
				DiscordRPC: false,
				P2P: false,
				Base: {
					AutoUpdate: false
				}
			}
		})
		if (!result) throw new Error('Fount server failed to start')
	}, {
		start_emoji: EMOJI.fount.start,
		success_emoji: EMOJI.fount.success,
		fail_emoji: EMOJI.fount.fail,
	})

	if (anyTestFailed) {
		console.log('😭 Fount server failed for start')
		exit(1)
	}
}

export async function loadChar() {
	const { loadPart } = await loadmjs(path.join(import.meta.dirname, '../fount/src/server/parts_loader.mjs'))

	await CI.test('Load Char', async () => {
		CI.char = await loadPart(username, 'chars/' + charname)
	}, {
		start_emoji: EMOJI.char.load,
		success_emoji: EMOJI.char.success,
		fail_emoji: EMOJI.char.fail,
	})
}

export async function unloadChar() {
	const { unloadPart } = await loadmjs(path.join(import.meta.dirname, '../fount/src/server/parts_loader.mjs'))

	await CI.test('Unload Char', async () => {
		await unloadPart(username, 'chars/' + charname, 'CI complete')
	}, {
		start_emoji: EMOJI.char.unload,
		success_emoji: EMOJI.char.success,
		fail_emoji: EMOJI.char.fail,
	})
}

function get_req(diff) {
	let result
	const { char } = CI
	const UserUid = 'ci-user'
	const CharUid = 'ci-char'
	const normalizeEntry = (entry) => ({
		name: entry.name ?? entry.role ?? 'user',
		uid: entry.uid ?? (entry.role === 'char' ? CharUid : UserUid),
		content: '',
		files: [],
		extension: {},
		time_stamp: new Date(),
		...entry,
	})
	const chat_log = (diff?.chat_log || []).map(normalizeEntry)
	return result = {
		supported_functions: {
			markdown: true,
			mathjax: true,
			html: true,
			unsafe_html: true,
			files: true,
			add_message: true,
			fount_i18nkeys: true,
			fount_assets: true,
			fount_themes: true,
		},
		chat_name: 'CI',
		char_id: charname,
		username,
		UserCharname: username,
		UserUid,
		Charname: Object.values(char.info || {})[0]?.name || charname,
		CharUid,
		locales: ['en-UK'],
		time: new Date(),
		chat_log,
		timelines: [chat_log],
		chat_summary: '',
		Update: async () => result,
		AddChatLogEntry: async (entry) => {
			const written = normalizeEntry({ name: entry.role, content: '', files: [], ...entry })
			result.chat_log.push(written)
			return written
		},
		world: null,
		char,
		user: null,
		other_chars: {},
		chat_scoped_char_memory: {},
		plugins: {},
		extension: {},
		...diff,
		chat_log,
		timelines: diff?.timelines ?? [chat_log],
	}
}

export function setupCharFunctions() {
	const { char } = CI
	if (char?.interfaces.chat) {
		CI.runOutput = async (output, request) => {
			if (Object(context.output) instanceof Array && context.output.length) {
				context.isFailed = true
				throw new Error('CI.output is not an empty array after the reqly, check your CI code.')
			}
			context.output = output
			const req = get_req(request)
			const result = await char.interfaces.chat.GetReply(req)
			return result
		}
		CI.runInput = async (input, request) => {
			if (Object(input) instanceof String) input = { role: 'user', content: input, files: [] }
			if (!Array.isArray(input)) input = [input]

			context.result = {}
			const req = get_req({ chat_log: input, ...request })
			const reply = await char.interfaces.chat.GetReply(req)
			return {
				reply,
				prompt_struct: context.result.prompt_struct,
				prompt_single: context.result.prompt_single
			}
		}
	}
}
