import ApiClientPage from './pages/ApiClientPage.vue'
import ApiReferencePage from './pages/ApiReferencePage.vue'
import ApiReferenceTestPage from './pages/ApiReferenceTestPage.vue'
import ClassicApiReferencePage from './pages/ClassicApiReferencePage.vue'
import EmbeddedApiReferencePage from './pages/EmbeddedApiReferencePage.vue'
import StandaloneApiReferencePage from './pages/StandaloneApiReferencePage.vue'
import StartPage from './pages/StartPage.vue'

export const routes = [
  { path: '/', name: 'home', component: StartPage },
  { path: '/api-client', name: 'api-client', component: ApiClientPage },
  {
    path: '/api-reference',
    name: 'api-reference',
    component: ApiReferencePage,
  },
  {
    path: '/standalone-api-reference',
    name: 'standalone-api-reference',
    component: StandaloneApiReferencePage,
  },
  {
    path: '/path-routing/:custom(.*)?',
    name: 'path-routing-api-reference',
    component: StandaloneApiReferencePage,
  },
  {
    path: '/classic-api-reference',
    name: 'classic-api-reference',
    component: ClassicApiReferencePage,
  },
  {
    path: '/embedded-api-reference',
    name: 'embedded-api-reference',
    component: EmbeddedApiReferencePage,
  },
  {
    path: '/test-api-reference/:layout/:theme',
    name: 'test-api-reference',
    component: ApiReferenceTestPage,
  },
]
