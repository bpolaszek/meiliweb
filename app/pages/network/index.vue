<template>
  <Layout :title="t('title')" :subtitle="t('subtitle')">
    <template #title-actions>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/network" />
    </template>

    <Alert v-if="loadError" theme="danger" :title="t('errors.unavailable.title')">
      {{ t('errors.unavailable.text') }}
    </Alert>

    <div v-else class="space-y-8">
      <!-- Identity: self & leader -->
      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-1 text-lg font-semibold text-gray-900">{{ t('identity.title') }}</h2>
        <p class="mb-4 text-sm text-gray-500">{{ t('identity.subtitle') }}</p>
        <form class="flex flex-col gap-4 sm:flex-row sm:items-end" @submit.prevent="saveIdentity()">
          <UniqueId as="div" v-slot="{ id }" class="flex flex-1 flex-col gap-1">
            <Label :for="id">{{ t('identity.self') }}</Label>
            <input
              :id
              v-model.trim="identity.self"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="t('identity.selfPlaceholder')"
              class="form-input w-full" />
          </UniqueId>
          <UniqueId as="div" v-slot="{ id }" class="flex flex-1 flex-col gap-1">
            <Label :for="id">{{ t('identity.leader') }}</Label>
            <input
              :id
              v-model.trim="identity.leader"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="t('identity.leaderPlaceholder')"
              class="form-input w-full" />
          </UniqueId>
          <Button type="submit" theme="primary" :disabled="!identityChanged">
            {{ t('actions.save') }}
          </Button>
        </form>
      </section>

      <!-- Remotes -->
      <section class="space-y-3">
        <header class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('remotes.title') }}</h2>
            <p class="text-sm text-gray-500">{{ t('remotes.subtitle') }}</p>
          </div>
          <Button theme="primary" icon="heroicons:plus" @click="addRemote()">
            {{ t('actions.addRemote') }}
          </Button>
        </header>

        <Table
          v-if="remoteEntries.length"
          :items="remoteEntries"
          :columns="[
            t('columns.name'),
            t('columns.url'),
            t('columns.searchApiKey'),
            t('columns.writeApiKey'),
            t('columns.actions'),
          ]">
          <template #default="{ index: i }">
            <td class="font-medium">{{ remoteEntries[i].name }}</td>
            <td class="break-all">{{ remoteEntries[i].url }}</td>
            <td>
              <span v-if="remoteEntries[i].searchApiKey" class="font-mono text-sm">
                {{ remoteEntries[i].searchApiKey }}
              </span>
              <span v-else class="text-sm font-light italic text-gray-500">{{ t('placeholders.none') }}</span>
            </td>
            <td>
              <span v-if="remoteEntries[i].writeApiKey" class="font-mono text-sm">
                {{ remoteEntries[i].writeApiKey }}
              </span>
              <span v-else class="text-sm font-light italic text-gray-500">{{ t('placeholders.none') }}</span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  v-tippy="t('actions.edit')"
                  class="text-gray-500 hover:text-primary-600"
                  @click="editRemote(remoteEntries[i])">
                  <Icon name="heroicons:pencil-square" />
                </button>
                <button
                  type="button"
                  v-tippy="t('actions.delete')"
                  class="text-gray-500 hover:text-red-600"
                  @click="removeRemote(remoteEntries[i].name)">
                  <Icon name="heroicons:trash" />
                </button>
              </div>
            </td>
          </template>
        </Table>
        <p v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          {{ t('remotes.empty') }}
        </p>
      </section>

      <!-- Shards -->
      <section class="space-y-3">
        <header class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">{{ t('shards.title') }}</h2>
            <p class="text-sm text-gray-500">{{ t('shards.subtitle') }}</p>
          </div>
          <Button theme="primary" icon="heroicons:plus" :disabled="!remoteNames.length" @click="addShard()">
            {{ t('actions.addShard') }}
          </Button>
        </header>

        <Table
          v-if="shardEntries.length"
          :items="shardEntries"
          :columns="[t('columns.name'), t('columns.remotes'), t('columns.actions')]">
          <template #default="{ index: i }">
            <td class="font-medium">{{ shardEntries[i].name }}</td>
            <td>
              <div v-if="shardEntries[i].remotes.length" class="flex flex-wrap gap-1">
                <Badge v-for="name in shardEntries[i].remotes" :key="name" theme="neutral">{{ name }}</Badge>
              </div>
              <span v-else class="text-sm font-light italic text-gray-500">{{ t('placeholders.none') }}</span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  v-tippy="t('actions.edit')"
                  class="text-gray-500 hover:text-primary-600"
                  @click="editShard(shardEntries[i])">
                  <Icon name="heroicons:pencil-square" />
                </button>
                <button
                  type="button"
                  v-tippy="t('actions.delete')"
                  class="text-gray-500 hover:text-red-600"
                  @click="removeShard(shardEntries[i].name)">
                  <Icon name="heroicons:trash" />
                </button>
              </div>
            </td>
          </template>
        </Table>
        <p v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          {{ t('shards.empty') }}
        </p>
      </section>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '~/components/layout/Layout.vue'
