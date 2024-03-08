/**
 * Bootstrap a new package
 *
 * Will initialize the standard project package.json, tsconfig, and vite config
 */
import fs from 'fs/promises'
import { createInterface } from 'node:readline/promises'

import pkg from './package.json'

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
})
const name = await readline.question(
  `Package name (do not add @scalar prefix): `,
)
const description = await readline.question(`Package description: `)
const keywords = await readline.question(`Package keywords (comma separated): `)
const useVue = (await readline.question(`Include Vue (y/n): `))
  .trim()
  .toLocaleLowerCase()
  .startsWith('y')

// Create the new package file with appropriate commands
const newPackageFile: Record<string, any> = {
  ...pkg,
  name: `@scalar/${name}`,
  description,
  keywords: keywords.split(',').map((k) => k.trim()),
  repository: {
    ...pkg.repository,
    directory: `packages/${name}`,
  },
}

if (!useVue) {
  delete newPackageFile.devDependencies.vue
  delete newPackageFile.peerDependencies.vue
  delete newPackageFile.devDependencies['@vitejs/plugin-vue']
  delete newPackageFile.devDependencies['vite-svg-loader']

  // Need to switch type checker
  newPackageFile.scripts['types:build'] = newPackageFile.scripts[
    'types:build'
  ].replaceAll('vue-tsc', 'tsc')
  newPackageFile.scripts['types:check'] = newPackageFile.scripts[
    'types:check'
  ].replaceAll('vue-tsc', 'tsc')
}
newPackageFile.peerDependencies = newPackageFile.peerDependencies || {}

const dirs = (await fs.readdir('./packages', { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

if (dirs.includes(name)) {
  console.error('This package name conflicts with an existing package.')
} else {
  const prefix = './scripts/bootstrap-package'
  const newDirName = `./packages/${name}`
  await fs.mkdir(newDirName)
  await fs.mkdir(`${newDirName}/src`)
  await fs.copyFile(
    `${prefix}/${useVue ? 'vue-vite-config.ts' : 'vite.config.ts'}`,
    `${newDirName}/vite.config.ts`,
  )
  await fs.copyFile(`${prefix}/tsconfig.json`, `${newDirName}/tsconfig.json`)
  await fs.copyFile(
    `${prefix}/tsconfig.build.json`,
    `${newDirName}/tsconfig.build.json`,
  )

  await fs.writeFile(
    `${newDirName}/package.json`,
    JSON.stringify(newPackageFile, null, 2),
  )

  await fs.writeFile(`${newDirName}/index.ts`, '')

  console.log(`\x1b[33m Package created! Checkout ./packages/${name} \x1b[0m`)
}

readline.close()
