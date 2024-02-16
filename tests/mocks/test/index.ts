import Router from 'axios-mock-request/router'

const router = new Router()

router.get('/:id', (ctx) => {
	ctx.body = ctx.req.params
})

export default router
