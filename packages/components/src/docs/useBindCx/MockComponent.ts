import { defineComponent } from 'vue'
import { useBindCx, cva } from '@scalar/use-hooks/useBindCx'

const variants = cva({
  base: 'border rounded p-2 bg-b-1',
  variants: { active: { true: 'bg-b-2' } },
})

export const MockComponent = defineComponent({
  props: {
    active: { type: Boolean, default: false },
  },
  inheritAttrs: false,
  setup() {
    const { cx } = useBindCx()
    return { cx, variants }
  },
  template: `<div v-bind="cx(variants({ active }))">MockComponent</div>`,
})
