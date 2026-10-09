<script setup lang="ts">
/**
 * PillTooltipHost
 *
 * Renderless adapter that attaches a tooltip to an existing DOM element.
 * Both the legacy CodeMirror widget pipeline and the new `CodeInputLite`
 * overlay mount one of these per pill via `createApp` — they keep ownership
 * of the pill DOM (text, classes, styles) and we only attach hover/focus
 * behaviour through `useTooltip`.
 *
 * The component renders nothing of its own; pass the pill element via the
 * `target` prop and `useTooltip` will wire mouseenter/mouseleave/focus/blur
 * listeners onto it directly.
 */
import { useTooltip } from '@scalar/components/tooltip'
import type { TranslateFn } from '@scalar/localization'
import { computed, h, ref, render } from 'vue'

import {
  useLocalization,
  type ApiClientTranslationKey,
} from '@/v2/features/localization'

import type { PillContext } from './pill-context'

const props = defineProps<{
  /** Tooltip data — environment value or context-function description */
  context: PillContext
  /** The pill element to attach the tooltip to */
  target: HTMLElement
  /** Carry the owning editor's locale into this separately mounted Vue app. */
  translate?: TranslateFn<ApiClientTranslationKey>
}>()

const { translate: fallbackTranslate } = useLocalization()

defineOptions({ name: 'PillTooltipHost' })

const translate = props.translate ?? fallbackTranslate

const isContextFn = props.context.type === 'contextFunction'

/** Two-line HTML body for context-function tooltips. */
const contextTooltipHtml = computed(() => {
  if (
    !isContextFn ||
    typeof document === 'undefined' ||
    props.context.type !== 'contextFunction'
  ) {
    return ''
  }
  const el = document.createElement('div')
  render(
    h('div', { class: 'flex flex-col gap-1.5 text-left' }, [
      h('span', {}, props.context.details),
      h(
        'div',
        { class: 'text-[color:var(--scalar-color-3)] text-[10px] font-normal' },
        translate('apiClient.pillTooltipHost.computedAtExecution'),
      ),
    ]),
    el,
  )
  return el.innerHTML
})

const environmentTooltipText = computed(() =>
  props.context.type === 'environment'
    ? props.context.isDefined
      ? props.context.value
      : translate('apiClient.pillTooltipHost.noValue')
    : '',
)

const targetRef = ref<HTMLElement>(props.target)

useTooltip({
  content: isContextFn ? contextTooltipHtml : environmentTooltipText,
  contentTarget: isContextFn ? 'innerHTML' : 'textContent',
  delay: 0,
  placement: 'bottom-start',
  offset: 6,
  targetRef,
})
</script>

<!-- eslint-disable vue/valid-template-root -- Renderless: the tooltip attaches to the supplied target. -->
<template>
  <!-- Renderless: behaviour attaches to props.target via useTooltip -->
</template>
