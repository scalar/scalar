import { resolve } from 'node:path'
import { Worker } from 'node:worker_threads'

import type { Plugin } from 'vite'

import type { ExportResult, Manifest } from './types'

// Include worker dependencies in Vite's config graph so renderer edits restart it.
import './service'

type Result = ExportResult | Manifest | string
type Pending = { resolve: (value: Result) => void; reject: (cause: Error) => void }

/** Keep large exports off Vite's event loop so controls and assets stay available. */
export const playgroundApi = (): Plugin => ({
  name: 'markdown-playground-api',
  configureServer(server) {
    const worker = new Worker(resolve(import.meta.dirname, 'worker.mjs'), { execArgv: [] })
    const pending = new Map<number, Pending>()
    let nextId = 0
    let failure: Error | undefined
    worker.on('message', ({ id, value, error }: { id: number; value: Result; error?: string }) => {
      const job = pending.get(id)
      pending.delete(id)
      if (error) {
        job?.reject(new Error(error))
      } else {
        job?.resolve(value)
      }
    })
    const fail = (cause: Error): void => {
      failure = cause
      for (const job of pending.values()) {
        job.reject(cause)
      }
      pending.clear()
    }
    worker.on('error', fail)
    worker.on('exit', () => fail(failure ?? new Error('Export worker stopped. Restart the playground to try again.')))
    server.httpServer?.once('close', () => {
      void worker.terminate()
    })
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost')
      if (!url.pathname.startsWith('/__markdown/') && url.pathname !== '/llms.txt') {
        return next()
      }
      if (!['/__markdown/document', '/__markdown/render', '/llms.txt'].includes(url.pathname)) {
        response.statusCode = 404
        response.end('Unknown playground route')
        return
      }
      if (failure) {
        response.statusCode = 503
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: failure.message }))
        return
      }
      const id = ++nextId
      const job = new Promise<Result>((resolve, reject) => pending.set(id, { resolve, reject }))
      response.once('close', () => {
        pending.get(id)?.reject(new Error('Request closed'))
        pending.delete(id)
      })
      worker.postMessage({ id, pathname: url.pathname, search: url.searchParams.toString() })
      void job
        .then((value) => {
          if (response.destroyed) {
            return
          }
          response.setHeader(
            'Content-Type',
            typeof value === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
          )
          response.end(typeof value === 'string' ? value : JSON.stringify(value))
        })
        .catch((cause: unknown) => {
          if (response.destroyed) {
            return
          }
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: cause instanceof Error ? cause.message : 'Export failed' }))
        })
    })
  },
})
