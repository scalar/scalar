import type { Context } from 'hono'
import { stream } from 'hono/streaming'

export function createStreamResponse(c: Context) {
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  return stream(c, async (s) => {
    while (true) {
      s.write('data: ping\n')

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  })
}
