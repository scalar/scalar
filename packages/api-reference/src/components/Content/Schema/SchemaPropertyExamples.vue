<script setup lang="ts">
import { ScalarIcon } from '@scalar/components/icon'
import { isObject } from '@scalar/helpers/object/is-object'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { computed, ref, useId } from 'vue'

import LinkButton from '@/components/Content/Schema/LinkButton.vue'
import { useLocalization } from '@/features/localization'

import { formatExample } from './helpers/format-example'

const { examples, example } = defineProps<{
  examples?: unknown
  example?: unknown
}>()

const { copyToClipboard } = useClipboard()
const { translate } = useLocalization()

// `null` is a meaningful example value for nullable schemas, so only treat
// `undefined` as "not provided".
const hasSingleExample = computed(() => example !== undefined)

const normalizedExamples = computed<Record<string, unknown>>(() => {
  if (examples && typeof examples === 'object') {
    return examples as Record<string, unknown>
  }

  return {}
})

const hasMultipleExamples = computed(
  () => Object.keys(normalizedExamples.value).length > 0,
)

const multipleExamplesLabel = computed(() =>
  Object.keys(normalizedExamples.value).length === 1
    ? translate('schema.example')
    : translate('schema.examples'),
)

/**
 * Unwrap an OpenAPI 3 Example Object (`{ value, externalValue, summary, description }`)
 * to the actual sample. Plain values pass through untouched.
 */
function unwrapExampleObject(value: unknown): unknown {
  if (isObject(value)) {
    if ('value' in value) {
      return value.value
    }
    if ('externalValue' in value) {
      return (value as { externalValue: unknown }).externalValue
    }
  }
  return value
}

/**
 * Hover/`:focus-within` CSS alone left the popup unreachable by Enter, Escape
 * or touch, so it is pinned open on click (as in SchemaPropertyPattern.vue).
 * `example` and `examples` can both render, so each popup has its own state.
 */
const singleRootRef = ref<HTMLElement | null>(null)
const singleTriggerRef = ref<HTMLElement | { $el: HTMLElement } | null>(null)
const isSingleOpen = ref(false)
const singlePopupId = useId()

const multipleRootRef = ref<HTMLElement | null>(null)
const multipleTriggerRef = ref<HTMLElement | { $el: HTMLElement } | null>(null)
const isMultipleOpen = ref(false)
const multiplePopupId = useId()

/**
 * Focus opens the popup through the same state as the click, not a separate
 * `:focus-within` rule; with both, a click's own `focusin` opened it first and
 * the click closed it again. This flag stops a pointer press counting as focus.
 */
let openedByPointer = false

/** Long enough to span a touch tap's delayed compatibility mouse events. */
const POINTER_GUARD_MS = 500
let pointerGuardTimer = 0

/**
 * `closeAndRestore` refocuses the trigger, and `focus()` fires `focusin`
 * synchronously, which would re-open the popup and make the first Escape inert.
 */
let restoringFocus = false

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

const leftPopup = (event: FocusEvent, root: HTMLElement | null): boolean => {
  const next = event.relatedTarget

  return !(next instanceof Node) || !root?.contains(next)
}

const onSingleFocusIn = (): void => {
  if (!openedByPointer && !restoringFocus) {
    isSingleOpen.value = true
  }
}

const onSingleFocusOut = (event: FocusEvent): void => {
  if (leftPopup(event, singleRootRef.value)) {
    isSingleOpen.value = false
  }
}

const onMultipleFocusIn = (): void => {
  if (!openedByPointer && !restoringFocus) {
    isMultipleOpen.value = true
  }
}

const onMultipleFocusOut = (event: FocusEvent): void => {
  if (leftPopup(event, multipleRootRef.value)) {
    isMultipleOpen.value = false
  }
}

onClickOutside(singleRootRef, () => {
  isSingleOpen.value = false
})

