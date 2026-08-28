import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

const scriptPath = fileURLToPath(new URL('./scan-documents.sh', import.meta.url))

type Source = {
  title: string
  slug: string
  url: string
  default: boolean
}

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true })
  }
})

/**
 * Write the given files into a fresh mount directory, run the scanner against it,
 * and return the parsed sources from the generated configuration.
 *
 * Keys are paths relative to the mount directory (nested paths are supported),
 * values are the file contents.
 */
const scan = (files: Record<string, string>, env: Record<string, string> = {}): Source[] => {
  const workDir = mkdtempSync(join(tmpdir(), 'scalar-docker-scan-'))
  tempDirs.push(workDir)

  const mountDir = join(workDir, 'docs')
  const configFile = join(workDir, 'configuration.json')

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = join(mountDir, relativePath)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, content)
  }
  // The mount directory may not exist yet when no files are provided.
  mkdirSync(mountDir, { recursive: true })

  execFileSync('sh', [scriptPath], {
    env: { ...process.env, MOUNT_DIR: mountDir, CONFIG_FILE: configFile, ...env },
    stdio: 'pipe',
  })

  return JSON.parse(readFileSync(configFile, 'utf8')).sources
}

const bySlug = (sources: Source[], slug: string) => sources.find((source) => source.slug === slug)

describe('scan-documents', () => {
  it('detects OpenAPI, Swagger, and AsyncAPI documents', () => {
    const sources = scan({
      'openapi.json': '{"openapi":"3.1.0","info":{"title":"OpenAPI"}}',
      'swagger.yaml': 'swagger: "2.0"\ninfo:\n  title: Swagger\n',
      'events.yaml': 'asyncapi: 3.0.0\ninfo:\n  title: Events\n',
    })

    expect(sources).toHaveLength(3)
    expect(sources.map((source) => source.slug).sort()).toEqual(['events', 'openapi', 'swagger'])
  })

  it('detects AsyncAPI documents in both JSON and YAML', () => {
    const sources = scan({
      'events.yaml': 'asyncapi: 3.0.0\ninfo:\n  title: Events\n',
      'chat.json': '{"asyncapi":"3.0.0","info":{"title":"Chat"}}',
    })

    expect(sources.map((source) => source.slug).sort()).toEqual(['chat', 'events'])
  })

  it('skips files without an OpenAPI, Swagger, or AsyncAPI version marker', () => {
    const sources = scan({
      'openapi.json': '{"openapi":"3.1.0","info":{"title":"OpenAPI"}}',
      'config.json': '{"hello":"world"}',
      'notes.yaml': 'foo: bar\n',
    })

    expect(sources).toHaveLength(1)
    expect(sources[0]?.slug).toBe('openapi')
  })

  it('does not emit a documentType field', () => {
    const sources = scan({
      'events.yaml': 'asyncapi: 3.0.0\ninfo:\n  title: Events\n',
    })

    expect(sources[0]).not.toHaveProperty('documentType')
    expect(Object.keys(sources[0] ?? {}).sort()).toEqual(['default', 'slug', 'title', 'url'])
  })

  it('marks exactly one document as the default', () => {
    const sources = scan({
      'a.json': '{"openapi":"3.1.0"}',
      'b.json': '{"openapi":"3.1.0"}',
      'c.json': '{"openapi":"3.1.0"}',
    })

    expect(sources.filter((source) => source.default)).toHaveLength(1)
  })

  it('selects the alphabetically first document as the default regardless of write order', () => {
    const sources = scan({
      'zebra.json': '{"openapi":"3.1.0"}',
      'alpha.json': '{"openapi":"3.1.0"}',
      'middle.json': '{"openapi":"3.1.0"}',
    })

    expect(sources.find((source) => source.default)?.slug).toBe('alpha')
  })

  it('escapes special characters in filenames so the configuration stays valid JSON', () => {
    // A parse error inside the scan helper would already fail the test, but assert
    // the escaped values explicitly to document the expected output.
    const sources = scan({ 'we"ird\\name.json': '{"openapi":"3.1.0"}' })

    expect(sources).toHaveLength(1)
    expect(sources[0]?.title).toBe('we"ird\\name')
    expect(sources[0]?.url).toBe('/openapi/we"ird\\name.json')
  })

  it('escapes control characters in filenames as JSON escape sequences', () => {
    // A tab in the filename must be emitted as a "\t" escape, not a raw control
    // character, so the configuration stays valid JSON.
    const sources = scan({ 'a\tb.json': '{"openapi":"3.1.0"}' })

    expect(sources).toHaveLength(1)
    expect(sources[0]?.title).toBe('a\tb')
  })

  it('generates titles and slugs from nested directories', () => {
    const sources = scan({
      'internal/admin-api.yml': 'openapi: 3.0.0\ninfo:\n  title: Admin\n',
    })

    const source = bySlug(sources, 'internal-admin-api')
    expect(source?.title).toBe('internal - admin-api')
    expect(source?.url).toBe('/openapi/internal/admin-api.yml')
  })

  it('returns an empty sources array when no documents are found', () => {
    expect(scan({})).toEqual([])
  })

  it('applies BASE_PATH as a URL prefix', () => {
    const sources = scan({ 'openapi.json': '{"openapi":"3.1.0"}' }, { BASE_PATH: '/docs' })

    expect(sources[0]?.url).toBe('/docs/openapi/openapi.json')
  })
})
