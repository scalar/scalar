import fs from 'node:fs/promises'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addPackageFileExports } from '../src/helpers'

/**
 * !!! WARNING !!!
 *
 * Mock `readFile` and `writeFile` implementation only once per test.
 *
 * Since Vitest uses `node:fs/promises` for file operations
 * mocking them multiple times can prevent snapshot updates.
 *
 * If you need custom values for a mock inside a single test,
 * you have to reset it first
 */
describe('addPackageFileExports', () => {
  const consoleInfoMock = vi.spyOn(console, 'info')
  const readFileMock = vi.spyOn(fs, 'readFile')
  const writeFileMock = vi.spyOn(fs, 'writeFile')

  beforeEach(() => {
    readFileMock.mockResolvedValueOnce('{ "name": "test" }')
    writeFileMock.mockResolvedValueOnce(void 0)

    return () => {
      consoleInfoMock.mockClear()
      readFileMock.mockReset()
      writeFileMock.mockReset()
    }
  })

  it('should set export field to empty if no entry is provided', async () => {
    await addPackageFileExports({ entries: [] })

    expect(consoleInfoMock).toHaveBeenCalledWith('INFO: no entries specified. `exports` will be set to {}')
    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {}
      }
      "
    `)
  })

  it('should set reset `exports` field to empty if no entry is provided', async () => {
    readFileMock.mockReset()
    readFileMock.mockResolvedValueOnce('{ "name": "test", "exports": { ".": "./dist/index.js" } }')

    await addPackageFileExports({ entries: [] })

    expect(consoleInfoMock).toHaveBeenCalledWith('INFO: no entries specified. `exports` will be set to {}')
    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {}
      }
      "
    `)
  })

  it('should process "src/index" provided as string', async () => {
    await addPackageFileExports({ entries: './src/index.ts' })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js"
          }
        }
      }
      "
    `)
  })

  it('should process "src/index" provided as array', async () => {
    await addPackageFileExports({ entries: ['./src/index.ts'] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js"
          }
        }
      }
      "
    `)
  })

  it('should process multiple entry points', async () => {
    await addPackageFileExports({ entries: ['./src/index.ts', './src/array/index.ts'] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js"
          },
          "./array": {
            "import": "./dist/array/index.js",
            "types": "./dist/array/index.d.ts",
            "default": "./dist/array/index.js"
          }
        }
      }
      "
    `)
  })

  it('should process entry points with wildcard', async () => {
    await addPackageFileExports({ entries: ['./src/schemas/*.ts'] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          "./schemas/*": {
            "import": "./dist/schemas/*.js",
            "types": "./dist/schemas/*.d.ts",
            "default": "./dist/schemas/*.js"
          }
        }
      }
      "
    `)
  })

  it('should process entry points pointing to file different from index', async () => {
    await addPackageFileExports({ entries: ['./src/plugin/node.ts'] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          "./plugin/node": {
            "import": "./dist/plugin/node.js",
            "types": "./dist/plugin/node.d.ts",
            "default": "./dist/plugin/node.js"
          }
        }
      }
      "
    `)
  })

  it('should not include playground files inside exports', async () => {
    await addPackageFileExports({ entries: ['./src/plugin/index.ts', './src/playground/index.ts'] })

    expect(consoleInfoMock).toHaveBeenCalledWith('INFO: will not add ./playground file exports to package.json')
    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {
          "./plugin": {
            "import": "./dist/plugin/index.js",
            "types": "./dist/plugin/index.d.ts",
            "default": "./dist/plugin/index.js"
          }
        }
      }
      "
    `)
  })
})
