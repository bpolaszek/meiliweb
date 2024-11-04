export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      toasts: {
        titles: {
          error: 'An error occured.',
          duplicateIndex: 'Copying {indexUid} to {newIndexUid}',
          renameIndex: 'Renaming {indexUid} to {newIndexUid}',
        },
        texts: {
          pleaseWait: 'Please wait...',
          done: 'Done.',
          canceledTask: 'Task was canceled.',
          failedTask: 'Task failed.',
        },
      },
    },
  },
}))
