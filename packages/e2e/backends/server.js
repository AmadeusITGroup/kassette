// ------------------------------------------------------------------------- std

const http = require('http');
const https = require('https');

// ------------------------------------------------------------------------- 3rd

const Koa = require('koa');
const KoaRouter = require('koa-router');

// -------------------------------------------------------------------- internal

const {KEY, CERTIFICATE} = require('./tls');



////////////////////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////////////////////

function readStream(stream) {
  return new Promise(resolve => {
    parts = [];
    stream.on('data', (part) => parts.push(part));
    stream.on('end', () => resolve(Buffer.concat(parts)));
  });
}

async function readBody({req, request}, next) {
  request.body = (await readStream(req)).toString();
  return next();
}
exports.readBody = readBody;

function createServer({registerRoutes, onStart, onExit, secure = false}) {
  const application = new Koa();

  application.use(readBody);

  const router = new KoaRouter();
  registerRoutes(router);
  application.use(router.routes());

  const createServer = !secure
    ? http.createServer
    : callback => https.createServer({cert: CERTIFICATE, key: KEY}, callback);
  const server = createServer(application.callback());

  server.on('listening', function() { onStart({port: this.address().port}); });
  server.listen(0);

  return function () {
    server.close();
    onExit();
  };
}
exports.createServer = createServer;
