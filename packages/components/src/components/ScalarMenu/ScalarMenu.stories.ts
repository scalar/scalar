import { ScalarIconGear, ScalarIconSignOut } from '@scalar/icons'
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
  ScalarMenuTeamProfile,
} from './'

const meta = {
  component: ScalarMenu,
  tags: ['autodocs'],
  argTypes: {
    logo: { control: { type: 'text' } },
    label: { control: { type: 'text' } },
  },
  render: (args) => ({
    components: { ScalarMenu },
    setup() {
      return { args }
    },
    template: `
<div class="w-full min-h-96">
  <ScalarMenu v-bind="args"></ScalarMenu>
</div>`,
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
      ScalarMenuTeamProfile,
      ScalarMenuResources,
    },
    setup() {
      const teams: ScalarListboxOption[] = [
        {
          label: 'A Team',
          src: 'https://picsum.photos/seed/1/100',
          id: 'team-a ',
        },
        {
          label: 'B Team',
          src: 'https://picsum.photos/seed/2/100',
          id: 'team-b',
        },
        {
          label: 'C Team',
          src: 'https://picsum.photos/seed/3/100',
          id: 'team-c',
        },
      ]
      const team = ref(teams[0])
      const handleAddTeam = () => alert('Add team!')

      return { args, teams, team, handleAddTeam, ScalarIconGear, ScalarIconSignOut }
    },
    template: `
<div class="w-full min-h-96">
  <ScalarMenu v-bind="args">
    <template #logo>
      <ScalarMenuTeamProfile :label="team.label" :src="team.src" />
    </template>
    <template #sections>
      <ScalarMenuSection>
        <template #title>Account</template>
        <ScalarMenuTeamPicker :teams="teams" v-model:team="team" @add="handleAddTeam" />
        <ScalarMenuLink :icon="ScalarIconGear" >Settings</ScalarMenuLink>
        <ScalarMenuLink :icon="ScalarIconSignOut">Logout</ScalarMenuLink>
      </ScalarMenuSection>
      <ScalarMenuResources />
    </template>
  </ScalarMenu>
</div>`,
  }),
}

