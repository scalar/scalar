import type { VariantProps } from 'cva'

import { cva } from '../../cva'

export const styles: Record<string, Record<string, any>> = {
  solid: [
    'scalar-button-solid',
    'bg-back-btn-1 text-fore-btn-1 shadow-sm active:bg-back-btn-1 active:shadow-none hocus:bg-hover-btn-1',
  ],
  outlined: [
    'scalar-button-outlined',
    'active:bg-btn-1 border border-solid border-border bg-transparent text-fore-1 hocus:bg-border',
  ],
  ghost: [
    'scalar-button-ghost',
    'bg-transparent text-fore-3 active:text-fore-2 hocus:text-fore-2',
  ],
  danger: [
    'scalar-button-danger',
    'bg-error text-white active:brightness-90 hocus:brightness-90',
  ],
}

export const variants = cva({
  base: 'scalar-button row cursor-pointer items-center justify-center rounded font-medium',
  variants: {
    disabled: {
      true: 'bg-background-2 text-color-3 cursor-not-allowed shadow-none',
    },
    fullWidth: { true: 'w-full' },
    size: { md: 'h-10 px-6 text-sm' },
    variant: styles,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: 'ghost',
      class: 'bg-transparent text-ghost',
    },
  ],
})

export type Variants = VariantProps<typeof variants>
