import { describe, expect, it } from 'vitest'

import { ApiReferenceReact } from './react-server'

describe('react-server', () => {
  it('returns a lightweight div element fallback', () => {
    expect(ApiReferenceReact()).toStrictEqual({
      $$typeof: Symbol.for('react.transitional.element'),
      type: 'div',
      key: null,
      props: {},
      _owner: null,
      _store: {},
    })
  })
})
