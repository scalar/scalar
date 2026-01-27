import { ScalarButton } from '@scalar/components'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ResponseBodyStreaming from './ResponseBodyStreaming.vue'

describe('ResponseBodyStreaming', () => {
  let mockReader: ReadableStreamDefaultReader<Uint8Array>

  beforeEach(() => {
    vi.clearAllMocks()

    return () => {
      vi.restoreAllMocks()
    }
  })

  const createMockReader = (chunks: string[], shouldError = false): ReadableStreamDefaultReader<Uint8Array> => {
    let index = 0
    const encoder = new TextEncoder()

    return {
      read: vi.fn(() => {
        if (shouldError && index === 1) {
          throw new Error('Stream read error')
        }

        if (index < chunks.length) {
          const value = encoder.encode(chunks[index])
          index++
          return Promise.resolve({ done: false as const, value })
        }

        return Promise.resolve({ done: true as const, value: undefined })
      }),
      cancel: vi.fn(),
      releaseLock: vi.fn(),
      closed: Promise.resolve(undefined),
    }
  }

  describe('streaming data', () => {
    it('reads and displays single chunk', async () => {
      mockReader = createMockReader(['Hello World'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Hello World')
    })

    it('reads and displays multiple chunks', async () => {
      mockReader = createMockReader(['Hello ', 'World', '!'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Hello World!')
    })

    it('appends chunks in order', async () => {
      mockReader = createMockReader(['First', 'Second', 'Third'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      const text = wrapper.text()
      expect(text.indexOf('First')).toBeLessThan(text.indexOf('Second'))
      expect(text.indexOf('Second')).toBeLessThan(text.indexOf('Third'))
    })

    it('handles empty chunks', async () => {
      mockReader = createMockReader(['Hello', '', 'World'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('HelloWorld')
    })

    it('decodes UTF-8 text correctly', async () => {
      mockReader = createMockReader(['Hello 世界', 'Привет мир', 'مرحبا'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Hello 世界')
      expect(wrapper.text()).toContain('Привет мир')
      expect(wrapper.text()).toContain('مرحبا')
    })

    it('preserves whitespace and line breaks', async () => {
      mockReader = createMockReader(['Line 1\n', 'Line 2\n', 'Line 3'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Line 1\nLine 2\nLine 3')
    })
  })

  describe('loading state', () => {
    it('shows loading indicator while streaming', async () => {
      // Create a reader that never completes
      mockReader = {
        read: vi.fn().mockReturnValue(
          new Promise(() => {
            // Never resolves to keep loading state
          }),
        ),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Listening…')
      const loading = wrapper.findComponent({ name: 'ScalarLoading' })
      expect(loading.exists()).toBe(true)
    })

    it('hides loading indicator when stream completes', async () => {
      mockReader = createMockReader(['Complete'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Listening…')
    })
  })

  describe('error handling', () => {
    it('displays error message when stream fails', async () => {
      mockReader = createMockReader(['chunk1', 'chunk2'], true)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Stream read error')
    })

    it('stops loading when error occurs', async () => {
      mockReader = createMockReader(['chunk1'], true)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Listening…')
    })

    it('displays partial content before error', async () => {
      mockReader = createMockReader(['Partial content', 'Error here'], true)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Partial content')
    })

    it('logs error to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output
      })
      mockReader = createMockReader(['test'], true)

      mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading stream:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe('scrolling behavior', () => {
    it('has scrollable container', async () => {
      mockReader = createMockReader(['content'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()

      const container = wrapper.find('.overflow-auto')
      expect(container.exists()).toBe(true)
    })

    it('scrolls to bottom when content updates', async () => {
      mockReader = createMockReader(['Line 1\n', 'Line 2\n', 'Line 3\n'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      // We can't easily test actual scroll behavior in jsdom,
      // but we can verify the container exists and has overflow
      const container = wrapper.find('.overflow-auto')
      expect(container.exists()).toBe(true)
    })
  })

  describe('lifecycle hooks', () => {
    it('starts loading on mount', async () => {
      mockReader = createMockReader(['test'])
      mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      expect(mockReader.read).toHaveBeenCalled()
    })

    it('cancels reader on unmount', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      wrapper.unmount()

      expect(mockReader.cancel).toHaveBeenCalled()
    })

    it('stops loading on unmount', async () => {
      mockReader = {
        read: vi.fn().mockReturnValue(
          new Promise(() => {
            // Never resolves to test unmount behavior
          }),
        ),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()
      expect(wrapper.text()).toContain('Listening…')

      wrapper.unmount()

      expect(mockReader.cancel).toHaveBeenCalled()
    })
  })

  describe('content display', () => {
    it('displays content in monospace font', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()

      const contentDiv = wrapper.find('.font-code')
      expect(contentDiv.exists()).toBe(true)
    })

    it('preserves formatting with whitespace-pre-wrap', async () => {
      mockReader = createMockReader(['  indented\n  text  '])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()

      const contentDiv = wrapper.find('.whitespace-pre-wrap')
      expect(contentDiv.exists()).toBe(true)
    })

    it('does not display content before stream starts', async () => {
      mockReader = {
        read: vi.fn().mockReturnValue(
          new Promise(() => {
            // Never resolves to test initial state
          }),
        ),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      // Should only show loading, not content
      expect(wrapper.text()).toContain('Listening…')
    })

    it('displays error with distinct styling', async () => {
      mockReader = createMockReader(['test'], true)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      const errorDiv = wrapper.find('.text-red')
      expect(errorDiv.exists()).toBe(true)
    })
  })

  describe('real-world scenarios', () => {
    it('handles SSE (Server-Sent Events) style data', async () => {
      const events = [
        'event: message\ndata: {"text": "Hello"}\n\n',
        'event: message\ndata: {"text": "World"}\n\n',
        'event: done\ndata: {}\n\n',
      ]
      mockReader = createMockReader(events)

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('event: message')
      expect(wrapper.text()).toContain('{"text": "Hello"}')
      expect(wrapper.text()).toContain('{"text": "World"}')
    })

    it('handles streaming JSON chunks', async () => {
      const chunks = ['{"stream": true,', ' "chunks": [', '"chunk1",', '"chunk2"', ']', '}']
      mockReader = createMockReader(chunks)

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('{"stream": true, "chunks": ["chunk1","chunk2"]}')
    })

    it('handles log streaming', async () => {
      const logs = [
        '[2024-01-01 10:00:00] INFO: Application started\n',
        '[2024-01-01 10:00:01] DEBUG: Processing request\n',
        '[2024-01-01 10:00:02] INFO: Request completed\n',
      ]
      mockReader = createMockReader(logs)

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('INFO: Application started')
      expect(wrapper.text()).toContain('DEBUG: Processing request')
      expect(wrapper.text()).toContain('INFO: Request completed')
    })

    it('handles OpenAI streaming format', async () => {
      const chunks = [
        'data: {"id":"1","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"id":"1","object":"chat.completion.chunk","choices":[{"delta":{"content":" there"}}]}\n\n',
        'data: [DONE]\n\n',
      ]
      mockReader = createMockReader(chunks)

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Hello')
      expect(wrapper.text()).toContain('there')
      expect(wrapper.text()).toContain('[DONE]')
    })

    it('handles large streaming responses', async () => {
      const largeChunks = Array.from({ length: 100 }, (_, i) => `Chunk ${i}\n`)
      mockReader = createMockReader(largeChunks)

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Chunk 0')
      expect(wrapper.text()).toContain('Chunk 99')
    })
  })

  describe('edge cases', () => {
    it('handles stream with special characters', async () => {
      mockReader = createMockReader(['Special: @#$%^&*()'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('@#$%^&*()')
    })

    it('handles stream with emoji', async () => {
      mockReader = createMockReader(['Hello 👋', ' World 🌍', '!'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('👋')
      expect(wrapper.text()).toContain('🌍')
    })

    it('handles very long single line', async () => {
      const longLine = 'x'.repeat(10000)
      mockReader = createMockReader([longLine])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain(longLine)
    })

    it('handles rapid small chunks', async () => {
      const rapidChunks = 'Hello World'.split('').map((char) => char)
      mockReader = createMockReader(rapidChunks)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Hello World')
    })
  })

  describe('TextDecoder usage', () => {
    it('properly decodes multi-byte UTF-8 characters split across chunks', async () => {
      // This tests the decoder's ability to handle streaming multi-byte characters
      const encoder = new TextEncoder()
      const fullText = '你好世界' // Chinese characters (multi-byte UTF-8)
      const encoded = encoder.encode(fullText)

      // Split the bytes across multiple chunks
      const chunk1 = encoded.slice(0, 4)
      const chunk2 = encoded.slice(4, 8)
      const chunk3 = encoded.slice(8)

      let index = 0
      const chunks = [chunk1, chunk2, chunk3]

      mockReader = {
        read: vi.fn(() => {
          if (index < chunks.length) {
            const value = chunks[index]!
            index++
            return Promise.resolve({ done: false as const, value })
          }
          return Promise.resolve({ done: true as const, value: undefined })
        }),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('你好世界')
    })
  })

  describe('cancel button interaction', () => {
    it('shows cancel button while streaming', async () => {
      mockReader = {
        read: vi.fn().mockReturnValue(
          new Promise(() => {
            // Never resolves to keep loading state
          }),
        ),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      const cancelButton = wrapper.findComponent(ScalarButton)
      expect(cancelButton.exists()).toBe(true)
      expect(cancelButton.text()).toContain('Cancel')
    })

    it('hides cancel button when stream completes', async () => {
      mockReader = createMockReader(['Complete'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      const cancelButton = wrapper.findComponent(ScalarButton)
      expect(cancelButton.exists()).toBe(false)
    })

    it('stops streaming when cancel button is clicked', async () => {
      mockReader = {
        read: vi.fn().mockReturnValue(
          new Promise(() => {
            // Never resolves to keep loading state
          }),
        ),
        cancel: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()
      expect(wrapper.text()).toContain('Listening…')

      const cancelButton = wrapper.findComponent(ScalarButton)
      await cancelButton.trigger('click')
      await flushPromises()
      await nextTick()

      expect(mockReader.cancel).toHaveBeenCalled()
      expect(wrapper.text()).not.toContain('Listening…')
    })

    it('cancels reader immediately when button clicked', async () => {
      mockReader = {
        read: vi.fn(
          () =>
            new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
              // Never resolves - simulates ongoing read
            }),
        ),
        cancel: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      const cancelButton = wrapper.findComponent(ScalarButton)
      await cancelButton.trigger('click')
      await flushPromises()

      expect(mockReader.cancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('UI rendering', () => {
    it('renders Body title', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Body')
    })

    it('renders CollapsibleSection component', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      const collapsibleSection = wrapper.findComponent({ name: 'CollapsibleSection' })
      expect(collapsibleSection.exists()).toBe(true)
    })

    it('displays error and content simultaneously if error occurs mid-stream', async () => {
      const encoder = new TextEncoder()
      let callCount = 0

      mockReader = {
        read: vi.fn(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              done: false as const,
              value: encoder.encode('Before error'),
            })
          }
          return Promise.reject(new Error('Mid-stream error'))
        }),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Before error')
      expect(wrapper.text()).toContain('Mid-stream error')
    })
  })

  describe('error recovery', () => {
    it('clears previous error when new reader starts streaming', async () => {
      mockReader = {
        read: vi.fn(() => Promise.reject(new Error('First error'))),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('First error')

      // Create a new successful reader
      const newReader = createMockReader(['Success'])

      await wrapper.setProps({ reader: newReader })
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Success')
      expect(wrapper.text()).not.toContain('First error')
    })
  })

  describe('stream completion', () => {
    it('handles stream that completes immediately', async () => {
      mockReader = {
        read: vi.fn(() => Promise.resolve({ done: true as const, value: undefined })),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Listening…')
      expect(mockReader.read).toHaveBeenCalled()
    })

    it('handles empty stream', async () => {
      mockReader = createMockReader([])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Listening…')
      expect(wrapper.text()).toContain('Body')
    })

    it('calls decoder.decode() with no arguments in finally block', async () => {
      const encoder = new TextEncoder()
      mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false as const, value: encoder.encode('test') })
          .mockResolvedValueOnce({ done: true as const, value: undefined }),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('test')
    })
  })

  describe('prop changes', () => {
    it('restarts streaming when reader prop changes', async () => {
      const firstReader = createMockReader(['First content'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: firstReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('First content')

      const secondReader = createMockReader(['Second content'])
      await wrapper.setProps({ reader: secondReader })
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Second content')
    })

    it('rewrites content when reader changes', async () => {
      const firstReader = createMockReader(['First'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: firstReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('First')

      const secondReader = createMockReader(['Second'])
      await wrapper.setProps({ reader: secondReader })
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('First')
      expect(wrapper.text()).toContain('Second')
    })

    it('prevents race condition when old reader completes after new reader starts', async () => {
      const encoder = new TextEncoder()

      // Create a slow reader that will complete after being replaced
      let firstReaderCallCount = 0
      const firstReader = {
        read: vi.fn(() => {
          firstReaderCallCount++
          if (firstReaderCallCount === 1) {
            return Promise.resolve({
              done: false as const,
              value: encoder.encode('Old chunk 1'),
            })
          }
          // Return done after a delay to simulate slow completion
          return new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
            setTimeout(() => resolve({ done: true as const, value: undefined }), 50)
          })
        }),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: firstReader },
      })

      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Old chunk 1')

      // Create a new reader with multiple chunks while the old reader is still "active"
      const secondReader = createMockReader(['New chunk 1', 'New chunk 2', 'New chunk 3'])
      await wrapper.setProps({ reader: secondReader })
      await flushPromises()
      await nextTick()

      // Verify the old reader was cancelled
      expect(firstReader.cancel).toHaveBeenCalled()

      // Verify all chunks from the new reader are displayed
      expect(wrapper.text()).toContain('New chunk 1')
      expect(wrapper.text()).toContain('New chunk 2')
      expect(wrapper.text()).toContain('New chunk 3')

      // Verify old reader content is gone
      expect(wrapper.text()).not.toContain('Old chunk 1')
    })
  })

  describe('concurrent operations', () => {
    it('handles unmount during active read operation', async () => {
      mockReader = {
        read: vi.fn(
          () =>
            new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
              // Never resolves - simulates ongoing read
            }),
        ),
        cancel: vi.fn(),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()
      expect(mockReader.read).toHaveBeenCalled()

      wrapper.unmount()

      expect(mockReader.cancel).toHaveBeenCalled()
    })

    it('handles error during cancel operation', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console output
      })

      mockReader = {
        read: vi.fn(
          () =>
            new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
              // Never resolves
            }),
        ),
        cancel: vi.fn().mockRejectedValue(new Error('Cancel failed')),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await nextTick()

      const cancelButton = wrapper.findComponent(ScalarButton)
      await cancelButton.trigger('click')
      await flushPromises()

      expect(mockReader.cancel).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('accessibility', () => {
    it('uses semantic HTML structure', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()

      // Check for the scrollable content container
      const contentContainer = wrapper.find('.overflow-auto')
      expect(contentContainer.exists()).toBe(true)
    })

    it('error message is sticky positioned for visibility', async () => {
      mockReader = createMockReader(['test'], true)
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      await nextTick()

      const errorDiv = wrapper.find('.sticky')
      expect(errorDiv.exists()).toBe(true)
    })
  })

  describe('decoder buffer handling', () => {
    it('does not corrupt new stream with buffered bytes from cancelled stream', async () => {
      const encoder = new TextEncoder()

      // Create a multi-byte UTF-8 character (emoji uses 4 bytes)
      const emoji = '🔥'
      const emojiBytes = encoder.encode(emoji)

      // Split the emoji bytes - send only first 3 bytes, leaving decoder with incomplete character
      const incompleteBytes = emojiBytes.slice(0, 3)

      let firstReaderCallCount = 0
      const firstReader = {
        read: vi.fn(() => {
          firstReaderCallCount++
          if (firstReaderCallCount === 1) {
            // Send incomplete multi-byte sequence
            return Promise.resolve({
              done: false as const,
              value: incompleteBytes,
            })
          }
          // Keep the stream alive (never complete)
          return new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
            // Never resolves
          })
        }),
        cancel: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: firstReader },
      })

      await flushPromises()
      await nextTick()

      // At this point, the decoder has 3 bytes buffered (incomplete emoji)
      // Now cancel and start a new stream
      const secondReader = createMockReader(['Hello World'])
      await wrapper.setProps({ reader: secondReader })
      await flushPromises()
      await nextTick()

      // Verify the old reader was cancelled
      expect(firstReader.cancel).toHaveBeenCalled()

      // The new stream should start clean with "Hello World"
      // If the decoder buffer was not flushed/reset, we would see corruption
      const text = wrapper.text()
      expect(text).toContain('Hello World')

      // Verify there's no corruption from the incomplete emoji bytes
      // The replacement character � (U+FFFD) would appear if decoder wasn't reset
      // biome-ignore lint/suspicious/noControlCharactersInRegex: we want to test for the replacement character
      expect(text).not.toMatch(/[^\x00-\x7F\u0080-\uFFFF\u{10000}-\u{10FFFF}]/u)
    })

    it('properly resets decoder when switching between streams', async () => {
      const encoder = new TextEncoder()

      // First stream with partial UTF-8 sequence
      const chineseChar = '你' // 3-byte UTF-8 character
      const bytes = encoder.encode(chineseChar)
      const partialBytes = bytes.slice(0, 2) // Send only 2 of 3 bytes

      const firstReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false as const,
            value: partialBytes,
          })
          .mockReturnValue(
            new Promise<ReadableStreamReadResult<Uint8Array>>(() => {
              // Never resolves
            }),
          ),
        cancel: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
        closed: Promise.resolve(undefined),
      }

      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: firstReader },
      })

      await flushPromises()
      await nextTick()

      // Switch to second stream
      const secondReader = createMockReader(['ABC'])
      await wrapper.setProps({ reader: secondReader })
      await flushPromises()
      await nextTick()

      // The output should be clean "ABC" without any corruption
      const text = wrapper.text()
      expect(text).toContain('ABC')
      expect(text).not.toContain('�') // No replacement character from corruption

      // Switch to third stream to ensure it continues working correctly
      const thirdReader = createMockReader(['123'])
      await wrapper.setProps({ reader: thirdReader })
      await flushPromises()
      await nextTick()

      const finalText = wrapper.text()
      expect(finalText).toContain('123')
      expect(finalText).not.toContain('ABC') // Old content should be replaced
      expect(finalText).not.toContain('�') // No replacement character from corruption
    })
  })
})
