import process from 'node:process'

import { testAsyncStorage } from './context.mjs'
import { exit } from './exit.mjs'
import { setAnyTestFailed } from './globals.mjs'

const unhandledRejectionHandler = (reason, promise) => {
	const store = testAsyncStorage.getStore()
	const error = reason instanceof Error ? reason : new Error(String(reason))
	if (store) {
		// 如果在测试上下文中，将错误记录到测试控制台
		error.message = `[Unhandled Rejection] ${error.stack || error}`
		store.console.error(error)
		store.isFailed = true
	} else {
		// 如果在测试上下文之外，打印到主控制台并退出
		console.error('💥 [Unhandled Rejection outside test context]:', error.stack || error)
		exit(1)
	}
	setAnyTestFailed(true)
}

export function registerErrorHandlers() {
	process.on('unhandledRejection', unhandledRejectionHandler)
	process.on('uncaughtException', unhandledRejectionHandler)
}
