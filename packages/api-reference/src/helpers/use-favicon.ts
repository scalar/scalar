import type { MaybeRefOrGetter } from 'vue'
import { toValue, watch } from 'vue'

/**
 * Custom favicon composable that only updates when the URL actually changes
 *
 * Unlike VueUse's useFavicon, this implementation:
 * - Only triggers DOM updates when the favicon URL string actually changes
 * - Doesn't re-trigger on computed re-evaluations if the value is the same
 * - Handles cleanup properly on component unmount
 */
export const useFavicon = (
  newIcon?: MaybeRefOrGetter<string | null | undefined>,
): void => {
  let currentFavicon: string | null = null
  let linkElement: HTMLLinkElement | null = null

  const updateFavicon = (href: string | null | undefined): void => {
    if (!href || href === currentFavicon) {
      return
    }

    currentFavicon = href

    if (typeof document === 'undefined') {
      return
    }

    if (!linkElement) {
      // Try to find existing favicon link
      linkElement =
        document.querySelector<HTMLLinkElement>('link[rel*="icon"]') ||
        document.createElement('link')

      linkElement.type = 'image/x-icon'
      linkElement.rel = 'shortcut icon'

      // Append if it's a new element
      if (!linkElement.parentNode) {
        document.head.appendChild(linkElement)
      }
    }

    linkElement.href = href
  }

  if (newIcon) {
    watch(
      () => toValue(newIcon),
      (value) => updateFavicon(value),
      { immediate: true },
    )
  }
}
