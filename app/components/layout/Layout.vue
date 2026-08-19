<template>
  <div class="flex h-full flex-col overflow-hidden" :class="noPaddingBottom || 'pb-8'">
    <LayoutTopNavigation />
    <div class="relative grow">
      <div class="absolute inset-0 flex flex-col">
        <section class="static top-0 mx-auto w-full max-w-7xl bg-white px-4 py-4 sm:px-6 lg:px-8">
          <slot name="header" :title="title" :subtitle="subtitle">
            <LayoutPageHeader :title="title" :subtitle="subtitle">
              <template #title-actions>
                <slot name="title-actions" />
              </template>
              <template #actions>
                <slot name="actions" />
              </template>
            </LayoutPageHeader>
          </slot>
        </section>
        <div class="relative grow overflow-hidden">
          <div class="absolute inset-0 overflow-auto">
            <section class="mx-auto h-full w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <slot />
            </section>
          </div>
        </div>
      </div>
    </div>
    <section class="mx-auto w-full max-w-7xl empty:hidden">
      <slot name="footer" />
    </section>
  </div>
</template>

<script setup lang="ts">
type Props = {
  title: string
  subtitle?: string
  nowrap?: boolean
  noPaddingBottom?: boolean
}

defineProps<Props>()
</script>