onClickOutside(multipleRootRef, () => {
  isMultipleOpen.value = false
})

/**
 * Closing hides the popup outright, so focus is handed back deliberately, or
 * Escape from inside it drops focus to <body>.
 */
const closeAndRestore = (
  open: typeof isSingleOpen,
  root: typeof singleRootRef,
  trigger: typeof singleTriggerRef,
): void => {
  if (!open.value) {
    return
  }

  const wasInside = root.value?.contains(document.activeElement)

  open.value = false

  if (wasInside) {
    const element = trigger.value
    const focusable =
      element instanceof HTMLElement ? element : (element?.$el as HTMLElement)

    restoringFocus = true
    focusable?.focus?.()
    restoringFocus = false
  }
}

onKeyStroke('Escape', () => {
  closeAndRestore(isSingleOpen, singleRootRef, singleTriggerRef)
  closeAndRestore(isMultipleOpen, multipleRootRef, multipleTriggerRef)
})
</script>
<template>
  <!-- single example (deprecated) -->
  <template v-if="hasSingleExample">
    <div
      ref="singleRootRef"
      class="property-example"
      :class="{ 'is-open': isSingleOpen }"
      @focusin="onSingleFocusIn"
      @focusout="onSingleFocusOut">
      <LinkButton
        ref="singleTriggerRef"
        :aria-controls="singlePopupId"
        :aria-expanded="isSingleOpen"
        class="decoration-dotted"
        @click="isSingleOpen = !isSingleOpen"
        @pointerdown="onPointerDown">
        {{ translate('schema.example') }}
      </LinkButton>
      <div
        :id="singlePopupId"
        class="property-example-value-list"
        :class="{ 'flex!': isSingleOpen }">
        <button
          :aria-label="`${translate('common.copyExample')}: ${formatExample(example)}`"
          class="property-example-value group"
          type="button"
          @click="copyToClipboard(formatExample(example))">
          <span>
            {{ formatExample(example) }}
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

  <!-- multiple examples -->
  <template v-if="hasMultipleExamples">
    <div
      ref="multipleRootRef"
      class="property-example"
      :class="{ 'is-open': isMultipleOpen }"
      @focusin="onMultipleFocusIn"
      @focusout="onMultipleFocusOut">
      <LinkButton
        ref="multipleTriggerRef"
        :aria-controls="multiplePopupId"
        :aria-expanded="isMultipleOpen"
        class="decoration-dotted"
        @click="isMultipleOpen = !isMultipleOpen"
        @pointerdown="onPointerDown">
        {{ multipleExamplesLabel }}
      </LinkButton>
      <div
        :id="multiplePopupId"
        class="property-example-value-list"
        :class="{ 'flex!': isMultipleOpen }">
        <button
          v-for="(ex, key) in normalizedExamples"
          :key="key"
          :aria-label="`${translate('common.copyExample')}: ${formatExample(unwrapExampleObject(ex))}`"
          class="property-example-value group"
          type="button"
          @click="copyToClipboard(formatExample(unwrapExampleObject(ex)))">
          <span>{{ formatExample(unwrapExampleObject(ex)) }} </span>
          <ScalarIcon
            aria-hidden="true"
            class="text-c-3 group-hover:text-c-1 ml-auto min-h-3 min-w-3"
            icon="Clipboard"
            size="xs" />
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
@reference "../../../style.css";

.property-example {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-mini);
  position: relative;
}
.property-example:hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  border-radius: var(--scalar-radius);
}
.property-example-value {
  font-family: var(--scalar-font-code);
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px;
}
.property-example-value span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.property-example-value :deep(svg) {
  color: var(--scalar-color-3);
}

.property-example-value:hover :deep(svg) {
  color: var(--scalar-color-1);
}

.property-example-value {
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.property-example-value-list {
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
  @apply z-context;
}
.property-example:hover .property-example-value-list {
  display: flex;
}
</style>
