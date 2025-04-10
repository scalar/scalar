import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import XCustomExtensionComponent from './components/XCustomExtensionComponent.vue'

export const XCustomExtensionPlugin: ApiReferencePlugin = () => {
  return {
    name: 'x-custom-extension-plugin',
    extensions: [
      {
        name: 'x-custom-extension',
        component: XCustomExtensionComponent,
      },
    ],
  }
}
