import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { vi } from 'vitest'

/** Creates a fresh mock event bus instance for testing */
export const createMockEventBus = (): WorkspaceEventBus =>
  ({
    on: vi.fn(() => vi.fn()),
    once: vi.fn(() => vi.fn()),
    off: vi.fn(),
    onAny: vi.fn(() => vi.fn()),
    offAny: vi.fn(),
    emit: vi.fn(() => null),
    flushDebouncedEmits: vi.fn(),
  }) as unknown as WorkspaceEventBus

/** Mock event bus for all your testing needs */
export const mockEventBus = createMockEventBus()
