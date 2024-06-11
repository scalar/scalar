import type { VariantProps } from 'cva'

import { cva } from '../../cva'

export const styles: Record<string, Record<string, any>> = {
  solid: [
    'scalar-button-solid',
    'bg-b-btn text-c-btn shadow-sm active:bg-b-btn active:shadow-none hocus:bg-h-btn',
  ],
  outlined: [
    'scalar-button-outlined',
    'active:bg-btn-1 border border-solid border-border bg-transparent text-c-1 hocus:bg-border',
  ],
  ghost: [
    'scalar-button-ghost',
    'bg-transparent text-c-3 transition-colors active:text-c-1 hocus:text-c-1',
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
    size: { sm: 'px-2 py-1 text-xs', md: 'h-10 px-6 text-sm' },
    variant: styles,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: 'ghost',
      class: 'text-ghost bg-transparent',
    },
  ],
})

export type Variants = VariantProps<typeof variants>
