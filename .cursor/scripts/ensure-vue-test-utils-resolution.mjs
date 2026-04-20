import { existsSync } from 'node:fs'
import { lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..', '..')

const apiClientRequire = createRequire(join(repoRoot, 'packages', 'api-client', 'package.json'))
const workspaceRequire = createRequire(join(repoRoot, 'package.json'))
const modulesToEnsure = ['@vue/compiler-dom', '@vue/server-renderer']
const pnpmStoreRoot = join(repoRoot, 'node_modules', '.pnpm')

const getPnpmPackagePath = (packageName) => {
  const prefix = `${packageName.replace('/', '+')}@`
  const candidates = readdirSync(pnpmStoreRoot)
    .filter((entry) => entry.startsWith(prefix))
    .sort()

  if (!candidates.length) {
    return null
  }

  const [scope, name] = packageName.split('/')
  return join(pnpmStoreRoot, candidates[candidates.length - 1], 'node_modules', scope, name)
}

const ensureLocalAlias = (nodeModulesDir, packageName) => {
  const [scope, name] = packageName.split('/')
  const scopedDir = join(nodeModulesDir, scope)
  const aliasPath = join(scopedDir, name)
  const resolvedFromPnpm = getPnpmPackagePath(packageName)

  if (!resolvedFromPnpm || !existsSync(resolvedFromPnpm)) {
    throw new Error(`Could not locate ${packageName} in ${pnpmStoreRoot}`)
  }

  if (existsSync(aliasPath)) {
    const currentStats = lstatSync(aliasPath)

    if (!currentStats.isSymbolicLink()) {
      return aliasPath
    }

    const linkedPath = readlinkSync(aliasPath)
    const absoluteLinkedPath = resolve(scopedDir, linkedPath)

    if (absoluteLinkedPath === resolvedFromPnpm) {
      return aliasPath
    }
  }

  mkdirSync(scopedDir, { recursive: true })
  rmSync(aliasPath, { force: true, recursive: true })
  symlinkSync(resolvedFromPnpm, aliasPath, 'dir')
  return aliasPath
}

const testUtilsPackagePath = apiClientRequire.resolve('@vue/test-utils/package.json')
const testUtilsRequire = createRequire(testUtilsPackagePath)
const testUtilsNodeModulesDir = dirname(dirname(dirname(testUtilsPackagePath)))

const contexts = [
  {
    name: 'workspace',
    resolver: workspaceRequire,
    nodeModulesDir: join(repoRoot, 'node_modules'),
  },
  {
    name: 'api-client',
    resolver: apiClientRequire,
    nodeModulesDir: join(repoRoot, 'packages', 'api-client', 'node_modules'),
  },
  {
    name: '@vue/test-utils runtime',
    resolver: testUtilsRequire,
    nodeModulesDir: testUtilsNodeModulesDir,
  },
]

for (const context of contexts) {
  const missingModules = modulesToEnsure.filter((packageName) => {
    try {
      context.resolver.resolve(packageName)
      return false
    } catch {
      return true
    }
  })

  for (const packageName of missingModules) {
    const aliasPath = ensureLocalAlias(context.nodeModulesDir, packageName)
    console.log(`[vue-resolution] Linked ${packageName} for ${context.name} at ${aliasPath}`)
  }
}

for (const packageName of modulesToEnsure) {
  try {
    const resolvedPath = workspaceRequire.resolve(packageName)
    console.log(`[vue-resolution] Resolved ${packageName} from workspace -> ${resolvedPath}`)
  } catch {
    throw new Error(`Failed to resolve ${packageName} from workspace context`)
  }
}
