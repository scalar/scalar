import { describe, expect, it } from 'vitest'
import mobileHeaderSource from './MobileHeader.vue?raw'

describe('MobileHeader sidebar classes', () => {
  it('uses breakpoint scoped hidden class to avoid global hidden collisions', () => {
    const desktopSidebarClasses = mobileHeaderSource.match(/'([^']*\[grid-area:navigation\][^']*)'/)?.[1]

    expect(desktopSidebarClasses).toBeDefined()

    const classTokens = desktopSidebarClasses?.split(/\s+/) ?? []
    expect(classTokens.includes('max-lg:hidden')).toBe(true)
    expect(classTokens.includes('lg:flex')).toBe(true)
    expect(classTokens.includes('hidden')).toBe(false)
  })
})
