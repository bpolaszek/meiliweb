import { onBeforeRouteUpdate } from '#app'

import type { Ref } from 'vue'
import { useConfirmationDialog, type ConfirmationDialogOptions } from '~/stores'

type FormSubmitOptions = {
  confirm?: ConfirmationDialogOptions
}

export const useFormSubmit = (options: FormSubmitOptions = {}) => {
  const { confirm } = useConfirmationDialog()
  const loading = ref(false)
  const error: Ref<Error | string | null> = ref(null)
  const self = reactive({
    loading,
    error,
  })
  const handle = async (callback: Function, throwOnError: boolean = false) => {
    if (options.confirm && !(await confirm(options.confirm))) {
      return
    }

    self.loading = true
    self.error = null
    try {
      return await callback()
    } catch (e) {
      self.error = e as Error
      if (throwOnError) {
        throw e
      }
    } finally {
      self.loading = false
    }
  }

  onBeforeRouteUpdate(() => {
    self.error = null
  })

  return {
    loading,
    error,
    handle,
  }
}
