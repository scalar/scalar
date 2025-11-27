import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { AllowedComponentProps, Component, VNodeProps } from 'vue'

import type {
  CommandPropsMap,
  OpenCommand,
  UiCommandIds,
} from '@/v2/features/command-palette/hooks/use-command-palette-state'

/**
 * Default props that all command components receive.
 * These are injected automatically by the command palette.
 */
export type DefaultCommandProps = {
  /** The workspace store for accessing documents and operations */
  workspaceStore: WorkspaceStore
  /** Event bus for emitting workspace events */
  eventBus: WorkspaceEventBus
  /** Function to open a command */
  'onOpen-command': OpenCommand
}

/** Helper type to make all properties writable */
export type Writable<T> = { -readonly [K in keyof T]: T[K] }

/**
 * Extracts the props type from a Vue component.
 * Strips out VNode and Vue-specific props to get only user-defined props.
 */
export type ComponentProps<C extends Component> = C extends new (
  ...args: any
) => {
  $props: infer P
}
  ? Omit<P, keyof VNodeProps | keyof AllowedComponentProps>
  : never

/**
 * Maps command IDs to their actual component props.
 * Used for validating that components accept the correct props.
 */
export type CommandComponentPropsMap<T extends Record<string, Component>> = {
  [K in keyof T]: ComponentProps<T[K]>
}

/**
 * Maps command IDs to their expected props (default props + command-specific props).
 * This is what each command component should accept.
 */
export type ExpectedCommandComponentPropsMap = {
  [K in UiCommandIds]: DefaultCommandProps &
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    (CommandPropsMap[K] extends undefined ? {} : CommandPropsMap[K])
}

/** Helper type to flatten and display complex types in IDE tooltips */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * Type-level assertion that compares actual component props with expected props.
 * Returns 'valid' if they match, otherwise returns a detailed debug object.
 *
 * Using literals prevents union collapse (true | never = true, but 'valid' | object stays distinct).
 */
export type AssertPropsMatch<Actual, Expected> = [Actual] extends [Expected]
  ? 'valid'
  : {
      status: 'invalid'
      actual: Prettify<Actual>
      expected: Prettify<Expected>
      missingProps: Prettify<Exclude<keyof Expected, keyof Actual>>
    }

/**
 * Validates that all command components have the correct props.
 * This type is used at the type-checking level to ensure type safety.
 */
export type CommandComponentPropsCheck<T extends Record<string, Component>> = {
  [K in UiCommandIds]: AssertPropsMatch<
    Writable<CommandComponentPropsMap<T>[K]>,
    Partial<ExpectedCommandComponentPropsMap[K]>
  >
}

/** All validation results for command components */
export type PropsCheckResults<T extends Record<string, Component>> =
  CommandComponentPropsCheck<T>[keyof CommandComponentPropsCheck<T>]

/**
 * Filter to show only invalid components.
 * Makes error messages clearer by excluding valid components.
 */
export type InvalidComponents<T extends Record<string, Component>> = {
  [K in keyof CommandComponentPropsCheck<T> as CommandComponentPropsCheck<T>[K] extends 'valid'
    ? never
    : K]: CommandComponentPropsCheck<T>[K]
}

/**
 * Final assertion type that shows only errors.
 * If all components are valid, evaluates to 'valid'.
 * If any component is invalid, shows only the invalid ones.
 */
export type AssertAllValid<T extends Record<string, Component>> = PropsCheckResults<T> extends 'valid'
  ? PropsCheckResults<T> extends { status: 'invalid' }
    ? Prettify<InvalidComponents<T>>
    : PropsCheckResults<T>
  : Prettify<InvalidComponents<T>>
