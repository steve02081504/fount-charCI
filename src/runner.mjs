import fs from 'node:fs'
import process from 'node:process'

import { CI } from './ci.mjs'
import { getContext, testAsyncStorage, context } from './context.mjs'
import { 
	EMOJI, 
	allTestResults, 
	setAnyTestFailed, 
	incrementTotalTests, 
	incrementPassedTests, 
	incrementInParallelProcessing, 
	decrementInParallelProcessing, 
	incrementActiveTestCount, 
	decrementActiveTestCount 
} from './globals.mjs'
import { routers } from './server.mjs'
import { getMemoryUsage } from './utils.mjs'

export async function runTest(testName, testFunction, {
	start_emoji = EMOJI.test,
	success_emoji = EMOJI.success,
	fail_emoji = EMOJI.fail,
	is_top_level = false,
} = {}) {
	incrementTotalTests()
	incrementActiveTestCount()

	process.setMaxListeners(process.getMaxListeners() + 1)

	const currentContext = getContext(testName)
	if (is_top_level) currentContext.console = context.console
	const { testPath, parentContext, console: testConsole } = currentContext
	currentContext.isTopLevel = is_top_level

	const isTopLevelTestInFile = parentContext.isTopLevel !== false
	if (parentContext.subtestCount !== undefined) parentContext.subtestCount++

	const startTime = performance.now()
	const startMemory = getMemoryUsage()

	try {
		await testAsyncStorage.run(currentContext, async () => {
			try {
				currentContext.api.workSpace.clear() // 初始化工作区
				// 运行钩子和测试主体
				if ((!currentContext.hasStarted && currentContext.hooks.beforeAll.length) || currentContext.hooks.beforeEach.length) try {
					incrementInParallelProcessing()
					await Promise.all(parentContext.hooks.beforeEach.map(hook => hook()))
					if (!currentContext.hasStarted) {
						currentContext.hasStarted = true
						await Promise.all(currentContext.hooks.beforeAll.map(hook => hook()))
					}
				}
				finally {
					decrementInParallelProcessing()
				}

				await testFunction()

				// 运行此测试中定义的所有子测试
				if (!is_top_level) incrementInParallelProcessing()
				try {
					await Promise.all(currentContext.definedTests.map(({ name, fn, options }) =>
						runTest(name, fn, options)
					))
					// 等待可能通过 .then() 启动但未被 await 的异步子测试
					while (currentContext.subtestCount > 0) await CI.sleep(100)
				}
				finally {
					if (!is_top_level) decrementInParallelProcessing()
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
					incrementInParallelProcessing()
					await Promise.all(parentContext.hooks.afterEach.map(hook => hook()))
					await Promise.all(currentContext.hooks.afterAll.map(hook => hook()))
				}
				finally {
					decrementInParallelProcessing()
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
		const endMemory = getMemoryUsage()
		const diff = endMemory - startMemory
		memoryUsage = `${diff > 0 ? '+' : ''}${(diff / 1024 / 1024).toFixed(2)} MB`
		memoryUsageStr = ` (mem: ${memoryUsage})`

		if (!currentContext.isFailed)
			incrementPassedTests()
		else {
			setAnyTestFailed(true)
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

		decrementActiveTestCount()
		if (parentContext.subtestCount !== undefined) parentContext.subtestCount--
	}
}
