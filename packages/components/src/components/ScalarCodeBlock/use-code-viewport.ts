import { type ComputedRef, type Ref, computed, onUpdated, ref, watch } from 'vue'

const LINE_HEIGHT = 24
const OVERSCAN = 8
const INITIAL_VIEWPORT_HEIGHT = 480
// Match the scroller padding, number spacing and fold button in ScalarCodeBlock.vue.
const INLINE_PADDING = 16
const FOLD_GUTTER_WIDTH = 28

/** Finds the row whose start is at or before the given offset. */
const rowAtOffset = (offset: number, offsets: Float64Array): number => {
  let low = 0
  let high = offsets.length - 1
  while (low < high - 1) {
    const mid = (low + high) >>> 1
    if (offsets[mid]! <= offset) {
      low = mid
    } else {
      high = mid
    }
  }
  return low
}

type CodeViewport = {
  lineWindow: ComputedRef<{ start: number; end: number; top: number; bottom: number }>
  maxColumns: ComputedRef<number>
  onScroll: () => void
  sourceLine: (row: number) => number
}

/** Windows the expanded source lines, with measured heights when wrapping is on. */
export const useCodeViewport = ({
  enabled,
  lines,
  expandedLines,
  wrap,
  lineNumbers,
  scroll,
  characterWidthProbe,
}: {
  enabled: () => boolean
  lines: () => string[]
  expandedLines: () => number[] | undefined
  wrap: () => boolean
  lineNumbers: () => boolean
  scroll: Ref<HTMLElement | null>
  characterWidthProbe: Ref<HTMLElement | null>
}): CodeViewport => {
  const scrollTop = ref(0)
  const width = ref(0)
  const height = ref(INITIAL_VIEWPORT_HEIGHT)
  const characterWidth = ref(8)
  const measurements = new Map<number, number>()
  const measurementRevision = ref(0)

  const count = computed(() => expandedLines()?.length ?? lines().length)
  const digits = computed(() => lines().length.toString().length)
  const sourceLine = (row: number): number => expandedLines()?.[row] ?? row
  // Tabs take up to four columns. The browser measures actual wrapped rows as
  // they enter the viewport, including non-Latin text and fallback fonts.
  const columnCounts = computed(() =>
    enabled() ? lines().map((line) => (line.includes('\t') ? line.replaceAll('\t', '    ').length : line.length)) : [],
  )
  const maxColumns = computed(() => {
    let max = 0
    for (const columns of columnCounts.value) {
      max = Math.max(max, columns)
    }
    return max
  })

  const columnsPerRow = computed(() => {
    const gutterWidth = FOLD_GUTTER_WIDTH + (lineNumbers() ? digits.value * characterWidth.value + 4 : 0)
    return width.value
      ? Math.max(1, Math.floor((width.value - INLINE_PADDING - gutterWidth) / characterWidth.value))
      : Number.POSITIVE_INFINITY
  })

  const offsets = computed(() => {
    if (!enabled() || !wrap()) {
      return undefined
    }
    // Changes to measurements are batched, so we rebuild the offsets once.
    void measurementRevision.value
    const availableColumns = columnsPerRow.value
    if (!measurements.size && maxColumns.value <= availableColumns) {
      return undefined
    }
    const columns = columnCounts.value
    const expanded = expandedLines()
    const offsets = new Float64Array(count.value + 1)
    for (let row = 0; row < count.value; row++) {
      const index = expanded?.[row] ?? row
      const estimate = Math.max(1, Math.ceil(columns[index]! / availableColumns)) * LINE_HEIGHT
      offsets[row + 1] = offsets[row]! + (measurements.get(index) ?? estimate)
    }
    return offsets
  })

  const rowAt = (offset: number, starts: Float64Array | undefined): number =>
    starts ? rowAtOffset(offset, starts) : Math.floor(offset / LINE_HEIGHT)

  const lineWindow = computed(() => {
    if (!enabled()) {
      return { start: 0, end: count.value, top: 0, bottom: 0 }
    }
    const starts = offsets.value
    const offsetOf = (row: number): number => starts?.[row] ?? row * LINE_HEIGHT
    const start = Math.max(0, Math.min(rowAt(scrollTop.value, starts), count.value) - OVERSCAN)
    const end = Math.min(rowAt(scrollTop.value + height.value, starts) + OVERSCAN + 1, count.value)
    return { start, end, top: offsetOf(start), bottom: offsetOf(count.value) - offsetOf(end) }
  })

  const onScroll = (): void => {
    scrollTop.value = scroll.value?.scrollTop ?? 0
  }

  const clearMeasurements = (): void => {
    measurements.clear()
    measurementRevision.value++
  }

  const updateSize = (): void => {
    if (!enabled() || !scroll.value) {
      return
    }
    const newWidth = scroll.value.clientWidth
    const newCharacterWidth = (characterWidthProbe.value?.getBoundingClientRect().width ?? 0) / 32
    if (width.value !== newWidth || (newCharacterWidth > 0 && newCharacterWidth !== characterWidth.value)) {
      width.value = newWidth
      if (newCharacterWidth > 0) {
        characterWidth.value = newCharacterWidth
      }
      clearMeasurements()
    }
    height.value = scroll.value.clientHeight
    onScroll()
  }

  const measureRows = (): void => {
    if (!enabled() || !wrap() || !scroll.value) {
      return
    }
    const starts = offsets.value
    const anchor = rowAt(scrollTop.value, starts)
    const columns = columnCounts.value
    const availableColumns = columnsPerRow.value
    let changed = false
    for (const row of scroll.value.querySelectorAll<HTMLElement>('[data-code-line]')) {
      const index = Number(row.dataset.codeLine)
      const size = row.getBoundingClientRect().height
      const estimate = Math.max(1, Math.ceil(columns[index]! / availableColumns)) * LINE_HEIGHT
      if (size && size !== (measurements.get(index) ?? estimate)) {
        if (size === estimate) {
          measurements.delete(index)
        } else {
          measurements.set(index, size)
        }
        changed = true
      }
    }
    if (changed) {
      measurementRevision.value++
      const delta = (offsets.value?.[anchor] ?? anchor * LINE_HEIGHT) - (starts?.[anchor] ?? anchor * LINE_HEIGHT)
      if (delta) {
        scroll.value.scrollTop += delta
        onScroll()
      }
    }
  }

  watch([() => (enabled() ? lines() : undefined), wrap], clearMeasurements, { flush: 'sync' })
  watch([enabled, scroll, wrap, characterWidthProbe], updateSize, { flush: 'post' })
  watch(
    () => (enabled() ? scroll.value : null),
    (element, _, onCleanup) => {
      if (element && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(updateSize)
        observer.observe(element)
        onCleanup(() => observer.disconnect())
      }
    },
    { flush: 'post' },
  )
  onUpdated(measureRows)

  return { lineWindow, maxColumns, onScroll, sourceLine }
}
