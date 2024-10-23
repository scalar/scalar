import type { HotKeyConfig } from '@scalar/oas-utils/entities/workspace'

/**
 * Default set of keybindings for the client app
 */
export const APP_HOTKEYS: HotKeyConfig = {
  t: { event: 'addTopNav', modifiers: ['default'] },
  w: { event: 'closeTopNav', modifiers: ['default'] },
  ArrowLeft: { event: 'navigateTopNavLeft', modifiers: ['default', 'Alt'] },
  ArrowRight: { event: 'navigateTopNavRight', modifiers: ['default', 'Alt'] },
  l: { event: 'focusAddressBar', modifiers: ['default'] },
  1: { event: 'jumpToTab', modifiers: ['default'] },
  2: { event: 'jumpToTab', modifiers: ['default'] },
  3: { event: 'jumpToTab', modifiers: ['default'] },
  4: { event: 'jumpToTab', modifiers: ['default'] },
  5: { event: 'jumpToTab', modifiers: ['default'] },
  6: { event: 'jumpToTab', modifiers: ['default'] },
  7: { event: 'jumpToTab', modifiers: ['default'] },
  8: { event: 'jumpToTab', modifiers: ['default'] },
  9: { event: 'jumpToLastTab', modifiers: ['default'] },
  f: { event: 'focusRequestSearch', modifiers: ['default'] },
  n: { event: 'createNew', modifiers: ['default'] },
}
