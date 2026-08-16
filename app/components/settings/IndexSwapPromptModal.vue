<template>
  <PromisifiedDialog :title="t('title', { indexUid })" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(self.targetIndexUid)" @reset.prevent="close()">
      <Alert theme="warning" :title="t('warnings.title')">
        {{ t('warnings.swap') }}
      </Alert>

      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.targetIndexUid') }}</Label>
        <Select :id="id" required :disabled="self.loading" v-model="self.targetIndexUid">
          <option value="" disabled>
            {{ self.loading ? t('placeholders.loading') : t('placeholders.pickAnIndex') }}
          </option>
          <option v-for="uid of self.otherIndexes" :key="uid" :value="uid">{{ uid }}</option>
        </Select>
        <p v-if="!self.loading && 0 === self.otherIndexes.length" class="text-xs text-red-600 italic">
          {{ t('notices.noOtherIndexes') }}
        </p>
      </UniqueId>

      <Buttons>
        <Button type="submit" :disabled="!self.targetIndexUid">
          {{ t('actions.swap') }}
        </Button>
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import UniqueId from '~/components/UniqueId.vue'
import Alert from '~/components/layout/Alert.vue'
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import { useMeiliClient } from '~/composables'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()

const self = reactive({
  loading: true,
  otherIndexes: [] as string[],
  targetIndexUid: '',
})

onMounted(async () => {
  const { results } = await meili.getIndexes({ limit: 1000 })
  self.otherIndexes = results.map(({ uid }) => uid).filter((uid) => uid !== props.indexUid)
  self.loading = false
})
</script>

<i18n>
en:
  title: "Swap `{indexUid}` with…"
  labels:
    targetIndexUid: Index to swap with
  placeholders:
    pickAnIndex: Select an index...
    loading: Loading indexes...
  notices:
    noOtherIndexes: There is no other index to swap with.
  warnings:
    title: This cannot be undone
    swap: >-
      This exchanges the documents, settings and primary key of both indexes. Both indexes keep their current name.
      It runs immediately.
  actions:
    swap: Swap indexes
</i18n>
