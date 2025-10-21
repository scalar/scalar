import { cva, useBindCx } from '@scalar/use-hooks/useBindCx'
import { defineComponent } from 'vue'

const variants = cva({
  base: 'border rounded p-2 bg-b-1',
  variants: { active: { true: 'bg-b-2' } },
})

export const SimpleComponent = defineComponent({
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

export const ComplexComponent = defineComponent({
  props: {
    active: { type: Boolean, default: false },
  },
  inheritAttrs: false,
  setup() {
    const { stylingAttrsCx, otherAttrs } = useBindCx()
    return { stylingAttrsCx, otherAttrs, variants }
  },
  template: `
<div v-bind="stylingAttrsCx(variants({ active }))">
  Outer
  <div class="border rounded p-1 mt-1" v-bind="otherAttrs">
    Inner
  </div>
</div>`,
})
