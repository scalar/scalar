import fs from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { pinAllVersions, pinVersion } from './pin-versions'

describe('pin-versions', () => {
  describe('pinVersion', () => {
    it('removes ^ prefix from versions', () => {
      expect(pinVersion('^1.0.0')).toBe('1.0.0')
      expect(pinVersion('^2.3.4')).toBe('2.3.4')
    })

    it('removes ~ prefix from versions', () => {
      expect(pinVersion('~1.0.0')).toBe('1.0.0')
      expect(pinVersion('~2.3.4')).toBe('2.3.4')
    })

    it('leaves exact versions unchanged', () => {
      expect(pinVersion('1.0.0')).toBe('1.0.0')
      expect(pinVersion('2.3.4')).toBe('2.3.4')
    })

    it('leaves workspace:* unchanged', () => {
      expect(pinVersion('workspace:*')).toBe('workspace:*')
      expect(pinVersion('workspace:^1.0.0')).toBe('workspace:^1.0.0')
    })

    it('leaves catalog:* unchanged', () => {
      expect(pinVersion('catalog:*')).toBe('catalog:*')
    })

    it('leaves npm: protocol unchanged', () => {
      expect(pinVersion('npm:package@^1.0.0')).toBe('npm:package@^1.0.0')
    })

    it('leaves github: protocol unchanged', () => {
      expect(pinVersion('github:user/repo')).toBe('github:user/repo')
    })

    it('leaves git: protocol unchanged', () => {
      expect(pinVersion('git+https://github.com/user/repo.git')).toBe('git+https://github.com/user/repo.git')
    })

    it('leaves file: protocol unchanged', () => {
      expect(pinVersion('file:../local-package')).toBe('file:../local-package')
    })

    it('leaves link: protocol unchanged', () => {
      expect(pinVersion('link:../local-package')).toBe('link:../local-package')
    })

    it('leaves http(s): URLs unchanged', () => {
      expect(pinVersion('https://example.com/package.tgz')).toBe('https://example.com/package.tgz')
      expect(pinVersion('http://example.com/package.tgz')).toBe('http://example.com/package.tgz')
    })
  })

  describe('pinAllVersions', () => {
    it('processes package.json files in check mode', async () => {
      // Create a temporary test directory
      const tmpDir = await fs.mkdtemp(path.join('/tmp', 'pin-versions-test-'))

      try {
        // Create a test package.json with version ranges
        const pkgPath = path.join(tmpDir, 'package.json')
        await fs.writeFile(
          pkgPath,
          JSON.stringify(
            {
              name: 'test-package',
              version: '1.0.0',
              dependencies: {
                foo: '^1.0.0',
                bar: '~2.0.0',
                baz: '3.0.0',
              },
              devDependencies: {
                dev: '^4.0.0',
              },
            },
            null,
            2,
          ) + '\n',
        )

        // Run in check mode
        const result = await pinAllVersions(tmpDir, true)

        // Should detect 3 changes (foo, bar, dev)
        expect(result.totalChanges).toBe(3)
        expect(result.changesByFile.size).toBe(1)

        const changes = result.changesByFile.get(pkgPath)
        expect(changes).toBeDefined()
        expect(changes?.length).toBe(3)

        // File should not be modified in check mode
        const content = await fs.readFile(pkgPath, 'utf8')
        const pkg = JSON.parse(content)
        expect(pkg.dependencies.foo).toBe('^1.0.0')
        expect(pkg.dependencies.bar).toBe('~2.0.0')
        expect(pkg.devDependencies.dev).toBe('^4.0.0')
      } finally {
        // Clean up
        await fs.rm(tmpDir, { recursive: true, force: true })
      }
    })

    it('pins versions when not in check mode', async () => {
      const tmpDir = await fs.mkdtemp(path.join('/tmp', 'pin-versions-test-'))

      try {
        const pkgPath = path.join(tmpDir, 'package.json')
        await fs.writeFile(
          pkgPath,
          JSON.stringify(
            {
              name: 'test-package',
              version: '1.0.0',
              dependencies: {
                foo: '^1.0.0',
                bar: '~2.0.0',
              },
            },
            null,
            2,
          ) + '\n',
        )

        // Run without check mode
        const result = await pinAllVersions(tmpDir, false)

        expect(result.totalChanges).toBe(2)

        // File should be modified
        const content = await fs.readFile(pkgPath, 'utf8')
        const pkg = JSON.parse(content)
        expect(pkg.dependencies.foo).toBe('1.0.0')
        expect(pkg.dependencies.bar).toBe('2.0.0')
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true })
      }
    })

    it('processes pnpm-workspace.yaml files', async () => {
      const tmpDir = await fs.mkdtemp(path.join('/tmp', 'pin-versions-test-'))

      try {
        const yamlPath = path.join(tmpDir, 'pnpm-workspace.yaml')
        await fs.writeFile(
          yamlPath,
          `packages:
  - packages/*

catalogs:
  '*':
    foo: ^1.0.0
    bar: ~2.0.0
    baz: 3.0.0
`,
        )

        const result = await pinAllVersions(tmpDir, false)

        expect(result.totalChanges).toBe(2)

        const content = await fs.readFile(yamlPath, 'utf8')
        expect(content).toContain('foo: 1.0.0')
        expect(content).toContain('bar: 2.0.0')
        expect(content).toContain('baz: 3.0.0')
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true })
      }
    })

    it('skips workspace:* and catalog:* versions', async () => {
      const tmpDir = await fs.mkdtemp(path.join('/tmp', 'pin-versions-test-'))

      try {
        const pkgPath = path.join(tmpDir, 'package.json')
        await fs.writeFile(
          pkgPath,
          JSON.stringify(
            {
              name: 'test-package',
              version: '1.0.0',
              dependencies: {
                internal: 'workspace:*',
                shared: 'catalog:*',
                external: '^1.0.0',
              },
            },
            null,
            2,
          ) + '\n',
        )

        const result = await pinAllVersions(tmpDir, false)

        // Should only change external
        expect(result.totalChanges).toBe(1)

        const content = await fs.readFile(pkgPath, 'utf8')
        const pkg = JSON.parse(content)
        expect(pkg.dependencies.internal).toBe('workspace:*')
        expect(pkg.dependencies.shared).toBe('catalog:*')
        expect(pkg.dependencies.external).toBe('1.0.0')
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true })
      }
    })

    it('returns zero changes when all versions are already pinned', async () => {
      const tmpDir = await fs.mkdtemp(path.join('/tmp', 'pin-versions-test-'))

      try {
        const pkgPath = path.join(tmpDir, 'package.json')
        await fs.writeFile(
          pkgPath,
          JSON.stringify(
            {
              name: 'test-package',
              version: '1.0.0',
              dependencies: {
                foo: '1.0.0',
                bar: '2.0.0',
              },
            },
            null,
            2,
          ) + '\n',
        )

        const result = await pinAllVersions(tmpDir, true)

        expect(result.totalChanges).toBe(0)
        expect(result.changesByFile.size).toBe(0)
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true })
      }
    })
  })
})
