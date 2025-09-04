import { AsyncLocalStorage } from 'node:async_hooks'
import fs from 'node:fs'
import path from 'node:path'

import { VirtualConsole, setGlobalConsoleReflect, defaultConsole } from 'npm:@steve02081504/virtual-console'
import { registerContext } from 'npm:als-registry'
import { FullProxy } from 'npm:full-proxy'
import { Router as WsAbleRouter } from 'npm:websocket-express'

import { to_relative_path, EMOJI } from './globals.mjs'
import { routers } from './server.mjs'
import { getTestHash, refineError } from './utils.mjs'

export const testAsyncStorage = new AsyncLocalStorage()
registerContext('charCI', testAsyncStorage)

export const baseContext = {}

export function getContext(name) {
	const parentContext = testAsyncStorage.getStore() ?? baseContext
	const baseConsole = parentContext.console ?? globalThis.console

	const testPath = [...parentContext.testPath ?? []]
	if (name) testPath.push(name)

	const testHash = getTestHash(testPath)
	const workSpacePath = path.resolve('./.ci-workspaces', testHash)
	const router = new WsAbleRouter()
	routers[testHash] = router // 注册动态路由

	const console = new VirtualConsole({
		base_console: baseConsole,
		error_handler: (error) => {
			refineError(error)
			const title = error.message.split('\n')[0]
			const relativePath = to_relative_path(error.fileName)
			console.log(`::error file=${relativePath},line=${error.lineNumber},endLine=${error.endLineNumber || error.lineNumber},col=${error.columnNumber},endColumn=${error.endColumnNumber || error.columnNumber},title=${EMOJI.fail} ${name}::${title}`)
			console.error(error.stack)
		}
	})

	return {
		testPath,
		testHash,
		console,
		isFailed: false,
		parentContext,
		subtestCount: 0,
		hooks: { beforeAll: [], beforeEach: [], afterEach: [], afterAll: [] },
		definedTests: [],
		hasStarted: false,
		api: {
			workSpace: {
				path: workSpacePath,
				clear: () => {
					if (fs.existsSync(workSpacePath)) fs.rmSync(workSpacePath, { recursive: true, force: true })
					fs.mkdirSync(workSpacePath, { recursive: true })
				}
			},
			http: {
				router,
				url: `http://localhost:8972/${testHash}`,
				root: `/${testHash}`,
			},
			data: {},
		}
	}
}

export function initializeBaseContext() {
	Object.assign(baseContext, {
		...getContext(),
		console: defaultConsole,
		isTopLevel: true,
	})
	// 破坏循环引用，便于timer/jobs设置
	baseContext.parentContext = { ...baseContext, parentContext: {} }
}

export const context = new FullProxy(() => testAsyncStorage.getStore() ?? baseContext)

export function setupGlobalConsole() {
	setGlobalConsoleReflect(
		() => context.console,
		(c) => testAsyncStorage.setStore({ ...context, console: c }),
		(c, fn) => testAsyncStorage.run({ ...context, console: c }, fn),
	)
}
