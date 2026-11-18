import { ScalarIcon } from '@scalar/components/icon'
import '@scalar/components/style.css'
import { createSSRApp, h, nextTick } from 'vue'

import type { ScalarIconProps } from '../../src/components/ScalarIcon/types'

/** Use the same built component on the server and in the browser, as package consumers do. */
window.hydrateIcon = async (props) => {
  createSSRApp({ render: () => h(ScalarIcon, props) }).mount('#root')
  await nextTick()
}

declare global {
  interface Window {
    /** Hydrates the server-rendered SVG supplied by the browser regression test. */
    hydrateIcon: (props: ScalarIconProps) => Promise<void>
  }
}
