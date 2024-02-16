import type {InternalAxiosRequestConfig, AxiosRequestHeaders} from 'axios';

export class Context {
	config: InternalAxiosRequestConfig
	req = {} as {
		params: Record<string, any>
		query: Record<string, any>
		body: any
		headers: AxiosRequestHeaders
		path: string
		search: string
	}
	body: any = ''
	status = 200
	headers: any = {}
	next = false
	bypass = false

	constructor(config: InternalAxiosRequestConfig, query: any, body: any, path: string, search: string, params: any) {
		this.config = config
		this.req.headers = config.headers
		this.req.query = query
		this.req.body = body
		this.req.path = path
		this.req.search = search || ''
		this.req.params = params || {}
	}
}

type Path = string | RegExp
type callback = (ctx: Context, next: Function) => any

export default class Router {
	routes = [] as any[][]

	use(prefix: any, r?: Router | callback) {
		if (!r) {
			r = <Router>prefix
			prefix = ''
		}

		if ((<Router>r).routes) {
			for (let [method, path, cb] of (<Router>r).routes) {
				if (!prefix.bold || !path.bold) {
					path = path.push ? [...path] : [path]
					path.unshift(prefix)
					this.http(method, path, cb)
				} else {
					this.http(method, prefix + path, cb)
				}
			}
		} else {
			this.http('', <Path>prefix, <any>r)
		}
		return this
	}

	http(method: string, path: Path, cb: callback) {
		this.routes.push([method, path, cb])
		return this
	}

	any(path: Path, cb: callback) {
		return this.http('', path, cb)
	}

	get(path: Path, cb: callback) {
		return this.http('get', path, cb)
	}

	post(path: Path, cb: callback) {
		return this.http('post', path, cb)
	}

	put(path: Path, cb: callback) {
		return this.http('put', path, cb)
	}

	delete(path: Path, cb: callback) {
		return this.http('delete', path, cb)
	}

	options(path: Path, cb: callback) {
		return this.http('options', path, cb)
	}
}
