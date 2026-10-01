import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import { type NavigationHandlers, createWorkspaceEventBus } from './bus'
import type { NavigationEvents } from './definitions'

const disabled: NavigationHandlers = {
  'select:nav-item': false,
  'scroll-to:nav-item': false,
  'scroll-to:model-by-name': false,
  'ui:navigate': false,
  'ui:open:settings': false,
  'ui:open:client-modal': false,
  'tabs:navigate:previous': false,
  'tabs:navigate:next': false,
  'tabs:focus:tab': false,
  'tabs:focus:tab-last': false,
}

const commands = [
  { event: 'select:nav-item', payload: { id: 'operation' } },
  { event: 'scroll-to:nav-item', payload: { id: 'operation' } },
  { event: 'scroll-to:model-by-name', payload: { name: 'Pet' } },
  { event: 'ui:navigate', payload: { page: 'workspace', path: 'settings' } },
  { event: 'ui:open:settings', payload: undefined },
  { event: 'ui:open:client-modal', payload: { id: 'operation' } },
  { event: 'tabs:navigate:previous', payload: undefined },
  { event: 'tabs:navigate:next', payload: undefined },
  { event: 'tabs:focus:tab', payload: { index: 2 } },
  { event: 'tabs:focus:tab-last', payload: undefined },
] as const

