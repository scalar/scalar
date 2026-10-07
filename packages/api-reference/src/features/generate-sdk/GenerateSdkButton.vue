<script setup lang="ts">
import { ScalarIconArrowUpRight } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'

import { useLocalization } from '@/features/localization'

import { useGenerateSdkContext } from './use-generate-sdk'

/**
 * Opens the Scalar dashboard to generate an SDK for the active document.
 *
 * Renders nothing unless the reference runs locally, see `useGenerateSdk`.
 */
const { variant = 'card' } = defineProps<{
  /**
   * Where the button sits:
   * - `toolbar`: the developer tools header, matches the popover triggers next to it
   * - `card`: a full-width row under the client libraries card
   * - `code`: inline in the dark request example header, next to the client picker
   */
  variant?: 'toolbar' | 'card' | 'code'
}>()

const context = useGenerateSdkContext()
const { translate } = useLocalization()
const { toast } = useToasts()

const handleClick = async () => {
  const result = await context.value?.generate()

  if (!result || result.ok) {
    return
  }

  if (result.reason === 'export-failed') {
    toast(translate('developerTools.unableToExportDocument'), 'error')
    return
  }

  toast(result.message ?? translate('developerTools.unknownError'), 'error')
}
</script>
<template>
  <button
    v-if="context?.enabled.value"
    :aria-busy="context.isGenerating.value"
    class="generate-sdk-button"
    :class="`generate-sdk-button--${variant}`"
    type="button"
    @click.stop="handleClick">
    <span>{{ translate('sdk.generate') }}</span>
    <ScalarIconArrowUpRight
      class="generate-sdk-button-icon"
      weight="bold" />
  </button>
</template>
<style scoped>
.generate-sdk-button {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  cursor: pointer;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  line-height: 1.385;
  border-radius: var(--scalar-radius);
  outline-offset: 2px;
}
.generate-sdk-button[aria-busy='true'] {
  cursor: progress;
  opacity: 0.7;
}
.generate-sdk-button-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* Developer tools header */
.generate-sdk-button--toolbar {
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  line-height: 1;
  padding: 9px 8px;
}
.generate-sdk-button--toolbar:hover {
  color: var(--scalar-color-1);
  background: var(--scalar-background-2);
}

/* Row under the client libraries card */
.generate-sdk-button--card {
  width: 100%;
  justify-content: center;
  color: var(--scalar-color-1);
  font-weight: var(--scalar-font-medium);
  padding: 9px 12px;
  background: var(--scalar-background-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-top: none;
  border-radius: 0 0 var(--scalar-radius-xl) var(--scalar-radius-xl);
}
.generate-sdk-button--card:hover {
  background: var(--scalar-background-2);
}
.generate-sdk-button--card:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--scalar-color-accent);
}

/* Inline in the request example header, beside the client picker */
.generate-sdk-button--code {
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-regular);
  padding: 0 6px;
  margin-right: 6px;
  height: 100%;
}
.generate-sdk-button--code:hover {
  color: var(--scalar-color-1);
}
</style>
