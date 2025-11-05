import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

type BadgeType =
  | 'npm-version'
  | 'npm-downloads'
  | 'npm-license'
  | 'nuget-version'
  | 'nuget-downloads'
  | 'pypi-version'
  | 'pypi-downloads'
  | 'pypi-license'
  | 'docker-pulls'
  | 'crate-version'
  | 'crate-downloads'
  | 'crate-license'

interface BadgeConfig {
  type: BadgeType
  package?: string
}

interface ExtraContent {
  headline?: string
  content: string
}

interface ReadmeMetadata {
  title: string
  badges: BadgeConfig[]
  documentation: string
  extraContent?: ExtraContent
}

interface PackageJson {
  name: string
  description?: string
  repository?: {
    directory?: string
  }
  readme?: ReadmeMetadata
}

export const generateReadme = new Command('generate-readme')
  .description('Generate README.md files for packages with readme metadata')
  .action(async () => {
    await generateReadmeFiles()
  })

async function generateReadmeFiles() {
  const root = getWorkspaceRoot()
  const integrationsDir = path.join(root, 'integrations')
  const packagesDir = path.join(root, 'packages')

  console.log(as.cyan('Scanning for packages with readme metadata...\n'))

  // Find all package.json files in integrations and packages directories
  const packageJsonPaths: string[] = []

  // Find in integrations directory
  try {
    await fs.access(integrationsDir)
    const integrationPackages = await findPackageJsonFiles(integrationsDir)
    packageJsonPaths.push(...integrationPackages)
  } catch {
    // Directory doesn't exist, skip
  }

  // Find in packages directory
  try {
    await fs.access(packagesDir)
    const packagePackages = await findPackageJsonFiles(packagesDir)
    packageJsonPaths.push(...packagePackages)
  } catch {
    // Directory doesn't exist, skip
  }

  // Filter to only packages with readme metadata
  const packagesWithReadme: Array<{ directory: string; packageJson: PackageJson }> = []

  for (const packageJsonPath of packageJsonPaths) {
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson: PackageJson = JSON.parse(packageJsonContent)

      if (packageJson.readme) {
        const directory = path.dirname(packageJsonPath)
        packagesWithReadme.push({ directory, packageJson })
      }
    } catch (error) {
      // Skip packages that can't be read or parsed
      console.warn(
        as.yellow(`⚠ Skipping ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`),
      )
    }
  }

  if (packagesWithReadme.length === 0) {
    console.log(as.yellow('No packages with readme metadata found.'))
    return
  }

  console.log(as.cyan(`Found ${packagesWithReadme.length} package(s) with readme metadata\n`))

  // Process each package
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ directory: string; error: string }> = []

  for (const { directory, packageJson } of packagesWithReadme) {
    try {
      await generateReadmeForPackage(root, directory, packageJson)
      successCount++
    } catch (error) {
      errorCount++
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push({ directory, error: errorMessage })
      console.error(as.red(`✗ Failed to generate README for ${directory}: ${errorMessage}`))
    }
  }

  // Print summary
  console.log('\n' + as.cyan('='.repeat(50)))
  console.log(as.cyan('Summary:'))
  console.log(as.green(`  ✓ Successfully generated: ${successCount}`))
  if (errorCount > 0) {
    console.log(as.red(`  ✗ Errors: ${errorCount}`))
  }
  console.log(as.cyan('='.repeat(50)))

  if (errorCount > 0) {
    process.exit(1)
  }
}

async function generateReadmeForPackage(root: string, directory: string, packageJson: PackageJson): Promise<void> {
  if (!packageJson.readme) {
    throw new Error('No readme metadata found')
  }

  const metadata = packageJson.readme
  const readmePath = path.join(directory, 'README.md')
  const changelogPath = path.join(directory, 'CHANGELOG.md')

  // Generate badges
  const badges: string[] = []
  for (const badge of metadata.badges) {
    badges.push(generateBadge(badge, packageJson.name))
  }
  // Always add Discord badge
  badges.push(
    '[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)',
  )

  // Generate title
  const title = metadata.title

  // Generate description
  const description = packageJson.description || ''

  // Generate documentation section
  const documentationSection = `## Documentation

[Read the documentation here](${metadata.documentation})`

  // Generate extra content if provided
  let extraContent = ''
  if (metadata.extraContent) {
    const { headline, content } = metadata.extraContent
    if (headline) {
      extraContent = `\n### ${headline}\n\n${content}\n`
    } else {
      extraContent = `\n${content}\n`
    }
  }

  // Generate changelog link
  let changelogSection = ''
  try {
    await fs.access(changelogPath)
    const changelogUrl = getChangelogUrl(root, directory)
    changelogSection = `\n## Changelog\n\nSee [CHANGELOG.md](${changelogUrl}) for a list of changes.\n`
  } catch {
    // Changelog doesn't exist, skip
  }

  // Generate community section
  const communitySection = `## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>`

  // Generate license section
  const licenseSection = `## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).`

  // Combine all sections
  let readmeContent = `<!-- This file is auto-generated. Do not edit manually. -->

# ${title}

${badges.join('\n')}

${description}

${documentationSection}
${extraContent}${changelogSection}
${communitySection}

${licenseSection}
`

  // Filter out image markdown (![...](...))
  readmeContent = readmeContent.replace(/^!\[.*?\]\(.*?\)$/gm, '').replace(/\n{3,}/g, '\n\n')

  // Write README.md
  await fs.writeFile(readmePath, readmeContent)
  const relativePath = path.relative(root, readmePath)
  console.log(as.green(`✔ Generated README.md: ${relativePath}`))
}

