import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

/** Turns TypeScript diagnostics into readable strings, so test failures point at the exact file and line. */
const formatDiagnostics = (program: ts.Program): string[] =>
  ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

      return `${diagnostic.file.fileName}:${line + 1} ${message}`
    }

    return message
  })

describe('versioned-types', () => {
  /**
   * Consumers with `"moduleResolution": "nodenext"` (or `node16`) require relative import paths
   * inside ESM declaration files to have explicit file extensions. Without them, TypeScript fails
   * to resolve the modules and type-checking breaks.
   *
   * See https://github.com/scalar/scalar/issues/9731
   */
  // Creating a TypeScript program can take a while on slower CI runners, so we allow more time than the default 5 seconds
  it.each(versions)(
    'resolves the %s type declarations with moduleResolution set to nodenext',
    { timeout: 30_000 },
    (version) => {
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

      expect(formatDiagnostics(program)).toStrictEqual([])
    },
  )

  /**
   * The type declarations should work no matter how the consuming project is set up, so we
   * type-check a small consumer project against every common `tsconfig.json` flavor: modern
   * Node ESM and CommonJS projects (`nodenext` / `node16`), bundler-based projects, and legacy
   * CommonJS projects with `node10` resolution (which ignores the `exports` map entirely and
   * resolves `@scalar/openapi-types/3.2` as a plain directory lookup).
   */
  const consumerConfigs: { name: string; packageJson: Record<string, unknown>; compilerOptions: ts.CompilerOptions }[] =
    [
      {
        name: 'an ESM project with moduleResolution nodenext',
        packageJson: { type: 'module' },
        compilerOptions: {
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          verbatimModuleSyntax: true,
        },
      },
      {
        name: 'an ESM project with moduleResolution node16',
        packageJson: { type: 'module' },
        compilerOptions: {
          module: ts.ModuleKind.Node16,
          moduleResolution: ts.ModuleResolutionKind.Node16,
        },
      },
      {
        name: 'a CommonJS project with moduleResolution nodenext',
        packageJson: {},
        compilerOptions: {
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
        },
      },
      {
        name: 'a CommonJS project with moduleResolution node10',
        packageJson: {},
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          moduleResolution: ts.ModuleResolutionKind.Node10,
          esModuleInterop: true,
        },
      },
      {
        name: 'a project with moduleResolution bundler',
        packageJson: { type: 'module' },
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
        },
      },
    ]

  it.each(consumerConfigs)('type-checks from $name', { timeout: 30_000 }, ({ packageJson, compilerOptions }) => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'scalar-openapi-types-'))

    try {
      // Make the package resolvable as `@scalar/openapi-types` from the consumer project
      mkdirSync(join(temporaryDirectory, 'node_modules', '@scalar'), { recursive: true })
      symlinkSync(packageRoot, join(temporaryDirectory, 'node_modules', '@scalar', 'openapi-types'), 'dir')

      writeFileSync(join(temporaryDirectory, 'package.json'), JSON.stringify({ name: 'consumer', ...packageJson }))

      const entryFile = join(temporaryDirectory, 'index.ts')
      writeFileSync(
        entryFile,
        [
          "import type { Document as Document20 } from '@scalar/openapi-types/2.0'",
          "import type { Document as Document30 } from '@scalar/openapi-types/3.0'",
          "import type { Document as Document31 } from '@scalar/openapi-types/3.1'",
          "import type { Document as Document32 } from '@scalar/openapi-types/3.2'",
          '',
          'export type Documents = [Document20, Document30, Document31, Document32]',
          '',
        ].join('\n'),
      )

      const program = ts.createProgram([entryFile], {
        ...compilerOptions,
        noEmit: true,
        strict: true,
        skipLibCheck: false,
      })

      expect(formatDiagnostics(program)).toStrictEqual([])
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true })
    }
  })
})
