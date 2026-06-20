<template>
  <SlideOver v-model:open="open" :title="webhook ? t('title.edit') : t('title.create')">
    <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
      <p class="inline-flex w-full items-center justify-end">
        <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/webhooks" />
      </p>

      <Alert v-if="error" dismissable theme="danger" @close="error = null">
        {{ error }}
      </Alert>

      <UniqueId as="section" v-slot="{ id }" class="space-y-1">
        <Label :for="id">{{ t('labels.url') }}</Label>
        <input
          :id
          v-model="form.url"
          type="url"
          required
          autofocus
          :placeholder="t('placeholders.url')"
          class="form-input w-full" />
      </UniqueId>

      <section class="space-y-2">
        <Label>{{ t('labels.headers') }}</Label>
        <p class="text-sm font-light text-gray-600">{{ t('hints.headers') }}</p>
        <div v-for="(header, i) of form.headers" :key="header.id" class="flex items-start gap-2">
          <input
            v-model="header.key"
            :placeholder="t('placeholders.headerKey')"
            class="form-input w-1/3"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false" />
          <div class="flex-1">
            <input
              v-model="header.value"
              :placeholder="t('placeholders.headerValue')"
              class="form-input w-full"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              @input="header.redacted = false" />
            <p v-if="header.redacted" class="mt-1 text-xs font-light italic text-gray-500">
              {{ t('hints.redacted') }}
            </p>
          </div>
          <button
            type="button"
            v-tippy="t('actions.removeHeader')"
            class="mt-2 shrink-0 text-gray-400 hover:text-red-600"
            @click="form.headers.splice(i, 1)">
            <Icon name="heroicons:trash" />
          </button>
        </div>
        <Button type="button" size="small" icon="heroicons:plus" @click="addHeader()">
          {{ t('actions.addHeader') }}
        </Button>
      </section>

      <footer class="flex flex-col items-center justify-end sm:flex-row">
        <Buttons>
          <Button type="reset" :disabled="loading" />
          <Button type="submit" :disabled="loading" :loading />
        </Buttons>
      </footer>
    </form>
  </SlideOver>
</template>

<script setup lang="ts">
import { ulid } from 'ulid'
import SlideOver from '~/components/layout/SlideOver.vue'
import UniqueId from '~/components/UniqueId.vue'
import Label from '~/components/layout/forms/Label.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import { isRedactedHeaderValue, useFormSubmit, useWebhooks, type Webhook } from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useToasts } from '~/stores'

type Props = {
  /** Existing webhook to edit, or `null`/`undefined` to create a new one. */
  webhook?: Webhook | null
}
const props = defineProps<Props>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { create, update } = useWebhooks()
const { createToast } = useToasts()
const { loading, error, handle } = useFormSubmit()

/**
 * Each header row keeps a stable `id` (for the `v-for` key), its key/value, and
 * a `redacted` flag. A redacted value is one Meilisearch masked in its response
 * (e.g. `Authorization`); if the user doesn't touch it we must NOT send it back
 * on update, otherwise the masked string would overwrite the real secret.
 */
type HeaderRow = { id: string; key: string; value: string; redacted: boolean }

const factory = () => {
  const headers = Object.entries(props.webhook?.headers ?? {}).map(([key, value]) => ({
    id: ulid(),
    key,
    value,
    redacted: isRedactedHeaderValue(value),
  }))
  return {
    url: props.webhook?.url ?? '',
    headers: headers as HeaderRow[],
  }
}

const form = reactive(factory())
const reset = () => Object.assign(form, factory())
// Re-seed the form whenever the editor is (re)opened for a different webhook.
watch(open, (isOpen) => isOpen && reset())

const addHeader = () => form.headers.push({ id: ulid(), key: '', value: '', redacted: false })

const submit = () =>
  handle(async () => {
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.saving') })
    try {
      if (props.webhook) {
        await update(props.webhook.uuid, { url: form.url, headers: diffHeaders() })
      } else {
        await create({ url: form.url, headers: collectHeaders() })
      }
      toast.update({ ...TOAST_SUCCESS(t) })
      open.value = false
      emit('saved')
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    }
  })

/** Headers to send on create: every non-empty row, verbatim. */
const collectHeaders = () => {
  const result: Record<string, string> = {}
  for (const { key, value } of form.headers) {
    if (key.trim()) {
      result[key.trim()] = value
    }
  }
  return result
}

/**
 * Headers to send on update. PATCH merges server-side, so we only send what
 * changed: new/edited rows as values, removed rows as `null`. Untouched
 * redacted secrets are omitted so the merge keeps their real value.
 */
const diffHeaders = () => {
  const previous = props.webhook?.headers ?? {}
  const result: Record<string, string | null> = {}

  const currentKeys = new Set<string>()
  for (const { key, value, redacted } of form.headers) {
    const trimmed = key.trim()
    if (!trimmed) continue
    currentKeys.add(trimmed)
    if (redacted) continue // unchanged secret: let the server keep it
    result[trimmed] = value
  }
  // Headers present before but gone now must be explicitly removed.
  for (const key of Object.keys(previous)) {
    if (!currentKeys.has(key)) {
      result[key] = null
    }
  }
  return result
}
</script>

<i18n>
en:
  title:
    create: Create webhook
    edit: Edit webhook
  labels:
    url: URL
    headers: Headers
  placeholders:
    url: https://example.com/webhook
    headerKey: Header name
    headerValue: Value
  hints:
    headers: Optional HTTP headers sent with every webhook request.
    redacted: This secret is hidden. Leave it as is to keep it, or type a new value to replace it.
  actions:
    addHeader: Add header
    removeHeader: Remove header
  toasts:
    saving: Saving webhook...
</i18n>
