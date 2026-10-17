<template>
  <section class="space-y-3">
    <header>
      <h5 class="text-sm font-medium text-gray-900">{{ t(`${kind}.title`) }}</h5>
      <p class="text-xs text-gray-600">{{ t(`${kind}.description`, LIQUID_VARIABLES) }}</p>
    </header>

    <div v-for="(fragment, i) of fragments" :key="i" class="flex items-start gap-2">
      <UInput
        v-model="fragment.name"
        required
        :placeholder="t('placeholders.name')"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        class="w-1/4" />
      <UFormField :error="!isValidJson(fragment.value) && t('errors.invalidJson')" class="flex-1">
        <Textarea
          v-model="fragment.value"
          required
          :placeholder="EXAMPLES[kind]"
          class="w-full font-mono text-xs"
          :rows="4" />
      </UFormField>
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="heroicons:trash"
        v-tippy="t('actions.remove')"
        class="shrink-0 hover:text-red-600"
        @click="fragments.splice(i, 1)" />
    </div>

    <UButton type="button" size="sm" color="neutral" variant="outline" icon="heroicons:plus" @click="add()">
      {{ t('actions.add') }}
    </UButton>
  </section>
</template>

<script setup lang="ts">
import Textarea from '~/components/layout/forms/Textarea.vue'
import type { EmbedderFragmentRow } from '~/utils'

type Kind = 'indexingFragments' | 'searchFragments'

// Passed as parameters: vue-i18n would parse the braces of literal Liquid tags as its own interpolations
const LIQUID_VARIABLES = { doc: '{{doc.…}}', q: '{{q}}', media: '{{media.…}}', fragment: '{{fragment}}' }
const EXAMPLES: Record<Kind, string> = {
  indexingFragments: JSON.stringify({ content: [{ type: 'image_url', image_url: '{{doc.poster}}' }] }, null, 2),
  searchFragments: JSON.stringify({ content: [{ type: 'text', text: '{{q}}' }] }, null, 2),
}

defineProps<{ kind: Kind }>()
const fragments = defineModel<EmbedderFragmentRow[]>({ required: true })
const { t } = useI18n()

const add = () => fragments.value.push({ name: '', value: '' })

const isValidJson = (value: string) => {
  if (!value.trim()) {
    return true
  }
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
</script>

<i18n>
en:
  indexingFragments:
    title: Indexing fragments
    description: "Each fragment produces its own embedding for every document. Its value is sent in place of {fragment} in the request, and its strings are Liquid templates with access to {doc}."
  searchFragments:
    title: Search fragments
    description: "How queries are embedded: each search must match exactly one fragment. Strings are Liquid templates with access to {q} and {media}."
  placeholders:
    name: Fragment name
  actions:
    add: Add fragment
    remove: Remove fragment
  errors:
    invalidJson: Invalid JSON
</i18n>
