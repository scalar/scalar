import { defineCustomElement } from 'vue'

import ApiReference from '../components/ApiReferenceElement.vue'
import styles from '../style.css?inline'

/** Register the API reference with its styles isolated inside a shadow root. */
const ApiReferenceElement = defineCustomElement(ApiReference, {
  styles: [styles],
})

// Script tags may load the bundle more than once on an embedding page.
if (!customElements.get('scalar-api-reference')) {
  customElements.define('scalar-api-reference', ApiReferenceElement)
}
