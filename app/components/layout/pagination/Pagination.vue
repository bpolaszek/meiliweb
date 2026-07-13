<template>
  <UPagination
    :page="currentPage"
    :total="lastPage"
    :items-per-page="1"
    :sibling-count="2"
    active-color="primary"
    variant="ghost"
    @update:page="$emit('update:page', $event)" />
</template>

<script setup lang="ts">
type Props = {
  page?: number
  currentPage: number
  lastPage: number
  previousPage: number
  nextPage: number
}

type Events = {
  (e: 'update:page', id: number): void
}
defineEmits<Events>()
withDefaults(defineProps<Props>(), {
  page: 1,
})
</script>
