import { type ReferenceLayoutType, type ReferenceProps } from 'src/types'
import { type Component, type DeepReadonly } from 'vue'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const layouts: DeepReadonly<{
  [x in ReferenceLayoutType]: Component<ReferenceProps>
}> = {
  modern: ModernLayout,
  classic: ClassicLayout,
}

export default layouts
