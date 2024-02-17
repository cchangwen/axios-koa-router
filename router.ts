import type {InternalAxiosRequestConfig, AxiosRequestHeaders} from 'axios';

export class Context {
	config: InternalAxiosRequestConfig
	req = {} as {
		regexp: string | RegExp
		matchs: []
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
	bypass = false

	constructor(config: InternalAxiosRequestConfig, query: any, body: any, path: string, search: string) {
		this.config = config
		this.req.headers = config.headers
		this.req.query = query
		this.req.body = body
		this.req.path = path
		this.req.search = search || ''
	}
}

type Path = string | RegExp
type callback = (ctx: Context, next: Function) => any
type CB = callback | callback[]
type Call = Router | CB | Promise<any>

export default class Router {
	routes = [] as any[][]

	async use(prefix: Path | Call, ...routers: Call[]) {
		if (!(<string>prefix).charAt && !(<RegExp>prefix).exec) {
			routers.unshift(<Call>prefix)
			prefix = ''
		} else if (!routers[0]) {
			throw prefix
		}

		for (let router of routers) {
			if ((<Promise<any>>router).then) {
				router = (await router).default
			}

			if ((<Router>router).routes) {
				for (let [method, path, ...cbs] of (<Router>router).routes) {
					if (!(<string>prefix).charAt || !path.charAt) {
						path = path.push ? [...path] : [path]
						path.unshift(prefix)
						this.http(method, path, cbs)
					} else {
						this.http(method, prefix + path, cbs)
					}
				}
			} else {
				this.http('', <Path>prefix, <any>router)
			}
		}
		return this
	}

	http(method: string, path: Path, ...cb: CB[]) {
		let arr: any[] = [method, path]
		for (let c of cb) {
			if ((<[]>c).push) {
				arr.push(...<[]>c)
			} else {
				arr.push(c)
			}
		}
		this.routes.push(arr)
		return this
	}

	any(path: Path, ...cb: CB[]) {
		return this.http('', path, ...cb)
	}

	get(path: Path, ...cb: CB[]) {
		return this.http('get', path, ...cb)
	}

	post(path: Path, ...cb: CB[]) {
		return this.http('post', path, ...cb)
	}

	put(path: Path, ...cb: CB[]) {
		return this.http('put', path, ...cb)
	}

	delete(path: Path, ...cb: CB[]) {
		return this.http('delete', path, ...cb)
	}

	options(path: Path, ...cb: CB[]) {
		return this.http('options', path, ...cb)
	}
}
