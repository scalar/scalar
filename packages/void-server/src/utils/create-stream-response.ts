import type { Context } from 'hono'
import { stream } from 'hono/streaming'

export function createStreamResponse(c: Context) {
  return stream(c, async (s) => {
    while (true) {
      s.write('data: ping\n')

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  })
}
