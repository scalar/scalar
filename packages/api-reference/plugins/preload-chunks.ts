import { dirname, relative } from 'node:path/posix'

import type { Plugin } from 'vite'

/**
 * Fetch the standalone build's remaining modules before a later interaction needs them.
 * This protects an open page after a deployment removes old chunks, provided preloading succeeds.
 * It does not fix an entry point that already comes from a different release than its chunks.
 */
export const preloadChunks = (): Plugin => ({
  name: 'scalar:preload-chunks',
  renderChunk(code, chunk, options, meta) {
    if (options.format !== 'es' || !chunk.isEntry) {
      return null
    }

    // Include nested dynamic imports too: browsers need not preload dependencies recursively.
    const files = Object.values(meta.chunks)
      .filter((candidate) => candidate.fileName !== chunk.fileName)
      .map((candidate) => `./${relative(dirname(chunk.fileName), candidate.fileName)}`)
      .sort()

    if (!files.length) {
      return null
    }

    return {
      // Appending leaves the existing code's source positions unchanged. Rolldown resolves the
      // chunk hash placeholders here before writing the bundle, just as it does for imports.
      code: `${code}
setTimeout(() => {
  if (!document.createElement('link').relList.supports('modulepreload')) return
  for (const file of ${JSON.stringify(files)}) {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = new URL(file, import.meta.url).href
    link.fetchPriority = 'low'
    document.head.appendChild(link)
  }
}, 0)
`,
      map: null,
    }
  },
})
