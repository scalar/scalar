import { cva } from '@scalar/use-hooks/useBindCx'

/**
 * Variants for the ScalarIcon component
 */
export const variants = cva({
  variants: {
    size: {
      'xs': 'size-3',
      'sm': 'size-3.5',
      'md': 'size-4',
      'lg': 'size-5',
      'xl': 'size-6',
      '2xl': 'size-8',
      '3xl': 'size-10',
      'full': 'size-full',
    },
  },
  defaultVariants: {
    size: 'full',
  },
})
