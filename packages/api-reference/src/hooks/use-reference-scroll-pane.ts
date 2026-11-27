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

/** The host-defined scroll area and its measured heights in CSS pixels. */
export type ReferenceScrollPane = {
  element: ComputedRef<HTMLElement | null>
  /** The scrollport includes padding and reports whole pixels, keeping observer margins stable. */
  scrollportHeight: Readonly<Ref<number>>
  /** The reference itself fits inside the host pane's content box. */
  contentHeight: Readonly<Ref<number>>
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
  const scrollportHeight = ref(0)
  const contentHeight = ref(0)

  watch(
    element,
    (pane) => {
      scrollportHeight.value = pane?.clientHeight ?? 0
      if (pane) {
        const { paddingTop, paddingBottom } = getComputedStyle(pane)
        contentHeight.value = Math.max(
          0,
          pane.clientHeight - Number.parseFloat(paddingTop || '0') - Number.parseFloat(paddingBottom || '0'),
        )
      } else {
        contentHeight.value = 0
      }
    },
    { flush: 'post' },
  )
  useResizeObserver(element, ([entry]) => {
    if (entry) {
      scrollportHeight.value = entry.target.clientHeight
      contentHeight.value = entry.contentRect.height
    }
  })

  const pane = { element, scrollportHeight, contentHeight }
  provide(SCROLL_PANE, pane)
  return pane
}

/** Read the pane belonging to the nearest API reference, if present. */
export const useReferenceScrollPane = (): ReferenceScrollPane | undefined => inject(SCROLL_PANE, undefined)
