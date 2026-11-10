import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObjectLike } from '@scalar/helpers/object/is-object'

/** Preserve vendor wire values when OpenAPI 2.0 inheritance becomes an OpenAPI 3 discriminator. */
export const migrateDiscriminatorMappings = (definitions: unknown): void => {
  if (!isObjectLike(definitions)) {
    return
  }

  const mappings = new Map<Record<string, unknown>, Map<string, string | undefined>>()
  for (const [name, schema] of Object.entries(definitions)) {
    if (!isObjectLike(schema)) {
      continue
    }
    const aliases = [schema['x-ms-discriminator-value'], schema['x-discriminator-value']].filter(
      (value): value is string => typeof value === 'string',
    )
    if (aliases.length === 0) {
      continue
    }

    const reference = `#/components/schemas/${encodeURIComponent(escapeJsonPointer(name))}`
    const pending: unknown[] = Array.isArray(schema.allOf) ? [...schema.allOf] : []
    const seen = new Set<unknown>([schema])
    while (pending.length > 0) {
      const member = pending.pop()
      if (!isObjectLike(member) || seen.has(member)) {
        continue
      }
      seen.add(member)
      if (Array.isArray(member.allOf)) {
        pending.push(...member.allOf)
      }
      if (typeof member.$ref !== 'string' || !member.$ref.startsWith('#/definitions/')) {
        continue
      }
      // Invalid escaping or unresolved/external references cannot identify a local parent.
      let parentName: string
      try {
        const segment = decodeURIComponent(member.$ref.slice('#/definitions/'.length))
        if (segment.includes('/')) {
          continue
        }
        parentName = unescapeJsonPointerSegment(segment)
      } catch {
        continue
      }
      const parent = Object.hasOwn(definitions, parentName) ? definitions[parentName] : undefined
      if (!isObjectLike(parent) || seen.has(parent)) {
        continue
      }
      pending.push(parent)
      if (!isObjectLike(parent.discriminator) || typeof parent.discriminator.propertyName !== 'string') {
        continue
      }

      const mapping = mappings.get(parent.discriminator) ?? new Map<string, string | undefined>()
      for (const alias of aliases) {
        // Conflicting wire values cannot select a subtype reliably; keep them unmapped.
        mapping.set(alias, mapping.has(alias) && mapping.get(alias) !== reference ? undefined : reference)
      }
      mappings.set(parent.discriminator, mapping)
    }
  }

  for (const [discriminator, aliases] of mappings) {
    const derived = Object.fromEntries([...aliases].filter(([, reference]) => reference !== undefined))
    if (Object.keys(derived).length === 0) {
      continue
    }
    if (discriminator.mapping !== undefined && !isObjectLike(discriminator.mapping)) {
      continue
    }
    // Authored mappings take precedence, including special keys such as __proto__.
    discriminator.mapping = { ...derived, ...discriminator.mapping }
  }
}
