import { test } from '@test/helpers'
import { samples } from './samples'

test.describe('ScalarMarkdown', () => {
  test.use({ background: true })

  samples.forEach(({ label }) => {
    test.describe(() => {
      test.use({ story: 'Base', args: { value: label } })
      test(label, ({ snapshot }) => snapshot(label.toLocaleLowerCase()))
    })
  })

  test.describe('Line Clamping', () => {
    const values = [0, 1, 2, 6] as const
    values.forEach((value) =>
      test.describe(() => {
        test.use({ component: 'ScalarMarkdown', story: 'Base', args: { clamp: value } })
        test(`Clamp ${value} Line${value === 1 ? '' : 's'}`, async ({ snapshot }) => await snapshot(`clamp-${value}`))
      }),
    )
  })
})
