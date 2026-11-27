import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

describe('dts-resolution', () => {
  it('preserves handler types in an external ESM consumer', { timeout: 30_000 }, () => {
    const directory = mkdtempSync(join(tmpdir(), 'scalar-nextjs-types-'))

    try {
      mkdirSync(join(directory, 'node_modules', '@scalar'), { recursive: true })
      symlinkSync(
        join(import.meta.dirname, '..'),
        join(directory, 'node_modules', '@scalar', 'nextjs-api-reference'),
        'dir',
      )
      writeFileSync(join(directory, 'package.json'), JSON.stringify({ type: 'module' }))
      const entry = join(directory, 'index.ts')
      writeFileSync(
        entry,
        `
        import { ApiReference } from '@scalar/nextjs-api-reference'
        import type { ApiReferenceConfiguration, ApiReferenceConfigurationFactory, ApiReferenceOptions } from '@scalar/nextjs-api-reference'

        const configuration: Partial<ApiReferenceConfiguration> = { url: '/openapi.json' }
        const factory: ApiReferenceConfigurationFactory = (request) => ({ url: request.url })
        const options: ApiReferenceOptions = { headers: { 'Cache-Control': 'no-store' } }
        const staticHandler: () => Response = ApiReference(configuration, options)
        const dynamicHandler: (request: Request) => Promise<Response> = ApiReference(factory, options)

        // @ts-expect-error Static configuration must keep the synchronous overload.
        const invalidHandler: () => Promise<Response> = ApiReference(configuration)
        // @ts-expect-error Unknown configuration keys must remain rejected.
        ApiReference({ invalidOption: true })
      `,
      )

      const program = ts.createProgram([entry], {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        strict: true,
        skipLibCheck: false,
        types: [],
      })

      expect(
        ts
          .getPreEmitDiagnostics(program)
          .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
      ).toStrictEqual([])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
