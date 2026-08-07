import { placements } from '@floating-ui/utils'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { ScalarButton, ScalarIconButton } from '../../'
import MockDialog from './MockDialog.vue'
import ScalarHotkeyTooltip from './ScalarHotkeyTooltip.vue'
import ScalarTooltip from './ScalarTooltip.vue'

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
      // The mapping lets Storybook resolve the placement when it is set through
      // the story URL args (used by the alignment e2e snapshots).
      mapping: Object.fromEntries(placements.map((p) => [p, p])),
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

/**
 * A tooltip whose trigger lives inside a `<dialog>` opened with `showModal()`.
 *
 * `showModal()` promotes the dialog to the browser's top layer, which paints above the
 * rest of the document no matter what `z-index` the tooltip carries. The trigger sits at
 * the bottom of the dialog so a `top` placement puts the tooltip squarely over the
 * dialog's own background, which is what makes the overlap observable.
 */
export const InDialog: Story = {
  args: {
    delay: 0,
    placement: 'top',
  },
  render: (args) => ({
    components: { ScalarTooltip, ScalarButton, MockDialog },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <MockDialog modal>
    <span>Dialog content</span>
    <ScalarTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
    </ScalarTooltip>
  </MockDialog>
</div>
`,
  }),
}

/**
 * The same layout opened with `show()` instead of `showModal()`.
 *
 * A non-modal dialog is *not* promoted to the top layer, so the tooltip already paints
 * correctly here. This story exists to pin that difference down: it is why the tooltip
 * keys off `:modal` rather than the `open` property, which is true for both.
 */
export const InNonModalDialog: Story = {
  args: {
    delay: 0,
    placement: 'top',
  },
  render: (args) => ({
    components: { ScalarTooltip, ScalarButton, MockDialog },
    setup() {
      return { args }
    },
    template: `
<div class="flex items-center justify-center w-full h-screen">
  <MockDialog>
    <span>Dialog content</span>
    <ScalarTooltip v-bind="args">
      <ScalarButton>Hover Me</ScalarButton>
    </ScalarTooltip>
  </MockDialog>
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
