import type { VariantProps } from 'cva'

import { cva } from '../../cva'

export const styles: Record<string, Record<string, any>> = {
  solid: [
    'scalar-button-solid',
    'bg-b-btn text-c-btn shadow-sm active:bg-b-btn active:shadow-none hocus:bg-h-btn',
  ],
  outlined: [
    'scalar-button-outlined',
    'active:bg-btn-1 border border-solid border-border bg-transparent text-c-1 hover:bg-b-2 shadow',
  ],
  ghost: [
    'scalar-button-ghost',
    'bg-transparent text-c-3 active:text-c-1 hocus:text-c-1',
  ],
  danger: [
    'scalar-button-danger',
    'bg-red text-white active:brightness-90 hocus:brightness-90',
  ],
}

export const variants = cva({
  base: 'scalar-button scalar-row cursor-pointer items-center justify-center rounded font-medium',
  variants: {
    disabled: {
      true: 'bg-background-2 text-color-3 shadow-none',
    },
    fullWidth: { true: 'w-full' },
    size: { sm: 'px-2 py-1 text-xs', md: 'h-10 px-6 text-sm' },
    variant: styles,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: ['solid', 'outlined', 'ghost', 'danger'],
      class: 'bg-b-2 text-c-3 shadow-none',
    },
  ],
})

export type Variants = VariantProps<typeof variants>
