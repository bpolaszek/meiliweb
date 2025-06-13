<template>
  <ConfirmationDialog v-if="confirmationDialog" v-bind="confirmationDialog" />
  <div class="mx-auto flex h-full max-w-5xl flex-col items-center justify-between pb-32 pt-10">
    <header>
      <a href="/" class="flex items-center justify-center gap-2">
        <img class="-ml-10 size-16 shrink-0 grow-0" src="/assets/images/logo.svg" alt="Meiliweb" />
        <span class="text-3xl font-semibold">Meiliweb</span>
      </a>
    </header>

    <main>
      <h1 class="text-center text-5xl">😵 {{ t('title') }}</h1>
      <div class="mt-6 flex max-w-xl items-center gap-4">
        <p v-if="error.statusCode" class="text-5xl font-semibold text-primary-600">
          {{ error.statusCode }}
        </p>
        <p class="leading-2 text-justify text-base text-gray-600" v-html="errorMessage" />
      </div>
    </main>

    <Button theme="primary" icon="akar-icons:arrow-back" @click="handleError()" class="font-semibold">
      {{ t('actions.home') }}
    </Button>

    <LogoutButton v-if="credentials" />
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { safeToRefs } from '~/utils'
import { useConfirmationDialog, useCredentials } from '~/stores'
import LogoutButton from '~/components/layout/LogoutButton.vue'
import ConfirmationDialog from '~/components/layout/ConfirmationDialog.vue'
import Button from '~/components/layout/forms/Button.vue'
import { useI18n } from 'vue-i18n'

type Props = {
  error: NuxtError
}
const props = defineProps<Props>()

const handleError = () => clearError({ redirect: '/' })
const { credentials } = safeToRefs(useCredentials())
const { confirmationDialog } = safeToRefs(useConfirmationDialog())
const { t } = useI18n()
useHead({
  title: t('title'),
  htmlAttrs: {
    class: 'h-dvh',
  },
  bodyAttrs: {
    class: 'h-full',
  },
})

const errorMessage = computed(() => props.error.message.replace(/`([^`]+)`/g, '<em>$1</em>'))
onMounted(() => console.error(props.error))
</script>

<i18n>
en:
  title: An error occured.
  actions:
    home: Go back home
</i18n>
