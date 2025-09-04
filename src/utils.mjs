import { createHash } from 'node:crypto'
import fs from 'node:fs'
import process from 'node:process'
import url from 'node:url'


export function loadmjs(file) {
	return import(url.pathToFileURL(file))
}

export function getTestHash(testPath) {
	const hash = createHash('sha256')
	hash.update(testPath.join('/'))
	return hash.digest('hex').substring(0, 16)
}

export function refineError(error) {
	if (!error.stack) return
	const stackLines = error.stack.split('\n')
	// 跳过测试框架内部的assert调用堆栈
	let firstStackLine = stackLines[1]
	if (firstStackLine?.includes('at Object.assert') && firstStackLine.includes(import.meta.url))
		firstStackLine = stackLines[2]

	const match = firstStackLine?.match(/at\s+(?:.*\s+)?\(?(.*?):(\d+):(\d+)\)?$/)
	if (match) {
		const [, filePath, line, column] = match
		// 优先使用已有的信息，否则填充解析出的信息
		error.fileName ??= filePath.startsWith('file://') ? fs.realpathSync(url.fileURLToPath(filePath)) : filePath
		error.lineNumber ??= Number(line)
		error.columnNumber ??= Number(column)
	}
	else {
		error.fileName = ''
		error.lineNumber = 0
		error.columnNumber = 0
	}
}

export function getMemoryUsage() {
	globalThis.gc({
		execution: 'sync',
		flavor: 'last-resort',
		type: 'major'
	})
	return process.memoryUsage().heapUsed
}

export function escapeHtml(unsafe) {
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
