export const ROUTES = [
  {
    displayName: 'Request',
    to: {
      name: 'request.root',
    },
    icon: 'ExternalLink',
  },
  {
    displayName: 'Cookies',
    to: {
      name: 'cookies.default',
    },
    icon: 'Cookie',
  },
  {
    displayName: 'Environment',
    to: {
      name: 'environment.default',
    },
    icon: 'Brackets',
  },
  {
    displayName: 'Settings',
    to: {
      name: 'settings.default',
    },
    icon: 'Settings',
  },
  // {
  //   displayName: 'Servers',
  //   to: {
  //     name: 'servers.default',
  //   },
  //   icon: 'Server',
  // },
] as const
