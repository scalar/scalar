import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

export const pinVersions = new Command('pin-versions')

pinVersions
  .description('Pin all dependencies to exact versions (remove ^ and ~)')
  .option('--check', 'Check if any version ranges exist without modifying files')
  .action(async (options) => {
    const root = getWorkspaceRoot()
    const check = options.check ?? false

    const result = await pinAllVersions(root, check)

    if (result.totalChanges === 0) {
      console.log(as.green('✔ No version ranges found. All dependencies are already pinned!'))
    } else {
      if (check) {
        console.log(as.red(`✗ Found ${result.totalChanges} version ranges that need to be pinned`))
        console.log(as.yellow('\nRun `pnpm script pin-versions` to fix'))
        process.exit(1)
      } else {
        console.log(as.green(`✔ Successfully pinned ${result.totalChanges} dependencies`))
      }
    }
  })

// ---------------------------------------------------------------------------

type Change = {
  section?: string
  dep?: string
  key?: string
  oldValue: string
  newValue: string
}

type PinResult = {
  totalChanges: number
  changesByFile: Map<string, Change[]>
}

/**
 * Pin all dependencies to exact versions across the monorepo
 */
export async function pinAllVersions(root: string, checkOnly = false): Promise<PinResult> {
  const changesByFile = new Map<string, Change[]>()
  let totalChanges = 0

  // Find all package.json files
  const packageJsonFiles = await findPackageJsonFiles(root)

  // Process all package.json files
  for (const filePath of packageJsonFiles) {
    const changes = await processPackageJson(filePath, checkOnly)
    if (changes.length > 0) {
      changesByFile.set(filePath, changes)
      totalChanges += changes.length
    }
  }

  // Process pnpm-workspace.yaml if it exists
  const workspaceYamlPath = path.join(root, 'pnpm-workspace.yaml')
  try {
    await fs.access(workspaceYamlPath)
    const yamlChanges = await processWorkspaceYaml(workspaceYamlPath, checkOnly)
    if (yamlChanges.length > 0) {
      changesByFile.set(workspaceYamlPath, yamlChanges)
      totalChanges += yamlChanges.length
    }
  } catch (error) {
    // pnpm-workspace.yaml doesn't exist, skip it
  }

  return { totalChanges, changesByFile }
}

/**
 * Recursively find all package.json files
 */
async function findPackageJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  const skipDirs = new Set(['node_modules', 'dist', '.next', '.output', 'target', '.turbo', '.nuxt'])

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await findPackageJsonFiles(fullPath)))
    } else if (entry.name === 'package.json') {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Pin version by removing ^ and ~ prefixes
 */
export function pinVersion(version: string): string {
  if (typeof version !== 'string') return version

  // Skip workspace:*, catalog:*, npm:*, github:, git:, file:, link:, and exact versions
  if (
    version.startsWith('workspace:') ||
    version.startsWith('catalog:') ||
    version.startsWith('npm:') ||
    version.startsWith('github:') ||
    version.startsWith('git:') ||
    version.startsWith('file:') ||
    version.startsWith('link:') ||
    version.startsWith('http:') ||
    version.startsWith('https:') ||
    (!version.includes('^') && !version.includes('~'))
  ) {
    return version
  }

  // Remove ^ and ~ prefixes
  return version.replace(/^[\^~]/, '')
}

/**
 * Process a package.json file
 */
async function processPackageJson(filePath: string, checkOnly: boolean): Promise<Change[]> {
  const content = await fs.readFile(filePath, 'utf8')
  const pkg = JSON.parse(content)
  const changes: Change[] = []

  const sections = ['dependencies', 'devDependencies', 'optionalDependencies'] as const

  // Note: peerDependencies are intentionally excluded - they express compatibility ranges
  // for consumers and should not be pinned to exact versions
  sections.forEach((section) => {
    if (pkg[section]) {
      Object.keys(pkg[section]).forEach((dep) => {
        const oldValue = pkg[section][dep]
        const newValue = pinVersion(oldValue)

        if (oldValue !== newValue) {
          changes.push({ section, dep, oldValue, newValue })
          if (!checkOnly) {
            pkg[section][dep] = newValue
          }
        }
      })
    }
  })

  // Also check engines (but skip pnpm - we want to allow pnpm version ranges)
  if (pkg.engines) {
    Object.keys(pkg.engines).forEach((engine) => {
      // Skip pnpm engine version
      if (engine === 'pnpm') return

      const oldValue = pkg.engines[engine]
      const newValue = pinVersion(oldValue)

      if (oldValue !== newValue) {
        changes.push({ section: 'engines', dep: engine, oldValue, newValue })
        if (!checkOnly) {
          pkg.engines[engine] = newValue
        }
      }
    })
  }

  if (changes.length > 0 && !checkOnly) {
    const newContent = JSON.stringify(pkg, null, 2) + '\n'
    await fs.writeFile(filePath, newContent, 'utf8')
  }

  return changes
}

/**
 * Process pnpm-workspace.yaml file
 */
async function processWorkspaceYaml(filePath: string, checkOnly: boolean): Promise<Change[]> {
  const content = await fs.readFile(filePath, 'utf8')
  const lines = content.split('\n')
  const changes: Change[] = []
  let inCatalogs = false
  let inCatalogSection = false

  const newLines = lines.map((line) => {
    const trimmed = line.trim()

    // Check if we're entering the catalogs section
    if (trimmed === 'catalogs:') {
      inCatalogs = true
      return line
    }

    // Check if we're in the catalog section (under '*:')
    if (inCatalogs && (trimmed === "'*':" || trimmed === '"*":' || trimmed === '*:')) {
      inCatalogSection = true
      return line
    }

    // Exit catalogs section when we hit a new top-level key (no indentation)
    if (inCatalogs && line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      inCatalogs = false
      inCatalogSection = false
      return line
    }

    // Process catalog entries (must be in catalog section and have proper indentation)
    if (inCatalogSection && line.includes(':') && (line.startsWith('    ') || line.startsWith('\t\t'))) {
      // Match lines like:    '@package/name': ^1.0.0
      const match = line.match(/^(\s+)['"]?([@\w\/-]+)['"]?:(.+)$/)
      if (match) {
        const [, indent, key, value] = match
        const oldValue = value.trim()
        const newValue = pinVersion(oldValue)

        if (oldValue !== newValue) {
          changes.push({ key, oldValue, newValue })
          if (!checkOnly) {
            // Preserve original quote style
            const hasQuotes = line.includes(`'${key}'`) || line.includes(`"${key}"`)
            const quote = line.includes(`'${key}'`) ? "'" : '"'
            if (hasQuotes) {
              return `${indent}${quote}${key}${quote}: ${newValue}`
            } else {
              return `${indent}${key}: ${newValue}`
            }
          }
        }
      }
    }

    return line
  })

  if (changes.length > 0 && !checkOnly) {
    await fs.writeFile(filePath, newLines.join('\n'), 'utf8')
  }

  return changes
}
