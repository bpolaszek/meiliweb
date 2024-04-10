<template>
  <Layout :title="humanizeString(index.uid)" :subtitle="t('subtitle')">
    <template #title-actions>
      <NuxtLink
        :to="`/indexes/${index.uid}/documents`"
        v-tippy="t('actions.documents')">
        <Icon name="pajamas:documents" />
      </NuxtLink>
    </template>
    <div class="grid h-48 grid-cols-12 gap-4">
      <menu class="col-span-3 space-y-3">
        <li
          v-for="{ href, text, current } of navigation"
          class="block w-full rounded-lg shadow-md"
          :class="
            current
              ? 'bg-primary-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100'
          ">
          <NuxtLink :to="href" class="block size-full px-2 py-3 text-sm">
            {{ text }}
          </NuxtLink>
        </li>
      </menu>
      <div class="col-span-9">
        <NuxtPage :index-uid="index.uid" />
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { NuxtLink, NuxtPage } from '#components'
import { onMounted } from 'vue'
import { useMeiliClient } from '~/composables'
import { tryOrThrow } from '~/utils'
import humanizeString from 'humanize-string'

const { t } = useI18n()
const route = useRoute()
const indexUid = route.params.indexUid
const meili = useMeiliClient()
const index = await tryOrThrow(() => meili.getIndex(indexUid as string))

type NavigationItem = {
  href: string
  text: string
  current: boolean
}

const navigation: Array<NavigationItem> = reactive([
  {
    href: `/indexes/${index.uid}/settings/general-settings`,
    current: computed(
      () => 'indexes-indexUid-settings-general-settings' === route.name,
    ),
    text: t('menu.generalSettings'),
  },
  {
    href: `/indexes/${index.uid}/settings/import-documents`,
    current: computed(
      () => 'indexes-indexUid-settings-import-documents' === route.name,
    ),
    text: t('menu.importDocuments'),
  },
  {
    href: `/indexes/${index.uid}/settings/filterable-attributes`,
    current: computed(
      () => 'indexes-indexUid-settings-filterable-attributes' === route.name,
    ),
    text: t('menu.filterableAttributes'),
  },
  {
    href: `/indexes/${index.uid}/settings/searchable-attributes`,
    current: computed(
      () => 'indexes-indexUid-settings-searchable-attributes' === route.name,
    ),
    text: t('menu.searchableAttributes'),
  },
  {
    href: `/indexes/${index.uid}/settings/sortable-attributes`,
    current: computed(
      () => 'indexes-indexUid-settings-sortable-attributes' === route.name,
    ),
    text: t('menu.sortableAttributes'),
  },
  {
    href: `/indexes/${index.uid}/settings/displayed-attributes`,
    current: computed(
      () => 'indexes-indexUid-settings-displayed-attributes' === route.name,
    ),
    text: t('menu.displayedAttributes'),
  },
  {
    href: `/indexes/${index.uid}/settings/dictionary`,
    current: computed(
      () => 'indexes-indexUid-settings-dictionary' === route.name,
    ),
    text: t('menu.dictionary'),
  },
  {
    href: `/indexes/${index.uid}/settings/local-settings`,
    current: computed(
      () => 'indexes-indexUid-settings-local-settings' === route.name,
    ),
    text: t('menu.localSettings'),
  },
])

onMounted(() => {
  if ('indexes-indexUid-settings' === route.name) {
    navigateTo(`/indexes/${index.uid}/settings/general-settings`, {
      replace: true,
    })
  }
})
</script>

<i18n>
en:
  subtitle: Index Settings
  menu:
    generalSettings: General
    importDocuments: Import documents
    filterableAttributes: Filterable Attributes
    searchableAttributes: Searchable Attributes
    sortableAttributes: Sortable Attributes
    displayedAttributes: Displayed Attributes
    dictionary: Dictionary
    localSettings: Local settings
  actions:
    documents: Go to Documents
</i18n>
