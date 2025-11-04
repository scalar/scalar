import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { vi } from 'vitest'

/** Mock event bus for all your testing needs */
export const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
} as unknown as WorkspaceEventBus
