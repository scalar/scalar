import type { ApiReferencePlugin } from '@scalar/types/api-reference'

import CustomVueComponent from './components/CustomVueComponent.vue'

export const MyCustomPlugin = (): ApiReferencePlugin => {
  return () => {
    return {
      name: 'x-custom-extension-plugin',
      extensions: [
        // Vue
        {
          name: 'x-custom-extension',
          component: CustomVueComponent,
        },
        // React
        // {
        //   name: 'x-custom-extension',
        //   component: CustomReactComponent,
        //   renderer: ReactRenderer,
        // },
      ],
    }
  }
}
