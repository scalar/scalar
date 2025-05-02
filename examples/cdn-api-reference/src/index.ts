import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import fastifyStatic from '@fastify/static'
import apiReferenceBundle from '@scalar/api-reference/browser/standalone.js?raw'
import fastify from 'fastify'

const app = await fastify({ logger: true })

await app.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/',
  cacheControl: false,
})

// health check
app.get('/ping', (_request, reply) => {
  reply.send('pong')
})

// @scalar/api-reference bundle

app.get('/api-reference/standalone.js', (_request, reply) => {
  reply.code(200).header('Content-Type', 'text/javascript; charset=utf-8').send(apiReferenceBundle)
})

// Run the server!
try {
  app.listen({ port: 3173 }, () => {
    console.log()
    console.info('📦 CDN Example listening on http://127.0.0.1:3173')
    console.log()
    // List all files in the public directory
    readdirSync(join(__dirname, 'public')).forEach((file) => {
      console.info(`  ➜ http://127.0.0.1:3173/${file}`)
    })
    console.log()
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
