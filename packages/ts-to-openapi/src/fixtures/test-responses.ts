/**
 * Returns a bunch of responses with different types
 * Only json for now, will add others later
 */
export const GET = async () => {
  if (Math.random() < 0.1) {
    const num = 34
    return Response.json(
      {
        error: {
          codez: num,
          undef: undefined,
          nuller: null,
          message: 'This is a horrendous error',
          things: ['stuff', 'others'],
        },
      } as const,
      {
        status: 417,
        headers: {
          random: 'what',
        },
      } as const,
    )
  } else if (Math.random() < 0.2) {
    const resp = true
    return Response.json(resp, { status: 502 })
  } else if (Math.random() < 0.3) {
    const nums = -4506.5
    return Response.json(nums, { status: 509 })
  } else if (Math.random() < 0.4) {
    const stuff = 'here i am'
    return Response.json(stuff, { status: 501 })
  } else if (Math.random() < 0.5) {
    const val = BigInt(6515)
    return Response.json(val, { status: 424 })
  } else if (Math.random() < 0.55) {
    return Response.json(415645615618950n, { status: 425 })
  } else if (Math.random() < 0.6) {
    return Response.json(undefined, { status: 422 })
  } else if (Math.random() < 0.7) {
    return Response.json(123, { status: 450 })
  } else if (Math.random() < 0.8) {
    return Response.json([123, 232, 231], { status: 500 })
  }

  return Response.json('this is the response')
}
