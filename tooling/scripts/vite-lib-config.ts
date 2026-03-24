import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Sanitizes a chunk name for use in output filenames.
 *
 * With preserveModules, Vue SFC files produce chunk names containing `.vue`
 * and query strings (e.g. `Foo.vue?vue&type=script&setup=true&lang.ts`).
 * These cause problems when downstream packages resolve the output files
 * and the Vue plugin tries to re-parse them as SFCs.
 *
 * Facade modules (no query string) are passed through unchanged.
 * Virtual modules (with query strings) keep `.vue` and get dot-separated
 * type, index, and lang suffixes to avoid collisions:
 * `Foo.vue?vue&type=style&index=1&lang.css` → `Foo.vue.style.1.css`.
 *
 * @see https://github.com/rolldown/rolldown/pull/8817
 */
const sanitizeChunkName = (name: string): string => {
  const queryIndex = name.indexOf('?')

  if (queryIndex === -1) {
    return name
  }

  const base = name.slice(0, queryIndex)
  const query = name.slice(queryIndex + 1)

  const typeMatch = query.match(/(?:^|&)type=([^&]+)/)
  const indexMatch = query.match(/(?:^|&)index=(\d+)/)
  const langMatch = query.match(/(?:^|&)lang\.([^&]+)/)

  const typeSuffix = typeMatch ? typeMatch[1] : 'virtual'
  const indexSuffix = indexMatch && indexMatch[1] !== '0' ? `.${indexMatch[1]}` : ''
  const langSuffix = langMatch ? `.${langMatch[1]}` : ''

  return `${base}.${typeSuffix}${indexSuffix}${langSuffix}`
}

/**
 * Creates rolldownOptions.output config for preserveModules builds.
 *
 * preserveModules emits individual .js files for each source module,
 * which is required for tsc-alias resolveFullPaths to add .js extensions
 * to relative imports in .d.ts files.
 */
export function createPreserveModulesOutput() {
  return {
    preserveModules: true,
    preserveModulesRoot: './src',
    entryFileNames: (chunk: { name: string }): string => {
      const sanitized = sanitizeChunkName(chunk.name)
      return `${sanitized}.js`
    },
  }
}

/**
 * Creates external regex patterns from package.json dependencies.
 * This ensures that all npm dependencies are externalized in the build.
 */
export function createExternalsFromPackageJson(packageJsonPath = './package.json') {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const deps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]
  return deps.map((name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`))
}

/**
 * Converts entry point paths to a named entry object for Vite lib mode.
 * This preserves the directory structure in the output without using preserveModules.
 *
 * @param entryPaths - Array of entry paths like ['./src/index.ts', './src/components/index.ts']
 * @param dirname - The directory name (use import.meta.dirname)
 * @returns Named entry object like { 'index': '/abs/path/to/src/index.ts', 'components/index': '/abs/path/to/src/components/index.ts' }
 */
export function createLibEntry(entryPaths: string[], dirname: string) {
  const entry: Record<string, string> = {}
  for (const p of entryPaths) {
    const key = p.replace('./src/', '').replace(/\.ts$/, '')
    entry[key] = resolve(dirname, p)
  }
  return entry
}

/**
 * Finds entry points from package.json exports field.
 * Supports both simple string exports and conditional exports.
 *
 * @returns Array of entry point paths like ['./src/index.ts', './src/components/index.ts']
 */
export function findEntryPoints() {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
  const entryPoints: string[] = []

  if (!pkg.exports) {
    // Fallback to src/index.ts if no exports
    return ['./src/index.ts']
  }

  const processExport = (exportValue: any) => {
    if (typeof exportValue === 'string') {
      // Skip CSS, CJS, and type definition exports (only use ESM source entry)
      if (
        exportValue.includes('*.css') ||
        exportValue.endsWith('.d.ts') ||
        exportValue.endsWith('.css') ||
        exportValue.endsWith('.cjs')
      ) {
        return
      }
      // Simple string export
      const sourcePath = exportValue.replace('./dist/', './src/').replace(/\.js$/, '.ts')
      if (!entryPoints.includes(sourcePath)) {
        entryPoints.push(sourcePath)
      }
    } else if (typeof exportValue === 'object' && exportValue !== null) {
      // Conditional exports
      if (exportValue.import) {
        const importPath = exportValue.import
        // Skip CSS, CJS, and type definition exports (only use ESM source entry)
        if (
          importPath.includes('*.css') ||
          importPath.endsWith('.d.ts') ||
          importPath.endsWith('.css') ||
          importPath.endsWith('.cjs')
        ) {
          return
        }
        const sourcePath = importPath.replace('./dist/', './src/').replace(/\.js$/, '.ts')
        if (!entryPoints.includes(sourcePath)) {
          entryPoints.push(sourcePath)
        }
      }
      // Handle nested exports
      for (const value of Object.values(exportValue)) {
        if (typeof value === 'string' && value.startsWith('./dist/')) {
          // Skip CSS, CJS, and type definition exports (only use ESM source entry)
          if (value.includes('*.css') || value.endsWith('.d.ts') || value.endsWith('.css') || value.endsWith('.cjs')) {
            continue
          }
          const sourcePath = value.replace('./dist/', './src/').replace(/\.js$/, '.ts')
          if (!entryPoints.includes(sourcePath)) {
            entryPoints.push(sourcePath)
          }
        }
      }
    }
  }

  if (typeof pkg.exports === 'string') {
    processExport(pkg.exports)
  } else if (typeof pkg.exports === 'object') {
    for (const exportValue of Object.values(pkg.exports)) {
      processExport(exportValue)
    }
  }

  return entryPoints
}
