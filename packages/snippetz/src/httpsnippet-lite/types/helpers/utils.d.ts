import type { ClientInfo, TargetId, TargetInfo } from '../targets/targets.js'

export type AvailableTarget = {
  clients: ClientInfo[]
} & TargetInfo
export declare const availableTargets: () => AvailableTarget[]
export declare const extname: (targetId: TargetId) => '' | `.${string}`
