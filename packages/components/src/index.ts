import type { App } from 'vue'

import { ScalarButton } from '@/components/ScalarButton'
import { ScalarIcon } from '@/components/ScalarIcon'
import { ScalarIconButton } from '@/components/ScalarIconButton'
import { ScalarLoading, useLoadingState } from '@/components/ScalarLoading'
import { ScalarModal, useModal } from '@/components/ScalarModal'
import { ScalarTextField } from '@/components/ScalarTextField'
import '@/tailwind/tailwind.css'

export default {
  install: (app: App) => {
    app.component('ScalarButton', ScalarButton)
    app.component('ScalarIcon', ScalarIcon)
    app.component('ScalarIconButton', ScalarIconButton)
    app.component('ScalarLoading', ScalarLoading)
    app.component('ScalarModal', ScalarModal)
    app.component('ScalarTextField', ScalarTextField)
  },
}

export {
  ScalarButton,
  ScalarIcon,
  ScalarIconButton,
  ScalarLoading,
  useLoadingState,
  ScalarModal,
  useModal,
  ScalarTextField,
}

export { extend, theme } from '@/tailwind'
