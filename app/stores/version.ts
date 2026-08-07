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
      // `this.version` is an asyncComputed: it is undefined until the first fetch resolves,
      // and semver.satisfies() throws on undefined. Treat "not known yet" as "not satisfied".
      const pkgVersion = unref(this.version)?.pkgVersion
      // Dev/RC builds report e.g. `1.52.0-rc.1`, which would not match `>=1.52.0` otherwise.
      return !!pkgVersion && semver.satisfies(pkgVersion, version, { includePrerelease: true })
    },
  },
})
