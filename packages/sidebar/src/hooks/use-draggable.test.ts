import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useDraggable } from './use-draggable'

describe('useDraggable', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default values', () => {
    const {
      draggableAttrs: draggableProps,
      draggingItem,
      hoveredItem,
    } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    expect(draggingItem.value).toBeNull()
    expect(hoveredItem.value).toBeNull()
    expect(draggableProps.value.class).toBeUndefined()
    expect(draggableProps.value.draggable).toBe(true)
  })

  it('handles drag start', () => {
    const onDragStart = vi.fn()
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
      onDragStart,
    })

    const element = document.createElement('div')
    const mockEvent = {
      dataTransfer: {
        dropEffect: '',
        effectAllowed: '',
      },
      target: element,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggableEvents.dragstart(mockEvent)

    expect(onDragStart).toHaveBeenCalledWith({
      id: 'test-1',
      parentId: null,
    })
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    // Verify data-dragging attribute is set in the DOM
    expect(element.getAttribute('data-dragging')).toBe('true')
  })

  it('does not start drag if enabled is false', () => {
    const onDragStart = vi.fn()
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: false,
      onDragStart,
    })

    const element = document.createElement('div')
    const mockEvent = {
      dataTransfer: {
        dropEffect: '',
        effectAllowed: '',
      },
      target: element,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggableEvents.dragstart(mockEvent)

    expect(onDragStart).not.toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    // Verify data-dragging attribute is NOT set when dragging is disabled
    expect(element.getAttribute('data-dragging')).toBeNull()
  })

  it('returns draggableProps with correct structure', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: true,
    })

    expect(draggableProps.value).toHaveProperty('class')
    expect(draggableProps.value).toHaveProperty('draggable')
    expect(draggableProps.value.draggable).toBe(true)
  })

  it('returns draggableEvents with all required handlers', () => {
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    expect(draggableEvents).toHaveProperty('dragend')
    expect(draggableEvents).toHaveProperty('dragover')
    expect(draggableEvents).toHaveProperty('dragstart')
    expect(typeof draggableEvents.dragend).toBe('function')
    expect(typeof draggableEvents.dragover).toBe('function')
    expect(typeof draggableEvents.dragstart).toBe('function')
  })

  it('updates draggable prop when enabled changes', () => {
    const isDraggable = ref(true)
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable,
    })

    expect(draggableProps.value.draggable).toBe(true)

    isDraggable.value = false
    expect(draggableProps.value.draggable).toBeUndefined()
  })

  it('does not set draggable attribute when isDraggable is false', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: false,
    })

    // When isDraggable is false, draggable should be undefined (not set)
    expect(draggableProps.value.draggable).toBeUndefined()
  })

  it('does not set class attribute when draggableClass is empty', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    // When there's no hover, draggableClass returns empty string, which becomes undefined
    expect(draggableProps.value.class).toBeUndefined()
  })

  it('does not set class attribute when draggableClass is falsy', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: false,
    })

    // When there's no hover and isDraggable is false, class should still be undefined
    expect(draggableProps.value.class).toBeUndefined()
  })

  it('sets and removes data-dragging attribute during drag lifecycle', async () => {
    vi.useFakeTimers()

    const onDragEnd = vi.fn()
    const draggable1 = useDraggable({
      id: 'test-1',
      parentIds: [],
      onDragEnd,
    })

    const draggable2 = useDraggable({
      id: 'test-2',
      parentIds: [],
    })

    // Create elements and add them to document so querySelectorAll can find them
    const element1 = document.createElement('div')
    const element2 = document.createElement('li')
    document.body.appendChild(element1)
    document.body.appendChild(element2)

    // Set up element2 with proper dimensions for hover detection
    Object.defineProperty(element2, 'offsetHeight', {
      configurable: true,
      value: 100,
    })

    // Start drag on element1
    const dragStartEvent = {
      dataTransfer: {
        dropEffect: 'move',
        effectAllowed: 'move',
      },
      target: element1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggable1.draggableEvents.dragstart(dragStartEvent)

    // Verify attribute is set on drag start
    expect(element1.getAttribute('data-dragging')).toBe('true')
    expect(draggable1.draggingItem.value).not.toBeNull()
    expect(draggable1.draggingItem.value?.id).toBe('test-1')

    // Manually set attribute on element2 to test cleanup of multiple elements
    element2.setAttribute('data-dragging', 'true')

    // Verify attributes are set
    expect(element1.getAttribute('data-dragging')).toBe('true')
    expect(element2.getAttribute('data-dragging')).toBe('true')

    // Set up hover state by dragging over element2 (required for handleDragEnd to execute cleanup)
    const dragOverEvent = {
      dataTransfer: {
        dropEffect: 'move',
        effectAllowed: 'move',
      },
      target: element2,
      offsetY: 50, // Middle of element (between floor 20 and ceiling 80)
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggable2.draggableEvents.dragover(dragOverEvent)
    // Wait for throttle to execute
    await vi.advanceTimersByTimeAsync(30)

    // Verify hover state is set (required for handleDragEnd to clean up)
    expect(draggable1.hoveredItem.value).not.toBeNull()
    expect(draggable1.draggingItem.value).not.toBeNull()

    // Call handleDragEnd through dragend event (this is what actually cleans up)
    draggable1.draggableEvents.dragend()

    // Verify all attributes are removed via handleDragEnd
    expect(element1.getAttribute('data-dragging')).toBeNull()
    expect(element2.getAttribute('data-dragging')).toBeNull()
    expect(onDragEnd).toHaveBeenCalled()

    // Clean up
    document.body.removeChild(element1)
    document.body.removeChild(element2)
  })
})
