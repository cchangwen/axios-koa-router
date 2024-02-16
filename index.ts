import axios from 'axios';
import type {AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {Context} from './router'


function parseUrlencoded(data: string) {
	let query = {}
	for (let [k, v] of new URLSearchParams(data).entries()) {
		let ms = /^(.+)(?:\[(.*)\])$/.exec(k)
		if (ms) {
			k = ms[1]
			ms = ms[2]
			if (!query[k]) {
				query[k] = []
			}
		}
		if (k in query) {
			if (ms === null) {
				query[k] = v
			} else if (ms) {
				query[k][ms] = v
			} else {
				query[k].push(v)
			}
		} else {
			query[k] = v
		}
	}
	return query
}

function buildRegex(path: string) {
	let isReg = false
	let temp = []
	path = path.replace(/(\W):(?:(\w+)\(([^/]+)\)|(\w+))/g, (...ms) => {
		ms[1] = ms[1].replace(/([.*+{}()\[\]|])/, '\\$1')
		if (ms[4]) {
			temp.push(`${ms[1]}(?<${ms[4]}>[^/]+)`)
		} else {
			temp.push(`${ms[1]}(?<${ms[2]}>${ms[3]})`)
		}
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace('**', () => {
		temp.push('.*')
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace('*', () => {
		temp.push('[^/]*')
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace('?', () => {
		temp.push('?')
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace('+', () => {
		temp.push('+')
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace(/\(.+?\)/, (ms) => {
		temp.push(ms)
		return '#' + (temp.length - 1) + '#'
	})
	path = path.replace('.', () => {
		temp.push('\\.')
		return '#' + (temp.length - 1) + '#'
	})
	if (temp.length) {
		isReg = true
		for (let [ix, str] of temp.entries()) {
			path = path.replace('#' + ix + '#', str)
		}
	}
	return {isReg, path}
}

interface Options {
	routerImport: string
	beforeResponse?: (ctx: Context) => any
}

export default async function (opts: Options) {
	const {routes} = (await import(opts.routerImport/* @vite-ignore */)).default
	for (let route of routes) {
		if (route[1].bold) {
			let result = buildRegex(route[1])
			if (result.isReg) {
				route[1] = new RegExp('^' + result.path + '$')
			}
		} else if (route[1].push) {
			let flags = ''
			let arr = []
			for (let item of route[1]) {
				if (item.exec) {
					arr.push(item.toString().replace(/^\/\^?|\$?\/(\w*)$/g, (...ms) => {
						if (ms[1] && ms[1].includes('i')) {
							flags = 'i'
						}
						return ''
					}))
				} else {
					arr.push(buildRegex(item).path)
				}
			}
			arr.unshift('^')
			arr.push('$')
			route[1] = new RegExp(arr.join(''), flags)
		}
	}
	return adapter.bind({opts, routes})
}

interface Adapter {
	opts: Options,
	routes: any[][]
}

async function adapter(this: Adapter, config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
	let [pathname, search] = config.url.split('?')
	let query = search ? parseUrlencoded(search) : {}
	let body: {}
	if (config.headers.getContentType()?.includes('json')) {
		body = JSON.parse(config.data)
	} else if (config.headers.getContentType()?.includes('encoded')) {
		body = parseUrlencoded(config.data)
	} else {
		body = config.data || {}
	}

	for (let [method, path, cb] of this.routes) {
		if (method && method !== config.method) continue
		let ms
		if (!path || (path.exec && (ms = path.exec(pathname))) || (path === pathname)) {
			let ctx = new Context(config, query, body, pathname, search, ms && ms.groups)
			let rt = cb(ctx, () => (ctx.next = true))

			if (ctx.next) {
				continue
			} else {
				await rt
			}

			if (this.opts.beforeResponse) {
				this.opts.beforeResponse(ctx)
			}

			if (ctx.next) {
				continue
			}

			if (ctx.bypass) {
				break
			}

			return {
				config: config,
				status: ctx.status,
				headers: ctx.headers,
				data: ctx.body,
			}
		}
	}

	delete config.adapter
	return axios(config)
}
