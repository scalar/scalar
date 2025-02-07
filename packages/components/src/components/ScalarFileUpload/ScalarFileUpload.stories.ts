import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import { useLoadingState } from '../ScalarLoading'
import ScalarFileUpload from './ScalarFileUpload.vue'
import ScalarFileUploadFileList from './ScalarFileUploadFileList.vue'

const meta = {
  component: ScalarFileUpload,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    accept: {
      control: 'select',
      options: [
        ['.jpg', '.png'],
        ['.mp4', '.mov'],
        ['.mp3', '.wav'],
      ],
    },
  },
  render: (args) => ({
    components: {
      ScalarFileUpload,
      ScalarFileUploadFileList,
    },
    setup() {
      const files = ref<File[]>([])
      return { args, files }
    },
    template: `
  <ScalarFileUpload v-bind="args" v-model="files">
    <template v-if="files?.length" #default>
      <ScalarFileUploadFileList v-model="files" />
    </template>
  </ScalarFileUpload>
`,
  }),
} satisfies Meta<typeof ScalarFileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const Files: Story = {
  render: (args) => ({
    components: {
      ScalarFileUpload,
      ScalarFileUploadFileList,
    },
    setup() {
      const files = ref<File[]>([
        new File(['test'], 'test.txt', { type: 'text/plain' }),
      ])
      return { args, files }
    },
    template: `
  <ScalarFileUpload v-bind="args" v-model="files">
    <template v-if="files?.length" #default>
      <ScalarFileUploadFileList v-model="files" />
    </template>
  </ScalarFileUpload>
`,
  }),
}
export const Loading: Story = {
  render: (args) => ({
    components: {
      ScalarFileUpload,
      ScalarFileUploadFileList,
    },
    setup() {
      const loader = useLoadingState()
      loader.startLoading()
      return { args, loader }
    },
    template: `
  <ScalarFileUpload v-bind="args" :loader="loader" />
`,
  }),
}
