import { z } from 'zod'

const userSchema = z.object({
  name: z.string().default('Guest'),
  email: z.string().email(),
})

/**
 * @openapi
 * /api/bye:
 *   post:
 *     description: 'Get all users.'
 *     responses:
 *       200:
 *         description: 'Returns users list.'
 *       404:
 *         description: 'Users was not found.'
 *       502:
 *         description: 'Internal server error.'
 *   tag: 'Users'
 */
export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (body) =>
    userSchema.parse(body),
  ) // or `.parse` to directly throw an error
  return result
})
