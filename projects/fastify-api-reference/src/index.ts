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
    // spec: {
    //   openapi: '3.1.0',
    //   info: {
    //     title: 'Example',
    //   },
    //   paths: {},
    // },
  },
})

fastify.listen({ port: 0 }, function (err, address) {
  console.log(`⚡️ Fastify Plugin running on ${address}/api-reference`)
})
