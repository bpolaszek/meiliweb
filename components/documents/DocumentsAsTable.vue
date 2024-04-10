<template>
  <main>
    <Table :items="documents" :keys="fields" class="overflow-x-auto">
      <template #default="{ index: rowIndex }">
        <td v-for="field of fields">
          <a
            v-if="looksLikeAPictureUrl(documents[rowIndex][field])"
            :href="documents[rowIndex][field]"
            target="_blank">
            <img
              :src="documents[rowIndex][field]"
              :alt="documents[rowIndex][field]"
              class="max-h-48 rounded-lg" />
          </a>
          <ValueRenderer
            v-else
            :index-uid="indexUid"
            :field="field"
            :value="documents[rowIndex][field]"
            :level="0" />
        </td>
      </template>
    </Table>
  </main>
</template>

<script setup lang="ts">
import { looksLikeAPictureUrl } from '~/utils'
import Table from '~/components/layout/tables/Table.vue'
import ValueRenderer from '~/components/documents/ValueRenderer.vue'

type Props = {
  documents: Array<any>
  fields: Array<string>
  indexUid: string
}

defineProps<Props>()
</script>
