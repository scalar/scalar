import { type Static, evaluate, string } from '@scalar/validation'
import { nanoid } from 'nanoid'

/**
 * Minimum length for a generated id. Historically enforced by `z.string().min(7)`.
 * Anything shorter (or a non-string) is treated as missing and a fresh id is generated.
 */
const MINIMUM_ID_LENGTH = 7

/**
 * Schema for our entity uids.
 *
 * When a valid id (a string of at least {@link MINIMUM_ID_LENGTH} characters) is provided it is kept
 * as-is; otherwise a fresh id is generated with `nanoid()`. This mirrors the previous
 * `z.string().min(7).default(() => nanoid())` behaviour, but without pulling zod into the runtime bundle.
 */
export const nanoidSchema = evaluate(
  (value) => (typeof value === 'string' && value.length >= MINIMUM_ID_LENGTH ? value : nanoid()),
  string(),
)

/**
 * Nominal brand helper.
 *
 * `@scalar/validation` has no equivalent of zod's `.brand()`, so we reproduce the nominal typing at the
 * type level. `Brand<string, 'collection'>` stays structurally compatible with `string` (matching how the
 * previous zod brands behaved for our uids) while still distinguishing entity kinds in editor tooling.
 */
export type Brand<T, B> = T & { readonly __brand?: B }

/** UID format for objects */
export type Nanoid = Static<typeof nanoidSchema>

/** All of our brands for entities, used to brand uids. */
export type ENTITY_BRANDS = {
  COLLECTION: 'collection'
  COOKIE: 'cookie'
  ENVIRONMENT: 'environment'
  EXAMPLE: 'example'
  OPERATION: 'operation'
  SECURITY_SCHEME: 'securityScheme'
  SERVER: 'server'
  TAG: 'tag'
  WORKSPACE: 'workspace'
}
