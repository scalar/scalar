import { createLineHighlighter } from '@scalar/highlight/compat'
import { type ComputedRef, type Ref, computed, ref, watch } from 'vue'

import { createCodeFoldCollector } from './get-code-fold-ranges'

/** Longer physical lines stay readable as plain text without creating thousands of spans. */
export const MAX_HIGHLIGHTED_LINE_LENGTH = 8_192

type HighlightedDocument = {
  highlighter: ReturnType<typeof createLineHighlighter>
  ranges: ReadonlyMap<number, number> | undefined
  length: number
  firstScreenEnd: number
}

const INITIAL_LINES = 40
const SLICE_LENGTH = 4_096
const SLICE_BUDGET_MS = 4

/** Highlights the first screen immediately and scans the rest in short idle slices. */
export const useCodeHighlighting = ({
  enabled,
  code,
  lang,
  foldable,
  sourceLines,
}: {
  enabled: () => boolean
  code: () => string
  lang: () => string
  foldable: () => boolean
  sourceLines: () => string[]
}): { highlightedDocument: ComputedRef<HighlightedDocument | undefined>; revision: Ref<number> } => {
  const highlightedDocument = computed(() => {
    if (!enabled()) {
      return undefined
    }
    const text = code()
    const lines = sourceLines()
    if (lines.length === 1 && text.length > MAX_HIGHLIGHTED_LINE_LENGTH) {
      return undefined
    }
    const collector = foldable() ? createCodeFoldCollector(text, lang()) : undefined
    const highlighter = createLineHighlighter(
      text,
      { lang: lang(), maxLineLength: MAX_HIGHLIGHTED_LINE_LENGTH },
      collector?.onToken,
    )
    let firstScreenEnd = 0
    for (const line of lines.slice(0, INITIAL_LINES)) {
      firstScreenEnd += line.length + 1
      if (firstScreenEnd >= SLICE_LENGTH) {
        break
      }
    }
    return {
      highlighter,
      ranges: collector?.ranges,
      length: text.length,
      firstScreenEnd: Math.min(firstScreenEnd, SLICE_LENGTH),
    }
  })

  const revision = ref(0)
  watch(
    highlightedDocument,
    (document, _, onCleanup) => {
      if (!document) {
        return
      }
      const { highlighter, length, firstScreenEnd } = document
      let position = highlighter.advance(firstScreenEnd)
      if (position >= length || typeof window === 'undefined') {
        return
      }

      const schedule = (run: (deadline?: IdleDeadline) => void): (() => void) => {
        if (typeof window.requestIdleCallback === 'function') {
          const id = window.requestIdleCallback(run, { timeout: 100 })
          return () => window.cancelIdleCallback(id)
        }
        const id = window.setTimeout(run)
        return () => window.clearTimeout(id)
      }

      const scan = (deadline?: IdleDeadline): void => {
        const budget = Math.min(SLICE_BUDGET_MS, deadline?.timeRemaining() ?? SLICE_BUDGET_MS)
        const end = performance.now() + budget
        do {
          position = highlighter.advance(position + SLICE_LENGTH)
        } while (position < length && performance.now() < end)
        revision.value++
        if (position < length) {
          cancel = schedule(scan)
        }
      }

      let cancel = schedule(scan)
      onCleanup(() => cancel())
    },
    { immediate: true },
  )

  return { highlightedDocument, revision }
}
