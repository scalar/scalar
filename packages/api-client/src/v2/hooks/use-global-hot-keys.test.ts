import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { handleHotkeys } from '@/v2/helpers/handle-hotkeys'
import type { ClientLayout } from '@/v2/types/layout'

import { useGlobalHotKeys } from './use-global-hot-keys'

const injectedRoot = vi.hoisted(() => ({ value: undefined as Document | ShadowRoot | undefined }))
vi.mock('@scalar/use-hooks/useDocumentRoot', () => ({
  useDocumentRoot: () => injectedRoot.value ?? document,
}))

// Mock Vue lifecycle hooks
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((callback: () => void) => callback()),
    onBeforeUnmount: vi.fn((callback: () => void) => callback()),
  }
})

// Mock the handleHotkeys function
vi.mock('@/v2/helpers/handle-hotkeys', () => ({
  handleHotkeys: vi.fn(),
}))

describe('use-hot-keys', () => {
  let mockEventBus: WorkspaceEventBus
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
    } as unknown as WorkspaceEventBus

    // Spy on window event listener methods
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    vi.clearAllMocks()
    injectedRoot.value = document
  })

  it('adds keydown event listener on mount', () => {
    const layout: ClientLayout = 'web'

    useGlobalHotKeys(mockEventBus, layout)

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('removes keydown event listener on unmount', () => {
    const layout: ClientLayout = 'web'

    useGlobalHotKeys(mockEventBus, layout)

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('calls handleHotkeys with correct parameters when keydown event fires', () => {
    const layout: ClientLayout = 'web'

    useGlobalHotKeys(mockEventBus, layout)

    // Get the callback that was registered
    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener

    // Create a keyboard event
    const keyboardEvent = new KeyboardEvent('keydown', { key: 'l', metaKey: true })

    // Trigger the callback
    callback(keyboardEvent)

    expect(handleHotkeys).toHaveBeenCalledWith(keyboardEvent, mockEventBus, layout)
    expect(handleHotkeys).toHaveBeenCalledTimes(1)
  })

  it('does not call handleHotkeys when listeners are disabled', () => {
    const layout: ClientLayout = 'web'

    useGlobalHotKeys(mockEventBus, layout, true)

    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener
    const keyboardEvent = new KeyboardEvent('keydown', { key: 'l', metaKey: true })

    callback(keyboardEvent)

    expect(handleHotkeys).not.toHaveBeenCalled()
  })

  it('passes desktop layout to handleHotkeys when using desktop layout', () => {
    const layout: ClientLayout = 'desktop'

    useGlobalHotKeys(mockEventBus, layout)

    // Get the callback that was registered
    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener

    // Create a keyboard event
    const keyboardEvent = new KeyboardEvent('keydown', { key: 't', metaKey: true })

    // Trigger the callback
    callback(keyboardEvent)

    expect(handleHotkeys).toHaveBeenCalledWith(keyboardEvent, mockEventBus, 'desktop')
  })

  it('removes the same handler that was added', () => {
    const layout: ClientLayout = 'web'

    useGlobalHotKeys(mockEventBus, layout)

    // Get the handler that was added and removed
    const addedHandler = addEventListenerSpy.mock.calls[0]?.[1]
    const removedHandler = removeEventListenerSpy.mock.calls[0]?.[1]

    // The same handler reference should be used for both add and remove
    expect(addedHandler).toBe(removedHandler)
  })
  it('ignores keyboard events from another embedding root', () => {
    const ownRoot = document.createElement('div').attachShadow({ mode: 'open' })
    const otherRoot = document.createElement('div').attachShadow({ mode: 'open' })
    injectedRoot.value = ownRoot
    useGlobalHotKeys(mockEventBus, 'modal')
    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener
    const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
    vi.spyOn(event, 'composedPath').mockReturnValue([otherRoot])
    callback(event)
    expect(handleHotkeys).not.toHaveBeenCalled()

    vi.mocked(event.composedPath).mockReturnValue([ownRoot])
    callback(event)
    expect(handleHotkeys).toHaveBeenCalledWith(event, mockEventBus, 'modal')
  })

  it('leaves embedded Escape dismissal to the native dialog', () => {
    const root = document.createElement('div').attachShadow({ mode: 'open' })
    injectedRoot.value = root
    useGlobalHotKeys(mockEventBus, 'modal')
    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    vi.spyOn(event, 'composedPath').mockReturnValue([root])
    callback(event)
    expect(handleHotkeys).not.toHaveBeenCalled()
  })

  it('keeps document shortcuts from handling embedded events', () => {
    useGlobalHotKeys(mockEventBus, 'web')
    const callback = addEventListenerSpy.mock.calls[0]?.[1] as EventListener
    const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
    vi.spyOn(event, 'composedPath').mockReturnValue([document.createElement('div').attachShadow({ mode: 'open' })])
    callback(event)
    expect(handleHotkeys).not.toHaveBeenCalled()
  })
})
