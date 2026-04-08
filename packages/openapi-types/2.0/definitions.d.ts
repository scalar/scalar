import type { SchemaObject } from './schema'
/**
 * Definitions object
 *
 * An object to hold data types that can be consumed and produced by operations. These data types can be primitives, arrays or models.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#definitions-object}
 */
export type DefinitionsObject = {
  [key: string]: SchemaObject
}
