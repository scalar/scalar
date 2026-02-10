import { describe, expect, it } from 'vitest'

import { isFilePath } from '@/helpers/is-file-path'

describe('valid file paths', () => {
  it.each([
    ['./schemas/user.json', 'relative path with extension'],
    ['../parent/schema.yaml', 'relative parent path'],
    ['/absolute/path/to/file.json', 'absolute path'],
    ['./local-schema.json', 'relative path in current directory'],
    ['file.json', 'simple filename'],
    ['folder/subfolder/file.yaml', 'nested relative path'],
    ['~/home/user/file.json', 'home directory path'],
    ['./path/to/openapi.yml', 'yml extension'],
    ['schema.yaml', 'yaml extension'],
    ['api-spec.json', 'kebab-case filename'],
    ['api_spec.json', 'snake_case filename'],
    ['apiSpec.json', 'camelCase filename'],
    ['./path with spaces/file.json', 'path with spaces'],
    ['./path/file-v1.2.3.json', 'filename with version'],
    ['C:\\Windows\\file.json', 'Windows absolute path'],
    ['\\\\network\\share\\file.json', 'UNC network path'],
    ['./file', 'file without extension'],
    ['.hidden/file.json', 'hidden directory'],
    ['path/to/.hidden.json', 'hidden file'],
    ['./très/café.json', 'path with unicode characters'],
    ['file-名前.json', 'filename with unicode'],
    ['./a/b/c/d/e/f/file.json', 'deeply nested path'],
    ['path/to/file.tar.gz', 'double extension'],
    ['./path/to/file.backup.json', 'multiple dots in filename'],
  ])('returns true for %s (%s)', (input) => {
    expect(isFilePath(input)).toBe(true)
  })
})

describe('remote URLs (not file paths)', () => {
  it.each([
    ['https://example.com/schema.json', 'https URL'],
    ['http://api.example.com/openapi.yaml', 'http URL'],
    ['https://example.com:8080/api', 'URL with port'],
    ['http://localhost:3000/schema', 'localhost URL'],
    ['https://example.com/api?query=value', 'URL with query string'],
    ['http://192.168.1.1/schema.json', 'IP address URL'],
  ])('returns false for %s (%s)', (input) => {
    expect(isFilePath(input)).toBe(false)
  })
})

describe('YAML content (not file paths)', () => {
  it.each([
    ['openapi: 3.0.0\ninfo:\n  title: API', 'multiline YAML with nested keys'],
    ['version: 1.0.0\nname: test', 'simple multiline YAML'],
    ['- name: item1\n- name: item2', 'YAML array with key-value pairs'],
    ['key: value\nanother: value2', 'simple key-value pairs'],
    ['  indented: value\n  another: value', 'indented YAML'],
    ['title: "My API"\nversion: "1.0"', 'YAML with quoted values'],
    ['list:\n  - item1\n  - item2', 'YAML with nested list'],
    ['complex:\n  nested:\n    deep: value', 'deeply nested YAML'],
  ])('returns false for %s (%s)', (input) => {
    expect(isFilePath(input)).toBe(false)
  })
})

describe('JSON object content (not file paths)', () => {
  it.each([
    ['{"type": "object"}', 'simple JSON object'],
    ['{"openapi": "3.0.0", "info": {}}', 'nested JSON object'],
    ['  {"key": "value"}  ', 'JSON with leading/trailing whitespace'],
    ['{\n  "formatted": "json",\n  "pretty": true\n}', 'prettified JSON object'],
    ['{"array": [1, 2, 3]}', 'JSON with array property'],
    ['{"null": null, "bool": true}', 'JSON with null and boolean'],
    ['{"number": 42, "string": "text"}', 'JSON with mixed types'],
    ['{"nested": {"deep": {"value": "here"}}}', 'deeply nested JSON'],
    ['{"empty": {}}', 'JSON with empty object'],
    ['{"unicode": "café ☕"}', 'JSON with unicode characters'],
  ])('returns false for %s (%s)', (input) => {
    expect(isFilePath(input)).toBe(false)
  })
})
