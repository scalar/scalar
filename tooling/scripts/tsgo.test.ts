import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import packageJson from './package.json' with { type: 'json' }

const compiler = fileURLToPath(new URL(packageJson.bin.tsgo, import.meta.url))
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('tsgo', () => {
  it('runs the installed native compiler', () => {
    const compilerPackage = createRequire(import.meta.url).resolve('typescript-native/package.json')
    const { version }: { version: string } = JSON.parse(readFileSync(compilerPackage, 'utf8'))
    const result = spawnSync(process.execPath, [compiler, '--version'], { encoding: 'utf8' })

    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe(`Version ${version}`)
    expect(result.stderr).toBe('')
  })

  it('resolves project paths from the caller and emits declarations', () => {
    const directory = mkdtempSync(join(tmpdir(), 'scalar-tsgo-'))
    directories.push(directory)
    writeFileSync(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          declaration: true,
          emitDeclarationOnly: true,
          outDir: 'dist',
          types: [],
        },
        files: ['index.ts'],
      }),
    )
    writeFileSync(join(directory, 'index.ts'), 'export const answer = 42\n')

    const result = spawnSync(process.execPath, [compiler, '--project', 'tsconfig.json'], {
      cwd: directory,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe('')
    expect(readFileSync(join(directory, 'dist/index.d.ts'), 'utf8')).toBe('export declare const answer = 42;\n')
  })

  it('preserves failing diagnostics and exit status', () => {
    const directory = mkdtempSync(join(tmpdir(), 'scalar-tsgo-'))
    directories.push(directory)
    writeFileSync(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          noEmit: true,
          types: [],
        },
        files: ['index.ts'],
      }),
    )
    writeFileSync(join(directory, 'index.ts'), 'export const answer: number = "wrong"\n')

    const result = spawnSync(process.execPath, [compiler, '--project', 'tsconfig.json', '--pretty', 'false'], {
      cwd: directory,
      encoding: 'utf8',
    })

    expect(result.status).toBe(1)
    expect(result.stdout.replaceAll('\r\n', '\n')).toBe(
      "index.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.\n",
    )
    expect(result.stderr).toBe('')
  })
})
