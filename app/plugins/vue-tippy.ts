import 'tippy.js/dist/tippy.css'
import VueTippy from 'vue-tippy'

export default defineNuxtPlugin({
  setup(app) {
    app.vueApp.use(VueTippy)
  },
})
