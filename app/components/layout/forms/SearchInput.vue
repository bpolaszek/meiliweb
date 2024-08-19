<template>
  <div class="relative">
    <div
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
    </div>
    <input
      v-model="value"
      name="search"
      autocomplete="off"
      class="block w-full rounded-lg border-0 bg-white py-1 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
      :placeholder="t('placeholder')"
      type="search"
      v-bind="inputAttrs" />
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

type Props = {
  inputAttrs?: any
}
defineProps<Props>()
const value = defineModel()
const { t } = useI18n()
</script>

<i18n>
en:
  placeholder: Search...
</i18n>
