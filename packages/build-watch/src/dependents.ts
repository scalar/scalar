import fs from 'fs'
import { glob } from 'glob'

// ---------------------------------------------------------------------------
// Get a map of all of the package names from the package.json files

/**
 * Get all package files from the workspace
 * For a given top level package (or fallback to complete workspace)
 * we find all package names from the folder and the dependency graph
 */
export async function getPackageData(topLevelPackageName?: string) {
  /** List of all package files in the workspace */
  const packageFilenames = await glob('packages/*/package.json', {
    ignore: 'node_modules/**',
  })

  /** Map of package folder names to package names for watcher paths */
  const packageNames: Record<string, string> = {}

  /** Package file objects */
  const packageFiles: Record<string, Record<string, any>> = {}

  /**
   * Save a list of each packages dependencies in the workspace
   * When we mark a package as stale we will need to rebuild each dependency
   */
  const packageDependencies: Record<string, string[]> = {}

  packageFilenames.forEach((path) => {
    const segments = path.split('/')
    const dir = segments[1] // Folder name
    const file = fs.readFileSync(path, 'utf-8')
    const pkg = JSON.parse(file)

    packageNames[dir] = pkg.name
    packageFiles[pkg.name] = pkg
  }, {})

  Object.values(packageFiles).forEach((pkg) => {
    const dependencies = [
      ...new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
      ]),
    ].filter((d) => d in packageFiles)

    packageDependencies[pkg.name] = dependencies
  })

  const dependencyWaterfall = getNestedDependencies(
    packageDependencies,
    topLevelPackageName,
  )

  return {
    packageDependencies,
    packageNames,
    dependencyWaterfall,
  }
}

function uniqueArray(arr: string[]) {
  return [...new Set(arr)]
}

/** Iterate through the package tree to find each layer of dependencies  */
function getNestedDependencies(
  packageDependencies: Record<string, string[]>,
  packageName?: string,
) {
  // Get layers of dependencies
  const result: string[][] = []

  function nested(name?: string, layer: number = 0) {
    const dependencies = name
      ? packageDependencies[name]
      : Object.keys(packageDependencies)

    if (dependencies.length) {
      result[layer] = uniqueArray([...(result[layer] ?? []), ...dependencies])
      dependencies.forEach((d) => nested(d, layer + 1))
    }
  }

  // Run nested finder
  nested(packageName)

  /**
   * We don't want to build packages at multiple layers. Use and accumulator to
   * remove packages from layers above its lowest level
   */
  const accumulator: Set<string> = new Set([])

  return result.reverse().map((layer) => {
    const remaining = layer.filter((p) => !accumulator.has(p))

    layer.forEach((p) => accumulator.add(p))
    return remaining
  })
}

/** When given a package return a list of all packages that will need to be rebuilt */
export function findDependents(
  name: string,
  dependencyWaterfall: string[][],
  packageDependencies: Record<string, string[]>,
) {
  const isDependent: Set<string> = new Set([name])

  let layerIdx =
    dependencyWaterfall.findIndex((layer) => layer.includes(name)) + 1
  while (layerIdx < dependencyWaterfall.length) {
    const layer = dependencyWaterfall[layerIdx]

    // Find each package that depends on a change and add it to the set
    layer
      .filter((pName) =>
        packageDependencies[pName].some((d) => isDependent.has(d)),
      )
      .forEach((p) => isDependent.add(p))

    layerIdx += 1
  }

  return [...isDependent]
}
