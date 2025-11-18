import { defineCustomElement } from 'vue'

import { default as ApiReference } from '@/components/ApiReference.vue'

// Add the new element type to Vue's GlobalComponents type.
declare module 'vue' {
  interface GlobalComponents {
    'scalar-api-reference': typeof ApiReference
  }
}

/** Register the custom element with the browser */
export function registerCustomElement() {
  if (typeof customElements !== 'object') {
    return
  }

  // Turn the Vue component into a Custom Element
  const CustomElement = defineCustomElement(ApiReference)
  customElements.define('scalar-api-reference', CustomElement)
}
