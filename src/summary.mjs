import fs from 'node:fs'
import process from 'node:process'

import { anyTestFailed, passedTests, totalTests, mainStartTime, EMOJI, allTestResults } from './globals.mjs'
import { getTestHash, escapeHtml } from './utils.mjs'

export function writeSummary() {
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
				summary += `| ${statusIcon} | ${result.path} | ${result.duration.toFixed(2)} | ${result.memoryUsage || 'N/A'} | [Click here](#${hash}) |
`

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
}
