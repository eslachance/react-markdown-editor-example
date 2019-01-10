const Koa = require('koa');
const mount = require("koa-mount");
const serve = require("koa-static");
const indexRoutes = require('./routes/index');
const cors = require('@koa/cors');
const parser = require("koa-bodyparser");
const http = require('http');
const WebSocket = require('ws');
const { createReadStream } = require('fs');

const app = new Koa();
const PORT = 3030;

app.use(cors());
app.use(parser());
app.use(mount("/api", indexRoutes.routes()));
app.use(mount("/", serve("../frontend/build")));
app.use(async (ctx, next) => {
    ctx.type = 'html'
    ctx.body = createReadStream("../frontend/build/index.html");
});

app.context.db = require('./db.js');
const server = http.createServer(app.callback());

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    app.context.ws = wss;
    ws.on('message', function incoming(message) {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.send(JSON.stringify({
        action: "debug",
        message: 'Connected to WS Server'
    }));
});

server.listen(PORT, () => {
    console.log(`Server listening on port: ${server.address().port}`);
});
