import { Type } from '@sinclair/typebox'

/**
 * Generic schema for scalar secrets
 *
 * These should be excluded when exporting the document
 */
export const XScalarSecretSchema = Type.Record(Type.TemplateLiteral('x-scalar-secret-${string}'), Type.String())
