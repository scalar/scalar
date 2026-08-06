import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/** The published declaration files live next to the bundled JavaScript in `dist`. */
const distDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

/** Turns TypeScript diagnostics into readable strings, so failures point at the exact file and line. */
const formatDiagnostics = (diagnostics: readonly ts.Diagnostic[]): string[] =>
  diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)

      return `${path.relative(distDirectory, diagnostic.file.fileName)}:${line + 1} ${message}`
    }

    return message
  })

/** Every emitted declaration file under `dist`, so we check the whole published type surface. */
const collectDeclarationFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry)

    if (statSync(entryPath).isDirectory()) {
      return collectDeclarationFiles(entryPath)
    }

    return entryPath.endsWith('.d.ts') ? [entryPath] : []
  })

describe('dts-resolution', () => {
  /**
   * Consumers on `moduleResolution: node16`/`nodenext` require relative import paths inside ESM
   * declaration files to carry explicit file extensions. Without them TypeScript fails to resolve
   * the modules (TS2834) and the plugin's types silently degrade to `any`. `skipLibCheck: false` is
   * what surfaces the diagnostic, so we type-check the built declarations with it turned on.
   *
   * This regression guard runs against the real build output, so it stays correct no matter how the
   * declarations are produced (the bug in #9795 came from a build change, not the source).
   *
   * @see https://github.com/scalar/scalar/issues/9795
   */
  // Creating a TypeScript program can take a while on slower CI runners, so we allow more time than the default 5 seconds.
  it('resolves the built declaration files with moduleResolution nodenext', { timeout: 30_000 }, () => {
    // The declarations are a build artifact, so give a clear hint when the package has not been built.
    expect(
      existsSync(distDirectory),
      'Build @scalar/fastify-api-reference before running this test (pnpm --filter @scalar/fastify-api-reference build).',
    ).toBe(true)

    const declarationFiles = collectDeclarationFiles(distDirectory)

    // Make sure we are actually testing something.
    expect(declarationFiles.length).toBeGreaterThan(0)

    const program = ts.createProgram(declarationFiles, {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      strict: true,
      skipLibCheck: false,
    })

    // Only assert on our own declarations. `skipLibCheck: false` also type-checks third-party
    // declarations pulled in through imports, and their diagnostics are out of scope here.
    const ownDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter((diagnostic) => diagnostic.file && !diagnostic.file.fileName.includes('node_modules'))

    expect(formatDiagnostics(ownDiagnostics)).toStrictEqual([])
  })
})
