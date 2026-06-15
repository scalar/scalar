<script setup lang="ts">
import { getCustomClientIds } from '@scalar/blocks/code-example'
import {
  ScalarCombobox,
  type ScalarComboboxOption,
} from '@scalar/components/combobox'
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue'

import { getLanguageIcon } from '../helpers/language-icon'
import { getRenderableSdks } from '../helpers/renderable-sdks'
import { getVisibleTabCount } from '../helpers/visible-tab-count'

const { xScalarSdkInstallation, selectedClient, eventBus } = defineProps<{
  /** Custom SDK installation instructions from `x-scalar-sdk-installation` */
  xScalarSdkInstallation?: XScalarSdkInstallation['x-scalar-sdk-installation']
  /**
   * The globally selected client id. When it matches one of the SDK languages
   * (as a `custom/<lang>` id) the matching tab is shown as active, keeping the
   * tabs in sync with the operation code samples.
   */
  selectedClient?: string
  /**
   * Event bus used to broadcast the selected client. Picking a language here
   * switches the operation code samples to that language's custom example, the
   * same channel the generic client selector uses.
   */
  eventBus?: WorkspaceEventBus
}>()

const headingId = useId()
/** Base id used to associate each tab with the shared panel for assistive tech */
const baseId = useId()
const panelId = `${baseId}-panel`

/** Only the SDKs that actually have something to show, with their resolved icon */
const sdks = computed(() =>
  getRenderableSdks(xScalarSdkInstallation).map((sdk) => ({
    ...sdk,
    icon: getLanguageIcon(sdk.lang),
  })),
)

/** Index of the currently selected SDK */
const selectedIndex = ref(0)

/** The currently selected SDK */
const selected = computed(() => sdks.value[selectedIndex.value])

/**
 * The `custom/<lang>` client id for each SDK, aligned by index with `sdks`.
 *
 * We reuse the exact id scheme the operation code samples use for their custom
 * examples, so selecting a language here resolves to the same id those samples
 * are keyed by — that shared id is what keeps the two surfaces in sync.
 */
const sdkClientIds = computed(() =>
  getCustomClientIds(sdks.value.map((sdk) => ({ lang: sdk.lang, source: '' }))),
)

/** Select an SDK by index and broadcast it so the operation code samples follow */
const select = (index: number) => {
  selectedIndex.value = index

  const id = sdkClientIds.value[index]
  if (id) {
    eventBus?.emit('workspace:update:selected-client', id)
  }
}

// Keep the active tab aligned with the global selection, re-evaluating whenever
// either the selection or the available SDKs change. Watching `sdkClientIds`
// (not just `selectedClient`) is what stops the intro tab and the operation
// samples from disagreeing after the SDK list is reordered or resized: the tab
// follows the selected language to its new position. When the selection is a
// built-in client (or a language this document has no install entry for) we keep
// the current tab, only clamping it back into range if the list shrank past it.
watch(
  [() => selectedClient, sdkClientIds],
  ([client, ids]) => {
    const matched = client ? ids.findIndex((id) => id === client) : -1

    if (matched >= 0) {
      selectedIndex.value = matched
    } else if (selectedIndex.value > ids.length - 1) {
      selectedIndex.value = 0
    }
  },
  { immediate: true },
)

// Re-measure whenever the set of SDKs changes. Keying on the languages (not just
// the count) also catches documents that swap in a different set of the same
// size, which would otherwise leave the cached tab widths — and the "More"
// overflow logic — stale.
watch(
  () => sdks.value.map((sdk) => sdk.lang).join('\n'),
  () => void nextTick(measure),
)

const tabsRef = ref<HTMLElement>()
const measureRef = ref<HTMLElement>()

/** The width available to render the tabs in */
const availableWidth = ref(0)
/** The natural width of each tab */
const tabWidths = ref<number[]>([])
/** The width of the "More" dropdown trigger */
const moreWidth = ref(0)

/** Measure the available width and the natural width of each tab */
const measure = () => {
  const measureEl = measureRef.value
  const tabsEl = tabsRef.value

  if (!measureEl || !tabsEl) {
    return
  }

  // The measuring row renders every tab followed by the "More" trigger
  const widths = Array.from(measureEl.children).map(
    (child) => (child as HTMLElement).offsetWidth,
  )

  tabWidths.value = widths.slice(0, sdks.value.length)
  moreWidth.value = widths[sdks.value.length] ?? 0
  availableWidth.value = tabsEl.clientWidth
}

