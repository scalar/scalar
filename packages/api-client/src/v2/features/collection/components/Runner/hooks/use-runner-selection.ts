import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { type ComputedRef, type Ref, computed, ref } from 'vue'

/** One selectable row: operation example (path + method + exampleKey) with stable id */
export type SelectedItem = {
  id: string
  path: string
  method: HttpMethod
  exampleKey: string
  label: string
}

type UseRunnerSelectionOptions = {
  /** Whether selection modifications are locked (e.g., during a run) */
  isLocked: () => boolean
}

type UseRunnerSelectionReturn = {
  /** Ordered list of selected items */
  selectedOrder: Ref<SelectedItem[]>
  /** Whether any items are selected */
  hasSelection: ComputedRef<boolean>
  /** Check if a specific operation example is selected */
  isSelected: (path: string, method: HttpMethod, exampleKey: string) => boolean
  /** Toggle selection of an operation example */
  toggle: (path: string, method: HttpMethod, exampleKey: string, label: string) => void
  /** Clear all selections */
  clearAll: () => void
  /** Remove a specific item from the selection */
  removeFromOrder: (item: SelectedItem) => void
  /** Drag state for reordering */
  dragState: {
    draggedIndex: Ref<number | null>
    dragOverIndex: Ref<number | null>
    dragOffset: Ref<'before' | 'after' | null>
  }
  /** Drag event handlers */
  handleDragStart: (index: number, event: DragEvent) => void
  handleDragOver: (index: number, event: DragEvent) => void
  handleDragLeave: () => void
  handleDrop: (event: DragEvent) => void
  handleDragEnd: () => void
}

/**
 * Composable for managing runner selection state and drag-and-drop reordering.
 */
export function useRunnerSelection({ isLocked }: UseRunnerSelectionOptions): UseRunnerSelectionReturn {
  const selectedOrder = ref<SelectedItem[]>([])
  const draggedIndex = ref<number | null>(null)
  const dragOverIndex = ref<number | null>(null)
  const dragOffset = ref<'before' | 'after' | null>(null)

  const hasSelection = computed(() => selectedOrder.value.length > 0)

  const isSelected = (path: string, method: HttpMethod, exampleKey: string): boolean => {
    return selectedOrder.value.some((s) => s.path === path && s.method === method && s.exampleKey === exampleKey)
  }

  const toggle = (path: string, method: HttpMethod, exampleKey: string, label: string): void => {
    if (isLocked()) {
      return
    }
    const id = `${path}|${method}|${exampleKey}`
    const idx = selectedOrder.value.findIndex((s) => s.id === id)
    if (idx >= 0) {
      selectedOrder.value = selectedOrder.value.filter((_, i) => i !== idx)
    } else {
      selectedOrder.value = [...selectedOrder.value, { id, path, method, exampleKey, label }]
    }
  }

  const clearAll = (): void => {
    if (isLocked()) {
      return
    }
    selectedOrder.value = []
  }

  const removeFromOrder = (item: SelectedItem): void => {
    if (isLocked()) {
      return
    }
    selectedOrder.value = selectedOrder.value.filter((s) => s.id !== item.id)
  }

  const handleDragStart = (index: number, event: DragEvent): void => {
    if (isLocked()) {
      event.preventDefault()
      return
    }
    draggedIndex.value = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))
    }
  }

  const handleDragOver = (index: number, event: DragEvent): void => {
    event.preventDefault()
    if (draggedIndex.value === null || draggedIndex.value === index) {
      dragOverIndex.value = null
      dragOffset.value = null
      return
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const offset = event.clientY < midpoint ? 'before' : 'after'

    dragOverIndex.value = index
    dragOffset.value = offset
  }

  const handleDragLeave = (): void => {
    // Do not clear hover state on leave - it will be updated by dragover or cleared on dragend
    // This prevents flickering when moving between items
  }

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault()
    if (draggedIndex.value === null || dragOverIndex.value === null || dragOffset.value === null) {
      return
    }

    const fromIndex = draggedIndex.value
    const toIndex = dragOverIndex.value

    if (fromIndex === toIndex) {
      resetDragState()
      return
    }

    const list = [...selectedOrder.value]
    const [removed] = list.splice(fromIndex, 1)
    if (!removed) {
      resetDragState()
      return
    }

    let insertIndex = toIndex
    if (fromIndex < toIndex) {
      insertIndex = dragOffset.value === 'after' ? toIndex : toIndex - 1
    } else {
      insertIndex = dragOffset.value === 'before' ? toIndex : toIndex + 1
    }

    insertIndex = Math.max(0, Math.min(insertIndex, list.length))
    list.splice(insertIndex, 0, removed)
    selectedOrder.value = list

    resetDragState()
  }

  const handleDragEnd = (): void => {
    resetDragState()
  }

  const resetDragState = (): void => {
    draggedIndex.value = null
    dragOverIndex.value = null
    dragOffset.value = null
  }

  return {
    selectedOrder,
    hasSelection,
    isSelected,
    toggle,
    clearAll,
    removeFromOrder,
    dragState: {
      draggedIndex,
      dragOverIndex,
      dragOffset,
    },
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  }
}
