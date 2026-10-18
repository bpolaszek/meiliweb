import type { Embedders, EnqueuedTask } from 'meilisearch'
import EmbedderApiKeysPromptModal from '~/components/settings/EmbedderApiKeysPromptModal.vue'
import IndexNamePromptModal from '~/components/settings/IndexNamePromptModal.vue'
import IndexSwapPromptModal from '~/components/settings/IndexSwapPromptModal.vue'
import { useMeiliClient } from '~/composables/useMeiliClient'
import { useTask } from '~/composables/useTask'
import {
  TOAST_FAILURE,
  TOAST_PLEASEWAIT,
  TOAST_SUCCESS,
  useConfirmationDialog,
  usePromisifiedDialogs,
  useToasts,
} from '~/stores'
import { waitForTasks } from '~/utils'

type RenameIndexOptions = {
  newIndexUid?: string
  onStart: (newIndexUid: string) => void
}

type DuplicateIndexOptions = RenameIndexOptions

const DEFAULT_DUPLICATE_INDEX_OPTIONS: DuplicateIndexOptions = {
  onStart: () => {},
}

type SwapIndexOptions = {
  targetIndexUid?: string
  onStart: (targetIndexUid: string) => void
}

const DEFAULT_SWAP_INDEX_OPTIONS: SwapIndexOptions = {
  onStart: () => {},
}

const COMPOSITE_EMBEDDER_PARTS = ['searchEmbedder', 'indexingEmbedder'] as const

export type RedactedEmbedderApiKey = {
  embedder: string
  part?: (typeof COMPOSITE_EMBEDDER_PARTS)[number]
  redactedKey: string
  // The embedder settings object holding the key, so the real key can be written back in place.
  target: Record<string, any>
}

// Meilisearch always redacts embedder API keys when settings are read back (e.g. `abcXXXXX...`).
const findRedactedEmbedderApiKeys = (embedders: Embedders | undefined): RedactedEmbedderApiKey[] =>
  Object.entries(embedders ?? {}).flatMap(([embedder, settings]: [string, any]) => [
    ...(settings?.apiKey ? [{ embedder, redactedKey: settings.apiKey, target: settings }] : []),
    ...COMPOSITE_EMBEDDER_PARTS.filter((part) => settings?.[part]?.apiKey).map((part) => ({
      embedder,
      part,
      redactedKey: settings[part].apiKey,
      target: settings[part],
    })),
  ])

