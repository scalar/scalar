import fastifyStatic from '@fastify/static'
import standaloneBundle from '@scalar/api-reference/browser/standalone.js?raw'
import fastify from 'fastify'
import { join } from 'node:path'

const app = await fastify({ logger: true })

await app.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/',
})

app.get('/', (_request, reply) => {
  reply.sendFile('index.html')
})

app.get('/jsdelivr', (_request, reply) => {
  // overriding the options disabling cache-control headers)
  // serving path.join(__dirname, 'public', 'myHtml.html') directly
  reply.sendFile('api-reference-cdn-jsdelivr.html', { cacheControl: false })
})

app.get('/local', (_request, reply) => {
  // overriding the options disabling cache-control headers
  // serving path.join(__dirname, 'public', 'myHtml.html') directly
  reply.sendFile('api-reference-cdn-local.html', { cacheControl: false })
})

app.get('/local/standalone.js', (_request, reply) => {
  reply
    .code(200)
    .header('Content-Type', 'text/javascript; charset=utf-8')
    .send(standaloneBundle)
})

// Run the server!
try {
  app.listen({ port: 3173 }, () => {
    console.log()
    console.info(`📦 CDN Example listening on http://127.0.0.1:3173/`)
    console.log()
    console.info('  ➜ http://127.0.0.1:3173/jsdelivr')
    console.info('  ➜ http://127.0.0.1:3173/local')
    console.log()
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
