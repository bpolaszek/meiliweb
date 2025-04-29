<template>
  <div>
    <nav class="mt-4 flex hidden" aria-label="Breadcrumb">
      <ol role="list" class="flex items-center space-x-4">
        <li>
          <div class="flex">
            <a href="/" class="text-sm font-medium text-gray-500 hover:text-gray-700">
              <HomeIcon class="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
            </a>
          </div>
        </li>
        <li>
          <div class="flex items-center">
            <ChevronRightIcon class="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            <a href="#" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Breadcrumbs</a>
          </div>
        </li>
      </ol>
    </nav>
    <header class="lg:flex lg:items-center lg:justify-between">
      <div class="mt-2 min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-bold capitalize">{{ title }}</h1>
          <slot name="title-actions" />
        </div>
        <h2 v-if="subtitle" class="text-sm font-light text-gray-500">
          {{ subtitle }}
        </h2>
      </div>

      <div class="mt-4 flex items-center justify-center gap-4 text-sm lg:mt-0 lg:justify-end">
        <slot name="actions" />
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/20/solid'

type Props = {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>
