<template>
  <section class="space-y-4">
    <h3 class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
    </h3>

    <AttributesAsDateTimeEditor :index-uid="indexUid" />
    <AttributesAsBadgesEditor :index-uid="indexUid" />
  </section>
</template>

<script setup lang="ts">
import AttributesAsDateTimeEditor from '~/components/settings/AttributesAsDateTimeEditor.vue'
import AttributesAsBadgesEditor from '~/components/settings/AttributesAsBadgesEditor.vue'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()

useHead({
  title: `${t('title')} - ${props.indexUid}`,
})
</script>

<i18n>
en:
  title: Local settings
</i18n>
