import Router from 'axios-koa-router'

const router = new Router()

router.get('/:id', (ctx) => {
	ctx.body = ctx.req.regNamed
})

export default router
