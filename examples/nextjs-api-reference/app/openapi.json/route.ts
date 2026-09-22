/** This example describes its route explicitly. Scalar renders this document. */
export const GET = (): Response =>
  Response.json({
    openapi: '3.1.0',
    info: {
      title: 'Orbit API',
      version: '1.0.0',
      description: 'Explore a small planetary dataset. Try a request against this Next.js application.',
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/planets': {
        get: {
          operationId: 'listPlanets',
          summary: 'List planets',
          tags: ['Planets'],
          responses: {
            '200': {
              description: 'The planets in our sample catalog.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'name', 'moons'],
                      properties: { id: { type: 'string' }, name: { type: 'string' }, moons: { type: 'integer' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
