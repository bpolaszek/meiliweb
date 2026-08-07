<template>
  <form class="max-w-2xl space-y-8" @reset.prevent="reset()" @submit.prevent="submit()">
    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <section class="space-y-4">
      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.source') }}</Label>
        <Select :id v-model="form.source" required class="w-full">
          <option v-for="source of CHAT_SOURCES" :key="source" :value="source">{{ sourceLabels[source] }}</option>
        </Select>
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :required="'vLlm' === form.source" :for="id">{{ t('labels.baseUrl') }}</Label>
        <input
          :id
          v-model="form.baseUrl"
          :required="'vLlm' === form.source"
          autocomplete="off"
          type="url"
          :placeholder="t('placeholders.baseUrl')"
          class="form-input w-full text-sm" />
        <p class="text-sm font-light text-gray-500">{{ t('hints.baseUrl') }}</p>
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.apiKey') }}</Label>
        <input
          :id
          v-model="form.apiKey"
          autocomplete="off"
          type="password"
          :placeholder="t('placeholders.apiKey')"
          class="form-input w-full text-sm" />
        <p class="text-sm font-light text-gray-500">{{ t('hints.apiKey') }}</p>
      </UniqueId>

      <OpenAiChatSourceForm v-if="'openAi' === form.source" v-model="form" />
      <AzureOpenAiChatSourceForm v-if="'azureOpenAi' === form.source" v-model="form" />
    </section>

    <section class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold">{{ t('sections.prompts') }}</h3>
        <p class="text-sm font-light text-gray-500">{{ t('hints.prompts') }}</p>
      </div>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.prompts.system') }}</Label>
        <Textarea :id v-model="form.prompts.system" class="w-full text-sm" rows="6" />
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.prompts.searchDescription') }}</Label>
        <Textarea :id v-model="form.prompts.searchDescription" class="w-full text-sm" rows="3" />
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.prompts.searchQParam') }}</Label>
        <Textarea :id v-model="form.prompts.searchQParam" class="w-full text-sm" rows="2" />
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.prompts.searchFilterParam') }}</Label>
        <Textarea :id v-model="form.prompts.searchFilterParam" class="w-full text-sm" rows="2" />
      </UniqueId>

      <UniqueId v-slot="{ id }" as="section" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.prompts.searchIndexUidParam') }}</Label>
        <Textarea :id v-model="form.prompts.searchIndexUidParam" class="w-full text-sm" rows="2" />
      </UniqueId>
    </section>

    <footer class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <Button type="button" icon="mdi:backup-restore" :disabled="loading" @click="resetToDefaults()">
        {{ t('actions.resetToDefaults') }}
      </Button>
      <Buttons>
        <Button type="reset" :disabled="loading" />
        <Button type="submit" :disabled="loading" :loading />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import UniqueId from '~/components/UniqueId.vue'
import AzureOpenAiChatSourceForm from '~/components/chat/source/AzureOpenAiChatSourceForm.vue'
import OpenAiChatSourceForm from '~/components/chat/source/OpenAiChatSourceForm.vue'
import Alert from '~/components/layout/Alert.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import { CHAT_SOURCES, useChatWorkspaces, useFormSubmit, type ChatWorkspaceSettings } from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useConfirmationDialog, useToasts } from '~/stores'

type Props = {
  uid: string
  settings: ChatWorkspaceSettings
}
const props = defineProps<Props>()
const emit = defineEmits<{ saved: [settings: ChatWorkspaceSettings] }>()

const { t } = useI18n()
const { updateSettings, resetSettings, getSettings } = useChatWorkspaces()
const { confirm } = useConfirmationDialog()
const { createToast } = useToasts()
const { loading, error, handle } = useFormSubmit()

const sourceLabels: Record<string, string> = {
  openAi: 'OpenAI',
  azureOpenAi: 'Azure OpenAI',
  mistral: 'Mistral',
  gemini: 'Gemini',
  vLlm: 'vLLM',
}

