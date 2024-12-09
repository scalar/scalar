import { defineCustomElement } from 'vue'

import ApiReference from './components/ApiReference.vue'

/** Provide a web component interface for the ApiReference component */
const CustomElement = defineCustomElement(ApiReference)

// Register the custom element.
// After registration, all `<scalar-api-reference>` tags
// on the page will be upgraded.
customElements.define('scalar-api-reference', CustomElement)
