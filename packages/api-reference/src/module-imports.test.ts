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
const testTimeoutMs = 30_000

const moduleImports = [
  {
    name: 'root entrypoint',
    expectedExport: 'createApiReference',
    load: () => import('@/index'),
  },
  {
    name: 'components entrypoint',
    expectedExport: 'ApiReferenceContent',
    load: () => import('@/components'),
  },
  {
    name: 'blocks entrypoint',
    expectedExport: 'InfoBlock',
    load: () => import('@/blocks'),
  },
  {
    name: 'operation feature entrypoint',
    expectedExport: 'Operation',
    load: () => import('@/features/Operation'),
  },
  {
    name: 'search feature entrypoint',
    expectedExport: 'SearchModal',
    load: () => import('@/features/Search'),
  },
  {
    name: 'html API entrypoint',
    expectedExport: 'createApiReference',
    load: () => import('@/standalone/lib/html-api'),
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

        results.push({
          averageMs: round(averageMs),
          maxMs: round(Math.max(...durations)),
          minMs: round(Math.min(...durations)),
          name: moduleImport.name,
          samples: durations.map(round),
        })
      }

      console.info('[module-imports]', JSON.stringify(results, null, 2))
    },
    testTimeoutMs,
  )
})
