/**
 * Middleware to detect AI/LLM requests and serve llms.txt content
 *
 * Usage with Express:
 * ```ts
 * import { llmsMiddleware } from './llms-middleware'
 * app.use(llmsMiddleware(llmsContent))
 * ```
 *
 * Usage with Hono:
 * ```ts
 * import { isAIUserAgent } from './llms-middleware'
 * app.use('/', async (c, next) => {
 *   if (isAIUserAgent(c.req.header('user-agent'))) {
 *     return c.text(llmsContent)
 *   }
 *   await next()
 * })
 * ```
 */

const AI_USER_AGENTS = [
  'anthropic-ai',
  'claude',
  'openai',
  'gptbot',
  'chatgpt',
  'bingbot',
  'googlebot',
  'google-extended',
  'perplexitybot',
  'amazonbot',
  'meta-externalagent',
  'cohere-ai',
  'diffbot',
  'curl',
  'wget',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
]

export function isAIUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return AI_USER_AGENTS.some((agent) => ua.includes(agent))
}

export type LlmsMiddleware = (req: any, res: any, next: () => void) => void

export function llmsMiddleware(llmsContent: string): LlmsMiddleware {
  return (req, res, next) => {
    const userAgent = req.headers['user-agent']

    if (req.url === '/llms.txt') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(llmsContent)
      return
    }

    if (req.url === '/' && isAIUserAgent(userAgent)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('X-Served-As', 'llms.txt')
      res.end(llmsContent)
      return
    }

    next()
  }
}
