<script lang="ts">
/**
 * "What's new" modal for the API client.
 *
 * Surfaces a curated, user-facing list of recent releases (Linear-style)
 * so users can catch up on what changed without leaving the app. The
 * release content itself is bundled with the package via
 * `data/release-notes.ts`; this component just renders it.
 *
 * Behaviour notes:
 * - We render the most recent `INITIAL_VISIBLE_COUNT` entries up front and
 *   reveal the rest in `LOAD_MORE_INCREMENT`-sized batches when the user
 *   clicks "Show older releases". This keeps the modal scannable while
 *   still letting power users dig into the back catalog.
 * - When the modal opens we mark the latest release as seen so the
 *   "unseen" dot on the trigger goes away. The expanded count is reset to
 *   the initial value so each open feels predictable.
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarButton, ScalarModal, type ModalState } from '@scalar/components'
import { ScalarIconArrowSquareOut, ScalarIconSparkle } from '@scalar/icons'
import { computed, ref, watch } from 'vue'

import { useWhatsNew } from '../hooks/use-whats-new'

const { state } = defineProps<{
  state: ModalState
}>()

/** How many entries to show on first open. */
const INITIAL_VISIBLE_COUNT = 5

/** How many additional entries to reveal per "Show older releases" click. */
const LOAD_MORE_INCREMENT = 5

const { notes, markAllSeen } = useWhatsNew()

const visibleCount = ref<number>(INITIAL_VISIBLE_COUNT)

/** Slice of notes that should currently be rendered. */
const visibleNotes = computed(() => notes.value.slice(0, visibleCount.value))

/** Whether there are still hidden entries the user could load. */
const hasMore = computed(() => visibleCount.value < notes.value.length)

/**
 * Format an ISO date string (`YYYY-MM-DD`) as a localized, human-readable
 * date such as `April 25, 2026`. Falls back to the raw string if parsing
 * fails so a malformed entry never crashes the modal.
 *
 * Date-only strings are parsed as UTC midnight per the ECMAScript spec.
 * Formatting with the user's default locale but `timeZone: 'UTC'` keeps the
 * calendar day aligned with the release note (otherwise Americas/Pacific
 * timezones would show the previous day).
 */
const formatDate = (iso: string): string => {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return iso
  }
  return parsed.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const showMore = (): void => {
  visibleCount.value = Math.min(
    notes.value.length,
    visibleCount.value + LOAD_MORE_INCREMENT,
  )
}

/**
 * Reset visible count and persist "seen" state every time the modal opens.
 * We do this on open (not on close) so the dot on the trigger disappears
 * immediately when the user acknowledges the entries.
 */
watch(
  () => state.open,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    visibleCount.value = INITIAL_VISIBLE_COUNT
    markAllSeen()
  },
)
</script>

<template>
  <ScalarModal
    bodyClass="flex flex-col overflow-hidden p-0"
    size="md"
    :state="state">
    <header class="flex items-center gap-3 px-5 pt-4 pb-3">
      <span
        aria-hidden="true"
        class="bg-b-2 text-c-accent flex size-8 items-center justify-center rounded-full">
        <ScalarIconSparkle
          class="size-4"
          weight="bold" />
      </span>
      <div class="flex flex-col">
        <p class="text-c-1 text-sm font-medium">What's new</p>
        <p class="text-c-3 text-xs">Recent updates to the Scalar API Client.</p>
      </div>
    </header>

    <div
      v-if="visibleNotes.length === 0"
      class="text-c-3 px-5 pb-5 text-sm">
      No release notes yet. Check back after the next update.
    </div>

    <ol
      v-else
      class="flex min-h-0 flex-1 flex-col divide-y divide-(--scalar-border-color) overflow-y-auto">
      <li
        v-for="note in visibleNotes"
        :key="note.version"
        class="flex flex-col gap-2 px-5 py-4">
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-c-1 text-sm font-semibold">
            {{ note.title }}
          </h3>
          <span class="text-c-3 shrink-0 text-xs tabular-nums">
            {{ formatDate(note.date) }}
          </span>
        </div>
        <div class="text-c-3 flex items-center gap-2 text-xs">
          <span
            class="bg-b-2 text-c-2 rounded px-1.5 py-0.5 font-mono text-[10px] leading-none">
            v{{ note.version }}
          </span>
        </div>
        <p
          v-if="note.description"
          class="text-c-2 text-sm leading-relaxed">
          {{ note.description }}
        </p>
        <ul
          v-if="note.highlights && note.highlights.length > 0"
          class="text-c-2 ml-4 flex list-disc flex-col gap-1 text-sm leading-relaxed">
          <li
            v-for="(highlight, index) in note.highlights"
            :key="index">
            {{ highlight }}
          </li>
        </ul>
        <div v-if="note.href">
          <a
            class="text-c-accent inline-flex items-center gap-1 text-xs hover:underline"
            :href="note.href"
            rel="noopener noreferrer"
            target="_blank">
            Read full release notes
            <ScalarIconArrowSquareOut
              class="size-3"
              weight="bold" />
          </a>
        </div>
      </li>
    </ol>

    <footer
      v-if="hasMore"
      class="flex items-center justify-center border-t border-(--scalar-border-color) px-5 py-3">
      <ScalarButton
        size="sm"
        variant="ghost"
        @click="showMore">
        Show older releases
      </ScalarButton>
    </footer>
  </ScalarModal>
</template>
