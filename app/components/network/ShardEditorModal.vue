<template>
  <PromisifiedDialog :title="shardName ? t('title.edit') : t('title.create')" v-slot="{ resolve, close }">
    <form class="space-y-4" @submit.prevent="resolve(payload())" @reset.prevent="close()">
      <UniqueId as="section" v-slot="{ id }" class="flex flex-col gap-1">
        <Label required :for="id">{{ t('labels.name') }}</Label>
        <input
          :id
          v-model.trim="form.name"
          required
          v-focus
          :disabled="!!shardName"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          type="text"
          :placeholder="t('placeholders.name')"
          class="form-input disabled:cursor-not-allowed disabled:bg-gray-100" />
      </UniqueId>

      <section class="flex flex-col gap-1">
        <Label>{{ t('labels.remotes') }}</Label>
        <p class="text-sm font-light text-gray-600">{{ t('hints.remotes') }}</p>
        <MultiCombobox v-model="form.remotes" :items="remoteNames" auto-hide>
          <template #empty-state>
            <span class="text-gray-400">{{ t('placeholders.remotes') }}</span>
          </template>
        </MultiCombobox>
      </section>

      <Buttons>
        <Button type="reset" />
        <Button type="submit" />
      </Buttons>
    </form>
  </PromisifiedDialog>
</template>

<script setup lang="ts">
import PromisifiedDialog from '~/components/layout/dialogs/PromisifiedDialog.vue'
import Label from '~/components/layout/forms/Label.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Button from '~/components/layout/forms/Button.vue'
import MultiCombobox from '~/components/layout/forms/MultiCombobox.vue'

type Props = {
  /** Existing shard name to edit (read-only), or `null`/`undefined` to create a new one. */
  shardName?: string | null
  /** Remotes currently assigned to the shard being edited. */
  remotes?: string[]
  /** All known remote names, used as the pool of selectable remotes. */
  remoteNames?: string[]
}
const props = defineProps<Props>()
const { t } = useI18n()

const form = reactive({
  name: props.shardName ?? '',
  remotes: [...(props.remotes ?? [])],
})

const payload = () => ({ name: form.name, remotes: [...form.remotes] })
</script>

<i18n>
en:
  title:
    create: Add shard
    edit: Edit shard
  labels:
    name: Name
    remotes: Remotes
  hints:
    remotes: Select which remotes belong to this shard.
  placeholders:
    name: shard-00
    remotes: No remotes selected
</i18n>
