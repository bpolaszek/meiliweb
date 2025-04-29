import { defineStore } from 'pinia'
import { ulid } from 'ulid'
import { toRef } from 'vue'
import { type I18nT } from '../utils'

type CreateToastOptions = {
  title: string
  text: string
  immediate?: boolean
  dismissable?: boolean
  icon?: string
  iconClasses?: string | Array<string>
  ttl?: number
}

export type Toast = CreateToastOptions & {
  id: string
  dismissable: boolean
  show: boolean
  spawn: () => void
  destroy: () => void
  update: (options: Partial<CreateToastOptions>) => void
}

export const TOAST_DEFAULT_TTL = 5000
export const TOAST_PLEASEWAIT = (t: I18nT) => ({
  text: t('toasts.texts.pleaseWait'),
  ttl: 0,
  icon: 'fluent:spinner-ios-16-filled',
  iconClasses: 'animate-spin',
})

export const TOAST_SUCCESS = (t: I18nT) => ({
  text: t('toasts.texts.done'),
  ttl: TOAST_DEFAULT_TTL,
  icon: 'lets-icons:check-fill',
  iconClasses: 'text-green-600',
})

export const TOAST_FAILURE = (t: I18nT) => ({
  title: t('toasts.titles.error'),
  ttl: TOAST_DEFAULT_TTL,
  icon: 'clarity:error-solid',
  iconClasses: 'text-red-600',
})

export const useToasts = defineStore('toasts', () => {
  const toasts: Map<string, Toast> = reactive(new Map())

  const createToast = (options: CreateToastOptions): Toast => {
    const id = ulid()
    const toast = reactive(
      Object.assign(options, {
        id,
        dismissable: options.dismissable ?? true,
        immediate: options.immediate ?? true,
        ttl: options.ttl ?? TOAST_DEFAULT_TTL,
        show: false,
        spawn() {
          this.show = true
        },
        destroy() {
          toasts.delete(id)
        },
        update(options: Partial<CreateToastOptions>) {
          Object.assign(this, options)
        },
      }),
    )
    toasts.set(id, toast)
    if (toast.immediate) {
      toast.spawn()
    }
    return toast
  }

  const self: any = reactive({
    toasts: computed(() => [...toasts].map(([id, toast]) => toast)),
    visibleToasts: computed(() => self.toasts.filter((toast: Toast) => toast.show)),
  })

  return {
    createToast,
    toasts: toRef(self, 'visibleToasts'),
  }
})
