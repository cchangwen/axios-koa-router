import axios from 'axios';
import type {AxiosResponse, InternalAxiosRequestConfig, AxiosAdapter} from 'axios';
import type {default as Router} from './router'
import {Context} from './router'


// @ts-ignore
const Qs = await import('qs').then(module => module.default).catch(err => null)

function parseUrlencoded(data: string) {
	if (Qs) return Qs.parse(data)
	let query: any = {}
	for (let [k, v] of new URLSearchParams(data).entries()) {
		let ms: any = /^(.+)(?:\[(.*)\])$/.exec(k)
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
	let temp: any[] = []
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
	router?: Router | Promise<Router>,
	beforeResponse?: (ctx: Context) => any
}

async function use(this: Adapter, router: Router | Promise<Router>): Promise<Adapter> {
	if ((<Promise<Router>>router).then) {
		router = (await <Promise<any>>router).default
	}
	for (let route of (<Router>router).routes) {
		if (route[1].charAt) {
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
		this.routes.push(route)
	}
	return this
}

export default async function create(opts: Options): Promise<Adapter & AxiosAdapter> {
	let that = {opts, routes: [], use}
	let fn = adapter.bind(that)
	fn.use = use.bind(that)
	if (opts.router) {
		await fn.use(opts.router)
	}
	return fn
}

interface Adapter {
	opts: Options,
	routes: any[][],
	use: (router: Router | Promise<Router>) => Promise<Adapter>
}

async function adapter(this: Adapter, config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
	let urlSplit = config.url.split('?')
	let query = Object.assign(urlSplit[1] ? parseUrlencoded(urlSplit[1]) : {}, config.params)
	let body: {}
	let contentType = config.headers.getContentType()
	if (!contentType) {
		body = config.data || {}
	} else if (contentType.includes('json')) {
		body = JSON.parse(config.data)
	} else if (contentType.includes('urlenc')) {
		body = parseUrlencoded(config.data)
	} else {
		body = config.data || {}
	}

	let ctx = new Context(config, query, body, urlSplit[0], urlSplit[1])

	out: for (let [method, path, ...cbs] of this.routes) {
		if (method && method !== config.method) continue
		let ms
		if (!path || (path.exec && (ms = path.exec(urlSplit[0]))) || (path === urlSplit[0])) {
			ctx.req.regExp = path
			ctx.req.regMatch = ms || []
			ctx.req.regGroup = (ms && ms.groups) || {}
			for (let cb of cbs) {
				let next = false
				let rt = cb(ctx, () => (next = true))

				if (next) {
					continue
				} else {
					await rt
				}

				if (this.opts.beforeResponse) {
					await this.opts.beforeResponse(ctx)
				}

				if (next) {
					continue
				}

				if (ctx.bypass) {
					break out
				}

				// @ts-ignore
				return {
					config: config,
					status: ctx.status,
					headers: ctx.headers,
					data: ctx.body,
				}
			}
		}
	}

	delete config.adapter
	return axios(config)
}
