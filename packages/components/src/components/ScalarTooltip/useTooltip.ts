import { autoUpdate, flip, offset as offset, shift, useFloating, type Placement } from '@floating-ui/vue'
import { computed, ref, unref, watch, type MaybeRef } from 'vue'

type MaybeElement = Element | undefined | null

/** The configuration for the active tooltip */
type TooltipConfiguration = {
  content: MaybeRef<string>
  placement?: MaybeRef<Placement>
  offset?: MaybeRef<number>
  targetRef: MaybeRef<MaybeElement>
}

/** The ID of the tooltip element used to locate it in the DOM */
const ELEMENT_ID = 'scalar-tooltip' as const

/** The class name of the tooltip element */
const ELEMENT_CLASS = 'scalar-tooltip' as const

/** A reference to the tooltip element */
const el = ref<HTMLDivElement>()

/**
 * The configuration for the active tooltip
 *
 * If no tooltip is active it's undefined
 */
const config = ref<TooltipConfiguration>()

/**
 * Initialize the tooltip element
 *
 * If the tooltip is already initialized it will be ignored
 */
function initialize() {
  if (el.value) {
    console.warn('Tooltip already initialized')
    return
  }

  if (document.getElementById(ELEMENT_ID)) {
    el.value = document.getElementById(ELEMENT_ID) as HTMLDivElement
  } else {
    el.value = document.createElement('div')
    el.value.role = 'tooltip'
    el.value.id = ELEMENT_ID
    el.value.classList.add(ELEMENT_CLASS)
    document.body.appendChild(el.value)
  }

  const { floatingStyles } = useFloating(
    computed(() => unref(config.value?.targetRef)),
    el,
    {
      placement: computed(() => unref(config.value?.placement)),
      whileElementsMounted: autoUpdate,
      middleware: computed(() => [offset(unref(config.value?.offset)), flip(), shift()]),
    },
  )

  // Update the tooltip element's positioning when the floating styles change
  watch(floatingStyles, () => {
    if (!el.value) {
      return
    }

    el.value.style.position = floatingStyles.value.position
    el.value.style.top = floatingStyles.value.top
    el.value.style.left = floatingStyles.value.left
    el.value.style.transform = floatingStyles.value.transform ?? ''
    el.value.style.willChange = floatingStyles.value.willChange ?? ''
  })

  watch(config, () => {
    if (!el.value) {
      return
    }

    console.log('config changed', config.value)

    el.value.textContent = unref(config.value?.content) ?? null

    if (config.value) {
      el.value.style.setProperty('display', 'block')
    } else {
      el.value.style.setProperty('display', 'none')
    }
  })
}

/**
 * Cleanup the tooltip element
 *
 * If the tooltip is not initialized it will be ignored
 */
// function cleanup() {
//   if (!el.value) {
//     return
//   }

//   el.value.remove()
//   el.value = undefined
// }

function showTooltip(opts: TooltipConfiguration) {
  console.log('showTooltip', opts)
  document.addEventListener('keydown', handleEscape)

  config.value = opts
}

function hideTooltip() {
  console.log('hideTooltip')
  config.value = undefined
  document.removeEventListener('keydown', handleEscape)
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    hideTooltip()
  }
}

/**
 * Use the tooltip
 *
 * If the tooltip is not initialized it will be initialized
 */
export function useTooltip(opts: TooltipConfiguration) {
  if (!el.value) {
    initialize()
  }

  watch(
    () => unref(opts.targetRef),
    (newRef, oldRef) => {
      if (oldRef) {
        oldRef.removeEventListener('mouseenter', () => showTooltip(opts))
        oldRef.removeEventListener('mouseleave', () => hideTooltip())
        oldRef.removeEventListener('focus', () => showTooltip(opts))
        oldRef.removeEventListener('blur', () => hideTooltip())
      }
      if (newRef) {
        newRef.addEventListener('mouseenter', () => showTooltip(opts))
        newRef.addEventListener('mouseleave', () => hideTooltip())
        newRef.addEventListener('focus', () => showTooltip(opts))
        newRef.addEventListener('blur', () => hideTooltip())
      }
    },
  )
}
