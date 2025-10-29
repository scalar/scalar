import type { Source } from '@test/data/sources'

/** Type guard for classic layout */
export function isClassic(config: Source): config is Source & { layout: 'classic' } {
  return (config as any).layout === 'classic'
}
