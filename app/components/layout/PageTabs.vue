<template>
  <nav class="-mt-2 mb-4 border-b border-gray-200">
    <ul class="flex gap-6">
      <li v-for="item in items" :key="item.to">
        <NuxtLink
          :to="item.to"
          :class="[
            isCurrent(item)
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
            'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium',
          ]"
          :aria-current="isCurrent(item) ? 'page' : undefined">
          <Icon v-if="item.icon" :name="item.icon" class="size-4" />
          {{ item.label }}
          <Badge v-if="undefined !== item.badge" theme="neutral" class="text-xs">
            {{ item.badge }}
          </Badge>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { useRoute } from '#imports'
import Badge from '~/components/layout/Badge.vue'

export type PageTab = {
  label: string
  to: string
  icon?: string
  badge?: string | number
  /** Route name prefix used to resolve the active tab. Defaults to an exact match on `to`. */
  match?: string
}

type Props = {
  items: PageTab[]
}

const props = defineProps<Props>()
const route = useRoute()

const isCurrent = (item: PageTab) =>
  item.match ? String(route.name ?? '').startsWith(item.match) : route.path === item.to
</script>
