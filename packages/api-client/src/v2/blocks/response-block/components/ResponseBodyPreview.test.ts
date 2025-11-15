import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ResponseBodyPreview from './ResponseBodyPreview.vue'

describe('ResponseBodyPreview', () => {
  describe('image mode', () => {
    it('renders image element for image mode', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
        },
      })

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('data:image/png;base64,iVBORw0KGgo=')
    })

    it('applies alpha background when alpha prop is true', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
          alpha: true,
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('bg-preview')
      expect(container.classes()).toContain('p-2')
    })

    it('does not apply alpha background when alpha prop is false', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
          alpha: false,
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).not.toContain('bg-preview')
    })

    it('applies rounded class to image when alpha is true', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
          alpha: true,
        },
      })

      const img = wrapper.find('img')
      expect(img.classes()).toContain('rounded')
    })

    it('does not apply rounded class to image when alpha is false', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
          alpha: false,
        },
      })

      const img = wrapper.find('img')
      expect(img.classes()).not.toContain('rounded')
    })

    it('handles image load error', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-image-url',
          type: 'image/png',
          mode: 'image',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')
      await nextTick()

      // Should show error message instead of image
      expect(wrapper.text()).toContain('Preview unavailable')
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  describe('video mode', () => {
    it('renders video element for video mode', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:video/mp4;base64,AAAAAA==',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      expect(video.exists()).toBe(true)
    })

    it('includes video source with correct attributes', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:video/mp4;base64,AAAAAA==',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const source = wrapper.find('source')
      expect(source.exists()).toBe(true)
      expect(source.attributes('src')).toBe('data:video/mp4;base64,AAAAAA==')
      expect(source.attributes('type')).toBe('video/mp4')
    })

    it('has controls attribute on video', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:video/mp4;base64,AAAAAA==',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      expect(video.attributes('controls')).toBeDefined()
    })

    it('has autoplay attribute on video', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:video/mp4;base64,AAAAAA==',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      expect(video.attributes('autoplay')).toBeDefined()
    })

    it('has full width on video', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:video/mp4;base64,AAAAAA==',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      expect(video.attributes('width')).toBe('100%')
    })

    it('handles video load error', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-video-url',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      await video.trigger('error')
      await nextTick()

      // Should show error message instead of video
      expect(wrapper.text()).toContain('Preview unavailable')
      expect(wrapper.find('video').exists()).toBe(false)
    })

    it('supports different video types', () => {
      const videoTypes = [
        { type: 'video/mp4', src: 'video.mp4' },
        { type: 'video/webm', src: 'video.webm' },
        { type: 'video/ogg', src: 'video.ogg' },
      ]

      videoTypes.forEach(({ type }) => {
        const wrapper = mount(ResponseBodyPreview, {
          props: {
            src: `data:${type};base64,AAAAAA==`,
            type,
            mode: 'video',
          },
        })

        const source = wrapper.find('source')
        expect(source.attributes('type')).toBe(type)
      })
    })
  })

  describe('audio mode', () => {
    it('renders audio element for audio mode', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:audio/mpeg;base64,AAAAAA==',
          type: 'audio/mpeg',
          mode: 'audio',
        },
      })

      const audio = wrapper.find('audio')
      expect(audio.exists()).toBe(true)
    })

    it('includes audio source with correct attributes', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:audio/mpeg;base64,AAAAAA==',
          type: 'audio/mpeg',
          mode: 'audio',
        },
      })

      const source = wrapper.find('source')
      expect(source.exists()).toBe(true)
      expect(source.attributes('src')).toBe('data:audio/mpeg;base64,AAAAAA==')
      expect(source.attributes('type')).toBe('audio/mpeg')
    })

    it('has controls attribute on audio', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:audio/mpeg;base64,AAAAAA==',
          type: 'audio/mpeg',
          mode: 'audio',
        },
      })

      const audio = wrapper.find('audio')
      expect(audio.attributes('controls')).toBeDefined()
    })

    it('handles audio load error', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-audio-url',
          type: 'audio/mpeg',
          mode: 'audio',
        },
      })

      const audio = wrapper.find('audio')
      await audio.trigger('error')
      await nextTick()

      // Should show error message instead of audio
      expect(wrapper.text()).toContain('Preview unavailable')
      expect(wrapper.find('audio').exists()).toBe(false)
    })

    it('supports different audio types', () => {
      const audioTypes = [
        { type: 'audio/mpeg', src: 'audio.mp3' },
        { type: 'audio/ogg', src: 'audio.ogg' },
        { type: 'audio/wav', src: 'audio.wav' },
      ]

      audioTypes.forEach(({ type }) => {
        const wrapper = mount(ResponseBodyPreview, {
          props: {
            src: `data:${type};base64,AAAAAA==`,
            type,
            mode: 'audio',
          },
        })

        const source = wrapper.find('source')
        expect(source.attributes('type')).toBe(type)
      })
    })
  })

  describe('object mode', () => {
    it('renders object element for object mode', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:application/pdf;base64,JVBERi0=',
          type: 'application/pdf',
          mode: 'object',
        },
      })

      const object = wrapper.find('object')
      expect(object.exists()).toBe(true)
    })

    it('sets correct data and type attributes on object', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:application/pdf;base64,JVBERi0=',
          type: 'application/pdf',
          mode: 'object',
        },
      })

      const object = wrapper.find('object')
      expect(object.attributes('data')).toBe('data:application/pdf;base64,JVBERi0=')
      expect(object.attributes('type')).toBe('application/pdf')
    })

    it('handles object load error', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-pdf-url',
          type: 'application/pdf',
          mode: 'object',
        },
      })

      const object = wrapper.find('object')
      await object.trigger('error')
      await nextTick()

      // Should show error message instead of object
      expect(wrapper.text()).toContain('Preview unavailable')
      expect(wrapper.find('object').exists()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('shows error message when src is empty', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: '',
          type: 'image/png',
          mode: 'image',
        },
      })

      expect(wrapper.text()).toContain('Preview unavailable')
      expect(wrapper.find('img').exists()).toBe(false)
    })

    it('resets error state when src changes', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-image-url',
          type: 'image/png',
          mode: 'image',
        },
      })

      // Trigger error
      const img = wrapper.find('img')
      await img.trigger('error')
      await nextTick()

      expect(wrapper.text()).toContain('Preview unavailable')

      // Change src to valid URL
      await wrapper.setProps({
        src: 'data:image/png;base64,iVBORw0KGgo=',
      })
      await nextTick()

      // Should show image again
      expect(wrapper.find('img').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Preview unavailable')
    })

    it('shows error message after failed load', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'broken-url',
          type: 'image/png',
          mode: 'image',
        },
      })

      const img = wrapper.find('img')
      await img.trigger('error')
      await nextTick()

      const errorMessage = wrapper.findComponent({ name: 'ResponseBodyInfo' })
      expect(errorMessage.exists()).toBe(true)
      expect(wrapper.text()).toContain('Preview unavailable')
    })
  })

  describe('src watching', () => {
    it('updates preview when src changes', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,aaa=',
          type: 'image/png',
          mode: 'image',
        },
      })

      const initialImg = wrapper.find('img')
      expect(initialImg.attributes('src')).toBe('data:image/png;base64,aaa=')

      await wrapper.setProps({
        src: 'data:image/png;base64,bbb=',
      })

      const updatedImg = wrapper.find('img')
      expect(updatedImg.attributes('src')).toBe('data:image/png;base64,bbb=')
    })

    it('resets error when src changes', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'invalid-url',
          type: 'image/png',
          mode: 'image',
        },
      })

      // Trigger error
      await wrapper.find('img').trigger('error')
      await nextTick()
      expect(wrapper.text()).toContain('Preview unavailable')

      // Change src
      await wrapper.setProps({ src: 'new-url' })
      await nextTick()

      // Error should be reset, image should be visible
      expect(wrapper.find('img').exists()).toBe(true)
    })
  })

  describe('mode switching', () => {
    it('switches between different preview modes', async () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
        },
      })

      expect(wrapper.find('img').exists()).toBe(true)

      await wrapper.setProps({
        mode: 'video',
        type: 'video/mp4',
      })

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('video').exists()).toBe(true)

      await wrapper.setProps({
        mode: 'audio',
        type: 'audio/mpeg',
      })

      expect(wrapper.find('video').exists()).toBe(false)
      expect(wrapper.find('audio').exists()).toBe(true)

      await wrapper.setProps({
        mode: 'object',
        type: 'application/pdf',
      })

      expect(wrapper.find('audio').exists()).toBe(false)
      expect(wrapper.find('object').exists()).toBe(true)
    })
  })

  describe('container styling', () => {
    it('applies correct container classes', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('flex')
      expect(container.classes()).toContain('justify-center')
      expect(container.classes()).toContain('overflow-auto')
      expect(container.classes()).toContain('rounded-b')
    })

    it('applies alpha background classes when alpha is true', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
          mode: 'image',
          alpha: true,
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('bg-preview')
      expect(container.classes()).toContain('p-2')
    })
  })

  describe('real-world scenarios', () => {
    it('displays PNG image with transparency', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          type: 'image/png',
          mode: 'image',
          alpha: true,
        },
      })

      expect(wrapper.find('img').exists()).toBe(true)
      expect(wrapper.find('.bg-preview').exists()).toBe(true)
    })

    it('displays PDF document', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'https://example.com/document.pdf',
          type: 'application/pdf',
          mode: 'object',
        },
      })

      const object = wrapper.find('object')
      expect(object.exists()).toBe(true)
      expect(object.attributes('type')).toBe('application/pdf')
    })

    it('displays MP4 video', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'https://example.com/video.mp4',
          type: 'video/mp4',
          mode: 'video',
        },
      })

      const video = wrapper.find('video')
      expect(video.exists()).toBe(true)
      expect(video.attributes('controls')).toBeDefined()
      expect(video.attributes('autoplay')).toBeDefined()
    })

    it('displays MP3 audio', () => {
      const wrapper = mount(ResponseBodyPreview, {
        props: {
          src: 'https://example.com/audio.mp3',
          type: 'audio/mpeg',
          mode: 'audio',
        },
      })

      const audio = wrapper.find('audio')
      expect(audio.exists()).toBe(true)
      expect(audio.attributes('controls')).toBeDefined()
    })
  })
})
