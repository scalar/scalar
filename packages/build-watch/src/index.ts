// ---------------------------------------------------------------------------
// HELPERS
import { spawn } from 'child_process'
import chokidar from 'chokidar'

import { findDependents, getPackageData } from './dependents'
import { prefixStream, printColor, printHeader } from './print'

/** State to track active package builds */
const commands: Partial<
  Record<
    string,
    {
      result?: Promise<boolean>
      controller?: AbortController
    } | null
  >
> = {}

/**
 * Run a build command for a given package
 *
 * Active builds will be tracked and cancelled before starting a new build
 *
 */
async function runBuild(packageName: string, controller: AbortController) {
  const active = commands[packageName]
  if (active) {
    printColor('brightWhite', `[WARN]: ${packageName} is active. Cancelling...`)
    if (!active.controller?.signal.aborted) active.controller?.abort()
    await active.result
    printColor(
      'brightWhite',
      `[WARN]: ${packageName} cancelled. ${commands[packageName]}`,
    )
  }

  printHeader('brightWhite', `Building ${packageName}`)

  // const controller = new AbortController()

  const result = new Promise<boolean>((resolve, reject) => {
    const command = spawn('pnpm', ['--filter', packageName, 'build'], {
      signal: controller.signal,
      detached: true,
    })

    command.stdout?.on('data', prefixStream(packageName))
    command.stderr?.on('data', prefixStream(packageName))

    command.on('error', (e) => {
      console.log(e.message)
    })

    // On close we remove reference to the process and controller
    command.on('close', () => {
      command.removeAllListeners()
      command.stdout.removeAllListeners()
      command.stderr.removeAllListeners()

      commands[packageName] = null

      resolve(true)
    })
  })
    .then(() => {
      if (controller.signal.aborted) {
        printHeader('yellow', `Package ${packageName} build aborted`)
      } else {
        printHeader('green', `Package ${packageName} build completed`)
      }
      return true
    })
    .catch((e) => {
      console.error(e.message)
      printHeader('red', `Error: Process Exited ${packageName}`)
      return false
    })

  commands[packageName] = {
    result,
    controller,
  }
  return result
}

/** Build a specific package and all of its dependents */
async function buildPackage(
  name: string,
  dependencyWaterfall: string[][],
  packageDependencies: Record<string, string[]>,
) {
  const dependencies = findDependents(
    name,
    dependencyWaterfall,
    packageDependencies,
  )

  // Share the abort controller so we can kill all related processes on restart
  const controller = new AbortController()

  // Cancel all builds of dependencies
  await Promise.all(
    dependencies.map(async (dep) => {
      if (commands[dep]) {
        commands[dep]?.controller?.abort()
        await commands[dep]?.result
      }
    }),
  )
  printHeader('brightMagenta', 'All builds cancelled')

  // List of all packages that have been built in the process
  const hasBuilt: Set<string> = new Set([name])

  /** We need to build the package on its given layer and
   * then any packages that depend on it
   */
  async function buildLayer(layerIdx: number): Promise<void> {
    const layer = dependencyWaterfall[layerIdx]

    // Exit when all layers have been built
    if (!layer) return

    // We look through any packages that have been built and build any
    // packages in the layer that depend on them
    const packagesWithChangedDependencies = layer.filter((pName) =>
      packageDependencies[pName].some((d) => hasBuilt.has(d)),
    )

    return Promise.all(
      packagesWithChangedDependencies.map((p) => runBuild(p, controller)),
    ).then(() => {
      // If the original command has terminated then skip
      if (commands[name]?.controller?.signal.aborted) {
        printHeader('yellow', `[WARN]: ${name} was aborted. Skipping layer`)
        return
      }

      // Break early if we don't have another layer
      if (!dependencyWaterfall[layerIdx + 1]) return

      // Update the hadBuilt list with new entries
      packagesWithChangedDependencies.forEach((p) => hasBuilt.add(p))

      // Build the next layer recursively
      return buildLayer(layerIdx + 1)
    })
  }

  // Find the layer the current package is in. We only need to build above this
  const layerIdx = dependencyWaterfall.findIndex((layer) =>
    layer.includes(name),
  )

  return runBuild(name, controller).then(() => buildLayer(layerIdx + 1))
}

/** Build all layers above a provided one in the workspace dependency graph */
async function buildWorkspaceLayer(layerIdx: number) {
  const layer = dependencyWaterfall[layerIdx]
  if (!layer) return

  // Build each layer sequentially
  return Promise.all(layer.map((p) => runBuild(p, new AbortController()))).then(
    () => {
      buildWorkspaceLayer(layerIdx + 1)
    },
  )
}

// ---------------------------------------------------------------------------

/**
 * Get a list of all packages in an ordered list by layer
 * If a package depends on another package then that the dependency is
 * guaranteed to be at a lower (lesser idx) layer than the package
 */
const { dependencyWaterfall, packageDependencies, packageNames } =
  await getPackageData(process.argv[2])
printColor('green', dependencyWaterfall)

// On module call build all packages
await buildWorkspaceLayer(0)

// ---------------------------------------------------------------------------
// Watch for any src and config file changes to trigger builds

// Build all packages on script start

const watcher = chokidar.watch([
  'packages/*/src/**',
  'packages/*/vite.config.ts',
  'packages/*/rollup.config.ts',
  'packages/*/tsconfig.json',
  'packages/*/tsconfig.build.json',
])

watcher.on('change', async (path) => {
  if (path.includes('src/components/ScalarIcon/icons/icons.ts')) return

  printHeader('cyan', `File Change Detected: ${path}`)
  const segments = path.split('/')
  const dir = segments[1] // Package dir. Ex. /api-reference
  const name = packageNames[dir] // Name of package. Ex. @scalar/api-reference

  printHeader('magenta', 'RESTARTING BUILDS')

  // Rerun the build for the changed package
  buildPackage(name, dependencyWaterfall, packageDependencies).then(() => {
    printHeader('brightYellow', 'REBUILD COMPLETE')
  })
})

// Handle cleanup before exit
process.on('SIGINT', async () => {
  printHeader('brightRed', 'Exited by User')

  watcher.removeAllListeners()
  watcher.close()

  for await (const command of Object.values(commands)) {
    command?.controller?.abort()
    await command?.result
  }

  process.exit()
})

export {}
