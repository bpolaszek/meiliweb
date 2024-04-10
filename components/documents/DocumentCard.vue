<template>
  <article>
    <div class="flex w-full items-start justify-between gap-4">
      <div v-if="picture" class="hidden @3xl:block">
        <img
          :src="picture"
          :alt="name"
          class="max-h-80 max-w-80 shrink rounded-md object-cover object-top shadow-md" />
      </div>
      <div class="w-full">
        <header
          class="mb-2 flex items-center justify-between border-b border-b-gray-300 pb-2">
          <h2 class="flex gap-2 text-lg font-medium">
            <span v-if="nameField === primaryKey">#</span>
            <span class="line-clamp-1 text-gray-700">{{ name }}</span>
          </h2>
        </header>
        <dl class="space-y-2 @xl:space-y-0">
          <div class="@xl:table-row">
            <dt
              class="text-sm font-medium uppercase text-gray-800 @xl:table-cell @xl:p-1"
              :title="primaryKey as string">
              {{ primaryKey }}
            </dt>
            <dd
              class="table-cell text-justify text-sm font-semibold text-gray-800 @xl:p-1">
              <ValueRenderer
                :index-uid="indexUid"
                :field="primaryKey as string"
                :value="document[primaryKey]"
                :level="0" />
            </dd>
          </div>
          <template v-for="key of fieldsWithoutPrimaryKey">
            <div class="@xl:table-row">
              <dt
                class="table-cell text-sm font-light uppercase text-gray-400 @xl:p-1"
                :title="key">
                {{ key }}
              </dt>
              <dd class="text-justify text-sm @xl:table-cell @xl:p-1">
                <ValueRenderer
                  :index-uid="indexUid"
                  :field="key"
                  :value="document[key]"
                  :level="0"
                  class="whitespace-pre-wrap" />
              </dd>
            </div>
          </template>
        </dl>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import ValueRenderer from './ValueRenderer.vue'
import { useFields } from '~/composables'
import { looksLikeAPictureUrl } from '~/utils'

type Props = {
  indexUid: string
  document: any
  primaryKey: string
}

const props = defineProps<Props>()

const picture = computed(
  () =>
    Object.values(props.document).find(looksLikeAPictureUrl) as string | null,
)

const { fieldsWithoutPrimaryKey, nameField } = useFields(
  props.primaryKey,
  Object.keys(props.document),
)
const self: any = reactive({
  nameField,
  name: computed(() => props.document[self.nameField]),
})
const { name } = toRefs(self)
</script>
