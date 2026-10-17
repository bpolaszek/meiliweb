<template>
  <main>
    <Table :items="documents" :keys="fields" class="overflow-x-auto">
      <template #default="{ index: rowIndex }">
        <td v-for="field of fields">
          <a v-if="looksLikeAPictureUrl(documents[rowIndex][field])" :href="documents[rowIndex][field]" target="_blank">
            <img :src="documents[rowIndex][field]" :alt="documents[rowIndex][field]" class="max-h-48 rounded-lg" />
          </a>
          <template v-else-if="field === primaryKey">
            <DocumentIdLink :document-id="documents[rowIndex][field]">
              <ValueRenderer :index-uid="indexUid" :field="field" :value="documents[rowIndex][field]" :level="0" />
            </DocumentIdLink>
            <SimilarDocumentsLink :document-id="documents[rowIndex][field]" class="ml-2" />
          </template>
          <ValueRenderer v-else :index-uid="indexUid" :field="field" :value="documents[rowIndex][field]" :level="0" />
        </td>
      </template>
    </Table>
  </main>
</template>

<script setup lang="ts">
import { looksLikeAPictureUrl } from '~/utils'
import Table from '~/components/layout/tables/Table.vue'
import ValueRenderer from '~/components/documents/ValueRenderer.vue'
import DocumentIdLink from '~/components/documents/DocumentIdLink.vue'
import SimilarDocumentsLink from '~/components/documents/SimilarDocumentsLink.vue'

type Props = {
  documents: Array<any>
  fields: Array<string>
  indexUid: string
  primaryKey: string
}

defineProps<Props>()
</script>
