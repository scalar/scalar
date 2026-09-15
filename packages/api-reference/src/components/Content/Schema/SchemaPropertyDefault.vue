<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { ref, useId } from 'vue'

import { useLocalization } from '@/features/localization'

import { formatValue } from './helpers/format-value'

defineProps<{
  value?: unknown
}>()

const { copyToClipboard } = useClipboard()
const { translate } = useLocalization()

/**
 * Hover/`:focus-within` CSS alone left the popup unreachable by Enter, Escape
 * or touch, so it is pinned open on click (as in SchemaPropertyPattern.vue).
 */
const rootRef = ref<HTMLElement | null>(null)
const labelRef = ref<HTMLButtonElement | null>(null)
const isOpen = ref(false)
const popupId = useId()

const toggle = (): void => {
  isOpen.value = !isOpen.value
}

/**
 * Focus opens the popup through the same state as the click, not a separate
 * `:focus-within` rule: with both, a click's own `focusin` opened it first and
 * `toggle()` closed it again, so `aria-expanded` disagreed with the screen.
 */
const onFocusIn = (): void => {
  if (!openedByPointer && !restoringFocus) {
    isOpen.value = true
  }
}

/**
 * `close()` refocuses the label, and `focus()` fires `focusin` synchronously,
 * which would re-open the popup and make the first Escape look inert.
 */
let restoringFocus = false

/** A pointer press focuses before it clicks; that focus must not open the popup */
let openedByPointer = false

/** Long enough to span a touch tap's delayed compatibility mouse events. */
const POINTER_GUARD_MS = 500
let pointerGuardTimer = 0

const onPointerDown = (): void => {
  /*
   * A touch tap's compatibility mousedown (which moves focus) lands 50-150ms
   * after touchend, past any one-frame guard, so the tap opened then closed.
   */
  openedByPointer = true
  window.clearTimeout(pointerGuardTimer)
  pointerGuardTimer = window.setTimeout(() => {
    openedByPointer = false
  }, POINTER_GUARD_MS)
}

const onFocusOut = (event: FocusEvent): void => {
  const next = event.relatedTarget

  if (!(next instanceof Node) || !rootRef.value?.contains(next)) {
    isOpen.value = false
  }
}

/**
 * Closing hides the popup outright, so focus is handed back deliberately, or
 * Escape from inside it drops focus to <body> and Tab resumes from the top.
 */
const close = (): void => {
  const wasInside = rootRef.value?.contains(document.activeElement)

  isOpen.value = false

  if (wasInside) {
    restoringFocus = true
    labelRef.value?.focus()
    restoringFocus = false
  }
}

onClickOutside(rootRef, close)
onKeyStroke('Escape', () => {
  if (isOpen.value) {
    close()
  }
})
</script>
<template>
  <template v-if="value !== undefined">
    <div
      ref="rootRef"
      class="property-default"
      :class="{ 'is-open': isOpen }"
      @focusin="onFocusIn"
      @focusout="onFocusOut">
      <button
        ref="labelRef"
        :aria-controls="popupId"
        :aria-expanded="isOpen"
        class="property-default-label"
        type="button"
        @click="toggle"
        @pointerdown="onPointerDown">
        <span>{{ translate('schema.default') }}</span>
      </button>
      <div
        :id="popupId"
        class="property-default-value-list"
        :class="{ 'flex!': isOpen }">
        <button
          :aria-label="`${translate('common.copyDefault')}: ${formatValue(value)}`"
          class="property-default-value group"
          type="button"
          @click="copyToClipboard(formatValue(value))">
          <span>
            {{ formatValue(value) }}
          </span>
          <ScalarIcon
            aria-hidden="true"
            class="group-hover:text-c-1 text-c-3 ml-auto min-h-3 min-w-3"
            icon="Clipboard"
            size="xs" />
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.property-default {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-mini);
  position: relative;
}
.property-default:hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
}
.property-default:hover .property-default-label span {
  color: var(--scalar-color-1);
}
.property-default-label span {
  color: var(--scalar-color-3);
  position: relative;
  border-bottom: var(--scalar-border-width) dotted currentColor;
}
.property-default-value {
  font-family: var(--scalar-font-code);
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px;
}
.property-default-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-default-value :deep(svg) {
  color: var(--scalar-color-3);
}

.property-default-value:hover :deep(svg) {
  color: var(--scalar-color-1);
}

.property-default-value {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.property-default-value-list {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  overflow: auto;
  background-color: var(--scalar-background-1);
  box-shadow: var(--scalar-shadow-1);
  border-radius: var(--scalar-radius-lg);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  padding: 9px;
  min-width: 200px;
  max-width: 300px;
  flex-direction: column;
  gap: 3px;
  display: none;
  z-index: 2;
}
.property-default:hover .property-default-value-list {
  display: flex;
}
</style>
