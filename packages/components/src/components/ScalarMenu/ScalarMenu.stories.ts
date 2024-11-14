import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { ScalarButton } from '../ScalarButton'
import type { ScalarListboxOption } from '../ScalarListbox'
import {
  ScalarMenu,
  ScalarMenuLink,
  ScalarMenuResources,
  ScalarMenuSection,
  ScalarMenuTeamPicker,
} from './'

const meta = {
  component: ScalarMenu,
  tags: ['autodocs'],
  argTypes: {},
  render: (args) => ({
    components: { ScalarMenu },
    setup() {
      return { args }
    },
    template: `<ScalarMenu v-bind="args"></ScalarMenu>`,
  }),
} satisfies Meta<typeof ScalarMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const TeamPicker: Story = {
  render: (args) => ({
    components: {
      ScalarMenu,
      ScalarMenuLink,
      ScalarMenuSection,
      ScalarMenuTeamPicker,
      ScalarMenuResources,
    },
    setup() {
      const teams: ScalarListboxOption[] = [
        { label: 'Team 1', id: 'team-1' },
        { label: 'Team 2', id: 'team-2' },
      ]
      const team = ref(teams[0])
      return { args, teams, team }
    },
    template: `
<ScalarMenu v-bind="args">
  <template #sections>
    <ScalarMenuSection>
      <template #title>Account</template>
      <ScalarMenuTeamPicker :teams="teams" v-model:team="team" />
      <ScalarMenuLink>Settings</ScalarMenuLink>
      <ScalarMenuLink>Logout</ScalarMenuLink>
    </ScalarMenuSection>
    <ScalarMenuResources />
  </template>
</ScalarMenu>`,
  }),
}

export const CustomButton: Story = {
  render: (args) => ({
    components: {
      ScalarMenu,
      ScalarButton,
    },
    setup() {
      const teams: ScalarListboxOption[] = [
        { label: 'Team 1', id: 'team-1' },
        { label: 'Team 2', id: 'team-2' },
      ]
      const team = ref(teams[0])
      return { args, teams, team }
    },
    template: `
<ScalarMenu v-bind="args">
  <template #button>
    <ScalarButton>Custom Button</ScalarButton>
  </template>
</ScalarMenu>`,
  }),
}
