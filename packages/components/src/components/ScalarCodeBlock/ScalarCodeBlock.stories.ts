import type { Meta, StoryObj } from '@storybook/vue3'

import ScalarCodeBlock from './ScalarCodeBlock.vue'

const contentJs = `import { ApiClientReact } from '@scalar/api-client-react'
import React, { useState } from 'react'

export const Wrapper = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Click me to open the Api Client
      </button>

      <ApiClientReact
        close={() => setIsOpen(false)}
        isOpen={isOpen}
        request={{
          url: 'https://api.sampleapis.com',
          type: 'GET',
          path: '/simpsons/products',
        }}
      />
    </>
  )
}
`
const contentJson = `[
  {
    "id": 1,
    "name": "Children",
    "normalized_name": "children",
    "gender": ""
  },
  {
    "id": 2,
    "name": "Mechanical Santa",
    "normalized_name": "mechanical santa",
    "gender": ""
  },
  {
    "id": 3,
    "name": "Tattoo Man",
    "normalized_name": "tattoo man",
    "gender": ""
  },
  {
    "id": 4,
    "name": "DOCTOR ZITSOFSKY",
    "normalized_name": "doctor zitsofsky",
    "gender": ""
  }
]
`

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarCodeBlock,
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarCodeBlock },
    setup() {
      return { args }
    },
    template: `<ScalarCodeBlock v-bind="args" />`,
  }),
} satisfies Meta<typeof ScalarCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { content: contentJs } }

export const LineNumbers: Story = {
  args: { content: contentJs, lineNumbers: true },
}

export const JSON: Story = {
  args: { content: contentJson, lineNumbers: true, lang: 'json' },
}

export const HideCredentials: Story = {
  args: {
    content: `curl --request PUT \
  --url https://petstore3.swagger.io/api/v3/pet \
  --header 'Authorization: Bearer 123234324'`,
    hideCredentials: ['123234324'],
  },
}
