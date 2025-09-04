import { testAsyncStorage, baseContext, context } from './context.mjs'
import { activeWaittingCount, activeTestCount, incrementActiveWaittingCount, decrementActiveWaittingCount } from './globals.mjs'
import { runTest } from './runner.mjs'

export const CI = globalThis.fountCharCI = {
	/**
	 * 提供对当前测试上下文API的访问。
	 * @type {import('../index.mjs').TestContextAPI}
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
		incrementActiveWaittingCount(testPath.length)
		try {
			while (timeout > 0) {
				if (await Promise.resolve(conditionFn()).catch(_ => 0)) return
				await CI.sleep(500)
				if (activeWaittingCount == activeTestCount) timeout -= 500
			}
			throw new Error(`Wait timed out after ${originalTimeout}ms for condition in test: ${testPath.join(' > ')}`)
		}
		finally {
			decrementActiveWaittingCount(testPath.length)
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
