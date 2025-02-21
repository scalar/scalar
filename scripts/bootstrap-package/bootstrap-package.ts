/**
 * Bootstrap a new package
 *
 * Will initialize the default package.json, tsconfig.json, and Vite configuration.
 */
import fs from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'

import pkg from './package.json'

// Creating an interface for reading input from the command line
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Prompting the user for package details
const name = await readline.question('Package name: @scalar/')
const description = await readline.question('Package description: ')
const keywords = await readline.question('Package keywords (comma separated): ')
const useVue = (await readline.question('Add Vue as a dependency (y/n): ')).trim().toLocaleLowerCase().startsWith('y')

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

// If Vue is not used, remove Vue-related dependencies and update scripts
if (!useVue) {
  delete newPackageFile.dependencies.vue
  delete newPackageFile.devDependencies.vue
  delete newPackageFile.devDependencies['@vitejs/plugin-vue']
  delete newPackageFile.devDependencies['vite-svg-loader']

  // Need to switch type checker from vue-tsc to tsc
  newPackageFile.scripts['types:build'] = newPackageFile.scripts['types:build'].replaceAll('vue-tsc', 'tsc')
  newPackageFile.scripts['types:check'] = newPackageFile.scripts['types:check'].replaceAll('vue-tsc', 'tsc')
}

// Ensure peerDependencies is defined
newPackageFile.peerDependencies = newPackageFile.peerDependencies || {}

// Read the existing directories in the packages folder
const dirs = (await fs.readdir('./packages', { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name)

// Check if the package name conflicts with an existing package
if (dirs.includes(name)) {
  console.error('This package name conflicts with an existing package.')
} else {
  // Define the prefix for the script files
  const prefix = './scripts/bootstrap-package'
  // Define the new directory name for the package
  const newDirName = `./packages/${name}`

  // Create the new package directory and subdirectories
  await fs.mkdir(newDirName)
  await fs.mkdir(`${newDirName}/src`)

  await fs.copyFile(`${prefix}/${useVue ? 'vue-vite-config.ts' : 'vite.config.ts'}`, `${newDirName}/vite.config.ts`)
  await fs.copyFile(`${prefix}/tsconfig.json`, `${newDirName}/tsconfig.json`)
  await fs.copyFile(`${prefix}/tsconfig.build.json`, `${newDirName}/tsconfig.build.json`)

  await fs.writeFile(`${newDirName}/package.json`, JSON.stringify(newPackageFile, null, 2))

  await fs.writeFile(`${newDirName}/src/index.ts`, '')

  console.log()
  console.log('\x1b[33mPackage created.\x1b[0m')
  console.log()
  console.log(`$ cd ./packages/${name}`)
  console.log()
}

readline.close()
