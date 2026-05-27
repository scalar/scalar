import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

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
})
