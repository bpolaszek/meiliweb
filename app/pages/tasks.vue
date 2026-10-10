<template>
  <Layout :title="t('title')">
    <PageTabs
      :items="[
        { label: t('tabs.tasks'), to: '/tasks' },
        { label: t('tabs.batches'), to: '/tasks/batches' },
      ]" />
    <NuxtPage />
  </Layout>
</template>

<script setup lang="ts">
import { NuxtPage } from '#components'
import PageTabs from '~/components/layout/PageTabs.vue'

const { t } = useI18n()
</script>

<i18n>
en:
  title: Tasks
  tabs:
    tasks: Tasks
    batches: Batches
</i18n>
