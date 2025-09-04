import Express from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import { apiReference } from '../src/index'

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
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World!
 */
app.get('/foobar', (_req, res) => {
  res.send('Hello World!')
})

/**
 * @openapi
 * /hello:
 *   post:
 *     description: Send a personalized greeting.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John
 *     responses:
 *       200:
 *         description: Returns a personalized greeting.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, John!
 */
app.post('/hello', (req, res) => {
  const { name } = req.body
  res.json({ message: `Hello, ${name}!` })
})

/**
 * @openapi
 * /goodbye:
 *   delete:
 *     description: Delete a user session.
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Confirms session deletion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Session 1234567890 deleted.
 */
app.delete('/goodbye', (req, res) => {
  const { sessionId } = req.query
  res.json({ status: `Session ${sessionId} deleted.` })
})

/**
 * @openapi
 * /status:
 *   get:
 *     description: Get the server status.
 *     responses:
 *       200:
 *         description: Returns the server status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Server is running smoothly!
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 */
app.get('/status', (_req, res) => {
  res.json({ status: 'Server is running smoothly!', uptime: process.uptime() })
})

const ApiDefinition = swaggerJsdoc({
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
  // Update the path to include the current file
  apis: [new URL(import.meta.url).pathname],
})

// Serve the OpenAPI specification
app.get('/openapi.json', (_, res) => {
  res.json(ApiDefinition)
})

// Serve the Scalar API Reference
app.use(
  '/',
  apiReference({
    url: '/openapi.json',
  }),
)

// Listen
const PORT = Number(process.env.PORT) || 5055
const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`💻 Express listening on http://${HOST}:${PORT}`)
})
