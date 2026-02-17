import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

const llmsTxtPath = path.resolve(__dirname, '../../llms.txt')

/**
 * Vite plugin that serves llms.txt for API requests to the root page.
 * When a request to "/" comes in without an "Accept: text/html" header
 * (e.g., curl, LLM agents, API clients), we return the llms.txt content
 * instead of the SPA HTML.
 */
function llmsTxtPlugin() {
  return {
    name: 'llms-txt',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const isLlmsTxtPath = req.url === '/llms.txt'
        const isRoot = req.url === '/' || req.url === ''

        if (!isLlmsTxtPath && !isRoot) {
          return next()
        }

        // Always serve llms.txt at /llms.txt, and at / only for non-browser requests
        if (isRoot) {
          const accept = req.headers['accept'] || ''
          if (accept.includes('text/html')) {
            return next()
          }
        }

        try {
          const content = fs.readFileSync(llmsTxtPath, 'utf-8')
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(content)
        } catch {
          next()
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [llmsTxtPlugin(), vue()],
  server: {
    port: 5050,
    open: true,
  },
})
