import { onMounted, onUnmounted, ref } from 'vue'

type NavigateProps = {
  method:
    | 'get'
    | 'post'
    | 'put'
    | 'patch'
    | 'delete'
    | 'head'
    | 'options'
    | 'trace'
}
const navState = ref({})
const isFirstLoad = ref(true)

/**
 * Hook which both handles navigation, as well as provides
 * a reactive state of the current properties from the URL
 *
 */
export const useNavigate = () => {
  if (isFirstLoad.value) {
    console.log('firs tload')
    isFirstLoad.value = false

    onMounted(() => {
      console.log('mounted')
      window.addEventListener('popstate', () => console.log('popstate'))
      window.addEventListener('hashchange', () => console.log('hashchange'))
      window.onpopstate = () => console.log('onpopstate')
      window.onhashchange = () => console.log('onhashchange')
    })
  }

  //
  const navigate = ({ method }: NavigateProps) => {
    const state = {
      method,
    }
    console.log('lets set the path', state)
  }

  return { navigate, navState }
}
