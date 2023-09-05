import { type FastifyInstance, type RegisterOptions } from 'fastify'

export type FastifyApiReferenceOptions = {
  title?: string
  specUrl?: string
  spec?: Record<string, any>
}

const getHtmlMarkup = (options: FastifyApiReferenceOptions) => {
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

export default (
  fastify: FastifyInstance,
  options: RegisterOptions & {
    apiReference: FastifyApiReferenceOptions
  },
  done: (err?: Error) => void,
) => {
  if (!options.apiReference.spec && !options.apiReference.specUrl) {
    console.warn(
      '[@scalar/fastify-api-reference] You didn’t provide a spec or specUrl. Please provide one of these options.',
    )

    done()
    return
  }

  fastify.get('/', (_, reply) => {
    const html = getHtmlMarkup(options?.apiReference)

    reply.headers({
      'Content-Type': 'text/html; charset=utf-8',
    })

    reply.send(html)
  })

  done()
}
