import { cva } from '@scalar/use-hooks/useBindCx'
import { type MaybeRef, type Ref, computed, ref, toValue } from 'vue'

/**
 * Item you are currently dragging over
 */
export type HoveredItem = {
  id: string
  parentId: string | null
  /**
   * Offset is used when adding back an item, also for the highlight classes
   * 0 = above      | .dragover-above
   * 1 = below      | .dragover-below
   * 2 = as a child | .dragover-asChild
   */
  offset: number
}

/**
 * Item you are currently dragging
 */
export type DraggingItem = Omit<HoveredItem, 'offset'>

/**
 * Simple throttle function to avoid package dependencies
 */
const throttle = (callback: (...args: any) => void, limit: number) => {
  let wait = false

  return (...args: unknown[]) => {
    if (wait) {
      return
    }

    callback(...args)
    wait = true
    setTimeout(() => (wait = false), limit)
  }
}

/** Draggable class variants to  */
const draggableVariants = cva({
  base: 'relative after:absolute after:w-full after:block after:bg-blue after:opacity-15 after:pointer-events-none after:rounded',
  variants: {
    position: {
      above: 'after:-top-0.25 after:h-0.75',
      below: 'after:-bottom-0.25 after:h-0.75',
      asChild: 'after:inset-0',
    },
  },
})

/**
 * Shared state for drag and drop operations
 * These are module-level refs so all draggable instances share the same state
 */
const draggingItem = ref<DraggingItem | null>(null)
const hoveredItem = ref<HoveredItem | null>(null)

export type UseDraggableOptions = {
  /**
   * Upper threshold (gets multiplied with height)
   *
   * @default 0.8
   */
  ceiling?: number
  /**
   * Lower threshold (gets multiplied with height)
   *
   * @default 0.2
   */
  floor?: number
  /**
   * Enable dragging. Can be a reactive ref or computed.
   *
   * @default true
   */
  isDraggable?: MaybeRef<boolean>
  /**
   * Prevents items from being hovered and dropped into. Can be either a function or a boolean
   *
   * @default true
   */
  isDroppable?: MaybeRef<boolean> | ((draggingItem: DraggingItem, hoveredItem: HoveredItem) => boolean)
  /**
   * We pass an array of parents to make it easier to reverse traverse
   */
  parentIds?: string[]
  /**
   * ID for the current item
   */
  id: string
  /**
   * Callback when drag starts
   */
  onDragStart?: (draggingItem: DraggingItem) => void
  /**
   * Callback when drag ends
   */
  onDragEnd?: (draggingItem: DraggingItem, hoveredItem: HoveredItem) => void
}

/**
 * Composable for handling drag and drop functionality
 */
export function useDraggable(options: UseDraggableOptions) {
  const {
    ceiling = 0.8,
    floor = 0.2,
    isDraggable = true,
    isDroppable = true,
    parentIds = [],
    id,
    onDragStart,
    onDragEnd,
  } = options

  // The latest parentId in the arr should be the current parent
  const parentId = computed(() => parentIds.at(-1) ?? null)

  /** Check if isDroppable guard */
  const _isDroppable = (offset: number): boolean =>
    typeof isDroppable === 'function'
      ? isDroppable(draggingItem.value!, {
          id: id,
          parentId: parentId.value,
          offset,
        })
      : toValue(isDroppable)

  // Start dragging, we want to store the uid + parentUid
  const handleDragStart = (ev: DragEvent) => {
    if (!toValue(isDraggable) || !ev.dataTransfer || !(ev.target instanceof HTMLElement)) {
      return
    }

    ev.target.classList.add('dragging')
    ev.dataTransfer.dropEffect = 'move'
    ev.dataTransfer.effectAllowed = 'move'

    // Store dragging item
    const item = { id: id, parentId: parentId.value }
    draggingItem.value = item
    onDragStart?.(item)
  }

  // On dragging over we decide which highlight to show
  const handleDragOver = throttle((ev: DragEvent) => {
    // Don't highlight if hovering over self or child
    if (!draggingItem.value || draggingItem.value.id === id || parentIds.includes(draggingItem.value?.id ?? '')) {
      return
    }

    const previousOffset = hoveredItem.value?.offset
    const height = (ev.target as HTMLDivElement).offsetHeight
    const _floor = floor * height
    const _ceiling = ceiling * height
    let offset = 3

    // handle negative offset to be previous offset
    if (ev.offsetY <= 0 && !!previousOffset && previousOffset !== 3) {
      offset = previousOffset
    }
    // Above
    else if (ev.offsetY <= _floor) {
      offset = 0
    }
    // Below
    else if (ev.offsetY >= _ceiling) {
      offset = 1
    }
    // between
    else if (ev.offsetY > _floor && ev.offsetY < _ceiling) {
      offset = 2
    }

    // Hover guard
    if (!_isDroppable(offset)) {
      return
    }

    hoveredItem.value = { id: id, parentId: parentId.value, offset }
  }, 25)

  const handleDragEnd = () => {
    if (!hoveredItem.value || !draggingItem.value) {
      return
    }

    const _draggingItem = { ...draggingItem.value }
    const _hoveredItem = { ...hoveredItem.value }

    // Remove hover and dragging
    draggingItem.value = null
    hoveredItem.value = null
    document.querySelectorAll('div.dragging').forEach((el) => el.classList.remove('dragging'))

    if (_draggingItem.id === _hoveredItem.id) {
      return
    }

    onDragEnd?.(_draggingItem, _hoveredItem)
  }

  const draggableClass = computed(() => {
    const position =
      id === hoveredItem.value?.id
        ? (['above', 'below', 'asChild'][hoveredItem.value.offset] as 'above' | 'below' | 'asChild' | undefined)
        : undefined

    if (!position) {
      return ''
    }

    return draggableVariants({ position })
  })

  /**
   * Props object to bind to the draggable element.
   * Contains the class and draggable attribute.
   */
  const draggableAttrs = computed(() => ({
    class: draggableClass.value || undefined,
    // Only set the draggable attribute if isDraggable is true
    draggable: toValue(isDraggable) ? true : undefined,
  }))

  return {
    /**
     * Props object to bind to the draggable element.
     * Contains the class and draggable attribute.
     */
    draggableAttrs,
    /**
     * Event handlers object to bind to the draggable element.
     * Contains dragend, dragover, and dragstart handlers with proper event prevention.
     */
    draggableEvents: {
      dragend: handleDragEnd,
      dragover: (ev: DragEvent) => {
        ev.preventDefault()
        ev.stopPropagation()
        handleDragOver(ev)
      },
      dragstart: (ev: DragEvent) => {
        ev.stopPropagation()
        handleDragStart(ev)
      },
    },
    draggingItem: draggingItem as Readonly<Ref<DraggingItem | null>>,
    hoveredItem: hoveredItem as Readonly<Ref<HoveredItem | null>>,
  }
}
