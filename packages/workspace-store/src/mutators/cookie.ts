import type { CookieEvents } from '@/events/definitions/cookie'
import type { Workspace, WorkspaceDocument } from '@/schemas'
import { type XScalarCookie, xScalarCookieSchema } from '@/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@/schemas/typebox-coerce'

type Event<T extends keyof CookieEvents> = Omit<CookieEvents[T], 'collectionType'>

/**
 * Adds OR updates a cookie to the document or workspace.
 *
 * @param document - current document if available
 * @param workspace - current workspace if available
 * @param payload - The cookie configuration to add or update
 * @param index - Optional index for updating an existing cookie
 * @param collectionType - Whether this is for a document or workspace
 * @returns the parsed cookie that was added or updated or undefined if the collection is not found
 */
export const upsertCookie = (
  collection: WorkspaceDocument | Workspace | null,
  { payload, index }: Event<'cookie:upsert:cookie'>,
): XScalarCookie | undefined => {
  if (!collection) {
    return
  }

  if (!collection['x-scalar-cookies']) {
    collection['x-scalar-cookies'] = []
  }

  if (index !== undefined) {
    // Update existing cookie at index
    if (index < 0 || index >= collection['x-scalar-cookies'].length) {
      return
    }

    // Ensure we parse the payload but keep the existing cookie data
    const parsed = coerceValue(xScalarCookieSchema, {
      ...collection['x-scalar-cookies'][index],
      ...payload,
    })

    // Update
    collection['x-scalar-cookies'][index] = parsed
    return parsed
  }

  // Add new cookie
  const parsed = coerceValue(xScalarCookieSchema, payload)
  collection['x-scalar-cookies'].push(parsed)
  return parsed
}

/**
 * Deletes a cookie from the document or workspace by index.
 *
 * @param document - current document if available
 * @param workspace - current workspace if available
 * @param index - Index of the cookie to delete
 * @param collectionType - Whether this is for a document or workspace
 * @returns true if the cookie was deleted, false otherwise
 */
export const deleteCookie = (
  collection: WorkspaceDocument | Workspace | null,
  { index }: Event<'cookie:delete:cookie'>,
): boolean => {
  if (!collection || !collection['x-scalar-cookies']) {
    return false
  }

  if (index < 0 || index >= collection['x-scalar-cookies'].length) {
    return false
  }

  collection['x-scalar-cookies'].splice(index, 1)
  return true
}

export const cookieMutatorsFactory = ({ collection }: { collection: WorkspaceDocument | Workspace | null }) => {
  return {
    upsertCookie: (payload: Event<'cookie:upsert:cookie'>) => upsertCookie(collection, payload),
    deleteCookie: (payload: Event<'cookie:delete:cookie'>) => deleteCookie(collection, payload),
  }
}
