import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { PRESETS } from './constants'
import ScalarWrappingText from './ScalarWrappingText.vue'

const meta: Meta = {
  component: ScalarWrappingText,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    text: { control: 'text' },
    preset: { control: 'select', options: Object.keys(PRESETS) },
  },
  render: (args) => ({
    components: { ScalarWrappingText },
    setup() {
      return { args }
    },
    template: `
<div class="wrap-break-word">
  <ScalarWrappingText v-bind="args" />
</div>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base = {
  args: {
    text: 'http://this.is.a.really.long.example.com/With/deeper/level/pages/deeper/level/pages/deeper/level/pages/deeper/level/pages/deeper/level/pages',
    preset: 'path',
  },
} satisfies Story

export const Property = {
  args: {
    text: 'ThisIsAVeryLongCamelCasePropertyNameThatNeedsToWrapProperly',
    preset: 'property',
  },
} satisfies Story
