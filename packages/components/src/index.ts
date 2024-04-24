import type { App } from 'vue'

import { ScalarButton } from './components/ScalarButton'
import { ScalarCodeBlock } from './components/ScalarCodeBlock'
import { type Icon, ScalarIcon } from './components/ScalarIcon'
import { ScalarIconButton } from './components/ScalarIconButton'
import { ScalarLoading, useLoadingState } from './components/ScalarLoading'
import { ScalarModal, useModal } from './components/ScalarModal'
import { ScalarSearchInput } from './components/ScalarSearchInput'
import {
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from './components/ScalarSearchResults'
import { ScalarTextField } from './components/ScalarTextField'
import './tailwind/tailwind.css'

export default {
  install: (app: App) => {
    app.component('ScalarButton', ScalarButton)
    app.component('ScalarIcon', ScalarIcon)
    app.component('ScalarIconButton', ScalarIconButton)
    app.component('ScalarLoading', ScalarLoading)
    app.component('ScalarModal', ScalarModal)
    app.component('ScalarSearchInput', ScalarSearchInput)
    app.component('ScalarSearchResultItem', ScalarSearchResultItem)
    app.component('ScalarSearchResultList', ScalarSearchResultList)
    app.component('ScalarTextField', ScalarTextField)
  },
}

export {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarIconButton,
  ScalarLoading,
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
  ScalarTextField,
  type Icon,
  useLoadingState,
  useModal,
}
