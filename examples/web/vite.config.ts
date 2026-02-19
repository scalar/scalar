import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'path'
import { readFileSync, existsSync, mkdirSync, copyFileSync, cpSync } from 'fs'

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
]

function isAIRequest(userAgent: string | undefined): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return AI_USER_AGENTS.some((agent) => ua.includes(agent))
}

function llmsTxtPlugin(): Plugin {
  let llmsContent: string
  const llmsPath = resolve(__dirname, '../../llms.txt')

  return {
    name: 'llms-txt-plugin',
    configureServer(server) {
      llmsContent = readFileSync(llmsPath, 'utf-8')

      server.middlewares.use((req, res, next) => {
        const userAgent = req.headers['user-agent']

        if (req.url === '/llms.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(llmsContent)
          return
        }

        if (req.url === '/' && isAIRequest(userAgent)) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.setHeader('X-Served-As', 'llms.txt')
          res.end(llmsContent)
          return
        }

        next()
      })
    },
    closeBundle() {
      // Copy llms.txt to dist/ after build completes
      const outputDir = resolve(__dirname, 'dist')
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
      }
      copyFileSync(llmsPath, resolve(outputDir, 'llms.txt'))
      console.log('✓ Copied llms.txt to dist/')

      // Copy functions/ directory to dist/ for Cloudflare Pages
      const functionsDir = resolve(__dirname, 'functions')
      const distFunctionsDir = resolve(outputDir, 'functions')
      if (existsSync(functionsDir)) {
        cpSync(functionsDir, distFunctionsDir, { recursive: true })
        console.log('✓ Copied functions/ to dist/functions/')
      }
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
  build: {
    outDir: 'dist',
  },
})
