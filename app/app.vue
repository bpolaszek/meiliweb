<template>
  <!--  <Login v-if="!credentials" />-->
  <div class="h-dvh">
    <NuxtPage :page-key="route.fullPath" />
  </div>
  <Toaster />
  <ConfirmationDialog v-if="confirmationDialog" v-bind="confirmationDialog" />
</template>

<script setup lang="ts">
import Toaster from '~/components/layout/toasts/Toaster.vue'
import ConfirmationDialog from '~/components/layout/ConfirmationDialog.vue'
import { safeToRefs } from '~/utils'
import { useConfirmationDialog } from '~/stores'

const route = useRoute()
const { confirmationDialog } = safeToRefs(useConfirmationDialog())

useHead({
  htmlAttrs: {
    class: 'h-dvh',
  },
  bodyAttrs: {
    class: 'h-full',
  },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | Meiliweb` : 'Meiliweb'
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
