// vite.config.ts
import { defineConfig } from 'file:///Users/fotiem.constant/Documents/gitrepo/open-source/scalar/node_modules/.pnpm/vitest@0.34.4/node_modules/vitest/dist/config.js'
import path from 'path'

var __vite_injected_original_dirname =
  '/Users/fotiem.constant/Documents/gitrepo/open-source/scalar/packages/swagger-parser'
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: '@scalar/swagger-parser',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      /**
       * Make sure to also externalize any dependencies that you do not want to bundle into your library
       */
      external: ['@apidevtools/swagger-parser', 'js-yaml'],
    },
  },
  resolve: {
    alias: [
      // Resolve the uncompiled source code for all @scalar packages
      // It’s working with the alias, too. It’s just required to enable HMR.
      {
        // Resolve the uncompiled source code for all @scalar packages
        // @scalar/* -> packages/*/
        // (not @scalar/*/style.css)
        find: /^@scalar\/([^/]+)$/,
        replacement: path.resolve(
          __vite_injected_original_dirname,
          '../$1/src/index.ts',
        ),
      },
    ],
  },
  test: {
    coverage: {
      enabled: true,
      reporter: 'text',
    },
  },
})
export { vite_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZm90aWVtLmNvbnN0YW50L0RvY3VtZW50cy9naXRyZXBvL29wZW4tc291cmNlL3NjYWxhci9wYWNrYWdlcy9zd2FnZ2VyLXBhcnNlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2ZvdGllbS5jb25zdGFudC9Eb2N1bWVudHMvZ2l0cmVwby9vcGVuLXNvdXJjZS9zY2FsYXIvcGFja2FnZXMvc3dhZ2dlci1wYXJzZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2ZvdGllbS5jb25zdGFudC9Eb2N1bWVudHMvZ2l0cmVwby9vcGVuLXNvdXJjZS9zY2FsYXIvcGFja2FnZXMvc3dhZ2dlci1wYXJzZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiAnc3JjL2luZGV4LnRzJyxcbiAgICAgIG5hbWU6ICdAc2NhbGFyL3N3YWdnZXItcGFyc2VyJyxcbiAgICAgIGZpbGVOYW1lOiAnaW5kZXgnLFxuICAgICAgZm9ybWF0czogWydlcyddLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLyoqXG4gICAgICAgKiBNYWtlIHN1cmUgdG8gYWxzbyBleHRlcm5hbGl6ZSBhbnkgZGVwZW5kZW5jaWVzIHRoYXQgeW91IGRvIG5vdCB3YW50IHRvIGJ1bmRsZSBpbnRvIHlvdXIgbGlicmFyeVxuICAgICAgICovXG4gICAgICBleHRlcm5hbDogWydAYXBpZGV2dG9vbHMvc3dhZ2dlci1wYXJzZXInLCAnanMteWFtbCddLFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAgLy8gUmVzb2x2ZSB0aGUgdW5jb21waWxlZCBzb3VyY2UgY29kZSBmb3IgYWxsIEBzY2FsYXIgcGFja2FnZXNcbiAgICAgIC8vIEl0XHUyMDE5cyB3b3JraW5nIHdpdGggdGhlIGFsaWFzLCB0b28uIEl0XHUyMDE5cyBqdXN0IHJlcXVpcmVkIHRvIGVuYWJsZSBITVIuXG4gICAgICB7XG4gICAgICAgIC8vIFJlc29sdmUgdGhlIHVuY29tcGlsZWQgc291cmNlIGNvZGUgZm9yIGFsbCBAc2NhbGFyIHBhY2thZ2VzXG4gICAgICAgIC8vIEBzY2FsYXIvKiAtPiBwYWNrYWdlcy8qL1xuICAgICAgICAvLyAobm90IEBzY2FsYXIvKi9zdHlsZS5jc3MpXG4gICAgICAgIGZpbmQ6IC9eQHNjYWxhclxcLyhbXi9dKykkLyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8kMS9zcmMvaW5kZXgudHMnKSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGNvdmVyYWdlOiB7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgcmVwb3J0ZXI6ICd0ZXh0JyxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsT0FBTyxVQUFVO0FBQzViLFNBQVMsb0JBQW9CO0FBRDdCLElBQU0sbUNBQW1DO0FBR3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLGVBQWU7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUliLFVBQVUsQ0FBQywrQkFBK0IsU0FBUztBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUE7QUFBQSxNQUdMO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJRSxNQUFNO0FBQUEsUUFDTixhQUFhLEtBQUssUUFBUSxrQ0FBVyxvQkFBb0I7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixVQUFVO0FBQUEsTUFDUixTQUFTO0FBQUEsTUFDVCxVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
