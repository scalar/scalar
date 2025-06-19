import type { VariantProps } from 'cva'

import { cva } from '@scalar/use-hooks/useBindCx'

export const styles = {
  solid: [
    'scalar-button-solid',
    'bg-b-btn text-c-btn shadow-sm focus-visible:border-c-btn active:bg-b-btn active:shadow-none hover:bg-h-btn outline-offset-1',
  ],
  outlined: [
    'scalar-button-outlined',
    'active:bg-btn-1 border border-solid border-border bg-b-1 text-c-1 hover:bg-b-2 shadow',
  ],
  ghost: ['scalar-button-ghost', 'bg-transparent text-c-3 active:text-c-1 hover:text-c-1'],
  danger: ['scalar-button-danger', 'bg-c-danger text-white active:brightness-90 hover:brightness-90'],
} as const

export const variants = cva({
  base: 'scalar-button flex cursor-pointer items-center justify-center rounded font-medium -outline-offset-1',
  variants: {
    disabled: { true: 'bg-b-2 text-color-3 shadow-none' },
    fullWidth: { true: 'w-full' },
    size: { sm: 'px-2 py-1 text-xs', md: 'h-10 px-6 text-sm' },
    variant: styles,
  },
  compoundVariants: [
    {
      disabled: true,
      variant: ['solid', 'outlined', 'ghost', 'danger'],
      class:
        'bg-b-2 text-c-3 shadow-none hover:bg-b-[_] cursor-not-allowed active:bg-b-[_] hover:text-c-[_] active:text-c-[_]',
    },
  ],
})

export type Variants = VariantProps<typeof variants>
