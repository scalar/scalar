import ejs from 'ejs'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import fs from 'fs'
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

  fastify.get(options.routePrefix ?? '/', async (_, reply) => {
    reply.header('Content-Type', 'text/html; charset=utf-8')

    const html = await ejs.renderFile(
      path.resolve(`${__dirname}/templates/index.ejs`),
      {
        options,
      },
    )

    reply.send(html)
  })

  console.log((options.routePrefix ?? '/') + '/fastify-api-reference.js')

  fastify.get(
    (options.routePrefix ?? '/') + '/fastify-api-reference.js',
    async (_, reply) => {
      reply.header('Content-Type', 'application/javascript; charset=utf-8')

      const content = fs.readFileSync(
        path.resolve(`${__dirname}/../dist/templates/fastify-api-reference.js`),
        'utf8',
      )

      reply.send(content)
    },
  )
}

export default fp(fastifyApiReference)
