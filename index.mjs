// --- 初始 Fount 环境设置 ---
// 这部分代码只在启动时运行一次，用于初始化Fount服务的基础环境。
process.on('warning', e => console.warn(e.stack))

import { AsyncLocalStorage } from 'node:async_hooks'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import http from 'node:http'
import url from 'node:url'
function loadmjs(file) {
	return import(url.pathToFileURL(file))
}
{
	const { set_start } = await loadmjs(path.join(import.meta.dirname, './fount/src/server/base.mjs'))
	await set_start()
}
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import express from 'npm:express@^5.1.0'
import cookieParser from 'npm:cookie-parser@^1.4.0'
import fileUpload from 'npm:express-fileupload@^1.5.0'
import { Router as WsAbleRouter } from 'npm:websocket-express@^3.1.3'

import { VirtualConsole, setGlobalConsoleReflect, defaultConsole } from 'npm:@steve02081504/virtual-console'
import { FullProxy } from 'npm:full-proxy'
import { registerContext } from 'npm:als-registry'

// --- 全局变量和常量 ---
const charname = process.env.CI_charname
const username = process.env.CI_username
const CHAR_DIRECTORY = path.join(import.meta.dirname, `./fount/.vm_data_charCI/users/${username}/chars/${charname}`)
function to_relative_path(path) {
	try {
		return fs.realpathSync(path).replace(fs.realpathSync(CHAR_DIRECTORY), '').replace(/^[\\/]/, '').replaceAll('\\', '/')
	}
	catch {
		console.error(`Failed to resolve path: ${path}`)
		return path
	}
}
const EMOJI = {
	test: '🧪',
	success: '✅',
	fail: '❌',
	fount: { start: '⛲', success: '👋', fail: '💀' },
	char: { load: '🚗', unload: '👋', success: '🥰', fail: '😭' },
	summary: { success: '✅', fail: '❌' }
}

let anyTestFailed = false
let activeTestCount = 0
let activeWaittingCount = 0
let inParallelProcessing = 0
let totalTests = 0
let passedTests = 0
const allTestResults = []
const mainStartTime = performance.now()

/**
 * @typedef {import('npm:steve02081504/virtual-console').VirtualConsole} VirtualConsole
 */

/**
 * @typedef {Object} TestContextAPI
 * @property {object} workSpace - 测试的工作区，用于存放临时文件。
 * @property {string} workSpace.path - 工作区的绝对路径。
 * @property {() => void} workSpace.clear - 清空并重新创建工作区目录。
 * @property {object} http - 与测试关联的HTTP服务器信息。
 * @property {import('npm:websocket-express@^3.1.3').Router} http.router - 此测试专用的Express路由器实例。
 * @property {string} http.url - 访问此测试专用路由的URL。
 * @property {object} data - 一个空对象，用于在测试的不同阶段之间传递数据。
 */

/**
 * @typedef {Object} TestContext
 * @property {string[]} testPath - 从根测试到当前测试的名称路径。
 * @property {string} testHash - 基于测试路径生成的唯一哈希值。
 * @property {VirtualConsole} console - 当前测试专用的虚拟控制台实例。
 * @property {boolean} isFailed - 标记当前测试是否已失败。
 * @property {TestContext | object} parentContext - 父级测试的上下文。
 * @property {number} subtestCount - 当前正在运行的子测试数量。
 * @property {object} hooks - 存储当前作用域的钩子函数。
 * @property {Array<() => Promise<void>>} hooks.beforeAll - 在当前作用域所有测试开始前运行。
 * @property {Array<() => Promise<void>>} hooks.beforeEach - 在当前作用域每个测试开始前运行。
 * @property {Array<() => Promise<void>>} hooks.afterEach - 在当前作用域每个测试结束后运行。
 * @property {Array<() => Promise<void>>} hooks.afterAll - 在当前作用域所有测试结束后运行。
 * @property {Array<{name: string, fn: Function, options: object}>} definedTests - 在当前测试中定义的子测试列表。
 * @property {boolean} hasStarted - 标记当前作用域的 beforeAll 钩子是否已执行。
 * @property {boolean} isTopLevel - 标记这是否是一个顶级测试文件。
 * @property {TestContextAPI} api - 暴露给测试脚本的上下文API。
 */


