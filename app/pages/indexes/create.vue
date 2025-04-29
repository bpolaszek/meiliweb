<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <form class="space-y-4" @reset.prevent="reset(factory())" @submit.prevent="submit()">
      <Alert v-if="error" dismissable theme="danger" @close="error = null">
        {{ error }}
      </Alert>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.uid') }}</Label>
        <input
          v-model="index.uid"
          required
          autofocus
          type="text"
          class="form-input"
          placeholder="movies, cities, users, ..." />
      </UniqueId>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.primaryKey') }}</Label>
        <input v-model="index.primaryKey" required type="text" class="form-input" placeholder="id, objectID, ..." />
      </UniqueId>

      <footer class="flex flex-col items-center justify-end sm:flex-row">
        <Buttons>
          <Button type="reset" :disabled="!modified || loading" />
          <Button type="submit" :disabled="!modified" :loading />
        </Buttons>
      </footer>
    </form>
  </Layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFormSubmit, useMeiliClient } from '~/composables'
import { resettableRef } from '~/utils'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Label from '~/components/layout/forms/Label.vue'
import { TOAST_PLEASEWAIT, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import Alert from '~/components/layout/Alert.vue'
import { promiseTimeout } from '@vueuse/core'

const { t } = useI18n()
const client = useMeiliClient()
const { createToast } = useToasts()
const factory = () => ({
  uid: '',
  primaryKey: 'id',
})

const { value: index, reset, modified } = resettableRef(factory())

const { loading, error, handle } = useFormSubmit()
const self = reactive({ index, loading })
const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    title: t('toasts.success.title'),
    text: t('toasts.success.pendingText'),
    immediate: false,
  })
  let indexUid = self.index.uid
  await handle(async () => {
    toast.spawn()
    const task = await client.createIndex(indexUid, {
      primaryKey: self.index.primaryKey,
    })
    await client.waitForTask(task.taskUid)
    toast.update({
      ...TOAST_SUCCESS(t),
    })
    reset(factory())
    navigateTo(`/indexes/${indexUid}/documents`)
  })
}

useHead({
  title: t('title'),
})
</script>

<i18n>
en:
  title: Indexes
  subtitle: Create a new index
  labels:
    uid: Index name
    primaryKey: Primary key
  toasts:
    success:
      title: Creating index
      pendingText: Your index is being created...
      doneText: Done.
</i18n>
