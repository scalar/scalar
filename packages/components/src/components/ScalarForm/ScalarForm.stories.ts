import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarForm from './ScalarForm.vue'
import { ScalarButton } from '../ScalarButton'
import ScalarFormSection from './ScalarFormSection.vue'
import ScalarFormField from './ScalarFormField.vue'
import { ScalarTextInput } from '../ScalarTextInput'
import { ScalarTextArea } from '../ScalarTextArea'

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

export const WithSections: Story = {
  render: (args) => ({
    components: { ScalarForm, ScalarFormSection, ScalarFormField },
    setup() {
      return { args }
    },
    template: `
      <ScalarForm v-bind="args">
        <ScalarFormSection>
          <template #label>Section Label</template>
          <ScalarFormField>
            <template #label>Input Label</template>
            <div class="placeholder border outline-none rounded">Input goes here</div>
          </ScalarFormField>
          <ScalarFormField>
            <template #label>Input Label</template>
            <div class="placeholder border outline-none rounded">Input goes here</div>
          </ScalarFormField>
        </ScalarFormSection>
      </ScalarForm>
    `,
  }),
}
export const WithFields: Story = {
  render: (args) => ({
    components: { ScalarForm, ScalarFormSection, ScalarFormField, ScalarTextInput, ScalarTextArea },
    setup() {
      return { args }
    },
    template: `
      <ScalarForm v-bind="args">
        <ScalarFormSection>
          <template #label>Section Label</template>
          <ScalarFormField>
            <template #label>Single Line Input</template>
            <ScalarTextInput />
            <template #below>
              <span class="text-c-danger">This is an error message</span>
            </template>
        </ScalarFormField>
        <ScalarFormField>
          <template #label>Multi-Line Input</template>
            <ScalarTextArea />
          </ScalarFormField>
        </ScalarFormSection>
      </ScalarForm>
    `,
  }),
}
