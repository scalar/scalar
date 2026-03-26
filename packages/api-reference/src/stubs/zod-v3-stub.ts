/**
 * Minimal stub for the `zod/v3` package used only in the standalone bundle.
 *
 * The AI SDK (`@ai-sdk/provider-utils`) imports `ZodFirstPartyTypeKind` from
 * `zod/v3` to detect whether a schema is a Zod v3 schema before deciding which
 * converter to run. We always pass Zod 4 schemas to the AI SDK, so the Zod v3
 * converter is never actually invoked. Bundling the full `zod/v3` compatibility
 * layer (types.js alone is ~91 KB) just to carry this one enum is wasteful.
 *
 * The enum values here are an exact copy of the real zod/v3 `ZodFirstPartyTypeKind`
 * so that the AI SDK's type-detection guard still works correctly at runtime:
 * a Zod 4 schema's `_def.typeName` will never match these strings, and the SDK
 * will fall through to its Zod 4 handling path as expected.
 */
export const ZodFirstPartyTypeKind = {
  ZodString: 'ZodString',
  ZodNumber: 'ZodNumber',
  ZodNaN: 'ZodNaN',
  ZodBigInt: 'ZodBigInt',
  ZodBoolean: 'ZodBoolean',
  ZodDate: 'ZodDate',
  ZodSymbol: 'ZodSymbol',
  ZodUndefined: 'ZodUndefined',
  ZodNull: 'ZodNull',
  ZodAny: 'ZodAny',
  ZodUnknown: 'ZodUnknown',
  ZodNever: 'ZodNever',
  ZodVoid: 'ZodVoid',
  ZodArray: 'ZodArray',
  ZodObject: 'ZodObject',
  ZodUnion: 'ZodUnion',
  ZodDiscriminatedUnion: 'ZodDiscriminatedUnion',
  ZodIntersection: 'ZodIntersection',
  ZodTuple: 'ZodTuple',
  ZodRecord: 'ZodRecord',
  ZodMap: 'ZodMap',
  ZodSet: 'ZodSet',
  ZodFunction: 'ZodFunction',
  ZodLazy: 'ZodLazy',
  ZodLiteral: 'ZodLiteral',
  ZodEnum: 'ZodEnum',
  ZodEffects: 'ZodEffects',
  ZodNativeEnum: 'ZodNativeEnum',
  ZodOptional: 'ZodOptional',
  ZodNullable: 'ZodNullable',
  ZodDefault: 'ZodDefault',
  ZodCatch: 'ZodCatch',
  ZodPromise: 'ZodPromise',
  ZodBranded: 'ZodBranded',
  ZodPipeline: 'ZodPipeline',
  ZodReadonly: 'ZodReadonly',
} as const
