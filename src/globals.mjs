import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// --- 全局变量和常量 ---
export const charname = process.env.CI_charname
export const username = process.env.CI_username
export const CHAR_DIRECTORY = path.join(import.meta.dirname, `../fount/.vm_data_charCI/users/${username}/chars/${charname}`)

export function to_relative_path(filePath) {
	try {
		return fs.realpathSync(filePath).replace(fs.realpathSync(CHAR_DIRECTORY), '').replace(/^[\\/]/, '').replaceAll('\\', '/')
	}
	catch {
		console.error(`Failed to resolve path: ${filePath}`)
		return filePath
	}
}

export const EMOJI = {
	test: '🧪',
	success: '✅',
	fail: '❌',
	fount: { start: '⛲', success: '👋', fail: '💀' },
	char: { load: '🚗', unload: '👋', success: '🥰', fail: '😭' },
	summary: { success: '✅', fail: '❌' }
}

export let anyTestFailed = false
export let activeTestCount = 0
export let activeWaittingCount = 0
export let inParallelProcessing = 0
export let totalTests = 0
export let passedTests = 0
export const allTestResults = []
export const mainStartTime = performance.now()

export function setAnyTestFailed(value) {
	anyTestFailed = value
}

export function incrementActiveTestCount() {
	activeTestCount++
}

export function decrementActiveTestCount() {
	activeTestCount--
}

export function incrementActiveWaittingCount(value) {
	activeWaittingCount += value
}

export function decrementActiveWaittingCount(value) {
	activeWaittingCount -= value
}

export function incrementInParallelProcessing() {
	inParallelProcessing++
}

export function decrementInParallelProcessing() {
	inParallelProcessing--
}

export function incrementTotalTests() {
	totalTests++
}

export function incrementPassedTests() {
	passedTests++
}
