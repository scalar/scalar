<script setup lang="ts">
import { Tab } from '@headlessui/vue'
import { ScalarCombobox, ScalarIcon } from '@scalar/components'
import { freezeElement } from '@scalar/helpers/dom/freeze-element'
import type { AvailableClients, TargetId } from '@scalar/types/snippetz'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import { computed, ref } from 'vue'

import { isFeaturedClient } from '@/v2/blocks/scalar-client-selector-block/helpers/featured-clients'
import { findClient } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import type {
  ClientOption,
  ClientOptionGroup,
} from '@/v2/blocks/scalar-request-example-block/types'

const { xSelectedClient } = defineProps<{
  /** Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client */
  xSelectedClient?: AvailableClients[number]
  /** List of featured clients */
  featuredClients: ClientOption[]
  /** The id of the tab panel that contains for the non featured clients */
  morePanel?: string
}>()

const containerRef = ref<HTMLElement>()

/**
 * Icons have longer names to appear in icon searches, e.g. "javascript-js" instead of just "javascript". This function
 * maps the language key to the icon name.
 */
const getIconByLanguageKey = (targetKey: TargetId) =>
  `programming-language-${targetKey === 'js' ? 'javascript' : targetKey}` as const

/** Set custom example, or update the selected HTTP client globally */
const selectClient = (option: ClientOption) => {
  if (!containerRef.value) {
    return
  }

  // We need to freeze the ui to prevent scrolling as the clients change
  const unfreeze = freezeElement(containerRef.value)
  setTimeout(() => {
    unfreeze()
  }, 300)

  // Update the store
  emitCustomEvent(
    containerRef.value,
    'scalar-update-selected-client',
    option.id,
  )
}

/** Calculates the targetKey from the selected client id */
const selectedTargetKey = computed(
  () => xSelectedClient?.split('/')[0] as TargetId | undefined,
)
</script>
<template>
  <div
    ref="containerRef"
    class="client-libraries-content">
    <Tab
      v-for="featuredClient in featuredClients"
      :key="featuredClient.clientKey"
      class="client-libraries rendered-code-sdks"
      :class="{
        'client-libraries__active': featuredClient.id === xSelectedClient,
      }">
      <div :class="`client-libraries-icon__${featuredClient.targetKey}`">
        <ScalarIcon
          class="client-libraries-icon"
          :icon="getIconByLanguageKey(featuredClient.targetKey)" />
      </div>
      <span class="client-libraries-text">{{
        featuredClient.targetTitle
      }}</span>
    </Tab>

    <!-- Client Dropdown -->
    <ScalarCombobox
      :options="clientOptions"
      :modelValue="findClient(clientOptions, xSelectedClient)"
      @update:modelValue="selectClient($event as ClientOption)"
      placement="bottom-end"
      teleport>
      <button
        class="client-libraries client-libraries__select"
        :class="{
          'client-libraries__active':
            xSelectedClient && !isFeaturedClient(xSelectedClient),
        }">
        <div
          aria-hidden="true"
          class="client-libraries-icon__more">
          <template
            v-if="xSelectedClient && !isFeaturedClient(xSelectedClient)">
            <div :class="`client-libraries-icon__${selectedTargetKey}`">
              <ScalarIcon
                class="client-libraries-icon"
                v-if="selectedTargetKey"
                :icon="getIconByLanguageKey(selectedTargetKey)" />
            </div>
          </template>
          <template v-else>
            <svg
              class="client-libraries-icon"
              height="50"
              role="presentation"
              viewBox="0 0 50 50"
              width="50"
              xmlns="http://www.w3.org/2000/svg">
              <g
                fill="currentColor"
                fill-rule="nonzero">
                <path
                  d="M10.71 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M21.13 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M31.55 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0" />
              </g>
            </svg>
          </template>
        </div>
        <span
          v-if="clientOptions.length"
          class="client-libraries-text client-libraries-text-more">
          More
        </span>
        <span class="sr-only">Select from all clients</span>
      </button>
    </ScalarCombobox>
  </div>
</template>
<style scoped>
.client-libraries-content {
  container: client-libraries-content / inline-size;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 0 12px;
  background-color: var(--scalar-background-1);
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
}
.client-libraries {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 2px;
  gap: 6px;
  color: var(--scalar-color-3);
  border-bottom: 1px solid transparent;
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
/* remove php and c on mobile */
@media screen and (max-width: 450px) {
  .client-libraries:nth-of-type(4),
  .client-libraries:nth-of-type(5) {
    display: none;
  }
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
.client-libraries-icon__more svg {
  height: initial;
}
@container client-libraries-content (width < 400px) {
  .client-libraries__select {
    width: fit-content;

    .client-libraries-icon__more + span {
      display: none;
    }
  }
}
@container client-libraries-content (width < 380px) {
  .client-libraries {
    width: 100%;
  }
  .client-libraries span {
    display: none;
  }
}
.client-libraries__active {
  color: var(--scalar-color-1);
  border-bottom: 1px solid var(--scalar-color-1);
}
@keyframes codeloader {
  0% {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(1turn);
  }
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
@media screen and (max-width: 600px) {
  .references-classic .client-libraries {
    flex-direction: column;
  }
}
</style>
