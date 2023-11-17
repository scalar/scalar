import Express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'

import { apiReference } from './expressApiReference'

// Initialize Express
const app = Express()

/**
 * @openapi
 * /foobar:
 *   get:
 *     description: Get a mysterious string.
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
app.get('/foobar', (req, res) => {
  res.send('Hello World!')
})

const OpenApiSpecification = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Example',
      description:
        'The `@scalar/express-api-reference` middleware renders a beautiful API reference based on your OpenAPI specification.',
      version: '1.0.0',
    },
  },
  // Files containing annotations
  apis: ['./src/*.ts'],
})

// TODO: Remove later
app.get('/swagger.json', (req, res) => {
  res.json(OpenApiSpecification)
})

app.use(
  '/',
  apiReference({
    spec: {
      content: OpenApiSpecification,
    },
  }),
)

// Listen
app.listen(5056, () => {
  console.log('💻 Express listening on http://localhost:5056')
})
