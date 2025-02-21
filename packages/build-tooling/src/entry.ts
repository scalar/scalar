/**
 * Vite helpers to generate multiple exports for a node package
 * With TS imports we want to be able to create an entry point for each index.ts file in
 * project and update the exports field of the package.json as needed
 *
 */
import fs from 'node:fs/promises'

import { glob } from 'glob'

const cssExports = {
  /** Adds provisions for a css folder in the built output */
  './css/*.css': {
    import: './dist/css/*.css',
    require: './dist/css/*.css',
    default: './dist/css/*.css',
  },
  /** Optional root folder css files */
  './*.css': {
    import: './dist/*.css',
    require: './dist/*.css',
    default: './dist/*.css',
  },
}

/** Search for ALL index.ts files in the repo and export them as nested exports */
export async function findEntryPoints({ allowCss }: { allowCss?: boolean } = {}) {
  const entries: string[] = []
  glob.sync('./src/**/index.ts').forEach((e) => entries.push(e))

  await addPackageFileExports({ allowCss, entries })
  return entries
}

type PackageExports = Record<
  string,
  {
    /**  ECMAScript module loader */
    import: string
    /** Typescript types */
    types: string
    /** Default export */
    default: string
  }
>

/**
 * For a series of imports we add package.json exports to enable nested typescript definitions
 * and path nested imports
 *
 * ex. import { foo } from '@scalar/some-package/foo-domain'
 */
export async function addPackageFileExports({
  allowCss,
  entries,
}: {
  allowCss?: boolean
  entries: string | string[]
}) {
  /** package.json type exports need to be updated */
  const packageExports: PackageExports = {}

  const paths = Array.isArray(entries) ? entries : [entries]

  paths.forEach((entry) => {
    // Get the nested path that will be transpiled to dist with preserved modules
    const segments = entry.split('/').filter((s) => !['.', 'src'].includes(s))

    /** Nested folder the entry files lives in for a path scoped export */
    const namespace = segments.slice(0, -1)
    /** Filename without the extension */
    const filename = segments.at(-1)?.split('.')[0] ?? ''
    /** Output filepath relative to ./dist and not ./src */
    const filepath = [...namespace, filename].join('/')

    if (filepath.includes('playground')) {
      console.info('INFO: will not add ./playground file exports to package.json')
      return
    }

    packageExports[namespace.length ? `./${namespace.join('/')}` : '.'] = {
      import: `./dist/${filepath}.js`,
      types: `./dist/${filepath}.d.ts`,
      default: `./dist/${filepath}.js`,
    }
  })

  // Update the package file with the new exports
  const packageFile = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
  packageFile.exports = {
    ...packageExports,
    ...(allowCss ? cssExports : {}),
  }

  // Green text
  console.log('\x1b[32m%s\x1b[0m', 'Updating package.json exports field…')

  await fs.writeFile('./package.json', `${JSON.stringify(packageFile, null, 2)}\n`)
}
