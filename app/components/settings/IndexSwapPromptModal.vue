<template>
  <PromisifiedDialog :title="t('title', { indexUid })" v-slot="{ resolve, close }">
    <form
      class="space-y-4"
      @submit.prevent="resolve({ targetIndexUid: self.targetIndexUid, rename: self.rename })"
      @reset.prevent="close()">
      <Alert theme="warning">
        {{
          self.rename
            ? t('warnings.rename', { indexUid, targetIndexUid: self.targetIndexUid || '…' })
            : t('warnings.swap')
        }}
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

      <UniqueId v-if="satisfiesVersion('>=1.18.0')" as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <Label :for="id">{{ t('labels.rename') }}</Label>
          <USwitch :id="id" v-model="self.rename" />
        </div>
        <p class="text-xs text-gray-600 italic">
          {{ t('notices.rename', { indexUid }) }}
        </p>
      </UniqueId>

      <Buttons>
        <Button type="submit" :disabled="!self.targetIndexUid">
          {{ self.rename ? t('actions.rename') : t('actions.swap') }}
        </Button>
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import Alert from '~/components/layout/Alert.vue'
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import Select from '~/components/layout/forms/Select.vue'
import UniqueId from '~/components/UniqueId.vue'
import { useMeiliClient } from '~/composables'
import { useVersion } from '~/stores'

type Props = {
  indexUid: string
}
const props = defineProps<Props>()
const { t } = useI18n()
const meili = useMeiliClient()
const { satisfiesVersion } = useVersion()

const self = reactive({
  loading: true,
  otherIndexes: [] as string[],
  targetIndexUid: '',
  rename: false,
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
    rename: Rename instead of swapping
  placeholders:
    pickAnIndex: Select an index...
    loading: Loading indexes...
  notices:
    noOtherIndexes: There is no other index to swap with.
    rename: >-
      When enabled, `{indexUid}` is renamed to the selected index instead of exchanging content. If the selected
      index already exists, it is replaced.
  warnings:
    swap: >-
      This exchanges the documents, settings and primary key of both indexes. Both indexes keep their current name.
      This runs immediately and cannot be undone.
    rename: "`{indexUid}` will be renamed to `{targetIndexUid}`, replacing it if it already exists. This runs immediately and cannot be undone."
  actions:
    swap: Swap indexes
    rename: Rename index
</i18n>
