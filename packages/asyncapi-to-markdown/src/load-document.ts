import { upgrade } from '@scalar/asyncapi-upgrader'
import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { normalize } from '@scalar/json-magic/helpers/normalize'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'

import { object } from './document'
import { preserveData } from './preserve-data'
import type { AsyncApiInput } from './types'

/** Load once, preserving the source location for relative external references. */
export const loadDocument = async (input: AsyncApiInput): Promise<Record<string, unknown>> => {
  const source = async (): Promise<{ value: unknown; origin?: string }> => {
    if (typeof input !== 'string') {
      return { value: deepClone(getRaw(input)) }
    }
    const parsed = normalize(input)
    if (isObject(parsed)) {
      return { value: parsed }
    }
    if (/^https?:\/\//i.test(input)) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to load AsyncAPI document (HTTP ${response.status})`)
      }
      return { value: normalize(await response.text()), origin: input }
    }
    const [{ resolve }, { readFile }] = await Promise.all([import('node:path'), import('node:fs/promises')])
    const origin = resolve(input)
    return { value: normalize(await readFile(origin, 'utf8')), origin }
  }
  const { value, origin } = await source()
  if (!isObject(value) || typeof value.asyncapi !== 'string') {
    throw new Error('Expected an AsyncAPI document with an asyncapi version')
  }
  if (!/^(1\.[012]|2\.[0-6]|3\.[01])\.\d+(?:-[\w.-]+)?$/.test(value.asyncapi)) {
    throw new Error(`Unsupported AsyncAPI version: ${value.asyncapi}`)
  }
  const originalVersion = value.asyncapi
  const errors: string[] = []
  const bundled = await bundle(value, {
    origin,
    plugins: [fetchUrls(), readFiles(), preserveData()],
    treeShake: false,
    hooks: { onResolveError: (node) => errors.push(`Failed to resolve ${node.$ref}`) },
  })
  if (errors.length) {
    throw new Error(errors.join('\n'))
  }
  // Migration reads structural fields directly. Resolve wrappers after bundling so older
  // channels and servers loaded from other files participate in the same upgrade.
  const prepared: Record<string, unknown> = { ...bundled }
  const resolved = createMagicProxy(prepared)
  for (const key of ['channels', 'servers', 'operations'] as const) {
    if (prepared[key] !== undefined && !Array.isArray(prepared[key])) {
      prepared[key] = Object.fromEntries(
        Object.entries(object(resolved[key])).map(([name, entry]) => [name, getRaw(object(entry))]),
      )
    }
  }
  const components = object(resolved.components)
  if (components.securitySchemes) {
    prepared.components = {
      ...getRaw(components),
      securitySchemes: Object.fromEntries(
        Object.entries(object(components.securitySchemes)).map(([name, entry]) => [name, getRaw(object(entry))]),
      ),
    }
  }
  return createMagicProxy({ ...upgrade(prepared), 'x-original-aas-version': originalVersion })
}
