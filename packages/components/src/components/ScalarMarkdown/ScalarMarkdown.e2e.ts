import { test, takeSnapshot } from '@test/helpers'

test.describe('ScalarMarkdown', () => {
  const samples = ['Alerts', 'Blockquotes', 'Codeblocks', 'Headers', 'Html', 'Inline', 'Lists', 'Paragraphs', 'Tables']

  samples.forEach((sample) => test(sample, takeSnapshot))

  test.describe('Line Clamping', () => {
    const values = [0, 1, 2, 6] as const
    values.forEach((value) =>
      test.describe(() => {
        test.use({ component: 'ScalarMarkdown', story: 'Base', args: { clamp: value } })
        test(`Clamp ${value} Line${value === 1 ? '' : 's'}`, ({ snapshot }) => snapshot(`clamp-${value}`))
      }),
    )
  })
})
