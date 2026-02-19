/**
 * Cloudflare Pages Function to detect AI/LLM requests and serve llms.txt
 *
 * This function runs on Cloudflare's edge and intercepts requests before
 * serving static assets. Place this in /functions/_middleware.ts
 *
 * Docs: https://developers.cloudflare.com/pages/functions/middleware/
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
]

function isAIUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return AI_USER_AGENTS.some((agent) => ua.includes(agent))
}

export async function onRequest(context: {
  request: Request
  next: () => Promise<Response>
  env: any
}): Promise<Response> {
  const url = new URL(context.request.url)
  const userAgent = context.request.headers.get('user-agent')

  // Serve llms.txt content on homepage for AI agents
  if (url.pathname === '/' && isAIUserAgent(userAgent)) {
    try {
      // Fetch the llms.txt file from your static assets
      const llmsTxtUrl = new URL('/llms.txt', context.request.url)
      const llmsResponse = await fetch(llmsTxtUrl.toString())

      if (llmsResponse.ok) {
        const llmsContent = await llmsResponse.text()
        return new Response(llmsContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Served-As': 'llms.txt',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch (error) {
      console.error('Error serving llms.txt:', error)
    }
  }

  // Continue to the next middleware or serve static assets
  return context.next()
}
