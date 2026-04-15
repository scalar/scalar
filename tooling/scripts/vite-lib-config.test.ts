import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createExternalsFromPackageJson,
  createLibEntry,
  createPreserveModulesOutput,
  findEntryPoints,
} from './vite-lib-config'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

const mockReadFileSync = readFileSync as Mock
const mockExistsSync = existsSync as Mock

beforeEach(() => {
  mockExistsSync.mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createPreserveModulesOutput', () => {
  const getEntryFileName = (name: string): string => {
    const output = createPreserveModulesOutput()
    return output.entryFileNames({ name })
  }

  it('passes through plain module names unchanged', () => {
    expect(getEntryFileName('index')).toBe('index.js')
    expect(getEntryFileName('utils/helpers')).toBe('utils/helpers.js')
  })

  it('preserves .vue extension for SFC facade modules', () => {
    expect(getEntryFileName('Foo.vue')).toBe('Foo.vue.js')
    expect(getEntryFileName('components/Bar.vue')).toBe('components/Bar.vue.js')
  })

  it('produces distinct names for SFC virtual modules with query strings', () => {
    expect(getEntryFileName('Foo.vue?vue&type=script&setup=true&lang.ts')).toBe('Foo.vue.script.ts.js')
    expect(getEntryFileName('Foo.vue?vue&type=style&index=0&lang.css')).toBe('Foo.vue.style.css.js')
  })

  it('does not collide facade and script virtual module names', () => {
    const facade = getEntryFileName('Foo.vue')
    const script = getEntryFileName('Foo.vue?vue&type=script&setup=true&lang.ts')
    expect(facade).not.toBe(script)
  })

  it('handles query strings without a type parameter', () => {
    expect(getEntryFileName('Foo.vue?vue&lang')).toBe('Foo.vue.virtual.js')
  })

  it('produces distinct names for multiple style blocks', () => {
    const style0 = getEntryFileName('Foo.vue?vue&type=style&index=0&lang.css')
    const style1 = getEntryFileName('Foo.vue?vue&type=style&index=1&lang.css')
    expect(style0).toBe('Foo.vue.style.css.js')
    expect(style1).toBe('Foo.vue.style.1.css.js')
    expect(style0).not.toBe(style1)
  })

  it('omits index suffix for index=0 to keep names stable', () => {
    expect(getEntryFileName('Foo.vue?vue&type=script&setup=true&index=0&lang.ts')).toBe('Foo.vue.script.ts.js')
  })

  it('preserves directory prefixes for nested virtual modules', () => {
    expect(getEntryFileName('components/nested/Bar.vue')).toBe('components/nested/Bar.vue.js')
    expect(getEntryFileName('components/nested/Bar.vue?vue&type=script&setup=true&lang.ts')).toBe(
      'components/nested/Bar.vue.script.ts.js',
    )
  })

  it('includes lang suffix to distinguish different languages', () => {
    const styleCSS = getEntryFileName('Foo.vue?vue&type=style&index=0&lang.css')
    const styleSCSS = getEntryFileName('Foo.vue?vue&type=style&index=0&lang.scss')
    expect(styleCSS).toBe('Foo.vue.style.css.js')
    expect(styleSCSS).toBe('Foo.vue.style.scss.js')
    expect(styleCSS).not.toBe(styleSCSS)
  })

  it('handles query strings without lang suffix', () => {
    expect(getEntryFileName('Foo.vue?vue&type=script&setup=true')).toBe('Foo.vue.script.js')
  })
})

describe('createExternalsFromPackageJson', () => {
  it('returns regex patterns for each dependency', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        dependencies: { vue: '^3.0.0', lodash: '^4.0.0' },
      }),
    )

    const result = createExternalsFromPackageJson('./package.json')

    expect(result).toHaveLength(2)
    expect(result[0]).toBeInstanceOf(RegExp)
    expect('vue').toMatch(result[0])
    expect('vue/foo').toMatch(result[0])
    expect('vue-router').not.toMatch(result[0])
    expect('lodash').toMatch(result[1])
    expect('lodash/merge').toMatch(result[1])
  })

  it('combines dependencies, devDependencies, and peerDependencies', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        dependencies: { vue: '^3.0.0' },
        devDependencies: { vitest: '^1.0.0' },
        peerDependencies: { react: '^18.0.0' },
      }),
    )

    const result = createExternalsFromPackageJson()

    expect(result).toHaveLength(3)
    expect('vue').toMatch(result[0])
    expect('vitest').toMatch(result[1])
    expect('react').toMatch(result[2])
  })

  it('handles missing dependency fields gracefully', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({}))

    const result = createExternalsFromPackageJson()

    expect(result).toEqual([])
  })

  it('escapes special regex characters in scoped package names', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        dependencies: { '@scope/pkg': '^1.0.0' },
      }),
    )

    const result = createExternalsFromPackageJson()

    expect(result).toHaveLength(1)
    expect('@scope/pkg').toMatch(result[0])
    expect('@scope/pkg/sub').toMatch(result[0])
    expect('@scope/pkg-other').not.toMatch(result[0])
  })
})

describe('createLibEntry', () => {
  it('strips ./src/ prefix and .ts extension for entry keys', () => {
    const result = createLibEntry(['./src/index.ts'], '/project')

    expect(result).toEqual({
      index: resolve('/project', './src/index.ts'),
    })
  })

  it('handles nested paths', () => {
    const result = createLibEntry(['./src/components/index.ts', './src/utils/helpers.ts'], '/project')

    expect(result).toEqual({
      'components/index': resolve('/project', './src/components/index.ts'),
      'utils/helpers': resolve('/project', './src/utils/helpers.ts'),
    })
  })

  it('resolves paths against provided dirname', () => {
    const result = createLibEntry(['./src/index.ts'], '/my/project')

    expect(result.index).toBe(resolve('/my/project', './src/index.ts'))
  })
})

describe('findEntryPoints', () => {
  it('falls back to ["./src/index.ts"] when no exports field', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({}))

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('handles simple string exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: './dist/index.js',
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('handles conditional exports with import field', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': {
            import: './dist/index.js',
            require: './dist/index.cjs',
          },
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('handles multiple named exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': './dist/index.js',
          './components': './dist/components/index.js',
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts', './src/components/index.ts'])
  })

  it('skips .css exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': './dist/index.js',
          './style': './dist/style.css',
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('skips .d.ts exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': {
            import: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('skips .cjs exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': {
            import: './dist/index.js',
            require: './dist/index.cjs',
          },
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('skips wildcard CSS exports', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': './dist/index.js',
          './css/*.css': './dist/css/*.css',
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })

  it('throws when an export does not map to a source entry file', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': './dist/index.js',
          './browser/standalone.js': './dist/browser/standalone.js',
        },
      }),
    )
    mockExistsSync.mockImplementation((path: string) => path !== './src/browser/standalone.ts')
    expect(() => findEntryPoints()).toThrow(
      'Could not resolve source entry points for package exports: ./dist/browser/standalone.js.',
    )
  })

  it('deduplicates entry points', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        exports: {
          '.': {
            import: './dist/index.js',
            default: './dist/index.js',
          },
        },
      }),
    )

    expect(findEntryPoints()).toEqual(['./src/index.ts'])
  })
})
