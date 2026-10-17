<template>
  <PromisifiedDialog :title="t('title')" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(apiKeys)" @reset.prevent="close()">
      <p>{{ t('notices.redacted') }}</p>

      <UFormField
        v-for="({ embedder, part, redactedKey }, index) of embedders"
        :key="`${embedder}:${part ?? ''}`"
        :label="part ? `${embedder} › ${t(`parts.${part}`)}` : embedder"
        :help="t('hints.redactedKey', { redactedKey })">
        <UInput v-model="apiKeys[index]" type="password" autocomplete="off" class="w-full" />
      </UFormField>

      <p class="text-xs text-gray-600 italic">{{ t('notices.blank') }}</p>

      <Buttons>
        <Button type="submit">{{ t('actions.duplicate') }}</Button>
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import type { RedactedEmbedderApiKey } from '~/composables'

type Props = {
  embedders: Omit<RedactedEmbedderApiKey, 'target'>[]
}
const props = defineProps<Props>()
const { t } = useI18n()
const apiKeys = ref<string[]>(props.embedders.map(() => ''))
</script>

<i18n>
en:
  title: Embedder API keys
  notices:
    redacted: >-
      Meilisearch never discloses the API keys of embedders, so they can't be copied to the new index.
      Please enter them again.
    blank: >-
      Leave a key blank to set it later: vectors are copied anyway, but semantic search and new documents will fail for
      this embedder until you do.
  hints:
    redactedKey: "Current key: {redactedKey}"
  parts:
    searchEmbedder: search
    indexingEmbedder: indexing
  actions:
    duplicate: Duplicate index
</i18n>
