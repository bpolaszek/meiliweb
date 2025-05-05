// @ts-nocheck
import VueSortable from 'vue3-sortablejs'

export default defineNuxtPlugin({
  setup(app) {
    app.vueApp.use(VueSortable)
  },
})
