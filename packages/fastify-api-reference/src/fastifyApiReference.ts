import { type FastifyInstance } from 'fastify'
import { type FastifyPluginAsync, type FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'

export type ApiReferencePlugin = {
  apiReference: ApiReferenceOptions
}

export type ApiReferenceOptions = {
  title?: string
  specUrl?: string
  spec?: Record<string, any>
}

const getHtmlMarkup = (options: ApiReferenceOptions) => {
  const htmlTag = options.specUrl
    ? `<div data-spec-url="${options.specUrl}" />`
    : `<div data-spec='${JSON.stringify(options.spec)}' />`

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${options.title || 'API Reference'}</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <!-- Add your own OpenAPI/Swagger spec file URL here: -->
    ${htmlTag}
    <script src="https://cdn.scalar.com/api-reference.standalone.js"></script>
  </body>
</html>
`
}

const fastifyApiReferencePlugin: FastifyPluginAsync<
  ApiReferencePlugin
> = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  if (!options.apiReference.spec && !options.apiReference.specUrl) {
    console.warn(
      '[@scalar/fastify-api-reference] You didn’t provide a spec or specUrl. Please provide one of these options.',
    )

    return
  }

  fastify.addHook('onSend', (request, reply, payload, next) => {
    reply.header('Content-Type', 'text/html; charset=utf-8')
    next()
  })

  fastify.get('/', (_, reply) => {
    const html = getHtmlMarkup(options?.apiReference)

    reply.send(html)
  })
}

const fastifyApiReference = fp(fastifyApiReferencePlugin)

export default fastifyApiReference
