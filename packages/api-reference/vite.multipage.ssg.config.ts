import vue from '@vitejs/plugin-vue'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  root: './playground/multipage',
  plugins: [vue()],
  ssgOptions: {
    script: 'async',
    formatting: 'prettify',
    entry: 'src/ssg.ts',
    includeAllRoutes: false,
    includedRoutes(paths) {
      // TODO: Make this dynamic
      paths.push('/POST/%2Ffoobar')
      paths.push('/GET/%2Ffoobar')

      return paths.filter((path) => !path.includes(':'))
    },
  },
}

export default config
