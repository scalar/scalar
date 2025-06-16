import { Type, type Static } from '@sinclair/typebox'

export const ExtensionsSchema = Type.Record(Type.TemplateLiteral('x-${string}'), Type.Unknown())

export type Extensions = Static<typeof ExtensionsSchema>
