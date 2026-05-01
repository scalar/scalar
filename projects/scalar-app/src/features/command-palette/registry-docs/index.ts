import type { CommandPaletteAction } from '@scalar/api-client/v2/features/app'
import { ScalarIconAt } from '@scalar/icons'

import ImportRegistryDoc from '@/features/command-palette/registry-docs/components/ImportRegistryDoc.vue'

const importRegistryAction: CommandPaletteAction = {
  id: 'import-registry-doc',
  component: ImportRegistryDoc,
  name: 'Import from Scalar Registry',
  icon: ScalarIconAt,
}

export { importRegistryAction, ImportRegistryDoc }
