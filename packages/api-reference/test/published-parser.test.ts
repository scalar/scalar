// @vitest-environment node

import { execFileSync, execSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('published-parser', () => {
  it('includes the pbkit license in the browser assets that contain the parser', async () => {
    const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim()
    const notice = normalize(await readFile(resolve(import.meta.dirname, '../THIRD_PARTY_NOTICES'), 'utf8'))
    const browser = resolve(import.meta.dirname, '../dist/browser')
    const standalone = await readFile(join(browser, 'standalone.js'), 'utf8')
    expect(normalize(standalone)).toContain(notice)

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

  it('publishes the pbkit notice and a reader that runs without pbkit installed', { timeout: 75_000 }, async () => {
    const packageRoot = resolve(import.meta.dirname, '..')
    const [pack]: [{ files: { path: string }[] }] = JSON.parse(
      execSync('npm pack --dry-run --ignore-scripts --offline --json', {
        cwd: packageRoot,
        encoding: 'utf8',
        timeout: 45_000,
      }),
    )
    const paths = pack.files.map(({ path }) => path)
    expect(paths).toContain('THIRD_PARTY_NOTICES')

    const consumer = await mkdtemp(join(tmpdir(), 'scalar-parser-consumer-'))
    try {
      // Recreate the Node distribution from npm's file list. Include supporting modules
      // so the smoke test fails if any dependency of the reader is excluded from npm.
      for (const path of paths) {
        if (!path.startsWith('dist/') || path.startsWith('dist/browser/') || path.endsWith('.map')) {
          continue
        }
        const target = join(consumer, path)
        await mkdir(dirname(target), { recursive: true })
        await copyFile(join(packageRoot, path), target)
      }
      const modifiedModules = ['misc.js', 'proto.js', 'recursive-descent-parser.js', 'textproto.js']
      for (const file of modifiedModules) {
        const source = await readFile(join(consumer, 'dist/vendor/pbkit/core/parser', file), 'utf8')
        expect(source, file).toContain('/*! Modified by Scalar')
      }
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
        { cwd: consumer, encoding: 'utf8', timeout: 15_000 },
      )
      expect(result).toBe('ok')
    } finally {
      await rm(consumer, { recursive: true, force: true })
    }
  })
})