import Alert from '~/components/layout/Alert.vue'
import Badge from '~/components/layout/Badge.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import Button from '~/components/layout/forms/Button.vue'
import Label from '~/components/layout/forms/Label.vue'
import Table from '~/components/layout/tables/Table.vue'
import RemoteEditorModal from '~/components/network/RemoteEditorModal.vue'
import ShardEditorModal from '~/components/network/ShardEditorModal.vue'
import type { NetworkTopology, NetworkUpdate, Remote } from '~/components/network/types'
import { useMeiliClient } from '~/composables'
import {
  DismissedDialog,
  TOAST_FAILURE,
  TOAST_PLEASEWAIT,
  TOAST_SUCCESS,
  useConfirmationDialog,
  usePromisifiedDialogs,
  useToasts,
} from '~/stores'

type RemoteEntry = { name: string } & Remote
type ShardEntry = { name: string; remotes: string[] }

const { t } = useI18n()
const meili = useMeiliClient()
const { createToast } = useToasts()
const { confirm } = useConfirmationDialog()
const { openDialog } = usePromisifiedDialogs()

// Register lifecycle-bound composables before the first `await` so they keep their component context.
useHead({ title: t('title') })

const empty = (): NetworkTopology => ({ self: null, leader: null, remotes: {}, shards: {} })

const self = reactive({
  network: empty() as NetworkTopology,
  loadError: false,
})

const load = async () => {
  // Direct call (not tryOrThrow): we degrade gracefully rather than route to the global fatal
  // error page, since an older instance (or one with the `network` feature disabled) returns 404.
  const raw = (await meili.getNetwork()) as unknown as Partial<NetworkTopology>
  self.network = {
    self: raw.self ?? null,
    leader: raw.leader ?? null,
    remotes: raw.remotes ?? {},
    shards: raw.shards ?? {},
  }
}

try {
  await load()
} catch {
  self.loadError = true
}

// Editable copy of self/leader; reset whenever the network reloads.
const identity = reactive({ self: self.network.self ?? '', leader: self.network.leader ?? '' })
watch(
  () => self.network,
  (network) => {
    identity.self = network.self ?? ''
    identity.leader = network.leader ?? ''
  },
)

const identityChanged = computed(
  () => identity.self !== (self.network.self ?? '') || identity.leader !== (self.network.leader ?? ''),
)

const remoteEntries = computed<RemoteEntry[]>(() =>
  Object.entries(self.network.remotes).map(([name, remote]) => ({ name, ...remote })),
)
const remoteNames = computed(() => Object.keys(self.network.remotes))
const shardEntries = computed<ShardEntry[]>(() =>
  Object.entries(self.network.shards).map(([name, shard]) => ({ name, remotes: shard.remotes ?? [] })),
)

/**
 * Apply a partial PATCH and refresh from the server response. /network is synchronous
 * (no task object), so we don't wrap it in useTask. Returns the updated topology.
 */
const patch = async (update: NetworkUpdate, toastTitle: string) => {
  const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: toastTitle })
  try {
    const updated = (await meili.updateNetwork(update as never)) as unknown as Partial<NetworkTopology>
    self.network = {
      self: updated.self ?? null,
      leader: updated.leader ?? null,
      remotes: updated.remotes ?? {},
      shards: updated.shards ?? {},
    }
    toast.update({ ...TOAST_SUCCESS(t) })
  } catch (e) {
    toast.update({ ...TOAST_FAILURE(t) })
    throw e
  }
}

