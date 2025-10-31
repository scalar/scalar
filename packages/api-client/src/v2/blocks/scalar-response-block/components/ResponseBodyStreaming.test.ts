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

  describe('rendering', () => {
    it('renders the component', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders ViewLayoutCollapse component', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      const collapse = wrapper.findComponent({ name: 'ViewLayoutCollapse' })
      expect(collapse.exists()).toBe(true)
    })

    it('displays title "Body"', async () => {
      mockReader = createMockReader(['test'])
      const wrapper = mount(ResponseBodyStreaming, {
        props: { reader: mockReader },
      })

      await flushPromises()
      expect(wrapper.text()).toContain('Body')
    })
  })

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
})
