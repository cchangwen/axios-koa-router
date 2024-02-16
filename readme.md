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
	config.adapter = await (await import('axios-mock-request')).default({
		routerImport: '/@/mocks',
		beforeResponse(ctx) {
			console.log(ctx)
		}
	})
}

const service = axios.create(config);

```

### Router
```typescript
import Router from 'axios-mock-request/router'
import test from './test'

const router = new Router()

router.use(/^\/TEST\/\d+$/i, test)

router.use(/^\/test\/\d+$/, (ctx) => {
	ctx.body = 'regex ' + ctx.config.url
})

router.use('/test/:from(\\d+)-:to', (ctx) => {
	ctx.body = '/test/:from(\\d+)-:to <== ' + ctx.req.path
})

router.use('/test/:name', (ctx) => {
	ctx.body = '/test/:name <== ' + ctx.req.path
})

router.use('/test/(aa)?(bb)+cc*/:name', (ctx) => {
	ctx.body = '/test/(aa)?(bb)+cc*/:name <== ' + ctx.req.path
})

router.use('/test/**', (ctx) => {
	ctx.body = '/test/** <== ' + ctx.req.path
})

export default router

```

### test/index.ts
```typescript
import Router from 'axios-mock-request/router'

const router = new Router()

router.get('/:id', (ctx) => {
	ctx.body = ctx.req.params
})

export default router

```

https://expressjs.com/en/guide/routing.html
