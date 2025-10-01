import type { ButtonVariant, ClassList } from '@/components/ScalarButton/types'

/** Styles for the different button variants */
export const BUTTON_VARIANT_STYLES = {
  solid: [
    'scalar-button-solid',
    'bg-b-btn text-c-btn focus-visible:border-c-btn active:bg-b-btn hover:bg-h-btn outline-offset-1',
  ],
  outlined: [
    'scalar-button-outlined',
    'active:bg-btn-1 border border-solid border-border bg-b-1 text-c-1 hover:bg-b-2',
  ],
  ghost: ['scalar-button-ghost', 'bg-transparent text-c-3 active:text-c-1 hover:text-c-1'],
  danger: ['scalar-button-danger', 'bg-c-danger text-white active:brightness-90 hover:brightness-90'],
} as const satisfies Record<ButtonVariant, ClassList>
