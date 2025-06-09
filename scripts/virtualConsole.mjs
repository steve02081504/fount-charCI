import util from 'node:util'

export function VirtualConsole(options = {}) {
	const countMap = {}, timeMap = {}
	let groupIndent = 0
	const result = {
		outputs: '',
		base_console: options.base_console ?? console,
		// 配置选项
		options: {
			realConsoleOutput: false,
			error_handler: null,
		}
	}

	function format(...args) {
		return util.format(...args)
	}

	function groupPrefix() {
		return '  '.repeat(groupIndent)
	}

	function log(...args) {
		const formatted = format(...args)
		result.outputs += groupPrefix() + formatted + '\n'
		if (result.options.realConsoleOutput)
			result.base_console.log(groupPrefix() + formatted)
	}

	function error(...args) {
		if (result.options.error_handler && (args[0] instanceof Error) && args.length == 1)
			return result.options.error_handler(args[0])
		const formatted = format(...args)
		result.outputs += groupPrefix() + formatted + '\n'
		if (result.options.realConsoleOutput)
			result.base_console.error(groupPrefix() + formatted)
	}

	function warn(...args) {
		log(...args)
	}

	function info(...args) {
		log(...args)
	}

	function debug(...args) {
		log(...args)
	}

	function assert(condition, ...args) {
		if (!condition)
			error('Assertion failed:', ...args)
	}

	function clear() {
		result.outputs = ''
		if (result.options.realConsoleOutput)
			result.base_console.clear()  // 调用真正的 console.clear
	}

	function count(label = 'default') {
		countMap[label] = (countMap[label] || 0) + 1
		log(`${label}: ${countMap[label]}`)
		if (result.options.realConsoleOutput)
			result.base_console.count(label)
	}

	function countReset(label = 'default') {
		delete countMap[label]
		if (result.options.realConsoleOutput)
			result.base_console.countReset(label)
	}

	function dir(obj, options) {
		log(util.inspect(obj, options))
	}

	function dirxml(...data) {
		const formattedData = data.map(item => {
			if (typeof item === 'object' && item !== null)
				// 简单地将对象转换为 XML 字符串的占位符。
				// 真正的 XML 转换需要更复杂的逻辑。
				return `<object>${Object.keys(item).map(key => `<${key}>${item[key]}</${key}>`).join('')}</object>`
			else
				return util.format(item)
		}).join(' ')
		log(formattedData)
		if (result.options.realConsoleOutput)
			result.base_console.dirxml(...data)
	}

	function group(...args) {
		if (args.length)
			log(...args)
		groupIndent++
		if (result.options.realConsoleOutput)
			result.base_console.group(...args)
	}

	function groupCollapsed(...args) {
		if (args.length)
			log(...args)
		groupIndent++
		if (result.options.realConsoleOutput)
			result.base_console.groupCollapsed(...args)
	}

	function groupEnd() {
		groupIndent = Math.max(0, groupIndent - 1)
		if (result.options.realConsoleOutput)
			result.base_console.groupEnd()
	}

	function table(tabularData, properties) {
		if (result.options.realConsoleOutput)
			result.base_console.table(tabularData, properties) //直接调用
		else
			// 简易版，复杂版需要自己实现
			if (tabularData && typeof tabularData === 'object')
				if (Array.isArray(tabularData)) {
					//数组
					let keys = new Set()
					for (const item of tabularData)
						if (typeof item === 'object' && item !== null)
							Object.keys(item).forEach(k => keys.add(k))

					keys = Array.from(keys)
					if (properties)
						keys = keys.filter(k => properties.includes(k))

					const header = `| index | ${keys.join(' | ')} |`
					log(header)
					log('-'.repeat(header.length))

					tabularData.forEach((item, index) => {
						if (typeof item === 'object' && item !== null) {
							const row = keys.map(k => item[k] ?? '').join(' | ')
							log(`| ${index} | ${row} |`)
						}
						else
							log(`| ${index} | ${util.format(item)} |`)
					})
				}
				else {
					//普通对象
					const keys = properties || Object.keys(tabularData)
					const header = '| key | value |'
					log(header)
					log('-'.repeat(header.length))
					for (const key of keys)
						log(`| ${key} | ${tabularData[key] ?? ''} |`)
				}
			else
				log(util.format(tabularData))
	}

	function time(label = 'default') {
		timeMap[label] = performance.now()
		if (result.options.realConsoleOutput)
			result.base_console.time(label)
	}

	function timeEnd(label = 'default') {
		const startTime = timeMap[label]
		if (startTime !== undefined) {
			const duration = performance.now() - startTime
			log(`${label}: ${duration.toFixed(3)} ms`)
			delete timeMap[label]
		} else
			warn(`Timer '${label}' does not exist`)
		if (result.options.realConsoleOutput)
			result.base_console.timeEnd(label)
	}
	function timeLog(label = 'default', ...data) {
		const startTime = timeMap[label]
		if (startTime !== undefined) {
			const duration = performance.now() - startTime
			log(`${label}: ${duration.toFixed(3)} ms`, ...data)
		} else
			warn(`Timer '${label}' does not exist`)
		if (result.options.realConsoleOutput)
			result.base_console.timeLog(label, ...data)
	}

	function timeStamp(label) {
		log(`[${new Date().toISOString()}] ${label ?? ''}`)
		if (result.options.realConsoleOutput)
			result.base_console.timeStamp(label)
	}

	function trace(...args) {
		const stack = new Error().stack.split('\n').slice(2).join('\n') // 移除trace本身
		log('Trace:', ...args, '\n' + stack)
		if (result.options.realConsoleOutput)
			result.base_console.trace(...args)
	}

	function profile(label) {
		if (result.options.realConsoleOutput)
			result.base_console.profile(label)
		else
			warn('profile not implemented in VirtualConsole')
	}
	function profileEnd(label) {
		if (result.options.realConsoleOutput)
			result.base_console.profileEnd(label)
		else
			warn('profileEnd not implemented in VirtualConsole')
	}

	return Object.assign(result, {
		log, error, warn, info, debug,
		assert, clear, count, countReset,
		dir, dirxml, group, groupCollapsed, groupEnd,
		table, time, timeEnd, timeLog,
		timeStamp, trace, profile, profileEnd,
	})
}
