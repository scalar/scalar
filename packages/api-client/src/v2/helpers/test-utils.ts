import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { vi } from 'vitest'

/** Creates a fresh mock event bus instance for testing */
export const createMockEventBus = (): WorkspaceEventBus =>
  ({
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    onGlob: vi.fn(),
    offGlob: vi.fn(),
    emit: vi.fn(() => null),
    flushDebouncedEmits: vi.fn(),
  }) as unknown as WorkspaceEventBus

/** Mock event bus for all your testing needs */
export const mockEventBus = createMockEventBus()
