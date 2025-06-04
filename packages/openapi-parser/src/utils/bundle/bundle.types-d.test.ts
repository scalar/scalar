import type { RequirePropsWhenRoot } from '@/utils/bundle/bundle'
import { describe, it, expectTypeOf } from 'vitest'

type Config = {
  root?: string
  port?: number
  host?: string
}

type EnforcedConfig = RequirePropsWhenRoot<Config, 'port' | 'host'>

describe('RequirePropsWhenRoot', () => {
  it('should allow config without root', () => {
    const config: EnforcedConfig = {}
    expectTypeOf(config).toMatchTypeOf<Config>()
  })

  it('should allow full config when root is defined', () => {
    const config: EnforcedConfig = {
      root: '/app',
      port: 3000,
      host: 'localhost',
    }
    expectTypeOf(config).toMatchTypeOf<Config>()
  })

  it('should error if root is defined but port/host are missing', () => {
    // @ts-expect-error
    const configMissing: EnforcedConfig = { root: '/app' }
    void configMissing

    // @ts-expect-error
    const configMissingOne: EnforcedConfig = {
      root: '/app',
      port: 3000,
    }
    void configMissingOne

    // @ts-expect-error
    const configMissingTwo: EnforcedConfig = {
      root: '/app',
      host: 'localhost',
    }
    void configMissingTwo
  })

  it('should allow full config explicitly', () => {
    const config: EnforcedConfig = {
      root: '/my/root',
      port: 8080,
      host: '127.0.0.1',
    }
    expectTypeOf(config).toMatchTypeOf<Config>()
  })
})
