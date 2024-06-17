import fastifyStatic from '@fastify/static'
import apiReferenceBundle from '@scalar/api-reference/browser/standalone.js?raw'
import playButtonBundle from '@scalar/play-button?raw'
import fastify from 'fastify'
import { join } from 'node:path'

const app = await fastify({ logger: true })

await app.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/',
})

// @scalar/api-reference

app.get('/api-reference/jsdelivr', (_request, reply) => {
  reply.sendFile('api-reference-jsdelivr.html', { cacheControl: false })
})

app.get('/api-reference/local', (_request, reply) => {
  reply.sendFile('api-reference-local.html', { cacheControl: false })
})

app.get('/api-reference/local/standalone.js', (_request, reply) => {
  reply
    .code(200)
    .header('Content-Type', 'text/javascript; charset=utf-8')
    .send(apiReferenceBundle)
})

// @scalar/play-button

app.get('/play-button/jsdelivr', (_request, reply) => {
  reply.sendFile('play-button-jsdelivr.html', { cacheControl: false })
})

app.get('/play-button/local', (_request, reply) => {
  reply.sendFile('play-button-local.html', { cacheControl: false })
})

app.get('/play-button/local/standalone.js', (_request, reply) => {
  reply
    .code(200)
    .header('Content-Type', 'text/javascript; charset=utf-8')
    .send(playButtonBundle)
})

// Run the server!
try {
  app.listen({ port: 3173 }, () => {
    console.log()
    console.info(`📦 CDN Example listening on http://127.0.0.1:3173`)
    console.log()
    console.info('  ➜ http://127.0.0.1:3173/api-reference/jsdelivr')
    console.info('  ➜ http://127.0.0.1:3173/api-reference/local')
    console.log()
    console.info('  ➜ http://127.0.0.1:3173/play-button/jsdelivr')
    console.info('  ➜ http://127.0.0.1:3173/play-button/local')
    console.log()
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
