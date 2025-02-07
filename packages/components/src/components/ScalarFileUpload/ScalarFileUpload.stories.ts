import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

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
    },
    setup() {
      return { args }
    },
    template: `
  <ScalarFileUpload v-bind="args">
  </ScalarFileUpload>
`,
  }),
} satisfies Meta<typeof ScalarFileUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}

export const WithFileList: Story = {
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
