import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarForm from './ScalarForm.vue'
import { ScalarButton } from '../ScalarButton'

const meta: Meta = {
  component: ScalarForm,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarForm, ScalarButton },
    setup() {
      const handleSubmit = (event: SubmitEvent) => {
        alert(`Submit Event!\nEvent Data:\n${JSON.stringify(event, null, 2)}`)
      }
      return { args, handleSubmit }
    },
    template: `
<ScalarForm @submit="handleSubmit" v-bind="args">
  <div class="placeholder h-24">Form content</div>
  <ScalarButton type="submit">Submit</ScalarButton>
</ScalarForm>
`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
