import { asyncComputed } from '@vueuse/core'
import { defineStore } from 'pinia'
import semver from 'semver/preload'

export const useVersion = defineStore('version', {
  state: () => ({}),
  getters: {
    version: () => {
      const meili = useMeiliClient()
      return asyncComputed(() => meili.getVersion())
    },
  },
  actions: {
    satisfiesVersion(version: string) {
      return semver.satisfies(unref(this.version)?.pkgVersion, version)
    },
  },
})
