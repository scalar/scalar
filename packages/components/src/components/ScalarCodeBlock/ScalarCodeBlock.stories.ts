import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarCodeBlock from './ScalarCodeBlock.vue'
import ScalarCodeBlockCopy from './ScalarCodeBlockCopy.vue'

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
const contentJson = JSON.stringify([
  {
    id: 1,
    name: 'Children',
    normalized_name: 'children',
    gender: '',
  },
  {
    id: 2,
    name: 'Mechanical Santa',
    normalized_name: 'mechanical santa',
    gender: '',
  },
  {
    id: 3,
    name: 'Tattoo Man',
    normalized_name: 'tattoo man',
    gender: '',
  },
  {
    id: 4,
    name: 'DOCTOR ZITSOFSKY',
    normalized_name: 'doctor zitsofsky',
    gender: '',
  },
])

const contentCurl = String.raw`curl --request PUT \
  --url https://galaxy.scalar.com/planets \
  --header 'Authorization: Bearer 123234324'
`

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarCodeBlock,
  argTypes: {
    class: { control: 'text' },
    lang: { control: 'text' },
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  render: (args) => ({
    components: { ScalarCodeBlock },
    setup() {
      return { args }
    },
    template: `
<div class="grid h-dvh w-dvw">
  <ScalarCodeBlock class="min-h-0 min-w-0" v-bind="args" />
</div>
    `,
  }),
} satisfies Meta<typeof ScalarCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { content: contentJs, lang: 'javascript' } }

export const LineNumbers: Story = {
  args: { content: contentJs, lineNumbers: true },
}

export const JSONString: Story = {
  args: { content: contentJson, lineNumbers: true, lang: 'json' },
}

export const Bordered: Story = {
  args: { content: contentJs, lineNumbers: true, lang: 'javascript', class: 'border rounded' },
  render: (args) => ({
    components: { ScalarCodeBlock },
    setup() {
      return { args }
    },
    template: `
<div class="flex h-dvh w-dvw p-2">
  <ScalarCodeBlock v-bind="args" />
</div>
    `,
  }),
}

export const HideCredentials: Story = {
  args: {
    content: contentCurl,
    lang: 'curl',
    hideCredentials: ['123234324'],
  },
}

export const CopyButton: StoryObj = {
  argTypes: {
    content: { control: 'text' },
    controls: { control: 'text' },
    class: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarCodeBlockCopy },
    setup() {
      return { args }
    },
    template: `
      <div class="bg-b-2 flex">
        <ScalarCodeBlockCopy v-bind="args" class="opacity-100 left-10" />
      </div>
      `,
  }),
}
