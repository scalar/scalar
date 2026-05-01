import { reactive } from 'vue'

import { env } from '@/environment'

/** Copied from @scalar-org/entities/team/feature-flags.ts */
enum FeatureFlag {
  Rules = 'rules',
  Registry = 'registry',
  Schemas = 'schemas',
  SDK = 'sdk',
  CLI = 'cli',
  Agent = 'agent',
  MCP = 'mcp',
  Workspaces = 'workspaces',
  Export = 'export',
  DocsMCP = 'docsMcp',
  DisableApiSSR = 'disableApiSSR',
}

export const features: Record<FeatureFlag, boolean> = reactive({
  [FeatureFlag.Registry]: true,
  [FeatureFlag.SDK]: true,
  [FeatureFlag.CLI]: true,
  [FeatureFlag.Rules]: true,
  [FeatureFlag.Schemas]: true,
  [FeatureFlag.MCP]: true,
  [FeatureFlag.DisableApiSSR]: false,
  [FeatureFlag.Agent]: env.VITE_ENV !== 'production',
  [FeatureFlag.Workspaces]: env.VITE_ENV !== 'production',
  [FeatureFlag.Export]: env.VITE_ENV !== 'production',
  [FeatureFlag.DocsMCP]: env.VITE_ENV !== 'production',
})
