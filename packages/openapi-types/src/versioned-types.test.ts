import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The hand-written type declarations that are published alongside the package
 * (exposed as `@scalar/openapi-types/2.0`, `/3.0`, `/3.1` and `/3.2`).
 */
const versions = ['2.0', '3.0', '3.1', '3.2']

describe('versioned-types', () => {
  /**
   * Consumers with `"moduleResolution": "nodenext"` (or `node16`) require relative import paths
   * inside ESM declaration files to have explicit file extensions. Without them, TypeScript fails
   * to resolve the modules and type-checking breaks.
   *
   * See https://github.com/scalar/scalar/issues/9731
   */
  it.each(versions)('resolves the %s type declarations with moduleResolution set to nodenext', (version) => {
    const directory = join(packageRoot, version)

    const declarationFiles = readdirSync(directory)
      .filter((file: string) => file.endsWith('.d.ts'))
      .map((file: string) => join(directory, file))

    // Make sure we are actually testing something
    expect(declarationFiles.length).toBeGreaterThan(0)

    const program = ts.createProgram(declarationFiles, {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      strict: true,
    })

    const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

        return `${diagnostic.file.fileName}:${line + 1} ${message}`
      }

      return message
    })

    expect(diagnostics).toStrictEqual([])
  })
})
