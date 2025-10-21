import type { Args, Meta, StoryObj } from '@storybook/vue3'
import { type Component, computed, ref, watch } from 'vue'

import { ComplexComponent, SimpleComponent } from './MockComponents'

const attrsToList = (attrs?: Record<string, any>) =>
  Object.entries(attrs || {})
    .map(([key, value]) => (typeof value === 'string' ? `${key}="${value}"` : `:${key}="${value}"`))
    .join(' ')

const renderStory =
  ({ component }: { component: Component }) =>
  (args: Args) => ({
    components: { MockComponent: component },
    setup() {
      const mock = ref<InstanceType<typeof SimpleComponent>>()

      const rendered = ref('')
      const observer = new MutationObserver(() => {
        rendered.value = mock.value?.$el.outerHTML ?? ''
      })
      watch(
        mock,
        () => {
          observer.disconnect()
          if (!mock.value) {
            return
          }
          rendered.value = mock.value.$el.outerHTML
          observer.observe(mock.value.$el, { attributes: true, subtree: true })
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
<div class="grid grid-cols-[auto_1fr] items-center gap-y-8 gap-x-4">
  <span class="font-medium">Template</span>
  <code class="font-code">{{ passedIn }}</code>
  <span class="font-medium">HTML</span>
  <code class="font-code">{{ rendered }}</code>
  <span class="font-medium">Rendered</span>
  <MockComponent ref="mock" v-bind="bind" />
</div>
`,
  })

const meta = {
  title: 'Playgrounds / useBindCx',
  tags: ['!dev'],
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Applies the active variant and the "bg-b-2" class',
      table: {
        subcategory: 'Props',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    class: {
      control: 'text',
      description: 'Classes to apply to the component',
      table: {
        subcategory: 'Attributes',
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    style: {
      control: 'text',
      description: 'Styles to apply to the component',
      table: {
        subcategory: 'Attributes',
        type: { summary: 'object' },
        defaultValue: { summary: '' },
      },
    },
    attrs: {
      control: 'object',
      description: 'Additional attributes to apply to the component',
      table: {
        subcategory: 'Attributes',
        type: { summary: 'object' },
        defaultValue: { summary: 'None' },
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  render: renderStory({ component: SimpleComponent }),
}

export const Complex: Story = {
  render: renderStory({ component: ComplexComponent }),
}
