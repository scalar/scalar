import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScalarIconButton from '../ScalarIconButton/ScalarIconButton.vue'
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

export const WithAside: Story = {
  render: (args) => ({
    components: { ScalarTextInput, ScalarIconButton },
    setup() {
      const model = ref('password')
      const mask = ref(true)
      return { args, model, mask }
    },
    template: `<ScalarTextInput v-model="model" :type="mask ? 'password' : 'text'" v-bind="args">
      <template #aside>
        <ScalarIconButton
          class="-m-1.5"
          :icon="mask ? 'Show' : 'Hide'"
          size="sm"
          @click="mask = !mask" />
      </template>
    </ScalarTextInput>`,
  }),
}
