<template>
  <main class="space-y-6 @container">
    <DocumentCard
      v-for="document of documents"
      :indexUid="indexUid"
      :document
      :primary-key="primaryKey"
      :key="document[primaryKey]"
      class="w-full" />
  </main>
</template>

<script setup lang="ts">
import DocumentCard from './DocumentCard.vue'

type Props = {
  indexUid: string
  primaryKey: string
  documents: Array<any>
}

defineProps<Props>()
</script>
