import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

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

const getHtmlMarkup = (options: ApiReferenceOptions) => {
  const htmlTag = options.apiReference?.specUrl
    ? `<div data-spec-url="${options.apiReference?.specUrl}" />`
    : typeof options.apiReference?.spec === 'object'
    ? `<div data-spec='${JSON.stringify(options.apiReference?.spec)}' />`
    : options.apiReference?.spec
    ? `<div data-spec='${JSON.stringify(options.apiReference?.spec())}' />`
    : ''

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${options.apiReference.title || 'API Reference'}</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <!-- Add your own OpenAPI/Swagger spec file URL here: -->
    ${htmlTag}
    <script src="https://www.unpkg.com/@scalar/api-reference"></script>
  </body>
</html>
`
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
    reply.send(getHtmlMarkup(options))
  })
}

export default fp(fastifyApiReference)
