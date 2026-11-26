<script setup lang="ts">
import { ScalarIconPackage } from '@scalar/icons'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import { useGenerateSdkContext } from './use-generate-sdk'

/**
 * Generate SDK in the developer toolbar. Opens the Explore Scalar content, which uploads the active
 * document and signs the user up.
 *
 * Renders nothing unless the reference runs locally, see `useGenerateSdk`.
 */
const context = useGenerateSdkContext()
const { translate } = useLocalization()

/**
 * The button announces the dialog it opens. In the localhost shell it discloses the side panel
 * instead, which is not a popup, so it carries the panel's expanded state like the other toggles.
 */
const popupAttributes = computed(
  (): Record<string, string | boolean | undefined> => {
    const panel = context.value?.panel

    if (!panel?.active.value) {
      return { 'aria-haspopup': 'dialog' }
    }

    return {
      'aria-expanded': panel.expanded.value,
      'aria-controls': panel.expanded.value ? panel.id : undefined,
    }
  },
)
</script>
<template>
  <button
    v-if="context?.enabled.value"
    v-bind="popupAttributes"
    class="generate-sdk-button generate-sdk-button--toolbar"
    type="button"
    @click.stop="context.open()">
    <ScalarIconPackage
      aria-hidden="true"
      class="size-4" />
    {{ translate('sdk.generate') }}
  </button>
</template>
<style scoped>
/* Matches the panel toggles next to it in the developer toolbar: a 16px icon 8px from the label */
.generate-sdk-button {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  cursor: pointer;
  font-family: var(--scalar-font);
  border-radius: var(--scalar-radius-lg);
  outline-offset: 2px;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-4);
  line-height: 1;
  height: 32px;
  padding: 0 8px;
}
.generate-sdk-button:hover,
.generate-sdk-button[aria-expanded='true'] {
  color: var(--scalar-color-1);
  background: var(--scalar-background-3);
}
</style>
