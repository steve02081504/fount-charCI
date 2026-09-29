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
		if (!result) throw new Error('fount server failed to start')
	}, {
		start_emoji: EMOJI.fount.start,
		success_emoji: EMOJI.fount.success,
		fail_emoji: EMOJI.fount.fail,
	})

	if (anyTestFailed) {
		console.log('😭 fount server failed for start')
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
		chat_summary: '',
		Update: async () => result,
		AddChatLogEntry: async (entry) => {
			const written = { name: entry.role, content: '', files: [], ...entry }
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
		// 让角色的多轮重生成循环持续到 AI 输出不再是工具调用为止，
		// 以配合 CI 的多步 output 数组（真实聊天 shell 由唤醒机制驱动，代码 shell 由 finishRound 驱动）。
		generation_options: {
			finishRound: async () => true,
		},
		...diff,
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

		/**
		 * 用一段独立输出队列构造临时的 mock AI 源对象（AIsource_t 形状），
		 * 供测试通过请求的 `ai_sources: { 名称: 源 }` 指定给子代理等嵌套生成，
		 * 避免子代与父代争抢同一个 `context.output` 队列。
		 * @param {string | object[] | (() => any)} output - 输出（字符串 / 逐次取用的数组 / 函数）
		 * @returns {object} mock AI 源
		 */
		CI.createAISource = output => {
			const next = value => {
				if (value == null) return 'If I never see you again, good morning, good afternoon, and good night.'
				if (Object(value) instanceof Array) {
					if (!value.length) throw new Error('CI.createAISource 的输出数组已耗尽，请检查 CI 代码。')
					return next(value.shift())
				}
				if (Object(value) instanceof Function) return next(value())
				return value
			}
			return {
				filename: 'CI-temporary',
				type: 'text-chat',
				info: {
					'': {
						name: 'CI-temporary',
						avatar: '',
						provider: 'CI',
						description: 'CI 临时 AI 源',
						description_markdown: 'CI 临时 AI 源',
						version: '0.0.0',
						author: 'CI',
						homepage: '',
						tags: [],
					}
				},
				is_paid: false,
				extension: {},
				Unload: () => { },
				Call: async () => ({ content: next(output) }),
				StructCall: async (prompt_struct, options = {}) => {
					const { base_result = {}, replyPreviewUpdater } = options
					const result = { content: next(output) }
					replyPreviewUpdater?.(result)
					return Object.assign(base_result, result)
				},
				Tokenizer: {
					free: () => 0,
					encode: prompt => prompt,
					decode: tokens => tokens,
					decode_single: token => token,
					get_token_count: prompt => prompt.length,
				},
			}
		}
	}
}
