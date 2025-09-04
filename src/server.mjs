import http from 'node:http'

import cookieParser from 'npm:cookie-parser'
import express from 'npm:express'
import fileUpload from 'npm:express-fileupload'

import { testAsyncStorage } from './context.mjs'

export const routers = {}

export function startServer() {
	const app = express()
	app.use(express.json({ limit: Infinity }))
	app.use(express.urlencoded({ limit: Infinity, extended: true }))
	app.use(fileUpload())
	app.use(cookieParser())

	app.use((req, res, next) => {
		const subpath = req.path.split('/')[1]
		if (routers[subpath])
			return routers[subpath](req, res, next)
		next()
	})

	app.use((err, req, res, next) => {
		const store = testAsyncStorage.getStore()
		if (store) {
			store.console.error(err)
			store.isFailed = true
		}
		next(err)
	})

	return new Promise((resolve) => {
		http.createServer(app).listen(8972, () => {
			resolve()
		})
	})
}
