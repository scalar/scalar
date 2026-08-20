<script setup lang="ts">
/**
 * A crawler-only list of links to every entry in the navigation tree.
 *
 * The interactive sidebar keeps the children of collapsed groups out of the DOM, so
 * server-rendered HTML only contains the sections that happen to be expanded (by default
 * just the first tag). Crawlers do not run the JavaScript that expands groups, which
 * would leave operations and models inside collapsed tags undiscoverable. This component
 * renders a flat, hidden list of plain anchors so every URL is present in the HTML payload.
 *
 * Plain `<li><a>` markup keeps the per-entry cost to roughly one line of HTML — far
 * cheaper than server-rendering the real sidebar components for every entry.
 *
 * The parent unmounts this component right after hydration (see ApiReference.vue), so it
 * never affects the interactive experience.
 *
 * Scope: this mirrors the sidebar, which shows one document at a time, so `items` is the
 * active document's tree. In multi-document mode the other documents' deep links are not
 * exposed here — a crawler still has to reach each document's own URL first. Widening this
 * to every document would need each document's own `basePath`, so it is left for later.
 */
import { filterItems, type SidebarOptions } from '@scalar/sidebar'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { makeHrefFromId } from '@/helpers/id-routing'

const { items, basePath, isMultiDocument, options } = defineProps<{
  /** The navigation tree of the active document, as passed to the sidebar. */
  items: TraversedEntry[]
  /** The base path used in path routing. */
  basePath?: string
  /** Whether the reference renders multiple documents (keeps the document slug in URLs). */
  isMultiDocument: boolean
  /**
   * The same options object passed to the interactive sidebar. Only the filtering-related
   * fields are read (see `filterItems`), but taking the whole object keeps this list wired
   * to the exact source the sidebar uses so the two cannot expose a different set of entries.
   */
  options?: SidebarOptions
}>()

type CrawlerLink = {
  id: string
  href: string
  title: string
}

/**
 * Flattens the navigation tree into links, applying the same filtering as the
 * interactive sidebar so both expose the same set of entries.
 */
const links = computed<CrawlerLink[]>(() => {
  const result: CrawlerLink[] = []

  const walk = (entries: TraversedEntry[]): void => {
    for (const entry of filterItems(
      'reference',
      entries,
      options?.hideOperationDefaultExamples,
    )) {
      const href = makeHrefFromId(entry.id, basePath, isMultiDocument)

      if (href) {
        result.push({ id: entry.id, href, title: entry.title })
      }

      if ('children' in entry && entry.children) {
        walk(entry.children)
      }
    }
  }

  walk(items)

  return result
})
</script>
<template>
  <nav
    v-if="links.length > 0"
    aria-hidden="true"
    data-scalar-crawler-nav
    hidden>
    <ul>
      <li
        v-for="link in links"
        :key="link.id">
        <a :href="link.href">{{ link.title }}</a>
      </li>
    </ul>
  </nav>
</template>
