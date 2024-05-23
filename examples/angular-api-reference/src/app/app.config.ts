import type { ApplicationConfig } from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'

export const appConfig: ApplicationConfig = {
  providers: [provideClientHydration()],
}