describe('navigation', () => {
  it.each(commands)('dispatches $event with its payload', ({ event, payload }) => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()
    const observe = vi.fn()
    bus.onNavigation({ ...disabled, [event]: handler })
    bus.onAny(observe)

    bus.emit(event, payload)

    expect(handler).toHaveBeenCalledExactlyOnceWith(payload)
    expect(observe).toHaveBeenCalledExactlyOnceWith({ event, payload })
  })

  it.each(commands)('rejects unhandled $event even with a wildcard observer', ({ event, payload }) => {
    const bus = createWorkspaceEventBus()
    bus.onAny(vi.fn())

    expect(() => bus.emit(event, payload)).toThrow(`Unhandled navigation command "${event}"`)
  })

  it.each(commands)('rejects an explicitly disabled $event', ({ event, payload }) => {
    const bus = createWorkspaceEventBus()
    const observer = vi.fn()
    bus.onNavigation(disabled)
    bus.onAny(observer)

    expect(() => bus.emit(event, payload)).toThrow(`Unsupported navigation command "${event}"`)
    expect(observer).not.toHaveBeenCalled()
  })

  it.each(commands)('removes handlers and disabled declarations for $event', ({ event, payload }) => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()
    const removeHandler = bus.onNavigation({ ...disabled, [event]: handler })
    const removeDisabled = bus.onNavigation(disabled)

    removeHandler()
    expect(() => bus.emit(event, payload)).toThrow('Unsupported navigation command')
    expect(handler).not.toHaveBeenCalled()
    removeDisabled()
    removeDisabled()
    expect(() => bus.emit(event, payload)).toThrow('Unhandled navigation command')
  })

  it('keeps a handler active when another host disables the same command', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()
    const removeDisabled = bus.onNavigation(disabled)
    bus.onNavigation({ ...disabled, 'scroll-to:model-by-name': handler })
    removeDisabled()
    bus.emit('scroll-to:model-by-name', { name: 'Pet' })
    expect(handler).toHaveBeenCalledExactlyOnceWith({ name: 'Pet' })
  })

  it('checks JavaScript registrations before installing any handlers', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()
    const incomplete = { 'select:nav-item': handler }
    // @ts-expect-error Exercise an incomplete JavaScript registration.
    expect(() => bus.onNavigation(incomplete)).toThrow('Missing navigation handler for "scroll-to:nav-item"')
    expect(() => bus.emit('select:nav-item', { id: 'operation' })).toThrow('Unhandled navigation command')
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects unhandled navigation before queuing it', () => {
    const bus = createWorkspaceEventBus()
    expect(() => bus.emit('scroll-to:model-by-name', { name: 'Pet' }, { debounceKey: 'model' })).toThrow(
      'Unhandled navigation command',
    )
  })

  it('reports a queued command whose handler was removed before dispatch', () => {
    const bus = createWorkspaceEventBus()
    const handler = vi.fn()
    const stop = bus.onNavigation({ ...disabled, 'scroll-to:model-by-name': handler })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      bus.emit('scroll-to:model-by-name', { name: 'Pet' }, { debounceKey: 'model' })
      stop()
      bus.flushDebouncedEmits?.()
      expect(error).toHaveBeenCalledExactlyOnceWith(
        '[EventBus] Error in debounced event "scroll-to:model-by-name":',
        expect.objectContaining({ message: expect.stringContaining('Unhandled navigation command') }),
      )
    } finally {
      error.mockRestore()
    }
  })

  it('requires all commands with their own payload types', () => {
    expectTypeOf<(typeof commands)[number]['event']>().toEqualTypeOf<keyof NavigationEvents>()
    const bus = createWorkspaceEventBus()
    bus.onNavigation({
      ...disabled,
      'select:nav-item': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['select:nav-item']>(),
      'scroll-to:nav-item': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['scroll-to:nav-item']>(),
      'scroll-to:model-by-name': (payload) =>
        expectTypeOf(payload).toEqualTypeOf<NavigationEvents['scroll-to:model-by-name']>(),
      'ui:navigate': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['ui:navigate']>(),
      'ui:open:settings': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['ui:open:settings']>(),
      'ui:open:client-modal': (payload) =>
        expectTypeOf(payload).toEqualTypeOf<NavigationEvents['ui:open:client-modal']>(),
      'tabs:navigate:previous': (payload) =>
        expectTypeOf(payload).toEqualTypeOf<NavigationEvents['tabs:navigate:previous']>(),
      'tabs:navigate:next': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['tabs:navigate:next']>(),
      'tabs:focus:tab': (payload) => expectTypeOf(payload).toEqualTypeOf<NavigationEvents['tabs:focus:tab']>(),
      'tabs:focus:tab-last': (payload) =>
        expectTypeOf(payload).toEqualTypeOf<NavigationEvents['tabs:focus:tab-last']>(),
    })

    const invalidRegistrations = (): void => {
      const { 'select:nav-item': _omitted0, ...withoutCommand0 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand0)
      const { 'scroll-to:nav-item': _omitted1, ...withoutCommand1 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand1)
      const { 'scroll-to:model-by-name': _omitted2, ...withoutCommand2 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand2)
      const { 'ui:navigate': _omitted3, ...withoutCommand3 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand3)
      const { 'ui:open:settings': _omitted4, ...withoutCommand4 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand4)
      const { 'ui:open:client-modal': _omitted5, ...withoutCommand5 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand5)
      const { 'tabs:navigate:previous': _omitted6, ...withoutCommand6 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand6)
      const { 'tabs:navigate:next': _omitted7, ...withoutCommand7 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand7)
      const { 'tabs:focus:tab': _omitted8, ...withoutCommand8 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand8)
      const { 'tabs:focus:tab-last': _omitted9, ...withoutCommand9 } = disabled
      // @ts-expect-error Every navigation command is required.
      bus.onNavigation(withoutCommand9)
      // @ts-expect-error Navigation commands require the complete registration.
      bus.on('scroll-to:model-by-name', vi.fn())
      // @ts-expect-error One-shot subscriptions do not provide complete navigation handling.
      bus.once('ui:navigate', vi.fn())
      bus.onNavigation({
        ...disabled,
        // @ts-expect-error Model navigation receives a name, not an item ID.
        'scroll-to:model-by-name': (_payload: { id: string }) => {},
      })
    }
    expectTypeOf(invalidRegistrations).toBeFunction()
  })
})
