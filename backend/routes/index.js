const Router = require('koa-router');
const parser = require("koa-bodyparser");
const router = new Router();

router.use(parser());

router.get('/page/:id', async ctx => {
    console.log(`Request for page ${ctx.params.id} received.`);
    if(ctx.db.pages.has(ctx.params.id)) {
        const page = ctx.db.pages.get(ctx.params.id);
        ctx.body = {
            status: 'success',
            value: page.value,
            rendered: page.rendered,

        };
    } else {
        ctx.body = {status: 'error', message: 'page not found'}
    }
});

router.post('/page/:id', async ctx => {
    const data = ctx.request.body;
    if(data.value) {
        ctx.db.pages.set(ctx.params.id, data.value, 'value');
    }
    if(data.rendered) {
        ctx.db.pages.set(ctx.params.id, data.rendered, 'rendered');
    }
    console.log(`Saved page data for ${ctx.params.id}`);
});

module.exports = router;