import type { UserRouteContext } from './types'

/**
 * Get a single user
 *
 * Returns a user object for the provided route parameter.
 * @summary Get user by id
 * @description Returns user details by path parameter.
 */
export const GET = async (_request: Request, _context: UserRouteContext) => {
  return Response.json(
    {
      id: 'user_1',
      name: 'Ada Lovelace',
    } as const,
    { status: 200 } as const,
  )
}

/**
 * Delete a single user
 *
 * @summary Delete user by id
 * @description Deletes the user and returns no payload.
 */
export async function DELETE(_request: Request, _context: UserRouteContext) {
  return Response.json(null, { status: 204 } as const)
}
