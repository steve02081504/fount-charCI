import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { CI } from './src/ci.mjs'
import { context, initializeBaseContext, setupGlobalConsole } from './src/context.mjs'
export { context }
import { registerErrorHandlers } from './src/errors.mjs'
import { exit, hookExit } from './src/exit.mjs'
import { initFount, loadChar, unloadChar, setupCharFunctions } from './src/fount.mjs'
import { setAnyTestFailed, anyTestFailed, totalTests, passedTests, CHAR_DIRECTORY, to_relative_path } from './src/globals.mjs'
import { startServer } from './src/server.mjs'
import { writeSummary } from './src/summary.mjs'
import { loadmjs, refineError } from './src/utils.mjs'

process.on('warning', e => console.warn(e.stack))

async function main() {
	{
		const { set_start } = await loadmjs(path.join(import.meta.dirname, './fount/src/server/base.mjs'))
		await set_start()
	}

	hookExit()
	registerErrorHandlers()
	await startServer()
	initializeBaseContext()
	setupGlobalConsole()

	await initFount()
	await loadChar()
	setupCharFunctions()

	await CI.test('CI Main', async () => {
		try {
			await loadmjs(path.join(CHAR_DIRECTORY, process.argv[2]))
		} catch (error) {
			refineError(error)
			const relativePath = to_relative_path(error.fileName)
			console.log('::group::💥🏠 CI file load error')
			console.log(`::error file=${relativePath},line=${error.lineNumber},endLine=${error.endLineNumber || error.lineNumber},col=${error.columnNumber},endColumn=${error.endColumnNumber || error.columnNumber},title=💥 ${error.name}::${error.message.split('\n')[0]}`)
			console.error(error.stack)
			console.log('::endgroup::')
			setAnyTestFailed(true)
		}
	}, {
		is_top_level: true,
	})

	await unloadChar()

	writeSummary()

	if (anyTestFailed) console.log(`😭 Char tests failed (${totalTests - passedTests} failures)`)
	else console.log(`🎉 Nice CI! All ${totalTests} tests passed.`)

	try {
		fs.rmSync('./.ci-workspaces', { recursive: true, force: true })
	} catch (error) {
		console.error('Failed to remove .ci-workspaces directory:')
		console.error(error)
	}

	exit(Number(anyTestFailed))
}

main()
