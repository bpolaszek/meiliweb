<template>
  <div class="flow-root overflow-hidden">
    <div class="mx-auto max-w-7xl">
      <table class="w-full text-left">
        <thead class="bg-white">
          <slot name="head">
            <tr
              class="*:py-4 *:pr-3 *:text-left *:text-sm *:font-semibold *:text-gray-900">
              <slot name="columns">
                <template v-for="(key, index) of columns ?? keys">
                  <th v-if="0 === index" scope="col" class="relative isolate">
                    {{ key }}
                    <div
                      class="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200" />
                    <div
                      class="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200" />
                  </th>
                  <th v-else scope="col" class="whitespace-nowrap">
                    {{ key }}
                  </th>
                </template>
              </slot>
            </tr>
          </slot>
        </thead>
        <tbody>
          <tr
            v-for="(item, rowIndex) of items"
            class="*:relative *:py-4 *:pr-3 *:text-sm *:text-gray-900">
            <slot :item="item" :index="rowIndex">
              <template v-for="(key, index) of keys">
                <td v-if="0 === index" class="font-medium">
                  {{ item[key] }}
                  <div
                    class="absolute bottom-0 right-full h-px w-screen bg-gray-100" />
                  <div
                    class="absolute bottom-0 left-0 h-px w-screen bg-gray-100" />
                </td>
                <td v-else class="px-3 py-4 text-sm text-gray-500">
                  {{ item[key] }}
                </td>
              </template>
            </slot>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
type Props = {
  items?: Array<any>
  keys?: Array<string>
  columns?: Array<string>
}

const props = withDefaults(defineProps<Props>(), { items: [] })

const self = reactive({
  keys: computed(() => props.keys ?? Object.keys(props.items[0] ?? {})),
})

const { keys } = toRefs(self)
</script>
