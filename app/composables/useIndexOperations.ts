import IndexNamePromptModal from '~/components/settings/IndexNamePromptModal.vue'
import { useMeiliClient } from '~/composables/useMeiliClient'
import { useTask } from '~/composables/useTask'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, usePromisifiedDialogs, useToasts } from '~/stores'

type RenameIndexOptions = {
  newIndexUid?: string
  onStart: (newIndexUid: string) => void
}

type DuplicateIndexOptions = RenameIndexOptions

const DEFAULT_DUPLICATE_INDEX_OPTIONS: DuplicateIndexOptions = {
  onStart: () => {},
}

export const useIndexOperations = () => {
  const { t } = useI18n()
  const meili = useMeiliClient()
  const { openDialog } = usePromisifiedDialogs()
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
    task = await processTask(async () => newIndex.updateSettings(await index.getSettings()))
    if (task.status === 'failed') {
      throw new Error('Failed to duplicate index')
    }

    const taskUids: number[] = []
    await processIteratorByChunks(
      exportDocuments(meili, indexUid, { limit: 5000 }),
      async (documents: any[]) => {
        const { taskUid } = await newIndex.addDocuments(documents)
        taskUids.push(taskUid)
      },
      5000,
    )

    await meili.waitForTasks(taskUids, {
      timeOutMs: 1000 * 60 * 5 * taskUids.length,
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

  return { duplicateIndex, renameIndex }
}
