import type { Meta, StoryObj } from '@storybook/vue3'
import { computed, defineComponent, ref, watch } from 'vue'

import { cva } from '../cva'
import { useBindCx } from './useBindCx'

const attrsToList = (attrs?: Record<string, any>) =>
  Object.entries(attrs || {})
    .map(([key, value]) => (typeof value === 'string' ? `${key}="${value}"` : `:${key}="${value}"`))
    .join(' ')

const variants = cva({
  base: 'border rounded p-2 bg-b-1',
  variants: { active: { true: 'bg-b-2' } },
})

const MockComponent = defineComponent({
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

/**
 * Provides a wrapper around the `cx` function that merges the
 * component's class attribute with the provided classes.
 *
 * This allows you to override tailwind classes from the parent component and `cx`
 * will intelligently merge them while passing through other attributes.
 *
 * ### Example
 *
 * Scroll down for a working playground which mounts `MockComponent`.
 *
 * ```html
 * <script setup>
 * import { useBindCx, cva } from '@scalar/components'
 *
 * defineProps<{ active?: boolean }>()
 *
 * // Important: disable inheritance of attributes
 * defineOptions({ inheritAttrs: false })
 *
 * const { cx } = useBindCx()
 *
 * const variants = cva({
 *   base: 'border rounded p-2 bg-b-1',
 *   variants: { active: { true: 'bg-b-2' } },
 * })
 * </script>
 * <template>
 *   <div v-bind="cx(variants({ active }))">MockComponent</div>
 * </template>
 * ```
 */
const meta = {
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean', description: 'Applies the active variant' },
    class: { control: 'text', description: 'Additional classes to apply' },
    attrs: { control: 'object', description: 'Additional attributes to apply' },
  },
  render: (args) => ({
    components: { MockComponent },
    setup() {
      const mock = ref<InstanceType<typeof MockComponent>>()

      const rendered = ref('')
      const observer = new MutationObserver((mutations) => {
        rendered.value = (mutations[0].target as HTMLElement).outerHTML
      })
      watch(
        mock,
        () => {
          observer.disconnect()

          if (!mock.value) return
          rendered.value = mock.value.$el.outerHTML
          observer.observe(mock.value.$el, { attributes: true })
        },
        { immediate: true },
      )

      const passedIn = computed(() => {
        return `<MockComponent ${args.class ? `class="${args.class}"` : ''} ${args.active ? 'active' : ''} ${attrsToList(args.attrs)}/>`
      })
      const bind = computed(() => ({
        ...args,
        attrs: undefined,
        ...args.attrs,
      }))
      return { bind, passedIn, rendered, mock }
    },
    template: `
<table class="grid grid-cols-[auto_1fr] items-center gap-y-8 gap-x-4">
  <span class="font-medium">Template</span>
  <code class="font-code">{{ passedIn }}</code>
  <span class="font-medium">HTML</span>
  <code class="font-code">{{ rendered }}</code>
  <span class="font-medium">Rendered</span>
  <MockComponent ref="mock" v-bind="bind" />
</table>
`,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
