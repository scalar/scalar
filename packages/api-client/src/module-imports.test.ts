import { performance } from 'node:perf_hooks'

import { describe, expect, it, vi } from 'vitest'

type ModuleImport = {
  name: string
  expectedExport: string
  load: () => Promise<object>
}

type ModuleImportResult = {
  averageMs: number
  maxMs: number
  minMs: number
  name: string
  samples: number[]
}

const samples = 3
const timeoutMs = 30_000

const moduleImports = [
  {
    name: 'modal entrypoint',
    expectedExport: 'createApiClientModal',
    load: () => import('@/v2/features/modal'),
  },
  {
    name: 'app entrypoint',
    expectedExport: 'createApiClientApp',
    load: () => import('@/v2/features/app'),
  },
  {
    name: 'operation block entrypoint',
    expectedExport: 'OperationBlock',
    load: () => import('@/v2/blocks/operation-block'),
  },
  {
    name: 'request block entrypoint',
    expectedExport: 'RequestBlock',
    load: () => import('@/v2/blocks/request-block'),
  },
  {
    name: 'response block entrypoint',
    expectedExport: 'ResponseBlock',
    load: () => import('@/v2/blocks/response-block'),
  },
  {
    name: 'search feature entrypoint',
    expectedExport: 'useSearchIndex',
    load: () => import('@/v2/features/search'),
  },
] satisfies ModuleImport[]

const round = (value: number): number => Number(value.toFixed(2))

const measureColdImport = async (moduleImport: ModuleImport): Promise<number[]> => {
  const durations: number[] = []

  await Array.from({ length: samples }).reduce<Promise<void>>(async (previous) => {
    await previous

    vi.resetModules()
    const start = performance.now()
    const importedModule = await moduleImport.load()
    const duration = performance.now() - start

    expect(moduleImport.expectedExport in importedModule).toBe(true)
    expect(Number.isFinite(duration)).toBe(true)
    durations.push(duration)
  }, Promise.resolve())

  return durations
}

describe('module-imports', () => {
  it(
    'measures cold public entrypoint imports',
    async () => {
      expect.assertions(moduleImports.length * samples * 2)

      const results: ModuleImportResult[] = []

      for (const moduleImport of moduleImports) {
        const durations = await measureColdImport(moduleImport)
        const averageMs = durations.reduce((total, duration) => total + duration, 0) / durations.length

        const result = {
          averageMs: round(averageMs),
          maxMs: round(Math.max(...durations)),
          minMs: round(Math.min(...durations)),
          name: moduleImport.name,
          samples: durations.map(round),
        }

        console.info('[module-import]', JSON.stringify(result))
        results.push(result)
      }

      console.info('[module-imports]', JSON.stringify(results, null, 2))
    },
    timeoutMs,
  )
})