// ---------------------------------------------------------------------------

async function findPackageJsonFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  async function walk(currentDir: string): Promise<void> {
    let entries: Dirent[]
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true })
    } catch {
      // Skip directories we can't read
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      // Skip node_modules directories
      if (entry.isDirectory() && entry.name === 'node_modules') {
        continue
      }

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name === 'package.json') {
        results.push(fullPath)
      }
    }
  }

  await walk(dir)
  return results
}

function generateBadge(badge: BadgeConfig, packageName: string): string {
  const encodedPackageName = encodeURIComponent(packageName)

  switch (badge.type) {
    case 'npm-version':
      return `[![Version](https://img.shields.io/npm/v/${encodedPackageName})](https://www.npmjs.com/package/${encodedPackageName})`

    case 'npm-downloads':
      return `[![Downloads](https://img.shields.io/npm/dm/${encodedPackageName})](https://www.npmjs.com/package/${encodedPackageName})`

    case 'npm-license':
      return `[![License](https://img.shields.io/npm/l/${encodedPackageName})](https://www.npmjs.com/package/${encodedPackageName})`

    case 'nuget-version':
      if (!badge.package) {
        throw new Error('nuget-version badge requires package property')
      }
      return `[![Version](https://img.shields.io/nuget/v/${badge.package})](https://www.nuget.org/packages/${badge.package})`

    case 'nuget-downloads':
      if (!badge.package) {
        throw new Error('nuget-downloads badge requires package property')
      }
      return `[![Downloads](https://img.shields.io/nuget/dt/${badge.package})](https://www.nuget.org/packages/${badge.package})`

    case 'pypi-version':
      if (!badge.package) {
        throw new Error('pypi-version badge requires package property')
      }
      return `[![Version](https://img.shields.io/pypi/v/${badge.package})](https://pypi.org/project/${badge.package}/)`

    case 'pypi-downloads':
      if (!badge.package) {
        throw new Error('pypi-downloads badge requires package property')
      }
      return `[![Downloads](https://img.shields.io/pypi/dm/${badge.package})](https://pypi.org/project/${badge.package}/)`

    case 'pypi-license':
      if (!badge.package) {
        throw new Error('pypi-license badge requires package property')
      }
      return `[![License](https://img.shields.io/pypi/l/${badge.package})](https://pypi.org/project/${badge.package}/)`

    case 'docker-pulls':
      if (!badge.package) {
        throw new Error('docker-pulls badge requires package property')
      }
      return `[![Docker Pulls](https://img.shields.io/docker/pulls/${badge.package})](https://hub.docker.com/r/${badge.package})`

    case 'crate-version':
      if (!badge.package) {
        throw new Error('crate-version badge requires package property')
      }
      return `[![Version](https://img.shields.io/crates/v/${badge.package})](https://crates.io/crates/${badge.package})`

    case 'crate-downloads':
      if (!badge.package) {
        throw new Error('crate-downloads badge requires package property')
      }
      return `[![Downloads](https://img.shields.io/crates/d/${badge.package})](https://crates.io/crates/${badge.package})`

    case 'crate-license':
      if (!badge.package) {
        throw new Error('crate-license badge requires package property')
      }
      return `[![License](https://img.shields.io/crates/l/${badge.package})](https://crates.io/crates/${badge.package})`

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = badge.type
      throw new Error(`Unknown badge type: ${_exhaustive}`)
    }
  }
}

function getChangelogUrl(root: string, directory: string): string {
  const relativePath = path.relative(root, directory)
  const normalizedPath = relativePath.split(path.sep).join('/')
  // Handle case where directory is the root (empty relative path)
  const pathComponent = normalizedPath ? `${normalizedPath}/` : ''
  return `https://github.com/scalar/scalar/blob/main/${pathComponent}CHANGELOG.md`
}
