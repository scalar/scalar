import {
  apiReferenceConfigurationSchema,
  htmlRenderingConfigurationSchema,
  sourceConfigurationSchema,
} from '@scalar/types/api-reference'

import type { JsonSchema, SchemaMap } from './json-schema-types'

export type ExtractedSchemas = {
  /** The merged base + api-reference config fields */
  apiReferenceFields: SchemaMap
  /** The source configuration fields */
  sourceFields: SchemaMap
  /** The HTML rendering fields (cdn, pageTitle) */
  htmlRenderingFields: SchemaMap
}

// ---------------------------------------------------------------------------
// Zod v4 internal def → JSON Schema converter
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Get the Zod v4 def from a schema, trying both _zod.def and .def */
function getDef(schema: any): any {
  return schema?._zod?.def ?? schema?.def
}

/** Unwrap a Zod v4 def to a JSON Schema representation */
function zodDefToJsonSchema(def: any): JsonSchema {
  if (!def) return {}

  const type = def.type

  switch (type) {
    case 'string':
      return { type: 'string' }

    case 'boolean':
      return { type: 'boolean' }

    case 'number':
      return { type: 'number' }

    case 'integer':
      return { type: 'integer' }

    case 'enum': {
      const values = def.options ?? Object.values(def.entries ?? {})
      return { type: 'string', enum: values }
    }

    case 'optional': {
      const inner = zodDefToJsonSchema(getDef(def.innerType))
      // Mark as optional by wrapping in anyOf with null
      return { anyOf: [inner, { type: 'null' }] }
    }

    case 'nullable': {
      const inner = zodDefToJsonSchema(getDef(def.innerType))
      return { anyOf: [inner, { type: 'null' }] }
    }

    case 'default': {
      const inner = zodDefToJsonSchema(getDef(def.innerType))
      return { ...inner, default: def.defaultValue }
    }

    case 'catch': {
      return zodDefToJsonSchema(getDef(def.innerType))
    }

    case 'array': {
      const itemSchema = zodDefToJsonSchema(getDef(def.element))
      return { type: 'array', items: itemSchema }
    }

    case 'object': {
      const properties: SchemaMap = {}
      const shape = def.shape
      if (shape) {
        for (const [key, value] of Object.entries(shape as Record<string, any>)) {
          properties[key] = zodDefToJsonSchema(getDef(value))
        }
      }
      return { type: 'object', properties }
    }

    case 'record':
      return { type: 'object' }

    case 'union': {
      const options = (def.options ?? []).map((opt: any) => zodDefToJsonSchema(getDef(opt)))
      return { anyOf: options }
    }

    case 'literal':
      return { const: def.value }

    case 'any':
      return {}

    case 'function':
      return { type: 'function' as any }

    case 'custom':
      return { type: 'custom' as any }

    default:
      return {}
  }
}

/** Extract properties from a Zod v4 object schema */
function extractProperties(zodSchema: any): SchemaMap {
  const shape = zodSchema.shape
  if (!shape) return {}

  const properties: SchemaMap = {}
  for (const [key, value] of Object.entries(shape as Record<string, any>)) {
    properties[key] = zodDefToJsonSchema(getDef(value))
  }

  return properties
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Extract all Zod schemas into JSON Schema property maps */
export function extractSchemas(): ExtractedSchemas {
  return {
    apiReferenceFields: extractProperties(apiReferenceConfigurationSchema),
    sourceFields: extractProperties(sourceConfigurationSchema),
    htmlRenderingFields: extractProperties(htmlRenderingConfigurationSchema),
  }
}
