type UserParams = {
  id: string
}

type RouteHandler = (
  request: { body: Record<string, string> },
  reply: { code: (status: number) => { send: (payload: unknown) => unknown } },
) => unknown

type RouteOptions = Record<string, unknown>

type FastifyFixture = {
  get: <RouteGeneric>(url: string, options: RouteOptions, handler: RouteHandler) => RouteGeneric | void
  post: <RouteGeneric>(
    url: string,
    optionsOrHandler: RouteOptions | RouteHandler,
    handler?: RouteHandler,
  ) => RouteGeneric | void
  route: <RouteGeneric>(options: RouteOptions) => RouteGeneric | void
}

export const registerUserRoutes = (fastify: FastifyFixture) => {
  fastify.get<{
    Params: UserParams
    Querystring: {
      includePosts?: boolean
    }
    Reply: {
      200: {
        id: string
        name: string
        email: string
        posts: string[]
      }
      404: {
        error: 'not_found'
        message: string
      }
    }
  }>(
    '/users/:id',
    {
      schema: {
        summary: 'Get a user',
        description: 'Fetches one user by ID',
        tags: ['Users'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            includePosts: { type: 'boolean' },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        posts: ['first-post'],
      })
    },
  )

  fastify.post<{
    Body: {
      name: string
      email: string
    }
    Reply: {
      201: {
        id: string
        name: string
        email: string
      }
      '4xx': {
        error: string
      }
    }
  }>(
    '/users',
    {
      schema: {
        summary: 'Create a user',
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
          },
          required: ['name', 'email'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['id', 'name', 'email'],
          },
        },
      },
    },
    async (request) => ({
      id: 'user-2',
      name: request.body.name,
      email: request.body.email,
    }),
  )

  fastify.post<{
    Body: {
      name: string
      email: string
      role: 'admin' | 'member'
    }
    Querystring: {
      invite?: boolean
    }
    Headers: {
      'x-tenant': string
    }
    Reply: {
      201: {
        id: string
        role: 'admin' | 'member'
      }
      400: {
        error: string
      }
    }
  }>('/typed-users', async (request) => ({
    id: 'user-3',
    role: request.body.role,
  }))

  fastify.route<{
    Body: {
      enabled: boolean
    }
    Reply: {
      204: null
    }
  }>({
    method: 'PATCH',
    url: '/users/:id/settings',
    schema: {
      summary: 'Update user settings',
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
        },
        required: ['enabled'],
      },
      response: {
        204: {
          description: 'Settings updated',
        },
      },
    },
    handler: async () => null,
  })
}
