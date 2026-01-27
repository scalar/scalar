import { ScalarIconArrowSquareOut, ScalarIconBracketsCurly, ScalarIconCookie, ScalarIconGear } from '@scalar/icons'

export const ROUTES = [
  {
    displayName: 'Request',
    to: {
      name: 'request.root',
    },
    icon: ScalarIconArrowSquareOut,
  },
  {
    displayName: 'Cookies',
    to: {
      name: 'cookies.default',
    },
    icon: ScalarIconCookie,
  },
  {
    displayName: 'Environment',
    to: {
      name: 'environment.default',
    },
    icon: ScalarIconBracketsCurly,
  },
  {
    displayName: 'Settings',
    to: {
      name: 'settings.default',
    },
    icon: ScalarIconGear,
  },
  // {
  //   displayName: 'Servers',
  //   to: {
  //     name: 'servers.default',
  //   },
  //   icon: 'Server',
  // },
] as const
