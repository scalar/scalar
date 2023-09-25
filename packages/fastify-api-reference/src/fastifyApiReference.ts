import ejs from 'ejs'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import path from 'path'

export type ApiReferenceOptions = {
  /**
   * Prefix for the registered route
   *
   * @default '/'
   */
  routePrefix: string
  apiReference: {
    specUrl?: string
    spec?: Record<string, any> | (() => Record<string, any>)
    title?: string
  }
}

const fastifyApiReference: FastifyPluginAsync<ApiReferenceOptions> = async (
  fastify,
  options,
) => {
  if (!options.apiReference?.spec && !options.apiReference?.specUrl) {
    console.warn(
      '[@scalar/fastify-api-reference] You didn’t provide a spec or specUrl. Please provide one of these options.',
    )

    return
  }

  fastify.addHook('onSend', (request, reply, payload, next) => {
    reply.header('Content-Type', 'text/html; charset=utf-8')
    next()
  })

  fastify.get(options.routePrefix ?? '/', async (_, reply) => {
    const html = await ejs.renderFile(
      path.resolve(`${__dirname}/templates/index.ejs`),
      {
        options,
      },
    )

    reply.send(html)
  })
}

export default fp(fastifyApiReference)
