import {
  ScalarIconCloudArrowDown,
  ScalarIconCloudArrowUp,
  ScalarIconCloudCheck,
  ScalarIconCloudWarning,
} from '@scalar/icons'

import type { VersionStatus } from '@/v2/features/app/helpers/compute-version-status'

/** Visual presentation for a single sync state. */
export type VersionStatusPresentation = {
  /** Cloud-style icon component matching the swatch the design system uses for this state. */
  icon: typeof ScalarIconCloudCheck
  /** Tailwind text colour class applied to the icon. */
  class: string
  /** Human-readable description used as both the tooltip and the accessible label. */
  label: string
}

/**
 * Visual mapping for every sync status surfaced by the registry workflow.
 *
 * The mapping is intentionally shared across surfaces (version picker rows,
 * the right-side header indicator, future sync buttons / badges) so the icon
 * and colour for a given state stay consistent everywhere it is rendered.
 *
 * Keep the presentation purely declarative — no behaviour, no event
 * handlers — so it remains safe to import from any layer.
 */
export const VERSION_STATUS_PRESENTATION: Record<VersionStatus, VersionStatusPresentation> = {
  synced: {
    icon: ScalarIconCloudCheck,
    class: 'text-green',
    label: 'Synced with the registry',
  },
  push: {
    icon: ScalarIconCloudArrowUp,
    class: 'text-blue',
    label: 'Local changes ready to push',
  },
  pull: {
    icon: ScalarIconCloudArrowDown,
    class: 'text-blue',
    label: 'Upstream changes available to pull',
  },
  conflict: {
    icon: ScalarIconCloudWarning,
    class: 'text-orange',
    label: 'Conflicts detected — resolve before pulling',
  },
  unknown: {
    icon: ScalarIconCloudCheck,
    class: 'text-c-3',
    label: 'Version not loaded',
  },
}
