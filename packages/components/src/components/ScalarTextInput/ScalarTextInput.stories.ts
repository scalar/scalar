import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarTextInput from './ScalarTextInput.vue'

const meta: Meta = {
  component: ScalarTextInput,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    placeholder: { control: 'text' },
    prefix: { control: 'text' },
    suffix: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarTextInput },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: `<ScalarTextInput v-model="model" v-bind="args">
      <template #prefix v-if="args.prefix">{{ args.prefix }}</template>
      <template #suffix v-if="args.suffix">{{ args.suffix }}</template>
    </ScalarTextInput>`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithPrefix: Story = {
  args: {
    prefix: 'https://',
    placeholder: 'example.com',
  },
}

export const WithSuffix: Story = {
  args: {
    suffix: '@scalar.com',
    placeholder: 'someone',
  },
}

export const WithError: Story = {
  render: (args) => ({
    components: { ScalarTextInput },
    setup() {
      const model = ref('Bad input')
      return { args, model }
    },
    template: `<ScalarTextInput v-model="model" v-bind="args">
      <template #aside>
        <span class="text-c-danger">Error</span>
      </template>
    </ScalarTextInput>`,
  }),
}
