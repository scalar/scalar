import { describe, expect, it } from 'vitest'

import { resolveServerPathnames } from './resolve-server-pathnames'

describe('resolveServerPathnames', () => {
  it('expands the combinations of multiple enum variables', () => {
    expect(
      resolveServerPathnames({
        host: 'localhost',
        protocol: 'ws',
        pathname: '/{region}/{version}',
        variables: {
          region: { enum: ['eu', 'us'] },
          version: { enum: ['v1', 'v2'] },
        },
      }),
    ).toStrictEqual(['/eu/v1', '/eu/v2', '/us/v1', '/us/v2'])
  })
  it('keeps unconstrained variables dynamic', () => {
    expect(resolveServerPathnames({ host: 'localhost', protocol: 'ws', pathname: '/{tenant}' })).toStrictEqual([
      '/{tenant}',
    ])
  })
})
