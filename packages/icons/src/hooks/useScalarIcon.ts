import { computed } from 'vue'
import type { ScalarIconProps, ScalarIconWeight } from '@/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

const defaultWeight: ScalarIconWeight = 'regular' as const

export function useScalarIcon(props: ScalarIconProps = {}) {
  const { cx } = useBindCx()

  const a11yAttrs = computed(() =>
    props.label ? { 'aria-label': props.label } : { 'aria-hidden': true, role: 'presentation' },
  )

  return {
    bind: computed(() => ({
      width: '1em',
      height: '1em',
      ...a11yAttrs.value,
      ...cx(),
    })),
    weight: computed(() => props.weight ?? defaultWeight),
  }
}
