import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SOURCE_DIR = path.resolve(import.meta.dirname)

/** Matches the specifier of a relative `import … from './x'` or `export … from './x'`. */
const RELATIVE_SPECIFIER = /from\s+'(\.\.?\/[^']*)'/g

/** Every published source file (declarations are emitted for these). */
const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry)

    if (statSync(entryPath).isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    if (!entryPath.endsWith('.ts') || entryPath.endsWith('.test.ts')) {
      return []
    }

    return [entryPath]
  })

const sourceFiles = collectSourceFiles(SOURCE_DIR).map((file) => path.relative(SOURCE_DIR, file))

/**
 * `tsc` copies relative specifiers into the emitted `.d.ts` verbatim, so an extensionless
 * `./types` becomes an unresolvable import for consumers on `moduleResolution: node16`/`nodenext`
 * (TS2834) — the package is ESM, where extensions are mandatory.
 *
 * `tsc-alias --resolveFullPaths` used to paper over this, but it only appends `.js` when the
 * target file exists in `outDir`. Since the build bundles to a single `dist/index.js` and emits
 * declarations only, the per-module files are gone and the specifiers stay bare. Keeping the
 * extensions in source makes the emit correct regardless of the bundling strategy.
 *
 * @see https://github.com/scalar/scalar/issues/9795
 */
describe('relative module specifiers', () => {
  it.each(sourceFiles)('%s uses explicit file extensions', (sourceFile) => {
    const contents = readFileSync(path.join(SOURCE_DIR, sourceFile), 'utf8')

    const extensionless = Array.from(contents.matchAll(RELATIVE_SPECIFIER))
      .flatMap(([, specifier]) => (specifier ? [specifier] : []))
      .filter((specifier) => !path.extname(specifier))

    expect(extensionless).toEqual([])
  })
})
