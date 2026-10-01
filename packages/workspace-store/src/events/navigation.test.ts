import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceEventBus } from './bus'
import type { NavigationEvents } from './definitions'
import {
  type NavigationHandlers,
  canNavigate,
  createNavigation,
  isNavigationEvent,
  navigate,
  withNavigation,
} from './navigation'

const payloads = {
  'select:nav-item': { id: 'operation' },
  'scroll-to:nav-item': { id: 'operation' },
  'scroll-to:model-by-name': { name: 'Pet' },
  'ui:navigate': { page: 'workspace', path: 'settings' },
  'ui:open:settings': undefined,
  'ui:open:client-modal': { id: 'operation' },
  'tabs:navigate:previous': undefined,
  'tabs:navigate:next': undefined,
  'tabs:focus:tab': { index: 1 },
  'tabs:focus:tab-last': undefined,
} satisfies NavigationEvents

const commands = Object.keys(payloads) as (keyof NavigationEvents)[]

describe('navigation', () => {
  it.each(commands)('dispatches %s to its primary handler and observers exactly once', (event) => {
    const bus = createWorkspaceEventBus()
    const primary = vi.fn()
    const observer = vi.fn()
    const once = vi.fn()
    const host = createNavigation(bus, { [event]: primary } as unknown as NavigationHandlers<typeof event>)
    bus.on(event, observer)
    bus.once(event, once)

    navigate(host.navigation, event, payloads[event])
    expect(primary).toHaveBeenCalledExactlyOnceWith(payloads[event])
    expect(observer).toHaveBeenCalledExactlyOnceWith(payloads[event])
    expect(once).toHaveBeenCalledExactlyOnceWith(payloads[event])
    navigate(host.navigation, event, payloads[event])
    expect(primary).toHaveBeenCalledTimes(2)
    expect(once).toHaveBeenCalledTimes(1)
  })

  it('does not let observers satisfy a disposed primary handler', () => {
    const bus = createWorkspaceEventBus()
    const observer = vi.fn()
    bus.on('scroll-to:model-by-name', observer)
    const host = createNavigation(bus, { 'scroll-to:model-by-name': () => undefined })
    host.dispose()
    expect(() => navigate(host.navigation, 'scroll-to:model-by-name', { name: 'Pet' })).toThrow(
      'Missing primary handler',
    )
    expect(observer).not.toHaveBeenCalled()
  })

  it('keeps independent feature capabilities isolated on a shared bus', () => {
    const bus = createWorkspaceEventBus()
    const referenceHandler = vi.fn()
    const modalHandler = vi.fn()
    const reference = createNavigation(bus, { 'scroll-to:nav-item': referenceHandler })
    const modal = createNavigation(withNavigation(bus, reference.navigation), { 'scroll-to:nav-item': modalHandler })
    navigate(reference.navigation, 'scroll-to:nav-item', { id: 'reference' })
    expect(referenceHandler).toHaveBeenCalledExactlyOnceWith({ id: 'reference' })
    expect(modalHandler).not.toHaveBeenCalled()
    navigate(modal.navigation, 'scroll-to:nav-item', { id: 'modal' })
    expect(modalHandler).toHaveBeenCalledExactlyOnceWith({ id: 'modal' })
    modal.dispose()
    expect(() => navigate(modal.navigation, 'scroll-to:nav-item', { id: 'modal' })).toThrow('Missing primary handler')
    navigate(reference.navigation, 'scroll-to:nav-item', { id: 'reference-again' })
    expect(referenceHandler).toHaveBeenCalledTimes(2)
  })

  it('keeps legacy dispatch working with primary handlers and ordinary observers', () => {
    const bus = createWorkspaceEventBus()
    const primary = vi.fn()
    const observer = vi.fn()
    createNavigation(bus, { 'scroll-to:model-by-name': primary })
    bus.on('scroll-to:model-by-name', observer)
    bus.emit('scroll-to:model-by-name', { name: 'Pet' })
    expect(primary).toHaveBeenCalledExactlyOnceWith({ name: 'Pet' })
    expect(observer).toHaveBeenCalledExactlyOnceWith({ name: 'Pet' })
  })

  it('rejects undeclared capabilities while allowing explicitly disabled commands', () => {
    expect(canNavigate(false, 'ui:navigate')).toBe(false)
    expect(canNavigate({ 'ui:navigate': false }, 'ui:navigate')).toBe(false)
    expect(() => navigate(false, 'ui:navigate', payloads['ui:navigate'])).toThrow('Unsupported or missing command')
    // @ts-expect-error Untyped hosts must fail visibly at runtime as well.
    expect(() => canNavigate(undefined, 'ui:navigate')).toThrow('capability is required')
    // @ts-expect-error A scope must explicitly declare the requested command.
    expect(() => canNavigate({}, 'ui:navigate')).toThrow('Missing capability')
  })

  it('validates a registration before installing any handlers', () => {
    const bus = createWorkspaceEventBus()
    const host = createNavigation(bus, { 'select:nav-item': vi.fn<(payload: { id: string }) => void>() })
    const invalid = {
      'select:nav-item': vi.fn<(payload: { id: string }) => void>(),
      'scroll-to:model-by-name': undefined,
    }
    // @ts-expect-error Missing primary handlers cannot form a capability.
    expect(() => createNavigation(bus, invalid)).toThrow('Missing primary handler')
    navigate(host.navigation, 'select:nav-item', { id: 'operation' })
    expect(invalid['select:nav-item']).not.toHaveBeenCalled()
  })

  it('reports rejected asynchronous handlers', async () => {
    const error = new Error('route failed')
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const host = createNavigation(createWorkspaceEventBus(), { 'ui:navigate': () => Promise.reject(error) })
    navigate(host.navigation, 'ui:navigate', payloads['ui:navigate'])
    await Promise.resolve()
    expect(log).toHaveBeenCalledWith('[Navigation] Handler failed for "ui:navigate":', error)
    log.mockRestore()
  })

  it('recognizes every navigation command and excludes notification events', () => {
    expect(commands.every(isNavigationEvent)).toBe(true)
    expect(isNavigationEvent('ui:focus:search')).toBe(false)
    expect(isNavigationEvent('toString')).toBe(false)
  })
})

/** Payloads remain tied to the selected command even on a full host capability. */
const verifyCommandTypes = (full: NavigationHandlers): void => {
  // @ts-expect-error Model commands require their payload even on a full capability.
  navigate(full, 'scroll-to:model-by-name')
  // @ts-expect-error A tab index is not a model payload.
  navigate(full, 'scroll-to:model-by-name', { index: 1 })
  // @ts-expect-error A model name is not an item payload.
  navigate(full, 'scroll-to:nav-item', { name: 'Pet' })
  navigate(full, 'ui:open:settings')
  navigate(full, 'scroll-to:model-by-name', { name: 'Pet' })
}
void verifyCommandTypes
