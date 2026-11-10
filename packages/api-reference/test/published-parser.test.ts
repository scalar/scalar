// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('published-parser', () => {
  it('ships the corrected parser without requiring the workspace dependency patch', async () => {
    // CI builds the package before tests. Copy its output outside the workspace so
    // Node cannot accidentally resolve the locally patched dependency.
    const consumer = await mkdtemp(join(tmpdir(), 'scalar-parser-consumer-'))
    try {
      await cp(resolve(import.meta.dirname, '../dist'), join(consumer, 'dist'), {
        recursive: true,
        // npm never includes nested node_modules directories in published packages.
        filter: (source) => !source.split(sep).includes('node_modules'),
      })
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
