<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
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
   * - `card`: the client libraries card header, matches the "Authorize via OAuth2" button
   * - `code`: inline in the dark request example header, next to the client picker
   */
  variant?: 'toolbar' | 'card' | 'code'
}>()

const context = useGenerateSdkContext()
const { translate } = useLocalization()
const { toast } = useToasts()

/** Spinner for the card variant, like the OAuth2 button it sits next to */
const loader = useLoadingState()

const handleClick = async () => {
  // Ignore repeat clicks while an upload runs, otherwise they would clear the spinner early
  if (loader.isLoading || context.value?.isGenerating.value) {
    return
  }

  loader.start()
  const result = await context.value?.generate()
  await loader.clear()

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
  <!-- Same size, variant and classes as "Authorize via OAuth2" in the authentication card -->
  <ScalarButton
    v-if="context?.enabled.value && variant === 'card'"
    :aria-busy="context.isGenerating.value"
    class="text-c-1 px-3 py-1"
    :loader
    size="sm"
    variant="gradient"
    @click.stop="handleClick">
    {{ translate('sdk.generate') }}
  </ScalarButton>
  <button
    v-else-if="context?.enabled.value"
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
