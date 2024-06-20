import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'
import { defineComponent, h, ref, shallowRef } from 'vue'

import { isMacOS } from './isMacOS'

// Shared state to track the last hidden timestamp globally
let globalLastHiddenTimestamp: number | null = null

export function useTooltip({ delay }: { delay?: number }) {
  const elementRef = shallowRef<HTMLElement | null>(null)
  const tooltipVisible = ref(false)
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null

  const handleMouseEnter = () => {
    const now = Date.now()
    if (globalLastHiddenTimestamp && now - globalLastHiddenTimestamp < 1000) {
      tooltipVisible.value = true
      return
    }
    hoverTimeout = setTimeout(() => {
      tooltipVisible.value = true
    }, delay || 500)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      hoverTimeout = null
    }
    tooltipVisible.value = false
    globalLastHiddenTimestamp = Date.now()
  }

  return { elementRef, tooltipVisible, handleMouseEnter, handleMouseLeave }
}

export const TooltipComponent = defineComponent({
  inheritAttrs: false,
  props: {
    tooltipVisible: {
      type: Boolean,
      required: true,
    },
    class: {
      type: String,
      default: null,
    },
  },
  setup(props, { slots }) {
    return () =>
      h(TooltipProvider, null, [
        h(TooltipRoot, null, {
          default: () => [
            h(
              TooltipTrigger,
              { as: 'div' },
              {
                default: () => [
                  h(
                    'div',
                    {
                      class: props.class,
                      style: {
                        display: props.tooltipVisible ? 'block' : 'none',
                      },
                    },
                    [slots.content ? slots.content() : null],
                  ),
                ],
              },
            ),
            h(TooltipPortal, null, {
              default: () => [
                h(TooltipContent, { class: props.class }, [
                  slots.content ? slots.content() : null,
                ]),
              ],
            }),
          ],
        }),
      ])
  },
})

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
    padding: 2px;
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    min-width: 20px;
    text-align: center;
  `
  const item = (val: string) => html`<span style="${itemStyle}">${val}</span>`
  const titleElement = title
    ? html`<span style="margin: 0 6px 0 3px">${title}</span>`
    : ''
  return html`
    <div style="display: flex; align-items: center">
      ${titleElement}
      <div style="display: flex; gap: 3px">
        ${formattedKeys.map((k) => item(k)).join('')}
      </div>
    </div>
  `
}
