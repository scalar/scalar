import { useResizeObserver } from '@vueuse/core'
import {
  type ComputedRef,
  type InjectionKey,
  type Ref,
  type TemplateRef,
  computed,
  inject,
  provide,
  ref,
  watch,
} from 'vue'

/** The host-defined scroll area and its available height in CSS pixels. */
export type ReferenceScrollPane = {
  element: ComputedRef<HTMLElement | null>
  height: Readonly<Ref<number>>
}

const SCROLL_PANE: InjectionKey<ReferenceScrollPane> = Symbol('scalar-reference-scroll-pane')

/** Find the host element that opted in to containing the reference scroll. */
export const getReferenceScrollPane = (element: HTMLElement): HTMLElement | null =>
  element.parentElement?.closest<HTMLElement>('[data-scalar-scroll-container]') ?? null

/** The visible top edge starts inside the scroll container's border. */
export const getScrollportTop = (element: HTMLElement): number =>
  element.getBoundingClientRect().top + element.clientTop

/** Measure the host pane once for the layout and all of its section observers. */
export const provideReferenceScrollPane = (layout: TemplateRef<HTMLElement>): ReferenceScrollPane => {
  const element = computed(() => layout.value && getReferenceScrollPane(layout.value))
  const height = ref(0)
  const measure = (): void => {
    height.value = element.value?.clientHeight ?? 0
  }

  watch(element, measure, { flush: 'post' })
  useResizeObserver(element, measure)

  const pane = { element, height }
  provide(SCROLL_PANE, pane)
  return pane
}

/** Read the pane belonging to the nearest API reference, if present. */
export const useReferenceScrollPane = (): ReferenceScrollPane | undefined => inject(SCROLL_PANE, undefined)