// --- 全局错误处理 ---
/**
 * 未处理的 Promise Rejection 和异常的统一处理器。
 * @param {Error|any} reason - 错误原因。
 * @param {Promise<any>} [promise] - 相关的 Promise (仅 unhandledRejection)。
 */
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
		process.exit(1)
	}
	anyTestFailed = true
}
process.on('unhandledRejection', unhandledRejectionHandler)
process.on('uncaughtException', unhandledRejectionHandler)


// --- HTTP 服务器和动态路由设置 ---
const app = express()
app.use(express.json({ limit: Infinity }))
app.use(express.urlencoded({ limit: Infinity, extended: true }))
app.use(fileUpload())
app.use(cookieParser())

// 存储每个测试哈希值对应的路由器
const routers = {}

// 动态路由中间件，根据URL路径的第一部分将请求分发到对应的测试路由器
app.use((req, res, next) => {
	const subpath = req.path.split('/')[1]
	if (routers[subpath])
		return routers[subpath](req, res, next)
	next()
})

// 全局错误处理中间件，将Express中的错误记录到测试上下文中
app.use((err, req, res, next) => {
	const store = testAsyncStorage.getStore()
	if (store) {
		store.console.error(err)
		store.isFailed = true
	}
	next(err)
})

// 启动HTTP服务器
await new Promise((resolve) => {
	http.createServer(app).listen(8972, () => {
		resolve()
	})
})


// --- 辅助函数 ---
/**
 * 根据测试名称路径生成一个确定性的哈希值。
 * @param {string[]} testPath - 测试的层级名称数组。
 * @returns {string} 16位的SHA256哈希值。
 */
function getTestHash(testPath) {
	const hash = createHash('sha256')
	hash.update(testPath.join('/'))
	return hash.digest('hex').substring(0, 16)
}

/**
 * 优化错误对象的堆栈信息，提取文件名、行号和列号。
 * @param {Error} error - 原始错误对象。
 */
function refineError(error) {
	if (!error.stack) return
	const stackLines = error.stack.split('\n')
	// 跳过测试框架内部的assert调用堆栈
	let firstStackLine = stackLines[1]
	if (firstStackLine?.includes('at Object.assert') && firstStackLine.includes(import.meta.url))
		firstStackLine = stackLines[2]

	const match = firstStackLine?.match(/at\s+(?:.*\s+)?\(?(.+?):(\d+):(\d+)\)?$/)
	if (match) {
		const [, filePath, line, column] = match
		// 优先使用已有的信息，否则填充解析出的信息
		error.fileName ??= filePath.startsWith('file://') ? fs.realpathSync(fileURLToPath(filePath)) : filePath
		error.lineNumber ??= Number(line)
		error.columnNumber ??= Number(column)
	}
	else {
		error.fileName = ''
		error.lineNumber = 0
		error.columnNumber = 0
	}
}


// --- 异步上下文管理 (核心) ---
const testAsyncStorage = new AsyncLocalStorage()
registerContext('charCI', testAsyncStorage)

const baseContext = {}
/**
 * 创建一个新的测试上下文。
 * @param {string} [name] - 当前测试的名称。
 * @returns {TestContext} 新的测试上下文对象。
 */
