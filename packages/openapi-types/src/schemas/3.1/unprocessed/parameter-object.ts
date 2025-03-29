import { z } from 'zod'
import { ParameterObjectSchema as OriginalParameterObjectSchema } from '../processed/parameter-object'
import { ExampleObjectSchema } from './example-object'
import { MediaTypeObjectSchema } from './media-type-object'
import { ReferenceObjectSchema } from './reference-object'

/**
 * Parameter Object
 *
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#parameter-object
 */
export const ParameterObjectSchema = OriginalParameterObjectSchema.extend({
  /**
   * Examples of the parameter's potential value. Each example SHOULD contain a value in the correct format as
   * specified in the parameter encoding. The examples field is mutually exclusive of the example field. Furthermore,
   * if referencing a schema that contains an example, the examples value SHALL override the example provided by the
   * schema.
   **/
  examples: z.record(z.string(), z.union([ReferenceObjectSchema, ExampleObjectSchema])).optional(),
  /**
   * A map containing the representations for the parameter. The key is the media type and the value describes it.
   * The map MUST only contain one entry.
   **/
  content: z.record(z.string(), MediaTypeObjectSchema).optional(),
})
