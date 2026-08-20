<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { useClipboard } from '@scalar/use-hooks/useClipboard'

import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import { useLocalization } from '@/features/localization'

const { pattern } = defineProps<{ pattern: string }>()

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
        :aria-label="`${translate('common.copyPattern')}: ${pattern}`"
        @click="copyToClipboard(pattern)">
        <code>{{ pattern }}</code>
        <ScalarIcon
          aria-hidden="true"
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

/*
 * Invisible bridge that fills the gap between the label and the popup, so the
 * pointer can travel down into the popup without dropping the `:hover` state.
 * Mirrors the same trick in SchemaPropertyExamples.vue.
 */
.property-pattern:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
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
  /* Cap the width so the centered popup never overflows a narrow viewport
   * (mobile, modal). Long patterns wrap instead of widening it. */
  max-width: min(500px, calc(100vw - 32px));
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
  /* Top-align so the copy icon stays with the first line of a wrapped pattern. */
  align-items: flex-start;
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
  /* Wrap long regex so the full pattern is readable, not just copyable. */
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  flex: 1;
  text-align: left;
}
</style>
