import { useToast } from '#imports'
import { defineStore } from 'pinia'
import { ulid } from 'ulid'
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

export type Toast = {
  id: string
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
  const nuxtToasts = useToast()

  // Adapt the historical toast options to Nuxt UI's toast props
  const toToastProps = (options: CreateToastOptions) => {
    const indefinite = 0 === (options.ttl ?? TOAST_DEFAULT_TTL)
    return {
      title: options.title,
      description: options.text,
      icon: options.icon,
      duration: indefinite ? Infinity : options.ttl ?? TOAST_DEFAULT_TTL,
      // An indefinite toast has no "time remaining" to show. Nuxt UI's toast progress bar
      // computes `remaining / duration`, which is `Infinity / Infinity` (NaN) once duration
      // is Infinity — disable it here rather than let it feed NaN into reka-ui's ProgressRoot.
      progress: !indefinite,
      close: options.dismissable ?? true,
      ui: {
        icon: ['size-6', ...(Array.isArray(options.iconClasses) ? options.iconClasses : [options.iconClasses ?? ''])]
          .join(' ')
          .trim(),
      },
    }
  }

  const createToast = (options: CreateToastOptions): Toast => {
    const id = ulid()
    const current: CreateToastOptions = { ...options }
    const toast: Toast = {
      id,
      spawn() {
        nuxtToasts.add({ id, ...toToastProps(current) })
      },
      destroy() {
        nuxtToasts.remove(id)
      },
      update(options: Partial<CreateToastOptions>) {
        Object.assign(current, options)
        nuxtToasts.update(id, toToastProps(current))
      },
    }
    if (options.immediate ?? true) {
      toast.spawn()
    }
    return toast
  }

  return {
    createToast,
  }
})
