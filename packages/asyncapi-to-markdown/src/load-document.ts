import { upgrade } from '@scalar/asyncapi-upgrader'
import { isObject } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { type DocumentLoadOptions, createDocumentLoader } from '@scalar/json-magic/bundle/plugins/node'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'

import { object } from './document'
import { preserveData } from './preserve-data'
import type { AsyncApiInput } from './types'

export type { DocumentLoadOptions } from '@scalar/json-magic/bundle/plugins/node'

/** Load once, preserving the source location for relative external references. */
export const loadDocument = async (
  input: AsyncApiInput,
  options: DocumentLoadOptions = {},
): Promise<Record<string, unknown>> => {
  const loader = createDocumentLoader(options)
  const { value, origin } =
    typeof input === 'string'
      ? await loader.load(input, 'AsyncAPI')
      : { value: deepClone(getRaw(input)), origin: undefined }
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
    plugins: [...loader.plugins, preserveData()],
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
