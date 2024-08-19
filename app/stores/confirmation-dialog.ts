import { defineStore } from 'pinia'
import type { Ref } from 'vue'

export type ConfirmationDialogOptions = {
  title?: string
  text?: string
  acceptCallback?: () => {}
  denyCallback?: () => {}
  denyButtonText?: string
  acceptButtonText?: string
  throw?: boolean
}

export type ConfirmationDialog = ConfirmationDialogOptions & {
  resolve: (value: boolean) => void
}

export class DismissedConfirmationDialog extends Error {
  constructor() {
    super('Confirmation dialog was dismissed.')
  }
}

export const useConfirmationDialog = defineStore('confirmation-dialog', () => {
  const confirmationDialog: Ref<ConfirmationDialog | null> = ref(null)

  const self = reactive({ confirmationDialog })

  const confirm = async (options: ConfirmationDialogOptions) =>
    new Promise((resolve, reject) => {
      self.confirmationDialog = {
        ...options,
        resolve(isAccepted: boolean) {
          if (!isAccepted && this.throw) {
            reject(new DismissedConfirmationDialog())
          } else {
            resolve(isAccepted)
          }
        },
      }
    })

  const clear = () => (self.confirmationDialog = null)

  return {
    confirmationDialog,
    confirm,
    clear,
  }
})
