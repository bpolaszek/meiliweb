<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3
      class="inline-flex w-full items-center justify-between text-xl font-semibold">
      {{ t('title') }}
      <DocumentationLink
        href="https://www.meilisearch.com/docs/learn/security/managing_api_keys" />
    </h3>

    <Alert v-if="error" dismissable theme="danger" @close="error = null">
      {{ error }}
    </Alert>

    <Alert
      v-if="createdKey"
      dismissable
      theme="success"
      :title="t('alerts.success.title')"
      @close="createdKey = null">
      <dl class="flex items-center gap-2">
        <dt class="font-medium">{{ t('alerts.success.uid') }}:</dt>
        <dd>
          {{ createdKey.uid }}
          <ClipboardButton :source="createdKey.uid" />
        </dd>
      </dl>
      <dl class="flex items-center gap-2">
        <dt class="font-medium">{{ t('alerts.success.secretKey') }}:</dt>
        <dd>
          {{ createdKey.key }}
          <ClipboardButton :source="createdKey.key" />
        </dd>
      </dl>
    </Alert>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <header class="flex items-center justify-between">
        <Label :for="id">{{ t('labels.indexes') }}</Label>
        <div>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <span class="text-sm font-light italic text-gray-600">
              {{ t('labels.allIndexes') }}
            </span>
            <input
              type="checkbox"
              v-model="key.indexes"
              value="*"
              class="form-checkbox" />
          </label>
        </div>
      </header>
      <MultiCombobox
        autofocus
        :items="indexes"
        v-model="key.indexes"
        class="w-full"
        :input-attrs="{ id, disabled: key.indexes.includes('*') }" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <DefineActionCheckbox v-slot="{ action }">
        <UniqueId
          v-tippy="t(`keyActions.${action}.description`)"
          as="div"
          class="flex items-center gap-1"
          v-slot="{ id }">
          <Label :for="id" class="cursor-pointer">
            <Badge
              :theme="key.actions.includes(action) ? 'success' : 'neutral'">
              {{ t(`keyActions.${action}.label`) }}
            </Badge>
          </Label>
          <input
            :id
            :value="action"
            v-model="key.actions"
            type="checkbox"
            class="hidden" />
        </UniqueId>
      </DefineActionCheckbox>

      <Label :for="id">{{ t('labels.actions') }}</Label>
      <dl class="grid grid-cols-6 gap-4 text-sm">
        <dt class="font-light">
          <button type="button" @click="toggleActions(['search'])">
            {{ t('labels.action.search') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <ActionCheckbox action="search" />
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(DOCUMENT_ACTIONS)">
            {{ t('labels.action.documents') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of DOCUMENT_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(INDEX_ACTIONS)">
            {{ t('labels.action.indexes') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of INDEX_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(TASK_ACTIONS)">
            {{ t('labels.action.tasks') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of TASK_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(KEY_ACTIONS)">
            {{ t('labels.action.keys') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of KEY_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(SETTINGS_ACTIONS)">
            {{ t('labels.action.settings') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of SETTINGS_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>

        <dt class="font-light">
          <button type="button" @click="toggleActions(MISC_ACTIONS)">
            {{ t('labels.action.misc') }}
          </button>
        </dt>
        <dd class="col-span-5 flex flex-wrap items-center gap-4">
          <template v-for="action of MISC_ACTIONS" :key="action">
            <ActionCheckbox :action />
          </template>
        </dd>
      </dl>
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id">{{ t('labels.name') }}</Label>
      <input v-model="key.name" class="form-input w-full" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <Label :for="id">{{ t('labels.description') }}</Label>
      <Textarea v-model="key.description" class="w-full" />
    </UniqueId>

    <UniqueId as="section" v-slot="{ id }" class="space-y-1">
      <header class="flex items-center justify-between">
        <Label :for="id">{{ t('labels.expiresAt') }}</Label>
        <div>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <span class="text-sm font-light italic text-gray-600">
              {{ t('labels.neverExpires') }}
            </span>
            <input
              :disabled="expires"
              type="checkbox"
              v-model="expires"
              class="form-checkbox" />
          </label>
        </div>
      </header>
      <div>
        <input
          type="datetime-local"
          v-model="key.expiresAt"
          class="form-input w-full" />
      </div>
    </UniqueId>

    <footer class="flex flex-col items-center justify-end sm:flex-row">
      <Buttons>
        <Button type="reset" :disabled="!modified || loading" />
        <Button type="submit" :disabled="!modified || loading" :loading />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import Buttons from '~/components/layout/forms/Buttons.vue'
import UniqueId from '~/components/UniqueId.vue'
import Label from '~/components/layout/forms/Label.vue'
import Button from '~/components/layout/forms/Button.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Alert from '~/components/layout/Alert.vue'
import Textarea from '~/components/layout/forms/Textarea.vue'
import Badge from '~/components/layout/Badge.vue'
import MultiCombobox from '~/components/layout/forms/MultiCombobox.vue'
import ClipboardButton from '~/components/layout/forms/ClipboardButton.vue'
import { useFormSubmit, useMeiliClient } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores/toasts'
import { resettableRef } from '~/utils'
import { createReusableTemplate, watchArray } from '@vueuse/core'
import type { Key } from 'meilisearch'
import type { ComputedRef } from 'vue'

const [DefineActionCheckbox, ActionCheckbox] = createReusableTemplate()
const { t } = useI18n()
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const factory = () => ({
  name: '',
  description: '',
  actions: [] as string[],
  indexes: [] as string[],
  expiresAt: null as Date | null,
})
const { createToast } = useToasts()
const meili = useMeiliClient()
const { value: key, reset, modified } = resettableRef(factory())
const self = reactive({
  key,
  createdKey: null as Key | null,
})
const expires = computed({
  get: () => !self.key.expiresAt,
  set(value: string | boolean) {
    if ('boolean' === typeof value) {
      self.key.expiresAt = value
        ? null
        : (new Date(
            new Date().setMonth(new Date().getMonth() + 1),
          ).toISOString() as unknown as Date)
    } else {
      self.key.expiresAt = value as unknown as Date
    }
  },
}) as ComputedRef<boolean>
const DOCUMENT_ACTIONS = ['documents.get', 'documents.add', 'documents.delete']
const INDEX_ACTIONS = [
  'indexes.get',
  'indexes.create',
  'indexes.update',
  'indexes.delete',
  'indexes.swap',
]
const TASK_ACTIONS = ['tasks.get', 'tasks.cancel', 'tasks.delete']
const KEY_ACTIONS = ['keys.get', 'keys.create', 'keys.update', 'keys.delete']
const SETTINGS_ACTIONS = ['settings.get', 'settings.update']
const MISC_ACTIONS = [
  'version',
  'stats.get',
  'dumps.create',
  'snapshots.create',
]
const toggleActions = (actions: string[]) => {
  const nbIncludedActions = self.key.actions.filter((action) =>
    actions.includes(action),
  ).length
  for (const action of actions) {
    const index = self.key.actions.findIndex((_action) => _action === action)
    index >= 0 && self.key.actions.splice(index, 1)
  }
  if (nbIncludedActions === actions.length) {
    return
  }
  self.key.actions.push(...actions)
}
watchArray(
  () => self.key.indexes,
  (_, __, additions) => {
    if (additions[0] === '*') {
      self.key.indexes = ['*']
    }
  },
)

const submit = async () => {
  self.createdKey = null
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.success.title'),
  })
  await handle(async () => {
    toast.spawn()
    try {
      self.createdKey = await meili.createKey(self.key)
      toast.update({ ...TOAST_SUCCESS(t) })
      reset(factory())
    } catch (e) {
      toast.update({
        ...TOAST_FAILURE(t),
      })
    }
  })
}

const { createdKey } = toRefs(self)
const indexes = (await meili.getRawIndexes({ limit: 1000 })).results.map(
  ({ uid }) => uid,
)
</script>

<i18n>
en:
  title: Create API Key
  toasts:
    success:
      title: Creating your key...
  confirmations:
    submit: Do you want to create this key?
  alerts:
      success:
        title: Your key was successfully created!
        uid: UID
        secretKey: Secret key
  labels:
    name: Name
    description: Description
    indexes: Indexes
    actions: Actions
    expiresAt: Expires
    allIndexes: All indexes
    neverExpires: Never
    action:
      search: Search
      documents: Documents
      indexes: Indexes
      tasks: Tasks
      keys: Keys
      settings: Settings
      misc: Misc.
  keyActions:
    search:
      label: SEARCH
      description: Provides access to both POST and GET search endpoints
    documents:
      get:
        label: GET
        description: Provides access to the get one document, get documents with POST, and get documents with GET endpoints.
      add:
        label: ADD
        description: Provides access to the add documents and update documents endpoints.
      delete:
        label: DELETE
        description: Provides access to the delete one document, delete all documents, batch delete, and delete by filter endpoints.
    indexes:
      get:
        label: GET
        description: Provides access to the get one index and list all indexes endpoints. Non-authorized indexes will be omitted from the response.
      create:
        label: CREATE
        description: Provides access to the create index endpoint.
      update:
        label: UPDATE
        description: Provides access to the update index endpoint.
      delete:
        label: DELETE
        description: Provides access to the delete index endpoint.
      swap:
        label: SWAP
        description: Provides access to the swap indexes endpoint. Non-authorized indexes will not be swapped.
    tasks:
      get:
        label: GET
        description: Provides access to the get one task and get tasks endpoints. Tasks from non-authorized indexes will be omitted from the response.
      cancel:
        label: CANCEL
        description: Provides access to the cancel tasks endpoint. Tasks from non-authorized indexes will not be canceled.
      delete:
        label: DELETE
        description: Provides access to the delete tasks endpoint. Tasks from non-authorized indexes will not be deleted.
    settings:
      get:
        label: GET
        description: Provides access to the get settings endpoint and equivalents for all subroutes.
      update:
        label: UPDATE
        description: Provides access to the update settings and reset settings endpoints and equivalents for all subroutes.
    keys:
      get:
        label: GET
        description: Provides access to the get all keys endpoint.
      create:
        label: CREATE
        description: Provides access to the create key endpoint.
      update:
        label: UPDATE
        description: Provides access to the update key endpoint.
      delete:
        label: DELETE
        description: Provides access to the delete key endpoint.
    version:
      label: VERSION
      description: Provides access to the get Meilisearch version endpoint.
    stats:
      get:
        label: STATS
        description: Provides access to the get stats of an index endpoint and the get stats of all indexes endpoint. For the latter, non-authorized indexes are omitted from the response.
    dumps:
      create:
        label: CREATE DUMP
        description: Provides access to the create dump endpoint. Not restricted by indexes.
    snapshots:
      create:
        label: CREATE SNAPSHOT
        description: Provides access to the create dump endpoint. Not restricted by indexes.
</i18n>
