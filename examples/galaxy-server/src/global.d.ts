import 'hono'

declare module 'hono' {
  type ContextRenderer = {
    (content: string | Promise<string>, props?: { title?: string }): Response
  }
}
