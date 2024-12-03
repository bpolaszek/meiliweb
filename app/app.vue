<template>
  <!--  <Login v-if="!credentials" />-->
  <div class="relative h-dvh">
    <NuxtPage :page-key="pageKey" />
    <DebugMemory
      v-if="IS_DEV_MODE && config.public.debugMemoryUsage"
      class="absolute bottom-0 flex w-full items-center justify-center gap-4 pb-6 text-xs text-gray-600" />
  </div>
  <Toaster />
  <ConfirmationDialog v-if="confirmationDialog" v-bind="confirmationDialog" />
  <PromisifiedDialogs />
</template>

<script setup lang="ts">
import Toaster from '~/components/layout/toasts/Toaster.vue'
import ConfirmationDialog from '~/components/layout/ConfirmationDialog.vue'
import PromisifiedDialogs from '~/components/layout/dialogs/PromisifiedDialogs.vue'
import { safeToRefs } from '~/utils'
import { useConfirmationDialog, useCredentials } from '~/stores'
import { toRefs } from 'vue'

const route = useRoute()
const { confirmationDialog } = safeToRefs(useConfirmationDialog())
const IS_DEV_MODE = import.meta.dev
const config = useRuntimeConfig()
const { credentials } = toRefs(useCredentials())
const self: any = reactive({
  credentials,
  pageKey: computed(() => {
    return [route.fullPath, self.credentials?.id].join(':')
  }),
})

const { pageKey } = toRefs(self)

useHead({
  htmlAttrs: {
    class: 'h-dvh',
  },
  bodyAttrs: {
    class: 'h-full',
  },
  titleTemplate: (titleChunk) => {
    let appName = 'Meiliweb'
    if (self.credentials) {
      appName += ` - ${self.credentials.name || self.credentials.baseUri}`
    }
    return titleChunk ? `${titleChunk} | ${appName}` : appName
  },
})
</script>

<style lang="scss">
@tailwind base;
@tailwind components;
@tailwind utilities;
@layer components {
  /* @tailwindcss/forms enhancement */
  .form-input,
  .form-checkbox {
    @apply rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-600;
  }
  .form-checkbox {
    @apply rounded-sm text-primary-600;
  }
  /* Ensure main container has full height */
  #__nuxt {
    @apply h-full;
  }
}
@layer components {
  @import '../node_modules/@vueform/slider/themes/tailwind';
}
body {
  font-family: 'DM Sans', sans-serif;
}
</style>
