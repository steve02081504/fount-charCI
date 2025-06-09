export default {
	interfaces: {
		AIsource: {
			GetConfigTemplate: async () => configTemplate,
			GetSource,
		}
	}
}

const configTemplate = {}

import path from 'node:path'
import { structPromptToSingle } from '../../../../../src/public/shells/chat/src/server/prompt_struct.mjs'
const { AsyncStorage } = await import(path.resolve(process.env.GITHUB_ACTION_PATH + '/index.mjs'))

function getOutput(output) {
	if (!output) return 'If I never see you again, good morning, good afternoon, and good night.'
	if (Object(output) instanceof String) return output
	else if (Object(output) instanceof Array) {
		if (!output.length) throw new Error('CI.output is an empty array, check your CI code.')
		return output.shift()
	}
	else return output
}

async function GetSource(config) {
	/** @type {AIsource_t} */
	const result = {
		type: 'text-chat',
		info: {
			'': {
				avatar: '',
				name: 'CI',
				provider: 'CI',
				description: 'CI',
				description_markdown: 'CI',
				version: '0.0.0',
				author: 'steve02081504',
				homepage: '',
				tags: [],
			}
		},
		is_paid: false,
		extension: {},

		Unload: () => { },
		Call: async (prompt) => {
			const CI = AsyncStorage.getStore() ?? {}
			CI.result ??= {}
			CI.result.prompt_single = prompt
			return {
				content: getOutput(CI.output)
			}
		},
		StructCall: async (/** @type {prompt_struct_t} */ prompt_struct) => {
			const CI = AsyncStorage.getStore() ?? {}
			CI.result ??= {}
			CI.result.prompt_struct = prompt_struct
			CI.result.prompt_single = structPromptToSingle(prompt_struct)
			return {
				content: getOutput(CI.output)
			}
		},
		Tokenizer: {
			free: () => 0,
			encode: (prompt) => prompt,
			decode: (tokens) => tokens,
			decode_single: (token) => token,
			get_token_count: (prompt) => prompt.length
		}
	}

	return result
}
