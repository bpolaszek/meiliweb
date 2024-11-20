<template>
  <nav class="flex gap-1">
    <button
      role="link"
      v-for="page in pages"
      :key="page"
      class="inline-flex items-center border-b-2 px-4 pb-4 text-sm font-medium"
      :class="
        page === currentPage
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      "
      @click="$emit('update:page', page)">
      {{ page }}
    </button>
  </nav>
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
const props = withDefaults(defineProps<Props>(), {
  page: 1,
})

const VISIBLE_PAGES = 5
const self = reactive({
  pages: computed(() => {
    const pages = []
    const start = Math.max(
      1,
      Math.min(
        props.currentPage - Math.floor(VISIBLE_PAGES / 2),
        props.lastPage - VISIBLE_PAGES + 1,
      ),
    )
    const end = Math.min(props.lastPage, start + VISIBLE_PAGES - 1)
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }),
})

const { pages } = toRefs(self)
</script>
