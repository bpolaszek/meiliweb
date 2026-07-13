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
const { locale } = useI18n()
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

<i18n global>
en:
  toasts:
    titles:
      error: An error occured.
      duplicateIndex: Copying {indexUid} to {newIndexUid}
      renameIndex: Renaming {indexUid} to {newIndexUid}
    texts:
      pleaseWait: Please wait...
      done: Done.
      canceledTask: Task was canceled.
      failedTask: Task failed.

  buttons:
    reset: Reset
    cancel: Cancel
    submit: Submit

</i18n>
