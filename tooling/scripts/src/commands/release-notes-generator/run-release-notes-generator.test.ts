import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getVersionedPathsForChangelog } from './detect-versioned-changelog-paths'
import * as generateReleaseNoteModule from './generate-release-note'
import { RELEASE_NOTES_PRODUCTS } from './products'
import { runReleaseNotesGeneratorForProduct } from './run-release-notes-generator'

const testProduct = {
  slug: 'test-product',
  packageName: 'test-product',
  displayName: 'Test Product',
  description: 'a test product',
  changelogPath: 'CHANGELOG.md',
  outputPath: 'RELEASE_NOTES.json',
}

describe('runReleaseNotesGeneratorForProduct', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('soft-skips when the release version cannot be resolved', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return
    })

    const dir = await mkdtemp(join(tmpdir(), 'release-notes-generator-'))
    const changelogPath = join(dir, 'CHANGELOG.md')
    const outputPath = join(dir, 'RELEASE_NOTES.json')
    await writeFile(changelogPath, '## 1.0.0\n\n- initial\n')

    const result = await runReleaseNotesGeneratorForProduct({
      product: { ...testProduct, changelogPath, outputPath },
      apiKey: 'test-key',
    })

    expect(result).toEqual({ generated: false, outputPath })
    expect(exitSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not determine the release version for test-product'),
    )
  })

  it('soft-skips when no changelog section exists for the resolved version', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return
    })

    const dir = await mkdtemp(join(tmpdir(), 'release-notes-generator-'))
    const changelogPath = join(dir, 'CHANGELOG.md')
    const outputPath = join(dir, 'RELEASE_NOTES.json')
    await writeFile(changelogPath, '## 1.0.0\n\n- initial\n')
    await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'test-product', version: '2.0.0' }))

    const result = await runReleaseNotesGeneratorForProduct({
      product: { ...testProduct, changelogPath, outputPath },
      apiKey: 'test-key',
    })

    expect(result).toEqual({ generated: false, outputPath })
    expect(exitSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No changelog section found for version 2.0.0'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no dependency changelog sections were found'))
  })

  it('skips when changedPaths is set and the product was not versioned', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      return
    })

    const dir = await mkdtemp(join(tmpdir(), 'release-notes-generator-'))
    const changelogPath = join(dir, 'CHANGELOG.md')
    const outputPath = join(dir, 'RELEASE_NOTES.json')

    const result = await runReleaseNotesGeneratorForProduct({
      product: { ...testProduct, changelogPath, outputPath },
      apiKey: 'test-key',
      changedPaths: new Set(),
    })

    expect(result).toEqual({ generated: false, outputPath })
    expect(warnSpy).toHaveBeenCalledWith('Skipping test-product: no version bump in this release.')
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Generating release note'))
  })

  it('runs when only a configured dependency was versioned', async () => {
    const scalarApp = RELEASE_NOTES_PRODUCTS.find((product) => product.slug === 'api-client')
    if (!scalarApp) {
      throw new Error('Expected api-client product in RELEASE_NOTES_PRODUCTS')
    }

    const dir = await mkdtemp(join(tmpdir(), 'release-notes-generator-'))
    const appDir = join(dir, 'scalar-app')
    const clientDir = join(dir, 'api-client')
    const appChangelog = join(appDir, 'CHANGELOG.md')
    const clientChangelog = join(clientDir, 'CHANGELOG.md')
    const outputPath = join(appDir, 'RELEASE_NOTES.json')

    await mkdir(appDir, { recursive: true })
    await mkdir(clientDir, { recursive: true })
    await writeFile(appChangelog, '## 1.0.0\n\n- parent entry\n')
    await writeFile(join(appDir, 'package.json'), JSON.stringify({ name: 'scalar-app', version: '2.0.0' }))
    await writeFile(clientChangelog, '## 3.6.1\n\n- dependency entry\n')
    await writeFile(join(clientDir, 'package.json'), JSON.stringify({ name: '@scalar/api-client', version: '3.6.1' }))

    const generateSpy = vi.spyOn(generateReleaseNoteModule, 'generateReleaseNote').mockResolvedValue({
      version: '2.0.0',
      date: '2026-05-27',
      title: 'Bundled client updates',
      content: [],
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      return
    })
    vi.spyOn(console, 'log').mockImplementation(() => {
      return
    })

    const result = await runReleaseNotesGeneratorForProduct({
      product: {
        ...scalarApp,
        changelogPath: appChangelog,
        outputPath,
        dependencyChangelogPaths: [clientChangelog],
      },
      apiKey: 'test-key',
      changedPaths: new Set([getVersionedPathsForChangelog(clientChangelog)[0] as string]),
      dryRun: true,
    })

    expect(result.generated).toBe(true)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('continuing with dependency changelog context only'))
    expect(generateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        changelogSection: '',
        dependencyChangelogs: [
          expect.objectContaining({
            packageName: '@scalar/api-client',
            version: '3.6.1',
          }),
        ],
      }),
    )
  })
})
