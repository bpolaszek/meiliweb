<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div
      v-if="show"
      class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
      @mouseover="progressBarPaused = true"
      @mouseleave="progressBarPaused = false">
      <div class="p-4">
        <div class="flex items-start">
          <div v-if="toast.icon" class="flex-shrink-0">
            <Icon :name="toast.icon" class="size-6" aria-hidden="true" :class="toast.iconClasses" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">{{ toast.title }}</p>
            <p class="mt-1 text-sm text-gray-500 empty:hidden">
              {{ toast.text }}
            </p>
          </div>
          <div v-if="toast.dismissable" class="ml-4 flex flex-shrink-0">
            <button
              type="button"
              @click="destroy()"
              class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div class="relative pt-1">
        <div class="flex h-0.5 overflow-hidden text-xs">
          <div
            :style="{ width: progressBar + '%' }"
            class="flex flex-col justify-center whitespace-nowrap bg-gray-200 text-center text-white shadow-none"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { promiseTimeout, whenever } from '@vueuse/core'
import type { Toast } from '~/stores/toasts'

type Props = {
  toast: Toast
}
const props = defineProps<Props>()

const self = reactive({
  progressBar: 0,
  progressBarPaused: false,
  show: false,
})

const createProgressBar = (duration: number) => {
  const REFRESH_INTERVAL = 50
  self.progressBar = 100
  let remainingTime = duration
  const updateProgressBar = () => {
    if (false === self.progressBarPaused) {
      remainingTime -= REFRESH_INTERVAL
      self.progressBar = Math.floor((remainingTime / duration) * 100)
    }

    if (remainingTime >= 0) {
      setTimeout(() => updateProgressBar(), REFRESH_INTERVAL)
      return
    }
    self.progressBar = 0
    destroy()
  }
  updateProgressBar()
}

const destroy = async () => {
  self.show = false
  await promiseTimeout(300)
  props.toast.destroy()
}

const duration = computed(() => props.toast.ttl)
onMounted(() => {
  self.show = true
  whenever(duration, createProgressBar, { immediate: true })
})

const { show, progressBar, progressBarPaused } = toRefs(self)
</script>
