/**
 * Vite helpers to generate multiple exports for a node package
 * With TS imports we want to be able to create an entry point for each index.ts file in
 * project and update the exports field of the package.json as needed
 *
 */
import fs from 'fs/promises'
import { glob } from 'glob'

const cssExports = {
  /** Adds provisions for a css folder in the built output */
  './css/*.css': {
    import: './dist/css/*.css',
    require: './dist/css/*.css',
  },
  /** Optional root folder css files */
  './*.css': {
    import: './dist/*.css',
    require: './dist/*.css',
  },
}

/** Search for ALL index.ts files in the repo and export them as nested exports */
export async function findEntryPoints({
  allowCss,
}: { allowCss?: boolean } = {}) {
  const entries: Record<string, string> = {}

  /** package.json type exports need to be updated */
  const packageExports: Record<string, { import: string; types: string }> = {}

  glob.sync('./src/**/index.ts').forEach((entry) => {
    // Remove the leading './src' and the trailing './ts'to create the entrypoint name
    const name = entry.slice(4, -3)
    entries[name] = entry

    const exportName = `./${name.slice(0, -6)}`
    packageExports[exportName === './' ? '.' : exportName] = {
      import: `./dist/${name}.js`,
      types: `./dist/${name}.d.ts`,
    }
  })

  // Update the package file with the new exports
  const packageFile = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
  packageFile.exports = {
    ...packageExports,
    ...(allowCss ? cssExports : {}),
  }

  await fs.writeFile(
    './package.json',
    JSON.stringify(packageFile, null, 2) + '\n',
  )

  return entries
}