const saveIdentity = () =>
  patch({ self: identity.self || null, leader: identity.leader || null }, t('toasts.savingIdentity')).catch(() => {})

const addRemote = async () => {
  try {
    const entry = (await openDialog(RemoteEditorModal, { existingNames: remoteNames.value })) as RemoteEntry
    await upsertRemote(entry)
  } catch (e) {
    if (!(e instanceof DismissedDialog)) throw e
  }
}

const editRemote = async (remote: RemoteEntry) => {
  try {
    const entry = (await openDialog(RemoteEditorModal, { remote })) as RemoteEntry
    await upsertRemote(entry)
  } catch (e) {
    if (!(e instanceof DismissedDialog)) throw e
  }
}

const upsertRemote = (entry: RemoteEntry) => {
  const { name, ...remote } = entry
  return patch({ remotes: { [name]: remote } }, t('toasts.savingRemote', { name })).catch(() => {})
}

const removeRemote = async (name: string) => {
  if (!(await confirm({ text: t('confirmations.removeRemote', { name }) }))) return
  // Passing `null` removes the remote; Meilisearch auto-removes it from any shards too.
  await patch({ remotes: { [name]: null } }, t('toasts.removingRemote', { name })).catch(() => {})
}

const addShard = async () => {
  try {
    const result = (await openDialog(ShardEditorModal, { remoteNames: remoteNames.value })) as ShardEntry
    await patch(
      { shards: { [result.name]: { remotes: result.remotes } } },
      t('toasts.savingShard', { name: result.name }),
    ).catch(() => {})
  } catch (e) {
    if (!(e instanceof DismissedDialog)) throw e
  }
}

const editShard = async (shard: ShardEntry) => {
  try {
    const result = (await openDialog(ShardEditorModal, {
      shardName: shard.name,
      remotes: shard.remotes,
      remoteNames: remoteNames.value,
    })) as ShardEntry
    // A non-null `remotes` array replaces the whole set for this shard.
    await patch(
      { shards: { [result.name]: { remotes: result.remotes } } },
      t('toasts.savingShard', { name: result.name }),
    ).catch(() => {})
  } catch (e) {
    if (!(e instanceof DismissedDialog)) throw e
  }
}

const removeShard = async (name: string) => {
  if (!(await confirm({ text: t('confirmations.removeShard', { name }) }))) return
  await patch({ shards: { [name]: null } }, t('toasts.removingShard', { name })).catch(() => {})
}

const { loadError } = toRefs(self)
</script>

<i18n>
en:
  title: Network
  subtitle: Manage this instance's network topology — its identity, remote instances and shards.
  errors:
    unavailable:
      title: Network unavailable
      text: This Meilisearch instance does not expose the network endpoint.
            It may be running a version older than 1.37, or the "network" experimental feature is disabled.
  identity:
    title: Identity
    subtitle: The name of this instance in the network and the current leader.
    self: Self
    selfPlaceholder: 'e.g. ms-0'
    leader: Leader
    leaderPlaceholder: 'e.g. ms-0'
  remotes:
    title: Remotes
    subtitle: Other Meilisearch instances participating in this network.
    empty: No remotes configured yet.
  shards:
    title: Shards
    subtitle: Groups of remotes that documents are distributed across.
    empty: No shards configured yet.
  columns:
    name: Name
    url: URL
    searchApiKey: Search API key
    writeApiKey: Write API key
    remotes: Remotes
    actions: Actions
  placeholders:
    none: None
  actions:
    save: Save
    addRemote: Add remote
    addShard: Add shard
    edit: Edit
    delete: Delete
  confirmations:
    removeRemote: 'Do you really want to remove the remote "{name}"?'
    removeShard: 'Do you really want to remove the shard "{name}"?'
  toasts:
    savingIdentity: Saving network identity...
    savingRemote: 'Saving remote "{name}"...'
    removingRemote: 'Removing remote "{name}"...'
    savingShard: 'Saving shard "{name}"...'
    removingShard: 'Removing shard "{name}"...'
</i18n>