export const CustomLogo: Story = {
  render: (args) => ({
    components: {
      ScalarMenu,
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
<div class="w-full min-h-96">
  <ScalarMenu v-bind="args">
    <template #logo>
      <svg class="h-full w-auto" viewBox="0 0 200 40" class="css-tx3xjx" role="img"><title>Storybook</title><defs><path d="M1.2 36.9L0 3.9c0-1.1.8-2 1.9-2.1l28-1.8a2 2 0 0 1 2.2 1.9 2 2 0 0 1 0 .1v36a2 2 0 0 1-2 2 2 2 0 0 1-.1 0L3.2 38.8a2 2 0 0 1-2-2z" id="a"></path></defs><g fill="none" fill-rule="evenodd"><path d="M53.3 31.7c-1.7 0-3.4-.3-5-.7-1.5-.5-2.8-1.1-3.9-2l1.6-3.5c2.2 1.5 4.6 2.3 7.3 2.3 1.5 0 2.5-.2 3.3-.7.7-.5 1.1-1 1.1-1.9 0-.7-.3-1.3-1-1.7s-2-.8-3.7-1.2c-2-.4-3.6-.9-4.8-1.5-1.1-.5-2-1.2-2.6-2-.5-1-.8-2-.8-3.2 0-1.4.4-2.6 1.2-3.6.7-1.1 1.8-2 3.2-2.6 1.3-.6 2.9-.9 4.7-.9 1.6 0 3.1.3 4.6.7 1.5.5 2.7 1.1 3.5 2l-1.6 3.5c-2-1.5-4.2-2.3-6.5-2.3-1.3 0-2.3.2-3 .8-.8.5-1.2 1.1-1.2 2 0 .5.2 1 .5 1.3.2.3.7.6 1.4.9l2.9.8c2.9.6 5 1.4 6.2 2.4a5 5 0 0 1 2 4.2 6 6 0 0 1-2.5 5c-1.7 1.2-4 1.9-7 1.9zm21-3.6l1.4-.1-.2 3.5-1.9.1c-2.4 0-4.1-.5-5.2-1.5-1.1-1-1.6-2.7-1.6-4.8v-6h-3v-3.6h3V11h4.8v4.6h4v3.6h-4v6c0 1.8.9 2.8 2.6 2.8zm11.1 3.5c-1.6 0-3-.3-4.3-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6.4-3 1-4.3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.3-1 1.7 0 3.2.3 4.4 1a7 7 0 0 1 3 2.8c.6 1.2 1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-2.7 1-4.4 1zm0-3.6c2.4 0 3.6-1.6 3.6-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.6-1c-2.3 0-3.5 1.4-3.5 4.4 0 3 1.2 4.6 3.5 4.6zm21.7-8.8l-2.7.3c-1.3.2-2.3.5-2.8 1.2-.6.6-.9 1.4-.9 2.5v8.2H96V15.7h4.6v2.6c.8-1.8 2.5-2.8 5-3h1.3l.3 4zm14-3.5h4.8L116.4 37h-4.9l3-6.6-6.4-14.8h5l4 10 4-10zm16-.4c1.4 0 2.6.3 3.6 1 1 .6 1.9 1.6 2.5 2.8.6 1.2.9 2.7.9 4.3 0 1.6-.3 3-1 4.3a6.9 6.9 0 0 1-2.4 2.9c-1 .7-2.2 1-3.6 1-1 0-2-.2-3-.7-.8-.4-1.5-1-2-1.9v2.4h-4.7V8.8h4.8v9c.5-.8 1.2-1.4 2-1.9.9-.4 1.8-.6 3-.6zM135.7 28c1.1 0 2-.4 2.6-1.2.6-.8 1-2 1-3.4 0-1.5-.4-2.5-1-3.3s-1.5-1.1-2.6-1.1-2 .3-2.6 1.1c-.6.8-1 2-1 3.3 0 1.5.4 2.6 1 3.4.6.8 1.5 1.2 2.6 1.2zm18.9 3.6c-1.7 0-3.2-.3-4.4-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6.4-3 1-4.3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.4-1 1.6 0 3 .3 4.3 1a7 7 0 0 1 3 2.8c.6 1.2 1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-2.7 1-4.3 1zm0-3.6c2.3 0 3.5-1.6 3.5-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.5-1c-2.4 0-3.6 1.4-3.6 4.4 0 3 1.2 4.6 3.6 4.6zm18 3.6c-1.7 0-3.2-.3-4.4-1a7 7 0 0 1-3-2.8c-.6-1.3-1-2.7-1-4.4 0-1.6.4-3 1-4.3a7 7 0 0 1 3-2.8c1.2-.7 2.7-1 4.4-1 1.6 0 3 .3 4.4 1a7 7 0 0 1 2.9 2.8c.6 1.2 1 2.7 1 4.3 0 1.7-.4 3.1-1 4.4a7 7 0 0 1-3 2.8c-1.2.7-2.7 1-4.3 1zm0-3.6c2.3 0 3.5-1.6 3.5-4.6 0-1.5-.3-2.6-1-3.4a3.2 3.2 0 0 0-2.5-1c-2.4 0-3.6 1.4-3.6 4.4 0 3 1.2 4.6 3.6 4.6zm27.4 3.4h-6l-6-7v7h-4.8V8.8h4.9v13.6l5.8-6.7h5.7l-6.6 7.5 7 8.2z" fill="currentColor"></path><mask id="b" fill="#fff"><use xlink:href="#a"></use></mask><use fill="#FF4785" fill-rule="nonzero" xlink:href="#a"></use><path d="M23.7 5L24 .2l3.9-.3.1 4.8a.3.3 0 0 1-.5.2L26 3.8l-1.7 1.4a.3.3 0 0 1-.5-.3zm-5 10c0 .9 5.3.5 6 0 0-5.4-2.8-8.2-8-8.2-5.3 0-8.2 2.8-8.2 7.1 0 7.4 10 7.6 10 11.6 0 1.2-.5 1.9-1.8 1.9-1.6 0-2.2-.9-2.1-3.6 0-.6-6.1-.8-6.3 0-.5 6.7 3.7 8.6 8.5 8.6 4.6 0 8.3-2.5 8.3-7 0-7.9-10.2-7.7-10.2-11.6 0-1.6 1.2-1.8 2-1.8.6 0 2 0 1.9 3z" fill="#FFF" fill-rule="nonzero" mask="url(#b)"></path></g></svg>
    </template>
  </ScalarMenu>
</div>`,
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
<div class="w-full min-h-96">
  <ScalarMenu v-bind="args">
    <template #button>
      <ScalarButton>Custom Button</ScalarButton>
    </template>
  </ScalarMenu>
</div>`,
  }),
}
