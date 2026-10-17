<template>
  <section class="space-y-3 rounded-lg border border-gray-200 p-4">
    <header class="flex items-center justify-between gap-2">
      <h4 class="font-semibold text-gray-900">{{ title }}</h4>
      <DocumentationLink v-if="href" :href />
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
import DocumentationLink from '~/components/layout/DocumentationLink.vue'

type Props = {
  title: string
  href?: string
}
defineProps<Props>()
</script>
