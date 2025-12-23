import process from 'node:process'

import { defaultConsole } from 'npm:@steve02081504/virtual-console'

export const exit = process.exit
export function hookExit() {
	process.exit = (code) => {
		defaultConsole.error('Process exit was called. This is not allowed in Char CI tests. Use "throw new Error()" to fail a test instead.')
		defaultConsole.error('Call Stack:')
		defaultConsole.trace()
		exit(1)
	}
}
