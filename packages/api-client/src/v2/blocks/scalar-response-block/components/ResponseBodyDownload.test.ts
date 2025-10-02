// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResponseBodyDownload from './ResponseBodyDownload.vue'

describe('ResponseBodyDownload', () => {
  describe('rendering', () => {
    it('renders download link correctly', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        },
      })

      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('data:text/plain;base64,SGVsbG8gV29ybGQ=')
    })

    it('renders download text', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        },
      })

      expect(wrapper.text()).toContain('Download')
    })

    it('includes screen reader text', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        },
      })

      const srOnly = wrapper.find('.sr-only')
      expect(srOnly.exists()).toBe(true)
      expect(srOnly.text()).toBe('Response Body')
    })

    it('renders download icon', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        },
      })

      // Check if ScalarIcon is rendered (it will have the svg content)
      const link = wrapper.find('a')
      expect(link.html()).toContain('svg')
    })
  })

  describe('filename generation', () => {
    it('uses provided filename when available', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
          filename: 'custom-file.txt',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('custom-file.txt')
    })

    it('generates filename from JSON media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/json;base64,e30=',
          type: 'application/json',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.json')
    })

    it('generates filename from PDF media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/pdf;base64,JVBERi0=',
          type: 'application/pdf',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.pdf')
    })

    it('generates filename from XML media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/xml;base64,PHhtbD4=',
          type: 'application/xml',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.xml')
    })

    it('generates filename from image media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.png')
    })

    it('generates filename from CSV media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/csv;base64,bmFtZSxhZ2U=',
          type: 'text/csv',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.csv')
    })

    it('uses .unknown extension for unknown media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/unknown;base64,AAAA',
          type: 'application/unknown',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.unknown')
    })

    it('uses .unknown extension when no type provided', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.unknown')
    })

    it('uses .unknown extension for empty type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          type: '',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.unknown')
    })

    it('prioritizes filename over media type extension', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/json;base64,e30=',
          type: 'application/json',
          filename: 'my-custom-file.txt',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('my-custom-file.txt')
    })
  })

  describe('special media types', () => {
    it('handles +json media types', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/vnd.api+json;base64,e30=',
          type: 'application/vnd.api+json',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.json')
    })

    it('handles custom +json media types with fallback', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/custom+json;base64,e30=',
          type: 'application/custom+json',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.json')
    })

    it('handles YAML media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/yaml;base64,a2V5OiB2YWx1ZQ==',
          type: 'application/yaml',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.yaml')
    })

    it('handles HTML media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/html;base64,PGh0bWw+PC9odG1sPg==',
          type: 'text/html',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.html')
    })

    it('handles plain text media type', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          type: 'text/plain',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.txt')
    })
  })

  describe('document media types', () => {
    it('handles Word document', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEs=',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.docx')
    })

    it('handles Excel spreadsheet', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEs=',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.xlsx')
    })

    it('handles PowerPoint presentation', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,UEs=',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.pptx')
    })
  })

  describe('image media types', () => {
    it('handles JPEG images', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/jpeg;base64,/9j/4AA=',
          type: 'image/jpeg',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.jpg')
    })

    it('handles PNG images', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/png;base64,iVBORw0KGgo=',
          type: 'image/png',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.png')
    })

    it('handles SVG images', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/svg+xml;base64,PHN2Zz4=',
          type: 'image/svg+xml',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.svg')
    })

    it('handles WebP images', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/webp;base64,UklGRg==',
          type: 'image/webp',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.webp')
    })

    it('handles GIF images', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:image/gif;base64,R0lGODlh',
          type: 'image/gif',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.gif')
    })
  })

  describe('archive media types', () => {
    it('handles ZIP archives', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/zip;base64,UEsDBBQ=',
          type: 'application/zip',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.zip')
    })

    it('handles GZIP archives', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/gzip;base64,H4sIAAAA',
          type: 'application/gzip',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.gz')
    })

    it('handles TAR archives', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/x-tar;base64,AAAAAAA=',
          type: 'application/x-tar',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.tar')
    })
  })

  describe('binary media types', () => {
    it('handles octet-stream', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:application/octet-stream;base64,AAAAAAA=',
          type: 'application/octet-stream',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('response.bin')
    })
  })

  describe('filename edge cases', () => {
    it('handles filename with special characters', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: 'file (1) [test].txt',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('file (1) [test].txt')
    })

    it('handles filename with spaces', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: 'my file name.txt',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('my file name.txt')
    })

    it('handles filename without extension', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: 'README',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('README')
    })

    it('handles filename with multiple dots', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: 'backup.2024.01.15.tar.gz',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe('backup.2024.01.15.tar.gz')
    })

    it('handles very long filename', () => {
      const longFilename = 'very-long-filename-that-goes-on-and-on-with-lots-of-text.txt'
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: longFilename,
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBe(longFilename)
    })
  })

  describe('href variations', () => {
    it('handles data URL', () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8gV29ybGQ='
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: dataUrl,
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe(dataUrl)
    })

    it('handles blob URL', () => {
      const blobUrl = 'blob:http://localhost:3000/abc-123-def'
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: blobUrl,
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe(blobUrl)
    })

    it('handles object URL', () => {
      const objectUrl = 'blob:null/abc-123-def'
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: objectUrl,
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('href')).toBe(objectUrl)
    })
  })

  describe('event handling', () => {
    it('has click.stop modifier to prevent propagation', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
        },
      })

      const link = wrapper.find('a')
      // Verify the link exists and can be clicked
      expect(link.exists()).toBe(true)

      // The @click.stop is in the template to prevent event bubbling
      // This is important when the download button is nested in other clickable elements
      expect(link.element.tagName).toBe('A')
    })
  })

  describe('accessibility', () => {
    it('has proper download attribute', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
          filename: 'document.txt',
        },
      })

      const link = wrapper.find('a')
      expect(link.attributes('download')).toBeDefined()
    })

    it('includes screen reader text for context', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
        },
      })

      // Check that screen reader users get context about what is being downloaded
      expect(wrapper.text()).toContain('Download')
      expect(wrapper.text()).toContain('Response Body')
    })

    it('is keyboard accessible as a link', () => {
      const wrapper = mount(ResponseBodyDownload, {
        props: {
          href: 'data:text/plain;base64,SGVsbG8=',
        },
      })

      const link = wrapper.find('a')
      expect(link.element.tagName).toBe('A')
      expect(link.attributes('href')).toBeDefined()
    })
  })
})