function getContext(name) {
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

// 创建并初始化根上下文
Object.assign(baseContext, {
	...getContext(),
	console: defaultConsole,
	isTopLevel: true,
})
// 破坏循环引用，便于timer/jobs设置
baseContext.parentContext = { ...baseContext, parentContext: {} }


/**
 * 一个代理对象，用于方便地访问当前异步上下文中的属性。
 * @type {TestContext}
 */
export const context = new FullProxy(() => testAsyncStorage.getStore() ?? baseContext)

// 将所有console调用重定向到当前测试上下文的虚拟控制台
setGlobalConsoleReflect(
	() => context.console,
	(c) => testAsyncStorage.setStore({ ...context, console: c }),
	(c, fn) => testAsyncStorage.run({ ...context, console: c }, fn),
)

function getMemoryUsage() {
	globalThis.gc({
		execution: 'sync',
		flavor: 'last-resort',
		type: 'major'
	})
	return process.memoryUsage().heapUsed
}

// --- 测试运行器 ---
/**
 * 运行单个测试。
 * @param {string} testName - 测试的名称。
 * @param {() => Promise<void>} testFunction - 包含测试逻辑的异步函数。
 * @param {object} [options={}] - 测试的配置选项。
 * @param {string} [options.start_emoji='🧪'] - 测试开始时显示的表情符号。
 * @param {string} [options.success_emoji='✅'] - 测试成功时显示的表情符号。
 * @param {string} [options.fail_emoji='❌'] - 测试失败时显示的表情符号。
 * @param {boolean} [options.is_top_level=false] - 是否为顶层测试。
 */
async function runTest(testName, testFunction, {
	start_emoji = EMOJI.test,
	success_emoji = EMOJI.success,
	fail_emoji = EMOJI.fail,
	is_top_level = false,
} = {}) {
	totalTests++
	activeTestCount++

	process.setMaxListeners(activeTestCount + 10)

	const currentContext = getContext(testName)
	if (is_top_level) currentContext.console = baseContext.console
	const { testPath, parentContext, console: testConsole } = currentContext
	currentContext.isTopLevel = is_top_level

	const isTopLevelTestInFile = parentContext.isTopLevel !== false
	if (parentContext.subtestCount !== undefined) parentContext.subtestCount++

	const startTime = performance.now()
	const startMemory = inParallelProcessing ? 0 : getMemoryUsage()

	try {
		await testAsyncStorage.run(currentContext, async () => {
			try {
				currentContext.api.workSpace.clear() // 初始化工作区
				// 运行钩子和测试主体
				if ((!currentContext.hasStarted && currentContext.hooks.beforeAll.length) || currentContext.hooks.beforeEach.length) try {
					inParallelProcessing++
					await Promise.all(parentContext.hooks.beforeEach.map(hook => hook()))
					if (!currentContext.hasStarted) {
						currentContext.hasStarted = true
						await Promise.all(currentContext.hooks.beforeAll.map(hook => hook()))
					}
				}
					finally {
						inParallelProcessing--
					}

				await testFunction()

				// 运行此测试中定义的所有子测试
				if (!is_top_level) inParallelProcessing++
				try {
					await Promise.all(currentContext.definedTests.map(({ name, fn, options }) =>
						runTest(name, fn, options)
					))
					// 等待可能通过 .then() 启动但未被 await 的异步子测试
					while (currentContext.subtestCount > 0) await CI.sleep(100)
				}
				finally {
					if (!is_top_level) inParallelProcessing--
				}

				if (Object(context.output) instanceof Array) try {
					await CI.wait(() => !context.output.length, 3000)
				}
				catch {
					throw new Error('CI.output is not an empty array after the test, check your CI code.')
				}
			}
			catch (error) {
				testConsole.error(error)
				currentContext.isFailed = true
			}
			finally {
				// 运行清理钩子
				if (parentContext.hooks.afterEach.length || currentContext.hooks.afterAll.length) try {
					inParallelProcessing++
					await Promise.all(parentContext.hooks.afterEach.map(hook => hook()))
					await Promise.all(currentContext.hooks.afterAll.map(hook => hook()))
				}
					finally {
						inParallelProcessing--
					}
				fs.rmSync(currentContext.api.workSpace.path, { recursive: true, force: true }) // 最终清理工作区
			}
		})
	}
	finally {
		delete routers[currentContext.testHash]
		const duration = performance.now() - startTime
		let memoryUsage = ''
		let memoryUsageStr = ''
		if (startMemory && !inParallelProcessing) {
			const endMemory = getMemoryUsage()
			const diff = endMemory - startMemory
			memoryUsage = `${diff > 0 ? '+' : ''}${(diff / 1024 / 1024).toFixed(2)} MB`
			memoryUsageStr = ` (mem: ${memoryUsage})`
		}

		if (!currentContext.isFailed)
			passedTests++
		else {
			anyTestFailed = true
			if (parentContext) parentContext.isFailed = true // 将失败状态向上传播
		}

		// 在父级控制台打印结果
		if (!is_top_level) {
			// 记录所有测试结果以供最终报告使用
			allTestResults.push({
				path: testPath.join(' > '),
				status: currentContext.isFailed ? 'failed' : 'passed',
				duration,
				memoryUsage,
				log: testConsole.outputs,
			})
			const statusEmoji = currentContext.isFailed ? fail_emoji : success_emoji
			parentContext.console.log(`${isTopLevelTestInFile ? '::group::' : ''}${statusEmoji} ${start_emoji} ${testName} (${duration.toFixed(2)}ms)${memoryUsageStr}`)
			parentContext.console.log(testConsole.outputs.trimEnd())
			if (isTopLevelTestInFile) parentContext.console.log('::endgroup::')
		}

		activeTestCount--
		if (parentContext.subtestCount !== undefined) parentContext.subtestCount--
	}
}

// --- CI 公共 API ---
const CI = globalThis.fountCharCI = {
	/**
	 * 提供对当前测试上下文API的访问。
	 * @type {TestContextAPI}
	 */
	context: new Proxy({}, {
		get: (target, prop) => Reflect.get(testAsyncStorage.getStore()?.api ?? {}, prop),
	}),

	/**
	 * 断言条件为真，否则抛出错误。
	 * @param {any} condition - 要检查的条件。
	 * @param {string} message - 断言失败时显示的错误消息。
	 */
	assert(condition, message) {
		if (!condition) throw new Error(`Assertion failed: ${message}`)
	},

	/**
	 * 暂停执行指定的毫秒数。
	 * @param {number} ms - 暂停的毫秒数。
	 * @returns {Promise<void>}
	 */
	async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) },

	/**
	 * 等待一个异步函数返回真值，直到超时。
	 * @param {() => Promise<boolean> | boolean} conditionFn - 返回布尔值的条件函数。
	 * @param {number} [timeout=10000] - 超时毫秒数。
	 */
	async wait(conditionFn, timeout = 10000) {
		const { testPath } = context
		const originalTimeout = timeout
		activeWaittingCount += testPath.length
		try {
			while (timeout > 0) {
				if (await Promise.resolve(conditionFn()).catch(_ => 0)) return
				await CI.sleep(500)
				if (activeWaittingCount == activeTestCount) timeout -= 500
			}
			throw new Error(`Wait timed out after ${originalTimeout}ms for condition in test: ${testPath.join(' > ')}`)
		}
		finally {
			activeWaittingCount -= testPath.length
		}
	},

	/**
	 * 注册一个在当前作用域所有测试开始前运行一次的钩子。
	 * @param {() => Promise<void>} hookFunction - 钩子函数。
	 */
	beforeAll(hookFunction) { context.hooks.beforeAll.push(hookFunction) },

	/**
	 * 注册一个在当前作用域所有测试结束后运行一次的钩子。
	 * @param {() => Promise<void>} hookFunction - 钩子函数。
	 */
	afterAll(hookFunction) { context.hooks.afterAll.push(hookFunction) },

	/**
	 * 注册一个在当前作用域每个测试开始前运行的钩子。
	 * @param {() => Promise<void>} hookFunction - 钩子函数。
	 */
	beforeEach(hookFunction) { context.hooks.beforeEach.push(hookFunction) },

	/**
	 * 注册一个在当前作用域每个测试结束后运行的钩子。
	 * @param {() => Promise<void>} hookFunction - 钩子函数。
	 */
	afterEach(hookFunction) { context.hooks.afterEach.push(hookFunction) },

	/**
	 * 定义并计划一个子测试。
	 * @param {string} name - 子测试的名称。
	 * @param {() => Promise<void>} testFunction - 包含测试逻辑的异步函数。
	 * @param {object} [options={}] - 测试的配置选项。
	 * @returns {Promise<void>} 返回一个Promise，可以在需要时`await`它来立即执行。
	 */
	test(name, testFunction, options = {}) {
		const currentContext = testAsyncStorage.getStore() ?? baseContext
		currentContext.definedTests.push({ name, fn: testFunction, options })

		// 使 CI.test(...) 的行为类似于Promise，以便可以被 await
		const run = async () => {
			currentContext.definedTests.pop() // 从队列中取出并运行
			if (!currentContext.hasStarted) {
				currentContext.hasStarted = true
				await Promise.all(currentContext.hooks.beforeAll.map(hook => hook()))
			}
			return runTest(name, testFunction, options)
		}
		return {
			then: (resolve, reject) => run().then(resolve, reject),
			catch: (reject) => run().catch(reject),
			finally: (onFinally) => run().finally(onFinally)
		}
	}
}

