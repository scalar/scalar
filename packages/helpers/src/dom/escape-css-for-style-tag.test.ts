// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { escapeCssForStyleTag } from './escape-css-for-style-tag'

describe('escape-css-for-style-tag', () => {
  it.each(['</style>', '</StYlE>', '</style\n>', '</style/>', '</style data-x>'])(
    'keeps %s inside the style element',
    (closingTag) => {
      const css = `/* ${closingTag}<script id="injected">window.injected = true</script><style> */`
      const document = new DOMParser().parseFromString(`<style>${escapeCssForStyleTag(css)}</style>`, 'text/html')

      expect(document.querySelector('#injected')).toBeNull()
      expect(document.querySelectorAll('style').length).toBe(1)
      expect(document.querySelector('style')?.textContent).toBe(css.replace('</', '<\\/'))
    },
  )

  it('preserves ordinary CSS without HTML entity encoding', () => {
    const css = 'a > b { color: red; } .label::after { content: "< & >"; }'

    expect(escapeCssForStyleTag(css)).toBe(css)
    expect(escapeCssForStyleTag('')).toBe('')
  })

  it('escapes every closing tag while preserving case', () => {
    expect(escapeCssForStyleTag('/* </STYLE> </style> */')).toBe('/* <\\/STYLE> <\\/style> */')
  })
})
