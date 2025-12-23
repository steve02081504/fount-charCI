import path from 'node:path'

import { loadJsonFile, saveJsonFile } from '../../../../../../src/scripts/json_loader.mjs'
import { loadPart } from '../../../../../../src/server/parts_loader.mjs'

const configPath = import.meta.dirname + '/config.json'
const data = loadJsonFile(configPath)
const defaultInterfaces = {
	config: {
		/**
		 * 获取配置数据。
		 * @returns {Promise<any>} - 配置数据。
		 */
		async GetData() {
			return data
		},
		/**
		 * 设置配置数据。
		 * @param {any} data - 要设置的配置数据。
		 * @returns {Promise<void>}
		 */
		async SetData(new_data) {
			if (new_data.generator) data.generator = new_data.generator
			if (new_data.config) data.config = new_data.config
			saveJsonFile(configPath, data)
		},
		/**
		 * 获取配置显示内容。
		 * @returns {Promise<{ html: string, js: string }>} - 显示内容。
		 */
		async GetConfigDisplayContent() {
			return { html: '', js: '' }
		}
	}
}

export default {
	filename: path.basename(import.meta.dirname),
	async Load({ username }) {
		const manager = await loadPart(username, 'serviceSources/AI')
		Object.assign(this, await manager.interfaces.serviceSourceType.loadFromConfigData(username, data, {
			SaveConfig: (newdata) => { saveJsonFile(configPath, Object.assign(data, newdata)) }
		}))
		Object.assign(this.interfaces, defaultInterfaces)
	},
	interfaces: defaultInterfaces
}
