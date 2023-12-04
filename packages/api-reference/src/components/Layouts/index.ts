import { type ReferenceLayoutType } from 'src/types'
import { type DeepReadonly } from 'vue'

import type BaseLayout from './BaseLayout.vue'
import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const layouts: DeepReadonly<{
  [x in ReferenceLayoutType]: typeof BaseLayout
}> = {
  modern: ModernLayout,
  classic: ClassicLayout,
}

export default layouts
