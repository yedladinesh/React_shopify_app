require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
//const { verifyRequest } = require('koa-session');
const session = require('koa-session');
const {Shopify, ApiVersion} = require('@shopify/shopify-api');

dotenv.config();

const port = parseInt(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY } = process.env;

app.prepare().then(() => {
    const server = new Koa();

    server.use(session({secure: true, sameSite: 'none' }, server));

    server.keys = [SHOPIFY_API_SECRET];

    // initializes the library
Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES:  ['read_products','write_products','read_customers','read_orders','read_themes','write_themes'],
    HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/^https:\/\//, ''),
    API_VERSION: ApiVersion.October20,
    IS_EMBEDDED_APP: true,
    // More information at https://github.com/Shopify/shopify-node-api/blob/main/docs/issues.md#notes-on-session-handling
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
  });

    server.use(
        createShopifyAuth({
            apiKey: SHOPIFY_API_KEY,
            secret: SHOPIFY_API_SECRET,
            scopes: ['read_products','write_products','read_customers','read_orders','read_themes','write_themes'],
            afterAuth(ctx) {
                const { shop, accessToken } = ctx.session;
                console.log(accessToken,"shop");
                ctx.redirect(`/?shop=${shop}`);
            },
        }),
    );

    //server.use(verifyRequest({accessMode: 'offline'}));

    server.use(async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    })

    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    })
});