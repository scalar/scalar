import { ScalarIconArrowSquareOut, ScalarIconBracketsCurly, ScalarIconCookie, ScalarIconGear } from '@scalar/icons'
import { markRaw } from 'vue'

export const ROUTES = [
  {
    displayName: 'Request',
    to: {
      name: 'request.root',
    },
    icon: markRaw(ScalarIconArrowSquareOut),
  },
  {
    displayName: 'Cookies',
    to: {
      name: 'cookies.default',
    },
    icon: markRaw(ScalarIconCookie),
  },
  {
    displayName: 'Environment',
    to: {
      name: 'environment.default',
    },
    icon: markRaw(ScalarIconBracketsCurly),
  },
  {
    displayName: 'Settings',
    to: {
      name: 'settings.default',
    },
    icon: markRaw(ScalarIconGear),
  },
  // {
  //   displayName: 'Servers',
  //   to: {
  //     name: 'servers.default',
  //   },
  //   icon: 'Server',
  // },
] as const
