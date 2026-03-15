import fs from 'node:fs'

import { openapi } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'
import type { OpenAPI } from '@scalar/openapi-types'
import { parse } from 'yaml'

/**
 * Load OpenAPI spec from file path or URL.
 * Returns dereferenced specification (all $refs resolved).
 */
export async function loadSpec(input: string): Promise<OpenAPI.Document> {
  const isUrl = input.startsWith('http://') || input.startsWith('https://')

  let raw: string | object
  if (isUrl) {
    const res = await fetch(input)
    if (!res.ok) {
      throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`)
    }
    const text = await res.text()
    raw = text.trim().startsWith('{') ? JSON.parse(text) : parse(text)
  } else {
    if (!fs.existsSync(input)) {
      throw new Error(`Spec file not found: ${input}`)
    }
    raw = input
  }

  const result = await openapi()
    .load(raw, { plugins: [readFiles(), fetchUrls()], throwOnError: true })
    .dereference({ throwOnError: true })
    .get()

  const spec = result.schema ?? result.specification
  if (!spec || typeof spec !== 'object') {
    throw new Error('Failed to load or dereference OpenAPI spec')
  }

  return spec as OpenAPI.Document
}
