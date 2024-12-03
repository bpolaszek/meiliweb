<template>
  <div class="bg-bubbles flex h-dvh flex-col items-center justify-center">
    <div
      class="-mt-20 w-full max-w-lg space-y-6 rounded-lg border-gray-200 bg-white bg-opacity-90 px-6 py-4 md:w-1/2 md:border md:px-0 md:shadow-lg">
      <NuxtLink to="/indexes" class="flex items-center justify-center gap-2">
        <img
          class="-ml-10 size-16 shrink-0 grow-0"
          src="~/assets/images/logo.svg"
          alt="Meiliweb" />
        <span class="text-3xl font-semibold">Meiliweb</span>
      </NuxtLink>

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
            :placeholder="DEFAULT_BASE_URI"
            @keydown.tab="autofillBaseUri()" />
        </UniqueId>

        <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
          <label :for="id">{{ t('labels.accessToken') }}</label>
          <input
            v-model="credentials.accessKey"
            type="password"
            class="form-input" />
        </UniqueId>

        <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
          <label :for="id">{{ t('labels.instanceName') }}</label>
          <input
            v-model="credentials.name"
            type="text"
            class="form-input"
            :placeholder="suggestedName"
            @keydown.tab="autofillName()" />
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
import { toRefs } from 'vue'

const { auth, factory } = useCredentials()
const { loading, error, handle } = useFormSubmit()
const credentials = ref(factory())
const self: any = reactive({
  credentials,
  error,
  suggestedName: computed(() =>
    '' === self.credentials.baseUri ||
    self.credentials.baseUri?.indexOf('localhost') > -1
      ? t('placeholders.localInstance')
      : t('placeholders.productionInstance'),
  ),
})

const DEFAULT_BASE_URI = 'http://localhost:7700'
const autofillBaseUri = () => {
  if ('' === self.credentials.baseUri) {
    self.credentials.baseUri = DEFAULT_BASE_URI
  }
}

const autofillName = () => {
  if ('' === self.credentials.name) {
    self.credentials.name = self.suggestedName
  }
}

const submit = async (credentials: CredentialsRecord) => {
  const meili = new Meilisearch({
    host: credentials.baseUri,
    apiKey: credentials.accessKey,
  })

  try {
    await handle(() => meili.getVersion(), true)
    auth(credentials)
    navigateTo('/indexes')
  } catch (e) {
    self.error = (e as Error).message
    return
  }
  self.credentials = factory()
}
const { t } = useI18n()
const { suggestedName } = toRefs(self)

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
    instanceName: "Instance Name (optional):"
    submit: "Connect"
  placeholders:
    localInstance: "Local instance"
    productionInstance: "Production"
</i18n>

<style>
.bg-bubbles {
  background-image: url('/assets/images/bubbles.svg');
}
</style>
