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
  const readFileMock = vi.spyOn(fs, 'readFile')
  const writeFileMock = vi.spyOn(fs, 'writeFile')
  const statMock = vi.spyOn(fs, 'stat')
  const consoleInfoMock = vi.spyOn(console, 'info')
  const processCwdMock = vi.spyOn(process, 'cwd')

  beforeEach(() => {
    readFileMock.mockResolvedValueOnce('{ "name": "test" }')
    writeFileMock.mockResolvedValueOnce(void 0)

    return () => {
      vi.resetAllMocks()
    }
  })

  it('should set `exports` to empty if no entries are provided', async () => {
    await addPackageFileExports({ entries: [] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {}
      }
      "
    `)
  })

  it('should throw if no package json is found within cwd', async () => {
    statMock.mockRejectedValue(Error('file not found'))

    await expect(() => addPackageFileExports({ entries: ['./src/index.ts'] })).rejects.toThrow(
      /package.json not found in/,
    )
  })

  it('should set `exports` field to `{}` when package had properties and no entries are provided', async () => {
    readFileMock.mockReset()
    readFileMock.mockResolvedValueOnce('{ "name": "test", "exports": { ".": "./dist/index.js" } }')

    await addPackageFileExports({ entries: [] })

    expect(writeFileMock.mock.lastCall?.at(1)).toMatchInlineSnapshot(`
      "{
        "name": "test",
        "exports": {}
      }
      "
    `)
  })

  it('should do nothing if cwd includes `dist`', async () => {
    processCwdMock.mockReturnValueOnce('something/dist')

    await addPackageFileExports({ entries: ['./src/index.ts'] })

    expect(readFileMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('should process "src/index"', async () => {
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

  it('should process entry points pointing to file with name different from index', async () => {
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
