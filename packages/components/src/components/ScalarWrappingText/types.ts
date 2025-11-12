import type { PRESETS } from './constants'

type Preset = keyof typeof PRESETS

/** Props for the ScalarWrappingText component */
export type ScalarWrappingTextProps = {
  /** The text to wrap */
  text?: string
  /**
   * Presets for word wrapping
   *
   * @see {@link PRESETS}
   * @default 'path'
   */
  preset?: Preset
  /** Explicit regex to allow wrapping on, overrides any `preset` */
  regex?: RegExp
}
