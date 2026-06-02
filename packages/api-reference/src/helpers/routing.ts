import { type MaybeRefOrGetter, toValue } from 'vue'

import { getIdFromUrl, makeUrlFromId, matchesBasePath, redirectLegacyModelUrl } from './id-routing'

/**
 * Reactive routing context for the active document.
 *
 * Path routing, hash routing, and hash-base-path routing each store the navigation id in a
 * different place, and single-document mode omits the document slug from the URL. These options
 * capture that context once so call sites do not have to re-derive it.
 */
export type RoutingOptions = {
  /** Base path for the active document (`config.pathRouting?.basePath`). Hash routing when undefined. */
  basePath: MaybeRefOrGetter<string | undefined>
  /** Whether the workspace renders multiple documents — controls whether the doc slug appears in the URL. */
  isMultiDocument: MaybeRefOrGetter<boolean>
  /** Slug of the active document; prefixes ids when the slug is omitted from single-document URLs. */
  documentSlug: MaybeRefOrGetter<string>
  /** Slug of the models section, for the legacy `model/` → `models/` redirect. */
  modelsSectionSlug: MaybeRefOrGetter<string>
}

/**
 * Translates between the address bar and navigation ids for the active document.
 *
 * This is the in-house router for `@scalar/api-reference`: it owns URL ⇄ id translation and the
 * history writes, but deliberately not scrolling or intersection — reconciling the scroll position
 * with the URL stays with the component that orchestrates it.
 */
export type Routing = {
  /** The id encoded in `url` (defaults to the current location), normalized for the active document. */
  getId: (url?: string | URL) => string
  /** The URL that encodes `id`, or undefined during SSR. */
  getUrl: (id: string) => URL | undefined
  /** A canonicalized URL when `url` is a legacy `model/` link, otherwise null. */
  redirectLegacy: (url: string | URL) => URL | null
  /** Write `id` to the address bar with a new history entry; returns the new URL (undefined during SSR). */
  push: (id: string) => URL | undefined
  /** Write `id` to the address bar in place; returns the new URL (undefined during SSR). */
  replace: (id: string) => URL | undefined
  /** Subscribe to browser back/forward navigation. Returns an unsubscribe function. */
  onNavigate: (handler: (id: string) => void) => () => void
}

export const createRouting = (options: RoutingOptions): Routing => {
  // Multi-document URLs carry the slug already; single-document URLs need it added back.
  const slugPrefix = () => (toValue(options.isMultiDocument) ? undefined : toValue(options.documentSlug))

  const getId: Routing['getId'] = (url) => {
    if (url === undefined && typeof window === 'undefined') {
      return ''
    }

    return getIdFromUrl(url ?? window.location.href, toValue(options.basePath), slugPrefix())
  }

  const getUrl: Routing['getUrl'] = (id) =>
    makeUrlFromId(id, toValue(options.basePath), toValue(options.isMultiDocument))

  const redirectLegacy: Routing['redirectLegacy'] = (url) =>
    redirectLegacyModelUrl(
      url,
      toValue(options.modelsSectionSlug),
      toValue(options.documentSlug),
      toValue(options.isMultiDocument),
      toValue(options.basePath),
    )

  const push: Routing['push'] = (id) => {
    const url = getUrl(id)
    if (url) {
      window.history.pushState({}, '', url)
    }

    return url
  }

  const replace: Routing['replace'] = (id) => {
    const url = getUrl(id)
    if (url) {
      window.history.replaceState({}, '', url.toString())
    }

    return url
  }

  const onNavigate: Routing['onNavigate'] = (handler) => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const listener = () => handler(getId())
    window.addEventListener('popstate', listener)

    return () => window.removeEventListener('popstate', listener)
  }

  return { getId, getUrl, redirectLegacy, push, replace, onNavigate }
}

/**
 * Determines which document a URL points to on initial load.
 *
 * Path routing does not tell us up front which base path to expect, so we try each document's base
 * path until one matches, parse the id, and read the document slug from its first segment. Falls
 * back to an empty string when no slug can be derived (for example with plain hash routing).
 */
export const getDocumentSlugFromUrl = (
  url: string | URL,
  basePaths: (string | undefined)[],
  options: { isMultiDocument: boolean; activeSlug: string },
): string => {
  const matchedBasePath = basePaths.find((basePath) => (basePath ? matchesBasePath(url, basePath) : false))
  const id = getIdFromUrl(url, matchedBasePath, options.isMultiDocument ? undefined : options.activeSlug)

  return id.split('/')[0] ?? ''
}
