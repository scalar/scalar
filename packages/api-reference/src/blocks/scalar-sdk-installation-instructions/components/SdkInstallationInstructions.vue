<script setup lang="ts">
import {
  ScalarCombobox,
  type ScalarComboboxOption,
} from '@scalar/components/combobox'
import { ScalarIcon } from '@scalar/components/icon'
import { ScalarMarkdown } from '@scalar/components/markdown'
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

const { xScalarSdkInstallation } = defineProps<{
  /** Custom SDK installation instructions from `x-scalar-sdk-installation` */
  xScalarSdkInstallation?: XScalarSdkInstallation['x-scalar-sdk-installation']
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

// Keep the selection in range and re-measure whenever the set of SDKs changes.
// Keying on the languages (not just the count) also catches documents that swap
// in a different set of the same size, which would otherwise leave the cached
// tab widths — and the "More" overflow logic — stale.
watch(
  () => sdks.value.map((sdk) => sdk.lang).join('\n'),
  () => {
    if (selectedIndex.value > sdks.value.length - 1) {
      selectedIndex.value = 0
    }
    void nextTick(measure)
  },
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
    selectedIndex.value = Number(option.id)
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
  selectedIndex.value = next
  focusTab(next)
}

let observer: ResizeObserver | undefined

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure())
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

onBeforeUnmount(() => observer?.disconnect())
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
          @click="selectedIndex = index"
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

      <!-- Hidden row used to measure the natural width of every tab -->
      <div
        ref="measureRef"
        aria-hidden="true"
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
  overflow: hidden;
  padding: 0 12px;
  background-color: var(--scalar-background-1);
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.client-libraries-row {
  display: flex;
  justify-content: flex-start;
}
/* Off-screen row used only to measure natural tab widths */
.client-libraries-row--measure {
  position: absolute;
  top: 0;
  left: 0;
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
