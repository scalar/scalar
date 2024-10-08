import { defineComponent } from 'vue'

import './foo.css'

// named exports w/ variable declaration: ok
export const Foo = defineComponent({
  name: 'Foo',
  setup() {
    return () => <div class="jsx">from JSX</div>
  },
})
