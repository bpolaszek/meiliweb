<template>
  <USlideover
    v-model:open="open"
    :title="`${primaryKey}: ${documentId}`"
    :description="indexUid"
    side="right"
    :overlay="false"
    :dismissible="!loading"
    :ui="{ content: 'max-w-5xl', title: 'text-2xl font-semibold' }">
    <template #body>
      <form class="flex h-full flex-col gap-4" @reset.prevent="reset()" @submit.prevent="save()">
        <Alert v-if="error" dismissable theme="danger" @close="error = null">
          {{ error }}
        </Alert>

        <p v-if="fetching" class="text-sm font-light text-gray-500 italic">{{ t('loading') }}</p>

        <JsonEditorVue
          v-else
          v-model="json"
          mode="text"
          :read-only="loading"
          :onRenderMenu="hideTableMode"
          class="json-editor min-h-0 flex-1" />

        <footer class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Button
            type="button"
            icon="heroicons:trash"
            :disabled="fetching || loading"
            :loading="'delete' === pendingAction"
            class="hover:text-red-600"
            @click="remove()">
            {{ t('actions.delete') }}
          </Button>
          <Buttons>
            <Button type="reset" :disabled="fetching || loading" />
            <Button type="submit" :disabled="fetching || loading" :loading="'save' === pendingAction" />
          </Buttons>
        </footer>
      </form>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import { useFormSubmit, useMeiliClient, useTask, type DocumentId } from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useConfirmationDialog, useToasts } from '~/stores'

type Props = {
  indexUid: string
  primaryKey: string
  documentId: DocumentId
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: []; deleted: [] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const meili = useMeiliClient()
const processTask = useTask()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()
const { loading, error, handle } = useFormSubmit()

/** Which of the two actions is running, so only its own button spins. */
const pendingAction = ref<'save' | 'delete' | null>(null)
const fetching = ref(true)
/** Last known persisted state, used to reset the editor. Not named `document`: that shadows the global. */
const savedDocument = ref<any>(null)
const json = ref('')

/** Subset of vanilla-jsoneditor's `MenuItem` we need; it isn't a direct dependency of ours. */
type MenuItem = { type: string; text?: string; className?: string }

/**
 * A Meilisearch document is always a JSON object, and table mode only opens arrays — the button
 * could never do anything but show "an object cannot be opened in table mode". Drop it, and hand
 * its `jse-last` class to `tree`, which the menu's CSS uses to close the button group's border.
 * Matching on the label is what the library gives us; if it ever renames them, the button simply
 * comes back.
 */
const hideTableMode = (items: MenuItem[]) =>
  items
    .filter(({ text }) => 'table' !== text)
    .map((item) => ('tree' === item.text ? { ...item, className: `${item.className ?? ''} jse-last` } : item))

/**
 * `mode="text"` hands back the raw text (`stringified` defaults to `true`), but the built-in mode
 * switcher lets the user move to tree/table mode, where the binding value becomes parsed JSON.
 * Normalizing here keeps both cases working — and surfaces malformed JSON as a plain parse error.
 */
const parseJson = (value: unknown) => ('string' === typeof value ? JSON.parse(value) : value)

const reset = () => {
  error.value = null
  json.value = JSON.stringify(savedDocument.value, null, 2)
}

const load = async () =>
  handle(async () => {
    fetching.value = true
    try {
      savedDocument.value = await meili.index(props.indexUid).getDocument(props.documentId)
      reset()
    } finally {
      fetching.value = false
    }
  })

// The slideover is kept mounted between openings: (re)load whenever it opens on a document.
watch([open, () => props.documentId], ([isOpen]) => isOpen && load(), { immediate: true })

const save = () =>
  handle(async () => {
    const payload = parseJson(json.value)
    // `addDocuments` replaces the document matching the primary key. A changed id would silently
    // create a second document instead of editing this one, so refuse it rather than surprise.
    if (`${payload?.[props.primaryKey]}` !== `${props.documentId}`) {
      throw new Error(t('errors.primaryKeyChanged', { primaryKey: props.primaryKey }))
    }
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.saving') })
    pendingAction.value = 'save'
    try {
      const task = await processTask(() => meili.index(props.indexUid).addDocuments([payload]))
      if ('succeeded' !== task.status) {
        // `error` only exists on a resolved Task, not on the enqueued one returned on timeout.
        throw new Error(('error' in task && task.error?.message) || t('toasts.failed'))
      }
      toast.update({ ...TOAST_SUCCESS(t) })
      savedDocument.value = payload
      emit('saved')
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    } finally {
      pendingAction.value = null
    }
  })

const remove = () =>
  handle(async () => {
    if (!(await confirm({ text: t('confirmations.delete', { documentId: props.documentId }) }))) {
      return
    }
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.deleting') })
    pendingAction.value = 'delete'
    try {
      const task = await processTask(() => meili.index(props.indexUid).deleteDocument(props.documentId))
      if ('succeeded' !== task.status) {
        throw new Error(('error' in task && task.error?.message) || t('toasts.failed'))
      }
      toast.update({ ...TOAST_SUCCESS(t) })
      open.value = false
      emit('deleted')
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    } finally {
      pendingAction.value = null
    }
  })
</script>

<style scoped>
/* vanilla-jsoneditor's default accent is blue; tint its chrome with the Meiliweb palette. */
.json-editor {
  --jse-theme-color: var(--color-meili-800);
  --jse-theme-color-highlight: var(--color-meili-700);
}
</style>

<i18n>
en:
  loading: Loading document...
  actions:
    delete: Delete document
  confirmations:
    delete: 'Delete document {documentId}? This cannot be undone.'
  errors:
    primaryKeyChanged: The primary key ({primaryKey}) cannot be changed. Delete this document and add a new one instead.
  toasts:
    saving: Saving document...
    deleting: Deleting document...
    failed: Meilisearch could not process this document.
</i18n>