/** How many tabs fit inline before we need the "More" dropdown */
const visibleCount = computed(() => {
  // Until we have measured, render everything (also the server-rendered state)
  if (!tabWidths.value.length || availableWidth.value <= 0) {
    return sdks.value.length
  }

  return getVisibleTabCount(
    tabWidths.value,
    availableWidth.value,
    moreWidth.value,
  )
})

/** The SDKs shown as inline tabs */
const visibleSdks = computed(() => sdks.value.slice(0, visibleCount.value))

/** Whether the selected SDK lives in the "More" dropdown */
const isMoreActive = computed(() => selectedIndex.value >= visibleCount.value)

/** The overflowing SDKs as combobox options, keyed by their original index */
const moreOptions = computed<ScalarComboboxOption[]>(() =>
  sdks.value.slice(visibleCount.value).map((sdk, index) => ({
    id: String(visibleCount.value + index),
    label: sdk.lang,
  })),
)

/** The selected option within the "More" dropdown, if any */
const selectedMoreOption = computed(() =>
  moreOptions.value.find((option) => option.id === String(selectedIndex.value)),
)

const selectMore = (option: ScalarComboboxOption | undefined) => {
  if (option) {
    select(Number(option.id))
  }
}

/** The id of the tab that labels the panel (falls back to the heading when the selection lives in "More") */
const activeTabId = computed(() =>
  isMoreActive.value ? headingId : `${baseId}-tab-${selectedIndex.value}`,
)

/**
 * The visible tab that holds the roving tabindex. When the selection lives in
 * the "More" dropdown, that trigger is the tab stop instead, so no inline tab
 * should be focusable.
 */
const tabStopIndex = computed(() =>
  isMoreActive.value ? -1 : selectedIndex.value,
)

/** Focus a visible tab by index after the DOM has settled */
const focusTab = (index: number) => {
  void nextTick(() => {
    tabsRef.value
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [index]?.focus()
  })
}

/** Arrow / Home / End keyboard navigation across the visible tabs (WAI-ARIA tabs pattern) */
const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const lastVisible = visibleCount.value - 1

  let next = index
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = index >= lastVisible ? 0 : index + 1
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = index <= 0 ? lastVisible : index - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = lastVisible
      break
    default:
      return
  }

  event.preventDefault()
  select(next)
  focusTab(next)
}

let observer: ResizeObserver | undefined
let frame = 0

/** Coalesce resize bursts into a single measure before the next paint */
const scheduleMeasure = () => {
  if (typeof requestAnimationFrame === 'undefined') {
    measure()
    return
  }
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(measure)
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(scheduleMeasure)
    // Observe the visible row for the available width, and the hidden measure
    // row for the natural tab widths. The latter catches changes the container
    // never sees — web fonts loading, or labels changing without the count
    // changing — which would otherwise leave the overflow logic stale.
    if (tabsRef.value) {
      observer.observe(tabsRef.value)
    }
    if (measureRef.value) {
      observer.observe(measureRef.value)
    }
  }
  measure()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(frame)
  }
})
</script>
<template>
  <div v-if="sdks.length">
    <div
      :id="headingId"
      class="client-libraries-heading">
      Client Libraries
    </div>

    <!-- Tabs -->
    <div class="client-libraries-content">
      <div
        ref="tabsRef"
        :aria-labelledby="headingId"
        class="client-libraries-row"
        role="tablist">
        <button
          v-for="(sdk, index) in visibleSdks"
          :id="`${baseId}-tab-${index}`"
          :key="index"
          :aria-controls="panelId"
          :aria-selected="index === selectedIndex"
          class="client-libraries"
          :class="{ 'client-libraries__active': index === selectedIndex }"
          role="tab"
          :tabindex="index === tabStopIndex ? 0 : -1"
          type="button"
          @click="select(index)"
          @keydown="onTabKeydown($event, index)">
          <ScalarIcon
            v-if="sdk.icon"
            class="client-libraries-icon"
            :icon="sdk.icon" />
          <span class="client-libraries-text">{{ sdk.lang }}</span>
        </button>

        <!-- More dropdown -->
        <ScalarCombobox
          v-if="visibleCount < sdks.length"
          :modelValue="selectedMoreOption"
          :options="moreOptions"
          placement="bottom-end"
          teleport
          @update:modelValue="selectMore">
          <button
            class="client-libraries client-libraries-more"
            :class="{ 'client-libraries__active': isMoreActive }"
            type="button">
            <ScalarIcon
              class="client-libraries-icon"
              :icon="
                isMoreActive && selected?.icon ? selected.icon : 'Ellipses'
              " />
            <span class="client-libraries-text">More</span>
          </button>
        </ScalarCombobox>
      </div>

      <!-- Hidden row used to measure the natural width of every tab. It is
           clipped to a zero-size box so it never contributes to the scrollable
           width of the (horizontally scrollable) row above. -->
      <div
        aria-hidden="true"
        class="client-libraries-measure-clip">
        <div
          ref="measureRef"
          class="client-libraries-row client-libraries-row--measure">
          <span
            v-for="(sdk, index) in sdks"
            :key="index"
            class="client-libraries">
            <ScalarIcon
              v-if="sdk.icon"
              class="client-libraries-icon"
              :icon="sdk.icon" />
            <span class="client-libraries-text">{{ sdk.lang }}</span>
          </span>
          <span class="client-libraries">
            <ScalarIcon
              class="client-libraries-icon"
              icon="Ellipses" />
            <span class="client-libraries-text">More</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Content: Markdown installation instructions (supports code blocks) -->
    <div
      v-if="selected?.description"
      :id="panelId"
      :aria-labelledby="activeTabId"
      class="selected-client"
      role="tabpanel"
      tabindex="0">
      <ScalarMarkdown :value="selected.description" />
    </div>
  </div>
