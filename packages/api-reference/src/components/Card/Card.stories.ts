import type { Meta, StoryObj } from '@storybook/vue3'

import { Card, CardContent, CardFooter, CardHeader } from '.'

const meta: Meta<typeof Card> = {
  title: 'Example/Card',
  component: Card,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Card>

export const Primary: Story = {
  render: () => ({
    components: {
      Card,
      CardHeader,
      CardContent,
      CardFooter,
    },
    template: `
      <Card v-bind="$props">
        <CardHeader>
          Test
        </CardHeader>
        <CardContent>
          Default
        </CardContent>
        <CardContent muted>
          Muted
        </CardContent>
        <CardContent frameless>
          Frameless
        </CardContent>
        <CardContent borderless>
          Borderless
        </CardContent>
        <CardFooter>
          Footer
        </CardFooter>
      </Card>
    `,
  }),
}
