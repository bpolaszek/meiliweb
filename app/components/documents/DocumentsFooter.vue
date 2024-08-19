<template>
  <footer
    class="flex items-center justify-between gap-6 rounded-t-xl border border-gray-100 bg-gray-50 px-8 py-2 text-xs text-gray-600 shadow-2xl">
    <dl class="flex items-center gap-1">
      <dt>{{ t('labels.nbEstimatedHits') }}:</dt>
      <dd>{{ nbTotalItems }}</dd>
    </dl>
    <dl class="hidden items-center gap-1 lg:flex">
      <dt>{{ t('labels.processingTime') }}:</dt>
      <dd>{{ processingTimeMs }}ms</dd>
    </dl>
    <UniqueId as="div" v-slot="{ id }" class="inline-flex items-center gap-1">
      <select :id="id" v-model="itemsPerPage">
        <option :value="1">1</option>
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="500">500</option>
      </select>
      <label :for="id" class="hidden md:inline">
        {{ t('labels.itemsPerPage') }}
      </label>
    </UniqueId>
    <span>{{ t('labels.pagination', { currentPage, lastPage }) }}</span>
    <nav>
      <button
        type="button"
        :disabled="currentPage === 1"
        @click="offset = getPageOffset(previousPage)"
        class="enabled:text-gray-600 enabled:hover:text-gray-800 disabled:cursor-default disabled:text-gray-300">
        {{ t('labels.previous') }}
      </button>
      /
      <button
        type="button"
        :disabled="currentPage === lastPage"
        @click="offset = getPageOffset(nextPage)"
        class="enabled:text-gray-600 enabled:hover:text-gray-800 disabled:cursor-default disabled:text-gray-300">
        {{ t('labels.next') }}
      </button>
    </nav>
  </footer>
</template>

<script setup lang="ts">
import { usePagination } from '~/composables'
import type { Ref } from 'vue'

type Props = {
  nbTotalItems: number
  processingTimeMs: number
  currentPage: number
  lastPage: number
  previousPage: number
  nextPage: number
}

defineProps<Props>()
const offset = defineModel('offset')
const itemsPerPage = defineModel('itemsPerPage') as unknown as Ref<number>
const { t } = useI18n()
const { getPageOffset } = usePagination(itemsPerPage)
</script>

<i18n>
en:
  labels:
    nbEstimatedHits: Nb. estimated hits
    processingTime: Processing time
    itemsPerPage: items per page
    pagination: "Page {currentPage} / {lastPage}"
    previous: Previous
    next: Next
</i18n>
