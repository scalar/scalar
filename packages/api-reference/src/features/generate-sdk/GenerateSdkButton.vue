<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'

import { useLocalization } from '@/features/localization'

import { useGenerateSdkContext } from './use-generate-sdk'

/**
 * Opens the Explore Scalar dialog, which uploads the active document and signs the user up.
 *
 * Renders nothing unless the reference runs locally, see `useGenerateSdk`.
 */
const { variant = 'card' } = defineProps<{
  /**
   * Where the button sits:
   * - `toolbar`: the developer tools header, matches the popover triggers next to it
   * - `card`: the client libraries card header, matches the "Authorize via OAuth2" button
   * - `footer`: the start of the request example footer, matches the "Ask AI Agent" chip there
   */
  variant?: 'toolbar' | 'card' | 'footer'
}>()

const context = useGenerateSdkContext()
const { translate } = useLocalization()
</script>
<template>
  <!-- Same size, variant and classes as "Authorize via OAuth2" in the authentication card -->
  <ScalarButton
    v-if="context?.enabled.value && variant === 'card'"
    aria-haspopup="dialog"
    class="text-c-1 px-3 py-1"
    size="sm"
    variant="gradient"
    @click.stop="context.open()">
    {{ translate('sdk.generate') }}
  </ScalarButton>
  <button
    v-else-if="context?.enabled.value"
    aria-haspopup="dialog"
    class="generate-sdk-button"
    :class="`generate-sdk-button--${variant}`"
    type="button"
    @click.stop="context.open()">
    {{ translate('sdk.generate') }}
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

/*
 * Start of the request example footer: a quiet 24px button sized like the "Ask AI Agent" chip on
 * the other end. The height is fixed because the classic layout has no other footer controls to
 * stretch it.
 */
.generate-sdk-button--footer {
  color: var(--scalar-color-2);
  background: transparent;
  font-size: inherit;
  font-weight: var(--scalar-semibold);
  line-height: inherit;
  padding: 1px 6px;
  height: 24px;
  margin-inline-end: 4px;
}
.generate-sdk-button--footer:hover {
  background: var(--scalar-background-2);
}
</style>
