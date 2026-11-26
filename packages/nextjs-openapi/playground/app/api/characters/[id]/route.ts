import { type NextRequest, NextResponse } from 'next/server'

/**
 * Get a simpsons character
 * @desc Hits up the sample apis simpsons characters and narrows it down by id
 */
export const GET = async (
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      /** Some jsDoc */
      id: string
    }>
  },
): Promise<Response> => {
  const error = false

  console.log(await params)

  if (error) {
    return Response.json({ error: { message: 'There was a validation error' } }, { status: 400 })
  }

  return NextResponse.json('Sweet success, 200 response')
}