/**
 * The API key is never prefilled: Meilisearch redacts it when reading the settings back, so
 * echoing it would either leak a masked value into the payload or overwrite the real secret.
 * An empty field means "keep the current key".
 */
const factory = () => ({
  source: props.settings.source ?? 'openAi',
  baseUrl: props.settings.baseUrl ?? '',
  apiKey: '',
  orgId: props.settings.orgId ?? '',
  projectId: props.settings.projectId ?? '',
  deploymentId: props.settings.deploymentId ?? '',
  apiVersion: props.settings.apiVersion ?? '',
  prompts: {
    system: props.settings.prompts?.system ?? '',
    searchDescription: props.settings.prompts?.searchDescription ?? '',
    searchQParam: props.settings.prompts?.searchQParam ?? '',
    searchFilterParam: props.settings.prompts?.searchFilterParam ?? '',
    searchIndexUidParam: props.settings.prompts?.searchIndexUidParam ?? '',
  },
})

// A `ref` (rather than `reactive`) so the source sub-forms can take it through `v-model`
// without the compiler having to rewrite a const binding.
const form = ref(factory())
const reset = () => (form.value = factory())

/** PATCH semantics: an omitted field keeps its value, an explicit `null` resets it to default. */
const orNull = (value: string) => (value.trim().length ? value.trim() : null)

const payload = () => {
  const { source, baseUrl, apiKey, orgId, projectId, deploymentId, apiVersion, prompts } = form.value
  const body: Partial<ChatWorkspaceSettings> = {
    source,
    baseUrl: orNull(baseUrl),
    // Fields that don't apply to the selected source are reset rather than left dangling.
    orgId: 'openAi' === source ? orNull(orgId) : null,
    projectId: 'openAi' === source ? orNull(projectId) : null,
    deploymentId: 'azureOpenAi' === source ? orNull(deploymentId) : null,
    apiVersion: 'azureOpenAi' === source ? orNull(apiVersion) : null,
    prompts: {
      system: orNull(prompts.system),
      searchDescription: orNull(prompts.searchDescription),
      searchQParam: orNull(prompts.searchQParam),
      searchFilterParam: orNull(prompts.searchFilterParam),
      searchIndexUidParam: orNull(prompts.searchIndexUidParam),
    },
  }
  if (apiKey.trim()) {
    body.apiKey = apiKey.trim()
  }
  return body
}

const submit = () =>
  handle(async () => {
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.saving') })
    try {
      const settings = await updateSettings(props.uid, payload())
      toast.update({ ...TOAST_SUCCESS(t) })
      emit('saved', settings)
      form.value.apiKey = ''
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    }
  })

const resetToDefaults = () =>
  handle(async () => {
    if (!(await confirm({ text: t('confirmations.resetToDefaults') }))) {
      return
    }
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.resetting') })
    try {
      await resetSettings(props.uid)
      // The reset endpoint answers 204, so read the defaults back to refresh the form.
      emit('saved', await getSettings(props.uid))
      toast.update({ ...TOAST_SUCCESS(t) })
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    }
  })

// Re-seed the form whenever the page hands over freshly loaded settings.
watch(() => props.settings, reset)
</script>

<i18n>
en:
  sections:
    prompts: Prompts
  labels:
    source: LLM source
    baseUrl: Base URL
    apiKey: API key
    prompts:
      system: System prompt
      searchDescription: Search tool description
      searchQParam: Search query parameter description
      searchFilterParam: Search filter parameter description
      searchIndexUidParam: Search index parameter description
  placeholders:
    baseUrl: https://api.openai.com/v1
    apiKey: Leave blank to keep the current key
  hints:
    baseUrl: Overrides the provider default. Required for self-hosted vLLM.
    apiKey: Stored by Meilisearch and redacted when read back, so it is never prefilled here.
    prompts: Leave a field empty to fall back to the Meilisearch default prompt.
  actions:
    resetToDefaults: Reset to defaults
  confirmations:
    resetToDefaults: Do you really want to reset every setting of this workspace, including its API key?
  toasts:
    saving: Saving settings...
    resetting: Resetting settings...
</i18n>
