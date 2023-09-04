import fastifyApiReference from '@scalar/fastify-api-reference'
import Fastify from 'fastify'

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

fastify.listen({ port: 0 }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/api-reference`)
})
