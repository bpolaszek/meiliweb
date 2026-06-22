<template>
  <PromisifiedDialog :title="remote ? t('title.edit') : t('title.create')" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(payload())" @reset.prevent="close()">
      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.name') }}</Label>
        <input
          :id
          v-model.trim="form.name"
          required
          v-focus
          :disabled="!!remote"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          type="text"
          :placeholder="t('placeholders.name')"
          class="form-input disabled:cursor-not-allowed disabled:bg-gray-100" />
      </UniqueId>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.url') }}</Label>
        <input
          :id
          v-model.trim="form.url"
          required
          type="url"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :placeholder="t('placeholders.url')"
          class="form-input" />
      </UniqueId>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.searchApiKey') }}</Label>
        <input
          :id
          v-model="form.searchApiKey"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :placeholder="t('placeholders.optional')"
          class="form-input" />
      </UniqueId>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label :for="id">{{ t('labels.writeApiKey') }}</Label>
        <input
          :id
          v-model="form.writeApiKey"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          :placeholder="t('placeholders.optional')"
          class="form-input" />
      </UniqueId>

      <Buttons>
        <Button type="reset" />
        <Button type="submit" />
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Label from '~/components/layout/forms/Label.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'
import type { Remote } from '~/components/network/types'

type RemoteEntry = { name: string } & Remote

type Props = {
  /** Existing remote to edit (name read-only), or `null`/`undefined` to create a new one. */
  remote?: RemoteEntry | null
  /** Remote names already in use, to prevent duplicates when creating. */
  existingNames?: string[]
}
const props = defineProps<Props>()
const { t } = useI18n()

const form = reactive({
  name: props.remote?.name ?? '',
  url: props.remote?.url ?? '',
  searchApiKey: props.remote?.searchApiKey ?? '',
  writeApiKey: props.remote?.writeApiKey ?? '',
})

// The promise resolves with a normalized entry; empty optional keys become null (PATCH clears them).
const payload = (): RemoteEntry => ({
  name: form.name,
  url: form.url,
  searchApiKey: form.searchApiKey.trim() || null,
  writeApiKey: form.writeApiKey.trim() || null,
})
</script>

<i18n>
en:
  title:
    create: Add remote
    edit: Edit remote
  labels:
    name: Name
    url: URL
    searchApiKey: Search API key
    writeApiKey: Write API key
  placeholders:
    name: ms-1
    url: http://localhost:7701
    optional: Optional
</i18n>
