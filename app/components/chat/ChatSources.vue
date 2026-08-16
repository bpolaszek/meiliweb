<template>
  <details v-if="documents.length" class="rounded-lg border border-gray-200 bg-gray-50 text-sm">
    <summary class="cursor-pointer px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900">
      {{ t('summary', { count: documents.length }) }}
    </summary>
    <ul class="divide-y divide-gray-200 border-t border-gray-200">
      <li v-for="(document, index) of documents" :key="index" class="px-3 py-2">
        <NuxtLink
          v-if="document.indexUid"
          :to="`/indexes/${document.indexUid}/documents`"
          class="text-xs font-semibold text-primary-800 hover:underline">
          {{ document.indexUid }}
        </NuxtLink>
        <pre class="mt-1 overflow-x-auto text-xs whitespace-pre-wrap text-gray-600">{{ preview(document) }}</pre>
      </li>
    </ul>
  </details>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

/** Shape of one entry in `_meiliSearchSources`; the document itself is arbitrary user data. */
type ChatSourceDocument = Record<string, any> & { indexUid?: string }

type Props = {
  documents: ChatSourceDocument[]
}

const props = defineProps<Props>()
const { t } = useI18n()

// Documents come straight from the user's index, so their shape is unknown — show the raw
// JSON rather than guessing which field is a title.
const preview = (document: ChatSourceDocument) => JSON.stringify(document, null, 2)
</script>

<i18n>
en:
  summary: '{count} source(s) used for this answer'
</i18n>
