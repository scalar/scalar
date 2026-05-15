import Fuse from 'fuse.js'

/** Fuse tuning for the sidebar title filter (lightweight jump-to-document UX). */
export const SIDEBAR_TITLE_FUSE_OPTIONS = {
  keys: ['title'],
  threshold: 0.3,
  ignoreLocation: true,
}

/**
 * Fuzzy-matches `items` by `title` using the same settings as the sidebar.
 * Whitespace-only queries behave like an empty query and return `items` unchanged.
 */
export const filterItemsByTitle = <T extends { title: string }>(items: T[], query: string): T[] => {
  const trimmed = query.trim()
  if (!trimmed) {
    return items
  }
  return new Fuse(items, SIDEBAR_TITLE_FUSE_OPTIONS).search(trimmed).map((result) => result.item)
}
