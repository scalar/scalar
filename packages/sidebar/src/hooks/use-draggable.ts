import { cva } from '@scalar/use-hooks/useBindCx'
import { type MaybeRef, type Ref, computed, ref, toValue } from 'vue'

/**
 * Drag offsets
 */
export type DragOffset =
  | 'before' // Insert before the hovered item
  | 'after' // Insert after the hovered item
  | 'into' // Drop into the hovered item
  | null

/**
 * Item you are currently dragging over
 */
export type HoveredItem = {
  id: string
  parentId: string | null
  offset: DragOffset
}

/**
 * Item you are currently dragging
 */
export type DraggingItem = Omit<HoveredItem, 'offset'>

/**
 * Simple throttle function to avoid package dependencies
 */
const throttle = <TArgs extends Array<unknown>>(
  callback: (...args: TArgs) => void,
  limit: number,
): ((...args: TArgs) => void) => {
  let wait = false

  return (...args: TArgs) => {
    if (wait) {
      return
    }

    callback(...args)
    wait = true
    setTimeout(() => (wait = false), limit)
  }
}

/** Draggable class variants to apply to the draggable element */
const draggableVariants = cva({
  base: 'relative after:absolute after:inset-x-0 after:block after:bg-blue after:opacity-15 after:pointer-events-none after:rounded',
  variants: {
    position: {
      before: 'after:-top-0.5 after:h-0.75',
      after: 'after:-bottom-0.5 after:h-0.75',
      into: 'after:inset-0',
    } as const satisfies Record<NonNullable<DragOffset>, string>,
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
  const _isDroppable = (offset: DragOffset): boolean =>
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

    ev.target.setAttribute('data-dragging', 'true')
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
    let offset: DragOffset = null

    // handle negative offset to be previous offset
    if (ev.offsetY <= 0 && previousOffset && previousOffset !== 'after') {
      offset = previousOffset
    }
    // Above
    else if (ev.offsetY <= _floor) {
      offset = 'before'
    }
    // Below
    else if (ev.offsetY >= _ceiling) {
      offset = 'after'
    }
    // between
    else if (ev.offsetY > _floor && ev.offsetY < _ceiling) {
      offset = 'into'
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
    document.querySelectorAll('[data-dragging]').forEach((el) => el.removeAttribute('data-dragging'))

    if (_draggingItem.id === _hoveredItem.id) {
      return
    }

    onDragEnd?.(_draggingItem, _hoveredItem)
  }

  const draggableClass = computed(() => {
    const position = id === hoveredItem.value?.id ? hoveredItem.value.offset : undefined

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
