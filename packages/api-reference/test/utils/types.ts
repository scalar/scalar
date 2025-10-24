import type { AllowedComponentProps, Component, VNodeProps } from 'vue'

/** Get the props type of a component */
export type ComponentProps<C extends Component> = C extends new (
  ...args: any
) => any
  ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps>
  : never
