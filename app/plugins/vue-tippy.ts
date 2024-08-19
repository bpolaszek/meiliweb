import 'tippy.js/dist/tippy.css' // optional for styling
import VueTippy from 'vue-tippy'

export default defineNuxtPlugin({
  setup(app) {
    app.vueApp.use(VueTippy)
  },
})
