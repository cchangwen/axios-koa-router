mock axios like koa express
===========================

### Usage
```typescript
import axios from 'axios';

const net = axios.create({ });

if(ENABLE_AXIOS_MOCK) {
	// Use asynchronous import() to reduce the entry size of the production
	net.defaults.adapter = await (await import('axios-koa-router/adapter')).default({
		// where to load your mock-routes
		router: import('/@/mocks/index.ts'),
		// callback for debugs
		beforeResponse(ctx) { console.log(ctx) }
	})
}


net.get('/hello/world').then(res => console.log(res))


```

### mocks/index.ts
```typescript
import Router from 'axios-koa-router'

const router = new Router()

await router.use((ctx, next) => {
	// authorization checks
	if (ctx.req.headers.get('token') === 'wrong') {
		ctx.status = 401
		ctx.body = { error: 'auth failed' }
	} else {
		next()
	}
})

router.get('/hello/world', (ctx) => {
    ctx.body = 'hello world'
})

// use sub routers
await router.use('/test', import('./test'))

export default router

```



### mocks/test/index.ts
```typescript
import Router from 'axios-koa-router'

const router = new Router()

// request real internet
router.put('/bypass', (ctx) => {
    // ctx.config.url = '/'
    // ctx.config.data = '{}'
    ctx.bypass = true
})

// named path params
router.get('/bar/:name', (ctx) => {
    ctx.body = ctx.req.regNamed
})
router.get('/foo/:from(\\d+)-:to', (ctx) => {
    ctx.body = ctx.req.regNamed
})

// patterns
router.get('/bzz/(aa)?(bb)+cc*/:name', (ctx) => {
    ctx.body = ctx.req.path
})
router.any('/bzk/**', (ctx) => {
    ctx.body = ctx.req.path
})

// regexp
router.get(/^\/ReGeX\/(\d+)\/(\w+)$/i, (ctx) => {
	ctx.body = ctx.req.regMatch
})

export default router

```

Router Path Syntax

https://expressjs.com/en/guide/routing.html
