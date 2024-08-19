import type { DirectiveBinding } from 'vue'

export default defineNuxtPlugin({
  setup(app) {
    app.vueApp.directive('focus', {
      mounted: (
        el: HTMLElement,
        { value = true }: Pick<DirectiveBinding, 'value'>,
      ) => nextTick(() => value && el.focus()),
    })
  },
})