export const useIndexOperations = () => {
  const { t } = useI18n()
  const meili = useMeiliClient()
  const { openDialog } = usePromisifiedDialogs()
  const { confirm } = useConfirmationDialog()
  const { createToast } = useToasts()
  const processTask = useTask()

  const duplicateIndex = async (indexUid: string, options: Partial<DuplicateIndexOptions> = {}): Promise<string> => {
    let { onStart, newIndexUid } = {
      ...DEFAULT_DUPLICATE_INDEX_OPTIONS,
      ...options,
    }
    const index = await meili.getIndex(indexUid)
    newIndexUid =
      newIndexUid ??
      (await openDialog(IndexNamePromptModal, {
        indexUid: `${indexUid}-copy`,
      }))

    // Asked before anything is created, so cancelling the prompt leaves no half-copied index behind.
    const settings = await index.getSettings()
    const redactedApiKeys = findRedactedEmbedderApiKeys(settings.embedders)
    if (redactedApiKeys.length > 0) {
      const apiKeys: string[] = await openDialog(EmbedderApiKeysPromptModal, {
        embedders: redactedApiKeys.map(({ target, ...embedder }) => embedder),
      })
      redactedApiKeys.forEach(({ target }, i) => {
        const apiKey = apiKeys[i]?.trim()
        if (apiKey) {
          target.apiKey = apiKey
        } else {
          delete target.apiKey
        }
      })
    }

    onStart(newIndexUid)
    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.titles.duplicateIndex', { indexUid, newIndexUid }),
    })

    let taskOptions = {
      onCanceled: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.canceledTask'),
        }),
      onFailure: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.failedTask'),
        }),
    }

    let task = await processTask(
      async () =>
        meili.createIndex(newIndexUid, {
          primaryKey: await index.fetchPrimaryKey(),
        }),
      taskOptions,
    )
    if (task.status === 'failed') {
      throw new Error('Failed to duplicate index')
    }

    const newIndex = await meili.getIndex(newIndexUid)
    task = await processTask(async () => newIndex.updateSettings(settings))
    if (task.status === 'failed') {
      throw new Error('Failed to duplicate index')
    }

    // Copying `_vectors` as returned (embeddings + `regenerate` flag) lets Meilisearch store them without calling the
    // embedders again, while keeping regeneration on future updates. Vectors make documents much heavier, hence smaller
    // chunks to stay below the payload size limit.
    const hasEmbedders = Object.keys(settings.embedders ?? {}).length > 0
    const chunkSize = hasEmbedders ? 1000 : 5000
    const taskUids: number[] = []
    await processIteratorByChunks(
      exportDocuments(meili, indexUid, { limit: chunkSize, retrieveVectors: hasEmbedders }),
      async (documents: any[]) => {
        const { taskUid } = await newIndex.addDocuments(documents)
        taskUids.push(taskUid)
      },
      chunkSize,
    )

    await waitForTasks(meili, taskUids, {
      timeout: 1000 * 60 * 5 * taskUids.length,
    })

    toast.update({ ...TOAST_SUCCESS(t) })

    return newIndexUid
  }

  const renameIndex = async (indexUid: string, options: Partial<RenameIndexOptions> = {}): Promise<string> => {
    let { onStart, newIndexUid } = {
      ...DEFAULT_DUPLICATE_INDEX_OPTIONS,
      ...options,
    }
    const index = await meili.getIndex(indexUid)
    newIndexUid =
      newIndexUid ??
      (await openDialog(IndexNamePromptModal, {
        indexUid: `${indexUid}-new`,
      }))
    onStart(newIndexUid)
    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.titles.renameIndex', { indexUid, newIndexUid }),
    })

    let taskOptions = {
      onCanceled: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.canceledTask'),
        }),
      onFailure: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.failedTask'),
        }),
    }

    let task = await processTask(
      async () =>
        meili.createIndex(newIndexUid, {
          primaryKey: await index.fetchPrimaryKey(),
        }),
      taskOptions,
    )
    if (task.status === 'failed') {
      throw new Error('Failed to rename index')
    }

    task = await processTask(() => meili.swapIndexes([{ indexes: [indexUid, newIndexUid] }]), taskOptions)
    if (task.status === 'failed') {
      throw new Error('Failed to rename index')
    }

    task = await processTask(() => meili.deleteIndex(indexUid), taskOptions)
    if (task.status === 'failed') {
      throw new Error('Failed to rename index')
    }

    toast.update({ ...TOAST_SUCCESS(t) })

    return newIndexUid
  }

  const swapIndex = async (indexUid: string, options: Partial<SwapIndexOptions> = {}): Promise<string> => {
    let { onStart, targetIndexUid } = {
      ...DEFAULT_SWAP_INDEX_OPTIONS,
      ...options,
    }

    if (undefined === targetIndexUid) {
      targetIndexUid = await openDialog(IndexSwapPromptModal, { indexUid })
    }

    onStart(targetIndexUid)
    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.titles.swapIndexes', { indexUid, targetIndexUid }),
    })

    // `rename` is required by the client's `IndexSwap` type; Meiliweb only ever plain-swaps.
    const task = await processTask(() => meili.swapIndexes([{ indexes: [indexUid, targetIndexUid], rename: false }]), {
      onCanceled: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.canceledTask'),
        }),
      onFailure: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.failedTask'),
        }),
    })
    if (task.status === 'failed') {
      throw new Error('Failed to swap indexes')
    }

    toast.update({ ...TOAST_SUCCESS(t) })

    return targetIndexUid
  }

  const compactIndex = async (indexUid: string): Promise<void> => {
    if (!(await confirm({ text: t('confirmations.compactIndex.text') }))) {
      return
    }

    const toast = createToast({
      ...TOAST_PLEASEWAIT(t),
      title: t('toasts.titles.compactIndex', { indexUid }),
    })

    // The JS client (meilisearch@0.60.0) does not expose `compact()` yet, so we talk to the
    // REST API directly through the client's `httpRequest` (same approach as useWebhooks).
    // @see https://www.meilisearch.com/docs/reference/api/indexes/compact-index
    const task = await processTask(
      () => meili.httpRequest.post({ path: `indexes/${indexUid}/compact` }) as Promise<EnqueuedTask>,
      {
        onCanceled: () =>
          toast.update({
            ...TOAST_FAILURE(t),
            text: t('toasts.texts.canceledTask'),
          }),
        onFailure: () =>
          toast.update({
            ...TOAST_FAILURE(t),
            text: t('toasts.texts.failedTask'),
          }),
      },
    )
    if (task.status === 'failed') {
      throw new Error('Failed to compact index')
    }

    toast.update({ ...TOAST_SUCCESS(t) })
  }

  return { duplicateIndex, renameIndex, swapIndex, compactIndex }
}
