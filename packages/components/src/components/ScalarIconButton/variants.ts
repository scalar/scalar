import { styles } from '../ScalarButton'
import { cva } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'

export const variants = cva({
  base: 'scalar-icon-button grid aspect-square cursor-pointer rounded',
  variants: {
    size: {
      xxs: 'size-3.5 p-0.5',
      xs: 'size-5 p-1',
      sm: 'size-6 p-1',
      md: 'size-10 p-3',
      full: 'size-full',
    },
    disabled: {
      true: 'cursor-not-allowed shadow-none',
    },
    variant: styles,
  },
  compoundVariants: [
    {
      size: 'md',
      variant: 'ghost',
      class: 'size-8 p-2 m-1 -outline-offset-2 rounded-lg',
    },
  ],
  defaultVariants: {
    size: 'md',
    variant: 'ghost',
  },
})

export type Variants = VariantProps<typeof variants>
