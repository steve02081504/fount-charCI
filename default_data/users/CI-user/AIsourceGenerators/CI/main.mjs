export default {
	interfaces: {
		AIsource: {
			GetConfigTemplate: async () => configTemplate,
			GetSource,
		}
	}
}

const configTemplate = {}

import { structPromptToSingle } from '../../../../../src/public/shells/chat/src/server/prompt_struct.mjs'

function getOutput() {
	if (!fountCharCI.output) return 'If I never see you again, good morning, good afternoon, and good night.'
	if (Object(fountCharCI.output) instanceof String) return fountCharCI.output
	else if (Object(fountCharCI.output) instanceof Array) return fountCharCI.output.shift()
	else return fountCharCI.output
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
			return {
				content: getOutput()
			}
		},
		StructCall: async (/** @type {prompt_struct_t} */ prompt_struct) => {
			if (fountCharCI.echo_prompt_struct) {
				console.log('prompt_struct:')
				console.dir(prompt_struct, { depth: 4 })
			}
			const prompt = structPromptToSingle(prompt_struct)
			return {
				content: getOutput()
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
