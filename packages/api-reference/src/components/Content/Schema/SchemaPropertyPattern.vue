<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import { useLocalization } from '@/features/localization'

defineProps<{ pattern: string }>()

const { copyToClipboard } = useClipboard()
const { translate } = useLocalization()
</script>
<template>
  <div class="property-pattern">
    <LinkButton class="decoration-dotted">
      {{ translate('common.pattern') }}
    </LinkButton>
    <div class="property-pattern-popup">
      <button
        class="property-pattern-value group"
        type="button"
        @click="copyToClipboard(pattern)">
        <code>{{ pattern }}</code>
        <ScalarIcon
          class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3"
          icon="Clipboard"
          size="xs" />
      </button>
    </div>
  </div>
</template>
<style scoped>
@reference "../../../style.css";

.property-pattern {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-mini);
  position: relative;
}

.property-pattern-popup {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  background-color: var(--scalar-background-1);
  box-shadow: var(--scalar-shadow-1);
  border-radius: var(--scalar-radius-lg);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 9px;
  min-width: 200px;
  max-width: 500px;
  display: none;
  @apply z-context;
}

.property-pattern:hover .property-pattern-popup,
.property-pattern:focus-within .property-pattern-popup {
  display: flex;
}

.property-pattern-value {
  font-family: var(--scalar-font-code);
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px;
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}

.property-pattern-value code {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: left;
}
</style>
