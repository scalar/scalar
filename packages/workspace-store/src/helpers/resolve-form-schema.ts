import { objectEntries } from '@scalar/helpers/object/object-entries'

import { selectExampleComposition } from '@/request-example/builder/helpers/get-example-from-schema'
import { resolve } from '@/resolve'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@/schemas/v3.2/strict/schema'
import { isNumberSchema, isObjectSchema } from '@/schemas/v3.2/strict/type-guards'

import { getSchemaAnnotations, resolveSchemaWithAnnotations } from './resolve-schema-with-annotations'
import { unpackProxyShallow } from './unpack-proxy'

/**
 * Expose the selected request-body shape to form editors and serializers without changing the
 * API description. Use the example generator's branch selection so field types match its values.
 * Unselected alternatives remain on the view for validation, but do not contribute form fields.
 */
export const resolveFormSchema = (
  schema: MaybeRefSchemaObject | undefined,
  compositionSelection?: Record<string, number>,
): SchemaObject | undefined => {
  const ancestors = new Set<object>()
  const visit = (
    input: MaybeRefSchemaObject | undefined,
    path: string[],
    selection: Record<string, number> | undefined,
  ): SchemaObject | undefined => {
    const source = resolve.schema(input)
    const resolved = resolveSchemaWithAnnotations(input)
    if (!source || !resolved || !input) {
      return resolved
    }
    const identity = unpackProxyShallow(input)
    // Recursive properties remain opaque leaves instead of expanding an infinite form.
    if (ancestors.has(identity)) {
      return isObjectSchema(resolved) ? { ...resolved, properties: undefined } : resolved
    }
    ancestors.add(identity)
    try {
      if (source.allOf?.length) {
        let choiceIndex = 0
        const members = source.allOf.map((member) => {
          const memberSchema = resolve.schema(member)
          const isChoice = Boolean(memberSchema?.oneOf || memberSchema?.anyOf)
          return visit(member, isChoice ? [...path, String(choiceIndex++)] : path, selection) ?? member
        })
        if (!resolved.allOf) {
          return resolveSchemaWithAnnotations({ ...source, allOf: members })
        }
        const { allOf: _allOf, ...siblings } = source
        const parts = [visit(siblings, path, selection), ...members].filter(
          (member): member is SchemaObject => member !== undefined,
        )
        const typed = parts.filter((member) => 'type' in member && member.type !== undefined)
        const first = typed[0]
        if (!first || !('type' in first) || Array.isArray(first.type)) {
          return resolved
        }
        const type =
          typed.some((member) => 'type' in member && member.type === 'integer') &&
          (first.type === 'integer' || first.type === 'number')
            ? 'integer'
            : first.type
        // Incompatible intersections have no single input type. Keep them as opaque leaves.
        if (
          typed.some(
            (member) => 'type' in member && member.type !== type && !(type === 'integer' && member.type === 'number'),
          )
        ) {
          return resolved
        }
        const annotations = Object.assign({}, ...parts.map(getSchemaAnnotations))
        const result: SchemaObject = { ...first, ...annotations, ...siblings, type, allOf: source.allOf }
        Reflect.deleteProperty(result, '__scalar_')
        if (isObjectSchema(result)) {
          const properties: Record<string, MaybeRefSchemaObject> = {}
          const required = new Set<string>()
          for (const part of parts) {
            if ('required' in part) {
              for (const name of part.required ?? []) {
                required.add(name)
              }
            }
            if ('properties' in part) {
              for (const [name, child] of objectEntries(part.properties ?? {})) {
                const previous = properties[name]
                properties[name] = previous
                  ? (visit({ __scalar_: '', allOf: [previous, child] }, [...path, name], selection) ?? child)
                  : child
              }
            }
          }
          result.properties = properties
          result.required = [...required]
        }
        if (isNumberSchema(result)) {
          const minima = parts.flatMap((part) =>
            'minimum' in part && part.minimum !== undefined ? [part.minimum] : [],
          )
          const maxima = parts.flatMap((part) =>
            'maximum' in part && part.maximum !== undefined ? [part.maximum] : [],
          )
          if (minima.length) {
            result.minimum = Math.max(...minima)
          }
          if (maxima.length) {
            result.maximum = Math.min(...maxima)
          }
        }
        return result
      }

      const properties =
        isObjectSchema(resolved) && resolved.properties
          ? Object.fromEntries(
              objectEntries(resolved.properties).map(([key, child]) => [
                key,
                visit(child, [...path, key], selection) ?? child,
              ]),
            )
          : undefined
      const base = properties ? { ...resolved, properties } : resolved
      const keyword = resolved.oneOf ? 'oneOf' : 'anyOf'
      const candidate = selectExampleComposition(resolved, path, { compositionSelection: selection })
      if (!candidate) {
        return base
      }
      const selectionKey = [...path, keyword].join('.')
      const { [selectionKey]: _selection, ...remainingSelection } = selection ?? {}
      const selected = visit(candidate, path, remainingSelection)
      if (!selected) {
        return base
      }
      const result: SchemaObject = { ...base, ...selected, [keyword]: resolved[keyword] }
      if ('type' in result) {
        Reflect.deleteProperty(result, '__scalar_')
      }
      if (isNumberSchema(result)) {
        // Parent and branch bounds both apply; selecting a variant must not weaken validation.
        if (
          'minimum' in base &&
          'minimum' in selected &&
          base.minimum !== undefined &&
          selected.minimum !== undefined
        ) {
          result.minimum = Math.max(base.minimum, selected.minimum)
        }
        if (
          'maximum' in base &&
          'maximum' in selected &&
          base.maximum !== undefined &&
          selected.maximum !== undefined
        ) {
          result.maximum = Math.min(base.maximum, selected.maximum)
        }
      }
      if (resolved.description !== undefined) {
        result.description = resolved.description
      }
      if (isObjectSchema(result)) {
        const baseProperties = 'properties' in base ? base.properties : undefined
        const selectedProperties = 'properties' in selected ? selected.properties : undefined
        const baseRequired = 'required' in base ? base.required : undefined
        const selectedRequired = 'required' in selected ? selected.required : undefined
        result.properties = { ...baseProperties, ...selectedProperties }
        result.required = [...new Set([...(baseRequired ?? []), ...(selectedRequired ?? [])])]
      }
      return result
    } finally {
      ancestors.delete(identity)
    }
  }
  return visit(schema, ['requestBody'], compositionSelection)
}
