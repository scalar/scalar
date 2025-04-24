import type { ApiReferencePlugin } from '@scalar/types/api-reference'
import { CustomReactComponent } from './components/react/CustomReactComponent'
import ReactRenderer from './components/react/ReactRenderer.vue'
// import XCustomExtensionComponent from './components/XCustomExtensionComponent.vue'

export const XCustomExtensionPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'x-custom-extension-plugin',
      extensions: [
        // Vue
        // {
        //   name: 'x-custom-extension',
        //   component: XCustomExtensionComponent,
        // },
        // React
        {
          name: 'x-custom-extension',
          component: CustomReactComponent,
          renderer: ReactRenderer,
        },
      ],
    }
  }
}
