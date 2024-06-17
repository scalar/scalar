import fastifyStatic from '@fastify/static'
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

// Run the server!
try {
  await app.listen({ port: 3173 }, () => {
    console.log()
    console.info(`📦 CDN Example listening on http://127.0.0.1:3173/`)
    console.log()
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
