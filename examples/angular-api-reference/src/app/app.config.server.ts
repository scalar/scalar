import { type ApplicationConfig, mergeApplicationConfig } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'

import { appConfig } from './app.config'

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
}

export const config = mergeApplicationConfig(appConfig, serverConfig)
