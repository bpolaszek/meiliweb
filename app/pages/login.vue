<template>
  <div class="bg-bubbles flex h-dvh flex-col items-center justify-center">
    <div
      class="-mt-20 w-full max-w-lg space-y-6 rounded-lg border-gray-200 bg-white bg-opacity-90 px-6 py-4 md:w-1/2 md:border md:px-0 md:shadow-lg">
      <section class="flex items-center justify-center gap-2">
        <img
          class="-ml-10 size-16 shrink-0 grow-0"
          src="/assets/images/logo.svg"
          alt="Meiliweb" />
        <span class="text-3xl font-semibold">Meiliweb</span>
      </section>

      <form class="space-y-4 p-4" @submit.prevent="submit(credentials)">
        <h1 class="text-lg font-semibold">
          {{ t('boxTitle') }}
        </h1>

        <Alert v-if="error" dismissable theme="danger" @close="error = null">
          {{ error }}
        </Alert>

        <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
          <label :for="id">{{ t('labels.instanceUrl') }}</label>
          <input
            v-focus
            v-model="credentials.baseUri"
            required
            type="url"
            class="form-input"
            placeholder="http://localhost:7700" />
        </UniqueId>

        <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
          <label :for="id">{{ t('labels.accessToken') }}</label>
          <input
            v-model="credentials.accessKey"
            type="password"
            class="form-input" />
        </UniqueId>

        <Button
          type="submit"
          icon="solar:login-linear"
          :loading="loading"
          class="w-full">
          <span>{{ t('labels.submit') }}</span>
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Meilisearch } from 'meilisearch'
import { useCredentials } from '~/stores'
import { useFormSubmit } from '~/composables'
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'

const { save, factory, auth } = useCredentials()
const { loading, error, handle } = useFormSubmit()
const credentials = ref(factory())
const self = reactive({
  credentials,
  error,
})

const submit = async (credentials: CredentialsRecord) => {
  const meili = new Meilisearch({
    host: credentials.baseUri,
    apiKey: credentials.accessKey,
  })

  try {
    await handle(() => meili.getVersion(), true)
    //save(credentials)
    auth(credentials)
    navigateTo('/indexes')
  } catch (e) {
    self.error = (e as Error).message
    return
  }
  self.credentials = factory()
}
const { t } = useI18n()
useHead({
  title: t('title'),
})
</script>

<i18n>
en:
  title: Connect
  boxTitle: Connect to your Meilisearch Instance
  labels:
    instanceUrl: "Instance URL:"
    accessToken: "Access Token:"
    submit: "Connect"
</i18n>

<style>
.bg-bubbles {
  background-image: url('/assets/images/bubbles.svg');
}
</style>
