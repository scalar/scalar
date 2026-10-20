import { parentPort } from 'node:worker_threads'

import { createExportService } from './service'

const exportDocument = createExportService()
parentPort?.on('message', (request: { id: number; pathname: string; search: string }) => {
  void exportDocument(request.pathname, request.search).then(
    (value) => parentPort?.postMessage({ id: request.id, value }),
    (cause: unknown) =>
      parentPort?.postMessage({ id: request.id, error: cause instanceof Error ? cause.message : 'Export failed' }),
  )
})
