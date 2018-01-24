const Koa = require('koa')
const body = require('koa-body')
const serve = require('koa-static')
const helmet = require('koa-helmet')
const noTrailingSlash = require('koa-no-trailing-slash')
const app = require('./lib/app')
const router = require('./lib/router')
const cache = require('./lib/middleware/cache')
const assets = require('./lib/middleware/assets')
const render = require('./lib/middleware/render')
const prismic = require('./lib/middleware/prismic')
const analytics = require('./lib/middleware/analytics')

const server = new Koa()

/**
 * Compile and serve assets on demand during development
 */

if (process.env.NODE_ENV === 'development') {
  // Serve live client resources
  server.use(require('./lib/middleware/watchify'))
  server.use(require('./lib/middleware/postcss'))

  // Serve components assets from disk
  server.use(serve('lib'))
}

/**
 * Take extra care to clean up em' headers in production
 */

if (process.env.NODE_ENV !== 'development') {
  server.use(helmet())
}

/**
 * Prevent indexing everything but production
 */

if (process.env.NODE_ENV !== 'production') {
  server.use(require('./lib/middleware/robots'))
}

server.use(noTrailingSlash())

/**
 * Serve static files
 */

server.use(assets)
server.use(serve('public', { maxage: 1000 * 60 * 60 * 24 * 365 }))

/**
 * Add on Universal Analytics for server process tracking
 */

server.use(analytics(process.env.GOOGLE_ANALYTICS_ID))

/**
 * Set up request cache mechanism
 */

server.use(cache)

/**
 * Parse request body
 */

server.use(body())

/**
 * Handle rendering response
 */

server.use(render(app))

/**
 * Hook up the Prismic api
 */

server.use(prismic)

/**
 * Hook up em' routes
 */

server.use(router)

/**
 * Lift off
 */

server.listen(process.env.PORT, () => {
  console.info(`🚀  Server listening at localhost:${process.env.PORT}`)
})