// =================================================================
// --- 主要测试执行流程 ---
// =================================================================

await CI.test('Init Fount Server', async () => {
	const fount_server = await loadmjs(path.join(import.meta.dirname, './fount/src/server/server.mjs'))
	const result = await fount_server.init({
		data_path: path.resolve(path.join(import.meta.dirname, 'fount', '.vm_data_charCI')),
		starts: {
			Web: false,
			IPC: false,
			Tray: false,
			DiscordRPC: false
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
	process.exit(1)
}

const { LoadChar, UnloadChar } = await loadmjs(path.join(import.meta.dirname, './fount/src/server/managers/char_manager.mjs'))

await CI.test('Load Char', async () => {
	CI.char = await LoadChar(username, charname)
}, {
	start_emoji: EMOJI.char.load,
	success_emoji: EMOJI.char.success,
	fail_emoji: EMOJI.char.fail,
})


// --- 为角色测试定义辅助函数 ---
const { char } = CI

/**
 * 创建一个模拟的Fount请求对象。
 * @param {object} diff - 需要覆盖默认值的属性。
 * @returns {object} 模拟的请求对象。
 */
function get_req(diff) {
	let result
	return result = {
		supported_functions: {
			markdown: true, mathjax: true, html: true, unsafe_html: true, files: true, add_message: true,
		},
		chat_name: 'CI',
		chat_id: 0,
		char_id: charname,
		username,
		UserCharname: username,
		Charname: Object.values(char.info || {})[0]?.name || charname,
		locales: ['en-UK'],
		chat_log: [],
		Update: async () => result,
		AddChatLogEntry: async (entry) => {
			result.chat_log.push({ name: entry.role, content: '', files: [], ...entry })
		},
		world: null, char, user: null, other_chars: {}, chat_scoped_char_memory: {}, plugins: {}, extension: {},
		...diff
	}
}

if (char?.interfaces.config && char?.interfaces.chat) {
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

// --- 运行用户提供的主测试文件 ---
await CI.test('CI Main', async () => {
	try {
		// 动态导入命令行参数指定的测试文件
		await loadmjs(path.join(CHAR_DIRECTORY, process.argv[2]))
	} catch (error) {
		refineError(error)
		const relativePath = to_relative_path(error.fileName)
		console.log('::group::💥🏠 CI file load error')
		console.log(`::error file=${relativePath},line=${error.lineNumber},endLine=${error.endLineNumber || error.lineNumber},col=${error.columnNumber},endColumn=${error.endColumnNumber || error.columnNumber},title=💥 ${error.name}::${error.message.split('\n')[0]}`)
		console.error(error.stack)
		console.log('::endgroup::')
		anyTestFailed = true
	}
}, {
	is_top_level: true,
})

// --- 卸载角色 ---
await CI.test('Unload Char', async () => {
	await UnloadChar(username, charname, 'CI complete')
}, {
	start_emoji: EMOJI.char.unload,
	success_emoji: EMOJI.char.success,
	fail_emoji: EMOJI.char.fail,
})

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/ /g, '&nbsp;')
		.replace(/\t/g, '&emsp;')
		.replace(/\n/g, '<br/>\n')
}

// --- 生成并写入 GitHub Step Summary ---
if (process.env.GITHUB_STEP_SUMMARY) {
	const totalDuration = (performance.now() - mainStartTime).toFixed(2)
	const summaryIcon = anyTestFailed ? EMOJI.summary.fail : EMOJI.summary.success
	let summary = `## ${summaryIcon} Test Results: ${passedTests} / ${totalTests} Passed\n`
	summary += `*Total running time: ${totalDuration}ms*\n\n`
	let logs = '## Logs\n\n'

	if (totalTests > 0) {
		summary += '### All Tests\n\n'
		summary += '| Status | Test Path | Duration (ms) | Memory | Logs |\n'
		summary += '|:------:|:----------|--------------:|:-------|:-----|\n'
		for (const result of allTestResults) {
			const statusIcon = result.status === 'passed' ? EMOJI.success : EMOJI.fail
			const hash = getTestHash([result.path])
			summary += `| ${statusIcon} | \`${result.path}\` | ${result.duration.toFixed(2)} | ${result.memoryUsage || 'N/A'} | [Click here](#${hash}) |\n`

			logs += `<h3 id="${hash}">${statusIcon} ${escapeHtml(result.path)}</h3>\n\n`
			logs += result.log ? `<pre><code>${escapeHtml(result.log)
				.replace(/::group::([^\n]*)/g, (match, p1) => `<details><summary>${escapeHtml(p1)}</summary>`)
				.replace(/::endgroup::/g, '</details>')
				.replace(/::error (.*?)::(.*)/g, (match, properties, message) =>
					`<details open><summary>${EMOJI.fail} <strong>Error: ${escapeHtml(message)}</strong></summary><code>${escapeHtml(properties)}</code></details>`
				)
				}</code></pre>` : 'N/A'
			logs += '\n'
		}
	}
	else {
		summary += 'No tests were executed.\n'
		logs += 'No logs were generated.\n'
	}

	fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n\n' + logs)
}

if (anyTestFailed) console.log(`😭 Char tests failed (${totalTests - passedTests} failures)`)
else console.log(`🎉 Nice CI! All ${totalTests} tests passed.`)

process.exit(Number(anyTestFailed))
