const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const send = require('koa-send');
const postcss = require('postcss');
const browserify = require('browserify');
const watchify = require('watchify-middleware');
const chokidar = require('chokidar');

const ROOT = path.resolve(__dirname, '../');

const readFile = promisify(fs.readFile);

/**
 * Set up browserify bundles
 */

const bundles = {
  [`index-${ process.env.npm_package_version }`]: watchify(browserify('app/index.js', {
    basedir: ROOT,
    debug: true,
    transform: [
      require('localenvify')
    ]
  })),
  'service-worker': watchify(browserify('app/service-worker.js', {
    basedir: ROOT,
    debug: true,
    transform: [
      require('localenvify')
    ]
  }))
};

/**
 * Set up PostCSS bundle of application
 */

const cssBundle = postcss([
  require('postcss-import')(),
  require('postcss-custom-properties')(),
  require('postcss-custom-media')(),
  require('postcss-color-function')(),
  require('postcss-selector-matches')(),
  require('postcss-url')(),
  require('postcss-flexbugs-fixes')()
]);

/**
 * Watch for css file changes and recompile
 */

let deferred = processCSS();
const watcher = chokidar.watch('**/*.css', { cwd: ROOT, ignoreInitial: true });
watcher.on('all', () => { deferred = processCSS(); });

/**
 * Read and process entry file
 */

function processCSS() {
  const file = path.resolve(ROOT, 'app/index.css');
  return readFile(file, 'utf8').then(css => {
    return cssBundle.process(css, { from: file, to: file });
  });
}

/**
 * Middleware that captures requests for application entry files and assets
 */

module.exports = async function dev(ctx, next) {
  if (/\.js$/.test(ctx.url)) {
    return new Promise((resolve, reject) => {
      bundles[ ctx.url.match(/^\/(.+)\.js$/)[1] ](ctx.req, ctx.res);
      ctx.res.on('error', reject);
      ctx.res.on('end', resolve);
    });
  } else if (/\/index-[\d.]+.css/.test(ctx.url)) {
    try {
      const result = await deferred;
      ctx.set('Content-Type', 'text/css');
      ctx.body = result.css;
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  } else if (/^\/components/.test(ctx.url)) {
    return send(ctx, ctx.path, { root: ROOT });
  } else {
    return next();
  }
};
