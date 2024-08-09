type ConfigSidebarPage = {
  path: string
  name?: string
  description?: string
  backgroundImage?: string
  icon?: string
  type: 'page'
  children?: ConfigSidebarItem[]
}

type ConfigSidebarFolder = {
  name: string
  type: 'folder'
  children: ConfigSidebarItem[]
  icon?: string
}

type ConfigSidebarLink = {
  name: string
  type: 'link'
  url: string
  icon?: string
}

export type ConfigSidebarItem =
  | ConfigSidebarPage
  | ConfigSidebarFolder
  | ConfigSidebarLink

export type ConfigGuide =
  | {
      name: string
      description?: string
      folder: string
    }
  | {
      name: string
      description?: string
      sidebar: ConfigSidebarItem[]
    }

export type ConfigReference = {
  name: string
  path: string
  description?: string
}

/** Top Level Scalar Config Object */
export type ScalarConfig = {
  publishOnMerge?: boolean
  subdomain: string
  customDomain?: string
  siteMeta?: {
    favicon?: string
    ogImage?: string
    title?: string
    description?: string
  }
  siteConfig?: {
    footer?: string
    footerCss?: string
    footerBelowSidebar?: boolean
    headScript?: string
    bodyScript?: string
    theme?: string
    logo?:
      | string
      | {
          darkMode?: string
          lightMode?: string
        }
  }
  guides: ConfigGuide[]
  references: ConfigReference[]
}