</template>
<style scoped>
/* One panel holds the Markdown installation instructions */
.selected-client {
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: var(--scalar-color-1);
  font-size: var(--scalar-small);
  padding: 9px 12px;
  background: var(--scalar-background-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-top: none;
  border-bottom-left-radius: var(--scalar-radius-xl);
  border-bottom-right-radius: var(--scalar-radius-xl);
}
.client-libraries-heading {
  font-size: var(--scalar-small);
  font-weight: var(--scalar-font-medium);
  color: var(--scalar-color-1);
  padding: 9px 12px;
  background-color: var(--scalar-background-2);
  display: flex;
  align-items: center;
  max-height: 32px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-top-left-radius: var(--scalar-radius-xl);
  border-top-right-radius: var(--scalar-radius-xl);
}
.client-libraries-content {
  position: relative;
  /*
   * Scroll horizontally rather than clip: before JS measures the tab widths
   * (and without JS at all) every tab is rendered, so overflowing tabs must
   * stay reachable. Once measured, the "More" dropdown absorbs the overflow and
   * no scrollbar is shown. The bar itself is hidden — keyboard focus and touch
   * still scroll clipped tabs into view.
   */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  padding: 0 12px;
  background-color: var(--scalar-background-1);
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.client-libraries-content::-webkit-scrollbar {
  display: none;
}
.client-libraries-row {
  display: flex;
  justify-content: flex-start;
}
/* Zero-size clip so the measure row never adds to the scrollable width */
.client-libraries-measure-clip {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}
/* Off-screen row used only to measure natural tab widths */
.client-libraries-row--measure {
  width: max-content;
  visibility: hidden;
  pointer-events: none;
}
.client-libraries {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  /* Keep tabs at their natural (measured) width so they scroll rather than squish */
  flex-shrink: 0;
  padding: 8px 12px;
  gap: 6px;
  color: var(--scalar-color-3);
  border-bottom: 1px solid transparent;
  background: transparent;
  user-select: none;
}
.client-libraries:not(.client-libraries__active):hover:before {
  content: '';
  position: absolute;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background: var(--scalar-background-2);
  left: 2px;
  top: 2px;
  z-index: 0;
  border-radius: var(--scalar-radius);
}
.client-libraries:active {
  color: var(--scalar-color-1);
}
.client-libraries:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--scalar-color-accent);
}
.client-libraries__active {
  color: var(--scalar-color-1);
  border-bottom: 1px solid var(--scalar-color-1);
}
/* Always pin the "More" dropdown to the right edge */
.client-libraries-more {
  margin-left: auto;
}
.client-libraries-icon {
  max-width: 14px;
  max-height: 14px;
  min-width: 14px;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  color: currentColor;
}
.client-libraries .client-libraries-text {
  font-size: var(--scalar-small);
  position: relative;
  display: flex;
  align-items: center;
}
.client-libraries__active .client-libraries-text {
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}
</style>
