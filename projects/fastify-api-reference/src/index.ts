import fastifyApiReference from '@scalar/fastify-api-reference'
import 'dotenv/config'
import Fastify from 'fastify'

const port = process.env.PORT || 5053

const fastify = Fastify({
  logger: false,
})

fastify.get('/scalar.json', async (request, reply) => {
  reply.send(await import('./scalar.json'))
})

fastify.register(fastifyApiReference, {
  prefix: '/api-reference',
  apiReference: {
    specUrl: '/scalar.json',
  },
})

fastify.listen({ port: Number(port) }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/api-reference`)
})
