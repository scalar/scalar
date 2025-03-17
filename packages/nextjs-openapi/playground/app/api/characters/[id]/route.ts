import { type NextRequest, NextResponse } from 'next/server'

export type Troothy = boolean

/**
 * Get a simpsons character
 * @desc Hits up the sampleapis simpsons characters and narrows it down by id
 */
export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: {
      /** Some jsDoc */
      id: string
    }
  },
) {
  const error = false

  console.log(params)

  if (error) {
    return Response.json({ error: { message: 'There was a validation error' } }, { status: 400 })
  }

  return NextResponse.json('Sweet success, 200 response')
}
