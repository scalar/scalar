import type { Meta, StoryObj } from '@storybook/vue3-vite'

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

const sdkSnippets = [
  {
    label: 'Kotlin',
    lang: 'kotlin',
    content: `val client = ScalarClient(token = "secret")
val books = client.books.list(limit = 10)`,
  },
  {
    label: 'Ruby',
    lang: 'ruby',
    content: `client = Scalar::Client.new(token: "secret")
books = client.books.list(limit: 10)`,
  },
  {
    label: 'Java',
    lang: 'java',
    content: `ScalarClient client = new ScalarClient("secret");
List<Book> books = client.books().list(10);`,
  },
  {
    label: 'C#',
    lang: 'csharp',
    content: `var client = new ScalarClient("secret");
var books = await client.Books.ListAsync(limit: 10);`,
  },
  {
    label: 'Swift',
    lang: 'swift',
    content: `let client = ScalarClient(token: "secret")
let books = try await client.books.list(limit: 10)`,
  },
  {
    label: 'Rust',
    lang: 'rust',
    content: `let client = ScalarClient::new("secret");
let books = client.books().list(ListBooksParams { limit: 10 }).await?;`,
  },
  {
    label: 'Dart',
    lang: 'dart',
    content: `final client = ScalarClient(token: 'secret');
final books = await client.books.list(limit: 10);`,
  },
  {
    label: 'C++',
    lang: 'cpp',
    content: `ScalarClient client("secret");
auto books = client.books().list(ListBooksParams{.limit = 10});`,
  },
]

const defaultSdkSnippet = {
  content: `val client = ScalarClient(token = "secret")
val books = client.books.list(limit = 10)`,
  lang: 'kotlin',
}

/**
 * Syntax highlighting in a light weight component
 */
const meta = {
  component: ScalarCodeBlock,
  argTypes: {
    class: { control: 'text' },
    lang: { control: 'text' },
    copy: { control: 'select', options: ['always', 'hover', false] },
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
  args: { content: contentJs, lineNumbers: true, lang: 'javascript' },
}

export const JSONString: Story = {
  args: { content: contentJson, lineNumbers: true, lang: 'json' },
}

export const Bordered: Story = {
  args: {
    content: contentJs,
    lineNumbers: true,
    lang: 'javascript',
    class: 'border rounded',
  },
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

export const SingleLine: Story = {
  args: {
    content: 'curl --request PUT --url https://galaxy.scalar.com/planets',
    lang: 'curl',
    class: 'border rounded',
    copy: 'always',
  },
  render: (args) => ({
    components: { ScalarCodeBlock },
    setup() {
      return { args }
    },
    template: `
<div class="flex flex-col h-dvh w-dvw p-2">
  <ScalarCodeBlock v-bind="args" />
</div>
    `,
  }),
}

/**
 * Code with character sequences that ligature fonts (like JetBrains Mono) would
 * normally combine into a single glyph. Ligatures are disabled so each character
 * renders literally.
 */
export const Ligatures: Story = {
  args: {
    content: `const compare = (a, b) => a !== b && a >= 0 && b <= 10
const arrow = a -> b
const pipe = value |> transform
const equal = x === y
const notEqual = x != y
const fatArrow = () => {}`,
    lang: 'javascript',
  },
}

export const HideCredentials: Story = {
  args: {
    content: contentCurl,
    lang: 'curl',
    hideCredentials: ['123234324'],
  },
}

export const SdkLanguages: Story = {
  args: defaultSdkSnippet,
  render: () => ({
    components: { ScalarCodeBlock },
    setup() {
      return { sdkSnippets }
    },
    template: `
<div class="grid min-h-dvh w-dvw gap-4 bg-b-1 p-4 md:grid-cols-2">
  <section v-for="snippet in sdkSnippets" :key="snippet.lang" class="flex min-w-0 flex-col gap-2">
    <h3 class="text-c-1 font-medium">{{ snippet.label }}</h3>
    <ScalarCodeBlock
      class="min-h-0 min-w-0 rounded border"
      :content="snippet.content"
      :lang="snippet.lang"
      copy="always"
      lineNumbers />
  </section>
</div>
    `,
  }),
}
