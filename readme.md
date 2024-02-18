### Usage
```typescript
import axios from 'axios';
import type { CreateAxiosDefaults } from 'axios';

const config: CreateAxiosDefaults = {
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 50000,
	withCredentials: true,
}

if(import.meta.env.VITE_AXIOS_MOCK) {
	// Use asynchronous import() to reduce the entry size of the production
	config.adapter = (await import('axios-mock-request')).default({
		// callback for debugs
		beforeResponse(ctx) { console.log(ctx) }
	})
	// where to load your mock-routes
	await config.adapter.use('/@/mocks/index.ts')
}

const net = axios.create(config);


net.get('/test/8754/666').then(res => console.log(res))
net.get('/test/my.car').then(res => console.log(res))
net.get('/test/2024-2030').then(res => console.log(res))
net.get('/test/foo-bar').then(res => console.log(res))
net.get('/test/bbccdd/ok?a=1').then(res => console.log(res))
net.get('/test/a/b/c/d/e').then(res => console.log(res))
net.get('/test/john?a=1&a=2&b[]=1&c[]=3&c[]=4&c[k]=5').then(res => console.log(res))

```

### mocks/index.ts
```typescript
import Router from 'axios-mock-request/router'

const router = new Router()

await router.use(/^\/TEST\/\d+$/i, import('./test'))

await router.use((ctx, next) => {
	// authorization checks
	if (ctx.req.headers.get('token') === 'wrong') {
		ctx.status = 401
		ctx.body = { error: 'auth failed' }
	} else {
		next()
	}
})

router.put(/^\/test\/\d+$/, (ctx) => {
	// request real internet
	// ctx.config.url = '/'
	// ctx.config.data = '{}'
	ctx.bypass = true
})

router.get('/test/:from(\\d+)-:to', (ctx) => {
	ctx.body = '/test/:from(\\d+)-:to <== ' + ctx.req.path
})

router.get('/test/:name', (ctx) => {
	ctx.body = '/test/:name <== ' + ctx.req.path
})

router.get('/test/(aa)?(bb)+cc*/:name', (ctx) => {
	ctx.body = '/test/(aa)?(bb)+cc*/:name <== ' + ctx.req.path
})

router.any('/test/**', (ctx) => {
	ctx.body = '/test/** <== ' + ctx.req.path
})

export default router

```

### mocks/test/index.ts
```typescript
import Router from 'axios-mock-request/router'

const router = new Router()

router.get('/:id', (ctx) => {
	ctx.body = ctx.req.params
})

export default router

```

Router Path Syntax

https://expressjs.com/en/guide/routing.html
