<template>
  <!--  <Login v-if="!credentials" />-->
  <div class="h-dvh">
    <NuxtPage />
  </div>
  <Toaster />
  <ConfirmationDialog v-if="confirmationDialog" v-bind="confirmationDialog" />
</template>

<script setup lang="ts">
import Toaster from '~/components/layout/toasts/Toaster.vue'
import ConfirmationDialog from '~/components/layout/ConfirmationDialog.vue'
import { safeToRefs } from '~/utils'
import { useConfirmationDialog, useCredentials } from '~/stores'

const { credentials } = safeToRefs(useCredentials())
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
  @import '@vueform/slider/themes/tailwind.scss';
}
body {
  font-family: 'DM Sans', sans-serif;
}
</style>
