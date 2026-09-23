import type { MarkdownRenderHook } from '@scalar/helpers/markdown/markdown-render-hook'
import { type InjectionKey, type Ref, inject, watch } from 'vue'

/** Per-reference hooks; separate API Reference instances do not share enhancements. */
export const MARKDOWN_RENDER_HOOKS: InjectionKey<readonly MarkdownRenderHook[]> = Symbol('scalar-markdown-render-hooks')

/** Run enhancements after rendering and dispose them when Markdown changes or unmounts. */
export const useMarkdownRenderHooks = (
  element: Ref<HTMLElement | null>,
  source: () => string,
  html: () => string,
): void => {
  const hooks = inject(MARKDOWN_RENDER_HOOKS, [])
  watch(
    [element, source, html],
    ([container, markdown], _, onCleanup) => {
      if (!container || !hooks.length) return
      const controller = new AbortController()
      const cleanups: (() => void)[] = []
      onCleanup(() => {
        controller.abort()
        for (const cleanup of cleanups.reverse()) {
          try {
            cleanup()
          } catch (error: unknown) {
            // One plugin must not prevent other plugins from releasing their resources.
            console.error('Could not dispose Markdown enhancement:', error)
          }
        }
      })
      for (const hook of hooks) {
        void Promise.resolve()
          .then(() => {
            if (controller.signal.aborted) return
            return hook({ element: container, source: markdown, signal: controller.signal })
          })
          .then((cleanup) => {
            if (!cleanup) return
            if (controller.signal.aborted) cleanup()
            else cleanups.push(cleanup)
          })
          .catch((error: unknown) => {
            if (!controller.signal.aborted) console.error('Could not enhance Markdown:', error)
          })
      }
    },
    { flush: 'post', immediate: true },
  )
}
