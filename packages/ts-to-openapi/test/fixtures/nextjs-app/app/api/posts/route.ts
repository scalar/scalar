/**
 * Create a post
 *
 * @summary Create post
 */
export async function POST() {
  return Response.json(
    {
      ok: true,
      postId: 10,
    } as const,
    { status: 201 } as const,
  )
}
