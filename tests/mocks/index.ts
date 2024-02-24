import Router from 'axios-koa-router'
// import user, {session} from './user'
import test from './test'

const router = new Router()

// router.use((ctx, next) => {
// 	if (['/user/login', '/user/logout'].includes(ctx.config.url)) {
// 		next()
// 	} else if (session.token && session.token === ctx.req.headers.get('x-token')) {
// 		next()
// 	} else {
// 		ctx.body = {errno: 'login_required', error: 'invalid token'}
// 	}
// })

router.use(/^\/TEST\/\d+$/i, test)

router.use(/^\/test\/\d+$/, (ctx) => {
	ctx.body = 'regex ' + ctx.config.url
})

router.use('/test/:left.:right', (ctx) => {
	ctx.body = ctx.req.params
})

router.use('/test/:from(\\d+)-:to', (ctx) => {
	ctx.body = ctx.req.params
})

router.use('/test/:one-:two', (ctx) => {
	ctx.body = ctx.req.params
})

router.use('/test/:name', (ctx) => {
	ctx.body = 'name = ' + ctx.req.params.name
})

router.use('/test/(aa)?(bb)+cc*/:name', (ctx) => {
	ctx.body = ctx.req.path
})

router.use('/test/**', (ctx) => {
	ctx.body = '/test/** <= ' + ctx.req.path
})

// router.use('/user', user)

export default router

// net.get('/test/my.code').then(res => console.log(res))
// net.get('/test/2024-2030').then(res => console.log(res))
// net.get('/test/foo-bar').then(res => console.log(res))
// net.get('/test/bbccdd/ok?a=1').then(res => console.log(res))
// net.get('/test/a/b/c/d/e').then(res => console.log(res))
// net.get('/test/john?a=1&a=2&b[]=1&c[]=3&c[]=4&c[k]=5').then(res => console.log(res))
