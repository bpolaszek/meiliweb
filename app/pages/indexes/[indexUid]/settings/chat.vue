<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm text-gray-600 italic">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings/update-chat" />
    </h3>

    <ChatUnavailableAlert v-if="!available" />

    <template v-else>
      <Alert v-if="error" dismissable theme="danger" @close="error = null">
        {{ error }}
      </Alert>

      <UFormField :label="t('labels.description')" :help="t('hints.description')">
        <UTextarea v-model="self.settings.description" class="w-full" :rows="3" />
      </UFormField>

      <UFormField :label="t('labels.documentTemplate')" :help="t('hints.documentTemplate')">
        <UTextarea v-model="self.settings.documentTemplate" class="w-full font-mono text-xs" :rows="6" />
      </UFormField>

      <UFormField :label="t('labels.documentTemplateMaxBytes')" :help="t('hints.documentTemplateMaxBytes')">
        <UInput v-model="self.settings.documentTemplateMaxBytes" type="number" :min="1" class="w-40" />
      </UFormField>

      <UFormField :label="t('labels.searchParameters')" :help="t('hints.searchParameters')">
        <UTextarea v-model="self.settings.searchParameters" class="w-full font-mono text-xs" :rows="8" />
      </UFormField>

      <footer class="flex justify-end">
        <Buttons>
          <Button type="reset" :disabled="!modified || loading" />
          <Button type="submit" :disabled="!modified || loading" :loading="loading" />
        </Buttons>
      </footer>
    </template>
  </form>
</template>

<script setup lang="ts">
import { until } from '@vueuse/core'
import type { ChatSettings } from 'meilisearch'
import ChatUnavailableAlert from '~/components/chat/ChatUnavailableAlert.vue'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useChatAvailability, useToasts } from '~/stores'
import { resettableRef, safeToRefs } from '~/utils'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const { loading, error, handle } = useFormSubmit()
const processTask = useTask()
const { createToast } = useToasts()
const { available, loading: checkingAvailability } = safeToRefs(useChatAvailability())

useHead({ title: `${t('title')} - ${index.uid}` })

/** `searchParameters` is free-form search options, edited as raw JSON rather than as a form. */
const asForm = ({ description, documentTemplate, documentTemplateMaxBytes, searchParameters }: ChatSettings) => ({
  description: description ?? '',
  documentTemplate: documentTemplate ?? '',
  documentTemplateMaxBytes: documentTemplateMaxBytes ?? 400,
  searchParameters: JSON.stringify(searchParameters ?? {}, null, 2),
})

// The route only exists once the feature is on; both gates resolve asynchronously.
await until(checkingAvailability).toBe(false)
const {
  value: settings,
  reset,
  modified,
} = resettableRef(asForm(available.value ? await index.getChat() : ({} as ChatSettings)))
const self = reactive({ settings })

const payload = () => {
  const { description, documentTemplate, documentTemplateMaxBytes, searchParameters } = self.settings
  try {
    return {
      description,
      documentTemplate,
      documentTemplateMaxBytes: Number(documentTemplateMaxBytes),
      searchParameters: JSON.parse(searchParameters || '{}'),
    }
  } catch {
    throw new Error(t('errors.invalidSearchParameters'))
  }
}

const submit = async () =>
  handle(async () => {
    // Inside `handle` so an unparseable JSON surfaces in the form's error alert.
    const body = payload()
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.saving') })
    await processTask(() => index.updateChat(body), {
      onSuccess: () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(toRaw(self.settings))
      },
      onCanceled: () => toast.update({ ...TOAST_FAILURE(t), text: t('toasts.texts.canceledTask') }),
      onFailure: () => toast.update({ ...TOAST_FAILURE(t), text: t('toasts.texts.failedTask') }),
    })
  })
</script>

<i18n>
en:
  title: Chat
  description: Extra context handed to the LLM so it knows when to search this index and what it gets back.
  labels:
    description: Index description
    documentTemplate: Document template
    documentTemplateMaxBytes: Document template max bytes
    searchParameters: Search parameters
  hints:
    description: Tells the LLM what this index holds, so it can decide whether searching it is relevant.
    documentTemplate: Liquid template rendering each matched document into the text the LLM reads.
    documentTemplateMaxBytes: Rendered documents longer than this are truncated. Defaults to 400.
    searchParameters: JSON search options applied to every search the LLM runs on this index, e.g. limit, sort or hybrid.
  errors:
    invalidSearchParameters: Search parameters must be a valid JSON object.
  toasts:
    saving: Updating chat settings...
</i18n>
