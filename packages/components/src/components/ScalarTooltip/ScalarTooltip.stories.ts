import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton, ScalarIconButton } from '../../'
import ScalarTooltip from './ScalarTooltip.vue'
import ScalarHotkeyTooltip from './ScalarHotkeyTooltip.vue'
import { placements } from '@floating-ui/utils'

const meta = {
  component: ScalarTooltip,
  tags: ['autodocs'],
  args: {
    content: 'Tooltip Content',
  },
  argTypes: {
    content: {
      control: 'text',
    },
    delay: {
      control: { type: 'range', min: 0, max: 1000, step: 100 },
    },
    placement: {
      control: 'select',
      options: placements,
    },
    offset: {
      control: { type: 'range', min: 0, max: 30, step: 1 },
    },
    class: {
      control: 'text',
    },
  },
  render: (args) => ({
    components: {
      ScalarTooltip,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
  </ScalarTooltip>
</div>
`,
  }),
} satisfies Meta<typeof ScalarTooltip | typeof ScalarHotkeyTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Multiple: Story = {
  argTypes: {
    content: {
      control: false,
    },
  },
  args: {
    delay: 0,
    placement: 'bottom',
    offset: 0,
  },
  render: (args) => ({
    components: {
      ScalarTooltip,
      ScalarIconButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarTooltip v-bind="args" content="HTML">
      <ScalarIconButton icon="programming-language-html5" label="HTML" />
  </ScalarTooltip>
  <ScalarTooltip v-bind="args" content="CSS">
      <ScalarIconButton icon="programming-language-css3" label="CSS" />
  </ScalarTooltip>
  <ScalarTooltip v-bind="args" content="JavaScript">
      <ScalarIconButton icon="programming-language-javascript" label="JavaScript" />
  </ScalarTooltip>
  <ScalarTooltip v-bind="args" content="JSON">
      <ScalarIconButton icon="programming-language-json" label="JSON" />
  </ScalarTooltip>
</div>
`,
  }),
}

export const Hotkey: Story = {
  args: {
    content: undefined,
    hotkey: 'K',
    modifier: ['Meta', 'Shift'],
  },
  render: (args) => ({
    components: {
      ScalarHotkeyTooltip,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarHotkeyTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
  </ScalarHotkeyTooltip>
</div>
`,
  }),
}
export const LabelAndHotkey: Story = {
  args: {
    content: 'Open',
    hotkey: 'O',
    modifier: ['Meta'],
  },
  render: (args) => ({
    components: {
      ScalarHotkeyTooltip,
      ScalarButton,
    },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <ScalarHotkeyTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
  </ScalarHotkeyTooltip>
</div>
`,
  }),
}
