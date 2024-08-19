<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <template #title-actions>
      <NuxtLink to="/keys" v-tippy="t('actions.listKeys')">
        <Icon name="gg:list" />
      </NuxtLink>
    </template>
    <div class="grid h-48 grid-cols-12 gap-4">
      <menu class="col-span-3 space-y-3">
        <li
          :class="[
            'keys-settings-create' === $route.name
              ? 'bg-primary-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100',
            'block w-full rounded-lg shadow-md',
          ]">
          <NuxtLink
            to="/keys/settings/create"
            class="block size-full px-2 py-3 text-sm">
            {{ t('menu.createKey') }}
          </NuxtLink>
        </li>
        <li
          :class="[
            'keys-settings-create-token' === $route.name
              ? 'bg-primary-600 text-white'
              : 'bg-gray-50 hover:bg-gray-100',
            'block w-full rounded-lg shadow-md',
          ]">
          <NuxtLink
            to="/keys/settings/create-token"
            class="block size-full px-2 py-3 text-sm">
            {{ t('menu.createTenantToken') }}
          </NuxtLink>
        </li>
      </menu>
      <div class="col-span-9">
        <NuxtPage />
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { NuxtLink, NuxtPage } from '#components'
import { onMounted } from 'vue'

const { t } = useI18n()
const route = useRoute()

onMounted(() => {
  if ('keys-settings' === route.name) {
    navigateTo({ ...route, name: 'keys-settings-create' }, { replace: true })
  }
})
</script>

<i18n>
en:
  title: Access Keys
  subtitle: Configuration
  menu:
    createKey: Create key
    createTenantToken: Create tenant token
  actions:
    listKeys: Go to keys list
</i18n>
