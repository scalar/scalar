import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { versionBundledIntegrations } from './version-bundled-integrations'

describe('version-bundled-integrations', () => {
  let root: string

  const writePackage = async (directory: string, version: string, bundled = true): Promise<void> => {
    await mkdir(join(root, directory), { recursive: true })
    await writeFile(
      join(root, directory, 'package.json'),
      JSON.stringify({
        version,
        dependencies: { '@scalar/api-reference': 'workspace:*' },
        scripts: bundled
          ? { 'copy:standalone': 'shx cp ../../packages/api-reference/dist/browser/standalone.js ./scalar.js' }
          : {},
      }),
    )
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'scalar-bundle-changelog-'))
    await writePackage('packages/api-reference', '1.62.9', false)
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('records only the frontend version for released bundling integrations', async () => {
    const bundled = [
      'integrations/dotnet/aspnetcore',
      'integrations/dotnet/aspire',
      'integrations/dotnet/azure-functions',
      'integrations/dotnet/aws-lambda',
      'integrations/java',
      'integrations/docker',
      'integrations/rust',
    ]
    const otherPackages = ['integrations/nuxt', 'packages/api-client']
    const original = '# Package\n\n## 2.0.1\n\n### Patch Changes\n\n- Own fix\n\n## 2.0.0\n\n- Old fix\n'
    for (const directory of [...bundled, ...otherPackages]) {
      await writePackage(directory, '2.0.0', bundled.includes(directory))
      await writeFile(join(root, directory, 'CHANGELOG.md'), original)
    }

    await versionBundledIntegrations(root, async () => {
      await writePackage('packages/api-reference', '1.63.0', false)
      for (const directory of [...bundled, ...otherPackages]) {
        await writePackage(directory, '2.0.1', bundled.includes(directory))
      }
    })

    for (const directory of bundled) {
      expect(await readFile(join(root, directory, 'CHANGELOG.md'), 'utf8')).toBe(
        '# Package\n\n## 2.0.1\n\n### Bundled API Reference\n\n- @scalar/api-reference@1.63.0\n\n### Patch Changes\n\n- Own fix\n\n## 2.0.0\n\n- Old fix\n',
      )
    }
    for (const directory of otherPackages) {
      expect(await readFile(join(root, directory, 'CHANGELOG.md'), 'utf8')).toBe(original)
    }
  })

  it('leaves unreleased integrations unchanged when the frontend version changes', async () => {
    await writePackage('integrations/java', '1.0.0')
    const path = join(root, 'integrations/java/CHANGELOG.md')
    await writeFile(path, '# Java\n\n## 1.0.0\n')

    await versionBundledIntegrations(root, async () => {
      await writePackage('packages/api-reference', '1.63.0', false)
    })

    expect(await readFile(path, 'utf8')).toBe('# Java\n\n## 1.0.0\n')
  })

  it('records the current bundle for integration-only releases', async () => {
    await writePackage('integrations/java', '1.0.0')
    const path = join(root, 'integrations/java/CHANGELOG.md')

    await versionBundledIntegrations(root, async () => {
      await writePackage('integrations/java', '1.0.1')
      await writeFile(path, '# Java\n\n## 1.0.1\n')
    })

    expect(await readFile(path, 'utf8')).toBe(
      '# Java\n\n## 1.0.1\n\n### Bundled API Reference\n\n- @scalar/api-reference@1.62.9\n',
    )
  })

  it('fails when versioning does not generate the expected changelog heading', async () => {
    await writePackage('integrations/java', '1.0.0')
    await writeFile(join(root, 'integrations/java/CHANGELOG.md'), '# Java\n\n## 1.0.0\n')

    await expect(
      versionBundledIntegrations(root, async () => {
        await writePackage('integrations/java', '1.0.1')
      }),
    ).rejects.toThrow('Missing release heading 1.0.1')
  })
})
