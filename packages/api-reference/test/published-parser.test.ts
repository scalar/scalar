// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import packageJson from '../package.json' with { type: 'json' }

describe('published-parser', () => {
  it('includes the pbkit license in npm and in the browser assets that contain the parser', async () => {
    const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()
    const notice = normalize(await readFile(resolve(import.meta.dirname, '../THIRD_PARTY_NOTICES'), 'utf8'))
    const browser = resolve(import.meta.dirname, '../dist/browser')
    const standalone = await readFile(join(browser, 'standalone.js'), 'utf8')
    expect(normalize(standalone)).toContain(notice)

    expect(packageJson.files).toContain('THIRD_PARTY_NOTICES')

    const directory = join(browser, 'chunks')
    const chunks = (await readdir(directory)).filter((file) => file.endsWith('.js.map'))
    const esmMaps = [join(browser, 'standalone.esm.js.map'), ...chunks.map((file) => join(directory, file))]
    const parserFiles = await Promise.all(
      esmMaps.map(async (file) => {
        const sourceMap: { sources: string[] } = JSON.parse(await readFile(file, 'utf8'))
        return sourceMap.sources.some((source) => source.includes('/node_modules/pbkit/')) ? file.slice(0, -4) : null
      }),
    )
    const bundledParserFiles = parserFiles.filter((file) => file !== null)
    expect(bundledParserFiles.length).toBeGreaterThan(0)
    for (const file of bundledParserFiles) {
      expect(normalize(await readFile(file, 'utf8')), file).toContain(notice)
    }
  })

  it('ships the parser for consumers without the pbkit package installed', async () => {
    // CI builds the package before tests. Copy its output outside the workspace so
    // Node cannot accidentally resolve pbkit from this workspace.
    const consumer = await mkdtemp(join(tmpdir(), 'scalar-parser-consumer-'))
    try {
      await cp(resolve(import.meta.dirname, '../dist'), join(consumer, 'dist'), {
        recursive: true,
        // npm never includes nested node_modules directories in published packages.
        filter: (source) => !source.split(sep).includes('node_modules'),
      })
      // The reader also uses the package's normal workspace-store runtime dependency.
      // Expose only that runtime dependency so the parser must resolve from the bundle.
      await mkdir(join(consumer, 'node_modules/@scalar'), { recursive: true })
      await symlink(
        resolve(import.meta.dirname, '../node_modules/@scalar/workspace-store'),
        join(consumer, 'node_modules/@scalar/workspace-store'),
      )
      await writeFile(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }))
      const result = execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
        import assert from 'node:assert/strict';
        import { readProtobuf } from './dist/helpers/asyncapi-schema/protobuf/protobuf.js';
        assert.equal(readProtobuf('syntax="proto3"; message M { optional string id=1; }', '3').nodes[0].children[0].presence, 'explicit');
        assert.equal(readProtobuf('message M { string id=1; }', '3').nodes[0].children[0].name, 'id');
        assert.throws(() => readProtobuf('syntax="proto3"; enum E { ZERO=0 [(custom)=true]; }', '3'));
        assert.throws(() => readProtobuf('syntax="proto3"; message M {} message M {}', '3'));
        assert.equal(readProtobuf('syntax="proto3"; message M { string constructor=1; }', '3').nodes[0].children[0].name, 'constructor');
        assert.throws(() => readProtobuf('message M {} garbage', '3'));
        process.stdout.write('ok');
      `,
        ],
        { cwd: consumer, encoding: 'utf8' },
      )
      expect(result).toBe('ok')
    } finally {
      await rm(consumer, { recursive: true, force: true })
    }
  })
})
