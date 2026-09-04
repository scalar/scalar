import { type InjectionKey, inject, provide } from 'vue'

/**
 * What a block is in the reference's page hierarchy.
 *
 * This is the *page* hierarchy, not the DOM. An operation is an `operation`
 * whether or not a tag happens to wrap it, which is why levels cannot be
 * derived from nesting depth.
 */
export type OutlineRole =
  | 'document'
  | 'tag'
  | 'channel'
  | 'modelGroup'
  | 'operation'
  | 'model'
  | 'message'
  | 'operationSection'

/** Valid heading levels, matching the tags `h1` through `h6`. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * The outline of a full reference, and the only place levels are written down.
 *
 * Each role appears exactly once: a role has one place in the hierarchy, so
 * roles that sit alongside each other share a level.
 */
const OUTLINE: Record<OutlineRole, number> = {
  document: 1,
  tag: 2,
  channel: 2,
  modelGroup: 2,
  operation: 3,
  model: 3,
  message: 4,
  /** A titled group inside an operation: Body, Responses, Query Parameters */
  operationSection: 4,
}

/** The role at the top of the current page. */
const OUTLINE_ROOT: InjectionKey<OutlineRole> = Symbol('DOCUMENT_OUTLINE_ROOT')

const clamp = (level: number): HeadingLevel => Math.min(6, Math.max(1, level)) as HeadingLevel

/**
 * Declare the role at the top of this page.
 *
 * Called by a component that renders two or more blocks alongside each other
 * and therefore owns the relationship between them — `Content` renders the
 * info block above the tags and operations, so it anchors the outline at
 * `document` and everything below resolves against that.
 *
 * A block rendered on its own needs no call: it anchors itself.
 */
export const provideDocumentOutline = (role: OutlineRole) => provide(OUTLINE_ROOT, role)

/**
 * The heading level for a block's own heading.
 *
 * A block assumes it is the top of the page — rendered on its own it is the
 * `h1`, and the blocks it contains follow beneath it. Rendering it inside a
 * composed outline overrides that, so the same component is an `h3` in a full
 * reference and an `h1` on a page that shows only that operation.
 */
export const useDocumentOutline = (role: OutlineRole) => {
  const inherited = inject(OUTLINE_ROOT, null)

  // Nothing above declared an outline, so this block is the top of the page and
  // anchors one for whatever it renders beneath it.
  if (!inherited) {
    provide(OUTLINE_ROOT, role)
  }

  const root = inherited ?? role

  return { level: clamp(OUTLINE[role] - OUTLINE[root] + 1) }
}
