import { apiReference } from '@scalar/express-api-reference'
import Express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'

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
      title: 'Express Example',
      description:
        'The `@scalar/express-api-reference` middleware renders a beautiful API reference based on your OpenAPI specification.',
      version: '1.0.0',
    },
  },
  // Files containing annotations
  apis: ['./src/*.ts'],
})

// Serve the OpenAPI specification
app.get('/openapi.json', (req, res) => {
  res.json(OpenApiSpecification)
})

// Serve the API Reference
app.use(
  '/',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
)

// Listen
const PORT = Number(process.env.PORT) || 5055
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`💻 Express listening on http://${HOST}:${PORT}`)
})
