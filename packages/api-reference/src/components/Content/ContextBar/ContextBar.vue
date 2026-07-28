<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed } from 'vue'

/** A single ancestor in the tag hierarchy leading to the section in view. */
type Crumb = { id: string; title: string }

const { chain } = defineProps<{
  /** Ancestor tags from root to the section currently in view (inclusive). */
  chain: Crumb[]
}>()

const emit = defineEmits<{
  navigate: [id: string]
}>()

/**
 * How many crumbs to keep before collapsing the middle. Deeply nested tags can
 * go arbitrarily deep, so we keep the root plus the tail (immediate parent and
 * current section) and fold everything in between into a single ellipsis.
 */
const MAX_CRUMBS = 4

/** A placeholder crumb standing in for the hidden middle of a long chain. */
type EllipsisCrumb = { ellipsis: true; hiddenTitles: string[] }

const isEllipsis = (crumb: Crumb | EllipsisCrumb): crumb is EllipsisCrumb =>
  'ellipsis' in crumb

/**
 * The crumbs actually rendered. Short chains show in full; long ones collapse to
 * `first … secondLast last` so the bar never outgrows a single line.
 */
const displayCrumbs = computed<(Crumb | EllipsisCrumb)[]>(() => {
  if (chain.length <= MAX_CRUMBS) {
    return chain
  }

  const head = chain[0]
  const tail = chain.slice(chain.length - (MAX_CRUMBS - 2))
  const hidden = chain.slice(1, chain.length - (MAX_CRUMBS - 2))

  return [
    ...(head ? [head] : []),
    { ellipsis: true, hiddenTitles: hidden.map((crumb) => crumb.title) },
    ...tail,
  ]
})

/** The last crumb is the section in view, so it is shown as plain text. */
const isCurrent = (index: number) => index === displayCrumbs.value.length - 1

/**
 * Jump to an ancestor section when its crumb is clicked.
 *
 * The event is named `navigate` rather than `select` on purpose: `select` is a
 * native DOM event, so a component emit of the same name gets tangled up with
 * event fallthrough and never reaches listeners.
 */
const onCrumbClick = (id: string) => emit('navigate', id)
</script>

<template>
  <!-- Only meaningful when a section is actually nested under a parent tag -->
  <nav
    v-if="chain.length >= 2"
    aria-label="Breadcrumb"
    class="bg-b-1 text-c-2 sticky top-(--refs-header-height) z-1 -mx-1 flex items-center gap-1 border-b px-1 py-2 text-sm">
    <template
      v-for="(crumb, index) in displayCrumbs"
      :key="isEllipsis(crumb) ? `ellipsis-${index}` : crumb.id">
      <ScalarIconCaretRight
        v-if="index > 0"
        class="text-c-3 size-2.5 shrink-0"
        weight="bold" />

      <!-- Collapsed middle of a long chain -->
      <span
        v-if="isEllipsis(crumb)"
        class="text-c-3 shrink-0"
        :title="crumb.hiddenTitles.join(' › ')">
        …
      </span>

      <!-- Current section: plain text, not a link -->
      <span
        v-else-if="isCurrent(index)"
        aria-current="page"
        class="text-c-1 truncate font-medium">
        {{ crumb.title }}
      </span>

      <!-- Ancestor: click to jump to that section -->
      <button
        v-else
        class="hover:text-c-1 shrink-0 cursor-pointer truncate whitespace-nowrap transition-colors"
        type="button"
        @click="onCrumbClick(crumb.id)">
        {{ crumb.title }}
      </button>
    </template>
  </nav>
</template>
