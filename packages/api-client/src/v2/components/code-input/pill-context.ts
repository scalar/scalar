export type PillContext =
  | { type: 'environment'; name: string; value: string; isDefined: boolean }
  | { type: 'contextFunction'; identifier: string; details: string }
