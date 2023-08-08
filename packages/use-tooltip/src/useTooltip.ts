import tippy, { type Instance, type Props } from 'tippy.js'
import { ref, shallowRef, watchEffect } from 'vue'

import { isMacOS } from './isMacOS'

export function useTooltip(props: Partial<Props> = {}) {
  const elementRef = shallowRef<HTMLElement | null>(null)

  const tooltip = ref<Instance | null>(null)

  watchEffect(() => {
    tooltip.value?.destroy()

    if (elementRef.value && props.content) {
      tooltip.value = tippy(elementRef.value, {
        allowHTML: true,
        theme: 'app-tooltip',
        arrow: false,
        delay: 400,
        duration: [100, 200],
        offset: [0, 5],
        placement: 'top',
        ...props,
      })
    }
  })

  return elementRef
}

// ---------------------------------------------------------------------------

/** Mocked tagged template string to support lit-html syntax highlighting */
function html(strings: any, ...values: any) {
  let str = ''
  strings.forEach((string: any, i: number) => {
    str += string + (values[i] || '')
  })
  return str
}

/** Mocked tagged template string to support lit-html syntax highlighting */
function css(strings: any, ...values: any) {
  let str = ''
  strings.forEach((string: any, i: number) => {
    str += string + (values[i] || '')
  })
  return str
}

// ---------------------------------------------------------------------------

/** Tooltip content for keyboard shortcuts */
export function keyboardShortcutTooltip(keys: string, title?: string) {
  // 'mod+b' -> 'command+b'/'control+b' (depending on the OS)
  const differentKeyboardShortcutsForMacOS = (k: string) =>
    k
      .split('+')
      .map((key) => {
        if (key === 'mod') {
          if (isMacOS()) {
            return 'command'
          } else {
            return 'ctrl'
          }
        }

        return key
      })
      .join('+')

  // 'command+b' -> '⌘B'
  const formattedKeyboardShortcuts = (k: string) =>
    differentKeyboardShortcutsForMacOS(k)
      .split('+')
      .map((key) => {
        const keyMap: Record<string, string> = {
          escape: 'ESC',
          command: '⌘',
          shift: '⇧',
          ctrl: '⌃',
          alt: '⌥',
        }

        // command -> ⌘
        if (key in keyMap) {
          return keyMap[key]
        }

        // b -> B
        return key.charAt(0).toUpperCase() + key.slice(1)
      })

  const formattedKeys = formattedKeyboardShortcuts(keys)

  const itemStyle = css`
    border: 1px solid var(--background-2);
    padding: 4px;
    display: inline-block;
    background: var(--theme-background-4);
    min-width: 22px;
    text-align: center;
  `
  const item = (val: string) => html`<span style="${itemStyle}">${val}</span>`
  return html`
    <div>
      ${title}
      <div style="display: flex; gap: 3px">
        ${formattedKeys.map((k) => item(k)).join('')}
      </div>
    </div>
  `
}
